/**
 * Utilitaires pour l'invalidation des pages statiques
 * Ce module fournit des fonctions pour invalider les pages statiques lorsque des événements pertinents se produisent
 */

import { revalidatePath } from 'next/cache';
import { eventEmitter, EVENTS } from '@/lib/utils/events';

/**
 * Pages statiques de l'application
 */
export const STATIC_PAGES = {
  ABOUT: '/about',
  HOW_IT_WORKS: '/how-it-works',
  STATUS: '/status',
  FREELANCE: '/devenir-freelance',
  CONTACT: '/contact',
  FAQ: '/faq',
  TERMS: '/terms-of-service',
  PRIVACY: '/privacy-policy',
  CODE_OF_CONDUCT: '/code-of-conduct',
  HOME: '/',
};

/**
 * Initialise les écouteurs d'événements pour l'invalidation des pages statiques
 * Cette fonction doit être appelée une seule fois au démarrage de l'application
 */
export function initStaticPagesInvalidation(): void {
  // Écouteurs pour chaque page statique spécifique
  eventEmitter.on(EVENTS.INVALIDATE_ABOUT, () => {
    console.log(`⚡ Invalidation de la page À propos: ${STATIC_PAGES.ABOUT}`);
    revalidatePath(STATIC_PAGES.ABOUT);
  });
  eventEmitter.on(EVENTS.INVALIDATE_HOW_IT_WORKS, () => {
    console.log(`⚡ Invalidation de la page Comment ça marche: ${STATIC_PAGES.HOW_IT_WORKS}`);
    revalidatePath(STATIC_PAGES.HOW_IT_WORKS);
  });
  eventEmitter.on(EVENTS.INVALIDATE_STATUS, () => {
    console.log(`⚡ Invalidation du cache de la page Statut: ${STATIC_PAGES.STATUS}`);
    revalidatePath(STATIC_PAGES.STATUS);
  });
  eventEmitter.on(EVENTS.INVALIDATE_FREELANCE, () => {
    console.log(`⚡ Invalidation de la page Devenir freelance: ${STATIC_PAGES.FREELANCE}`);
    revalidatePath(STATIC_PAGES.FREELANCE);
  });
  eventEmitter.on(EVENTS.INVALIDATE_CONTACT, () => {
    console.log(`⚡ Invalidation de la page Contact: ${STATIC_PAGES.CONTACT}`);
    revalidatePath(STATIC_PAGES.CONTACT);
  });
  eventEmitter.on(EVENTS.INVALIDATE_FAQ, () => {
    console.log(`⚡ Invalidation de la page FAQ: ${STATIC_PAGES.FAQ}`);
    revalidatePath(STATIC_PAGES.FAQ);
  });
  eventEmitter.on(EVENTS.INVALIDATE_TERMS, () => {
    console.log(`⚡ Invalidation de la page Conditions d'utilisation: ${STATIC_PAGES.TERMS}`);
    revalidatePath(STATIC_PAGES.TERMS);
  });
  eventEmitter.on(EVENTS.INVALIDATE_PRIVACY, () => {
    console.log(`⚡ Invalidation de la page Politique de confidentialité: ${STATIC_PAGES.PRIVACY}`);
    revalidatePath(STATIC_PAGES.PRIVACY);
  });
  eventEmitter.on(EVENTS.INVALIDATE_CODE_OF_CONDUCT, () => {
    console.log(`⚡ Invalidation de la page Code de conduite: ${STATIC_PAGES.CODE_OF_CONDUCT}`);
    revalidatePath(STATIC_PAGES.CODE_OF_CONDUCT);
  });
  eventEmitter.on(EVENTS.INVALIDATE_HOME, () => {
    console.log(`⚡ Invalidation de la page d'accueil: ${STATIC_PAGES.HOME}`);
    revalidatePath(STATIC_PAGES.HOME);
  });

  // Écouteur pour invalider toutes les pages statiques d'un coup
  eventEmitter.on(EVENTS.INVALIDATE_STATIC_PAGES, () => {
    Object.values(STATIC_PAGES).forEach(path => revalidatePath(path));
  });

  console.log('Écouteurs d\'invalidation des pages statiques initialisés');
}

/**
 * Invalide une page statique spécifique
 * @param page Chemin de la page à invalider
 */
export function invalidateStaticPage(page: keyof typeof STATIC_PAGES): void {
  const path = STATIC_PAGES[page];
  if (path) {
    revalidatePath(path);
    console.log(`Page statique invalidée: ${path}`);
  }
}

/**
 * Invalide toutes les pages statiques
 */
export function invalidateAllStaticPages(): void {
  Object.values(STATIC_PAGES).forEach(path => revalidatePath(path));
  console.log('Toutes les pages statiques invalidées');
} 