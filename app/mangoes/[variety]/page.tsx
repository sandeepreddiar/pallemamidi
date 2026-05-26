import type { Metadata } from "next";
import OptimizedImage from "../../components/OptimizedImage";
import Link from "next/link";
import { notFound } from "next/navigation";
import TopBar from "../../components/TopBar";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import MangoCard from "../../components/MangoCard";
import { getCatalog, DEFAULT_VARIETIES } from "../../lib/catalog";
import { hashNumericId } from "../../lib/hash";
import { VARIETY_CONTENT } from "../../lib/varietyContent";
import {
  SITE_URL,
  SITE_NAME,
  varietyFromSlug,
  varietySlug,
  absoluteUrl,
} from "../../lib/seo";

type Props = { params: Promise<{ variety: string }> };

export function generateStaticParams() {
  return DEFAULT_VARIETIES.map((m) => ({ variety: varietySlug(m.name) }));
}

export const dynamicParams = true;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { variety } = await params;
  const catalog = await getCatalog();
  const entry = varietyFromSlug(variety, catalog);
  if (!entry) return { title: "Mango variety not found" };

  const content = VARIETY_CONTENT[entry.name as keyof typeof VARIETY_CONTENT];
  if (!content) return { title: `${entry.name} Mango | ${SITE_NAME}` };
  const title = `Buy ${entry.name} Mangoes Online — Farm-Fresh from Andhra | ${SITE_NAME}`;
  const description = `${entry.name} mangoes (${content.altNames.join(", ")}) from ${content.origin}. ${content.taste}. Naturally tree-ripened, shipped pan-India in season at ₹${entry.pricePerKg}/kg.`;
  const canonical = `/mangoes/${varietySlug(entry.name)}`;

  return {
    title: `Buy ${entry.name} Mangoes Online — Farm-Fresh from Andhra`,
    description,
    alternates: { canonical },
    keywords: [
      `${entry.name} mango`,
      `buy ${entry.name} mango online`,
      `${entry.name} mango price`,
      `${entry.name} mango ${content.seasonMonths.split(" – ")[0].toLowerCase()}`,
      ...content.altNames.map((n) => `${n} mango`),
      "Andhra mangoes",
      "Palle Mamidi",
    ],
    openGraph: {
      type: "website",
      url: absoluteUrl(canonical),
      title,
      description,
      images: [{ url: entry.image, width: 1200, height: 1200, alt: `${entry.name} mango` }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [entry.image],
    },
  };
}

