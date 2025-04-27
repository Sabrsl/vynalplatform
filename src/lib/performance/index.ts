/**
 * Module de performance pour la messagerie
 * Exportations centralisées et utilitaires pour les mesures de performance
 */

export * from './metrics';

// Initialisation des outils de performance au démarrage de l'application
export function initializePerformanceMonitoring() {
  // Activation des mesures via l'API Performance si disponible
  if (typeof performance !== 'undefined' && performance.mark && process.env.NODE_ENV !== 'production') {
    console.debug('🚀 Monitoring de performance activé');
    
    // Enregistrer le temps de démarrage initial
    performance.mark('app_start');
    
    // Écouter l'événement de chargement complet du DOM
    if (typeof window !== 'undefined') {
      window.addEventListener('load', () => {
        performance.mark('app_loaded');
        try {
          performance.measure('initial_load_time', 'app_start', 'app_loaded');
          const entries = performance.getEntriesByName('initial_load_time');
          if (entries.length > 0) {
            console.debug(`📊 Temps de chargement initial: ${Math.round(entries[0].duration)}ms`);
          }
        } catch (e) {
          console.error('Erreur lors de la mesure du temps de chargement:', e);
        }
      });
    }
  }
} 