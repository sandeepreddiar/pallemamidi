"use client";

// Trivial touch to trigger hot reload compilation

import { useState } from "react";
import OptimizedImage from "./OptimizedImage";
import Link from "next/link";
import { Plus, Minus, ShoppingBasket, Check } from "lucide-react";
import { useCartStore } from "@/app/store/useCartStore";
import { varietySlug } from "@/app/lib/seo";

interface MangoCardProps {
  mango: {
    id: number;
    name: string;
    description: string;
    image: string;
    pricePerKg: number;
    allowedWeightsKg: number[];
    status: 'AVAILABLE' | 'OUT_OF_SEASON' | 'SOLD_OUT' | 'PREBOOKING';
  };
}

// Helper functions for sequence generation: 1, 3, 5, 10, 13, 15, 20, 23, 25, 30...
const getNextSequenceWeight = (current: number, allowed: number[]): number => {
  const base = allowed.filter(x => x !== 1).sort((a, b) => a - b);
  if (base.length === 0) return current + 1;
  if (current < 1) return 1;
  if (current === 1) return base[0];

  let best = Infinity;
  const startN = Math.max(0, Math.floor(current / 10) - 1);
  for (let n = startN; n <= startN + 3; n++) {
    for (const a of base) {
      const val = 10 * n + a;
      if (val > current && val < best) {
        best = val;
      }
    }
  }
  return best === Infinity ? current + 1 : best;
};

const getPrevSequenceWeight = (current: number, allowed: number[]): number => {
  const base = allowed.filter(x => x !== 1).sort((a, b) => a - b);
  if (base.length === 0) return Math.max(1, current - 1);
  if (current <= 1) return 1;
  if (current <= base[0]) return 1;

  let best = 1;
  const startN = Math.max(0, Math.floor(current / 10) - 1);
  for (let n = startN; n <= startN + 3; n++) {
    for (const a of base) {
      const val = 10 * n + a;
      if (val < current && val > best) {
        best = val;
      }
    }
  }
  return best;
};

const isValidSequenceWeight = (w: number, allowed: number[]): boolean => {
  if (w <= 1 || !Number.isInteger(w)) return false;
  const base = allowed.filter(x => x !== 1);
  if (base.length === 0) return true;
  return base.some(a => (w - a) >= 0 && (w - a) % 10 === 0);
};

