"use client";

import { useState } from "react";
import type { DashboardAnalytics } from "@/app/actions/analytics";
import OverviewTab from "./tabs/OverviewTab";
import OrdersTab from "./tabs/OrdersTab";
import AnalyticsTab from "./tabs/AnalyticsTab";
import CustomersTab from "./tabs/CustomersTab";
import {
  LayoutDashboard,
  ListOrdered,
  BarChart3,
  Users,
  ShieldCheck,
} from "lucide-react";

export type AdminOrder = {
  id: string;
  orderNumber: string;
  customerName: string;
  phoneNumber: string;
  state: string;
  city: string;
  pincode: string;
  rtcDepotCode: string | null;
  rtcDepotName: string | null;
  rtcLandmark: string;
  customerNotes: string | null;
  totalAmount: string | number;
  shippingFee: string | number;
  packingFee: string | number;
  status: string;
  paymentMethod: string;
  utr: string | null;
  utrSubmittedAt: string | null;
  paidAt: string | null;
  dispatchedAt: string | null;
  deliveredAt: string | null;
  cancelledAt: string | null;
  adminNotes: string | null;
  createdAt: string;
  updatedAt: string;
  items: {
    id: string;
    variety: string;
    quantityKg: number;
    priceAtPurchase: string | number;
  }[];
};

type Tab = "overview" | "orders" | "analytics" | "customers";

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "overview", label: "Overview", icon: <LayoutDashboard className="w-4 h-4" /> },
  { id: "orders", label: "Orders", icon: <ListOrdered className="w-4 h-4" /> },
  { id: "analytics", label: "Analytics", icon: <BarChart3 className="w-4 h-4" /> },
  { id: "customers", label: "Customers", icon: <Users className="w-4 h-4" /> },
];

export default function AdminDashboard({
  analytics,
  orders,
}: {
  analytics: DashboardAnalytics;
  orders: AdminOrder[];
}) {
  const [tab, setTab] = useState<Tab>("overview");

  const awaitingCount = orders.filter((o) => o.status === "PENDING_VERIFICATION").length;

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-6">
      <header className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-[family-name:var(--font-playfair)] font-bold text-brand-primary-green">
            Admin Dashboard
          </h1>
          <p className="text-brand-primary-green/60 mt-2 text-sm">
            Operations, sales, customers — everything Palle Mamidi at a glance.
          </p>
        </div>
        {awaitingCount > 0 && (
          <button
            onClick={() => setTab("orders")}
            className="bg-blue-50 border border-blue-200 px-4 py-2.5 rounded-xl font-bold text-blue-900 hover:bg-blue-100 transition flex items-center gap-2 text-sm cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4" /> {awaitingCount} UTR{awaitingCount === 1 ? "" : "s"} awaiting verification
          </button>
        )}
      </header>

      {/* Tab strip */}
      <div className="bg-white rounded-2xl p-1.5 border border-brand-primary-green/10 inline-flex gap-1 sticky top-2 z-20 shadow-sm">
        {TABS.map((t) => {
          const active = t.id === tab;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition flex items-center gap-2 cursor-pointer ${
                active
                  ? "bg-brand-primary-green text-brand-cream shadow"
                  : "text-brand-primary-green/70 hover:bg-brand-primary-green/5"
              }`}
            >
              {t.icon}
              <span>{t.label}</span>
              {t.id === "orders" && awaitingCount > 0 && (
                <span
                  className={`text-[10px] rounded-full px-2 py-0.5 font-bold ${
                    active ? "bg-brand-cream/20 text-brand-cream" : "bg-blue-100 text-blue-900"
                  }`}
                >
                  {awaitingCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {tab === "overview" && <OverviewTab analytics={analytics} orders={orders} onJumpToOrders={() => setTab("orders")} />}
      {tab === "orders" && <OrdersTab orders={orders} />}
      {tab === "analytics" && <AnalyticsTab analytics={analytics} />}
      {tab === "customers" && <CustomersTab analytics={analytics} orders={orders} />}
    </div>
  );
}
