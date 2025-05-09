"use client";

import { useEffect, useRef, useCallback } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

// Type pour stocker les positions de défilement
type ScrollPositions = Record<string, number>;

// Chemins où le comportement de chat/messaging nécessite un traitement spécial
const EXCLUDED_PATHS = ['/messages', '/chat', '/inbox'];

/**
 * Ce hook permet de se souvenir où l'utilisateur était sur une page
 * quand il utilise le bouton retour/avant du navigateur.
 * Marche bien sur PC et mobile sans ralentir le site.
 */
export function useScrollRestoration() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // Une clé unique pour chaque URL (incluant les paramètres)
  const currentUrlKey = `${pathname}${searchParams ? `?${searchParams?.toString()}` : ''}`;
  
  // Référence pour stocker les positions de défilement par URL (max 20 pour éviter la fuite mémoire)
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

  // Hook d'effet pour restaurer la position de défilement après navigation
  useEffect(() => {
    // Ne pas appliquer la restauration sur les chemins exclus
    if (isExcludedPath()) return;

    // Si nous venons de changer de page (premier rendu après navigation)
    if (previousUrlRef.current !== currentUrlKey) {
      // Si nous arrivons sur une page via history navigation (back/forward)
      if (scrollPositionsRef.current[currentUrlKey] !== undefined) {
        // Utiliser setTimeout avec 0ms pour s'assurer que le DOM est prêt
        setTimeout(() => {
          window.scrollTo({
            top: scrollPositionsRef.current[currentUrlKey],
            behavior: 'auto' // Plus performant que 'smooth'
          });
        }, 0);
      }
      
      // Marquer que nous venons de naviguer
      isNavigatingRef.current = true;
      // Mettre à jour l'URL précédente
      previousUrlRef.current = currentUrlKey;
    }
  }, [pathname, searchParams, currentUrlKey, isExcludedPath]);

  // Hook d'effet pour enregistrer la position de défilement
  useEffect(() => {
    // Ne pas enregistrer les positions de défilement pour les chemins exclus
    if (isExcludedPath()) return;

    // Nettoyer les anciennes entrées si on dépasse 20 URLs (pour la performance)
    const cleanupOldPositions = () => {
      const keys = Object.keys(scrollPositionsRef.current);
      if (keys.length > 20) {
        // Garder seulement les 10 plus récentes
        const keysToRemove = keys.slice(0, keys.length - 10);
        keysToRemove.forEach(key => {
          delete scrollPositionsRef.current[key];
        });
      }
    };

    // Capturer la position actuelle
    const capturePosition = () => {
      scrollPositionsRef.current[currentUrlKey] = window.scrollY;
      cleanupOldPositions();
    };

    // Capturer la position de défilement avant de quitter la page
    const handleBeforeUnload = () => capturePosition();

    // Capturer la position lors de la navigation avec l'API History
    const handlePopState = () => capturePosition();

    // Minimal throttling pour éviter trop d'appels
    let ticking = false;
    const saveScrollPosition = () => {
      if (!ticking && !isNavigatingRef.current) {
        window.requestAnimationFrame(() => {
          scrollPositionsRef.current[currentUrlKey] = window.scrollY;
          ticking = false;
        });
        ticking = true;
      } else if (isNavigatingRef.current) {
        // Réinitialiser le flag après la première interaction
        isNavigatingRef.current = false;
      }
    };

    // Enregistrer lors de changements significatifs de la position
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);
    window.addEventListener('scroll', saveScrollPosition, { passive: true });

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('scroll', saveScrollPosition);
      
      // Enregistrer la position à la dernière minute avant de démonter
      capturePosition();
    };
  }, [currentUrlKey, isExcludedPath]);
}

export default useScrollRestoration; 