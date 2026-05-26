import Link from "next/link";
import { SITE_CONFIG } from "@/app/lib/config";

export default function Footer() {
  return (
    <footer className="bg-[#1B330F] text-brand-cream pt-12 pb-8 px-6 lg:px-12">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-12 mb-12">
          {/* Brand */}
          <div className="space-y-6 col-span-2 md:col-span-1">
            <h2 className="font-[family-name:var(--font-telugu)] text-4xl font-bold">{SITE_CONFIG.teluguName}</h2>
            <p className="text-brand-cream/60 text-sm leading-relaxed">
              {SITE_CONFIG.tagline}
            </p>
            <div className="flex items-center space-x-4">
              <a
                href="https://www.instagram.com/pallemamidi/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center hover:bg-brand-cream hover:text-[#1B330F] transition-all"
                aria-label="Instagram"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-5 h-5"
                >
                  <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                </svg>
              </a>
              <a
                href={`mailto:${SITE_CONFIG.contact.email}`}
                className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center hover:bg-brand-cream hover:text-[#1B330F] transition-all"
                aria-label="Gmail"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-5 h-5"
                >
                  <rect width="20" height="16" x="2" y="4" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-6">
            <h3 className="font-bold text-xl">Quick Links</h3>
            <ul className="space-y-4 text-brand-cream/60 text-sm font-medium">
              <li><Link href="/" className="hover:text-brand-cream transition-colors">Home</Link></li>
              <li><Link href="/mangoes" className="hover:text-brand-cream transition-colors">Our Mangoes</Link></li>
              <li><Link href="/track" className="hover:text-brand-cream transition-colors">Track Order</Link></li>
              <li><Link href="/about" className="hover:text-brand-cream transition-colors">About Us</Link></li>
              <li><a href="#why" className="hover:text-brand-cream transition-colors">Why Choose Us</a></li>
            </ul>
          </div>

          {/* Policies */}
          <div className="space-y-6">
            <h3 className="font-bold text-xl">Policies & Info</h3>
            <ul className="space-y-4 text-brand-cream/60 text-sm font-medium">
              <li><Link href="/privacy-policy" className="hover:text-brand-cream transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms-and-conditions" className="hover:text-brand-cream transition-colors">Terms & Conditions</Link></li>
              <li><Link href="/refund-policy" className="hover:text-brand-cream transition-colors">Refund Policy</Link></li>
              <li><Link href="/shipping-policy" className="hover:text-brand-cream transition-colors">Shipping Policy</Link></li>
              <li><Link href="/contact" className="hover:text-brand-cream transition-colors">Contact</Link></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row w-full justify-between items-center gap-6 text-xs text-brand-cream/40 font-bold tracking-widest text-center md:text-left">
          <p className="uppercase">© {new Date().getFullYear()} {SITE_CONFIG.name}. All Rights Reserved.</p>
          <div className="flex justify-center md:justify-end">
            <p className="text-[#D27E1C] uppercase font-bold flex items-center space-x-2">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
              <span>{SITE_CONFIG.payment.gatewayInfo}</span>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
