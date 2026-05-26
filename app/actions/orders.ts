"use server";

import { z } from "zod";
import { db } from "@/db/index";
import { orders, orderItems } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { findVarietyByName } from "@/app/lib/catalog";
import { buildUpiLink, getUpiConfig, generateOrderNumber, isValidUtr } from "@/app/lib/upi";
import { generateQrSvgDataUrl } from "@/app/lib/qr";

import { revalidatePath } from "next/cache";
import { calculateShippingFee, calculatePackingFee } from "@/app/lib/shipping";
import { neon } from "@neondatabase/serverless";

const CartLineSchema = z.object({
  variety: z.string().trim().min(1).max(80),
  weightKg: z.number().int().positive(),
  quantity: z.number().int().positive().max(50),
});

const CreateOrderInputSchema = z.object({
  customerName: z.string().trim().min(2, "Name must be at least 2 characters").max(120),
  phoneNumber: z.string().trim().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number"),
  state: z.string().trim().min(2, "State is required").max(80),
  city: z.string().trim().min(2, "City is required").max(120),
  pincode: z.string().regex(/^\d{6}$/, "Pincode must be exactly 6 digits"),
  rtcDepotName: z.string().trim().min(2, "Please enter your nearest RTC bus depot").max(200),
  rtcLandmark: z.string().trim().min(3, "RTC/Cargo landmark is required").max(500),
  customerNotes: z.string().trim().max(500).optional().nullable(),
  items: z.array(CartLineSchema).min(1, "Cart is empty").max(20),
});

export type CreateOrderInput = z.infer<typeof CreateOrderInputSchema>;

export type SubmitOrderResult =
  | {
      success: true;
      orderId: string;
      orderNumber: string;
      totalAmount: number;
      upiLink: string;
      upiVpa: string;
      upiPayeeName: string;
      qrImage: string;        // dynamic UPI QR (data URL) — embeds amount + ref
      qrFallbackImage: string; // static farm QR from /public for backup
    }
  | { success: false; error: string };

export async function submitOrder(input: CreateOrderInput): Promise<SubmitOrderResult> {
  try {
    const validated = CreateOrderInputSchema.parse(input);

    // Server-authoritative price + stock check from DB. Client prices are ignored.
    let totalAmount = 0;
    let totalWeight = 0;
    const itemsData: { variety: string; quantityKg: number; priceAtPurchase: string }[] = [];

    for (const line of validated.items) {
      const entry = await findVarietyByName(line.variety);
      if (!entry) {
        return { success: false, error: `${line.variety} is no longer available.` };
      }
      if (entry.status !== "AVAILABLE" && entry.status !== "PREBOOKING") {
        return { success: false, error: `${entry.name} is currently sold out or out of season.` };
      }
      const baseWeights = entry.allowedWeightsKg.filter(x => x !== 1);
      const isWeightValid = line.weightKg > 1 && Number.isInteger(line.weightKg) && (
        baseWeights.length === 0 || baseWeights.some(a => (line.weightKg - a) >= 0 && (line.weightKg - a) % 10 === 0)
      );
      if (!isWeightValid) {
        return { success: false, error: `${entry.name}: ${line.weightKg}kg box is not available.` };
      }
      const kg = line.weightKg * line.quantity;
      totalWeight += kg;
      totalAmount += entry.pricePerKg * kg;
      itemsData.push({
        variety: entry.name,
        quantityKg: kg,
        priceAtPurchase: entry.pricePerKg.toFixed(2),
      });
    }

    if (totalWeight < 10) {
      return { success: false, error: `Minimum order requirement is 10 kg. Your order has only ${totalWeight} kg.` };
    }

    if (totalAmount < 1) {
      return { success: false, error: "Order total must be at least ₹1." };
    }

    // Ensure table columns exist in Neon database (failsafe for sandbox push blockers)
    try {
      const dbUrl = process.env.DATABASE_URL!;
      const migrationSql = neon(dbUrl);
      await migrationSql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_fee numeric(10, 2) NOT NULL DEFAULT '0.00';`;
      await migrationSql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS packing_fee numeric(10, 2) NOT NULL DEFAULT '0.00';`;
    } catch (e) {
      console.warn("Failsafe column migration warning:", e);
    }

    const shippingFee = calculateShippingFee(validated.state, validated.city, totalWeight);
    const packingFee = calculatePackingFee(totalWeight);
    const totalAmountWithFees = totalAmount + shippingFee + packingFee;

    const depotName = validated.rtcDepotName;

    const upi = getUpiConfig();
    const orderNumber = generateOrderNumber();

    const [created] = await db.insert(orders).values({
      orderNumber,
      customerName: validated.customerName,
      phoneNumber: validated.phoneNumber,
      state: validated.state,
      city: validated.city,
      pincode: validated.pincode,
      rtcDepotCode: null,
      rtcDepotName: depotName,
      rtcLandmark: validated.rtcLandmark,
      customerNotes: validated.customerNotes || null,
      totalAmount: totalAmountWithFees.toFixed(2),
      shippingFee: shippingFee.toFixed(2),
      packingFee: packingFee.toFixed(2),
      status: "PENDING",
      paymentMethod: "UPI",
    }).returning();

    await db.insert(orderItems).values(
      itemsData.map((i) => ({ ...i, orderId: created.id }))
    );

    const newOrder = created;

    const upiLink = buildUpiLink({
      payeeVpa: upi.vpa,
      payeeName: upi.name,
      amount: totalAmountWithFees,
      transactionRef: orderNumber,
      note: `Mangoes ${orderNumber}`,
    });

    // Dynamic QR encodes the FULL deep link including the exact amount, so the
    // customer's UPI app opens with the price pre-filled — no typos possible.
    const qrImage = await generateQrSvgDataUrl(upiLink);

    return {
      success: true,
      orderId: newOrder.id,
      orderNumber,
      totalAmount: totalAmountWithFees,
      upiLink,
      upiVpa: upi.vpa,
      upiPayeeName: upi.name,
      qrImage,
      qrFallbackImage: upi.qrImage,
    };
  } catch (error) {
    console.error("submitOrder failed:", error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues.map((i) => i.message).join(", ") };
    }
    if (error instanceof Error && error.message.includes("UPI_VPA")) {
      return { success: false, error: "Payment system is not configured. Please contact the farm." };
    }
    return { success: false, error: "An unexpected error occurred. Please try again." };
  }
}

