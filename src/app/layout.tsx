import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import { Providers } from "./providers";
import MainLayout from "@/components/layout/main-layout";
import { Suspense } from "react";
import ScrollRestoration from "./scroll-restoration";
import Script from "next/script";
import dynamic from "next/dynamic";
import { Loader } from "@/components/ui/loader";

// Chargement dynamique du composant de vérification de version (côté client uniquement)
const VersionChecker = dynamic(() => import("@/components/ui/VersionChecker"), {
  ssr: false,
});

// Préchargement de la police Poppins pour améliorer le LCP
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap", // Affiche le texte avec une police système pendant le chargement
  preload: true,
});

function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-vynal-purple-dark">
      <Loader size="lg" variant="secondary" showText={false} />
    </div>
  );
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#FF66B2", // Rose fixe pour tous les modes
};

export const metadata: Metadata = {
  title: "Vynal Platform - Services Numériques en Afrique",
  description: "Vynal Platform est la première marketplace de services numériques en Afrique. Trouvez des freelances qualifiés pour tous vos projets digitaux : développement web, design, marketing digital, et plus encore.",
  keywords: "freelance, afrique, services numériques, marketplace, gig economy, développement web, design, marketing digital, freelance afrique, plateforme freelance, services digitaux, entrepreneuriat digital",
  authors: [{ name: "Vynal Platform" }],
  creator: "Vynal Platform",
  publisher: "Vynal Platform",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  category: "Services Numériques",
  classification: "Marketplace",
  manifest: "/favicon/manifest.json",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://vynalplatform.com",
  ),
  icons: {
    icon: [
      { url: "/favicon_vynalplatform.ico" },
      { url: "/favicon.ico" },
      { url: "/favicon-16x16.ico", sizes: "16x16", type: "image/x-icon" },
      { url: "/favicon-32x32.ico", sizes: "32x32", type: "image/x-icon" },
      { url: "/favicon-48x48.ico", sizes: "48x48", type: "image/x-icon" },
      { url: "/favicon-64x64.ico", sizes: "64x64", type: "image/x-icon" },
      { url: "/favicon-128x128.ico", sizes: "128x128", type: "image/x-icon" },
      { url: "/favicon/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon/favicon-48x48.png", sizes: "48x48", type: "image/png" },
      { url: "/favicon/favicon-64x64.png", sizes: "64x64", type: "image/png" },
      { url: "/favicon/favicon-96x96.png", sizes: "96x96", type: "image/png" },
      { url: "/favicon/favicon-128x128.png", sizes: "128x128", type: "image/png" },
      { url: "/favicon/android-icon-36x36.png", sizes: "36x36", type: "image/png" },
      { url: "/favicon/android-icon-48x48.png", sizes: "48x48", type: "image/png" },
      { url: "/favicon/android-icon-72x72.png", sizes: "72x72", type: "image/png" },
      { url: "/favicon/android-icon-96x96.png", sizes: "96x96", type: "image/png" },
      { url: "/favicon/android-icon-144x144.png", sizes: "144x144", type: "image/png" },
      { url: "/favicon/android-icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/favicon/android-icon-512x512.png", sizes: "512x512", type: "image/png" }
    ],
    apple: [
      { url: "/favicon/apple-icon.png" },
      { url: "/favicon/apple-icon-precomposed.png" },
      { url: "/favicon/apple-icon-57x57.png", sizes: "57x57", type: "image/png" },
      { url: "/favicon/apple-icon-60x60.png", sizes: "60x60", type: "image/png" },
      { url: "/favicon/apple-icon-72x72.png", sizes: "72x72", type: "image/png" },
      { url: "/favicon/apple-icon-76x76.png", sizes: "76x76", type: "image/png" },
      { url: "/favicon/apple-icon-114x114.png", sizes: "114x114", type: "image/png" },
      { url: "/favicon/apple-icon-120x120.png", sizes: "120x120", type: "image/png" },
      { url: "/favicon/apple-icon-144x144.png", sizes: "144x144", type: "image/png" },
      { url: "/favicon/apple-icon-152x152.png", sizes: "152x152", type: "image/png" },
      { url: "/favicon/apple-icon-180x180.png", sizes: "180x180", type: "image/png" }
    ],
    shortcut: "/favicon_vynalplatform.ico",
    other: [
      { url: "/favicon/android-icon-192x192.png", sizes: "192x192", type: "image/png", rel: "icon" },
      { url: "/favicon/ms-icon-144x144.png", sizes: "144x144", type: "image/png", rel: "icon" },
      { url: "/favicon/ms-icon-150x150.png", sizes: "150x150", type: "image/png", rel: "icon" },
      { url: "/favicon/ms-icon-310x310.png", sizes: "310x310", type: "image/png", rel: "icon" }
    ]
  },
  // PWA et Apple Web App configuration
  appleWebApp: {
    capable: true,
    statusBarStyle: "black",
    title: "Vynal Platform",
  },
  // Amélioration pour les partages sociaux
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: "https://vynalplatform.com",
    title: "Vynal Platform - Services Numériques en Afrique",
    description: "La première marketplace de services numériques en Afrique. Trouvez des freelances qualifiés pour tous vos projets digitaux.",
    siteName: "Vynal Platform",
    images: [
      {
        url: "/images/social/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Vynal Platform - Services Numériques en Afrique"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Vynal Platform - Services Numériques en Afrique",
    description: "La première marketplace de services numériques en Afrique. Trouvez des freelances qualifiés pour tous vos projets digitaux.",
    images: ["/images/social/twitter-image.jpg"],
    creator: "@vynalplatform",
    site: "@vynalplatform"
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: "https://vynalplatform.com",
    languages: {
      'fr-FR': 'https://vynalplatform.com',
      'en-US': 'https://vynalplatform.com/en',
    },
  },
};

