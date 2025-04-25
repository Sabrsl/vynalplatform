'use client';

import React, { useEffect, useState, useRef } from 'react';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/toaster';
import NotificationListener from '@/components/notifications/NotificationListener';
import { OptimizationsLoader } from '@/components/OptimizationsLoader';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';

// État global pour le chargement entre navigations
export const NavigationLoadingState = {
  isNavigating: false,
  lastNavigationTimestamp: 0,
  activeNavigation: {
    from: '',
    to: '',
  },
  navigationErrors: {
    lastErrorTimestamp: 0,
    errorCount: 0,
    lastErrorPath: '',
  },
  resetErrorState: () => {
    NavigationLoadingState.navigationErrors = {
      lastErrorTimestamp: 0,
      errorCount: 0,
      lastErrorPath: '',
    };
  },
  recordNavigationError: (path: string) => {
    const now = Date.now();
    const { lastErrorTimestamp, errorCount, lastErrorPath } = NavigationLoadingState.navigationErrors;
    
    // Si c'est la même erreur répétée rapidement
    if (lastErrorPath === path && now - lastErrorTimestamp < 5000) {
      NavigationLoadingState.navigationErrors = {
        lastErrorTimestamp: now,
        errorCount: errorCount + 1,
        lastErrorPath: path,
      };
      
      // Si trop d'erreurs répétées, rediriger vers le dashboard principal comme fallback
      if (errorCount >= 2 && path.startsWith('/dashboard/')) {
        if (typeof window !== 'undefined') {
          window.location.href = '/dashboard';
        }
      }
    } else {
      // Nouvelle erreur
      NavigationLoadingState.navigationErrors = {
        lastErrorTimestamp: now,
        errorCount: 1,
        lastErrorPath: path,
      };
    }
  },
  setIsNavigating: (value: boolean, fromPath?: string, toPath?: string) => {
    // Mémoriser l'horodatage précédent avant de mettre à jour
    const previousTimestamp = NavigationLoadingState.lastNavigationTimestamp;
    
    // Protection critique contre les doubles navigations vers le dashboard
    if (value && toPath === '/dashboard' && NavigationLoadingState.isNavigating) {
      console.warn("Double navigation vers dashboard détectée, ignorée");
      return;
    }
    
    // Protection renforcée: si on navigue vers le dashboard depuis le header et que 
    // le dashboard est déjà actif, forcer un rechargement complet de la page
    if (value && toPath === '/dashboard' && fromPath !== '/dashboard' && 
        window.location.pathname === '/dashboard') {
      console.warn("Navigation redondante vers dashboard détectée, rechargement forcé");
      setTimeout(() => {
        window.location.reload();
      }, 100);
      return;
    }
    
    // Protection contre le blocage lors de la navigation vers le dashboard
    if (value && toPath === '/dashboard' && NavigationLoadingState.activeNavigation.to === '/dashboard') {
      console.warn("Navigation vers dashboard déjà active, réinitialisation forcée");
      NavigationLoadingState.isNavigating = false;
      
      // Manipuler l'indicateur de progression
      if (typeof window !== 'undefined') {
        const indicator = document.getElementById('navigation-progress-indicator');
        if (indicator) {
          indicator.classList.add('hidden');
        }
      }
      
      // Petite pause avant de permettre une nouvelle tentative
      setTimeout(() => {
        NavigationLoadingState.isNavigating = value;
        NavigationLoadingState.lastNavigationTimestamp = Date.now();
        NavigationLoadingState.activeNavigation = { from: fromPath || '', to: toPath || '' };
        
        // Mettre à jour l'indicateur visuel
        if (typeof window !== 'undefined') {
          const indicator = document.getElementById('navigation-progress-indicator');
          if (indicator) {
            indicator.classList.remove('hidden');
          }
        }
      }, 200);
      
      return;
    }
    
    NavigationLoadingState.isNavigating = value;
    
    if (value) {
      // Nouvelle navigation démarre
      NavigationLoadingState.lastNavigationTimestamp = Date.now();
      if (fromPath && toPath) {
        NavigationLoadingState.activeNavigation = { from: fromPath, to: toPath };
      }
      
      // Sécurité: si une navigation précédente était bloquée depuis trop longtemps
      if (previousTimestamp > 0 && (Date.now() - previousTimestamp > 10000)) {
        console.warn("Navigation précédente bloquée détectée, réinitialisation forcée");
      }
    } else {
      // Navigation terminée
      NavigationLoadingState.activeNavigation = { from: '', to: '' };
    }
    
    // Manipuler directement l'indicateur de progression
    if (typeof window !== 'undefined') {
      const indicator = document.getElementById('navigation-progress-indicator');
      if (indicator) {
        if (value) {
          indicator.classList.remove('hidden');
        } else {
          indicator.classList.add('hidden');
        }
      }
      
      // Événement unifié pour informer l'application
      window.dispatchEvent(new CustomEvent('vynal:navigation-state-changed', {
        detail: { 
          isNavigating: value,
          fromPath,
          toPath
        }
      }));
      
      // Créer également un événement générique pour la cohérence
      window.dispatchEvent(new CustomEvent('vynal:app-state-changed', {
        detail: { 
          type: 'navigation',
          isNavigating: value,
          fromPath,
          toPath
        }
      }));
      
      // Ajouter une protection contre les blocages de navigation
      if (value) {
        // Définir un timeout de sécurité pour réinitialiser après un long délai
        setTimeout(() => {
          if (NavigationLoadingState.isNavigating && 
              NavigationLoadingState.lastNavigationTimestamp === NavigationLoadingState.lastNavigationTimestamp) {
            console.warn("Navigation bloquée détectée, réinitialisation");
            NavigationLoadingState.setIsNavigating(false);
          }
        }, 8000); // 8 secondes max pour toute navigation
      }
    }
  }
};

