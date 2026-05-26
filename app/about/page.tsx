import type { Metadata } from "next";
import React from "react";
import Link from "next/link";
import { Leaf, Award, Heart, ShieldCheck, ArrowRight } from "lucide-react";
import TopBar from "../components/TopBar";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { SITE_CONFIG } from "../lib/config";
import OptimizedImage from "../components/OptimizedImage";

export const metadata: Metadata = {
  title: "About Us",
  description: "Learn about SMR farms, our traditional village mango farms in Ulavapadu, Andhra Pradesh, and our commitment to naturally ripened, chemical-free mangoes.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: "About SMR farms",
    description: "Discover our journey of growing and delivering naturally ripened village mangoes chemical-free from SMR farms.",
  },
};

export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-screen bg-brand-cream text-[#1B330F]">
      <TopBar />
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-20 px-6 lg:px-12 bg-gradient-to-b from-brand-primary-green/5 to-transparent text-center">
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center space-x-2 bg-brand-primary-green/10 text-brand-primary-green px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">
              <Leaf className="w-3.5 h-3.5 text-[#D27E1C]" />
              <span>Our Story</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-[family-name:var(--font-playfair)] font-bold leading-tight">
              About <span className="text-[#D27E1C]">Palle Mamidi</span>
            </h1>
            <p className="text-lg md:text-xl text-[#3F4E34]/80 leading-relaxed font-medium">
              {SITE_CONFIG.tagline}
            </p>
          </div>
        </section>

        {/* Narrative / History */}
        <section className="py-12 px-6 lg:px-12">
          <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-12 lg:gap-16">
            <div className="flex-1 space-y-6">
              <h2 className="text-2xl md:text-3xl font-[family-name:var(--font-playfair)] font-bold text-[#1B330F]">
                Nurtured by Nature, Perfected by Tradition
              </h2>
              <p className="text-[#3F4E34]/90 leading-relaxed">
                At Palle Mamidi (meaning "Village Mango" in Telugu), we believe the finest things in life cannot be rushed. Our generational farms, rooted in the fertile lands of Ulavapadu, Andhra Pradesh, are dedicated to preserving the authentic rich flavour of traditional mango varieties.
              </p>
              <p className="text-[#3F4E34]/90 leading-relaxed">
                Every mango we harvest represents a legacy of sustainable agriculture, family dedication, and respect for nature. We care for our trees using traditional methods, ensuring the soil remains fertile and the crop is healthy without relies on harsh chemicals or growth-promoters.
              </p>
            </div>
            <div className="flex-1 w-full max-w-md">
              <div className="aspect-[4/3] rounded-3xl overflow-hidden border border-[#1B330F]/10 shadow-lg relative bg-white/40 p-4">
                <OptimizedImage
                  src="/mangoes/mango-6.png"
                  alt="Naturally Ripening Mangoes"
                  width={600}
                  quality={80}
                  className="w-full h-full"
                  imgClassName="object-contain hover:scale-105 transition-all duration-500"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Core Pillars */}
        <section className="py-16 px-6 lg:px-12 bg-white/50 border-y border-[#1B330F]/5">
          <div className="max-w-5xl mx-auto space-y-12">
            <div className="text-center space-y-2">
              <h2 className="text-2xl md:text-3xl font-[family-name:var(--font-playfair)] font-bold text-[#1B330F]">
                Our Promises to You
              </h2>
              <p className="text-sm text-[#3F4E34]/70 uppercase tracking-widest font-bold">
                Why mango lovers choose Palle Mamidi
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Pillar 1 */}
              <div className="bg-brand-cream/40 border border-[#1B330F]/5 p-8 rounded-3xl flex flex-col items-center text-center space-y-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-[#D27E1C]/10 text-[#D27E1C] rounded-full flex items-center justify-center">
                  <Award className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold">100% Naturally Ripened</h3>
                <p className="text-sm text-[#3F4E34]/80 leading-relaxed">
                  We pack our mangoes in traditional hay boxes to ripen naturally. We never use artificial calcium carbide or ethylene gas treatment.
                </p>
              </div>

              {/* Pillar 2 */}
              <div className="bg-brand-cream/40 border border-[#1B330F]/5 p-8 rounded-3xl flex flex-col items-center text-center space-y-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-[#D27E1C]/10 text-[#D27E1C] rounded-full flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold">Chemical-Free Harvest</h3>
                <p className="text-sm text-[#3F4E34]/80 leading-relaxed">
                  Our trees grow in a natural ecosystem. Every harvest is free from chemical sprays, preservatives, or synthetic ripening agents.
                </p>
              </div>

              {/* Pillar 3 */}
              <div className="bg-brand-cream/40 border border-[#1B330F]/5 p-8 rounded-3xl flex flex-col items-center text-center space-y-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-[#D27E1C]/10 text-[#D27E1C] rounded-full flex items-center justify-center">
                  <Heart className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold">Direct from Village Farms</h3>
                <p className="text-sm text-[#3F4E34]/80 leading-relaxed">
                  By bypassing distributors, we ensure mangoes arrive fresher at your doorstep, while supporting rural farming communities.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 px-6 lg:px-12 text-center">
          <div className="max-w-2xl mx-auto space-y-8 bg-[#1B330F] text-brand-cream p-10 md:p-16 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
            {/* Background design elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#D27E1C]/20 rounded-full blur-2xl -ml-10 -mb-10" />

            <h2 className="text-3xl md:text-4xl font-[family-name:var(--font-playfair)] font-bold leading-tight">
              Taste the Real, Rich Village Mangoes Today
            </h2>
            <p className="text-brand-cream/80 text-sm md:text-base max-w-md mx-auto leading-relaxed">
              Order fresh, naturally tree-ripened Banganapalle, Cheruku Rasalu, and other premium varieties directly from our Andhra orchards.
            </p>
            <div className="pt-2 flex justify-center">
              <Link
                href="/mangoes"
                className="bg-[#DE8A24] text-white px-8 py-4 rounded-full font-bold flex items-center space-x-3 hover:bg-[#DE8A24]/90 transition-all shadow-lg group"
              >
                <span>Browse our Fresh Harvest</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
