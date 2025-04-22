# Guide d'optimisation des composants

Ce guide explique comment optimiser les composants et les pages de Vynal Platform pour améliorer les performances et l'expérience utilisateur.

## 1. Utilisation des hooks optimisés

Remplacez les hooks standards par leurs équivalents optimisés :

| Hook standard | Hook optimisé |
|--------------|---------------|
| `useAuth` | `useOptimizedAuth` |
| `useUser` | `useOptimizedUser` |
| `useServices` | `useOptimizedServices` |
| `usePaginatedServices` | `useOptimizedPaginatedServices` |
| `useTotalUnreadMessages` | `useMessageCounts` |
| `useDashboard` | `useOptimizedDashboard` |

Exemple :
```tsx
// Avant
const { user } = useAuth();

// Après
const { user } = useOptimizedAuth();
```

## 2. Indicateurs de rafraîchissement

Utilisez le composant `RefreshIndicator` pour tous les boutons de rafraîchissement :

```tsx
// Avant
<Button onClick={refreshData} disabled={isRefreshing}>
  <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
  {isRefreshing ? 'Actualisation...' : 'Actualiser'}
</Button>

// Après
<Button onClick={refreshData} disabled={isRefreshing}>
  <RefreshIndicator 
    isRefreshing={isRefreshing} 
    size="md" 
    text 
    variant="primary"
  />
</Button>
```

## 3. Suivi du dernier rafraîchissement

Ajoutez un indicateur de dernier rafraîchissement à toutes les pages qui affichent des données :

```tsx
// Importez le hook
import { useLastRefresh } from '@/hooks/useLastRefresh';

// Dans votre composant
const { lastRefresh, updateLastRefresh, getLastRefreshText } = useLastRefresh();

// Appelez updateLastRefresh() après chaque chargement de données réussi

// Dans votre JSX, ajoutez :
<div className="text-xs text-slate-400 dark:text-vynal-text-secondary/60 text-right mt-4 pr-2">
  {getLastRefreshText()}
</div>
```

## 4. Utilisation du hook utilitaire pour les données rafraîchissables

Pour simplifier la gestion des données rafraîchissables, utilisez le hook `useRefreshableData` :

```tsx
const fetchMyData = async () => {
  // Votre logique de récupération de données
  const { data } = await supabase.from('ma_table').select('*');
  setMyData(data);
};

const { 
  isRefreshing, 
  error, 
  refreshData, 
  getLastRefreshText 
} = useRefreshableData({
  fetchData: fetchMyData
});

// Dans votre JSX
<Button onClick={refreshData} disabled={isRefreshing}>
  <RefreshIndicator isRefreshing={isRefreshing} text />
</Button>

// Afficher le temps écoulé depuis la dernière mise à jour
<div className="text-xs text-right mt-2">
  {getLastRefreshText()}
</div>
```

## 5. Pour les pages de tableau de bord

Appliquez cette stratégie à toutes les pages du tableau de bord :

1. Importez les hooks optimisés
2. Utilisez le composant `RefreshIndicator` pour les boutons de rafraîchissement
3. Affichez l'indicateur de dernier rafraîchissement

## 6. Pour les pages d'authentification

1. Utilisez `useOptimizedAuth` au lieu de `useAuth`
2. Utilisez le composant `RefreshIndicator` pour les états de chargement

## Conseils de performance

- Évitez les calculs inutiles dans le rendu
- Utilisez `useCallback` et `useMemo` pour les fonctions et les valeurs dérivées
- Implémentez le chargement en arrière-plan des données via la fonction `refreshInBackground`
- Préchargez les données fréquemment utilisées

## Tests

Après l'optimisation, vérifiez que :
- Les données s'affichent correctement
- Les indicateurs de rafraîchissement fonctionnent
- Le cache fonctionne (vérifiez que les données sont récupérées rapidement après actualisation)
- Les performances sont améliorées 