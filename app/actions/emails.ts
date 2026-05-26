"use server";

import { db } from "@/db/index";
import { checkoutEvents, orders, orderItems } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { headers } from "next/headers";
import { calculateLeadScore } from "../lib/lead-score";
import { shouldSendEmail, generateCartHash } from "../lib/dedupe";
import { sendSmartMail } from "../lib/mail";
import { renderWarmLeadTemplate } from "../lib/email-templates/warm-lead";
import { renderHotLeadTemplate } from "../lib/email-templates/hot-lead";
import { renderPaymentSubmittedTemplate } from "../lib/email-templates/payment-submitted";
import { calculateShippingFee, calculatePackingFee } from "../lib/shipping";

export interface CheckoutEventPayload {
  sessionId: string;
  customerName?: string;
  phone?: string;
  email?: string;
  state?: string;
  city?: string;
  pincode?: string;
  rtcDepotCode?: string;
  rtcDepotName?: string;
  rtcLandmark?: string;
  customerNotes?: string;
  cartItems: { variety: string; weightKg: number; quantity: number; price?: number }[];
  eventType: "CHECKOUT_STARTED" | "PAYMENT_INTENT" | "PAYMENT_SUBMITTED";
  utr?: string;
  orderNumber?: string;
  orderId?: string;
}

export async function recordCheckoutEventAction(payload: CheckoutEventPayload) {
  try {
    const {
      sessionId,
      customerName = "",
      phone = "",
      email = "",
      state = "",
      city = "",
      pincode = "",
      rtcDepotCode = "",
      rtcDepotName = "",
      rtcLandmark = "",
      customerNotes = "",
      cartItems = [],
      eventType,
      utr = "",
      orderNumber = "",
      orderId = "",
    } = payload;

    if (!sessionId) {
      return { success: false, error: "Session ID is required" };
    }

    // 1. Get Client IP Address safely
    let ipAddress = "unknown";
    try {
      const headerList = await headers();
      ipAddress = headerList.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    } catch (e) {
      console.warn("[recordCheckoutEventAction] Failed to retrieve request headers", e);
    }

    // 2. Generate cart details summary and hash
    const cartHash = generateCartHash(cartItems);
    const cartJson = JSON.stringify(cartItems);

    // Construct address block
    const addressLines = [
      city ? `City: ${city}` : "",
      state ? `State: ${state}` : "",
      pincode ? `PIN: ${pincode}` : "",
      rtcDepotName ? `Depot: ${rtcDepotName}` : "",
      rtcLandmark ? `Landmark: ${rtcLandmark}` : ""
    ].filter(Boolean).join(" | ");

    // 3. Create the Database Record (initially emailSent = false)
    const [insertedEvent] = await db
      .insert(checkoutEvents)
      .values({
        sessionId,
        customerName: customerName || null,
        phone: phone || null,
        email: email || null,
        address: addressLines || null,
        cartJson,
        cartHash,
        eventType,
        emailSent: false,
        ipAddress,
      })
      .returning();

    // 4. Calculate Lead Score
    const { score, badge, color } = calculateLeadScore({
      phone,
      customerName,
      city,
      state,
      rtcDepotCode,
      rtcLandmark,
      eventType,
    });

    // 5. Evaluate Anti-Spam / Deduplication Rules
    // Only verify if we have enough info (needs at least phone number to dedupe)
    if (!phone || phone.trim().length < 10) {
      return {
        success: true,
        eventId: insertedEvent.id,
        emailSent: false,
        message: "Logged to DB. Email skipped (no valid phone number provided yet).",
      };
    }

    const dedupeCheck = await shouldSendEmail({
      phone,
      sessionId,
      cartHash,
      eventType,
    });

    if (!dedupeCheck.shouldSend) {
      console.log(`[CheckoutEvent] Deduplication match for phone ${phone}: ${dedupeCheck.reason}`);
      return {
        success: true,
        eventId: insertedEvent.id,
        emailSent: false,
        message: `Logged to DB. Email skipped: ${dedupeCheck.reason}`,
      };
    }

    // 6. Send the Appropriate Email
    let subject = "";
    let htmlContentBlocks = "";
    let badgeText = "";
    let badgeBgColor = color;
    let priorityText: "MEDIUM" | "HIGH" = "MEDIUM";
    let priorityColor = color;
    let totalCartVal = cartItems.reduce(
      (sum, item) => sum + (item.price || 0) * item.weightKg * item.quantity,
      0
    );

    const nowFormatted = new Date().toLocaleString("en-US", {
      timeZone: "Asia/Kolkata",
      dateStyle: "medium",
      timeStyle: "short",
    }) + " (IST)";

    const totalWeight = cartItems.reduce(
      (sum, item) => sum + item.weightKg * item.quantity,
      0
    );

    let shippingFee = 0;
    let packingFee = 0;
    let totalWithFees = totalCartVal;

    if (eventType === "PAYMENT_SUBMITTED" && orderId) {
      const order = await db.query.orders.findFirst({
        where: eq(orders.id, orderId)
      });
      if (order) {
        shippingFee = parseFloat(order.shippingFee);
        packingFee = parseFloat(order.packingFee);
        totalWithFees = parseFloat(order.totalAmount);
      } else {
        shippingFee = (state && city) ? calculateShippingFee(state, city, totalWeight) : 0;
        packingFee = calculatePackingFee(totalWeight);
        totalWithFees = totalCartVal + shippingFee + packingFee;
      }
    } else {
      shippingFee = (state && city) ? calculateShippingFee(state, city, totalWeight) : 0;
      packingFee = calculatePackingFee(totalWeight);
      totalWithFees = totalCartVal + shippingFee + packingFee;
    }

    if (eventType === "CHECKOUT_STARTED") {
      subject = `🟡 Warm Lead — ${customerName || "Customer"} left checkout`;
      badgeText = "WARM LEAD";
      priorityText = "MEDIUM";

      htmlContentBlocks = renderWarmLeadTemplate({
        customerName,
        phone,
        state,
        city,
        cartSummary: cartItems,
        totalAmount: totalWithFees,
        shippingFee,
        packingFee,
        scoreBadge: badge,
        score,
        timestamp: nowFormatted,
      });
    } else if (eventType === "PAYMENT_INTENT") {
      subject = `🟠 Hot Lead — ${customerName || "Customer"} reached payment step`;
      badgeText = "HOT LEAD";
      priorityText = "HIGH";

      htmlContentBlocks = renderHotLeadTemplate({
        customerName,
        phone,
        state,
        city,
        pincode,
        rtcDepotName,
        rtcLandmark,
        customerNotes,
        cartSummary: cartItems,
        totalAmount: totalWithFees,
        shippingFee,
        packingFee,
        scoreBadge: badge,
        score,
        timestamp: nowFormatted,
      });
    } else if (eventType === "PAYMENT_SUBMITTED") {
      subject = `🟢 Payment Submitted — Order #${orderNumber || "PM-NEW"}`;
      badgeText = "PAYMENT SUBMITTED";
      priorityText = "HIGH";

      htmlContentBlocks = renderPaymentSubmittedTemplate({
        orderNumber,
        orderId,
        customerName,
        phone,
        state,
        city,
        pincode,
        rtcDepotName,
        rtcLandmark,
        customerNotes,
        utr,
        submittedAt: nowFormatted,
        cartSummary: cartItems,
        totalAmount: totalWithFees,
        shippingFee,
        packingFee,
        scoreBadge: badge,
        score,
        timestamp: nowFormatted,
      });
    }

    const cleanPhoneForCall = phone.replace(/\D/g, "");
    const mailResult = await sendSmartMail({
      to: process.env.CONTACT_RECEIVER_EMAIL || "pallemamidi@gmail.com",
      subject,
      badgeText,
      badgeBgColor,
      priorityText,
      priorityColor,
      htmlContentBlocks,
      phoneToCall: eventType !== "PAYMENT_SUBMITTED" ? cleanPhoneForCall : undefined,
      actionsHtml: eventType === "PAYMENT_SUBMITTED"
        ? `
          <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://pallemamidi.vercel.app"}/admin" class="btn btn-green" style="background-color: #2E7D32;">
            ✅ VERIFY PAYMENT IN ADMIN PANEL
          </a>
          <a href="tel:${cleanPhoneForCall}" class="btn btn-orange" style="background-color: #DE8A24; color: #ffffff;">
            📞 CALL CUSTOMER (${phone})
          </a>
        `
        : `
          <a href="tel:${cleanPhoneForCall}" class="btn btn-green" style="background-color: #2E7D32;">
            📞 CALL NOW (${phone})
          </a>
          <a href="https://wa.me/91${cleanPhoneForCall.slice(-10)}" class="btn btn-orange" style="background-color: #DE8A24; color: #ffffff;">
            💬 WHATSAPP CHAT
          </a>
        `
    });

    if (mailResult.success) {
      // Update emailSent = true in database
      await db
        .update(checkoutEvents)
        .set({ emailSent: true })
        .where(eq(checkoutEvents.id, insertedEvent.id));

      return { success: true, eventId: insertedEvent.id, emailSent: true };
    } else {
      return {
        success: true,
        eventId: insertedEvent.id,
        emailSent: false,
        error: `Database logged but email delivery failed: ${mailResult.error}`,
      };
    }
  } catch (error) {
    console.error("[recordCheckoutEventAction] Critical Error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Internal Server Error" };
  }
}

