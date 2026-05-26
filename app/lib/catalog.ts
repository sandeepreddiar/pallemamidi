// DB-backed mango catalog. The static list below is the SEED ONLY — once seeded,
// admins manage prices, descriptions, images, and availability from /admin/inventory.
// The catalog table is the runtime source of truth for prices and stock status.

import "server-only";
import { db } from "@/db/index";
import { varieties, type Variety } from "@/db/schema";
import { eq, asc, and } from "drizzle-orm";
import { cache } from "react";

// MangoVariety remains a string union of the canonical Andhra varieties. We use it
// for SEO/content lookups. The DB allows arbitrary varchar(80) names, so admin-added
// seasonal varieties simply won't have matching editorial content — that's fine.
export type MangoVariety =
  | 'Banganapalle'
  | 'Cheruku Rasalu'
  | 'Sindhura'
  | 'Totapuri'
  | 'Natu Rasalu'
  | 'Aaku Palli / Native Varieties'
  | 'Imam Pasand'
  | 'Neelum'
  | 'Pickle Mango';

export type VarietyStatus = 'AVAILABLE' | 'OUT_OF_SEASON' | 'SOLD_OUT' | 'PREBOOKING';

export interface CatalogEntry {
  id: string;
  name: string;
  description: string;
  image: string;
  pricePerKg: number;
  allowedWeightsKg: number[];
  status: VarietyStatus;
  sortOrder: number;
}

export const DEFAULT_VARIETIES: Omit<CatalogEntry, "id">[] = [
  { name: 'Banganapalle',                 description: 'Sweet, fragrant, and rich in juice. The pride of South India.',                 image: '/mangoes/mango-6.png', pricePerKg: 100, allowedWeightsKg: [1, 3, 5, 10], status: 'AVAILABLE', sortOrder: 1 },
  { name: 'Cheruku Rasalu',               description: 'Intensely sweet and juicy native variety, named after sugarcane (Cheruku) for its honey-like taste.', image: '/mangoes/mango-8.png', pricePerKg: 100, allowedWeightsKg: [1, 3, 5, 10], status: 'AVAILABLE', sortOrder: 2 },
  { name: 'Sindhura',                     description: 'Beautiful red-blushed skin with extremely sweet, aromatic, and fiberless pulp.', image: '/mangoes/mango-2.png', pricePerKg: 100, allowedWeightsKg: [1, 3, 5, 10], status: 'AVAILABLE', sortOrder: 3 },
  { name: 'Totapuri',                     description: 'Unique oblong shape, perfect for juice and fresh salads.',                     image: '/mangoes/mango-5.png', pricePerKg:  80, allowedWeightsKg: [1, 3, 5, 10], status: 'AVAILABLE', sortOrder: 4 },
  { name: 'Natu Rasalu',                  description: 'Traditional native juicy variety, extremely sweet and popular for fresh pulp extraction.', image: '/mangoes/mango-1.png', pricePerKg:  90, allowedWeightsKg: [1, 3, 5, 10], status: 'AVAILABLE', sortOrder: 5 },
  { name: 'Aaku Palli / Native Varieties', description: 'Traditional field-grown native varieties, rich in local heritage flavors.',      image: '/mangoes/mango-3.png', pricePerKg:  90, allowedWeightsKg: [1, 3, 5, 10], status: 'AVAILABLE', sortOrder: 6 },
  { name: 'Imam Pasand',                  description: "The 'King of Mangoes' — unmatched rich, creamy, fiberless custard-like sweetness.", image: '/mangoes/mango-9.png', pricePerKg: 120, allowedWeightsKg: [1, 3, 5, 10], status: 'AVAILABLE', sortOrder: 7 },
  { name: 'Neelum',                       description: 'Late-season treasure, firm and exceptionally sweet with a rich signature scent.', image: '/mangoes/mango-7.png', pricePerKg:  80, allowedWeightsKg: [1, 3, 5, 10], status: 'AVAILABLE', sortOrder: 8 },
  { name: 'Pickle Mango',                 description: 'Tangy, firm, and essential for traditional festive dishes, pickles, and chutneys.', image: '/mangoes/mango-4.png', pricePerKg:  75, allowedWeightsKg: [1, 3, 5, 10], status: 'AVAILABLE', sortOrder: 9 },
];

function rowToEntry(row: Variety): CatalogEntry {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    image: row.image,
    pricePerKg: Number(row.pricePerKg),
    allowedWeightsKg: parseWeights(row.allowedWeights),
    status: row.status,
    sortOrder: row.sortOrder,
  };
}

export function parseWeights(csv: string): number[] {
  return csv
    .split(",")
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isInteger(n) && n > 0);
}

export function serializeWeights(arr: number[]): string {
  return Array.from(new Set(arr.filter((n) => Number.isInteger(n) && n > 0))).join(",");
}

// On-demand seed. Idempotent: synchronizes the varieties table with the DEFAULT_VARIETIES config.
export async function ensureVarietiesSeeded(): Promise<void> {
  // 1. Insert or update default varieties atomically
  for (const v of DEFAULT_VARIETIES) {
    await db.insert(varieties)
      .values({
        name: v.name,
        description: v.description,
        image: v.image,
        pricePerKg: v.pricePerKg.toFixed(2),
        allowedWeights: serializeWeights(v.allowedWeightsKg),
        status: v.status,
        sortOrder: v.sortOrder,
        isActive: true,
      })
      .onConflictDoUpdate({
        target: varieties.name,
        set: {
          description: v.description,
          image: v.image,
          pricePerKg: v.pricePerKg.toFixed(2),
          allowedWeights: serializeWeights(v.allowedWeightsKg),
          sortOrder: v.sortOrder,
          isActive: true,
        },
      });
  }

  // 2. Remove obsolete varieties that are no longer in DEFAULT_VARIETIES
  const existing = await db.query.varieties.findMany();
  const defaultNames = new Set(DEFAULT_VARIETIES.map((v) => v.name));
  for (const ext of existing) {
    if (!defaultNames.has(ext.name)) {
      await db.delete(varieties).where(eq(varieties.id, ext.id));
    }
  }
}

// Cached for the duration of a single React render pass.
export const getCatalog = cache(async (): Promise<CatalogEntry[]> => {
  await ensureVarietiesSeeded();
  const rows = await db.query.varieties.findMany({
    where: eq(varieties.isActive, true),
    orderBy: [asc(varieties.sortOrder), asc(varieties.name)],
  });
  return rows.map(rowToEntry);
});

export const getAllVarietiesForAdmin = cache(async (): Promise<CatalogEntry[]> => {
  await ensureVarietiesSeeded();
  const rows = await db.query.varieties.findMany({
    orderBy: [asc(varieties.sortOrder), asc(varieties.name)],
  });
  return rows.map(rowToEntry);
});

export async function findVarietyByName(name: string): Promise<CatalogEntry | undefined> {
  const row = await db.query.varieties.findFirst({
    where: and(eq(varieties.name, name), eq(varieties.isActive, true)),
  });
  return row ? rowToEntry(row) : undefined;
}
