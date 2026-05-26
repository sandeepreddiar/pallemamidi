"use client";

import { useMemo, useState } from "react";
import type { AdminOrder } from "../AdminDashboard";
import { fmtRupees, fmtDateTime, STATUS_COLOR } from "./format";
import StatusUpdater from "../StatusUpdater";
import type { OrderStatus } from "@/db/schema";
import {
  Search,
  Download,
  Phone,
  MapPin,
  Hash,
  ShieldCheck,
  Truck,
  ChevronDown,
  ChevronUp,
  Package,
} from "lucide-react";

const STATUSES = [
  "ALL",
  "PENDING",
  "PENDING_VERIFICATION",
  "PAID",
  "DISPATCHED",
  "DELIVERED",
  "CANCELLED",
] as const;
type StatusFilter = (typeof STATUSES)[number];

type SortKey = "newest" | "oldest" | "amount-desc" | "amount-asc";

export default function OrdersTab({ orders }: { orders: AdminOrder[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("ALL");
  const [sort, setSort] = useState<SortKey>("newest");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = orders.filter((o) => {
      if (status !== "ALL" && o.status !== status) return false;
      if (!q) return true;
      return (
        o.orderNumber.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.phoneNumber.includes(q) ||
        (o.utr || "").toLowerCase().includes(q) ||
        o.city.toLowerCase().includes(q) ||
        o.state.toLowerCase().includes(q)
      );
    });
    list = list.slice().sort((a, b) => {
      switch (sort) {
        case "newest":
          return +new Date(b.createdAt) - +new Date(a.createdAt);
        case "oldest":
          return +new Date(a.createdAt) - +new Date(b.createdAt);
        case "amount-desc":
          return Number(b.totalAmount) - Number(a.totalAmount);
        case "amount-asc":
          return Number(a.totalAmount) - Number(b.totalAmount);
      }
    });
    return list;
  }, [orders, query, status, sort]);

  const counts = useMemo(() => {
    const map: Record<string, number> = { ALL: orders.length };
    for (const o of orders) map[o.status] = (map[o.status] || 0) + 1;
    return map;
  }, [orders]);

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function exportCsv() {
    const headers = [
      "Order #",
      "Date",
      "Status",
      "Customer",
      "Phone",
      "City",
      "State",
      "Pincode",
      "RTC Depot",
      "Landmark",
      "UTR",
      "Total (₹)",
      "Items",
    ];
    const rows = filtered.map((o) => [
      o.orderNumber,
      new Date(o.createdAt).toISOString(),
      o.status,
      o.customerName,
      o.phoneNumber,
      o.city,
      o.state,
      o.pincode,
      o.rtcDepotName || "",
      o.rtcLandmark.replace(/\n/g, " "),
      o.utr || "",
      String(o.totalAmount),
      o.items.map((it) => `${it.variety} x ${it.quantityKg}kg @ ₹${it.priceAtPurchase}`).join(" | "),
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pallemamidi-orders-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="bg-white rounded-2xl p-4 border border-brand-primary-green/5 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-brand-primary-green/40" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by order #, name, phone, UTR, city…"
              className="w-full pl-9 pr-3 py-2.5 bg-brand-cream/40 rounded-xl border border-transparent focus:border-brand-primary-green/30 focus:bg-white outline-none text-sm font-medium text-brand-primary-green placeholder:text-brand-primary-green/40"
            />
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="px-3 py-2.5 bg-brand-cream/40 rounded-xl border border-transparent text-sm font-bold text-brand-primary-green cursor-pointer outline-none focus:border-brand-primary-green/30 focus:bg-white"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="amount-desc">Amount: high → low</option>
            <option value="amount-asc">Amount: low → high</option>
          </select>
          <button
            onClick={exportCsv}
            className="px-4 py-2.5 bg-brand-primary-green text-brand-cream rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-brand-primary-green/90 transition cursor-pointer"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {STATUSES.map((s) => {
            const active = s === status;
            const n = counts[s] || 0;
            const c = s === "ALL" ? null : STATUS_COLOR[s];
            return (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={`text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg flex items-center gap-2 transition cursor-pointer ${
                  active
                    ? "bg-brand-primary-green text-brand-cream"
                    : c
                    ? `${c.bg} ${c.text} hover:opacity-80`
                    : "bg-brand-cream/40 text-brand-primary-green/70 hover:bg-brand-primary-green/5"
                }`}
              >
                {s.replace(/_/g, " ")}
                <span className={`text-[10px] rounded-full px-1.5 py-0.5 ${active ? "bg-brand-cream/20" : "bg-black/5"}`}>
                  {n}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Count summary */}
      <p className="text-xs text-brand-primary-green/50 font-bold uppercase tracking-wider px-2">
        Showing {filtered.length} of {orders.length} orders
      </p>

      {/* Order list */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-brand-primary-green/5">
          <Package className="w-12 h-12 text-brand-primary-green/20 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-brand-primary-green">No orders match your filters</h3>
          <p className="text-sm text-brand-primary-green/50 mt-1">Try clearing the search or status filter.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((o) => (
            <OrderRow key={o.id} order={o} expanded={expanded.has(o.id)} onToggle={() => toggle(o.id)} />
          ))}
        </div>
      )}
    </div>
  );
}

function OrderRow({
  order,
  expanded,
  onToggle,
}: {
  order: AdminOrder;
  expanded: boolean;
  onToggle: () => void;
}) {
  const c = STATUS_COLOR[order.status];
  const highlight = order.status === "PENDING_VERIFICATION";

  return (
    <div
      className={`bg-white rounded-2xl border transition ${
        highlight ? "border-blue-200 ring-1 ring-blue-100" : "border-brand-primary-green/5"
      }`}
    >
      <button
        onClick={onToggle}
        className="w-full p-4 md:p-5 flex flex-wrap items-center gap-3 text-left cursor-pointer hover:bg-brand-cream/20 rounded-2xl transition"
      >
        <span className={`w-2.5 h-2.5 rounded-full ${c.dot} shrink-0`} />
        <div className="flex-1 min-w-[160px]">
          <p className="font-bold text-brand-primary-green flex items-center gap-2">
            {order.customerName}
            {order.utr && order.status === "PENDING_VERIFICATION" && (
              <ShieldCheck className="w-4 h-4 text-blue-500" />
            )}
          </p>
          <p className="text-[11px] font-mono text-brand-primary-green/50 flex items-center gap-1">
            <Hash className="w-3 h-3" /> {order.orderNumber}
          </p>
        </div>
        <div className="text-xs text-brand-primary-green/70 hidden md:flex items-center gap-1">
          <Phone className="w-3 h-3" /> {order.phoneNumber}
        </div>
        <div className="text-xs text-brand-primary-green/70 hidden lg:flex items-center gap-1 max-w-[180px] truncate">
          <MapPin className="w-3 h-3" /> {order.city}, {order.state}
        </div>
        <span className={`text-[10px] font-bold uppercase tracking-wider ${c.bg} ${c.text} px-2 py-1 rounded-md`}>
          {order.status.replace(/_/g, " ")}
        </span>
        <span className="font-bold text-brand-primary-green tabular-nums min-w-[80px] text-right">
          {fmtRupees(Number(order.totalAmount))}
        </span>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-brand-primary-green/50" />
        ) : (
          <ChevronDown className="w-4 h-4 text-brand-primary-green/50" />
        )}
      </button>

      {expanded && (
        <div className="px-4 md:px-5 pb-5 border-t border-brand-primary-green/5 pt-4 grid lg:grid-cols-2 gap-5">
          <div className="space-y-3">
            {order.utr && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                <p className="text-[10px] uppercase font-bold text-blue-900/60">UTR (verify in bank app)</p>
                <p className="font-mono font-bold text-blue-900 text-base tracking-widest">{order.utr}</p>
                {order.utrSubmittedAt && (
                  <p className="text-[10px] text-blue-900/60 mt-0.5">
                    Submitted {fmtDateTime(order.utrSubmittedAt)}
                  </p>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 text-sm bg-brand-cream/30 p-3 rounded-xl">
              <div>
                <p className="text-[10px] uppercase font-bold text-brand-primary-green/40">Phone</p>
                <a href={`tel:${order.phoneNumber}`} className="font-semibold text-brand-primary-green">
                  {order.phoneNumber}
                </a>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-brand-primary-green/40">Placed</p>
                <p className="font-semibold text-brand-primary-green">{fmtDateTime(order.createdAt)}</p>
              </div>
              <div className="col-span-2">
                <p className="text-[10px] uppercase font-bold text-brand-primary-green/40">Address</p>
                <p className="font-semibold text-brand-primary-green">
                  {order.city}, {order.state} - {order.pincode}
                </p>
              </div>
              {order.rtcDepotName && (
                <div className="col-span-2 bg-brand-primary-green/5 p-2 rounded-lg">
                  <p className="text-[10px] uppercase font-bold text-brand-primary-green/40 flex items-center gap-1">
                    <Truck className="w-3 h-3" /> RTC Depot
                  </p>
                  <p className="font-bold text-brand-primary-green text-sm">{order.rtcDepotName}</p>
                </div>
              )}
              <div className="col-span-2">
                <p className="text-[10px] uppercase font-bold text-brand-primary-green/40">Landmark / Note</p>
                <p className="font-semibold text-brand-primary-green text-sm">{order.rtcLandmark}</p>
              </div>
              {order.customerNotes && (
                <div className="col-span-2 bg-yellow-50 p-2 rounded-lg border border-yellow-100">
                  <p className="text-[10px] uppercase font-bold text-yellow-800/60">Customer Notes</p>
                  <p className="font-medium text-yellow-900 text-sm">{order.customerNotes}</p>
                </div>
              )}
            </div>

            <Timeline order={order} />
          </div>

          <div className="space-y-3">
            <div className="bg-brand-primary-green/5 rounded-xl p-4 border border-brand-primary-green/10">
              <h4 className="text-[10px] uppercase font-bold text-brand-primary-green/60 mb-3 tracking-wider">
                Order Items
              </h4>
              <div className="space-y-2">
                {order.items.map((item) => (
                  <div key={item.id} className="flex justify-between items-center text-sm">
                    <span className="font-semibold text-brand-primary-green">{item.variety}</span>
                    <div className="text-right">
                      <span className="block font-bold text-brand-primary-green">{item.quantityKg} kg</span>
                      <span className="text-[10px] text-brand-primary-green/60">@ ₹{item.priceAtPurchase}/kg</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-brand-primary-green/10 space-y-1.5 text-xs text-brand-primary-green/75">
                <div className="flex justify-between items-center">
                  <span>Subtotal</span>
                  <span className="font-semibold tabular-nums">₹{(Number(order.totalAmount) - Number(order.shippingFee) - Number(order.packingFee)).toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Packing Fee</span>
                  <span className="font-semibold tabular-nums">₹{Number(order.packingFee).toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>RTC Cargo Shipping</span>
                  <span className="font-semibold tabular-nums">₹{Number(order.shippingFee).toLocaleString("en-IN")}</span>
                </div>
                <div className="pt-2 border-t border-brand-primary-green/10 flex justify-between items-center text-brand-primary-green">
                  <span className="text-xs font-bold uppercase">Total</span>
                  <span className="text-xl font-[family-name:var(--font-playfair)] font-bold tabular-nums">
                    ₹{Number(order.totalAmount).toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 border border-brand-primary-green/10">
              <h4 className="text-[10px] uppercase font-bold text-brand-primary-green/60 tracking-wider">
                Update Status
              </h4>
              <StatusUpdater orderId={order.id} currentStatus={order.status as OrderStatus} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Timeline({ order }: { order: AdminOrder }) {
  const steps: { label: string; at: string | null; done: boolean }[] = [
    { label: "Placed", at: order.createdAt, done: true },
    { label: "UTR submitted", at: order.utrSubmittedAt, done: !!order.utrSubmittedAt },
    { label: "Paid / verified", at: order.paidAt, done: !!order.paidAt },
    { label: "Dispatched", at: order.dispatchedAt, done: !!order.dispatchedAt },
    { label: "Delivered", at: order.deliveredAt, done: !!order.deliveredAt },
  ];
  if (order.cancelledAt) steps.push({ label: "Cancelled", at: order.cancelledAt, done: true });

  return (
    <div className="bg-white border border-brand-primary-green/5 rounded-xl p-3">
      <p className="text-[10px] uppercase font-bold text-brand-primary-green/40 mb-2 tracking-wider">Timeline</p>
      <ol className="space-y-1.5">
        {steps.map((s, i) => (
          <li key={i} className="flex items-center gap-2 text-xs">
            <span
              className={`w-2 h-2 rounded-full ${
                s.done ? "bg-brand-primary-green" : "bg-brand-primary-green/15"
              }`}
            />
            <span className={s.done ? "font-bold text-brand-primary-green" : "text-brand-primary-green/40"}>
              {s.label}
            </span>
            {s.at && <span className="text-brand-primary-green/50">· {fmtDateTime(s.at)}</span>}
          </li>
        ))}
      </ol>
    </div>
  );
}
