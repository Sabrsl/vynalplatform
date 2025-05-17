# Optimisation des Performances - VYNAL Platform

Ce document explique les optimisations apportées à l'application pour résoudre les problèmes de performance.

## Résumé du problème

L'application présentait des ralentissements significatifs, particulièrement dans le tableau de bord. Après analyse, les causes principales identifiées sont :

1. **Problème critique** : La fonction RPC `get_dashboard_stats` dans Supabase était désactivée à cause d'erreurs de référence à une colonne `is_deleted` inexistante.
2. Cela forçait l'application à utiliser des méthodes alternatives (`fetchClientStatsDirectly` et `fetchFreelanceStatsDirectly`) qui effectuent entre 5 et 8 requêtes séparées au lieu d'une seule.
3. Les abonnements en temps réel (Supabase Realtime) déclenchaient ces méthodes coûteuses à chaque changement dans les tables `orders` et `messages`.

## Solutions mises en œuvre

### 1. Correction de la fonction RPC SQL (deux versions disponibles)

#### Version 1 (fix_dashboard_stats_rpc.sql)
Cette version corrige simplement les références à la colonne `is_deleted` mais conserve les paramètres préfixés `p_` et les statuts en français.

#### Version 2 (fix_dashboard_stats_rpc_v2.sql) - RECOMMANDÉE
Cette version améliorée :
- Supprime les préfixes `p_` des paramètres (`user_id` et `user_role` au lieu de `p_user_id` et `p_user_role`)
- Utilise les statuts en anglais (`pending`, `in_progress`, etc.) pour correspondre aux valeurs réelles de la base de données
- Inclut une vérification automatique du nom correct de la colonne pour les messages lus/non lus (`read` vs `is_read`)

**⚠️ Action requise :** Exécuter le script `migrations/fix_dashboard_stats_rpc_v2.sql` dans votre base de données Supabase.

### 2. Correction de l'appel à la fonction RPC

Le fichier `src/hooks/useDashboard.ts` a été modifié pour :
- Supprimer le code qui forçait la désactivation de la fonction RPC
- Améliorer les logs de diagnostic pour faciliter l'identification des problèmes
- Corriger les noms des paramètres dans l'appel RPC pour correspondre à la nouvelle fonction (`user_id` et `user_role`)

### 3. Optimisations supplémentaires recommandées

Pour améliorer davantage les performances, envisagez ces optimisations supplémentaires :

```javascript
// Augmenter la rétention du cache dans src/lib/optimizations/cache.ts
const CACHE_CONFIG = {
  MAX_MEMORY_ITEMS: 500,           // Augmenter de 300 à 500
  MAX_LOCALSTORAGE_SIZE: 20 * 1024 * 1024, // Augmenter à 20 Mo
  CLEANUP_INTERVAL: 300000,        // Augmenter à 5 minutes
};

// Durées d'expiration
export const CACHE_EXPIRY = {
  DASHBOARD_DATA: 30 * 60 * 1000, // 30 minutes au lieu de 20
};

// Ajouter un debounce aux abonnements en temps réel dans useDashboard.ts
// Dans les handlers d'événements des abonnements Supabase
let debounceTimer;
// ...
}, () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    console.log("[Dashboard] Changement détecté, rechargement des données");
    fetchDashboardData(true);
  }, 2000); // 2 secondes de debounce
})
```

## Vérification après correction

Après avoir appliqué les modifications :

1. Vérifiez les logs de la console pour confirmer que la fonction RPC est détectée comme disponible
2. Observez les performances du tableau de bord, qui devraient être significativement améliorées
3. Consultez le réseau (Network tab) dans les outils de développement pour vérifier la réduction du nombre d'appels API

## Guide de dépannage

En cas d'erreur 400 (Bad Request) :
1. Vérifiez les logs de la console pour voir les messages d'erreur détaillés
2. Assurez-vous que les noms des colonnes et les valeurs utilisées dans la fonction SQL correspondent aux données réelles de votre base
3. Vérifiez si les statuts des commandes dans votre base sont bien en anglais (`pending`, `in_progress`) ou en français (`en_cours`, `en_attente`)

## Support

Si vous rencontrez des problèmes après ces modifications, veuillez consulter les logs pour identifier les erreurs spécifiques.

---

Dernière mise à jour : 2023-06-11 