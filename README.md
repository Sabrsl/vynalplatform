# Vynal Platform

Une plateforme moderne de mise en relation entre freelances et clients pour des services de qualité.

## 🚀 Description

Vynal Platform est une marketplace professionnelle qui permet aux freelances de proposer leurs services et aux clients de trouver des professionnels qualifiés pour leurs projets. La plateforme offre une expérience utilisateur fluide, sécurisée et intuitive pour faciliter les collaborations professionnelles, avec un système de paiement protégé, une messagerie intégrée, et un suivi complet des projets.

## ✨ Fonctionnalités principales

- **Authentification sécurisée** : Système d'authentification complet avec Supabase, gestion des rôles, et sécurité avancée
- **Profils utilisateurs** : Profils personnalisables pour freelances et clients avec gestion de portefeuille de services
- **Publication et découverte de services** : Système de catégories avec recherche avancée et filtres personnalisés
- **Système de commandes et de projets** :
  - Gestion complète du cycle de vie des commandes
  - Suivi de l'état d'avancement des projets
  - Système de révisions et de validations
  - Génération de factures et reçus
- **Messagerie intégrée** : Communication fluide entre clients et freelances avec notifications en temps réel
- **Système de paiement sécurisé** :
  - Transactions protégées et système d'escrow
  - Gestion de portefeuille et de retraits
  - Historique complet des transactions
- **Gestion des avis et évaluations** : Système de notation et retours clients pour améliorer la qualité des services
- **Tableaux de bord personnalisés** : Interfaces dédiées pour freelances, clients et administrateurs
- **Vérification de documents** : Système sécurisé avec hachage HMAC-SHA256 pour l'authentification des documents
- **Outils d'aide pour freelances** :
  - Traitement et optimisation d'images
  - Calculateur de tarifs et estimations
  - Génération de QR codes pour le partage de profil

## 🛠️ Technologies

- **Frontend** :
  - Next.js 14 avec App Router
  - React 18 et TypeScript
  - Tailwind CSS et Radix UI pour l'interface
  - Framer Motion pour les animations
  - Zustand pour la gestion d'état
- **Backend** :
  - Supabase (PostgreSQL, Authentication, Storage, Realtime)
  - API Routes Next.js
  - Middleware pour la sécurité et les autorisations
- **Sécurité** :
  - Crypto-JS pour le chiffrement et la signature de documents
  - Validation des données avec Zod
  - Protection CSRF/XSS et sanitization des entrées
- **Communications** :
  - Nodemailer pour les notifications par email
  - WebSockets pour les communications en temps réel
- **Outils de développement** :
  - ESLint et TypeScript pour la qualité du code
  - Husky pour les hooks pre-commit
  - CI/CD avec Vercel
  - Monitoring de sécurité CodeQL

## 🔧 Installation et configuration

```bash
# Cloner le dépôt
git clone https://github.com/Sabrsl/vynalplatform.git
cd vynal-platform

# Installer les dépendances
npm install

# Configurer les variables d'environnement
cp .env.example .env.local
# Remplir .env.local avec vos informations Supabase et autres configurations

# Lancer le serveur de développement
npm run dev
```

### Variables d'environnement requises

- `NEXT_PUBLIC_SUPABASE_URL` : URL de votre projet Supabase
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` : Clé publique Supabase
- `SUPABASE_SERVICE_ROLE_KEY` : Clé de service Supabase (ne pas exposer côté client)
- `HMAC_SECRET_KEY` : Clé secrète pour la signature des documents
- `EMAIL_SMTP_HOST`, `EMAIL_SMTP_USER`, `EMAIL_SMTP_PASSWORD` : Configuration SMTP pour les emails

## 🗂️ Structure du projet

```
/src
  /app             # Pages et routes Next.js (App Router)
  /components      # Composants React réutilisables
  /hooks           # Custom hooks React
  /lib             # Bibliothèques et utilitaires
    /email         # Services d'email
    /supabase      # Intégrations Supabase
    /image-processor # Traitement d'images
  /utils           # Utilitaires (document-signing, etc.)
  /types           # Définitions TypeScript
  /templates       # Templates d'emails
  /scripts         # Scripts utilitaires
