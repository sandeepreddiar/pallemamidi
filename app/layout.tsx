import type { Metadata, Viewport } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import CartDrawer from "./components/CartDrawer";
import MobileNavBar from "./components/MobileNavBar";
import {
  SITE_URL,
  SITE_NAME,
  SITE_TAGLINE,
  BRAND_DESCRIPTION,
  DEFAULT_OG_IMAGE,
  ORG_CONTACT,
} from "./lib/seo";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const telugu = localFont({
  src: "./fonts/mandali-bold.otf",
  variable: "--font-telugu",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F2E8CF" },
    { media: "(prefers-color-scheme: dark)", color: "#1B330F" },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — ${SITE_TAGLINE}`,
    template: `%s | ${SITE_NAME}`,
  },
  description: BRAND_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    "Palle Mamidi",
    "Andhra mangoes online",
    "buy Banganapalle mango",
    "Cheruku Rasalu online",
    "Sindhura mango",
    "Natu Rasalu mango",
    "Neelum mango online",
    "buy Pickle Mango",
    "Imam Pasand mango online",
    "naturally ripened mangoes",
    "farm fresh mangoes India",
    "Andhra Pradesh mango farm",
  ],
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  category: "food",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: BRAND_DESCRIPTION,
    images: [
      {
        url: DEFAULT_OG_IMAGE,
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} — farm-fresh Andhra mangoes`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: BRAND_DESCRIPTION,
    images: [DEFAULT_OG_IMAGE],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon-16x16.png?v=2", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png?v=2", sizes: "32x32", type: "image/png" },
      { url: "/favicon.ico?v=2" },
    ],
    apple: [
      { url: "/apple-touch-icon.png?v=2", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/site.webmanifest",
  formatDetection: {
    telephone: true,
    email: true,
    address: true,
  },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "@id": `${SITE_URL}/#organization`,
  name: SITE_NAME,
  alternateName: "Palle Mamidi Farms",
  url: SITE_URL,
  logo: `${SITE_URL}${DEFAULT_OG_IMAGE}`,
  image: `${SITE_URL}${DEFAULT_OG_IMAGE}`,
  description: BRAND_DESCRIPTION,
  email: ORG_CONTACT.email,
  telephone: ORG_CONTACT.phone,
  priceRange: "₹₹",
  areaServed: { "@type": "Country", name: "India" },
  address: {
    "@type": "PostalAddress",
    addressRegion: "Andhra Pradesh",
    addressCountry: "IN",
  },
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer service",
    email: ORG_CONTACT.email,
    telephone: ORG_CONTACT.phone,
    availableLanguage: ["en", "te"],
  },
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${SITE_URL}/#website`,
  url: SITE_URL,
  name: SITE_NAME,
  description: BRAND_DESCRIPTION,
  inLanguage: "en-IN",
  publisher: { "@id": `${SITE_URL}/#organization` },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${playfair.variable} ${inter.variable} ${telugu.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const removeBis = (el) => {
                  if (el && el.hasAttribute && el.hasAttribute('bis_skin_checked')) {
                    el.removeAttribute('bis_skin_checked');
                  }
                };
                document.querySelectorAll('[bis_skin_checked]').forEach(removeBis);
                const observer = new MutationObserver((mutations) => {
                  mutations.forEach((mutation) => {
                    if (mutation.type === 'attributes' && mutation.attributeName === 'bis_skin_checked') {
                      removeBis(mutation.target);
                    } else if (mutation.addedNodes) {
                      mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === 1) {
                          removeBis(node);
                          node.querySelectorAll('[bis_skin_checked]').forEach(removeBis);
                        }
                      });
                    }
                  });
                });
                observer.observe(document.documentElement, {
                  childList: true,
                  subtree: true,
                  attributes: true,
                  attributeFilter: ['bis_skin_checked']
                });
              })();
            `,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        {children}
        <CartDrawer />
        <MobileNavBar />
      </body>
    </html>
  );
}
