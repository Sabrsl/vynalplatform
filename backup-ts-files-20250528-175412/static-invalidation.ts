/**
 * Utilitaires pour l'invalidation des pages statiques
 * Ce module fournit des fonctions pour invalider les pages statiques lorsque des événements pertinents se produisent
 */

import { revalidatePath } from "next/cache";
import { eventEmitter, EVENTS } from "@/lib/utils/events";

// Étendre l'interface Window pour inclure nos propriétés personnalisées
declare global {
  interface Window {
    _pathInvalidationTimestamps?: Record<string, number>;
  }
}

/**
 * Pages statiques de l'application
 */
export const STATIC_PAGES = {
  ABOUT: "/about",
  HOW_IT_WORKS: "/how-it-works",
  STATUS: "/status",
  FREELANCE: "/devenir-freelance",
  CONTACT: "/contact",
  FAQ: "/faq",
  TERMS: "/terms-of-service",
  PRIVACY: "/privacy-policy",
  CODE_OF_CONDUCT: "/code-of-conduct",
  HOME: "/",
  SERVICES: "/services",
  FREELANCE_SERVICES: "/dashboard/freelance/services",
};

// Map pour suivre les invalidations en cours par chemin
const pendingInvalidations = new Map<string, NodeJS.Timeout>();

/**
 * Fonction utilitaire pour invalider les pages via l'API de revalidation avec debounce.
 * Cette fonction n'est utilisée que côté client.
 * @param path Chemin à invalider
 * @param forceRevalidate Forcer l'invalidation même si rate limit
 */
function fetchRevalidate(path: string, forceRevalidate: boolean = false): void {
  if (typeof fetch === "undefined") return;

  // Debounce: annuler toute invalidation précédente en cours pour ce chemin
  if (pendingInvalidations.has(path)) {
    clearTimeout(pendingInvalidations.get(path));
    pendingInvalidations.delete(path);
  }

  // Variable globale pour stocker le dernier timestamp d'invalidation pour chaque chemin
  if (typeof window !== "undefined" && !window._pathInvalidationTimestamps) {
    window._pathInvalidationTimestamps = {};
  }

  // Récupérer le dernier timestamp d'invalidation pour ce chemin de manière sécurisée
  const lastInvalidationTime =
    typeof window !== "undefined" && window._pathInvalidationTimestamps
      ? window._pathInvalidationTimestamps[path] || 0
      : 0;

  const now = Date.now();
  const MIN_CLIENT_REVALIDATION_INTERVAL = 10000; // 10 secondes entre chaque tentative côté client (augmenté de 5s à 10s)

  // Si la dernière invalidation est trop récente et ce n'est pas une requête forcée, ne pas réessayer
  if (
    !forceRevalidate &&
    now - lastInvalidationTime < MIN_CLIENT_REVALIDATION_INTERVAL
  ) {
    console.log(
      `Invalidation ignorée pour ${path} - trop récente (${Math.floor((now - lastInvalidationTime) / 1000)}s)`,
    );
    return;
  }

  // Créer un nouveau timeout pour cette invalidation (600ms de debounce - augmenté de 400ms à 600ms)
  const timeoutId = setTimeout(() => {
    try {
      // Mettre à jour le timestamp avant de faire la requête de manière sécurisée
      if (typeof window !== "undefined" && window._pathInvalidationTimestamps) {
        window._pathInvalidationTimestamps[path] = now;
      }

      fetch(
        `/api/revalidate?path=${encodeURIComponent(path)}${forceRevalidate ? "&force=true" : ""}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        },
      )
        .then((response) => {
          if (response.status === 429) {
            // En cas de rate limit, simplement logger et ne pas réessayer automatiquement
            console.log(
              `Invalidation limitée pour ${path}, pas de nouvelle tentative automatique`,
            );
            return { revalidated: false, throttled: true };
          }

          if (!response.ok) {
            console.error(
              `Échec de l'invalidation via API pour ${path}:`,
              response.status,
            );
            return response.json();
          }
          return response.json();
        })
        .then((data) => {
          if (data.revalidated) {
            console.log(`Page ${path} invalidée avec succès via API`);
          } else if (data.error && !data.throttled) {
            console.error(
              `Erreur lors de l'invalidation de ${path}:`,
              data.error,
            );
          }
        })
        .catch((err) => {
          console.error(
            `Erreur lors de l'invalidation via API pour ${path}:`,
            err,
          );
        })
        .finally(() => {
          // Retirer ce chemin de la map des invalidations en attente
          pendingInvalidations.delete(path);
        });
    } catch (error) {
      console.error(`Erreur lors de l'invalidation de ${path}:`, error);
      pendingInvalidations.delete(path);
    }
  }, 600); // Délai de debounce augmenté à 600ms

  // Stocker le timeoutId dans la map
  pendingInvalidations.set(path, timeoutId);
}

