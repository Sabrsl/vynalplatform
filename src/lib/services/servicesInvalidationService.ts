/**
 * Service d'invalidation des pages de services
 * Ce module fournit des fonctions pour invalider la page des services lorsque des services sont créés,
 * validés ou modifiés.
 */

import { eventEmitter, EVENTS } from '@/lib/utils/events';
import { invalidateServicesPage } from '@/lib/optimizations/static-invalidation';

/**
 * Déclenche l'invalidation du cache de la page des services
 * Cette fonction doit être appelée lorsqu'un service est validé par un administrateur
 * ou lorsqu'une modification d'un service existant est acceptée.
 */
export function triggerServicesInvalidation(): void {
  // Emission de l'événement pour l'invalidation de la page services
  eventEmitter.emit(EVENTS.INVALIDATE_SERVICES);
  console.log('Événement d\'invalidation des services émis');
}

/**
 * Déclenche l'invalidation du cache de la page des services après validation d'un service
 * @param serviceId ID du service validé
 * @param serviceTitle Titre du service
 */
export function invalidateAfterServiceValidation(serviceId: string, serviceTitle: string): void {
  triggerServicesInvalidation();
  console.log(`Cache invalidé après validation du service ID: ${serviceId} - "${serviceTitle}"`);
}

/**
 * Déclenche l'invalidation du cache de la page des services après modification d'un service
 * @param serviceId ID du service modifié
 * @param serviceTitle Titre du service
 */
export function invalidateAfterServiceUpdate(serviceId: string, serviceTitle: string): void {
  triggerServicesInvalidation();
  console.log(`Cache invalidé après modification du service ID: ${serviceId} - "${serviceTitle}"`);
}

/**
 * Fonction pour attacher les écouteurs d'événements aux événements liés aux services
 * Cette fonction doit être appelée au démarrage de l'application
 */
export function attachServiceListeners(): void {
  // On pourrait ajouter ici des écouteurs pour des événements spécifiques
  // provenant d'autres parties de l'application qui nécessiteraient une invalidation
  // du cache des services.
  console.log('Écouteurs d\'événements pour l\'invalidation des services attachés');
} 