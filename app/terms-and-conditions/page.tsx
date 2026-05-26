import type { Metadata } from "next";
import React from 'react';
import TopBar from "../components/TopBar";
import Header from "../components/Header";
import Footer from "../components/Footer";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description: "Order terms, product availability and customer responsibilities for Palle Mamidi mango purchases.",
  alternates: { canonical: "/terms-and-conditions" },
};

export default function TermsAndConditions() {
  return (
    <div className="flex flex-col min-h-screen bg-brand-cream">
      <TopBar />
      <Header />
      <main className="flex-1 max-w-3xl mx-auto py-16 px-6 lg:px-8 text-[#1B330F]">
        <h1 className="text-4xl font-[family-name:var(--font-playfair)] font-bold mb-4">Terms & Conditions</h1>
        <p className="text-sm opacity-60 font-bold uppercase tracking-widest mb-12">Last updated: May 2026</p>
        
        <div className="space-y-10">
          <section>
            <h2 className="text-2xl font-bold mb-4">1. Product Availability</h2>
            <p className="leading-relaxed opacity-90">All orders are subject to mango availability and seasonal stock. Mangoes are seasonal fruits, and harvest yields may affect our ability to fulfill certain varieties at all times.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">2. Pricing</h2>
            <p className="leading-relaxed opacity-90">Prices may change without prior notice based on market conditions, seasonal availability, and logistics costs.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">3. Order Acceptance</h2>
            <p className="leading-relaxed opacity-90">We reserve the right to cancel orders in cases of stock issues, pricing errors, or suspicious activity. If your order is canceled after payment, a full refund will be initiated.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">4. Shipping Delays</h2>
            <p className="leading-relaxed opacity-90">Delivery timelines may vary due to weather, harvest conditions, or logistics delays. We strive to deliver as quickly as possible but cannot guarantee exact arrival times for agricultural products.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">5. Customer Responsibility</h2>
            <p className="leading-relaxed opacity-90">Customers must provide accurate shipping and contact information. We are not responsible for delivery failures caused by incorrect addresses or unreachable phone numbers.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">6. Intellectual Property</h2>
            <p className="leading-relaxed opacity-90">Website images, logos, and branding belong to Palle Mamidi. Unauthorized use or reproduction is prohibited.</p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
