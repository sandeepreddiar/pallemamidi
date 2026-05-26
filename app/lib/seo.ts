// Single source of truth for site-wide SEO constants and helpers.
// Override the public URL by setting NEXT_PUBLIC_SITE_URL in your environment.

import type { CatalogEntry, MangoVariety } from './catalog';

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://pallemamidi.vercel.app'
).replace(/\/$/, '');

export const SITE_NAME = 'Palle Mamidi';
export const SITE_TAGLINE = 'Farm-Fresh Andhra Mangoes';
export const BRAND_DESCRIPTION =
  'Palle Mamidi delivers farm-fresh, naturally ripened Andhra mangoes — Banganapalle, Cheruku Rasalu, Sindhura, Natu Rasalu, Imam Pasand, Neelum, and more — sourced directly from our village orchards and shipped across India in season.';

export const DEFAULT_OG_IMAGE = '/mangoes/mango-1.png';

export const ORG_CONTACT = {
  email: 'pallemamidi@gmail.com',
  phone: '+91-00000-00000',
  region: 'Andhra Pradesh, India',
} as const;

export function varietySlug(name: MangoVariety | string): string {
  return name.toLowerCase().replace(/[\s/]+/g, '-').replace(/[^a-z0-9-]/g, '');
}

export function varietyFromSlug(
  slug: string,
  catalog: readonly CatalogEntry[],
): CatalogEntry | undefined {
  return catalog.find((m) => varietySlug(m.name) === slug.toLowerCase());
}

export function absoluteUrl(path: string): string {
  if (path.startsWith('http')) return path;
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}
