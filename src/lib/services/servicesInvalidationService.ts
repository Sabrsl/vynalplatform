/**
 * Service d'invalidation des pages de services
 * Ce module fournit des fonctions pour invalider la page des services lorsque des services sont créés,
 * validés ou modifiés.
 */

import { eventEmitter, EVENTS } from '@/lib/utils/events';
import { invalidateServicesPage } from '@/lib/optimizations/static-invalidation';
import { setCachedData } from '@/lib/optimizations';

// Étendre l'interface Window pour inclure nos propriétés personnalisées
declare global {
  interface Window {
    _pollingInProgress?: boolean;
  }
}

// Clés de cache pour les services (duplications pour éviter les erreurs de référence)
const SERVICE_CACHE_KEYS = {
  ADMIN_SERVICES_LIST: 'admin_services_list_',
  ADMIN_VALIDATION_SERVICES: 'admin_validation_services_',
  SERVICES: 'services_',
  FREELANCE_SERVICES: 'freelance_services_'
};

// Configuration pour le polling
const POLLING_CONFIG = {
  INTERVAL: 7000, // 7 secondes entre chaque vérification (augmenté de 5s à 7s)
  MAX_ATTEMPTS: 2  // Maximum 2 tentatives (réduit de 3 à 2 pour limiter encore plus)
};

// Map pour suivre les services en cours d'invalidation
const servicesBeingInvalidated = new Map<string, NodeJS.Timeout>();

/**
 * Déclenche l'invalidation du cache de la page des services
 * Cette fonction doit être appelée lorsqu'un service est validé par un administrateur
 * ou lorsqu'une modification d'un service existant est acceptée.
 */
export function triggerServicesInvalidation(): void {
  // Émission de l'événement pour l'invalidation de la page services
  eventEmitter.emit(EVENTS.INVALIDATE_SERVICES);
  
  // Invalider la page statique des services
  invalidateServicesPage();
  
  // Invalider tous les caches liés aux services
  Object.values(SERVICE_CACHE_KEYS).forEach(key => {
    setCachedData(key, null, { expiry: 0 });
  });
  
  // Déclencher l'événement DOM pour mettre à jour les autres composants
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('vynal:service-updated'));
    window.dispatchEvent(new CustomEvent('vynal:cache-invalidated', { 
      detail: { keys: Object.values(SERVICE_CACHE_KEYS) }
    }));
    window.dispatchEvent(new CustomEvent('vynal:freelance-services-updated'));
  }
  
  console.log('Événement d\'invalidation des services émis et cache invalidé');
}

/**
 * Déclenche l'invalidation du cache de la page des services après validation d'un service
 * @param serviceId ID du service validé
 * @param serviceTitle Titre du service
 */
export function invalidateAfterServiceValidation(serviceId: string, serviceTitle: string): void {
  try {
    console.log(`Début de l'invalidation après validation du service ${serviceId}`);
    
    // Utiliser des clés spécifiques pour cibler uniquement le service modifié
    const specificCacheKeys = [
      `${SERVICE_CACHE_KEYS.SERVICES}${serviceId}`,
      `${SERVICE_CACHE_KEYS.FREELANCE_SERVICES}${serviceId}`
    ];
    
    // Invalider d'abord le cache spécifique au service
    specificCacheKeys.forEach(key => {
      setCachedData(key, null, { expiry: 0 });
    });
    
    // Invalider les listes principales, mais pas toutes les clés pour réduire la charge
    const mainCacheKeys = [
      SERVICE_CACHE_KEYS.SERVICES,
      SERVICE_CACHE_KEYS.ADMIN_SERVICES_LIST
    ];
    
    mainCacheKeys.forEach(key => {
      setCachedData(key, null, { expiry: 0 });
    });
    
    // Invalider la page statique des services
    invalidateServicesPage();
    
    // Émettre des événements optimisés avec les données du service
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('vynal:service-updated', {
        detail: { serviceId, serviceTitle, action: 'validation' }
      }));
      
      window.dispatchEvent(new CustomEvent('vynal:cache-invalidated', { 
        detail: { 
          keys: mainCacheKeys,
          specificKeys: specificCacheKeys,
          serviceId
        }
      }));
    }
    
    // Mise en place d'un polling optimisé pour ce service spécifique
    startPollingCacheInvalidation([serviceId]);
    
    console.log(`Cache invalidé après validation du service ID: ${serviceId} - "${serviceTitle}"`);
  } catch (error) {
    console.error(`Erreur lors de l'invalidation du service ${serviceId}:`, error);
  }
}

/**
 * Déclenche l'invalidation du cache de la page des services après modification d'un service
 * @param serviceId ID du service modifié
 * @param serviceTitle Titre du service
 */