export default async function VarietyPage({ params }: Props) {
  const { variety } = await params;
  const catalog = await getCatalog();
  const entry = varietyFromSlug(variety, catalog);
  if (!entry) notFound();

  const content = VARIETY_CONTENT[entry.name as keyof typeof VARIETY_CONTENT];
  if (!content) notFound();
  const related = catalog.filter((m) => m.id !== entry.id).slice(0, 3);
  const canonical = `/mangoes/${varietySlug(entry.name)}`;

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${SITE_URL}${canonical}#product`,
    name: `${entry.name} Mango`,
    alternateName: content.altNames,
    description: `${entry.description} ${content.taste}. ${content.texture}. Grown in ${content.origin}, harvested ${content.seasonMonths}.`,
    image: absoluteUrl(entry.image),
    sku: `palla-${varietySlug(entry.name)}`,
    brand: { "@type": "Brand", name: SITE_NAME },
    category: "Fresh Fruit > Mango",
    offers: entry.allowedWeightsKg.map((kg) => ({
      "@type": "Offer",
      url: absoluteUrl(canonical),
      priceCurrency: "INR",
      price: kg * entry.pricePerKg,
      itemCondition: "https://schema.org/NewCondition",
      availability: entry.status === 'PREBOOKING' ? "https://schema.org/PreOrder" : "https://schema.org/InStock",
      seller: { "@type": "Organization", name: SITE_NAME },
      eligibleQuantity: { "@type": "QuantitativeValue", value: kg, unitCode: "KGM" },
    })),
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      reviewCount: "126",
    },
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: content.faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Mango Varieties", item: `${SITE_URL}/mangoes` },
      { "@type": "ListItem", position: 3, name: entry.name, item: absoluteUrl(canonical) },
    ],
  };

  return (
    <div className="flex flex-col min-h-screen bg-brand-cream">
      <TopBar />
      <Header />

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

      <main className="flex-1 max-w-6xl mx-auto px-6 lg:px-12 py-10 w-full">
        <nav aria-label="Breadcrumb" className="text-sm text-brand-primary-green/70 mb-6">
          <ol className="flex flex-wrap gap-2">
            <li><Link href="/" className="hover:underline">Home</Link><span className="mx-1">/</span></li>
            <li><Link href="/mangoes" className="hover:underline">Mangoes</Link><span className="mx-1">/</span></li>
            <li aria-current="page" className="font-semibold text-brand-primary-green">{entry.name}</li>
          </ol>
        </nav>

        <article className="grid md:grid-cols-2 gap-10 items-start">
          <div className="relative aspect-square bg-white rounded-3xl overflow-hidden shadow-sm">
            <OptimizedImage
              src={entry.image}
              alt={`${entry.name} mango — farm fresh from ${content.origin}`}
              width={600}
              quality={85}
              className="absolute inset-0 w-full h-full"
              imgClassName="object-contain p-8"
            />
          </div>

          <div>
            <h1 className="font-[family-name:var(--font-playfair)] text-4xl md:text-5xl font-bold text-brand-primary-green mb-3">
              {entry.name} Mango
            </h1>
            <p className="text-brand-primary-green/70 text-sm uppercase tracking-widest mb-4">
              Also known as {content.altNames.join(" · ")}
            </p>
            <p className="text-lg text-brand-primary-green/80 mb-6">{entry.description}</p>

            <dl className="grid grid-cols-2 gap-4 text-sm mb-8">
              <div><dt className="font-bold text-brand-primary-green">Origin</dt><dd>{content.origin}</dd></div>
              <div><dt className="font-bold text-brand-primary-green">Season</dt><dd>{content.seasonMonths}</dd></div>
              <div><dt className="font-bold text-brand-primary-green">Taste</dt><dd>{content.taste}</dd></div>
              <div><dt className="font-bold text-brand-primary-green">Texture</dt><dd>{content.texture}</dd></div>
            </dl>

            <p className="text-3xl font-bold text-brand-orange mb-2">₹{entry.pricePerKg}<span className="text-base font-medium text-brand-primary-green/60">/kg</span></p>
            <p className="text-sm text-brand-primary-green/70 mb-6">Available in {entry.allowedWeightsKg.filter(w => w !== 1).join(", ")} kg boxes. Minimum 10 kg total basket weight required for checkout.</p>

            {entry.status === 'AVAILABLE' || entry.status === 'PREBOOKING' ? (
              <Link
                href="/mangoes"
                className="inline-block bg-brand-primary-green text-brand-cream px-8 py-3 rounded-full font-bold hover:bg-[#2E4D25] transition-colors"
              >
                {entry.status === 'PREBOOKING' ? `Pre-book ${entry.name} now` : `Order ${entry.name} now`}
              </Link>
            ) : (
              <div className="inline-block bg-black/5 text-brand-primary-green/40 border border-brand-primary-green/10 px-8 py-3 rounded-full font-bold text-sm tracking-wide uppercase">
                {entry.status === 'SOLD_OUT' ? 'Sold Out' : 'Out of Season'}
              </div>
            )}
          </div>
        </article>

        <section className="mt-14">
          <h2 className="font-[family-name:var(--font-playfair)] text-2xl md:text-3xl font-bold text-brand-primary-green mb-4">
            Best ways to enjoy {entry.name}
          </h2>
          <ul className="grid sm:grid-cols-2 gap-3 text-brand-primary-green/80">
            {content.bestFor.map((use) => (
              <li key={use} className="bg-white rounded-xl px-4 py-3 shadow-sm">• {use}</li>
            ))}
          </ul>
        </section>

        <section className="mt-12 bg-brand-primary-green text-brand-cream rounded-3xl p-8">
          <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-bold mb-2">Did you know?</h2>
          <p className="text-brand-cream/90 leading-relaxed">{content.fact}</p>
        </section>

        <section className="mt-12">
          <h2 className="font-[family-name:var(--font-playfair)] text-2xl md:text-3xl font-bold text-brand-primary-green mb-6">
            {entry.name} — Frequently asked
          </h2>
          <div className="space-y-4">
            {content.faqs.map((f) => (
              <details key={f.q} className="bg-white rounded-xl p-5 shadow-sm group">
                <summary className="font-bold text-brand-primary-green cursor-pointer">{f.q}</summary>
                <p className="mt-3 text-brand-primary-green/80">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="mt-14">
          <h2 className="font-[family-name:var(--font-playfair)] text-2xl md:text-3xl font-bold text-brand-primary-green mb-6">
            Other premium varieties
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {related.map((m) => (
              <MangoCard key={m.id} mango={{ ...m, id: hashNumericId(m.id) }} />
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
