# Guide de Migration des Constantes d'Optimisation

Ce document explique la stratégie de centralisation des constantes et les étapes pour migrer vers le nouveau système.

## Problème résolu

Nous avions plusieurs définitions de constantes (CACHE_KEYS, FETCH_CONFIG, etc.) dispersées dans plusieurs fichiers :
- `index.ts`
- `compatibility.ts`
- `invalidation.ts`
- Divers hooks et composants

Cette redondance causait des problèmes de maintenance et des incohérences.

## Solution

Nous avons créé un système centralisé de gestion des constantes dans le fichier `constants-manager.ts`.

### Principales améliorations:

1. **Source unique de vérité** : Toutes les constantes sont maintenant définies dans un seul fichier.
2. **Compatibilité assurée** : Le système conserve la compatibilité avec le code existant.
3. **Préparation pour la transition** : Nous fournissons des outils pour faciliter la migration vers le nouveau format de clés.
4. **Documentation améliorée** : Chaque section de constantes est clairement documentée.

## Comment utiliser le nouveau système

### Importation des constantes

Utilisez toujours les imports depuis `index.ts` pour conserver une rétrocompatibilité :

```typescript
import { CACHE_KEYS, CACHE_EXPIRY, FETCH_CONFIG } from '@/lib/optimizations';
```

### Nouveaux projets ou composants

Pour les nouveaux projets ou composants, utilisez le nouveau format de clés via l'enum `CacheKeyPrefix` :

```typescript
import { CacheKeyPrefix, makeCacheKey } from '@/lib/optimizations/invalidation';

// Utiliser le nouveau format
const cacheKey = makeCacheKey(CacheKeyPrefix.ClientStats, { userId });
```

### Conversion entre les formats

Si vous avez besoin de convertir entre les formats :

```typescript
import { legacyToNewKey, newToLegacyKey } from '@/lib/optimizations/constants-manager';

// Convertir de l'ancien au nouveau format
const newKey = legacyToNewKey('client_stats_123');

// Convertir du nouveau à l'ancien format
const legacyKey = newToLegacyKey(CacheKeyPrefix.ClientStats);
```

## Plan de migration à long terme

1. **Phase 1 (Actuelle)** : Centralisation des constantes et maintien de la compatibilité
2. **Phase 2 (Future)** : Migration progressive vers le nouveau format de clés
3. **Phase 3 (Future)** : Dépréciation de l'ancien format de clés

## Notes pour les développeurs

- Évitez de définir de nouvelles constantes en dehors du fichier `constants-manager.ts`
- Reportez-vous au fichier `cache-keys.ts` pour comprendre la structure du nouveau format de clés
- Utilisez `makeCacheKey` pour créer des clés standardisées avec des paramètres 