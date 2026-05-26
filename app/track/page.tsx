import type { Metadata } from "next";
import TopBar from "../components/TopBar";
import Header from "../components/Header";
import Footer from "../components/Footer";
import TrackForm from "./TrackForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Track Your Order",
  description: "Track your Palle Mamidi mango order using the phone number from checkout.",
  robots: { index: false, follow: false },
  alternates: { canonical: "/track" },
};

export default function TrackPage() {
  return (
    <div className="flex flex-col min-h-screen bg-brand-cream">
      <TopBar />
      <Header />
      <main className="flex-1 px-6 lg:px-12 py-12">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <h1 className="font-[family-name:var(--font-playfair)] text-3xl md:text-4xl font-bold text-brand-primary-green">
              Track Your Mangoes
            </h1>
            <p className="text-brand-primary-green/60 mt-3 text-sm">
              Enter the phone number you used at checkout to see all your orders and their live status.
            </p>
          </div>
          <TrackForm />
        </div>
      </main>
      <Footer />
    </div>
  );
}
