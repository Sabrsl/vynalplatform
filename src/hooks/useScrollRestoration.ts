"use client";

import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

// Type pour stocker les positions de défilement
type ScrollPositions = Record<string, number>;

/**
 * Hook pour restaurer la position de défilement lors de la navigation avant/arrière
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

  useEffect(() => {
    // Si nous venons de changer de page (premier rendu après navigation)
    if (previousUrlRef.current !== currentUrlKey) {
      // Si nous arrivons sur une page via history navigation (back/forward)
      if (scrollPositionsRef.current[currentUrlKey] !== undefined) {
        // Restaurer la position de défilement précédemment enregistrée
        requestAnimationFrame(() => {
          window.scrollTo(0, scrollPositionsRef.current[currentUrlKey]);
        });
      }
      
      // Marquer que nous venons de naviguer
      isNavigatingRef.current = true;
      // Mettre à jour l'URL précédente
      previousUrlRef.current = currentUrlKey;
    }
  }, [pathname, searchParams, currentUrlKey]);

  useEffect(() => {
    // Capturer la position de défilement actuelle avant de quitter la page
    const handleBeforeUnload = () => {
      scrollPositionsRef.current[currentUrlKey] = window.scrollY;
    };

    // Capturer la position lors de la navigation avec l'API History
    const handlePopState = () => {
      scrollPositionsRef.current[currentUrlKey] = window.scrollY;
    };

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

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);
    window.addEventListener('scroll', saveScrollPosition, { passive: true });

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('scroll', saveScrollPosition);
      
      // Enregistrer la position à la dernière minute avant de démonter
      scrollPositionsRef.current[currentUrlKey] = window.scrollY;
    };
  }, [currentUrlKey]);
}

export default useScrollRestoration; 