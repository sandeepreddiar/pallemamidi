import type { Metadata } from "next";
import TopBar from "../components/TopBar";
import Header from "../components/Header";
import MangoGrid from "../components/MangoGrid";
import Footer from "../components/Footer";
import { getCatalog } from "../lib/catalog";
import { SITE_URL, SITE_NAME, varietySlug, absoluteUrl } from "../lib/seo";

export const metadata: Metadata = {
  title: "All Mango Varieties — Banganapalle, Cheruku Rasalu, Sindhura & More",
  description:
    "Shop every Palle Mamidi variety: Banganapalle, Cheruku Rasalu, Sindhura, Totapuri, Natu Rasalu, Imam Pasand, Neelum, Pickle Mango, and more — naturally tree-ripened and shipped pan-India.",
  alternates: { canonical: "/mangoes" },
  openGraph: {
    title: `All Mango Varieties | ${SITE_NAME}`,
    description:
      "Every Palle Mamidi mango variety in one place. Order Andhra mangoes online — naturally ripened, farm to door.",
    url: absoluteUrl("/mangoes"),
  },
};

export default async function MangoesPage() {
  const catalog = await getCatalog();
  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Palle Mamidi Mango Varieties",
    itemListElement: catalog.map((m, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${SITE_URL}/mangoes/${varietySlug(m.name)}`,
      name: `${m.name} Mango`,
    })),
  };

  return (
    <div className="flex flex-col min-h-screen">
      <TopBar />
      <Header />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />
      <main className="pt-4">
        <header className="max-w-6xl mx-auto px-6 lg:px-12 pt-8">
          <h1 className="font-[family-name:var(--font-playfair)] text-3xl md:text-4xl font-bold text-brand-primary-green">
            All Mango Varieties from Palle Mamidi
          </h1>
          <p className="mt-3 text-brand-primary-green/75 max-w-2xl">
            From the unmatched Imam Pasand to the iconic Banganapalle and late-season Neelum,
            every variety is naturally tree-ripened on our Andhra farms and shipped
            straight to your door.
          </p>
        </header>
        <MangoGrid />
      </main>
      <Footer />
    </div>
  );
}
