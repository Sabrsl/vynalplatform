/**
 * Service de rafraîchissement des services
 * Ce module permet de forcer le rafraîchissement des composants qui affichent des services
 * lorsque des services sont validés, rejetés ou dépubliés.
 */

import { setCachedData } from "@/lib/optimizations";

// Intervalle en millisecondes pour le rafraîchissement automatique
const AUTO_REFRESH_INTERVAL = 10000; // 10 secondes

// Stockage des écouteurs de rafraîchissement
const refreshListeners: Array<() => void> = [];

// ID des intervalles pour pouvoir les nettoyer
let autoRefreshIntervalId: number | null = null;
let isAutoRefreshActive = false;

/**
 * Ajoute un écouteur de rafraîchissement
 * @param listener Fonction à appeler lors du rafraîchissement
 * @returns Fonction pour retirer l'écouteur
 */
export function addRefreshListener(listener: () => void): () => void {
  refreshListeners.push(listener);

  return () => {
    const index = refreshListeners.indexOf(listener);
    if (index !== -1) {
      refreshListeners.splice(index, 1);
    }
  };
}

/**
 * Déclenche le rafraîchissement de tous les composants enregistrés
 */
export function triggerRefresh(): void {
  console.log(
    `Rafraîchissement déclenché pour ${refreshListeners.length} composant(s)`,
  );
  refreshListeners.forEach((listener) => {
    try {
      listener();
    } catch (error) {
      console.error("Erreur lors du rafraîchissement:", error);
    }
  });
}

/**
 * Active le rafraîchissement automatique des composants
 * Utile après une action d'administration pour s'assurer que les mises à jour sont propagées
 * @param duration Durée en millisecondes pendant laquelle le rafraîchissement sera actif (0 = illimité)
 */
export function startAutoRefresh(duration: number = 30000): void {
  // Arrêter l'ancien intervalle s'il existe
  stopAutoRefresh();

  // Démarrer un nouvel intervalle
  isAutoRefreshActive = true;
  autoRefreshIntervalId = window.setInterval(() => {
    if (isAutoRefreshActive) {
      triggerRefresh();
    } else {
      stopAutoRefresh();
    }
  }, AUTO_REFRESH_INTERVAL);

  console.log(
    `Rafraîchissement automatique activé (intervalle: ${AUTO_REFRESH_INTERVAL}ms)`,
  );

  // Si une durée est spécifiée, programmer l'arrêt
  if (duration > 0) {
    setTimeout(() => {
      stopAutoRefresh();
    }, duration);
    console.log(
      `Le rafraîchissement automatique s'arrêtera dans ${duration}ms`,
    );
  }
}

/**
 * Arrête le rafraîchissement automatique
 */
export function stopAutoRefresh(): void {
  if (autoRefreshIntervalId !== null) {
    window.clearInterval(autoRefreshIntervalId);
    autoRefreshIntervalId = null;
    isAutoRefreshActive = false;
    console.log("Rafraîchissement automatique désactivé");
  }
}

/**
 * Initialise les écouteurs d'événements pour le rafraîchissement automatique
 * Cette fonction doit être appelée une fois au démarrage de l'application
 */
export function initRefreshListeners(): void {
  if (typeof window === "undefined") return;

  // Rafraîchissement lors des événements de mise à jour de service
  window.addEventListener("vynal:service-updated", () => {
    triggerRefresh();
    // Démarrer le rafraîchissement automatique pendant 1 minute
    startAutoRefresh(60000);
  });

  // Rafraîchissement lors des événements d'invalidation de cache
  window.addEventListener("vynal:cache-invalidated", (e: any) => {
    // Vérifier si l'événement concerne les services
    if (
      e.detail?.keys?.includes("services_") ||
      e.detail?.keys?.includes("freelance_services_")
    ) {
      triggerRefresh();
      startAutoRefresh(30000);
    }
  });

  // Rafraîchissement lors des événements spécifiques aux services freelance
  window.addEventListener("vynal:freelance-services-updated", () => {
    triggerRefresh();
    startAutoRefresh(30000);
  });

  // Arrêter le rafraîchissement automatique quand l'utilisateur quitte la page
  window.addEventListener("beforeunload", () => {
    stopAutoRefresh();
  });

  console.log("Écouteurs de rafraîchissement initialisés");
}