// État global pour l'état de visibilité de la page - simplifié
export const VisibilityState = {
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

// Composant optimisé pour détecter les changements de route
function NavigationEventHandler() {
  const pathname = usePathname();
  const previousPathRef = useRef<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isFirstRenderRef = useRef(true);

  useEffect(() => {
    // Pour éviter une invalidation au premier rendu
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      previousPathRef.current = pathname;
      return;
    }

    // Nettoyer timeout précédent
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Vérifier si c'est un changement réel de route
    if (previousPathRef.current === pathname) {
      return;
    }

    // Indiquer que la navigation est en cours
    const prevPath = previousPathRef.current || '';
    NavigationLoadingState.setIsNavigating(true, prevPath, pathname);

    // Simplifier l'invalidation du cache et la fin de navigation
    timeoutRef.current = setTimeout(() => {
      // Mettre à jour la référence
      previousPathRef.current = pathname;
      
      // Un seul événement pour l'invalidation du cache
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('vynal:app-state-changed', {
          detail: { 
            type: 'route_change',
            fromPath: prevPath,
            toPath: pathname
          }
        }));
      }
      
      // Fin de navigation après un délai adapté au type de page
      const isComplexNavigation = pathname?.includes('/dashboard');
      const resetDelay = isComplexNavigation ? 400 : 200;
      
      setTimeout(() => {
        NavigationLoadingState.setIsNavigating(false);
      }, resetDelay);
    }, 50);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [pathname]);

  // Détecter les erreurs 404 et les gérer
  useEffect(() => {
    const handleNavigationError = () => {
      // Si nous sommes sur une page d'erreur 404, enregistrer l'erreur
      if (document.title.includes('404') || 
          document.body.innerHTML.includes('404') || 
          document.body.innerHTML.includes('Page introuvable')) {
        NavigationLoadingState.recordNavigationError(window.location.pathname);
        NavigationLoadingState.setIsNavigating(false);
      }
    };

    if (typeof window !== 'undefined') {
      // Vérifier après le chargement complet de la page
      window.addEventListener('load', handleNavigationError);
      
      // Nettoyage
      return () => {
        window.removeEventListener('load', handleNavigationError);
      };
    }
  }, []);

  return null;
}

// Composant unifié pour gérer l'état de visibilité
function VisibilityStateHandler() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        VisibilityState.setVisible();
      } else {
        VisibilityState.setHidden();
      }
    };
    
    // Initialisation
    if (document.visibilityState === 'visible') {
      VisibilityState.setVisible();
    } else {
      VisibilityState.setHidden();
    }
    
    // Ajouter les écouteurs essentiels uniquement
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', VisibilityState.setVisible);
    window.addEventListener('blur', VisibilityState.setHidden);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', VisibilityState.setVisible);
      window.removeEventListener('blur', VisibilityState.setHidden);
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

  return (
    <OptimizationsLoader>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={true}>
        {/* N'afficher le contenu dépendant du thème que côté client */}
        {mounted ? children : <div style={{ visibility: 'hidden' }}>{children}</div>}
        <Toaster />
        <NotificationListener />
        <NavigationEventHandler />
        <VisibilityStateHandler />
      </ThemeProvider>
    </OptimizationsLoader>
  );
} 