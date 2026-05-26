import type { Metadata } from "next";
import React from 'react';
import { Mail, Phone, MapPin, Clock } from 'lucide-react';
import TopBar from "../components/TopBar";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { SITE_CONFIG } from "../lib/config";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Reach the Palle Mamidi farm team for order support, bulk enquiries and shipping questions. Email, phone, address and support hours.",
  alternates: { canonical: "/contact" },
  openGraph: { title: "Contact Palle Mamidi", description: "Get in touch with the Palle Mamidi mango farm team." },
};

export default function ContactPage() {
  return (
    <div className="flex flex-col min-h-screen bg-brand-cream">
      <TopBar />
      <Header />
      <main className="flex-1 max-w-3xl mx-auto py-16 px-6 lg:px-8 text-[#1B330F]">
        <h1 className="text-4xl font-[family-name:var(--font-playfair)] font-bold mb-4">Contact Us</h1>
        <p className="leading-relaxed opacity-90 mb-12">We are here to help you with any questions regarding your mango orders, shipping, or refunds.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white border border-[#1B330F]/10 p-8 rounded-3xl shadow-sm hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-brand-primary-green/10 text-brand-primary-green rounded-full flex items-center justify-center mb-6">
              <Mail className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold mb-2">Email Support</h2>
            <p className="opacity-80 mb-2">For general inquiries and order support:</p>
            <a href={`mailto:${SITE_CONFIG.contact.email}`} className="font-bold text-brand-primary-green hover:text-brand-orange transition-colors">{SITE_CONFIG.contact.email}</a>
          </div>

          <div className="bg-white border border-[#1B330F]/10 p-8 rounded-3xl shadow-sm hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-brand-primary-green/10 text-brand-primary-green rounded-full flex items-center justify-center mb-6">
              <Phone className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold mb-2">Phone Support</h2>
            <p className="opacity-80 mb-2">Speak directly to our farm team:</p>
            <a href={SITE_CONFIG.contact.phoneLink} className="font-bold text-brand-primary-green hover:text-brand-orange transition-colors">{SITE_CONFIG.contact.phone}</a>
          </div>

          <div className="bg-white border border-[#1B330F]/10 p-8 rounded-3xl shadow-sm hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-brand-primary-green/10 text-brand-primary-green rounded-full flex items-center justify-center mb-6">
              <MapPin className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold mb-2">Business Address</h2>
            <p className="opacity-80">
              {SITE_CONFIG.contact.address}
            </p>
          </div>

          <div className="bg-white border border-[#1B330F]/10 p-8 rounded-3xl shadow-sm hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-brand-primary-green/10 text-brand-primary-green rounded-full flex items-center justify-center mb-6">
              <Clock className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold mb-2">Support Timings</h2>
            <p className="opacity-80 font-medium">{SITE_CONFIG.contact.timings}</p>
            <p className="opacity-60 text-sm mt-2">We typically reply to all inquiries within 24 hours.</p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
