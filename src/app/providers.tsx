'use client';

import React, { useEffect, useState, useRef } from 'react';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/toaster';
import NotificationListener from '@/components/notifications/NotificationListener';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import { ErrorBoundary, FallbackProps } from 'react-error-boundary';
import { OrderNotificationProvider } from "@/components/notifications/OrderNotificationProvider";

// État global pour le chargement entre navigations - ULTRA SIMPLIFIÉ
const initialNavigationState = {
  isNavigating: false,
  lastNavigationTimestamp: 0,
  activePath: '',
};

// Utilisation d'une simple variable de référence pour éviter les rendus inutiles
export const NavigationLoadingState = {
  ...initialNavigationState,
  
  // Fonction simplifiée pour mise à jour de l'état de navigation
  setIsNavigating: (value: boolean, fromPath?: string, toPath?: string) => {
    NavigationLoadingState.isNavigating = value;
    
    if (value) {
      NavigationLoadingState.lastNavigationTimestamp = Date.now();
    }
    
    // Émettre l'événement uniquement en cas de changement significatif
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('vynal:navigation-changed', {
        detail: { isNavigating: value }
      }));
    }
  },

  setActivePath: (path: string) => {
    NavigationLoadingState.activePath = path;
  },
  
  // Méthodes nécessaires pour assurer la compatibilité
  resetErrorState: () => {
    Object.assign(NavigationLoadingState, initialNavigationState);
  },
  recordNavigationError: () => {}
};

// État global pour la visibilité - simplifié et typé correctement
interface VisibilityStateType {
  lastVisible: number;
  lastHidden: number;
  isInactiveTab: boolean;
  setVisible: () => void;
  setHidden: () => void;
}

// Déclarer l'extension de Window pour TypeScript
declare global {
  interface Window {
    VisibilityState?: VisibilityStateType;
  }
}

// Export pour utilisation globale
export const VisibilityState: VisibilityStateType = {
  lastVisible: Date.now(),
  lastHidden: 0,
  isInactiveTab: false,
  
  setVisible: () => {
    const now = Date.now();
    const wasInactive = VisibilityState.isInactiveTab;
    const inactiveDuration = wasInactive ? now - VisibilityState.lastHidden : 0;
    
    VisibilityState.lastVisible = now;
    VisibilityState.isInactiveTab = false;
    
    if (typeof window !== 'undefined' && wasInactive && inactiveDuration > 30000) {
      // Émettre un seul événement unifié si l'inactivité est significative (>30s)
      window.dispatchEvent(new CustomEvent('vynal:app-state-changed', {
        detail: { 
          type: 'visibility',
          isVisible: true,
          inactiveDuration
        }
      }));
    }
  },
  
  setHidden: () => {
    VisibilityState.lastHidden = Date.now();
    VisibilityState.isInactiveTab = true;
  }
};

// Composant de fallback d'erreur
function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white dark:bg-gray-900 text-center p-4">
      <div className="max-w-md mx-auto p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
        <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">
          Une erreur est survenue
        </h2>
        <p className="text-gray-700 dark:text-gray-300 mb-4">
          Nous n'avons pas pu charger cette page correctement. Veuillez réessayer.
        </p>
        <button
          onClick={resetErrorBoundary}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md"
        >
          Réessayer
        </button>
        <button
          onClick={() => window.location.href = '/'}
          className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md ml-2"
        >
          Retour à l'accueil
        </button>
      </div>
    </div>
  );
}

// Gestionnaire d'événements de navigation optimisé
function NavigationEventHandler() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const pathnameRef = useRef(pathname);
  const prevPathRef = useRef<string | null>(null);
  const navigationInProgressRef = useRef(false);

  // Surveiller le changement d'état de navigation
  useEffect(() => {
    const handleNavigationStart = () => {
      navigationInProgressRef.current = true;
    };

    // Ecouter les changements de visibilité du document qui peuvent indiquer une navigation
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        navigationInProgressRef.current = true;
      }
    };

    // Ajouter les écouteurs d'événements
    window.addEventListener('beforeunload', handleNavigationStart);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Surveiller les changements dans l'état de navigation global
    const handleNavigationStateChange = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail?.isNavigating) {
        navigationInProgressRef.current = true;
      }
    };
    
    window.addEventListener('vynal:navigation-changed', handleNavigationStateChange);
    
    return () => {
      window.removeEventListener('beforeunload', handleNavigationStart);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('vynal:navigation-changed', handleNavigationStateChange);
    };
  }, []);
  
  // Effet optimisé pour réinitialiser la vue lors des changements de route complétés
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Combinaison de pathname et searchParams pour détection complète des changements de route
    const fullPath = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '');
    
    if (prevPathRef.current !== fullPath) {
      // Réinitialisation immédiate et fiable de la position
      window.scrollTo(0, 0);
      
      prevPathRef.current = fullPath;
      navigationInProgressRef.current = false;
    }
    
    // Mettre à jour la référence
    pathnameRef.current = pathname;
    
    // Indiquer que la navigation est terminée
    if (NavigationLoadingState.isNavigating) {
      NavigationLoadingState.setIsNavigating(false);
    }
  }, [pathname, searchParams]);

  return null;
}

// Composant pour gérer l'état de visibilité de la page
function VisibilityStateHandler() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleVisibilityChange = () => {
      try {
        if (document.visibilityState === 'visible') {
          if (typeof window.VisibilityState !== 'undefined') {
            window.VisibilityState.setVisible();
          }
        } else if (document.visibilityState === 'hidden') {
          if (typeof window.VisibilityState !== 'undefined') {
            window.VisibilityState.setHidden();
          }
        }
      } catch (e) {
        console.error("Erreur lors du changement d'état de visibilité", e);
      }
    };

    // Initialiser l'objet global
    if (typeof window !== 'undefined') {
      window.VisibilityState = VisibilityState;
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  // Ajout d'un state pour vérifier si le composant est monté (côté client)
  const [mounted, setMounted] = useState(false);

  // Mettre à jour le state après le premier rendu
  useEffect(() => {
    setMounted(true);
  }, []);

  // Options pour éviter les rendus inutiles dans ErrorBoundary
  const onError = (error: Error, info: React.ErrorInfo) => {
    console.error("Erreur capturée par ErrorBoundary:", error, info);
  };

  return (
    <ErrorBoundary 
      FallbackComponent={ErrorFallback}
      onError={onError}
      onReset={() => {
        // Réinitialiser l'état de navigation
        NavigationLoadingState.isNavigating = false;
        NavigationLoadingState.resetErrorState();
      }}
    >
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={true}>
        <OrderNotificationProvider>
          {/* N'afficher le contenu dépendant du thème que côté client */}
          {mounted ? children : <div style={{ visibility: 'hidden' }}>{children}</div>}
        </OrderNotificationProvider>
        <Toaster />
        <NotificationListener />
        <NavigationEventHandler />
        <VisibilityStateHandler />
      </ThemeProvider>
    </ErrorBoundary>
  );
} 