export default function MangoCard({ mango }: MangoCardProps) {
  const defaultWeight = mango.allowedWeightsKg[0] || 5;
  const [weight, setWeight] = useState<number | string>(defaultWeight);
  const [isAdded, setIsAdded] = useState(false);
  const addItem = useCartStore((state) => state.addItem);
  const toggleCart = useCartStore((state) => state.toggleCart);

  // Parse weight to number safely, default to 0 if invalid
  const numericWeight = typeof weight === "number" ? weight : parseFloat(weight) || 0;
  const price = Math.round(numericWeight * mango.pricePerKg);

  const handleWeightChange = (val: number | string) => {
    if (typeof val === "number") {
      if (isValidSequenceWeight(val, mango.allowedWeightsKg)) {
        setWeight(val);
      }
    } else {
      // Allow empty string or digits for typing
      if (val === "" || /^\d+$/.test(val)) {
        setWeight(val);
      }
    }
  };

  const handleIncrement = () => {
    setWeight(getNextSequenceWeight(numericWeight, mango.allowedWeightsKg));
  };

  const handleDecrement = () => {
    setWeight(getPrevSequenceWeight(numericWeight, mango.allowedWeightsKg));
  };

  const handleAddToCart = () => {
    if (numericWeight <= 1 || (mango.status !== 'AVAILABLE' && mango.status !== 'PREBOOKING')) return;

    // Safety fallback: ensure only valid box weight is passed to store
    const finalWeight = isValidSequenceWeight(numericWeight, mango.allowedWeightsKg)
      ? numericWeight
      : (mango.allowedWeightsKg.find(x => x !== 1) || 5);

    addItem({
      id: mango.id,
      name: mango.name,
      image: mango.image,
      weight: finalWeight,
      pricePerKg: mango.pricePerKg,
    });
    
    setIsAdded(true);
    toggleCart(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  return (
    <div className="bg-brand-primary-green rounded-2xl border border-white/10 p-2.5 flex flex-col items-center text-center hover:shadow-[0_20px_50px_rgba(27,51,15,0.4)] transition-all duration-500 hover:-translate-y-1 group relative overflow-hidden isolate">
      {/* Dynamic Background Glow */}
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-white/5 rounded-full blur-3xl group-hover:bg-white/10 transition-colors duration-700 pointer-events-none -z-10" />
      
      {/* Image Container */}
      <div className="relative w-full aspect-[4/3] mb-2 overflow-hidden rounded-xl bg-white/5 flex items-center justify-center p-2">
        <Link href={`/mangoes/${varietySlug(mango.name)}`} className="absolute inset-0 z-10" aria-label={`View ${mango.name} mango details`}>
          <OptimizedImage
            src={mango.image}
            alt={`${mango.name} mango — farm fresh from Palle Mamidi`}
            width={450}
            quality={80}
            className="absolute inset-0 w-full h-full"
            imgClassName="object-contain group-hover:scale-110 transition-transform duration-700 ease-out"
          />
        </Link>
        <div className={`absolute top-2 right-2 backdrop-blur-md border text-white text-[8px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-full pointer-events-none ${
          mango.status === 'AVAILABLE'
            ? 'bg-brand-cream/10 border-white/10 text-brand-cream'
            : mango.status === 'PREBOOKING'
            ? 'bg-cyan-500/80 border-cyan-500/20 text-white'
            : mango.status === 'SOLD_OUT'
            ? 'bg-red-500/80 border-red-500/20'
            : 'bg-amber-600/80 border-amber-600/20'
        }`}>
          {mango.status === 'AVAILABLE' ? 'Fresh Arrival' : mango.status === 'PREBOOKING' ? 'Pre-book' : mango.status === 'SOLD_OUT' ? 'Sold Out' : 'Out of Season'}
        </div>
      </div>

      {/* Info */}
      <div className="mb-2 relative z-10">
        <h3 className="font-[family-name:var(--font-playfair)] text-xl md:text-2xl font-bold text-brand-orange group-hover:text-brand-orange transition-colors duration-300">
          <Link href={`/mangoes/${varietySlug(mango.name)}`} className="hover:underline">
            {mango.name}
          </Link>
        </h3>
        <p className="text-brand-cream/80 text-[11px] leading-relaxed h-9 overflow-hidden">
          {mango.description}
        </p>
      </div>

      {/* Weight Selector */}
      <div className={`w-full space-y-1.5 mb-2 relative z-10 ${(mango.status !== 'AVAILABLE' && mango.status !== 'PREBOOKING') ? 'opacity-30 pointer-events-none' : ''}`}>
        <div className="flex justify-between items-center bg-black/20 rounded-2xl p-1 gap-1">
          {mango.allowedWeightsKg.filter((w) => w !== 1).map((w) => (
            <button
              key={w}
              onClick={() => setWeight(w)}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all duration-300 cursor-pointer relative z-20 ${
                numericWeight === w 
                  ? "bg-brand-cream text-brand-primary-green shadow-xl scale-[1.02]" 
                  : "text-brand-cream/60 hover:text-brand-cream hover:bg-white/5"
              }`}
            >
              {w}kg
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between bg-white/5 rounded-xl p-1 border border-white/10 group/weight transition-all hover:bg-white/10 relative z-20">
          <div className="flex items-center space-x-2">
            <button 
              onClick={(e) => { e.stopPropagation(); handleDecrement(); }}
              className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-brand-cream hover:bg-brand-orange hover:text-white transition-all cursor-pointer active:scale-90 relative z-30"
            >
              <Minus className="w-4 h-4" />
            </button>
            
            <div className="flex flex-col items-center min-w-[50px] relative z-30">
              <div className="flex items-baseline space-x-1">
                <input
                  type="text"
                  value={weight}
                  onChange={(e) => handleWeightChange(e.target.value)}
                  className="bg-transparent border-none outline-none text-brand-cream font-bold text-xl w-10 text-center p-0 placeholder:text-brand-cream/20 cursor-text"
                  placeholder="0"
                />
                <span className="text-brand-cream/40 text-[10px] uppercase font-bold">Kg</span>
              </div>
              <span className="text-[8px] text-brand-cream/20 uppercase font-black tracking-widest">Box Weight</span>
            </div>

            <button 
              onClick={(e) => { e.stopPropagation(); handleIncrement(); }}
              className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-brand-cream hover:bg-brand-orange hover:text-white transition-all cursor-pointer active:scale-90 relative z-30"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="text-right border-l border-white/10 pl-4 relative z-30">
            <span className="block text-brand-cream/40 text-[10px] uppercase font-bold mb-0.5">Total Price</span>
            <div className="flex items-center justify-end text-brand-cream font-bold text-2xl tabular-nums animate-in fade-in slide-in-from-bottom-2 duration-300">
              <span className="text-sm mr-0.5 opacity-60 font-medium">₹</span>
              {price.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      <button 
        onClick={handleAddToCart}
        disabled={isAdded || (mango.status !== 'AVAILABLE' && mango.status !== 'PREBOOKING') || numericWeight === 1}
        className={`w-full py-3 rounded-xl font-bold flex items-center justify-center space-x-2 transition-all duration-300 transform active:scale-95 cursor-pointer relative z-10 text-sm ${
          isAdded 
            ? "bg-green-500 text-white" 
            : (mango.status !== 'AVAILABLE' && mango.status !== 'PREBOOKING')
            ? "bg-white/10 text-brand-cream/40 cursor-not-allowed border border-white/5"
            : numericWeight === 1
            ? "bg-white/10 text-brand-cream/60 cursor-not-allowed border border-white/5"
            : "bg-brand-cream text-brand-primary-green hover:shadow-[0_10px_20px_rgba(242,232,207,0.3)]"
        }`}
      >
        {isAdded ? (
          <>
            <Check className="w-5 h-5" />
            <span>Added to Cart</span>
          </>
        ) : numericWeight === 1 ? (
          <span>Select Box Size</span>
        ) : mango.status === 'PREBOOKING' ? (
          <>
            <ShoppingBasket className="w-5 h-5" />
            <span>Pre-book Box</span>
          </>
        ) : mango.status === 'SOLD_OUT' ? (
          <span>Sold Out</span>
        ) : mango.status === 'OUT_OF_SEASON' ? (
          <span>Out of Season</span>
        ) : (
          <>
            <ShoppingBasket className="w-5 h-5" />
            <span>Add to Cart</span>
          </>
        )}
      </button>
    </div>
  );
}
