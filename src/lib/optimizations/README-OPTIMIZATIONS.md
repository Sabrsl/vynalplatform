# Module d'Optimisations

Ce module centralise toutes les fonctionnalités d'optimisation de l'application, notamment la gestion du cache, la compression des données, et les optimisations réseau.

## Structure du module

- `index.ts` - Point d'entrée principal, réexporte les fonctions et constantes essentielles
- `constants-manager.ts` - **SOURCE UNIQUE** de toutes les constantes d'optimisation
- `cache.ts` - Système de mise en cache des données
- `compression.ts` - Utilitaires de compression des données
- `network.ts` - Optimisations des requêtes réseau
- `service-worker.ts` - Configuration du service worker
- `invalidation.ts` - Système d'invalidation de cache avancé
- `cache-keys.ts` - Définition des clés de cache au nouveau format
- `safeCache.ts` - Utilitaires de validation pour le cache
- `client-cache.ts` - Gestion spécifique du cache pour les clients
- `freelance-cache.ts` - Gestion spécifique du cache pour les freelances
- `compatibility.ts` - Couche de compatibilité pour l'ancien système

## Utilisation principale

### Importation

Toujours importer depuis le point d'entrée principal pour maintenir la compatibilité :

```typescript
import {
  getCachedData,
  setCachedData,
  invalidateCache,
  CACHE_KEYS,
  CACHE_EXPIRY,
} from "@/lib/optimizations";
```

### Mise en cache des données

```typescript
// Stocker des données en cache
setCachedData(CACHE_KEYS.USER_PROFILE + userId, userData, {
  expiry: CACHE_EXPIRY.USER_PROFILE,
  priority: "high",
});

// Récupérer des données du cache
const cachedData = getCachedData(CACHE_KEYS.USER_PROFILE + userId);

// Invalider une entrée du cache
invalidateCache(CACHE_KEYS.USER_PROFILE + userId);
```

### Invalidation par groupe

```typescript
import {
  invalidateCachesByEvent,
  CACHE_EVENT_TYPES,
} from "@/lib/optimizations";

// Invalider toutes les données liées aux services
invalidateCachesByEvent(CACHE_EVENT_TYPES.SERVICES_UPDATED);
```

### Requêtes réseau optimisées

```typescript
import { optimizedFetchWithRetry } from "@/lib/optimizations";

// Effectuer une requête avec retries automatiques
const data = await optimizedFetchWithRetry("/api/data", {
  method: "GET",
  retries: 3,
  retryDelay: 1000,
});
```

## Nouveau système de clés

Pour les nouveaux développements, utilisez le système standardisé de clés :

```typescript
import { CacheKeyPrefix, makeCacheKey } from "@/lib/optimizations/invalidation";

// Créer une clé standardisée avec paramètres
const cacheKey = makeCacheKey(CacheKeyPrefix.ClientStats, {
  userId: "123",
  includeActivities: true,
});
```

## Bonnes pratiques

1. **Centralisation des constantes** - Ne pas définir de constantes en dehors de `constants-manager.ts`
2. **Validation des données** - Toujours valider les données récupérées du cache
3. **Gestion des expirations** - Utiliser les constantes d'expiration prédéfinies
4. **Priorités** - Attribuer des priorités appropriées lors de la mise en cache
5. **Invalidation ciblée** - Préférer l'invalidation par événement à l'invalidation directe de clés individuelles

## Migration

Consultez le fichier `MIGRATION.md` pour les instructions détaillées sur la migration des constantes.
