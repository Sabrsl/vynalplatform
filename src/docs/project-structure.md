# Structure du Projet Vynal Platform

## Structure des Dossiers
```
vynal-platform/
├── src/
│   ├── app/                    # Pages de l'application (App Router de Next.js)
│   │   ├── api/                # Endpoints API
│   │   ├── (auth)/             # Pages d'authentification (login, signup)
│   │   ├── (dashboard)/        # Dashboard pour freelance, client et admin
│   │   ├── services/           # Liste et détails des services
│   │   ├── profile/            # Pages de profil
│   │   ├── orders/             # Gestion des commandes
│   │   ├── messages/           # Système de messagerie
│   │   ├── wallet/             # Gestion du wallet
│   │   ├── admin/              # Section admin
│   │   ├── layout.tsx          # Layout principal
│   │   └── page.tsx            # Page d'accueil
│   ├── components/             # Composants réutilisables
│   │   ├── ui/                 # Composants UI de base (shadcn/ui)
│   │   ├── auth/               # Composants liés à l'authentification
│   │   ├── services/           # Composants liés aux services
│   │   ├── orders/             # Composants liés aux commandes
│   │   ├── profiles/           # Composants liés aux profils
│   │   ├── layout/             # Composants de layout (Header, Footer, etc.)
│   │   ├── dashboard/          # Composants pour les dashboards
│   │   └── shared/             # Composants partagés
│   ├── hooks/                  # Hooks personnalisés
│   │   ├── useAuth.ts          # Gestion de l'authentification
│   │   ├── useUser.ts          # Données utilisateur
│   │   ├── useServices.ts      # Gestion des services
│   │   ├── useOrders.ts        # Gestion des commandes
│   │   └── useWallet.ts        # Gestion du wallet
│   ├── lib/                    # Bibliothèques et utilitaires
│   │   ├── supabase/           # Configuration et fonctions Supabase
│   │   │   ├── client.ts       # Client Supabase
│   │   │   ├── admin.ts        # Client admin (pour les fonctions côté serveur)
│   │   │   └── schema.ts       # Types et schémas
│   │   ├── utils/              # Fonctions utilitaires
│   │   └── config.ts           # Configuration globale
│   ├── types/                  # Types TypeScript
│   │   ├── database.ts         # Types générés par Supabase
│   │   ├── auth.ts             # Types pour l'authentification
│   │   ├── services.ts         # Types pour les services
│   │   ├── orders.ts           # Types pour les commandes
│   │   └── users.ts            # Types pour les utilisateurs
│   ├── middleware.ts           # Middleware Next.js
│   ├── services/               # Services métier (logique non-UI)
│   │   ├── auth.ts             # Service d'authentification
│   │   ├── users.ts            # Service utilisateurs
│   │   ├── services.ts         # Service des services (offres)
│   │   ├── orders.ts           # Service des commandes
│   │   ├── payments.ts         # Service des paiements
│   │   └── messages.ts         # Service de messagerie
│   └── utils/                  # Fonctions utilitaires
├── public/                     # Fichiers statiques
├── supabase/                   # Configuration Supabase
│   ├── migrations/             # Migrations de la base de données
│   └── seed.sql                # Données initiales
├── .env.local                  # Variables d'environnement locales
├── .env.example                # Exemple de variables d'environnement
├── package.json                # Dépendances
├── tsconfig.json               # Configuration TypeScript
├── next.config.js              # Configuration Next.js
└── tailwind.config.js          # Configuration Tailwind CSS
```

## Étapes de Développement

### Étape 1: Configuration Initiale
- Initialisation du projet Next.js avec TypeScript
- Configuration de Tailwind CSS et shadcn/ui
- Configuration de Supabase
- Mise en place de la structure des dossiers

### Étape 2: Authentification et Profils
- Configuration de l'authentification Supabase
- Mise en place des pages de connexion/inscription
- Création des profils utilisateurs
- Configuration des règles RLS pour la sécurité

### Étape 3: Système de Services
- Création des modèles de données pour les services
- Développement des pages de création/affichage de services
- Implémentation des catégories et sous-catégories
- Système de filtrage et recherche

### Étape 4: Système de Commandes
- Modèle de données pour les commandes
- Workflow de commande (création, suivi, modification)
- Intégration avec les services
- Gestion des statuts

### Étape 5: Paiements et Wallet
- Mise en place du système de paiement fictif
- Création du wallet utilisateur
- Historique des transactions
- Gestion des statuts de paiement

### Étape 6: Messagerie et Avis
- Système de messagerie par commande
- Système d'avis et de notation
- Gestion des disputes

### Étape 7: Dashboards
- Dashboard freelance
- Dashboard client
- Dashboard administrateur

### Étape 8: Finalisation
- Tests et débogage
- Optimisation des performances
- Déploiement 