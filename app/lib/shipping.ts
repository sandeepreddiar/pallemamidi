/**
 * Dynamic RTC Cargo Shipping & Packaging Fee Calculator
 * 
 * Calculated dynamically using shipping brackets and optimal parcel breakdown.
 */

export type ShippingZone = "AP" | "TS" | "BENGALURU" | "CHENNAI";

// Shipping Rates as defined by competitor pricing structure
export const SHIPPING_RATES: Record<ShippingZone, Record<number, number>> = {
  AP: {
    10: 250,
    20: 250,
    30: 450,
    40: 550,
    50: 650,
    60: 700,
    100: 950
  },
  TS: {
    10: 300,
    20: 350,
    30: 600,
    40: 600,
    50: 900,
    60: 900,
    100: 1200
  },
  BENGALURU: {
    10: 500,
    20: 500,
    30: 1000,
    40: 1000,
    50: 1500,
    60: 1500,
    100: 1000
  },
  CHENNAI: {
    10: 500,
    20: 500,
    30: 1000,
    40: 1000,
    50: 1500,
    60: 1500,
    100: 1000
  }
};

/**
 * Calculates the packing fee based on the weight of the order.
 * Proportional: ₹50 for 10kg (₹5 per kg).
 */
export function calculatePackingFee(weightKg: number): number {
  if (weightKg <= 0) return 0;
  return Math.ceil(weightKg * 5);
}

/**
 * Maps state and city strings to a shipping zone.
 */
export function getShippingZone(state: string = "", city: string = ""): ShippingZone {
  const s = state.toLowerCase();
  const c = city.toLowerCase();

  // Chennai and Tamil Nadu
  if (
    s.includes("tamil") || 
    s.includes("chennai") || 
    s.includes("tn") || 
    c.includes("chennai")
  ) {
    return "CHENNAI";
  }

  // Bangalore and Karnataka
  if (
    s.includes("karnataka") || 
    s.includes("bangalore") || 
    s.includes("bengaluru") || 
    s.includes("ka") || 
    c.includes("bangalore") || 
    c.includes("bengaluru")
  ) {
    return "BENGALURU";
  }

  // Andhra Pradesh
  if (
    s.includes("andhra") || 
    s.includes("ap")
  ) {
    return "AP";
  }

  // Default to Telangana (farm center or default region)
  return "TS";
}

/**
 * Calculates the shipping fee based on destination state, city, and total weight.
 * Uses a dynamic programming / breakdown solver to optimize combinations.
 */
export function calculateShippingFee(state: string, city: string, weightKg: number): number {
  const zone = getShippingZone(state, city);
  const rates = SHIPPING_RATES[zone];

  if (weightKg <= 0) return 0;

  // Round weight up to the nearest 10kg as parcel brackets are in 10kg increments
  const roundedWeight = Math.ceil(weightKg / 10) * 10;

  // If weight exactly matches a standard bracket, return the exact rate from the table
  if (roundedWeight in rates) {
    return rates[roundedWeight as keyof typeof rates];
  }

  // If weight is above 100kg, split it into multiples of 100kg and calculate the remainder
  if (roundedWeight > 100) {
    const hundreds = Math.floor(roundedWeight / 100);
    const remainder = roundedWeight % 100;

    const baseCost = hundreds * rates[100];
    const remainderCost = remainder > 0 ? calculateShippingFee(state, city, remainder) : 0;

    return baseCost + remainderCost;
  }

  // For intermediate weights below 100kg (e.g., 70kg, 80kg, 90kg)
  // Solve for the minimum cost combination of standard brackets [10, 20, 30, 40, 50, 60, 100]
  const dp: Record<number, number> = { 0: 0 };
  const availableWeights = [10, 20, 30, 40, 50, 60, 100];

  for (let w = 10; w <= roundedWeight; w += 10) {
    if (w in rates) {
      dp[w] = rates[w as keyof typeof rates];
      continue;
    }
    
    let minCost = Infinity;
    for (const aw of availableWeights) {
      if (w >= aw) {
        const cost = dp[w - aw] + rates[aw as keyof typeof rates];
        if (cost < minCost) {
          minCost = cost;
        }
      }
    }
    dp[w] = minCost;
  }

  return dp[roundedWeight] || 0;
}
