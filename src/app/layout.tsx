import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Poppins } from 'next/font/google';
import { Providers } from './providers';
import MainLayout from '@/components/layout/main-layout';
import { Suspense } from 'react';
import ScrollRestoration from './scroll-restoration';
import Script from 'next/script';

// Préchargement de la police Poppins pour améliorer le LCP
const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-poppins',
  display: 'swap', // Affiche le texte avec une police système pendant le chargement
  preload: true,
});

function Loading() {
  return <div className="p-6 animate-pulse bg-vynal-purple-dark min-h-screen text-vynal-text-primary">Chargement de la page...</div>;
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1, // Désactiver le zoom
  userScalable: false, // Empêcher le zoom utilisateur
  themeColor: '#1a1a2e', // Définir la couleur du thème pour les navigateurs mobiles
};

export const metadata: Metadata = {
  title: 'Vynal - Plateforme de services numériques en Afrique',
  description: 'Vynal est une plateforme dédiée aux services numériques proposés par des professionnels indépendants',
  keywords: 'freelance, clients, afrique, services, marketplace, gig economy',
  manifest: '/site.webmanifest',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://vynalplatform.com'),
  icons: {
    icon: [
      { url: '/favicon_vynalplatform.ico' },
      { url: '/favicon_vynalplatform.ico', type: 'image/x-icon' }
    ],
    apple: [
      { url: '/favicon_vynalplatform.ico' }
    ]
  },
  // Amélioration pour les partages sociaux
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    url: 'https://vynalplatform.com',
    title: 'Vynal - Plateforme de services numériques',
    description: 'Trouvez des freelances qualifiés pour tous vos projets digitaux',
    siteName: 'Vynal Platform',
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
        {/* Préconnexions pour accélérer le chargement des ressources externes */}
        <link rel="preconnect" href="https://fonts.googleapis.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* Préchargement des ressources critiques */}
        <link rel="preload" href="/js/lcp-optimizer.js" as="script" />
        <link rel="preload" href="/css/performance-optimizations.css" as="style" />
        
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
          rel="preload" 
          href="/assets/partners/logo_wave_.webp" 
          as="image" 
          type="image/webp"
        />
        
        {/* Style critique pour le LCP chargé inline */}
        <style suppressHydrationWarning dangerouslySetInnerHTML={{ __html: criticalStyles }} />
        
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
      <body className={`${poppins.variable} font-poppins transition-colors duration-300`}>
        <Providers>
          <ScrollRestoration />
          <Suspense fallback={<Loading />}>
            <MainLayout>
              {children}
            </MainLayout>
          </Suspense>
          <div id="navigation-progress-indicator" className="fixed top-0 left-0 w-full h-1 bg-gradient-to-r from-vynal-purple-primary via-vynal-accent-primary to-vynal-purple-primary bg-size-200 animate-gradient-x z-50 hidden" />
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