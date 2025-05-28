/**
 * Service de rafraÃ®chissement des services
 * Ce module permet de forcer le rafraÃ®chissement des composants qui affichent des services
 * lorsque des services sont validÃ©s, rejetÃ©s ou dÃ©publiÃ©s.
 */

// import { setCachedData } from '@/lib/optimizations'; // Imports inutilisÃ©s: setCachedData

// Intervalle en millisecondes pour le rafraÃ®chissement automatique
const AUTO_REFRESH_INTERVAL = 10000; // 10 secondes

// Stockage des Ã©couteurs de rafraÃ®chissement
const refreshListeners: Array<() => void> = [];

// ID des intervalles pour pouvoir les nettoyer
let autoRefreshIntervalId: number | null = null;
let isAutoRefreshActive = false;

/**
 * Ajoute un Ã©couteur de rafraÃ®chissement
 * @param listener Fonction Ã  appeler lors du rafraÃ®chissement
 * @returns Fonction pour retirer l'Ã©couteur
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
 * DÃ©clenche le rafraÃ®chissement de tous les composants enregistrÃ©s
 */
export function triggerRefresh(): void {
  console.log(
    `RafraÃ®chissement dÃ©clenchÃ© pour ${refreshListeners.length} composant(s)`,
  );
  refreshListeners.forEach((listener) => {
    try {
      listener();
    } catch (error) {
      console.error("Erreur lors du rafraÃ®chissement:", error);
    }
  });
}

/**
 * Active le rafraÃ®chissement automatique des composants
 * Utile aprÃ¨s une action d'administration pour s'assurer que les mises Ã  jour sont propagÃ©es
 * @param duration DurÃ©e en millisecondes pendant laquelle le rafraÃ®chissement sera actif (0 = illimitÃ©)
 */
export function startAutoRefresh(duration: number = 30000): void {
  // ArrÃªter l'ancien intervalle s'il existe
  stopAutoRefresh();

  // DÃ©marrer un nouvel intervalle
  isAutoRefreshActive = true;
  autoRefreshIntervalId = window.setInterval(() => {
    if (isAutoRefreshActive) {
      triggerRefresh();
    } else {
      stopAutoRefresh();
    }
  }, AUTO_REFRESH_INTERVAL);

  console.log(
    `RafraÃ®chissement automatique activÃ© (intervalle: ${AUTO_REFRESH_INTERVAL}ms)`,
  );

  // Si une durÃ©e est spÃ©cifiÃ©e, programmer l'arrÃªt
  if (duration > 0) {
    setTimeout(() => {
      stopAutoRefresh();
    }, duration);
    console.log(
      `Le rafraÃ®chissement automatique s'arrÃªtera dans ${duration}ms`,
    );
  }
}

/**
 * ArrÃªte le rafraÃ®chissement automatique
 */
export function stopAutoRefresh(): void {
  if (autoRefreshIntervalId !== null) {
    window.clearInterval(autoRefreshIntervalId);
    autoRefreshIntervalId = null;
    isAutoRefreshActive = false;
    console.log("RafraÃ®chissement automatique dÃ©sactivÃ©");
  }
}

/**
 * Initialise les Ã©couteurs d'Ã©vÃ©nements pour le rafraÃ®chissement automatique
 * Cette fonction doit Ãªtre appelÃ©e une fois au dÃ©marrage de l'application
 */
export function initRefreshListeners(): void {
  if (typeof window === "undefined") return;

  // RafraÃ®chissement lors des Ã©vÃ©nements de mise Ã  jour de service
  window.addEventListener("vynal:service-updated", () => {
    triggerRefresh();
    // DÃ©marrer le rafraÃ®chissement automatique pendant 1 minute
    startAutoRefresh(60000);
  });

  // RafraÃ®chissement lors des Ã©vÃ©nements d'invalidation de cache
  window.addEventListener("vynal:cache-invalidated", (e: any) => {
    // VÃ©rifier si l'Ã©vÃ©nement concerne les services
    if (
      e.detail?.keys?.includes("services_") ||
      e.detail?.keys?.includes("freelance_services_")
    ) {
      triggerRefresh();
      startAutoRefresh(30000);
    }
  });

  // RafraÃ®chissement lors des Ã©vÃ©nements spÃ©cifiques aux services freelance
  window.addEventListener("vynal:freelance-services-updated", () => {
    triggerRefresh();
    startAutoRefresh(30000);
  });

  // ArrÃªter le rafraÃ®chissement automatique quand l'utilisateur quitte la page
  window.addEventListener("beforeunload", () => {
    stopAutoRefresh();
  });

  console.log("Ã‰couteurs de rafraÃ®chissement initialisÃ©s");
}
