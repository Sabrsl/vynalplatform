# Module d'Optimisations et Performances

Ce module fournit un ensemble d'outils pour améliorer les performances de l'application Vynal Platform. Il se concentre sur l'optimisation de la navigation, du chargement des données et de l'expérience utilisateur.

## Fonctionnalités principales

- **Système de cache hybride** : Utilise à la fois la mémoire et le localStorage pour une récupération ultra-rapide des données
- **Gestion optimisée des requêtes API** : Avec retry automatique, timeout et gestion des erreurs
- **Service Worker** : Pour le chargement offline et le caching des ressources statiques
- **Préchargement intelligent** : Des ressources et routes principales pour une navigation fluide
- **Monitoring des performances** : Via le hook `usePerformanceMonitor` pour collecter des métriques Web Vitals

## Comment utiliser

### 1. Initialisation

Le module est automatiquement initialisé via le composant `OptimizationsLoader` qui est intégré dans le `Providers` principal de l'application.

### 2. Hooks optimisés

Utilisez les hooks optimisés au lieu des hooks standard pour bénéficier du cache et des optimisations :

```tsx
// Au lieu de useCategories
import { useOptimizedCategories } from '@/hooks/useOptimizedCategories';

function MyCategoriesComponent() {
  const { categories, loading, error, refresh } = useOptimizedCategories();
  
  // ...
}

// Au lieu de useServices
import { useOptimizedServices } from '@/hooks/useOptimizedServices';

function MyServicesComponent() {
  const { services, loading, error } = useOptimizedServices({
    categoryId: 'some-id'
  });
  
  // ...
}

// Au lieu de usePaginatedServices
import { useOptimizedPaginatedServices } from '@/hooks/useOptimizedPaginatedServices';

function MyPaginatedComponent() {
  const { 
    services, 
    loading, 
    currentPage, 
    totalPages,
    goToPage,
    loadMore,
    hasMore
  } = useOptimizedPaginatedServices({
    pageSize: 10,
    loadMoreMode: true
  });
  
  // ...
}
```

### 3. Monitoring des performances

Utilisez le hook `usePerformanceMonitor` pour collecter et analyser les performances :

```tsx
import { usePerformanceMonitor } from '@/hooks/usePerformanceMonitor';

function MyComponent() {
  const { 
    metrics, 
    measure, 
    measureOperation,
    measureAsync,
    isLowEndDevice
  } = usePerformanceMonitor();
  
  // Optimisations pour les appareils à faibles performances
  useEffect(() => {
    if (isLowEndDevice) {
      // Réduire les animations, charger moins d'images, etc.
    }
  }, [isLowEndDevice]);
  
  // Mesurer une opération spécifique
  const handleComplexOperation = () => {
    return measureOperation('complexCalculation', () => {
      // Code complexe ici
      return result;
    });
  };
  
  // Mesurer une opération asynchrone
  const handleDataFetch = async () => {
    const data = await measureAsync('fetchData', fetchSomeData());
    return data;
  };
  
  // ...
}
```

### 4. Utilitaires d'optimisation réseau

```tsx
import { preloadResources, optimizedFetchWithRetry } from '@/lib/optimizations/network';

// Précharger des ressources importantes
preloadResources([
  '/images/hero.webp',
  '/css/critical.css'
]);

// Faire une requête API avec retry automatique
const fetchData = async () => {
  const { data, error } = await optimizedFetchWithRetry('/api/data', {
    retries: 3,
    timeout: 5000
  });
  
  if (error) {
    // Gérer l'erreur
  }
  
  return data;
};
```

### 5. Gestion du cache

```tsx
import { 
  getCachedData, 
  setCachedData, 
  invalidateCache, 
  CACHE_KEYS 
} from '@/lib/optimizations';

// Stocker des données en cache
setCachedData(CACHE_KEYS.USER_PROFILE + userId, userData, {
  expiry: 30 * 60 * 1000 // 30 minutes
});

// Récupérer des données du cache
const cachedData = getCachedData(CACHE_KEYS.USER_PROFILE + userId);

// Invalider une entrée de cache spécifique
invalidateCache(CACHE_KEYS.USER_PROFILE + userId);

// Invalider toutes les entrées liées aux services
invalidateCache(CACHE_KEYS.SERVICES);
```

## Architecture technique

Le module est structuré comme suit :

- `index.ts` : Point d'entrée et configuration
- `cache.ts` : Système de cache hybride (mémoire + localStorage)
- `network.ts` : Utilitaires pour les requêtes API et le préchargement
- `service-worker.ts` : Configuration et gestion du service worker

Dans le dossier `hooks`, les hooks optimisés utilisent ce module pour améliorer leurs performances :

- `useOptimizedCategories.ts`
- `useOptimizedServices.ts`
- `useOptimizedPaginatedServices.ts`
- `usePerformanceMonitor.ts`

## Bonnes pratiques

1. **Minimiser les requêtes API** : Utilisez les hooks optimisés qui mettent en cache les données
2. **Précharger les ressources critiques** : Via le composant `OptimizationsLoader`
3. **Adapter l'expérience selon l'appareil** : Utilisez `isLowEndDevice` du hook `usePerformanceMonitor`
4. **Monitorer les performances** : Consultez la page `/performance` pour voir les métriques
5. **Invalidez le cache intelligemment** : N'invalidez que les données modifiées, pas tout le cache

## Résolution des problèmes

Si vous rencontrez des problèmes de performance :

1. Vérifiez que vous utilisez les hooks optimisés et non les versions standard
2. Assurez-vous que les clés de cache sont correctement définies et uniques
3. Utilisez la page `/performance` pour identifier les goulots d'étranglement
4. Pour les composants complexes, utilisez `measureOperation` pour analyser les performances

## Contributeurs

Ce module a été créé pour résoudre les problèmes de navigation et d'affichage des données dans l'application Vynal Platform. 