```

## 🔒 Sécurité

La plateforme implémente plusieurs niveaux de sécurité :
- **Authentification** : Avec Supabase Auth, JWT et sessions sécurisées
- **Protection des données** : Sanitization des entrées utilisateur, validation stricte
- **Sécurité des paiements** : Système d'escrow pour protéger les transactions
- **Sécurité des documents** : Signature HMAC-SHA256 pour la vérification des documents
- **Protection contre les attaques** : Middleware pour prévenir les attaques CSRF, XSS, et les injections.

## 🚧 Roadmap

- [ ] Expansion internationale avec support multi-langues
- [ ] Application mobile native (iOS/Android)
- [ ] Intégration de nouveaux moyens de paiement
- [ ] Système de certifications et badges de compétences
- [ ] Marketplace de templates et ressources
- [ ] Outils d'IA pour l'assistance aux freelances
- [ ] API publique pour les intégrations tierces

## 📄 Licence

**PROPRIÉTAIRE** - © 2025 Vynal Platform. Tous droits réservés.

Ce logiciel est la propriété exclusive de Vynal Platform. Toute utilisation, reproduction, modification ou distribution non autorisée est strictement interdite. Ce code est protégé par les lois sur la propriété intellectuelle et les traités internationaux.

## 👥 Équipe et contributeurs

- [Sabrsl](https://github.com/Sabrsl) - Fondateur et développeur principal
- Équipe Vynal - Design, développement et opérations

## Résolution du problème de fonction RPC manquante

Un problème a été identifié dans l'application: l'erreur 404 lors de l'appel à la fonction RPC `get_conversation_messages`. Cette fonction est nécessaire pour récupérer les messages des conversations de manière optimisée.

### Solution temporaire

Une solution temporaire a été mise en place pour utiliser automatiquement la méthode traditionnelle (fetchMessagesLegacy) lorsque la fonction RPC n'est pas disponible.

### Solution permanente

Pour résoudre définitivement ce problème, vous devez déployer la fonction SQL sur votre base de données Supabase:

1. Connectez-vous à votre console Supabase
2. Allez dans "SQL Editor"
3. Créez une nouvelle requête
4. Copiez-collez le contenu du fichier `supabase/functions/get_conversation_messages.sql`
5. Exécutez la requête

Cette fonction RPC permettra d'optimiser les requêtes et de réduire le nombre d'appels API simultanés, ce qui améliorera les performances de l'application.

## Nouveau problème résolu: fonction RPC get_client_orders_with_counts

Un second problème a été identifié: l'erreur 404 lors de l'appel à la fonction RPC `get_client_orders_with_counts`. Cette fonction est utilisée pour récupérer les commandes d'un client avec des compteurs par statut, optimisant ainsi les performances.

### Solution temporaire

Une solution temporaire a été implémentée dans le hook `useClientOrders` pour:
- Détecter l'erreur 404 et basculer automatiquement vers une méthode legacy
- Mettre en cache les résultats pour éviter des requêtes répétées
- Utiliser le requestCoordinator pour éviter les requêtes multiples simultanées

### Solution permanente

Pour résoudre définitivement ce problème, vous devez déployer la fonction SQL sur votre base de données Supabase:

1. Connectez-vous à votre console Supabase
2. Allez dans "SQL Editor"
3. Créez une nouvelle requête
4. Copiez-collez le contenu du fichier `supabase/functions/get_client_orders_with_counts.sql`
5. Exécutez la requête

Cette fonction RPC permettra de récupérer toutes les données nécessaires en une seule requête, réduisant considérablement le nombre d'appels API et améliorant les performances.

## Troisième problème résolu: fonction RPC get_user_conversations

Un autre problème a été identifié: l'erreur 404 lors de l'appel à la fonction RPC `get_user_conversations`. Cette fonction est essentielle pour récupérer efficacement les conversations d'un utilisateur avec tous leurs participants et les derniers messages.

### Solution temporaire

Une solution temporaire a été implémentée dans le store `useMessagingStore` pour:
- Détecter l'erreur 404 et utiliser automatiquement la méthode legacy
- Afficher un message d'avertissement dans la console
- Assurer le fonctionnement de l'application même sans la fonction RPC

### Solution permanente

Pour résoudre définitivement ce problème, vous devez déployer la fonction SQL sur votre base de données Supabase:

1. Connectez-vous à votre console Supabase
2. Allez dans "SQL Editor"
3. Créez une nouvelle requête
4. Copiez-collez le contenu du fichier `supabase/functions/get_user_conversations.sql`
5. Exécutez la requête

Cette fonction RPC permettra de récupérer toutes les conversations, participants et messages en une seule requête, optimisant les performances et réduisant considérablement le nombre d'appels à l'API.

## Autres optimisations de performance

Des améliorations ont également été apportées pour réduire le nombre de requêtes API simultanées:

1. Utilisation du `requestCoordinator` pour gérer les appels concurrents
2. Mise en cache des données pour éviter les requêtes redondantes
3. Centralisation des connexions en temps réel dans le `MessagingProvider`
4. Gestion des intervalles de rafraîchissement en fonction du rôle de l'utilisateur (client/freelance)

Ces optimisations permettent de réduire considérablement la charge sur le serveur Supabase et d'améliorer les performances de l'application.

© 2025 Vynal Platform. Tous droits réservés.