/**
 * Initialise les écouteurs d'événements pour l'invalidation des pages statiques
 * Cette fonction doit être appelée une seule fois au démarrage de l'application
 */
export function initStaticPagesInvalidation(): void {
  // N'attacher les écouteurs que côté client
  if (typeof window !== "undefined") {
    // Pour chaque événement d'invalidation, utiliser l'API de revalidation
    eventEmitter.on(EVENTS.INVALIDATE_ABOUT, () => {
      console.log(`⚡ Invalidation de la page À propos: ${STATIC_PAGES.ABOUT}`);
      fetchRevalidate(STATIC_PAGES.ABOUT);
    });

    eventEmitter.on(EVENTS.INVALIDATE_HOW_IT_WORKS, () => {
      console.log(
        `⚡ Invalidation de la page Comment ça marche: ${STATIC_PAGES.HOW_IT_WORKS}`,
      );
      fetchRevalidate(STATIC_PAGES.HOW_IT_WORKS);
    });

    eventEmitter.on(EVENTS.INVALIDATE_STATUS, () => {
      console.log(
        `⚡ Invalidation du cache de la page Statut: ${STATIC_PAGES.STATUS}`,
      );
      fetchRevalidate(STATIC_PAGES.STATUS);
    });

    eventEmitter.on(EVENTS.INVALIDATE_FREELANCE, () => {
      console.log(
        `⚡ Invalidation de la page Devenir freelance: ${STATIC_PAGES.FREELANCE}`,
      );
      fetchRevalidate(STATIC_PAGES.FREELANCE);
    });

    eventEmitter.on(EVENTS.INVALIDATE_CONTACT, () => {
      console.log(
        `⚡ Invalidation de la page Contact: ${STATIC_PAGES.CONTACT}`,
      );
      fetchRevalidate(STATIC_PAGES.CONTACT);
    });

    eventEmitter.on(EVENTS.INVALIDATE_FAQ, () => {
      console.log(`⚡ Invalidation de la page FAQ: ${STATIC_PAGES.FAQ}`);
      fetchRevalidate(STATIC_PAGES.FAQ);
    });

    eventEmitter.on(EVENTS.INVALIDATE_TERMS, () => {
      console.log(
        `⚡ Invalidation de la page Conditions d'utilisation: ${STATIC_PAGES.TERMS}`,
      );
      fetchRevalidate(STATIC_PAGES.TERMS);
    });

    eventEmitter.on(EVENTS.INVALIDATE_PRIVACY, () => {
      console.log(
        `⚡ Invalidation de la page Politique de confidentialité: ${STATIC_PAGES.PRIVACY}`,
      );
      fetchRevalidate(STATIC_PAGES.PRIVACY);
    });

    eventEmitter.on(EVENTS.INVALIDATE_CODE_OF_CONDUCT, () => {
      console.log(
        `⚡ Invalidation de la page Code de conduite: ${STATIC_PAGES.CODE_OF_CONDUCT}`,
      );
      fetchRevalidate(STATIC_PAGES.CODE_OF_CONDUCT);
    });

    eventEmitter.on(EVENTS.INVALIDATE_HOME, () => {
      console.log(`⚡ Invalidation de la page d'accueil: ${STATIC_PAGES.HOME}`);
      fetchRevalidate(STATIC_PAGES.HOME);
    });

    eventEmitter.on(EVENTS.INVALIDATE_SERVICES, () => {
      console.log(
        `⚡ Invalidation de la page des services: ${STATIC_PAGES.SERVICES}`,
      );
      fetchRevalidate(STATIC_PAGES.SERVICES);
    });

    // Écouteur pour invalider toutes les pages statiques d'un coup
    eventEmitter.on(EVENTS.INVALIDATE_STATIC_PAGES, () => {
      Object.values(STATIC_PAGES).forEach((path) => fetchRevalidate(path));
    });

    console.log(
      "Écouteurs d'invalidation des pages statiques initialisés (mode client)",
    );
  } else {
    // Côté serveur, utiliser directement revalidatePath
    eventEmitter.on(EVENTS.INVALIDATE_ABOUT, () =>
      revalidatePath(STATIC_PAGES.ABOUT),
    );
    eventEmitter.on(EVENTS.INVALIDATE_HOW_IT_WORKS, () =>
      revalidatePath(STATIC_PAGES.HOW_IT_WORKS),
    );
    eventEmitter.on(EVENTS.INVALIDATE_STATUS, () =>
      revalidatePath(STATIC_PAGES.STATUS),
    );
    eventEmitter.on(EVENTS.INVALIDATE_FREELANCE, () =>
      revalidatePath(STATIC_PAGES.FREELANCE),
    );
    eventEmitter.on(EVENTS.INVALIDATE_CONTACT, () =>
      revalidatePath(STATIC_PAGES.CONTACT),
    );
    eventEmitter.on(EVENTS.INVALIDATE_FAQ, () =>
      revalidatePath(STATIC_PAGES.FAQ),
    );
    eventEmitter.on(EVENTS.INVALIDATE_TERMS, () =>
      revalidatePath(STATIC_PAGES.TERMS),
    );
    eventEmitter.on(EVENTS.INVALIDATE_PRIVACY, () =>
      revalidatePath(STATIC_PAGES.PRIVACY),
    );
    eventEmitter.on(EVENTS.INVALIDATE_CODE_OF_CONDUCT, () =>
      revalidatePath(STATIC_PAGES.CODE_OF_CONDUCT),
    );
    eventEmitter.on(EVENTS.INVALIDATE_HOME, () =>
      revalidatePath(STATIC_PAGES.HOME),
    );
    eventEmitter.on(EVENTS.INVALIDATE_SERVICES, () =>
      revalidatePath(STATIC_PAGES.SERVICES),
    );
    eventEmitter.on(EVENTS.INVALIDATE_STATIC_PAGES, () => {
      Object.values(STATIC_PAGES).forEach((path) => revalidatePath(path));
    });

    console.log(
      "Écouteurs d'invalidation des pages statiques initialisés (mode serveur)",
    );
  }
}