const UtrSchema = z.object({
  orderId: z.string().uuid("Invalid order reference"),
  phoneNumber: z.string().regex(/^[6-9]\d{9}$/, "Invalid phone number"),
  utr: z.string().trim(),
});

export async function submitUtr(input: { orderId: string; phoneNumber: string; utr: string }) {
  try {
    const parsed = UtrSchema.parse(input);
    const utr = parsed.utr.replace(/\s+/g, "");

    if (!isValidUtr(utr)) {
      return { success: false, error: "UTR must be exactly 12 digits. Check your UPI app's transaction reference." };
    }

    // Perform update in a single atomic SQL transaction to prevent status-transition race conditions (TOCTOU)
    const updated = await db.update(orders)
      .set({
        utr,
        utrSubmittedAt: new Date(),
        status: "PENDING_VERIFICATION",
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(orders.id, parsed.orderId),
          eq(orders.phoneNumber, parsed.phoneNumber),
          eq(orders.status, "PENDING")
        )
      )
      .returning();

    if (updated.length === 0) {
      // Fallback query to provide detailed context-aware user feedback on why the update failed
      const existing = await db.query.orders.findFirst({
        where: and(eq(orders.id, parsed.orderId), eq(orders.phoneNumber, parsed.phoneNumber)),
      });

      if (!existing) {
        return { success: false, error: "Order not found. Double-check your details." };
      }
      if (existing.status === "PENDING_VERIFICATION") {
        return { success: true }; // Already submitted, handle idempotently
      }
      if (existing.status === "PAID" || existing.status === "DISPATCHED" || existing.status === "DELIVERED") {
        return { success: false, error: "This order is already marked paid. No further action needed." };
      }
      if (existing.status === "CANCELLED") {
        return { success: false, error: "This order was cancelled and cannot accept a payment reference." };
      }
      return { success: false, error: "Invalid order status transition." };
    }

    revalidatePath("/admin");
    revalidatePath(`/track`);

    // Trigger Payment Submitted email notification
    try {
      const { triggerPaymentSubmittedEmail } = await import("./emails");
      await triggerPaymentSubmittedEmail(parsed.orderId, utr);
    } catch (err) {
      console.error("Failed to trigger Payment Submitted email in submitUtr action:", err);
    }

    return { success: true };
  } catch (error) {
    console.error("submitUtr failed:", error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues.map((i) => i.message).join(", ") };
    }
    return { success: false, error: "Failed to record UTR. Please try again." };
  }
}

export async function getOrderForCustomer(orderId: string, phoneNumber: string) {
  if (!/^[0-9a-f-]{36}$/i.test(orderId)) return null;
  if (!/^[6-9]\d{9}$/.test(phoneNumber)) return null;

  return await db.query.orders.findFirst({
    where: and(eq(orders.id, orderId), eq(orders.phoneNumber, phoneNumber)),
    with: { items: true },
  });
}

export async function trackByPhone(phoneNumber: string) {
  if (!/^[6-9]\d{9}$/.test(phoneNumber)) return [];
  return await db.query.orders.findMany({
    where: eq(orders.phoneNumber, phoneNumber),
    with: { items: true },
    orderBy: (o, { desc }) => [desc(o.createdAt)],
    limit: 20,
  });
}
