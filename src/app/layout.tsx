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
  maximumScale: 5, // Permettre le zoom pour l'accessibilité
  themeColor: '#1a1a2e', // Définir la couleur du thème pour les navigateurs mobiles
  minimumScale: 1, // Éviter les bugs de mise à l'échelle sur iOS
  userScalable: true, // Permettre le zoom pour l'accessibilité
};

export const metadata: Metadata = {
  title: 'Vynal - Plateforme de services numériques',
  description: 'Vynal est une plateforme dédiée aux services numériques proposés par des professionnels indépendants',
  keywords: 'freelance, clients, services, marketplace, gig economy',
  manifest: '/manifest.json',
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
  
  /* Optimisations mobile */
  @media (max-width: 767px) {
    html, body {
      font-size: 15px; /* Légèrement plus petit pour mobile */
    }
    body {
      overscroll-behavior-y: contain; /* Éviter l'effet de rebond sur mobile */
    }
    img {
      content-visibility: auto; /* Décharger les images hors écran */
    }
    .desktop-only {
      display: none !important;
    }
    .mobile-simplified {
      transform: none !important;
      opacity: 1 !important;
      transition: none !important;
    }
    /* Optimisation du texte sur mobile */
    h1, h2, h3, p {
      text-rendering: optimizeSpeed !important;
      max-width: 100vw;
      overflow-wrap: break-word;
    }
  }
  
  /* Mode économie de données et batterie */
  .data-saving img:not([data-critical="true"]), 
  .battery-saving img:not([data-critical="true"]) {
    filter: brightness(0.98) contrast(0.98); /* Réduire légèrement la qualité */
  }
  
  /* Optimiser le chargement des polices */
  html {
    font-display: swap;
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
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://fonts.gstatic.com" />
        
        {/* Script d'optimisation LCP critique inline */}
        <script dangerouslySetInnerHTML={{ __html: `
          // Détection précoce des images LCP potentielles et optimisation 
          document.addEventListener('DOMContentLoaded', function() {
            const images = document.querySelectorAll('img.hero-image, img.main-image, .hero-section img, main img');
            if (images.length > 0) {
              for (let i = 0; i < Math.min(images.length, 3); i++) {
                const img = images[i];
                if (img && !img.complete) {
                  img.fetchPriority = 'high';
                  img.loading = 'eager';
                  img.decoding = 'async';
                }
              }
            }
            
            // Détection mobile rapide
            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
            const saveData = navigator.connection && navigator.connection.saveData;
            
            if (isMobile) {
              document.documentElement.classList.add('is-mobile-device');
              
              // Optimisations rapides pour mobile
              if (saveData) {
                document.documentElement.classList.add('data-saving');
              }
              
              // Sur les appareils mobiles, appliquer des optimisations immédiates
              const nonCriticalImages = document.querySelectorAll('img:not(.hero-image):not(.main-image):not([data-critical="true"])');
              nonCriticalImages.forEach(img => {
                if (!img.loading) {
                  img.loading = 'lazy';
                }
              });
            }
          });
        `}} />
        
        {/* Préchargement des ressources critiques */}
        <link rel="preload" href="/js/lcp-optimizer.js" as="script" fetchPriority="high" />
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
        
        {/* Préchargement des assets critiques - avec adaptation pour mobile */}
        <link 
          rel="preload" 
          href="/assets/partners/logo_wave_.webp" 
          as="image" 
          type="image/webp"
          fetchPriority="high"
          media="(min-width: 768px)"
        />
        
        {/* Version mobile de l'image pour les appareils mobiles */}
        <link 
          rel="preload" 
          href="/assets/partners/logo_wave_mobile.webp" 
          as="image" 
          type="image/webp"
          fetchPriority="high"
          media="(max-width: 767px)"
        />
        
        {/* Style critique pour le LCP chargé inline */}
        <style suppressHydrationWarning dangerouslySetInnerHTML={{ __html: criticalStyles + `
          /* Optimisations pour LCP */
          main > div:first-of-type > div:first-of-type > :first-child,
          .hero-section > :first-child,
          [data-lcp-element="true"] {
            content-visibility: auto;
            contain-intrinsic-size: auto 300px;
          }
          img {
            height: auto;
            transform: translateZ(0); /* Forcer le GPU rendering */
          }
          img.blur-load {
            filter: blur(10px);
          }
          img.blur-load.loaded {
            filter: blur(0);
            transition: filter 0.3s ease-out;
          }
          /* Améliorer le rendu du texte */
          h1, h2, h3, p {
            text-rendering: optimizeSpeed;
          }
          @media screen and (prefers-reduced-motion: no-preference) {
            .logo-animation, .animate-fade-in, .animate-float {
              will-change: transform, opacity;
            }
          }
        ` }} />
        
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
          strategy="lazyOnload"
        />
        
        {/* Script de détection LCP inline pour accélérer le traitement */}
        <script dangerouslySetInnerHTML={{ __html: `
          // Script léger pour détecter le LCP et l'optimiser immédiatement
          try {
            if (PerformanceObserver && PerformanceObserver.supportedEntryTypes 
                && PerformanceObserver.supportedEntryTypes.includes('largest-contentful-paint')) {
              new PerformanceObserver((entryList) => {
                const entries = entryList.getEntries();
                const lcpEntry = entries[entries.length - 1];
                
                if (lcpEntry && lcpEntry.element) {
                  // Optimiser l'élément LCP
                  lcpEntry.element.setAttribute('data-lcp-element', 'true');
                  
                  // Si c'est une image, optimiser spécifiquement
                  if (lcpEntry.element.tagName === 'IMG') {
                    const img = lcpEntry.element;
                    img.fetchPriority = 'high';
                    img.loading = 'eager';
                    img.decoding = 'async';
                    
                    // Forcer un rerendering rapide
                    const parent = img.parentElement;
                    if (parent) {
                      parent.style.display = 'none';
                      setTimeout(() => {
                        parent.style.display = '';
                      }, 0);
                    }
                  }
                }
              }).observe({type: 'largest-contentful-paint', buffered: true});
            }
          } catch (e) {
            // Ignorer les erreurs
          }
        `}} />
      </body>
    </html>
  );
}