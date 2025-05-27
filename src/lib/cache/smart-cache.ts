/**
 * Cache intelligent pour réduire les requêtes à la base de données
 */

interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiry: number;
}

class SmartCache {
  private cache = new Map<string, CacheItem<any>>();
  private pendingRequests = new Map<string, Promise<any>>();

  // Durées de cache agressives (en millisecondes)
  private readonly CACHE_DURATIONS = {
    profiles: 5 * 60 * 1000, // 5 minutes (était très spammé)
    conversations: 20 * 60 * 1000, // 20 minutes (augmenté de 10 min à 20 min)
    messages: 30 * 60 * 1000, // 30 minutes (augmenté de 10 min à 30 min)
    unread_counts: 15 * 60 * 1000, // 15 minutes (augmenté de 10 min à 15 min)
    participants: 15 * 60 * 1000, // 15 minutes (augmenté de 5 min)
    last_seen: 5 * 60 * 1000, // 5 minutes (augmenté de 1 min)
  };

  /**
   * Récupère une donnée du cache ou exécute la fonction de récupération
   */
  async get<T>(
    key: string,
    type: keyof typeof this.CACHE_DURATIONS,
    fetchFn: () => Promise<T>,
    forceRefresh = false,
  ): Promise<T> {
    // Vérifier si une requête est déjà en cours
    if (!forceRefresh && this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key)!;
    }

    // Vérifier le cache si pas de rafraîchissement forcé
    if (!forceRefresh) {
      const cached = this.cache.get(key);
      if (cached && Date.now() < cached.expiry) {
        return cached.data;
      }
    }

    // Créer la promesse de récupération
    const fetchPromise = fetchFn();
    this.pendingRequests.set(key, fetchPromise);

    try {
      const data = await fetchPromise;

      // Mettre en cache
      this.cache.set(key, {
        data,
        timestamp: Date.now(),
        expiry: Date.now() + this.CACHE_DURATIONS[type],
      });

      return data;
    } finally {
      // Nettoyer la requête en cours
      this.pendingRequests.delete(key);
    }
  }

  /**
   * Mise à jour optimiste du cache
   */
  set<T>(key: string, data: T, type: keyof typeof this.CACHE_DURATIONS): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiry: Date.now() + this.CACHE_DURATIONS[type],
    });
  }

  /**
   * Vérifier si une entrée existe dans le cache et est encore valide
   */
  has(key: string): boolean {
    const cached = this.cache.get(key);
    return cached ? Date.now() < cached.expiry : false;
  }

  /**
   * Obtenir une entrée du cache (publique pour accès externe)
   */
  getCacheEntry(key: string): CacheItem<any> | undefined {
    const cached = this.cache.get(key);
    return cached && Date.now() < cached.expiry ? cached : undefined;
  }

  /**
   * Invalider le cache pour une clé spécifique
   */
  invalidate(key: string): void {
    this.cache.delete(key);
    this.pendingRequests.delete(key);
  }

  /**
   * Invalider le cache par pattern
   */
  invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
    for (const key of this.pendingRequests.keys()) {
      if (regex.test(key)) {
        this.pendingRequests.delete(key);
      }
    }
  }

  /**
   * Nettoyer les entrées expirées
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Obtenir les statistiques du cache
   */
  getStats() {
    return {
      size: this.cache.size,
      pendingRequests: this.pendingRequests.size,
      entries: Array.from(this.cache.keys()),
    };
  }
}

// Instance globale
export const smartCache = new SmartCache();

// Nettoyer périodiquement le cache
if (typeof window !== "undefined") {
  setInterval(() => smartCache.cleanup(), 60000); // Chaque minute
}