/**
 * Triggers a payment submitted email from the orders page flow
 */
export async function triggerPaymentSubmittedEmail(orderId: string, utr: string) {
  try {
    // 1. Fetch order details from database
    const order = await db.query.orders.findFirst({
      where: eq(orders.id, orderId),
      with: { items: true },
    });

    if (!order) {
      return { success: false, error: "Order not found" };
    }

    // Convert items format to match email templating schema
    const formattedCartItems = order.items.map((item) => ({
      variety: item.variety,
      quantity: 1,
      weightKg: item.quantityKg,
      price: parseFloat(item.priceAtPurchase),
    }));

    // Record checkout event action
    const result = await recordCheckoutEventAction({
      sessionId: `order-flow-${orderId}`,
      customerName: order.customerName,
      phone: order.phoneNumber,
      state: order.state,
      city: order.city,
      pincode: order.pincode,
      rtcDepotName: order.rtcDepotName || undefined,
      rtcLandmark: order.rtcLandmark,
      customerNotes: order.customerNotes || undefined,
      cartItems: formattedCartItems,
      eventType: "PAYMENT_SUBMITTED",
      utr,
      orderNumber: order.orderNumber,
      orderId: order.id,
    });

    return result;
  } catch (error) {
    console.error("[triggerPaymentSubmittedEmail] Failed:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}