/**
 * Invalide une page statique spécifique
 * @param page Chemin de la page à invalider
 */
export function invalidateStaticPage(page: keyof typeof STATIC_PAGES): void {
  const path = STATIC_PAGES[page];
  if (!path) return;

  if (typeof window === "undefined") {
    // Côté serveur
    try {
      revalidatePath(path);
      console.log(`Page statique ${path} invalidée côté serveur`);
    } catch (error) {
      console.error(
        `Erreur lors de l'invalidation de ${path} côté serveur:`,
        error,
      );
    }
  } else {
    // Côté client
    fetchRevalidate(path);
    console.log(`Invalidation de la page ${path} demandée côté client`);
  }
}

/**
 * Invalide toutes les pages statiques
 */
export function invalidateAllStaticPages(): void {
  if (typeof window === "undefined") {
    // Côté serveur
    try {
      Object.values(STATIC_PAGES).forEach((path) => revalidatePath(path));
      console.log("Toutes les pages statiques invalidées côté serveur");
    } catch (error) {
      console.error(
        "Erreur lors de l'invalidation de toutes les pages statiques côté serveur:",
        error,
      );
    }
  } else {
    // Côté client
    Object.values(STATIC_PAGES).forEach((path) => fetchRevalidate(path));
    console.log(
      "Invalidation de toutes les pages statiques demandée côté client",
    );
  }
}

/**
 * Invalide la page des services
 * À utiliser lorsqu'un service est validé ou modifié
 */
export function invalidateServicesPage(): void {
  if (typeof window === "undefined") {
    // Côté serveur, utiliser directement revalidatePath
    try {
      revalidatePath(STATIC_PAGES.SERVICES);
      console.log("Page des services invalidée côté serveur");
    } catch (error) {
      console.error(
        "Erreur lors de l'invalidation de la page des services côté serveur:",
        error,
      );
    }
  } else {
    // Côté client, utiliser l'API
    fetchRevalidate(STATIC_PAGES.SERVICES);
    console.log("Invalidation de la page des services demandée côté client");
  }
}
