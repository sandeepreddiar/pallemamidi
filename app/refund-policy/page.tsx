import type { Metadata } from "next";
import React from 'react';
import TopBar from "../components/TopBar";
import Header from "../components/Header";
import Footer from "../components/Footer";

export const metadata: Metadata = {
  title: "Refund Policy",
  description: "Refund rules for fresh, perishable mango deliveries from Palle Mamidi.",
  alternates: { canonical: "/refund-policy" },
};

export default function RefundPolicy() {
  return (
    <div className="flex flex-col min-h-screen bg-brand-cream">
      <TopBar />
      <Header />
      <main className="flex-1 max-w-3xl mx-auto py-16 px-6 lg:px-8 text-[#1B330F]">
        <h1 className="text-4xl font-[family-name:var(--font-playfair)] font-bold mb-4">Refund Policy</h1>
        <p className="text-sm opacity-60 font-bold uppercase tracking-widest mb-12">Last updated: May 2026</p>
        
        <div className="space-y-10">
          <section>
            <h2 className="text-2xl font-bold mb-4">1. Perishable Product Notice</h2>
            <div className="p-5 bg-yellow-50 border border-yellow-200 rounded-xl mb-4">
              <p className="leading-relaxed font-semibold text-yellow-900">Mangoes are perishable agricultural products. Due to the nature of fresh food, our refund policy is strictly designed to address genuine issues while preventing misuse.</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">2. Refund Eligibility</h2>
            <p className="leading-relaxed opacity-90 mb-3">We ONLY allow refunds or replacements for the following cases:</p>
            <ul className="list-disc pl-5 opacity-90 space-y-2">
              <li>Severely damaged products during transit</li>
              <li>Delivery of the wrong product variety</li>
              <li>Completely spoiled delivery upon arrival</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-red-700">3. Complaint Window</h2>
            <p className="leading-relaxed font-bold">Issues must be reported within 24 hours of delivery.</p>
            <p className="leading-relaxed opacity-90 mt-2">Due to the perishable nature of mangoes, any complaints raised after 24 hours of successful delivery will not be eligible for a refund or replacement.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">4. Proof Requirement</h2>
            <p className="leading-relaxed opacity-90">Customers will be asked to provide clear photos and videos of the damaged or incorrect products along with the original packaging and shipping label when submitting a complaint.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">5. Non-Refundable Cases</h2>
            <p className="leading-relaxed opacity-90 mb-3">Refunds are <span className="font-bold">not</span> provided for:</p>
            <ul className="list-disc pl-5 opacity-90 space-y-2">
              <li>Incorrect address provided by the customer</li>
              <li>Customer unavailability during delivery attempts</li>
              <li>Delayed complaints (past the 24-hour window)</li>
              <li>Normal natural variations in mango appearance (e.g., skin color, minor blemishes, size variations)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">6. Refund Processing Time</h2>
            <p className="leading-relaxed opacity-90">Approved refunds are processed back to your UPI account or via direct bank transfer within 3–5 business days after our support team verifies the details with you.</p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
