# Vynal Platform

Vynal Platform est une plateforme de mise en relation entre freelances et clients, inspirée de 5euros.com mais avec une approche moderne et complète.

## Technologies utilisées

- **Frontend**: Next.js 14 (App Router)
- **Backend**: Supabase (base de données, authentification, stockage)
- **UI/UX**: Tailwind CSS, ShadCN UI, Lucide Icons, Framer Motion
- **Authentification**: Supabase Auth

## Fonctionnalités

- **Authentification**: Inscription et connexion par e-mail ou Google
- **Profils utilisateurs**: Rôles client, freelance et admin avec gestion des informations
- **Services**: Création et gestion de services par les freelances
- **Commandes**: Système complet de commandes avec différents statuts
- **Paiements**: Système de paiement intégré
- **Messagerie**: Communication entre freelances et clients
- **Évaluations**: Système d'avis et de notation
- **Favoris**: Sauvegarde de services préférés
- **Wallet**: Gestion des transactions financières
- **Disputes**: Gestion des litiges avec intervention admin

## Installation

1. Clonez le dépôt :
```bash
git clone https://github.com/votre-compte/vynal-platform.git
cd vynal-platform
```

2. Installez les dépendances :
```bash
npm install
```

3. Configurez les variables d'environnement :
   - Copiez le fichier `.env.example` vers `.env.local`
   - Remplissez les informations de votre projet Supabase

4. Lancez le serveur de développement :
```bash
npm run dev
```

## Structure du projet

Consultez le fichier `project-structure.md` pour voir la structure détaillée du projet.

## Base de données Supabase

La plateforme utilise Supabase comme backend avec les tables suivantes :
- profiles
- services
- categories
- subcategories
- orders
- payments
- messages
- reviews
- favorites
- wallets
- transactions
- disputes

## Sécurité

La sécurité est assurée par les politiques RLS (Row Level Security) de Supabase, permettant :
- L'accès public à certaines informations (services disponibles)
- L'accès restreint aux données personnelles (profil, commandes)
- La séparation des rôles (client, freelance, admin)

## Contribution

Les contributions sont les bienvenues. Veuillez suivre ces étapes :
1. Forkez le projet
2. Créez votre branche de fonctionnalité
3. Committez vos changements
4. Poussez vers la branche
5. Ouvrez une Pull Request

## Licence

Ce projet est sous licence MIT. #   v y n a l _ p l a t f o r m  
 