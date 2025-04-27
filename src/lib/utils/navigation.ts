/**
 * Utilitaires pour améliorer la navigation dans l'application
 */

import { NavigationLoadingState } from "@/app/providers";

// ATTENTION : Le hook usePreventDefaultScrolling a été remplacé par usePreventScrollReset
// Il est maintenant déconseillé d'utiliser ce hook de navigation, utilisez plutôt 
// le hook usePreventScrollReset de src/hooks/usePreventScrollReset.ts

/**
 * Fonction pour naviguer à un lien tout en assurant une transition fluide
 * @param url L'URL de destination
 * @param router L'instance du router Next.js
 * @param scrollToTop Si true, défiler vers le haut après la navigation
 */
export const navigateTo = (url: string, router: any, scrollToTop = true) => {
  // Mettre à jour l'état de navigation avant de démarrer
  NavigationLoadingState.setIsNavigating(true);
  NavigationLoadingState.setActivePath(url);
  
  // Effectuer la navigation sans reset de scroll immédiat
  const options = scrollToTop ? { scroll: false } : undefined;
  
  // Naviguer vers la nouvelle page
  router.push(url, options);
  
  // Utiliser requestAnimationFrame pour s'assurer que le DOM est mis à jour
  if (scrollToTop) {
    requestAnimationFrame(() => {
      window.scrollTo(0, 0);
    });
  }
};

/**
 * Fonction pour détecter si l'application s'exécute sur un appareil mobile
 */
export const isMobileDevice = () => {
  if (typeof window === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}; 