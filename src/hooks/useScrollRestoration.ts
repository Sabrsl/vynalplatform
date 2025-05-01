"use client";

import { useEffect, useRef, useCallback } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

// Type pour stocker les positions de défilement
type ScrollPositions = Record<string, number>;

// Chemins où le comportement de chat/messaging nécessite un traitement spécial
const EXCLUDED_PATHS = ['/messages', '/chat', '/inbox'];

/**
 * Hook pour restaurer la position de défilement lors de la navigation avant/arrière
 * Compatible avec desktop et mobile
 */
export function useScrollRestoration() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // Une clé unique pour chaque URL (incluant les paramètres)
  const currentUrlKey = `${pathname}${searchParams ? `?${searchParams}` : ''}`;
  
  // Référence pour stocker les positions de défilement par URL
  const scrollPositionsRef = useRef<ScrollPositions>({});
  
  // Référence pour suivre si on vient juste de changer de page via navigation
  const isNavigatingRef = useRef(false);
  
  // Référence pour suivre l'URL précédente
  const previousUrlRef = useRef<string | null>(null);

  // Détecter si le chemin actuel doit être exclu
  const isExcludedPath = useCallback((): boolean => {
    if (!pathname) return false;
    return EXCLUDED_PATHS.some(path => pathname.includes(path));
  }, [pathname]);

  // Fonction utilitaire pour détecter si nous sommes sur mobile
  const isMobileDevice = useCallback(() => {
    return (
      typeof window !== 'undefined' && 
      (navigator.userAgent.match(/Android/i) ||
       navigator.userAgent.match(/webOS/i) ||
       navigator.userAgent.match(/iPhone/i) ||
       navigator.userAgent.match(/iPad/i) ||
       navigator.userAgent.match(/iPod/i) ||
       navigator.userAgent.match(/BlackBerry/i) ||
       navigator.userAgent.match(/Windows Phone/i) ||
       (window.innerWidth <= 768))
    );
  }, []);

  useEffect(() => {
    // Ne pas appliquer la restauration sur les chemins exclus
    if (isExcludedPath()) return;

    // Si nous venons de changer de page (premier rendu après navigation)
    if (previousUrlRef.current !== currentUrlKey) {
      // Si nous arrivons sur une page via history navigation (back/forward)
      if (scrollPositionsRef.current[currentUrlKey] !== undefined) {
        // Restaurer la position de défilement précédemment enregistrée
        // Avec un délai légèrement plus long sur mobile pour permettre au contenu de se charger
        const scrollDelay = isMobileDevice() ? 50 : 0;
        
        setTimeout(() => {
          requestAnimationFrame(() => {
            window.scrollTo({
              top: scrollPositionsRef.current[currentUrlKey],
              behavior: 'auto' // 'auto' est plus performant que 'smooth' sur mobile
            });
          });
        }, scrollDelay);
      }
      
      // Marquer que nous venons de naviguer
      isNavigatingRef.current = true;
      // Mettre à jour l'URL précédente
      previousUrlRef.current = currentUrlKey;
    }
  }, [pathname, searchParams, currentUrlKey, isExcludedPath, isMobileDevice]);

  useEffect(() => {
    // Ne pas enregistrer les positions de défilement pour les chemins exclus
    if (isExcludedPath()) return;

    // Capturer la position de défilement actuelle avant de quitter la page
    const handleBeforeUnload = () => {
      scrollPositionsRef.current[currentUrlKey] = window.scrollY;
    };

    // Capturer la position lors de la navigation avec l'API History
    const handlePopState = () => {
      scrollPositionsRef.current[currentUrlKey] = window.scrollY;
    };

    // Optimiser la fréquence d'enregistrement des positions sur mobile pour la performance
    const isMobile = isMobileDevice();
    
    // Enregistrer périodiquement la position de défilement pendant la navigation
    const saveScrollPosition = () => {
      // Ne pas écraser la position enregistrée si on vient juste de naviguer
      if (!isNavigatingRef.current) {
        scrollPositionsRef.current[currentUrlKey] = window.scrollY;
      } else {
        // Réinitialiser le flag de navigation après le premier scroll
        isNavigatingRef.current = false;
      }
    };

    // Utiliser la capture d'événements avec throttling pour mobile
    let scrollTimeout: number | null = null;
    const throttledScrollHandler = () => {
      if (scrollTimeout === null) {
        scrollTimeout = window.setTimeout(() => {
          saveScrollPosition();
          scrollTimeout = null;
        }, isMobile ? 200 : 100);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);
    window.addEventListener('scroll', isMobile ? throttledScrollHandler : saveScrollPosition, { passive: true });

    // Événements spécifiques au mobile
    if (isMobile) {
      window.addEventListener('touchend', saveScrollPosition, { passive: true });
    }

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('scroll', isMobile ? throttledScrollHandler : saveScrollPosition);
      
      if (isMobile) {
        window.removeEventListener('touchend', saveScrollPosition);
      }
      
      if (scrollTimeout) {
        window.clearTimeout(scrollTimeout);
      }
      
      // Enregistrer la position à la dernière minute avant de démonter
      scrollPositionsRef.current[currentUrlKey] = window.scrollY;
    };
  }, [currentUrlKey, isExcludedPath, isMobileDevice]);
}

export default useScrollRestoration; 