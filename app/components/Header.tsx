"use client";

import { useEffect, useState } from "react";
import OptimizedImage from "./OptimizedImage";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingCart } from "lucide-react";
import { useCartStore } from "@/app/store/useCartStore";

export default function Header() {
  const pathname = usePathname();
  const { items, toggleCart, _hasHydrated } = useCartStore();
  const [isMounted, setIsMounted] = useState(false);


  useEffect(() => {
    setIsMounted(true);
  }, []);

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Our Mangoes", href: "/mangoes" },
    { name: "About Us", href: "/about" },
    { name: "Track Order", href: "/track" },
    { name: "Contact Us", href: "/contact" },
  ];

  const cartItemCount = items.length;

  return (
    <div className="sticky top-0 z-50 w-full flex flex-col">
      {/* Minimum Order Announcement Banner */}
      <div className="bg-brand-orange text-brand-cream text-center text-[10px] md:text-xs py-2.5 px-4 font-bold tracking-wide shadow-sm flex items-center justify-center gap-2 animate-in fade-in slide-in-from-top duration-500 relative z-50 border-b border-brand-cream/10">
        <span className="inline-block bg-white/20 px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wider font-extrabold">Notice</span>
        <span>Orders are accepted for <span className="underline decoration-2 decoration-white">10 kg</span> and above only.</span>
      </div>

      <header className="px-6 lg:px-12 py-2 flex items-center justify-between relative bg-brand-cream/80 backdrop-blur-md border-b border-[#1B330F]/5">
        {/* Logo & Brand */}
        <div className="flex items-center space-x-0">
          <Link href="/" className="flex items-center gap-2 group">
            <OptimizedImage
              src="/logo.png"
              alt="Palle Mamidi Logo"
              width={100}
              quality={85}
              className="w-[50px] h-[50px]"
              imgClassName="object-contain drop-shadow-sm group-hover:scale-105 transition-transform"
              transparent={true}
            />
            <div className="flex flex-col">
              <h1 className="font-[family-name:var(--font-telugu)] text-2xl lg:text-3xl font-bold text-[#2E4D25] leading-tight tracking-tight">
                పల్లె మామిడి
              </h1>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="hidden lg:flex items-center space-x-6 text-[#2E4D25] font-medium text-xs xl:text-sm">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link 
                key={link.name}
                href={link.href} 
                className={`relative transition-colors ${
                  isActive 
                    ? "text-[#2E4D25] font-bold" 
                    : "hover:text-[#DE8A24]"
                }`}
              >
                {link.name}
                {isActive && (
                  <span className="absolute left-0 -bottom-1.5 w-full h-[2px] bg-[#DE8A24]"></span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Actions */}
        <div className="flex items-center space-x-4 lg:space-x-6 text-[#2E4D25]">
          
          <button 
            onClick={() => toggleCart(true)}
            className="relative hover:text-[#DE8A24] transition-colors group cursor-pointer"
          >
            <div className="bg-brand-primary-green/5 p-1.5 rounded-full group-hover:bg-brand-primary-green/10 transition-colors">
              <ShoppingCart className="w-5 h-5 stroke-[1.5]" />
            </div>
            {isMounted && _hasHydrated && cartItemCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#DE8A24] text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full animate-in zoom-in duration-300 border-2 border-brand-cream">
                {cartItemCount}
              </span>
            )}
          </button>
        </div>
      </header>
    </div>
  );
}
