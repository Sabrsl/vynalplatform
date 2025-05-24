import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Poppins } from 'next/font/google';
import { Providers } from './providers';
import MainLayout from '@/components/layout/main-layout';
import { Suspense } from 'react';
import ScrollRestoration from './scroll-restoration';
import Script from 'next/script';
import dynamic from 'next/dynamic';

// Chargement dynamique du composant de vérification de version (côté client uniquement)
const VersionChecker = dynamic(() => import('@/components/ui/VersionChecker'), { 
  ssr: false 
});

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
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#100422' }
  ], // S'adapte automatiquement au mode
};

export const metadata: Metadata = {
  title: 'Vynal - Plateforme de micro-services numériques en Afrique',
  description: 'Vynal est une plateforme dédiée aux services numériques proposés par des professionnels indépendants',
  keywords: 'freelance, clients, afrique, services, marketplace, gig economy',
  manifest: '/favicon/manifest.json',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://vynalplatform.com'),
  icons: {
    icon: [
      { url: '/favicon_vynalplatform.ico' },
      { url: '/favicon/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
      { url: '/favicon/favicon-192x192.png', sizes: '192x192', type: 'image/png' }
    ],
    apple: [
      { url: '/favicon/apple-icon.png' },
      { url: '/favicon/apple-icon-57x57.png', sizes: '57x57', type: 'image/png' },
      { url: '/favicon/apple-icon-60x60.png', sizes: '60x60', type: 'image/png' },
      { url: '/favicon/apple-icon-72x72.png', sizes: '72x72', type: 'image/png' },
      { url: '/favicon/apple-icon-76x76.png', sizes: '76x76', type: 'image/png' },
      { url: '/favicon/apple-icon-114x114.png', sizes: '114x114', type: 'image/png' },
      { url: '/favicon/apple-icon-120x120.png', sizes: '120x120', type: 'image/png' },
      { url: '/favicon/apple-icon-144x144.png', sizes: '144x144', type: 'image/png' },
      { url: '/favicon/apple-icon-152x152.png', sizes: '152x152', type: 'image/png' },
      { url: '/favicon/apple-icon-180x180.png', sizes: '180x180', type: 'image/png' }
    ],
    shortcut: '/favicon_vynalplatform.ico',
    other: [
      { url: '/favicon/android-icon-192x192.png', sizes: '192x192', type: 'image/png', rel: 'icon' },
      { url: '/favicon/ms-icon-144x144.png', sizes: '144x144', type: 'image/png', rel: 'icon' },
      { url: '/favicon/ms-icon-150x150.png', sizes: '150x150', type: 'image/png', rel: 'icon' },
      { url: '/favicon/ms-icon-310x310.png', sizes: '310x310', type: 'image/png', rel: 'icon' }
    ]
  },
  // PWA et Apple Web App configuration
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black',
    title: 'Vynal'
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
        
        {/* Configuration du favicon pour IE/Edge */}
        <meta name="msapplication-config" content="/favicon/browserconfig.xml" />
        
        {/* Gestion des safe-area-inset pour les appareils mobiles */}
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        
        {/* Meta tags additionnels pour les moteurs de recherche */}
        <link rel="icon" type="image/x-icon" href="/favicon_vynalplatform.ico" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon/favicon-16x16.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/favicon/favicon-192x192.png" />
        
        {/* Script immédiat AVANT tout le reste pour éviter le flash */}
        <script dangerouslySetInnerHTML={{
          __html: `
            (function() {
              // Détection immédiate sans attendre le DOM
              const isDark = localStorage.getItem('theme') === 'dark' || 
                            (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
              
              if (isDark) {
                document.documentElement.classList.add('dark');
              }
              
              // Force la couleur IMMÉDIATEMENT
              const meta = document.createElement('meta');
              meta.name = 'theme-color';
              meta.content = isDark ? '#100422' : '#ffffff';
              document.head.appendChild(meta);
            })();
          `
        }} />
        
        {/* Configuration statique en backup */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="msapplication-navbutton-color" content="#100422" />
        
        {/* Fallbacks pour navigateurs sans JS */}
        <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#100422" media="(prefers-color-scheme: dark)" />
        
        {/* Script de surveillance pour les changements après chargement */}
        <script dangerouslySetInnerHTML={{
          __html: `
            document.addEventListener('DOMContentLoaded', function() {
              const updateStatusBar = () => {
                const isDark = document.documentElement.classList.contains('dark');
                const color = isDark ? '#100422' : '#ffffff';
                
                // Met à jour le meta existant au lieu d'en créer un nouveau
                let meta = document.querySelector('meta[name="theme-color"]:not([media])');
                if (meta) {
                  meta.content = color;
                } else {
                  meta = document.createElement('meta');
                  meta.name = 'theme-color';
                  meta.content = color;
                  document.head.appendChild(meta);
                }
                
                // Sauvegarde dans localStorage pour la prochaine visite
                localStorage.setItem('theme', isDark ? 'dark' : 'light');
              };
              
              // Observer les changements de classe
              if (typeof MutationObserver !== 'undefined') {
                const observer = new MutationObserver(updateStatusBar);
                observer.observe(document.documentElement, { 
                  attributes: true, 
                  attributeFilter: ['class'] 
                });
              }
              
              // Double vérification après un court délai
              setTimeout(updateStatusBar, 100);
            });
          `
        }} />
        
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
          
          {/* Système de détection des mises à jour */}
          <VersionChecker checkInterval={2 * 60 * 1000} />
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