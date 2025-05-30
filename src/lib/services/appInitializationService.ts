/**
 * Service d'initialisation de l'application
 * Ce module gère l'initialisation des différents services et systèmes de l'application
 */

import { initStaticPagesInvalidation, STATIC_PAGES } from '@/lib/optimizations/static-invalidation';
import { attachServiceListeners } from '@/lib/services/servicesInvalidationService';
import { initRefreshListeners } from '@/lib/services/servicesRefreshService';

/**
 * Initialise tous les services et systèmes nécessaires au démarrage de l'application
 */
export function initializeApplication(): void {
  console.log('📌 Initialisation de l\'application...');
  
  try {
    // Initialiser le système d'invalidation des pages statiques
    initStaticPagesInvalidation();
    console.log(`🔄 Système d'invalidation configuré pour la page FAQ: ${STATIC_PAGES.FAQ}`);
    console.log(`🔄 Système d'invalidation configuré pour la page À propos: ${STATIC_PAGES.ABOUT}`);
    console.log(`🔄 Système d'invalidation configuré pour la page Comment ça marche: ${STATIC_PAGES.HOW_IT_WORKS}`);
    console.log(`🔄 Système d'invalidation configuré pour la page Devenir freelance: ${STATIC_PAGES.FREELANCE}`);
    console.log(`🔄 Page Statut configurée avec cache (30 jours): ${STATIC_PAGES.STATUS}`);
    console.log(`🔄 Système d'invalidation configuré pour la page Contact: ${STATIC_PAGES.CONTACT}`);
    console.log(`🔄 Système d'invalidation configuré pour la page Conditions d'utilisation: ${STATIC_PAGES.TERMS}`);
    console.log(`🔄 Système d'invalidation configuré pour la page Politique de confidentialité: ${STATIC_PAGES.PRIVACY}`);
    console.log(`🔄 Système d'invalidation configuré pour la page Code de conduite: ${STATIC_PAGES.CODE_OF_CONDUCT}`);
    console.log('🔄 Système d\'invalidation configuré pour la page d\'accueil');
    console.log(`🔄 Système d'invalidation configuré pour la page des services: ${STATIC_PAGES.SERVICES}`);
    
    // Initialiser le service d'invalidation des services
    attachServiceListeners();
    
    // Initialiser le service de rafraîchissement automatique des services
    if (typeof window !== 'undefined') {
      initRefreshListeners();
      console.log('🔄 Service de rafraîchissement automatique des services initialisé');
    }
    
    console.log('✅ Initialisation de l\'application terminée avec succès');
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation de l\'application:', error);
  }
} 