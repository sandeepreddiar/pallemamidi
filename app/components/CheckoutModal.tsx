"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import {
  CheckCircle2,
  Truck,
  CreditCard,
  ArrowRight,
  X,
  AlertCircle,
  Smartphone,
  QrCode,
  Copy,
  Loader2,
  User,
  MapPin,
  Building2,
  Globe,
  MessageSquare,
  Sparkles,
  ShieldCheck,
  Bus,
} from "lucide-react";
import { useCartStore } from "@/app/store/useCartStore";
import { submitOrder, submitUtr, type SubmitOrderResult } from "@/app/actions/orders";
import { recordCheckoutEventAction } from "@/app/actions/emails";
import { calculateShippingFee, calculatePackingFee, getShippingZone } from "@/app/lib/shipping";

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type PaymentSession = Extract<SubmitOrderResult, { success: true }>;



function detectIsMobile() {
  if (typeof navigator === "undefined") return false;
  return /android|iphone|ipad|ipod|mobile/i.test(navigator.userAgent);
}

export default function CheckoutModal({ isOpen, onClose }: CheckoutModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const { items, clearCart } = useCartStore();

  const [formData, setFormData] = useState({
    customerName: "",
    phoneNumber: "",
    state: "",
    city: "",
    pincode: "",
    rtcDepotName: "",
    rtcLandmark: "",
    customerNotes: "",
  });


  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [payment, setPayment] = useState<PaymentSession | null>(null);
  const [utr, setUtr] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [copied, setCopied] = useState<"vpa" | "amount" | null>(null);
  const [showLocationGuide, setShowLocationGuide] = useState(false);
  const [hasSharedWhatsapp, setHasSharedWhatsapp] = useState(false);
  const [hasPaid, setHasPaid] = useState(false);

  const [sessionId, setSessionId] = useState("");
  const sentEventTypes = useRef<Set<string>>(new Set());

  const triggerWarmLead = async () => {
    const hasPhone = /^[6-9]\d{9}$/.test(formData.phoneNumber);
    const hasName = formData.customerName.trim().length >= 2;
    if (
      hasName &&
      hasPhone &&
      !sentEventTypes.current.has("CHECKOUT_STARTED") &&
      !sentEventTypes.current.has("PAYMENT_INTENT") &&
      !sentEventTypes.current.has("PAYMENT_SUBMITTED")
    ) {
      sentEventTypes.current.add("CHECKOUT_STARTED");
      try {
        await recordCheckoutEventAction({
          sessionId,
          customerName: formData.customerName,
          phone: formData.phoneNumber,
          state: formData.state,
          city: formData.city,
          pincode: formData.pincode,
          rtcDepotCode: "",
          rtcDepotName: formData.rtcDepotName,
          rtcLandmark: formData.rtcLandmark,
          customerNotes: formData.customerNotes,
          cartItems: items.map((i) => ({
            variety: i.name,
            weightKg: i.weight,
            quantity: i.quantity,
            price: i.pricePerKg,
          })),
          eventType: "CHECKOUT_STARTED",
        });
      } catch (err) {
        console.error("Error recording Warm Lead:", err);
      }
    }
  };

  const handleClose = async () => {
    await triggerWarmLead();
    onClose();
  };

  // Display-only running total. Server recomputes from DB at submit time — this is just a hint.
  const serverTotal = useMemo(
    () => items.reduce((sum, item) => sum + item.pricePerKg * item.weight * item.quantity, 0),
    [items]
  );

  const totalWeight = useMemo(
    () => items.reduce((sum, item) => sum + item.weight * item.quantity, 0),
    [items]
  );

  const shippingFee = useMemo(() => {
    if (!formData.state || !formData.city) return 0;
    return calculateShippingFee(formData.state, formData.city, totalWeight);
  }, [formData.state, formData.city, totalWeight]);

  const packingFee = useMemo(() => {
    return calculatePackingFee(totalWeight);
  }, [totalWeight]);

  const displayTotal = useMemo(() => {
    return serverTotal + shippingFee + packingFee;
  }, [serverTotal, shippingFee, packingFee]);

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setError(null);
      setIsSubmitting(false);
      setPayment(null);
      setUtr("");
      setIsMobile(detectIsMobile());
      
      const newSessionId = "pm_sess_" + Math.random().toString(36).substring(2, 15) + "_" + Date.now();
      setSessionId(newSessionId);
      sentEventTypes.current = new Set();
      setShowLocationGuide(false);
      setHasSharedWhatsapp(false);
      setHasPaid(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateShipping = () => {
    if (!formData.customerName.trim()) return "Please enter your full name.";
    if (!/^[6-9]\d{9}$/.test(formData.phoneNumber)) return "Enter a valid 10-digit Indian mobile number.";
    if (!formData.state.trim()) return "Please enter your state.";
    if (!formData.city.trim()) return "Please enter your city.";
    if (!/^\d{6}$/.test(formData.pincode)) return "Pincode must be exactly 6 digits.";
    if (!formData.rtcDepotName.trim() || formData.rtcDepotName.trim().length < 2) return "Please enter the nearest RTC bus depot name.";
    if (formData.rtcLandmark.trim().length < 3) return "Please add a short landmark or contact note for the depot.";
    if (items.length === 0) return "Your cart is empty.";
    if (totalWeight < 10) return `Minimum order requirement is 10 kg. Your cart has only ${totalWeight} kg.`;
    return null;
  };

  const handleCreateOrder = async () => {
    const issue = validateShipping();
    if (issue) {
      setError(issue);
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        items: items.map((i) => ({
          variety: i.name as any,
          weightKg: i.weight,
          quantity: i.quantity,
        })),
      };
      const response = await submitOrder(payload);
      if (response.success) {
        setPayment(response);
        setStep(2);

        // Record PAYMENT_INTENT (Hot Lead)
        if (!sentEventTypes.current.has("PAYMENT_INTENT") && !sentEventTypes.current.has("PAYMENT_SUBMITTED")) {
          sentEventTypes.current.add("PAYMENT_INTENT");
          recordCheckoutEventAction({
            sessionId,
            customerName: formData.customerName,
            phone: formData.phoneNumber,
            state: formData.state,
            city: formData.city,
            pincode: formData.pincode,
            rtcDepotCode: "",
            rtcDepotName: formData.rtcDepotName,
            rtcLandmark: formData.rtcLandmark,
            customerNotes: formData.customerNotes,
            cartItems: items.map((i) => ({
              variety: i.name,
              weightKg: i.weight,
              quantity: i.quantity,
              price: i.pricePerKg,
            })),
            eventType: "PAYMENT_INTENT",
          }).catch((err) => console.error("Error sending Hot Lead:", err));
        }
      } else {
        setError(response.error);
      }
    } catch {
      setError("Could not place order. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitUtr = async () => {
    if (!payment) return;
    setError(null);
    setIsSubmitting(true);
    try {
      const res = await submitUtr({
        orderId: payment.orderId,
        phoneNumber: formData.phoneNumber,
        utr: "SCREENSHOT",
      });
      if (res.success) {
        clearCart();
        setStep(3);

        // Record PAYMENT_SUBMITTED
        if (!sentEventTypes.current.has("PAYMENT_SUBMITTED")) {
          sentEventTypes.current.add("PAYMENT_SUBMITTED");
          recordCheckoutEventAction({
            sessionId,
            customerName: formData.customerName,
            phone: formData.phoneNumber,
            state: formData.state,
            city: formData.city,
            pincode: formData.pincode,
            rtcDepotCode: "",
            rtcDepotName: formData.rtcDepotName,
            rtcLandmark: formData.rtcLandmark,
            customerNotes: formData.customerNotes,
            cartItems: items.map((i) => ({
              variety: i.name,
              weightKg: i.weight,
              quantity: i.quantity,
              price: i.pricePerKg,
            })),
            eventType: "PAYMENT_SUBMITTED",
            utr: "SCREENSHOT",
            orderNumber: payment.orderNumber,
            orderId: payment.orderId,
          }).catch((err) => console.error("Error sending Payment Submitted:", err));
        }
      } else {
        setError(res.error || "Could not record UTR.");
      }
    } catch {
      setError("Could not submit UTR. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const copy = async (text: string, key: "vpa" | "amount") => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setHasPaid(true);
      setTimeout(() => setCopied(null), 1500);
    } catch { /* ignore */ }
  };

  const totalForDisplay = payment ? payment.totalAmount : displayTotal;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center md:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={isSubmitting ? undefined : handleClose} />

      <div className="relative bg-brand-cream w-full h-[100dvh] md:h-[680px] md:max-h-[90vh] md:max-w-4xl md:rounded-3xl shadow-2xl overflow-hidden border-0 md:border md:border-white/20 animate-in zoom-in duration-300 flex flex-col md:flex-row">
        <button
          onClick={handleClose}
          disabled={isSubmitting}
          className="absolute top-4 right-4 md:top-6 md:right-6 p-2 hover:bg-black/10 rounded-full transition-colors z-[210] disabled:opacity-30 cursor-pointer text-brand-cream md:text-brand-primary-green"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Progress Sidebar - Desktop only */}
        <div className="hidden md:flex bg-brand-primary-green p-8 md:w-80 shrink-0 text-brand-cream flex-col justify-between">
          <div>
            <h2 className="font-[family-name:var(--font-playfair)] text-3xl font-bold mb-10">Checkout</h2>
            <div className="space-y-8 relative">
              <div className="absolute left-4 top-2 bottom-2 w-px bg-brand-cream/20" />
              {[
                { s: 1, label: "Shipping Info", icon: Truck },
                { s: 2, label: "Pay via UPI", icon: CreditCard },
                { s: 3, label: "Confirmation", icon: CheckCircle2 },
              ].map(({ s, label, icon: Icon }) => (
                <div key={s} className="flex items-center space-x-4 relative z-10">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${
                    step >= s ? "bg-brand-cream text-brand-primary-green border-brand-cream" : "border-brand-cream/20 bg-brand-primary-green"
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className={`font-bold transition-opacity duration-500 ${step >= s ? "opacity-100" : "opacity-40"}`}>
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-brand-cream/10">
            <p className="text-xs uppercase tracking-widest font-bold opacity-40 mb-2">Total Amount</p>
            <p className="text-3xl font-bold font-[family-name:var(--font-playfair)] tabular-nums">
              ₹{totalForDisplay.toLocaleString("en-IN")}
            </p>
            {payment && (
              <p className="text-xs opacity-60 mt-3 font-mono">{payment.orderNumber}</p>
            )}
          </div>
        </div>

        {/* Progress Topbar - Mobile only */}
        <div className="flex md:hidden bg-brand-primary-green px-5 py-4 text-brand-cream justify-between items-center shrink-0 border-b border-brand-cream/10 pr-14 z-50">
          <div className="flex items-center space-x-3">
            <div className="text-sm font-bold font-[family-name:var(--font-playfair)]">
              {step === 1 && "Shipping Info"}
              {step === 2 && "Pay via UPI"}
              {step === 3 && "Confirmation"}
            </div>
            <div className="flex items-center space-x-1.5">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    step === s
                      ? "bg-brand-cream w-4"
                      : step > s
                      ? "bg-brand-cream"
                      : "bg-brand-cream/35"
                  }`}
                />
              ))}
            </div>
          </div>
          <div className="text-right">
            <span className="text-[9px] uppercase opacity-60 block leading-none font-bold tracking-wider">Total</span>
            <span className="text-base font-bold font-[family-name:var(--font-playfair)]">
              ₹{totalForDisplay.toLocaleString("en-IN")}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 md:p-12 overflow-y-auto h-full max-h-[calc(100dvh-64px)] md:max-h-[90vh] custom-scrollbar">
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-700 rounded-2xl flex items-start space-x-3 text-sm animate-in fade-in duration-300">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

            {step === 1 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                <div>
                  <h3 className="text-2xl font-bold text-brand-primary-green font-[family-name:var(--font-playfair)]">Shipping Details</h3>
                  <p className="text-sm text-brand-primary-green/80 mt-1.5 leading-relaxed">
                    We deliver to the RTC Cargo / bus stand nearest you — drop us the exact landmark.
                  </p>
                </div>

                {/* Personal Info Card */}
                <div className="form-card">
                  <div className="form-card-header text-brand-primary-green/90">
                    <User className="w-4 h-4" />
                    <span>Personal Info</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 md:p-5">
                    <Field label="Full Name *" className="md:col-span-2">
                      <div className="inp-container">
                        <User className="inp-icon" />
                        <input
                          type="text"
                          name="customerName"
                          value={formData.customerName}
                          onChange={handleChange}
                          onBlur={triggerWarmLead}
                          placeholder="Your complete name"
                          className="inp inp-with-icon"
                        />
                      </div>
                    </Field>
                    <Field label="Phone Number *">
                      <div className="inp-container">
                        <Smartphone className="inp-icon" />
                        <input
                          type="tel"
                          name="phoneNumber"
                          value={formData.phoneNumber}
                          onChange={handleChange}
                          onBlur={triggerWarmLead}
                          placeholder="10-digit mobile"
                          maxLength={10}
                          inputMode="numeric"
                          className="inp inp-with-icon"
                        />
                      </div>
                    </Field>
                    <Field label="Pincode *">
                      <div className="inp-container">
                        <MapPin className="inp-icon" />
                        <input
                          type="text"
                          name="pincode"
                          value={formData.pincode}
                          onChange={handleChange}
                          placeholder="6 digit code"
                          maxLength={6}
                          inputMode="numeric"
                          className="inp inp-with-icon"
                        />
                      </div>
                    </Field>
                  </div>
                </div>

                {/* Address Card */}
                <div className="form-card">
                  <div className="form-card-header">
                    <MapPin className="w-4 h-4" />
                    <span>Delivery Address</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 md:p-5">
                    <Field label="City / Town *">
                      <div className="inp-container">
                        <Building2 className="inp-icon" />
                        <input
                          type="text"
                          name="city"
                          value={formData.city}
                          onChange={handleChange}
                          placeholder="e.g. Vijayawada"
                          className="inp inp-with-icon"
                        />
                      </div>
                    </Field>
                    <Field label="State *">
                      <div className="inp-container">
                        <Globe className="inp-icon" />
                        <input
                          type="text"
                          name="state"
                          value={formData.state}
                          onChange={handleChange}
                          placeholder="e.g. Andhra Pradesh"
                          className="inp inp-with-icon"
                        />
                      </div>
                    </Field>
                    <Field label="Nearest RTC Bus Depot *" className="md:col-span-2">
                      <div className="flex flex-col gap-2">
                        <div className="inp-container">
                          <Bus className="inp-icon" />
                          <input
                            type="text"
                            name="rtcDepotName"
                            value={formData.rtcDepotName}
                            onChange={handleChange}
                            placeholder="e.g. MGBS Hyderabad, Vijayawada PNBS"
                            className="inp inp-with-icon"
                          />
                        </div>
                        <div className="flex flex-wrap items-center justify-between gap-2 pl-1">
                          <p className="text-[11px] text-brand-primary-green/75 leading-relaxed">
                            Your carton will be dispatched to this depot for pickup via RTC Cargo.
                          </p>
                          <button
                            type="button"
                            onClick={() => setShowLocationGuide(true)}
                            className="text-xs font-bold text-brand-orange hover:text-brand-orange/80 flex items-center gap-1 shrink-0 bg-brand-orange/10 px-2 py-1 rounded transition-colors"
                          >
                            <Globe className="w-3.5 h-3.5" />
                            Guide: View Locations
                          </button>
                        </div>
                      </div>
                    </Field>
                    <Field label="Pickup Landmark / Contact Note *" className="md:col-span-2">
                      <div className="inp-container">
                        <MapPin className="inp-icon text-brand-orange" />
                        <input
                          type="text"
                          name="rtcLandmark"
                          value={formData.rtcLandmark}
                          onChange={handleChange}
                          placeholder="e.g. Cargo counter near Platform 6, will collect by 7pm"
                          className="inp inp-with-icon"
                        />
                      </div>
                    </Field>
                    <Field label="Order Notes (optional)" className="md:col-span-2">
                      <div className="inp-container">
                        <MessageSquare className="textarea-icon" />
                        <textarea
                          name="customerNotes"
                          value={formData.customerNotes}
                          onChange={handleChange}
                          placeholder="Gift pack? Call before dispatch? Tell us here…"
                          rows={2}
                          className="inp inp-with-icon pt-3"
                        />
                      </div>
                    </Field>
                  </div>
                </div>

                {/* Cost Breakdown Card */}
                <div className="form-card overflow-hidden">
                  <div className="form-card-header text-brand-primary-green/90">
                    <CreditCard className="w-4 h-4" />
                    <span>Price Breakdown</span>
                  </div>
                  <div className="p-4 md:p-5 space-y-3 text-sm text-brand-primary-green">
                    <div className="flex justify-between items-center">
                      <span className="text-brand-primary-green/70">Subtotal ({totalWeight} kg mangoes)</span>
                      <span className="font-semibold tabular-nums">₹{serverTotal.toLocaleString("en-IN")}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-brand-primary-green/70">Packing Fee</span>
                      <span className="font-semibold tabular-nums">₹{packingFee}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-brand-primary-green/70 flex items-center">
                        <span>RTC Cargo Shipping</span>
                        {formData.state && formData.city ? (
                          <span className="text-[9px] bg-brand-primary-green/10 text-brand-primary-green px-1.5 py-0.5 rounded ml-2 uppercase font-bold tracking-wider">
                            {getShippingZone(formData.state, formData.city)} Zone
                          </span>
                        ) : (
                          <span className="text-[9px] text-brand-orange ml-2 animate-pulse">
                            (Enter state & city to calculate)
                          </span>
                        )}
                      </span>
                      <span className="font-bold tabular-nums">
                        {formData.state && formData.city ? `₹${shippingFee}` : "—"}
                      </span>
                    </div>
                    <div className="pt-3 border-t border-brand-primary-green/10 flex justify-between items-center">
                      <span className="font-bold uppercase tracking-wider text-xs">Total Amount</span>
                      <span className="text-xl font-[family-name:var(--font-playfair)] font-bold text-brand-primary-green tabular-nums">
                        ₹{displayTotal.toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 2 && payment && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="bg-brand-primary-green/5 rounded-2xl p-5 border border-brand-primary-green/10 flex items-start space-x-4 animate-in fade-in duration-300">
                  <div className="p-3 bg-brand-primary-green/10 rounded-xl text-brand-primary-green shrink-0">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-brand-primary-green">Pay via UPI · 0% fees</h3>
                    <p className="text-xs text-brand-primary-green/70 mt-1">
                      Order <span className="font-mono font-bold text-brand-primary-green">{payment.orderNumber}</span> · pay
                      <span className="font-bold text-brand-primary-green"> ₹{payment.totalAmount.toLocaleString("en-IN")}</span> to{" "}
                      <span className="font-mono font-bold text-brand-primary-green">{payment.upiPayeeName}</span>.
                    </p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {/* Mobile / link */}
                  <div className={`rounded-2xl p-5 border flex flex-col justify-between transition-all ${
                    isMobile
                      ? "bg-brand-primary-green text-brand-cream border-brand-primary-green shadow-lg"
                      : "bg-white border-brand-primary-green/10"
                  }`}>
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <Smartphone className="w-5 h-5" />
                          <h4 className="font-bold uppercase tracking-wider text-xs">On your phone</h4>
                        </div>
                        {isMobile && (
                          <span className="text-[9px] uppercase tracking-widest font-bold bg-brand-cream text-brand-primary-green px-2 py-0.5 rounded-full">
                            Recommended
                          </span>
                        )}
                      </div>
                      <p className={`text-xs mb-6 leading-relaxed ${isMobile ? "opacity-80" : "text-brand-primary-green/70"}`}>
                        Tap below to open Google Pay, PhonePe, Paytm, or any banking app with the amount pre-filled.
                      </p>
                    </div>
                    <div>
                      <a
                        href={isMobile ? payment.upiLink : undefined}
                        onClick={(e) => {
                          setHasPaid(true);
                          if (!isMobile) {
                            e.preventDefault();
                            setError("UPI deep links can only be opened on mobile devices. Please scan the QR code or copy the UPI ID on the right to complete the payment.");
                          }
                        }}
                        className={`block text-center w-full py-3.5 rounded-xl font-bold text-sm transition-all active:scale-[0.98] cursor-pointer shadow-md ${
                          isMobile
                            ? "bg-brand-cream text-brand-primary-green hover:bg-white"
                            : "bg-brand-primary-green text-brand-cream hover:bg-brand-primary-green/90"
                        }`}
                      >
                        Pay ₹{payment.totalAmount.toLocaleString("en-IN")} via UPI
                      </a>
                      <p className={`text-[10px] mt-3 leading-tight ${isMobile ? "opacity-60" : "text-brand-primary-green/50"}`}>
                        If nothing opens, scan the QR code or copy the UPI ID on the right.
                      </p>
                    </div>
                  </div>

                  {/* Desktop / QR */}
                  <div className="rounded-2xl p-5 border bg-white border-brand-primary-green/10 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-3 text-brand-primary-green">
                        <div className="flex items-center space-x-2">
                          <QrCode className="w-5 h-5" />
                          <h4 className="font-bold uppercase tracking-wider text-xs">Scan to pay</h4>
                        </div>
                        <span className="text-[9px] uppercase tracking-widest font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                          Amount pre-filled
                        </span>
                      </div>
                      <div className="flex flex-col items-center bg-brand-cream/20 rounded-xl p-4 mb-4 border border-brand-primary-green/5">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={payment.qrImage}
                          alt={`Scan to pay ₹${payment.totalAmount.toFixed(2)} to ${payment.upiPayeeName}`}
                          className="w-36 h-36 object-contain mix-blend-multiply"
                        />
                        <p className="text-[10px] text-brand-primary-green/60 mt-2 text-center leading-tight">
                          Scan with any UPI app — your phone opens with<br />
                          <b className="text-brand-primary-green">₹{payment.totalAmount.toLocaleString("en-IN")}</b> already filled in.
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2 text-xs">
                      <CopyRow label="UPI ID" value={payment.upiVpa} onCopy={() => copy(payment.upiVpa, "vpa")} copied={copied === "vpa"} />
                      <CopyRow
                        label="Amount"
                        value={`₹${payment.totalAmount.toFixed(2)}`}
                        onCopy={() => copy(payment.totalAmount.toFixed(2), "amount")}
                        copied={copied === "amount"}
                      />
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-green-500/30 bg-green-500/5 p-6 space-y-4 shadow-sm animate-in fade-in duration-500">
                  <div className="flex items-start space-x-3 text-brand-primary-green">
                    <div className="p-2 bg-green-500/10 rounded-xl text-green-600 shrink-0 mt-0.5">
                      <svg
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="w-5 h-5"
                      >
                        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.457L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.725 1.45 5.513 0 10.002-4.487 10.005-10 0-2.672-1.04-5.184-2.93-7.075C16.558 1.638 14.048.599 11.378.6c-5.517 0-10.007 4.49-10.01 10.004-.002 1.777.477 3.512 1.388 5.047L1.73 21.053l5.584-1.464c1.558.847 3.125 1.285 4.7 1.285zm11.365-7.39c-.29-.145-1.72-.85-1.985-.945-.266-.096-.46-.145-.653.145-.19.29-.74.945-.907 1.137-.166.19-.333.21-.624.066-1.558-.78-2.682-1.35-3.754-3.195-.285-.487.285-.45.815-.99.077-.078.155-.17.228-.24.07-.073.093-.12.143-.2.05-.083.025-.157-.012-.23-.037-.073-.33-1.025-.46-1.343-.13-.314-.27-.272-.37-.272-.095-.002-.206-.003-.317-.003-.11 0-.29.04-.44.206-.152.164-.58.567-.58 1.385 0 .817.595 1.606.678 1.718.083.11 1.17 1.787 2.835 2.505.396.17.705.27.947.346.4.127.762.11 1.05.067.32-.047 1.025-.42 1.17-.826.144-.404.144-.75.102-.825-.04-.075-.15-.12-.44-.265z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-green-800">After paying — Share Screenshot on WhatsApp</h4>
                      <p className="text-xs text-brand-primary-green/80 mt-1 leading-relaxed">
                        Please take a screenshot of your successful payment and share it with us on WhatsApp at <b className="text-brand-primary-green">+91 86397 50678</b>. This helps us verify your payment instantly and initiate packing!
                      </p>
                    </div>
                  </div>

                  {/* Transferred checkbox */}
                  <div className="flex items-center space-x-3 bg-white p-3.5 rounded-xl border border-brand-primary-green/10">
                    <input
                      type="checkbox"
                      id="checkbox-has-paid"
                      checked={hasPaid}
                      onChange={(e) => setHasPaid(e.target.checked)}
                      className="w-4.5 h-4.5 text-brand-primary-green border-brand-primary-green/20 rounded focus:ring-brand-primary-green cursor-pointer"
                    />
                    <label htmlFor="checkbox-has-paid" className="text-xs font-bold text-brand-primary-green select-none cursor-pointer">
                      I have completed the transfer of ₹{payment.totalAmount.toLocaleString("en-IN")} via UPI
                    </label>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <a
                      href={hasPaid ? `https://wa.me/918639750678?text=${encodeURIComponent(
                        `Hi, I have completed the payment of ₹${payment.totalAmount.toLocaleString("en-IN")} for my Palle Mamidi order ${payment.orderNumber}. Here is my payment screenshot:`
                      )}` : undefined}
                      target={hasPaid ? "_blank" : undefined}
                      rel={hasPaid ? "noopener noreferrer" : undefined}
                      onClick={() => {
                        if (hasPaid) setHasSharedWhatsapp(true);
                      }}
                      className={`flex-grow py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center space-x-2 transition-all shadow-md ${
                        hasPaid
                          ? "bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer hover:shadow-lg"
                          : "bg-emerald-600/30 text-emerald-800/40 cursor-not-allowed pointer-events-none shadow-none"
                      }`}
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="w-4 h-4"
                      >
                        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.457L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.725 1.45 5.513 0 10.002-4.487 10.005-10 0-2.672-1.04-5.184-2.93-7.075C16.558 1.638 14.048.599 11.378.6c-5.517 0-10.007 4.49-10.01 10.004-.002 1.777.477 3.512 1.388 5.047L1.73 21.053l5.584-1.464c1.558.847 3.125 1.285 4.7 1.285zm11.365-7.39c-.29-.145-1.72-.85-1.985-.945-.266-.096-.46-.145-.653.145-.19.29-.74.945-.907 1.137-.166.19-.333.21-.624.066-1.558-.78-2.682-1.35-3.754-3.195-.285-.487.285-.45.815-.99.077-.078.155-.17.228-.24.07-.073.093-.12.143-.2.05-.083.025-.157-.012-.23-.037-.073-.33-1.025-.46-1.343-.13-.314-.27-.272-.37-.272-.095-.002-.206-.003-.317-.003-.11 0-.29.04-.44.206-.152.164-.58.567-.58 1.385 0 .817.595 1.606.678 1.718.083.11 1.17 1.787 2.835 2.505.396.17.705.27.947.346.4.127.762.11 1.05.067.32-.047 1.025-.42 1.17-.826.144-.404.144-.75.102-.825-.04-.075-.15-.12-.44-.265z" />
                      </svg>
                      <span>Share on WhatsApp</span>
                    </a>
                  </div>

                  {hasSharedWhatsapp ? (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 rounded-xl p-3 flex items-center gap-2 text-xs font-semibold animate-in fade-in duration-300">
                      <span className="w-2 h-2 bg-emerald-500 rounded-full shrink-0 animate-pulse" />
                      <span>WhatsApp opened! You can now click "Confirm Payment" below to complete your order.</span>
                    </div>
                  ) : hasPaid ? (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 rounded-xl p-3 flex items-center gap-2 text-xs font-semibold animate-in fade-in duration-300">
                      <span className="w-2 h-2 bg-emerald-500 rounded-full shrink-0 animate-pulse" />
                      <span>Payment completed! Now click "Share on WhatsApp" to open the chat and share the payment screenshot.</span>
                    </div>
                  ) : (
                    <div className="bg-brand-orange/10 border border-brand-orange/20 text-brand-orange rounded-xl p-3 flex items-center gap-2 text-xs font-semibold animate-in fade-in duration-300">
                      <span className="w-2 h-2 bg-brand-orange rounded-full shrink-0 animate-pulse" />
                      <span>First, complete the payment above (tap checkbox or pay button) to enable screenshot sharing.</span>
                    </div>
                  )}
                </div>

                <details className="text-xs text-brand-primary-green/70">
                  <summary className="cursor-pointer font-semibold hover:text-brand-primary-green transition-colors">Order summary & breakdown</summary>
                  <div className="mt-3 space-y-2 border-t border-brand-primary-green/10 pt-2 font-medium">
                    {items.map((item) => (
                      <div key={`${item.id}-${item.weight}`} className="flex justify-between text-brand-primary-green/80">
                        <span>{item.name} ({item.weight}kg × {item.quantity})</span>
                        <span className="font-semibold tabular-nums">₹{item.totalPrice.toLocaleString("en-IN")}</span>
                      </div>
                    ))}
                    <div className="flex justify-between text-brand-primary-green/60 text-[11px] pt-1">
                      <span>Packing Fee</span>
                      <span className="tabular-nums font-semibold">₹{packingFee}</span>
                    </div>
                    <div className="flex justify-between text-brand-primary-green/60 text-[11px]">
                      <span>RTC Cargo Shipping ({getShippingZone(formData.state, formData.city)} Zone)</span>
                      <span className="tabular-nums font-semibold">₹{shippingFee}</span>
                    </div>
                    <div className="flex justify-between text-brand-primary-green font-bold border-t border-brand-primary-green/5 pt-1 text-sm">
                      <span>Total Amount</span>
                      <span className="tabular-nums">₹{payment.totalAmount.toLocaleString("en-IN")}</span>
                    </div>
                  </div>
                </details>
              </div>
            )}

            {step === 3 && payment && (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-6 animate-in fade-in zoom-in duration-500 py-6">
                <div className="w-24 h-24 bg-green-500 text-white rounded-full flex items-center justify-center shadow-lg animate-bounce">
                  <CheckCircle2 className="w-12 h-12" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-brand-primary-green">Order Placed Successfully!</h3>
                  <p className="text-brand-primary-green/60 mt-2 font-medium">
                    Your order is pending verification. Please make sure to share your payment screenshot on WhatsApp. Our team will talk to you shortly to verify your payment and share tracking details once dispatched (usually within a week).
                  </p>
                </div>
                <div className="bg-white/50 border border-dashed border-[#1B330F]/20 rounded-2xl p-6 w-full max-w-sm space-y-2">
                  <div>
                    <p className="text-xs uppercase tracking-widest font-bold text-brand-primary-green/40">Order #</p>
                    <p className="font-mono font-bold text-brand-primary-green">{payment.orderNumber}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-widest font-bold text-brand-primary-green/40">Track at</p>
                    <a href={`/track?phone=${formData.phoneNumber}`} className="font-bold text-brand-primary-green underline">
                      /track
                    </a>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-12 flex justify-end gap-3">
              {step === 1 && (
                <button
                  onClick={handleCreateOrder}
                  disabled={isSubmitting || items.length === 0}
                  className="btn-primary"
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (<><span>Next: Payment</span><ArrowRight className="w-5 h-5" /></>)}
                </button>
              )}
              {step === 2 && (
                <button
                  onClick={handleSubmitUtr}
                  disabled={isSubmitting || !hasSharedWhatsapp}
                  className="btn-primary"
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (<><span>Confirm Payment</span><ArrowRight className="w-5 h-5" /></>)}
                </button>
              )}
              {step === 3 && (
                <button onClick={handleClose} className="btn-primary">
                  <span>Back to Home</span><ArrowRight className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Location Guide Modal Popup */}
        {showLocationGuide && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 overflow-y-auto">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowLocationGuide(false)} />
            <div className="relative bg-brand-cream w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden border border-brand-primary-green/10 animate-in zoom-in-95 duration-200 flex flex-col my-auto max-h-[85vh]">
              {/* Header */}
              <div className="bg-brand-primary-green p-4 text-brand-cream flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <Bus className="w-5 h-5 text-brand-orange" />
                  <h4 className="font-[family-name:var(--font-playfair)] text-xl font-bold">Deliverable Locations Guide</h4>
                </div>
                <button
                  onClick={() => setShowLocationGuide(false)}
                  className="p-1 hover:bg-white/10 rounded-full transition-colors cursor-pointer text-brand-cream"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 min-h-0 p-5 md:p-6 overflow-y-auto space-y-6 custom-scrollbar">
                <div className="bg-brand-orange/5 border border-brand-orange/20 rounded-xl p-4 text-xs text-brand-primary-green space-y-2">
                  <p className="font-bold flex items-center gap-1 text-brand-orange">
                    <Sparkles className="w-4 h-4 text-brand-orange animate-pulse" />
                    Important Delivery Information:
                  </p>
                  <p className="leading-relaxed">
                    All orders are delivered via <strong>RTC Cargo / Private Travels</strong>. Delivery available across Telangana, Andhra Pradesh, Chennai & Bangalore within <strong>2-3 days</strong>.
                  </p>
                  <p className="leading-relaxed text-brand-primary-green/70">
                    Locations listed below are subject to change due to RTC rules, cargo availability, weather, or other reasons. Click on any location to auto-fill the form!
                  </p>
                </div>

                {/* Grid of Locations */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    {
                      title: "Hyderabad",
                      points: [
                        "MGBS", "Kachiguda", "Mehdipatnam", "SR Nagar", "Bala Nagar",
                        "JBS", "Tarnaka", "KPHB", "Miyapur", "BHEL", "Patan Cheevu"
                      ]
                    },
                    {
                      title: "Chennai",
                      points: [
                        "Madhavaram", "Padi", "RMK College", "Gummidipoondi", "Koyambedu"
                      ]
                    },
                    {
                      title: "Bangalore",
                      points: [
                        "KR Puram", "Twin Factory", "Hoskote", "Mahadevapura", "Marathahalli",
                        "Nelamangala", "Silk Board", "HSR Layout", "Electronic City",
                        "Chandapura", "Attibele", "Meletic"
                      ]
                    },
                    {
                      title: "Andhra Pradesh",
                      points: [
                        "Nellore", "Markapuram", "Kavali", "Addanki", "Ongole",
                        "Visakhapatnam", "Tirupati", "Vizianagaram", "Guntur", "Tenali",
                        "Vijayawada", "Anakapalli", "Vinukonda"
                      ]
                    }
                  ].map((loc) => (
                    <div key={loc.title} className="bg-white rounded-xl border border-brand-primary-green/10 overflow-hidden shadow-sm hover:border-brand-primary-green/20 transition-colors">
                      <div className="bg-brand-primary-green/5 px-4 py-2 border-b border-brand-primary-green/5 flex items-center justify-between">
                        <span className="font-bold text-xs uppercase tracking-wider text-brand-primary-green">{loc.title}</span>
                        <span className="text-[10px] text-brand-primary-green/50 font-semibold bg-brand-primary-green/10 px-2 py-0.5 rounded-full">{loc.points.length} Points</span>
                      </div>
                      <div className="p-3 grid grid-cols-2 gap-x-2 gap-y-1.5 text-xs text-brand-primary-green/80">
                        {loc.points.map((pt) => (
                          <button
                            key={pt}
                            type="button"
                            onClick={() => {
                              setFormData(prev => ({
                                ...prev,
                                rtcDepotName: pt,
                                state: loc.title === "Andhra Pradesh" ? "Andhra Pradesh" :
                                       loc.title === "Hyderabad" ? "Telangana" :
                                       loc.title === "Chennai" ? "Tamil Nadu" :
                                       loc.title === "Bangalore" ? "Karnataka" : prev.state
                              }));
                              setShowLocationGuide(false);
                            }}
                            className="flex items-center gap-1.5 py-1 px-1.5 hover:bg-brand-cream/50 rounded text-left transition-colors group cursor-pointer"
                          >
                            <MapPin className="w-3.5 h-3.5 text-brand-orange shrink-0 group-hover:scale-110 transition-transform" />
                            <span className="truncate group-hover:text-brand-orange transition-colors font-medium">{pt}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        <style jsx>{`
        :global(.form-card) {
          background: white;
          border-radius: 1rem;
          border: 1px solid rgba(27, 51, 15, 0.06);
          box-shadow: 0 1px 3px rgba(27, 51, 15, 0.04), 0 4px 12px rgba(27, 51, 15, 0.02);
          overflow: hidden;
          transition: box-shadow 0.3s ease;
        }
        :global(.form-card:focus-within) {
          box-shadow: 0 2px 8px rgba(27, 51, 15, 0.08), 0 8px 24px rgba(27, 51, 15, 0.04);
        }
        :global(.form-card-header) {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.25rem;
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: rgba(46, 77, 37, 0.85);
          background: rgba(46, 77, 37, 0.03);
          border-bottom: 1px solid rgba(27, 51, 15, 0.05);
        }
        :global(.inp) {
          width: 100%;
          background: white;
          border: 1.5px solid rgba(27, 51, 15, 0.18);
          border-radius: 0.75rem;
          padding: 0.875rem 1rem;
          font-size: 0.875rem;
          color: #1B330F;
          caret-color: #1B330F !important;
          cursor: text;
          outline: none;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }
        :global(.inp::placeholder) {
          color: rgba(27, 51, 15, 0.45);
        }
        :global(.inp:hover) {
          border-color: rgba(46, 77, 37, 0.35);
          background: rgba(253, 246, 227, 0.2);
        }
        :global(.inp:focus) {
          border-color: rgba(46, 77, 37, 0.7);
          background: white;
          box-shadow: 0 0 0 3px rgba(46, 77, 37, 0.08), 0 2px 8px rgba(46, 77, 37, 0.06);
        }
        :global(.inp-container) {
          position: relative;
        }
        :global(.inp-icon) {
          position: absolute;
          left: 0.875rem;
          top: 50%;
          transform: translateY(-50%);
          color: rgba(46, 77, 37, 0.55);
          width: 1.125rem;
          height: 1.125rem;
          pointer-events: none;
          transition: color 0.25s ease;
        }
        :global(.inp-container:focus-within .inp-icon) {
          color: #2E4D25;
        }
        :global(.textarea-icon) {
          position: absolute;
          left: 0.875rem;
          top: 1rem;
          color: rgba(46, 77, 37, 0.55);
          width: 1.125rem;
          height: 1.125rem;
          pointer-events: none;
          transition: color 0.25s ease;
        }
        :global(.inp-container:focus-within .textarea-icon) {
          color: #2E4D25;
        }
        :global(.inp-with-icon) {
          padding-left: 2.625rem !important;
        }
        :global(.utr-input) {
          letter-spacing: 0.25em;
          font-size: 1.125rem;
          font-weight: 700;
          text-align: center;
          border-color: rgba(222, 138, 36, 0.3) !important;
        }
        :global(.utr-input:focus) {
          border-color: rgba(222, 138, 36, 0.8) !important;
          box-shadow: 0 0 0 4px rgba(222, 138, 36, 0.15) !important;
        }
        :global(.btn-primary) {
          background: linear-gradient(135deg, #1b330f 0%, #2e4d25 100%);
          color: #fdf6e3;
          padding: 1rem 2rem;
          border-radius: 1rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 2px 8px rgba(27, 51, 15, 0.15);
        }
        :global(.btn-primary:hover:not(:disabled)) {
          background: linear-gradient(135deg, #2e4d25 0%, #3a6130 100%);
          box-shadow: 0 6px 20px rgba(46, 77, 37, 0.25);
          transform: translateY(-2px);
        }
        :global(.btn-primary:active:not(:disabled)) {
          transform: translateY(0);
          box-shadow: 0 2px 6px rgba(46, 77, 37, 0.2);
        }
        :global(.btn-primary:disabled) {
          opacity: 0.5;
          cursor: not-allowed;
        }
        :global(.custom-scrollbar::-webkit-scrollbar) {
          width: 6px;
        }
        :global(.custom-scrollbar::-webkit-scrollbar-track) {
          background: transparent;
        }
        :global(.custom-scrollbar::-webkit-scrollbar-thumb) {
          background: rgba(46, 77, 37, 0.15);
          border-radius: 9999px;
        }
        :global(.custom-scrollbar::-webkit-scrollbar-thumb:hover) {
          background: rgba(46, 77, 37, 0.3);
        }
      `}</style>
    </div>
  );
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className="block text-[10px] font-bold text-brand-primary-green/75 uppercase mb-1.5 tracking-wider">{label}</label>
      {children}
    </div>
  );
}

function CopyRow({ label, value, onCopy, copied }: { label: string; value: string; onCopy: () => void; copied: boolean }) {
  return (
    <div className="flex items-center justify-between bg-brand-cream/40 rounded-xl px-4 py-2.5 border border-brand-primary-green/5 hover:bg-brand-cream/60 transition-colors">
      <div>
        <p className="text-[9px] uppercase font-bold tracking-wider text-brand-primary-green/40">{label}</p>
        <p className="font-mono font-bold text-brand-primary-green text-sm">{value}</p>
      </div>
      <button
        type="button"
        onClick={onCopy}
        className="flex items-center gap-1.5 text-xs font-bold text-brand-primary-green hover:text-brand-orange transition-colors"
      >
        <Copy className="w-3.5 h-3.5" />
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}
