/**
 * Script de préchargement et d'optimisation des ressources
 * Ce script est exécuté de manière asynchrone pour améliorer les performances
 */

(function() {
  // Éviter les exécutions multiples
  if (window.__resourceHintsExecuted) return;
  window.__resourceHintsExecuted = true;
  
  // Précharger uniquement le script de performance
  if (!document.querySelector('link[rel="preload"][href="/js/performance-utils.js"]')) {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'script';
    link.href = '/js/performance-utils.js';
    document.head.appendChild(link);
  }
  
  // Précharger la police principale si nécessaire
  if (!navigator.userAgent.includes('MSIE') && 
      !navigator.userAgent.includes('Trident/') && 
      !document.querySelector('link[href*="fonts.googleapis.com/css2?family=Poppins"]')) {
    const fontLink = document.createElement('link');
    fontLink.href = 'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap';
    fontLink.rel = 'stylesheet';
    document.head.appendChild(fontLink);
  }
  
  // Optimiser le chargement des polices
  if ('fonts' in document) {
    document.fonts.ready.then(() => {
      document.documentElement.classList.add('fonts-loaded');
    });
  }
  
  // Nettoyage simplifié - exécuté une seule fois
  let cleanupDone = false;
  window.addEventListener('load', () => {
    if (cleanupDone) return;
    
    setTimeout(() => {
      cleanupDone = true;
      
      // Libérer de la mémoire
      if (window.gc) {
        window.gc();
      }
    }, 2000);
  }, { passive: true });
})(); 