"use client";

import { useEffect, useCallback, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';

// Chemins à exclure (où le comportement standard est conservé)
const EXCLUDED_PATHS = ['/messages', '/chat', '/inbox'];

// Chemins où l'on veut gérer la restauration du scroll via useScrollRestoration
// Ces chemins seront également exclus du reset forcé
const RESTORE_SCROLL_PATHS = [
  '/services', 
  '/dashboard',
  '/profile',
  '/client-dashboard'
];

/**
 * Hook optimisé pour empêcher le reset du scroll lors des navigations tout en préservant la performance
 */
export function usePreventScrollReset() {
  const pathname = usePathname();
  const router = useRouter();
  const prevPathRef = useRef<string | null>(null);
  
  // Référence pour suivre la position de défilement actuelle
  const scrollPositionRef = useRef<number>(0);
  
  // Référence pour éviter les navigations multiples rapidement
  const navigationInProgressRef = useRef<boolean>(false);
  
  // Détecter si le chemin actuel est exclu du comportement personnalisé
  const isExcludedPath = useCallback((): boolean => {
    if (!pathname) return false;
    
    // Exclure les chemins standards
    if (EXCLUDED_PATHS.some(path => pathname.includes(path))) return true;
    
    // Exclure également les chemins où l'on utilise la restauration de scroll
    if (RESTORE_SCROLL_PATHS.some(path => pathname.includes(path))) return true;
    
    return false;
  }, [pathname]);

  // Effet pour gérer les changements de route et réinitialiser le scroll
  useEffect(() => {
    if (pathname && prevPathRef.current !== pathname) {
      if (!isExcludedPath()) {
        // Réinitialiser la position après que le DOM soit mis à jour
        requestAnimationFrame(() => {
          window.scrollTo(0, 0);
        });
      }
      prevPathRef.current = pathname;
    }
  }, [pathname, isExcludedPath]);
  
  // Mémoriser le gestionnaire d'événements pour éviter les recréations inutiles
  const handleLinkClick = useCallback((e: MouseEvent): void => {
    // Ignorer si une navigation est déjà en cours
    if (navigationInProgressRef.current) return;
    
    try {
      // Détection optimisée des éléments de lien
      const target = e.target as HTMLElement;
      
      // N'utiliser closest que si on a potentiellement un lien (optimisation)
      if (!target || (target.tagName !== 'A' && !target.closest('a'))) return;
      
      const link = target.tagName === 'A' ? target as HTMLAnchorElement : target.closest('a') as HTMLAnchorElement;
      
      // Validations de sécurité et d'exclusion
      if (!link || !link.href) return;
      if (!(link.href.startsWith(window.location.origin) || link.href.startsWith('/'))) return;
      if (link.hasAttribute('target') && link.getAttribute('target') === '_blank') return;
      if (link.hasAttribute('rel') && link.getAttribute('rel')?.includes('external')) return;
      if (link.hasAttribute('download')) return;
      
      // Si on est sur un chemin exclu, utiliser le comportement de navigation standard
      if (isExcludedPath()) return;
      
      // Empêcher les navigations multiples
      if (navigationInProgressRef.current) return;
      
      // Prévenir le comportement par défaut
      e.preventDefault();
      
      // Marquer la navigation comme en cours
      navigationInProgressRef.current = true;
      
      // Extraire l'URL relative avec gestion des cas particuliers
      let href = link.getAttribute('href') || '';
      if (href.startsWith(window.location.origin)) {
        href = href.substring(window.location.origin.length) || '/';
      }
      
      // Navigation sans réinitialisation immédiate du défilement
      router.push(href, { scroll: false });
      
      // Après la navigation, réinitialiser la position
      requestAnimationFrame(() => {
        window.scrollTo(0, 0);
        navigationInProgressRef.current = false;
      });
    } catch (error) {
      // En cas d'erreur, laisser le comportement par défaut se produire
      console.warn('Error in navigation handler:', error);
      navigationInProgressRef.current = false;
    }
  }, [router, isExcludedPath]);

  // Effet pour gérer les événements de clic
  useEffect(() => {
    // Ajouter l'écouteur d'événement pour intercepter les clics
    document.addEventListener('click', handleLinkClick, { 
      capture: true,  // Capturer les clics avant qu'ils n'atteignent leur cible
      passive: false  // Non passif pour permettre preventDefault()
    });
    
    // Nettoyer lors du démontage
    return () => {
      document.removeEventListener('click', handleLinkClick, { 
        capture: true 
      });
    };
  }, [handleLinkClick]);
  
  // Effet pour gérer la navigation par l'historique (retour/avant)
  useEffect(() => {
    const handlePopState = () => {
      // Réinitialiser l'indicateur de navigation
      navigationInProgressRef.current = false;
      
      // Défiler vers le haut sauf pour les chemins exclus - méthode performante
      if (!isExcludedPath()) {
        window.scrollTo(0, 0);
      }
    };
    
    window.addEventListener('popstate', handlePopState);
    
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isExcludedPath]);
}

export default usePreventScrollReset; 