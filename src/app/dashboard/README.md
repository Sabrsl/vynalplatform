# Dashboard Freelance

Ce dossier contient l'implémentation du tableau de bord pour les utilisateurs freelance de la plateforme.

## Structure

- `page.tsx` - Page principale du dashboard freelance
- `layout.tsx` - Layout spécifique au dashboard freelance avec navigation latérale
- `orders/` - Gestion des commandes reçues par le freelance
- `services/` - Gestion des services proposés par le freelance
- `wallet/` - Gestion des paiements et revenus
- `messages/` - Messagerie professionnelle
- `profile/` - Gestion du profil freelance
- `settings/` - Paramètres du compte

## Points d'attention

### Séparation Client / Freelance

Le dashboard freelance est distinct du dashboard client (situé dans `src/app/client-dashboard/`).

Pour maintenir cette séparation :
- Ne pas mélanger les logiques spécifiques client et freelance
- Utiliser le hook `useUser()` et la propriété `isFreelance` pour vérifier le rôle
- S'assurer que les redirections restent cohérentes (voir `middleware.ts`)

### Optimisations

Le dashboard a été optimisé pour :
- Performances (lazy loading, memoization)
- Cache intelligent des données
- Réduction des requêtes réseau
- Transitions fluides

Pour maintenir ces optimisations lors des évolutions futures :
- Conserver les composants mémoïsés
- Respecter la séparation des responsabilités
- Maintenir le système de cache

## Hooks principaux

- `useDashboard` - Gestion des données du dashboard (statistiques, activités)
- `useUser` - Informations sur l'utilisateur connecté et son rôle
- `useAuth` - État d'authentification

## Points d'amélioration futurs

- Implémentation complète du circuit de données via RPC Supabase
- Optimisation des requêtes pour réduire davantage la charge serveur
- Amélioration des performances côté client (code splitting plus granulaire) 