export function invalidateAfterServiceUpdate(serviceId: string, serviceTitle: string): void {
  try {
    // Vérifier si ce service est déjà en cours d'invalidation
    if (servicesBeingInvalidated.has(serviceId)) {
      // Annuler l'invalidation précédente
      clearTimeout(servicesBeingInvalidated.get(serviceId));
      console.log(`Invalidation précédente annulée pour le service ${serviceId}`);
    }
    
    // Effectuer l'invalidation après un court délai pour permettre de regrouper les changements multiples
    const timeoutId = setTimeout(() => {
      // Utiliser des clés spécifiques pour cibler uniquement le service modifié
      const specificCacheKeys = [
        `${SERVICE_CACHE_KEYS.SERVICES}${serviceId}`,
        `${SERVICE_CACHE_KEYS.FREELANCE_SERVICES}${serviceId}`
      ];
      
      // Invalider le cache spécifique au service
      specificCacheKeys.forEach(key => {
        setCachedData(key, null, { expiry: 0 });
      });
      
      // Invalider également les listes qui pourraient contenir ce service
      Object.values(SERVICE_CACHE_KEYS).forEach(key => {
        setCachedData(key, null, { expiry: 0 });
      });
      
      // Invalider la page statique des services
      invalidateServicesPage();
      
      // Déclencher un événement avec l'ID du service pour une invalidation ciblée
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('vynal:service-updated', {
          detail: { serviceId, serviceTitle }
        }));
        window.dispatchEvent(new CustomEvent('vynal:cache-invalidated', { 
          detail: { 
            keys: Object.values(SERVICE_CACHE_KEYS),
            specificKeys: specificCacheKeys,
            serviceId
          }
        }));
        window.dispatchEvent(new CustomEvent('vynal:freelance-services-updated', {
          detail: { serviceId, serviceTitle }
        }));
      }
      
      // Mise en place d'un polling pour s'assurer que les changements sont propagés
      startPollingCacheInvalidation([serviceId]);
      
      console.log(`Cache invalidé après modification du service ID: ${serviceId} - "${serviceTitle}"`);
      
      // Retirer le service de la map une fois l'invalidation terminée
      servicesBeingInvalidated.delete(serviceId);
    }, 200); // Délai de 200ms pour regrouper les invalidations multiples
    
    // Stocker le timeout pour pouvoir l'annuler si nécessaire
    servicesBeingInvalidated.set(serviceId, timeoutId);
  } catch (error) {
    console.error(`Erreur lors de l'invalidation du service ${serviceId}:`, error);
    // Nettoyer en cas d'erreur
    servicesBeingInvalidated.delete(serviceId);
  }
}

/**
 * Fonction pour attacher les écouteurs d'événements aux événements liés aux services
 * Cette fonction doit être appelée au démarrage de l'application
 */
export function attachServiceListeners(): void {
  // Écouter l'événement d'invalidation des services pour appeler revalidatePath
  eventEmitter.on(EVENTS.INVALIDATE_SERVICES, () => {
    invalidateServicesPage();
    console.log('Écouteur: Page des services invalidée suite à un événement');
  });
  
  // Écouter les événements de mise à jour des caches pour les services
  if (typeof window !== 'undefined') {
    // Utiliser un debounce pour éviter trop d'invalidations
    let debounceTimeout: NodeJS.Timeout | null = null;
    let lastInvalidationTime = 0;
    const MIN_INVALIDATION_INTERVAL = 10000; // 10 secondes minimum entre les invalidations (augmenté de 5s à 10s)
    
    const handleCacheInvalidation = (e: any) => {
      const now = Date.now();
      
      // Si une invalidation récente a eu lieu, annuler le debounce actuel
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
        debounceTimeout = null;
      }
      
      // Vérifier si une invalidation récente a eu lieu
      if (now - lastInvalidationTime < MIN_INVALIDATION_INTERVAL) {
        console.log(`Écouteur: Invalidation ignorée car trop récente (${Math.floor((now - lastInvalidationTime) / 1000)}s)`);
        return;
      }
      
      // Configurer un debounce pour l'invalidation
      debounceTimeout = setTimeout(() => {
        console.log(`Écouteur: Cache invalidé, page des services rafraîchie`);
        invalidateServicesPage();
        lastInvalidationTime = Date.now();
        debounceTimeout = null;
      }, 800); // 800ms de debounce (augmenté de 500ms à 800ms)
    };
    
    // S'assurer que l'événement n'est pas déjà écouté
    window.removeEventListener('vynal:cache-invalidated', handleCacheInvalidation);
    window.addEventListener('vynal:cache-invalidated', handleCacheInvalidation);
    
    // Ajouter aussi un écouteur pour l'événement de mise à jour de service
    window.removeEventListener('vynal:service-updated', handleCacheInvalidation);
    window.addEventListener('vynal:service-updated', handleCacheInvalidation);
  }
  
  console.log('Écouteurs d\'événements pour l\'invalidation des services attachés');
}

