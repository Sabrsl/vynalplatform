/**
 * Script d'optimisation du LCP (Largest Contentful Paint)
 * Ce script est conçu pour améliorer les performances de chargement initial
 * sans impacter l'expérience utilisateur
 */

(function() {
  // Exécuter immédiatement pour optimiser le LCP au plus tôt
  function optimizeLCP() {
    try {
      // Sélection plus efficace sans opérations redondantes
      const lcpSelector = '#lcp-title, #dashboard-header, #dashboard-welcome, .dashboard-main-content, h1, .hero-section, .dashboard-stats';
      const lcpElement = document.querySelector(lcpSelector);
      
      if (lcpElement) {
        // Appliquer les styles de façon plus efficace
        const styles = {
          display: 'block',
          visibility: 'visible',
          opacity: '1',
          contentVisibility: 'auto'
        };
        
        Object.assign(lcpElement.style, styles);
        lcpElement.setAttribute('importance', 'high');
      }
      
      // Optimiser seulement les images réellement visibles sans calculs lourds
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && entry.target instanceof HTMLImageElement) {
            // Optimiser l'image visible
            entry.target.loading = 'eager';
            entry.target.setAttribute('importance', 'high');
            
            if ('fetchPriority' in HTMLImageElement.prototype) {
              entry.target.fetchPriority = 'high';
            }
            
            // Une fois optimisée, arrêter d'observer
            observer.unobserve(entry.target);
          }
        });
      }, {
        rootMargin: '200px 0px', // Préchargement anticipé
        threshold: 0.01
      });
      
      // Observer uniquement les images potentiellement importantes
      document.querySelectorAll('img:not([loading="lazy"])')
        .forEach(img => observer.observe(img));
      
      // Minimiser le nombre de préconnexions
      const preconnectDomains = [
        'https://fonts.googleapis.com',
        'https://fonts.gstatic.com',
        'https://cdn.jsdelivr.net'
      ];
      
      // Regrouper les préconnexions pour minimiser les appels DOM
      const fragment = document.createDocumentFragment();
      
      preconnectDomains.forEach(domain => {
        if (!document.querySelector(`link[rel="preconnect"][href="${domain}"]`)) {
          const link = document.createElement('link');
          link.href = domain;
          link.rel = 'preconnect';
          link.crossOrigin = 'anonymous';
          fragment.appendChild(link);
        }
      });
      
      // Insérer toutes les préconnexions en une seule fois
      if (fragment.childNodes.length > 0) {
        document.head.appendChild(fragment);
      }
    } catch (err) {
      // Réduire la verbosité en production
      if (!isProduction()) {
        console.warn('[LCP Boost] Erreur lors de l\'optimisation:', err);
      }
    }
  }
  
  // Exécuter immédiatement
  optimizeLCP();
  
  // Exécuter à nouveau lors du chargement du DOM si nécessaire
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', optimizeLCP, { once: true });
  }
})(); 