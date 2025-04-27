/**
 * Génère une clé de cache unique pour les hooks basée sur les paramètres fournis
 * @param args Liste de paramètres à inclure dans la clé de cache
 * @returns Clé de cache sous forme de chaîne
 */
export function getHookCacheKey(...args: any[]): string {
  return args.filter(Boolean).join('-');
}

/**
 * Vérifie si le cache d'un hook est expiré
 * @param timestamp Horodatage de la dernière mise à jour du cache
 * @param maxAge Durée maximale de validité du cache en ms (défaut: 5 minutes)
 * @returns true si le cache est expiré, false sinon
 */
export function isCacheExpired(timestamp: number, maxAge: number = 5 * 60 * 1000): boolean {
  return Date.now() - timestamp > maxAge;
}

/**
 * Génère un nouvel horodatage pour le cache
 * @returns Horodatage actuel en ms
 */
export function getCacheTimestamp(): number {
  return Date.now();
} 