/**
 * Démarre un mécanisme de polling pour s'assurer que les caches sont invalidés
 * Cette fonction est utile pour garantir la propagation des changements même en cas d'échec initial
 */
function startPollingCacheInvalidation(specificServiceIds: string[] = []): void {
  if (typeof window === 'undefined') return;
  
  // Vérifier si un polling est déjà en cours pour éviter les pollutions
  if (window._pollingInProgress) {
    console.log('Un polling est déjà en cours, abandon du nouveau polling');
    return;
  }
  
  // Marquer qu'un polling est en cours
  window._pollingInProgress = true;
  
  let attempts = 0;
  let lastInvalidationTime = Date.now();
  const MIN_INTERVAL_BETWEEN_INVALIDATIONS = 7000; // 7 secondes entre chaque invalidation (augmenté de 5s à 7s)
  let lastApiInvalidationTime = 0;
  const MIN_API_INVALIDATION_INTERVAL = 15000; // 15 secondes entre les appels à l'API d'invalidation (augmenté de 10s à 15s)
  
  const pollingInterval = setInterval(() => {
    attempts++;
    
    // Vérifier si suffisamment de temps s'est écoulé depuis la dernière invalidation
    const now = Date.now();
    const shouldInvalidate = (now - lastInvalidationTime) >= MIN_INTERVAL_BETWEEN_INVALIDATIONS;
    
    // Log avec des informations sur la décision
    console.log(`Polling #${attempts}: ${shouldInvalidate ? 'Exécution' : 'Report'} de l'invalidation (dernier: ${Math.floor((now - lastInvalidationTime) / 1000)}s)`);
    
    if (!shouldInvalidate) {
      // Si on est trop proche de la dernière invalidation, on skip ce cycle
      return;
    }
    
    // Mettre à jour le timestamp de dernière invalidation
    lastInvalidationTime = now;
    
    // Si des IDs spécifiques sont fournis, n'invalider que les caches correspondants
    if (specificServiceIds.length > 0) {
      // Regrouper les invalidations de cache pour éviter les opérations redondantes
      const specificCacheKeys = specificServiceIds.flatMap(serviceId => [
        `${SERVICE_CACHE_KEYS.SERVICES}${serviceId}`,
        `${SERVICE_CACHE_KEYS.FREELANCE_SERVICES}${serviceId}`
      ]);
      
      // Invalider tous les caches spécifiques en une seule opération
      specificCacheKeys.forEach(key => {
        setCachedData(key, null, { expiry: 0 });
      });
      
      // N'émettre qu'un seul événement pour tous les services
      // et seulement lors de la première tentative pour éviter les cascades d'invalidation
      if (attempts === 1) {
        window.dispatchEvent(new CustomEvent('vynal:service-updated', {
          detail: { serviceIds: specificServiceIds }
        }));
      }
    } else {
      // Comportement par défaut: invalider tous les caches
      Object.values(SERVICE_CACHE_KEYS).forEach(key => {
        setCachedData(key, null, { expiry: 0 });
      });
      
      // N'émettre les événements que lors de la première tentative
      if (attempts === 1) {
        window.dispatchEvent(new CustomEvent('vynal:service-updated'));
        window.dispatchEvent(new CustomEvent('vynal:cache-invalidated', { 
          detail: { keys: Object.values(SERVICE_CACHE_KEYS) }
        }));
      }
    }
    
    // Essayer de déclencher l'invalidation via l'API UNIQUEMENT lors de la dernière tentative
    // pour éviter complètement les appels multiples à l'API
    const shouldCallApi = (now - lastApiInvalidationTime >= MIN_API_INVALIDATION_INTERVAL) && 
                         (attempts === POLLING_CONFIG.MAX_ATTEMPTS);
    
    if (shouldCallApi) {
      console.log(`Polling #${attempts}: Appel à l'API d'invalidation (dernier: ${Math.floor((now - lastApiInvalidationTime) / 1000)}s)`);
      invalidateServicesPage();
      lastApiInvalidationTime = now;
    } else {
      console.log(`Polling #${attempts}: Skip de l'API d'invalidation`);
    }
    
    console.log(`Polling #${attempts}: Invalidation des caches${specificServiceIds.length > 0 ? ` pour ${specificServiceIds.length} services spécifiques` : ''}`);
    
    // Arrêter après le nombre maximum de tentatives
    if (attempts >= POLLING_CONFIG.MAX_ATTEMPTS) {
      clearInterval(pollingInterval);
      console.log('Polling terminé: Nombre maximum de tentatives atteint');
      
      // Libérer le flag de polling en cours
      window._pollingInProgress = false;
    }
  }, POLLING_CONFIG.INTERVAL);
  
  // Nettoyer l'intervalle si l'utilisateur quitte la page
  window.addEventListener('beforeunload', () => {
    clearInterval(pollingInterval);
    window._pollingInProgress = false;
  });
}