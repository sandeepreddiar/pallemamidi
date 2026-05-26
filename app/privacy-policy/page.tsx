import type { Metadata } from "next";
import React from 'react';
import TopBar from "../components/TopBar";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { SITE_CONFIG } from "../lib/config";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Palle Mamidi collects, uses and protects customer information.",
  alternates: { canonical: "/privacy-policy" },
};

export default function PrivacyPolicy() {
  return (
    <div className="flex flex-col min-h-screen bg-brand-cream">
      <TopBar />
      <Header />
      <main className="flex-1 max-w-3xl mx-auto py-16 px-6 lg:px-8 text-[#1B330F]">
        <h1 className="text-4xl font-[family-name:var(--font-playfair)] font-bold mb-4">Privacy Policy</h1>
        <p className="text-sm opacity-60 font-bold uppercase tracking-widest mb-12">Last updated: May 2026</p>
        
        <div className="space-y-10">
          <section>
            <h2 className="text-2xl font-bold mb-4">1. Introduction</h2>
            <p className="leading-relaxed opacity-90">Palle Mamidi values customer privacy and protects user information. We are committed to ensuring that your privacy is respected and protected.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">2. Information We Collect</h2>
            <p className="leading-relaxed opacity-90 mb-3">When you place an order or interact with our website, we may collect the following information:</p>
            <ul className="list-disc pl-5 opacity-90 space-y-2">
              <li>Name</li>
              <li>Phone number</li>
              <li>Shipping address</li>
              <li>UPI Reference / Transaction Number (UTR)</li>
            </ul>
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
              <p className="font-bold text-yellow-900">Important: We do not collect or store card details or banking credentials on our website.</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">3. Why Data Is Collected</h2>
            <p className="leading-relaxed opacity-90 mb-3">We collect customer data for the following purposes:</p>
            <ul className="list-disc pl-5 opacity-90 space-y-2">
              <li>Order processing and fulfillment</li>
              <li>Delivery and logistics coordination</li>
              <li>Customer support</li>
              <li>Payment verification</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">4. Payment Verification</h2>
            <p className="leading-relaxed opacity-90">Payments are completed via direct UPI transfer to our farm's bank account. We verify your 12-digit UPI Reference Number (UTR) inside our private, secure administrative dashboard before dispatching your order. No third-party payment gateways are used, keeping your payment 100% direct and secure.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">5. Cookies and Sessions</h2>
            <p className="leading-relaxed opacity-90">Our website may use cookies or session storage to improve user experience, maintain cart functionality, and keep your session active securely.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">6. Data Protection</h2>
            <p className="leading-relaxed opacity-90">We take reasonable steps and implement modern security practices to protect customer information from unauthorized access, loss, misuse, or alteration.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">7. Contact Information</h2>
            <p className="leading-relaxed opacity-90">If you have any questions about this Privacy Policy, please contact us at:</p>
            <div className="mt-4 p-6 bg-black/5 rounded-2xl">
              <p className="leading-relaxed opacity-90"><strong>Email:</strong> {SITE_CONFIG.contact.email}</p>
              <p className="leading-relaxed opacity-90 mt-2"><strong>Phone:</strong> {SITE_CONFIG.contact.phone}</p>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
