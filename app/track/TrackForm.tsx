"use client";

import { useState, useTransition, useEffect } from "react";
import { trackByPhone } from "@/app/actions/orders";
import { Search, Clock, CreditCard, CheckCircle2, Truck, XCircle, Package, ShieldCheck } from "lucide-react";

type TrackedOrder = Awaited<ReturnType<typeof trackByPhone>>[number];

const TIMELINE: { key: string; label: string; icon: any }[] = [
  { key: "PENDING", label: "Order Placed", icon: Clock },
  { key: "PENDING_VERIFICATION", label: "Payment Sent — Awaiting Verification", icon: ShieldCheck },
  { key: "PAID", label: "Payment Verified", icon: CreditCard },
  { key: "DISPATCHED", label: "Dispatched via RTC Cargo", icon: Truck },
  { key: "DELIVERED", label: "Delivered", icon: CheckCircle2 },
];

const STATUS_RANK: Record<string, number> = {
  PENDING: 0,
  PENDING_VERIFICATION: 1,
  PAID: 2,
  DISPATCHED: 3,
  DELIVERED: 4,
  CANCELLED: -1,
};

export default function TrackForm() {
  const [phone, setPhone] = useState("");
  const [results, setResults] = useState<TrackedOrder[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const p = params.get("phone");
    if (p && /^[6-9]\d{9}$/.test(p)) {
      setPhone(p);
      runSearch(p);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const runSearch = (value: string) => {
    if (!/^[6-9]\d{9}$/.test(value)) {
      setError("Enter a valid 10-digit Indian mobile number.");
      setResults(null);
      return;
    }
    setError(null);
    startTransition(async () => {
      const data = await trackByPhone(value);
      setResults(data);
    });
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    runSearch(phone.trim());
  };

  return (
    <div className="space-y-8">
      <form onSubmit={onSubmit} className="flex items-center bg-white border border-brand-primary-green/10 rounded-2xl p-1.5 sm:p-2 gap-2 sm:gap-3">
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
          placeholder="Your 10-digit mobile number"
          maxLength={10}
          inputMode="numeric"
          className="flex-1 min-w-0 bg-transparent px-2 sm:px-4 py-2.5 sm:py-3 text-brand-primary-green focus:outline-none font-mono tracking-widest placeholder:font-sans placeholder:tracking-normal text-sm sm:text-base"
        />
        <button
          type="submit"
          disabled={isPending || phone.length !== 10}
          className="bg-brand-primary-green text-brand-cream px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-bold flex items-center gap-1.5 sm:gap-2 hover:opacity-90 transition disabled:opacity-50 text-sm sm:text-base shrink-0 whitespace-nowrap"
        >
          <Search className="w-4 h-4 shrink-0" />
          <span>{isPending ? "Searching…" : "Track"}</span>
        </button>
      </form>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-700 rounded-2xl text-sm">{error}</div>
      )}

      {results && results.length === 0 && (
        <div className="bg-white rounded-3xl p-12 text-center border border-brand-primary-green/5">
          <Package className="w-12 h-12 text-brand-primary-green/20 mx-auto mb-4" />
          <h2 className="font-bold text-brand-primary-green">No orders for this number</h2>
          <p className="text-sm text-brand-primary-green/60 mt-2">
            Double check the number you used at checkout, or contact the farm.
          </p>
        </div>
      )}

      {results && results.length > 0 && (
        <div className="space-y-6">
          {results.map((order) => {
            const rank = STATUS_RANK[order.status] ?? -1;
            const isCancelled = order.status === "CANCELLED";
            return (
              <div key={order.id} className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-brand-primary-green/5">
                <div className="flex items-start justify-between mb-6 flex-wrap gap-2">
                  <div>
                    <p className="text-xs uppercase font-bold text-brand-primary-green/40">Order</p>
                    <p className="font-mono font-bold text-brand-primary-green">{order.orderNumber}</p>
                    <p className="text-xs text-brand-primary-green/50 mt-1">
                      Placed {new Date(order.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs uppercase font-bold text-brand-primary-green/40">Total</p>
                    <p className="text-2xl font-bold font-[family-name:var(--font-playfair)] text-brand-primary-green tabular-nums">
                      ₹{Number(order.totalAmount).toLocaleString("en-IN")}
                    </p>
                  </div>
                </div>

                {isCancelled ? (
                  <div className="flex items-center space-x-3 bg-red-50 border border-red-100 rounded-2xl p-4 text-red-700">
                    <XCircle className="w-5 h-5" />
                    <span className="font-bold">Order cancelled</span>
                  </div>
                ) : (
                  <div className="space-y-3 relative">
                    <div className="absolute left-4 top-2 bottom-2 w-px bg-brand-primary-green/10" />
                    {TIMELINE.map(({ key, label, icon: Icon }) => {
                      const idx = STATUS_RANK[key];
                      const reached = idx <= rank;
                      const current = idx === rank;
                      return (
                        <div key={key} className="flex items-center space-x-4 relative z-10">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                            reached
                              ? "bg-brand-primary-green text-brand-cream border-brand-primary-green"
                              : "bg-white border-brand-primary-green/20 text-brand-primary-green/30"
                          }`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1">
                            <p className={`text-sm font-bold ${reached ? "text-brand-primary-green" : "text-brand-primary-green/40"}`}>
                              {label}{current && " · current"}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <details className="mt-5 text-sm">
                  <summary className="cursor-pointer text-brand-primary-green/70 font-semibold hover:text-brand-primary-green transition-colors">Items, shipping & price breakdown</summary>
                  <div className="mt-3 grid sm:grid-cols-2 gap-4">
                    <div className="bg-brand-cream/40 rounded-xl p-4 space-y-3 text-xs text-brand-primary-green/80">
                      <div className="space-y-1 border-b border-brand-primary-green/5 pb-2">
                        <p className="font-bold text-[10px] uppercase tracking-wider text-brand-primary-green/50">Items</p>
                        {order.items.map((item) => (
                          <div key={item.id} className="flex justify-between">
                            <span>{item.variety} · {item.quantityKg}kg</span>
                            <span className="font-semibold">@ ₹{item.priceAtPurchase}/kg</span>
                          </div>
                        ))}
                      </div>
                      <div className="space-y-1.5 pt-1">
                        <div className="flex justify-between">
                          <span>Subtotal</span>
                          <span className="font-medium">₹{(Number(order.totalAmount) - Number(order.shippingFee || 0) - Number(order.packingFee || 0)).toLocaleString("en-IN")}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Packing Fee</span>
                          <span className="font-medium">₹{Number(order.packingFee || 0).toLocaleString("en-IN")}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>RTC Cargo Shipping</span>
                          <span className="font-medium">₹{Number(order.shippingFee || 0).toLocaleString("en-IN")}</span>
                        </div>
                        <div className="flex justify-between border-t border-brand-primary-green/10 pt-2 font-bold text-brand-primary-green text-sm">
                          <span>Total</span>
                          <span>₹{Number(order.totalAmount).toLocaleString("en-IN")}</span>
                        </div>
                      </div>
                    </div>
                    <div className="bg-brand-cream/40 rounded-xl p-4 text-xs space-y-2 text-brand-primary-green/80">
                      <p className="font-bold text-[10px] uppercase tracking-wider text-brand-primary-green/50">Delivery details</p>
                      <p><b>City:</b> {order.city}, {order.state} - {order.pincode}</p>
                      {order.rtcDepotName && <p><b>RTC Depot:</b> {order.rtcDepotName}</p>}
                      <p><b>Landmark:</b> {order.rtcLandmark}</p>
                      {order.utr && (
                        <p>
                          <b>Payment Verification:</b>{" "}
                          {order.utr === "SCREENSHOT" || order.utr === "WHATSAPP" ? (
                            <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100/50">
                              Shared on WhatsApp
                            </span>
                          ) : (
                            <span className="font-mono">{order.utr}</span>
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                </details>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
