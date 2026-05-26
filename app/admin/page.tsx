import { db } from "@/db/index";
import { orders } from "@/db/schema";
import { desc } from "drizzle-orm";
import { getDashboardAnalytics } from "@/app/actions/analytics";
import AdminDashboard, { type AdminOrder } from "./AdminDashboard";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const [allOrders, analytics] = await Promise.all([
    db.query.orders.findMany({
      with: { items: true },
      orderBy: [desc(orders.createdAt)],
    }),
    getDashboardAnalytics(),
  ]);

  // Serialize Date → string so the client component receives plain JSON
  const serialized: AdminOrder[] = allOrders.map((o) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    customerName: o.customerName,
    phoneNumber: o.phoneNumber,
    state: o.state,
    city: o.city,
    pincode: o.pincode,
    rtcDepotCode: o.rtcDepotCode,
    rtcDepotName: o.rtcDepotName,
    rtcLandmark: o.rtcLandmark,
    customerNotes: o.customerNotes,
    totalAmount: o.totalAmount,
    shippingFee: o.shippingFee,
    packingFee: o.packingFee,
    status: o.status,
    paymentMethod: o.paymentMethod,
    utr: o.utr,
    utrSubmittedAt: o.utrSubmittedAt ? o.utrSubmittedAt.toISOString() : null,
    paidAt: o.paidAt ? o.paidAt.toISOString() : null,
    dispatchedAt: o.dispatchedAt ? o.dispatchedAt.toISOString() : null,
    deliveredAt: o.deliveredAt ? o.deliveredAt.toISOString() : null,
    cancelledAt: o.cancelledAt ? o.cancelledAt.toISOString() : null,
    adminNotes: o.adminNotes,
    createdAt: o.createdAt.toISOString(),
    updatedAt: o.updatedAt.toISOString(),
    items: o.items.map((it) => ({
      id: it.id,
      variety: it.variety,
      quantityKg: it.quantityKg,
      priceAtPurchase: it.priceAtPurchase,
    })),
  }));

  return <AdminDashboard analytics={analytics} orders={serialized} />;
}