// Styles critiques pour le LCP - extraits pour éviter les problèmes d'hydratation
const criticalStyles = `
  #lcp-title, .hero-section h1, .dashboard-header h1 {
    opacity: 1 !important;
    visibility: visible !important;
    content-visibility: auto;
    contain-intrinsic-size: auto 200px;
    font-display: swap;
  }
  .image-container {
    position: relative;
    overflow: hidden;
    width: 100%;
    height: 0;
    padding-bottom: 56.25%;
  }
  .image-container img {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  img:not([width]):not([height]) {
    aspect-ratio: 16/9;
  }
  @media (prefers-reduced-motion: reduce) {
    * {
      animation-duration: 0.001ms !important;
      transition-duration: 0.001ms !important;
    }
  }
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" suppressHydrationWarning className="overflow-x-hidden">
      <head>
        <style
          dangerouslySetInnerHTML={{ __html: criticalStyles }}
          id="critical-styles"
        />
        
        {/* Préconnexions pour accélérer le chargement des ressources externes */}
        <link
          rel="preconnect"
          href="https://fonts.googleapis.com"
          crossOrigin="anonymous"
        />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />

        {/* Données structurées pour Google */}
        <Script
          id="ld-json-website"
          type="application/ld+json"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "Vynal Platform",
              "url": "https://vynalplatform.com",
              "description": "La première marketplace de services numériques en Afrique",
              "potentialAction": {
                "@type": "SearchAction",
                "target": "https://vynalplatform.com/search?q={search_term_string}",
                "query-input": "required name=search_term_string"
              }
            })
          }}
        />
        <Script
          id="ld-json-organization"
          type="application/ld+json"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "Vynal Platform",
              "url": "https://vynalplatform.com",
              "logo": "https://vynalplatform.com/favicon/android-icon-192x192.png",
              "sameAs": [
                "https://twitter.com/vynalplatform",
                "https://www.linkedin.com/company/vynal-platform",
                "https://www.facebook.com/vynalplatform"
              ],
              "contactPoint": {
                "@type": "ContactPoint",
                "telephone": "",
                "contactType": "customer service",
                "availableLanguage": ["French", "English"]
              }
            })
          }}
        />
        <Script
          id="ld-json-software"
          type="application/ld+json"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              "name": "Vynal Platform",
              "applicationCategory": "BusinessApplication",
              "operatingSystem": "Web",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "XOF"
              }
            })
          }}
        />

        <Script
          id="ld-json-review"
          type="application/ld+json"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              "name": "Vynal Platform",
              "description": "La première marketplace de services numériques en Afrique",
              "applicationCategory": "Marketplace",
              "operatingSystem": "Web",
              "url": "https://vynalplatform.com",
              "provider": {
                "@type": "Organization",
                "name": "Vynal Platform",
                "url": "https://vynalplatform.com"
              },
              "areaServed": {
                "@type": "Continent",
                "name": "Africa"
              },
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "4.8",
                "reviewCount": "1250",
                "bestRating": "5",
                "worstRating": "1"
              }
            })
          }}
        />

        {/* Configuration du favicon pour Google et autres navigateurs */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon-16x16.ico" sizes="16x16" type="image/x-icon" />
        <link rel="icon" href="/favicon-32x32.ico" sizes="32x32" type="image/x-icon" />
        <link rel="icon" href="/favicon-48x48.ico" sizes="48x48" type="image/x-icon" />
        <link rel="icon" href="/favicon-64x64.ico" sizes="64x64" type="image/x-icon" />
        <link rel="icon" href="/favicon-128x128.ico" sizes="128x128" type="image/x-icon" />
        <link rel="apple-touch-icon" href="/favicon/apple-icon.png" />
        <link rel="apple-touch-icon" sizes="57x57" href="/favicon/apple-icon-57x57.png" />
        <link rel="apple-touch-icon" sizes="60x60" href="/favicon/apple-icon-60x60.png" />
        <link rel="apple-touch-icon" sizes="72x72" href="/favicon/apple-icon-72x72.png" />
        <link rel="apple-touch-icon" sizes="76x76" href="/favicon/apple-icon-76x76.png" />
        <link rel="apple-touch-icon" sizes="114x114" href="/favicon/apple-icon-114x114.png" />
        <link rel="apple-touch-icon" sizes="120x120" href="/favicon/apple-icon-120x120.png" />
        <link rel="apple-touch-icon" sizes="144x144" href="/favicon/apple-icon-144x144.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/favicon/apple-icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/favicon/apple-icon-180x180.png" />

        {/* Configuration du favicon pour IE/Edge */}
        <meta
          name="msapplication-config"
          content="/favicon/browserconfig.xml"
        />

        {/* Gestion des safe-area-inset pour les appareils mobiles */}
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />

        {/* Meta tags additionnels pour les moteurs de recherche */}
        <link rel="icon" href="/favicon.ico" />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/favicon-32x32.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/favicon-16x16.png"
        />
        <link rel="shortcut icon" href="/favicon.ico" />

        {/* Configuration simple avec couleur rose fixe et fallbacks complets */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />

        {/* Fallbacks pour tous les navigateurs et appareils */}
        <meta name="msapplication-navbutton-color" content="#FF66B2" />
        <meta name="msapplication-TileColor" content="#FF66B2" />

        {/* Fallbacks Apple spécifiques */}
        <meta name="apple-mobile-web-app-title" content="Vynal" />
        <link
          rel="mask-icon"
          href="/favicon/safari-pinned-tab.svg"
          color="#FF66B2"
        />

        {/* Fallback Android */}
        <meta name="mobile-web-app-capable" content="yes" />

        {/* Préchargement des ressources critiques */}
        <link rel="preload" href="/js/lcp-optimizer.js" as="script" />
        <link
          rel="preload"
          href="/css/performance-optimizations.css"
          as="style"
        />

        {/* Script d'optimisation LCP avancé avec Next/Script - priorité maximale */}
        <Script
          id="lcp-optimizer"
          src="/js/lcp-optimizer.js"
          strategy="beforeInteractive"
        />

        {/* Scripts secondaires */}
        <Script
          id="resource-hints"
          src="/js/resource-hints.js"
          strategy="afterInteractive"
        />

        {/* Utilitaire de communication avec le Service Worker */}
        <Script
          id="service-worker-client"
          src="/js/service-worker-client.js"
          strategy="afterInteractive"
        />

        {/* Préchargement des assets critiques */}
        <link
          rel="prefetch"
          href="/assets/partners/logo_wave_.webp"
          as="image"
          type="image/webp"
          fetchPriority="low"
        />

        {/* CSS performance - chargé de façon non-bloquante */}
        <link
          rel="stylesheet"
          href="/css/performance-optimizations.css"
          media="print"
        />

        {/* Script pour charger le CSS après le premier rendu */}
        <Script id="load-performance-css" strategy="afterInteractive">
          {`
            (function() {
              const cssLink = document.querySelector('link[href="/css/performance-optimizations.css"]');
              if (cssLink) {
                cssLink.setAttribute('media', 'all');
              }
            })();
          `}
        </Script>
      </head>
      <body
        className={`${poppins.variable} font-poppins transition-colors duration-300`}
      >
        <Providers>
          <ScrollRestoration />
          <Suspense fallback={<Loading />}>
            <MainLayout>{children}</MainLayout>
          </Suspense>
          <div
            id="navigation-progress-indicator"
            className="fixed top-0 left-0 w-full h-1 bg-gradient-to-r from-vynal-purple-primary via-vynal-accent-primary to-vynal-purple-primary bg-size-200 animate-gradient-x z-50 hidden"
          />

          {/* Système de détection des mises à jour */}
          <Suspense fallback={null}>
            <VersionChecker checkInterval={2 * 60 * 1000} />
          </Suspense>
        </Providers>

        {/* Script de performance avec Next/Script */}
        <Script
          id="performance-utils"
          src="/js/performance-utils.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
