"use client";

import OptimizedImage from "./OptimizedImage";
import { X, Trash2, ShoppingBag, ArrowRight, Minus, Plus, Check } from "lucide-react";
import { useCartStore } from "@/app/store/useCartStore";
import { useEffect, useState } from "react";
import CheckoutModal from "./CheckoutModal";

export default function CartDrawer() {
  const { items, isCartOpen, toggleCart, removeItem, updateQuantity, _hasHydrated } = useCartStore();
  const [isMounted, setIsMounted] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isCartOpen) {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, [isCartOpen]);

  if (!isMounted || !_hasHydrated) return null;

  const subtotal = items.reduce((acc, item) => acc + item.totalPrice, 0);
  const totalWeight = items.reduce((acc, item) => acc + (item.weight * item.quantity), 0);
  const isMinimumWeightMet = totalWeight >= 10;
  const weightRemaining = Math.max(0, 10 - totalWeight);

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] transition-opacity duration-500 ${
          isCartOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => toggleCart(false)}
      />

      {/* Drawer */}
      <div 
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-brand-cream z-[101] shadow-2xl transition-transform duration-500 ease-out transform ${
          isCartOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-[#1B330F]/10 flex items-center justify-between bg-white/50">
            <div className="flex items-center space-x-3">
              <div className="bg-brand-primary-green p-2 rounded-xl">
                <ShoppingBag className="w-5 h-5 text-brand-cream" />
              </div>
              <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-brand-primary-green">
                Your Basket
              </h2>
            </div>
            <button 
              onClick={() => toggleCart(false)}
              className="p-2 hover:bg-black/5 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-6 h-6 text-brand-primary-green" />
            </button>
          </div>

          {/* Items List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                <div className="w-24 h-24 bg-brand-primary-green/5 rounded-full flex items-center justify-center">
                  <ShoppingBag className="w-10 h-10 text-brand-primary-green/20" />
                </div>
                <p className="text-brand-primary-green/60 font-medium">Your basket is empty</p>
                <button 
                  onClick={() => toggleCart(false)}
                  className="text-brand-primary-green font-bold hover:underline cursor-pointer"
                >
                  Start Shopping
                </button>
              </div>
            ) : (
              items.map((item) => (
                <div 
                  key={`${item.id}-${item.weight}`}
                  className="flex items-start space-x-4 bg-white p-4 rounded-2xl shadow-sm border border-[#1B330F]/5 group"
                >
                  <div className="relative w-20 h-20 bg-brand-primary-green/5 rounded-xl overflow-hidden flex-shrink-0">
                    <OptimizedImage
                      src={item.image}
                      alt={item.name}
                      width={100}
                      quality={80}
                      className="absolute inset-0 w-full h-full"
                      imgClassName="object-contain p-2 group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-brand-primary-green truncate">
                          {item.name}
                        </h3>
                        <p className="text-xs text-brand-primary-green/60 font-semibold uppercase tracking-wider">
                          {item.weight}kg Pack
                        </p>
                      </div>
                      <button 
                        onClick={() => removeItem(item.id, item.weight)}
                        className="text-red-500/40 hover:text-red-500 transition-colors p-1 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center bg-brand-primary-green/5 rounded-lg p-1 space-x-2">
                        <button 
                          onClick={() => updateQuantity(item.id, item.weight, -1)}
                          className="w-6 h-6 flex items-center justify-center text-brand-primary-green hover:bg-brand-primary-green hover:text-brand-cream rounded-md transition-all cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="font-bold text-brand-primary-green min-w-[20px] text-center text-sm tabular-nums">
                          {item.quantity}
                        </span>
                        <button 
                          onClick={() => updateQuantity(item.id, item.weight, 1)}
                          className="w-6 h-6 flex items-center justify-center text-brand-primary-green hover:bg-brand-primary-green hover:text-brand-cream rounded-md transition-all cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <span className="font-bold text-lg text-brand-primary-green tabular-nums">
                        ₹{item.totalPrice.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {items.length > 0 && (
            <div className="p-6 bg-white border-t border-[#1B330F]/10 space-y-4">
              {/* Minimum Weight Requirement Progress Tracker */}
              {!isMinimumWeightMet ? (
                <div className="bg-brand-orange/5 border border-brand-orange/20 rounded-2xl p-4 space-y-2 animate-in fade-in duration-300">
                  <div className="flex justify-between items-center text-xs font-bold text-brand-primary-green">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-brand-orange animate-pulse" />
                      Basket Weight: {totalWeight} kg
                    </span>
                    <span className="text-brand-orange">Min. 10 kg Required</span>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="w-full h-2 bg-brand-primary-green/10 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-brand-orange transition-all duration-500 ease-out" 
                      style={{ width: `${Math.min((totalWeight / 10) * 100, 100)}%` }}
                    />
                  </div>
                  
                  <p className="text-[11px] text-brand-primary-green/70 text-center font-medium">
                    Add <span className="font-bold text-brand-orange">{weightRemaining} kg</span> more of any variety to unlock checkout.
                  </p>
                </div>
              ) : (
                <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-3.5 flex items-center space-x-3 text-green-800 text-xs animate-in fade-in duration-300">
                  <div className="bg-green-500 text-white rounded-full p-1 shrink-0">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 font-semibold text-brand-primary-green">
                    Minimum order requirement met! ({totalWeight} kg)
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-brand-primary-green/60 font-medium">Subtotal</span>
                <span className="text-2xl font-bold text-brand-primary-green font-[family-name:var(--font-playfair)] tabular-nums">
                  ₹{subtotal.toLocaleString()}
                </span>
              </div>
              <p className="text-[10px] text-brand-primary-green/40 text-center uppercase tracking-widest font-bold">
                Taxes and shipping calculated at checkout
              </p>
              <button 
                onClick={() => isMinimumWeightMet && setIsCheckoutOpen(true)}
                disabled={!isMinimumWeightMet}
                className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center space-x-3 transition-all group overflow-hidden relative cursor-pointer ${
                  isMinimumWeightMet 
                    ? "bg-brand-primary-green text-brand-cream hover:shadow-xl" 
                    : "bg-brand-primary-green/20 text-brand-primary-green/40 cursor-not-allowed border border-brand-primary-green/5"
                }`}
              >
                <span className="relative z-10">Proceed to Checkout</span>
                <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
                {isMinimumWeightMet && (
                  <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      <CheckoutModal isOpen={isCheckoutOpen} onClose={() => setIsCheckoutOpen(false)} />
    </>
  );
}
