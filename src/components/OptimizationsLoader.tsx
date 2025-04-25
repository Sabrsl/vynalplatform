'use client';

import { useEffect, useState } from 'react';
import { initializeOptimizations } from '@/lib/optimizations';
import { preloadResources } from '@/lib/optimizations/network';
import { usePathname } from 'next/navigation';
import { NavigationLoadingState } from '@/app/providers';

// Ressources importantes à précharger pour améliorer l'expérience utilisateur
const CRITICAL_RESOURCES = [
  // Styles principaux
  '/assets/main.css',
  // JS principaux
  '/assets/main.js',
  // Images essentielles
  '/logo.png',
  '/favicon.ico',
  // Fonts importantes
  'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap'
];

// Routes importantes à précharger pour un accès rapide
const IMPORTANT_ROUTES = [
  '/',
  '/services',
  '/about',
  '/how-it-works'
];

interface OptimizationsLoaderProps {
  children?: React.ReactNode;
}

/**
 * Composant qui charge et initialise toutes les optimisations de performances
 */
export function OptimizationsLoader({ children }: OptimizationsLoaderProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const pathname = usePathname();

  // Initialisation des optimisations au chargement
  useEffect(() => {
    // Ne rien faire côté serveur
    if (typeof window === 'undefined') return;

    // Initialiser nos optimisations
    initializeOptimizations();

    // Précharger les ressources critiques
    preloadResources(CRITICAL_RESOURCES);

    // Marquer comme chargé après un court délai
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 50);

    return () => clearTimeout(timer);
  }, []);

  // Préchargement intelligent des routes en fonction du comportement de l'utilisateur
  useEffect(() => {
    if (!isLoaded || typeof window === 'undefined') return;

    // Précharger les routes importantes quand l'utilisateur est inactif
    const handleUserIdle = () => {
      if ('requestIdleCallback' in window) {
        // @ts-ignore - L'API requestIdleCallback n'est pas encore standard
        window.requestIdleCallback(() => {
          import('@/lib/optimizations/service-worker')
            .then(({ precacheRoutes }) => {
              precacheRoutes(IMPORTANT_ROUTES);
            });
        });
      } else {
        // Fallback pour les navigateurs qui ne supportent pas requestIdleCallback
        setTimeout(() => {
          import('@/lib/optimizations/service-worker')
            .then(({ precacheRoutes }) => {
              precacheRoutes(IMPORTANT_ROUTES);
            });
        }, 5000);
      }
    };

    // Ajouter un écouteur d'événements qui se déclenche lorsque l'utilisateur devient inactif
    const idleTimer = setTimeout(handleUserIdle, 3000);

    return () => clearTimeout(idleTimer);
  }, [isLoaded]);

  // Détection des changements de route et déclenchement des événements de navigation
  useEffect(() => {
    // Mettre l'état de navigation à true au début d'un changement de route
    if (typeof window !== 'undefined' && isLoaded) {
      NavigationLoadingState.setIsNavigating(true);
      
      // Réinitialiser l'état après un délai
      const timer = setTimeout(() => {
        NavigationLoadingState.setIsNavigating(false);
      }, 800); // Délai suffisant pour que la page se charge
      
      return () => clearTimeout(timer);
    }
  }, [pathname, isLoaded]);

  // Optimisation du rendu initial
  return (
    <>
      {children}
      <style jsx global>{`
        /* Optimiser les animations pendant le chargement */
        html:not([data-loaded]) * {
          transition-delay: 0s !important;
          transition-duration: 0s !important;
          animation-delay: -0.0001s !important;
          animation-duration: 0s !important;
          animation-play-state: paused !important;
        }
      `}</style>
      {isLoaded && (
        <script
          dangerouslySetInnerHTML={{
            __html: `document.documentElement.setAttribute('data-loaded', 'true');`
          }}
        />
      )}
    </>
  );
} 