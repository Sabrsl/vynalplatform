/**
 * Fonctions utilitaires pour la navigation avec écrans de chargement squelettes
 * Ces fonctions peuvent être utilisées dans des contextes non-React où les hooks ne sont pas disponibles
 * 
 * Utility functions for navigation with skeleton loading
 * These can be used in non-React contexts where hooks are not available
 */

/**
 * Déclenche l'affichage de l'écran squelette de navigation
 * À utiliser avant une navigation programmatique dans des contextes non-React
 * 
 * Trigger the navigation skeleton loading screen
 * Use this before programmatic navigation in non-React contexts
 */
export function showNavigationSkeleton() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('vynal:navigation-start'));
  }
}

/**
 * Navigue vers une nouvelle page avec affichage d'un écran squelette
 * @param path Le chemin vers lequel naviguer
 * 
 * Navigate to a new page with skeleton loading
 * @param path The path to navigate to
 */
export function navigateWithSkeleton(path: string) {
  if (typeof window !== 'undefined') {
    // Affiche l'écran squelette de chargement
    // Show loading skeleton
    showNavigationSkeleton();
    
    // Navigue vers le nouveau chemin
    // Navigate to the new path
    window.location.href = path;
  }
}

/**
 * Fonction utilitaire pour améliorer les éléments d'ancrage avec chargement squelette
 * @param selector Sélecteur CSS pour les éléments d'ancrage à améliorer
 * 
 * Helper function to enhance anchor elements with skeleton loading
 * @param selector CSS selector for anchor elements to enhance
 */
export function enhanceLinks(selector: string = 'a[data-enhance-nav="true"]') {
  if (typeof window !== 'undefined') {
    const links = document.querySelectorAll(selector);
    
    links.forEach(link => {
      if (link instanceof HTMLAnchorElement) {
        link.addEventListener('click', (e) => {
          // Uniquement pour les liens internes
          // Only for internal links
          const href = link.getAttribute('href');
          if (!href || !href.startsWith('/') || href.includes('#')) return;
          
          // Affiche l'écran squelette de chargement
          // Show loading skeleton
          showNavigationSkeleton();
        });
      }
    });
  }
} 