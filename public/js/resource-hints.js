/**
 * Script de préchargement et d'optimisation des ressources
 * Ce script est exécuté de manière asynchrone pour améliorer les performances
 */

(function() {
  // Liste des ressources critiques à précharger
  const preloadResources = [
    { type: 'style', href: '/css/performance-optimizations.css' },
    { type: 'script', href: '/js/performance-utils.js' }
  ];
  
  // Précharger les ressources critiques
  preloadResources.forEach(resource => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = resource.type;
    link.href = resource.href;
    link.crossOrigin = '';
    document.head.appendChild(link);
  });
  
  // Précharger la police principale
  if (!navigator.userAgent.includes('MSIE') && !navigator.userAgent.includes('Trident/')) {
    const fontPreload = document.createElement('link');
    fontPreload.href = 'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap';
    fontPreload.rel = 'preload';
    fontPreload.as = 'style';
    document.head.appendChild(fontPreload);
  }
  
  // Détecter la fin du chargement initial
  window.addEventListener('load', () => {
    // Nettoyer les scripts non nécessaires après le chargement
    setTimeout(() => {
      // Supprimer les attributs data-* inutiles pour réduire le DOM
      document.querySelectorAll('[data-nextjs-data-runtime]').forEach(el => {
        if (el.parentNode) {
          el.parentNode.removeChild(el);
        }
      });
      
      // Libérer de la mémoire
      if (window.gc) {
        window.gc();
      }
    }, 3000);
  }, { passive: true });
  
  // Optimiser le chargement des polices
  if ('fonts' in document) {
    document.fonts.ready.then(() => {
      document.documentElement.classList.add('fonts-loaded');
    });
  }
})(); 