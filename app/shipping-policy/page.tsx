import type { Metadata } from "next";
import React from 'react';
import TopBar from "../components/TopBar";
import Header from "../components/Header";
import Footer from "../components/Footer";

export const metadata: Metadata = {
  title: "Shipping Policy",
  description: "Delivery areas, transit times and packaging details for Palle Mamidi mango orders across India.",
  alternates: { canonical: "/shipping-policy" },
};

export default function ShippingPolicy() {
  return (
    <div className="flex flex-col min-h-screen bg-brand-cream">
      <TopBar />
      <Header />
      <main className="flex-1 max-w-3xl mx-auto py-16 px-6 lg:px-8 text-[#1B330F]">
        <h1 className="text-4xl font-[family-name:var(--font-playfair)] font-bold mb-4">Shipping Policy</h1>
        <p className="text-sm opacity-60 font-bold uppercase tracking-widest mb-12">Last updated: May 2026</p>
        
        <div className="space-y-10">
          <section>
            <h2 className="text-2xl font-bold mb-4">1. Delivery Areas</h2>
            <p className="leading-relaxed opacity-90">We currently deliver within selected regions of India. We utilize reliable cargo and transport services (such as RTC) to ensure fast and safe transit.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">2. Delivery Time</h2>
            <p className="leading-relaxed opacity-90">Orders are typically delivered within 3–7 business days from the date of dispatch. You will be notified once your order is loaded for transit.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">3. Seasonal Delays</h2>
            <p className="leading-relaxed opacity-90">Because mangoes are highly dependent on harvesting conditions, delivery schedules may vary during peak harvest seasons or due to weather conditions. We appreciate your patience as we ensure only the best quality fruits are sent to you.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">4. Packaging</h2>
            <p className="leading-relaxed opacity-90">Mangoes are carefully packed in specialized ventilated cartons with protective cushioning to reduce transit damage and allow proper ripening.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">5. Failed Delivery</h2>
            <p className="leading-relaxed opacity-90">Customers must ensure someone is available to receive the order at the specified cargo landmark or delivery address. If the delivery fails due to customer unavailability, the perishable nature of the product means we cannot offer a refund or re-route the shipment indefinitely.</p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
