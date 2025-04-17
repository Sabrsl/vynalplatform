/**
 * Utilitaires pour améliorer la navigation dans l'application
 */

// ATTENTION : Le hook usePreventDefaultScrolling a été remplacé par usePreventScrollReset
// Il est maintenant déconseillé d'utiliser ce hook de navigation, utilisez plutôt 
// le hook usePreventScrollReset de src/hooks/usePreventScrollReset.ts

/**
 * Fonction pour naviguer à un lien tout en contrôlant le défilement
 */
export const navigateTo = (url: string, router: any, scrollToTop = true) => {
  if (scrollToTop) {
    // Défiler vers le haut avant la navigation
    window.scrollTo(0, 0);
  }
  
  // Effectuer la navigation
  router.push(url);
}; 