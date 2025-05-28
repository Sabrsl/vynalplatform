# Plan de correction, migration et nettoyage du système de gestion des rôles

Après une analyse approfondie du code et des problèmes rencontrés, voici un plan détaillé pour corriger, migrer et nettoyer le système de gestion des rôles entre les tableaux de bord client et freelance. Ce plan est conçu pour un environnement de **production** avec des précautions pour éviter toute régression.

## 1. Analyse des problèmes

### Problèmes identifiés

- Vérifications redondantes des rôles (middleware + layouts + guards)
- Temps de chargement trop longs
- Logs de débogage excessifs ralentissant l'application
- Cache de profil utilisateur trop court (2 minutes)
- Redirections multiples et conflictuelles

## 2. Plan d'action étape par étape (sécurisé pour la production)

### Étape préliminaire: Sauvegarde et préparation

1. Créer une branche spécifique de correction à partir de la production
2. Sauvegarder tous les fichiers qui seront modifiés
3. Préparer un plan de rollback en cas de problème

### Étape 1: Optimisation du fichier roleGuards.tsx (sans changer le comportement)

1. Supprimer uniquement les logs de débogage superflus
2. Réduire progressivement le délai de redirection (tester d'abord à 200ms avant de passer à 100ms)
3. Ne pas modifier la logique principale de vérification

```typescript
// Modification du FreelanceGuard
export const FreelanceGuard = memo(({ children }: { children: ReactNode }) => {
  const { isFreelance, loading: profileLoading } = useUser();

  // Supprimer ces logs
  // console.log("[FreelanceGuard] Vérification d'accès:", { isFreelance, profileLoading });

  const { isRedirecting, isLoading, redirectMessage } = useRoleGuard(
    profileLoading ? true : isFreelance,
    {
      redirectPath: REDIRECT_PATHS.CLIENT_FALLBACK,
      toastMessage: TOAST_MESSAGES.FREELANCE_ONLY,
      redirectDelay: 200, // Réduire d'abord à 200ms, puis à 100ms après test
      preserveConnections: true
    }
  );

  if (isRedirecting || isLoading) {
    // Supprimer ce log
    // console.log("[FreelanceGuard] Redirection en cours");
    return <LoadingScreen message={redirectMessage} />;
  }

  // Supprimer ce log
  // console.log("[FreelanceGuard] Accès autorisé");
  return <>{children}</>;
});
```

### Étape 2: Optimisation prudente du hook useUser

1. Augmenter graduellement la durée du cache (d'abord à 3 minutes, puis à 5 après validation)
2. Ajuster progressivement les throttling pour éviter les chocs de performance

```typescript
// Durée de validité du cache (augmenter progressivement)
const PROFILE_CACHE_TTL = 3 * 60 * 1000; // D'abord 3 minutes, puis 5 après validation

// Constantes pour l'optimisation (augmenter throttling graduellement)
const THROTTLE_MS = 4000; // D'abord 4 secondes, puis 5 après validation
```

### Étape 3: Intégration des gardes de rôle dans les layouts (sans casser l'existant)

1. S'assurer de ne supprimer aucune vérification essentielle
2. Maintenir la compatibilité avec le reste du code
3. Tester chaque modification individuellement

Pour le dashboard freelance:

```typescript
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  // ... conserver tout le code existant ...

  // S'assurer que le loading state reste compatible
  if (loading) {
    return <LoadingIndicator message="Chargement du dashboard..." />;
  }

  // Ajouter le FreelanceGuard en conservant la structure existante
  return (
    <FreelanceGuard>
      <div className="flex min-h-screen bg-white dark:bg-vynal-purple-dark">
        {/* Conserver exactement la même structure et style */}
        {/* ... */}
      </div>
    </FreelanceGuard>
  );
}
```

### Étape 4: Optimisation du middleware (avec précautions)

1. Faire très attention aux modifications du middleware (point critique)
2. Implémenter le caching de rôle avec un mécanisme de fallback sécurisé
3. Conserver les logs d'erreur importants

```typescript
// Dans middleware.ts

// Pour les utilisateurs connectés, vérifier que le rôle correspond au dashboard visité
if (session && (isFreelanceDashboardRoute || isClientDashboardRoute)) {
  try {
    // Utiliser le cache du navigateur si possible
    const cachedRole = req.cookies.get("user_role")?.value;

    if (cachedRole) {
      // Si c'est un client qui essaie d'accéder au dashboard freelance
      if (cachedRole === "client" && isFreelanceDashboardRoute) {
        url.pathname = "/client-dashboard";
        return NextResponse.redirect(url);
      }

      // Si c'est un freelance qui essaie d'accéder au dashboard client
      if (cachedRole === "freelance" && isClientDashboardRoute) {
        url.pathname = "/dashboard";
        return NextResponse.redirect(url);
      }
    } else {
      // Sinon, vérifier via API et mettre en cache
      const { data: userRole, error } = await supabase.rpc("get_user_role");

      // IMPORTANT: En cas d'erreur, laisser passer plutôt que bloquer
      if (error) {
        console.error("Erreur lors de la vérification du rôle:", error);
        return res;
      }

      // Stocker dans un cookie pour les futures requêtes (durée limitée)
      res.cookies.set("user_role", userRole, {
        maxAge: 3600, // 1 heure
        path: "/",
      });

      // Rediriger si nécessaire
      if (userRole === "client" && isFreelanceDashboardRoute) {
        url.pathname = "/client-dashboard";
        return NextResponse.redirect(url);
      }

      if (userRole === "freelance" && isClientDashboardRoute) {
        url.pathname = "/dashboard";
        return NextResponse.redirect(url);
      }
    }
  } catch (err) {
    // En cas d'erreur, log et laisser passer
    console.error("Erreur lors de la vérification du rôle:", err);
    return res;
  }
}
```

## 3. Implémentation et tests (adaptés pour la production)

### Étape 1: Nettoyage ciblé des logs

1. Rechercher et supprimer uniquement les `console.log` non essentiels:
   - src/lib/guards/roleGuards.tsx - supprimer les logs de débogage
   - Conserver les logs d'erreur importants

### Étape 2: Optimisation graduelle des performances

1. Mettre à jour les constantes dans `src/hooks/useUser.ts` par phases:

   ```typescript
   // Phase 1 (après test initial)
   const PROFILE_CACHE_TTL = 3 * 60 * 1000; // 3 minutes
   const THROTTLE_MS = 4000; // 4 secondes minimum

   // Phase 2 (après validation de la phase 1)
   const PROFILE_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
   const THROTTLE_MS = 5000; // 5 secondes minimum
   ```

### Étape 3: Stratégie de déploiement sécurisée

1. Déployer d'abord en environnement de staging/pré-production
2. Réaliser des tests de charge pour valider les améliorations
3. Déployer en production pendant une période de faible trafic
4. Surveiller attentivement les métriques après déploiement
5. Avoir un plan de rollback prêt en cas de problème

## 4. Procédure de test rigoureuse

Pour chaque modification, tester:

1. La navigation entre les pages (aucun blocage)
2. Les transitions et animations (pas de dégradation visuelle)
3. Les fonctionnalités de redirection selon rôle (fonctionnement correct)
4. Les temps de chargement (amélioration mesurable)
5. Les scénarios d'échec (déconnexion, timeout, etc.)

## 5. Plan de rollback en cas de problème

1. Préparer des scripts de restauration rapide de la version antérieure
2. Identifier les métriques clés qui indiqueraient un problème
3. Définir des seuils clairs pour déclencher un rollback
4. Prévoir une fenêtre de surveillance renforcée après déploiement

## 6. Suivi et validation

Après chaque étape:

1. Tester les performances (temps de chargement)
2. Vérifier que les redirections fonctionnent correctement
3. S'assurer que les clients ne peuvent accéder qu'au dashboard client
4. S'assurer que les freelances ne peuvent accéder qu'au dashboard freelance
5. Vérifier l'expérience utilisateur complète (pas juste les fonctionnalités)

Ce plan graduel permet d'améliorer les performances sans causer de régressions en production et en maintenant la sécurité des accès aux différentes parties de l'application.
