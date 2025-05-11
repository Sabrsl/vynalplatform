# Configuration de Stripe pour Vynal Platform

Ce document explique comment configurer l'intégration Stripe pour traiter les paiements sur Vynal Platform de manière sécurisée et professionnelle.

## Table des matières

1. [Prérequis](#prérequis)
2. [Configuration des variables d'environnement](#configuration-des-variables-denvironnement)
3. [Structure des fichiers](#structure-des-fichiers)
4. [Démarrage en mode développement](#démarrage-en-mode-développement)
5. [Configuration des webhooks](#configuration-des-webhooks)
6. [Tests des paiements](#tests-des-paiements)
7. [Déploiement en production](#déploiement-en-production)
8. [Sécurité](#sécurité)
9. [Dépannage](#dépannage)

## Prérequis

- Compte Stripe (avec accès au dashboard)
- Projet Next.js configuré avec Supabase
- Node.js (version 16+)
- npm ou yarn

## Configuration des variables d'environnement

1. Créez un fichier `.env.development.local` à la racine du projet pour le développement :

```
# Configuration Stripe - ENVIRONNEMENT DE TEST
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_votreClePubliqueDeTest
STRIPE_SECRET_KEY=sk_test_votreCleSecreteDeTest
STRIPE_WEBHOOK_SECRET=
STRIPE_MODE=test

# Configuration Supabase
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre-cle-anon-key
SUPABASE_SERVICE_ROLE_KEY=votre-cle-service-role
```

2. Pour la production, configurez les variables d'environnement sur votre service d'hébergement (Vercel, Netlify, etc.) ou créez un fichier `.env.production.local` (à ne pas commiter dans Git) :

```
# Configuration Stripe - ENVIRONNEMENT DE PRODUCTION
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_votreClePubliqueDeProd
STRIPE_SECRET_KEY=sk_live_votreCleSecreteDeProd
STRIPE_WEBHOOK_SECRET=whsec_votreCleDuWebhook
STRIPE_MODE=production

# Clés restreintes pour fonctionnalités spécifiques (optionnel)
STRIPE_RESTRICTED_KEY_PAYMENTS=rk_live_...
STRIPE_RESTRICTED_KEY_CHECKOUT=rk_live_...
STRIPE_RESTRICTED_KEY_CUSTOMERS=rk_live_...

# Configuration Supabase
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre-cle-anon-key
SUPABASE_SERVICE_ROLE_KEY=votre-cle-service-role
```

## Structure des fichiers

L'intégration Stripe est organisée comme suit :

```
├── app/
│   ├── api/
│   │   └── stripe/
│   │       ├── payment-intent/
│   │       │   └── route.ts      # API pour créer les intents de paiement
│   │       └── webhook/
│   │           └── route.ts      # Gestionnaire de webhooks Stripe
│   └── checkout/
│       └── [serviceId]/
│           └── page.tsx          # Page de checkout
├── components/
│   ├── StripeElementsProvider.tsx # Fournisseur de contexte Stripe
│   └── payments/
│       └── StripeCardForm.tsx    # Formulaire de carte bancaire
├── hooks/
│   └── useStripePayment.tsx      # Hook personnalisé pour les paiements
├── lib/
│   └── stripe/
│       ├── client.ts             # Configuration du client Stripe (frontend)
│       └── server.ts             # Configuration du serveur Stripe (backend)
├── middleware.ts                 # Middleware pour la sécurité et l'authentification
├── .env.development.local        # Variables d'environnement pour le développement
└── .env.production.local         # Variables d'environnement pour la production
```

## Démarrage en mode développement

1. Installez les dépendances Stripe nécessaires :

```bash
npm install @stripe/stripe-js @stripe/react-stripe-js stripe
```

2. Configurez vos variables d'environnement comme indiqué ci-dessus.

3. Lancez le serveur de développement :

```bash
npm run dev
```

4. Pour tester les webhooks en local, installez l'outil CLI Stripe :

```bash
npm install -g stripe
stripe login
stripe listen --forward-to http://localhost:3000/api/stripe/webhook
```

## Configuration des webhooks

### En développement

1. Utilisez l'outil CLI Stripe comme indiqué ci-dessus pour rediriger les webhooks vers votre environnement local.
2. Copiez la clé de webhook fournie par l'outil dans votre fichier `.env.development.local`.

### En production

1. Accédez au [dashboard Stripe](https://dashboard.stripe.com/webhooks).
2. Cliquez sur "Ajouter un endpoint".
3. Entrez l'URL de votre endpoint webhook (exemple : `https://votre-site.com/api/stripe/webhook`).
4. Sélectionnez les événements suivants à écouter :
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `checkout.session.completed` (si vous utilisez Checkout)
5. Copiez la clé de signature du webhook et ajoutez-la à vos variables d'environnement de production.

## Tests des paiements

Pour tester les paiements sans utiliser de vraies cartes bancaires :

1. Utilisez les cartes de test Stripe suivantes :

| Scénario | Numéro de carte | Date | CVC |
|----------|-----------------|------|-----|
| Paiement réussi | 4242 4242 4242 4242 | Toute date future | Tout code à 3 chiffres |
| Échec du paiement | 4000 0000 0000 0002 | Toute date future | Tout code à 3 chiffres |
| 3D Secure requis | 4000 0000 0000 3220 | Toute date future | Tout code à 3 chiffres |

2. Testez différents montants et scénarios de paiement.
3. Vérifiez les paiements de test dans le [dashboard Stripe](https://dashboard.stripe.com/test/payments).

Pour plus de détails sur les tests, consultez le fichier `docs/stripe-test.md`.

## Déploiement en production

Lorsque vous êtes prêt à passer en production :

1. Vérifiez que tous les tests ont été effectués avec succès.
2. Configurez les webhooks de production comme expliqué ci-dessus.
3. Configurez les variables d'environnement sur votre service d'hébergement :
   - Vercel : Dans les paramètres du projet, section "Environment Variables"
   - Netlify : Dans les paramètres du site, section "Build & deploy > Environment"
   - Autres services : Consultez leur documentation respective

4. Assurez-vous que la variable `STRIPE_MODE` est définie sur `production`.
5. Effectuez un premier paiement de test réel avec un montant minime (ex: 1€) pour vérifier que tout fonctionne.

## Sécurité

L'intégration Stripe a été conçue avec la sécurité comme priorité :

1. **Séparation des clés** : Utilisation des clés publiques côté client et des clés secrètes uniquement côté serveur.
2. **Protection des routes** : Middleware d'authentification pour protéger les routes sensibles.
3. **Vérification des webhooks** : Validation de la signature de chaque événement Stripe.
4. **Journalisation des événements** : Tous les événements de paiement sont journalisés pour l'audit.
5. **En-têtes de sécurité** : Configuration des en-têtes HTTP pour protéger contre les attaques XSS, clickjacking, etc.
6. **Protection CSRF** : Vérification de l'origine des requêtes pour les opérations sensibles.

## Dépannage

### Problèmes courants et solutions

1. **Le paiement échoue avec une erreur d'authentification**
   - Vérifiez que les clés API sont correctement configurées
   - Assurez-vous d'utiliser le bon ensemble de clés (test vs production)

2. **Les webhooks ne sont pas reçus**
   - Vérifiez que l'URL du webhook est accessible publiquement
   - Vérifiez que la clé de signature du webhook est correcte
   - Consultez les logs du webhook dans le dashboard Stripe

3. **Erreur "No such payment_intent"**
   - Le PaymentIntent peut avoir expiré (durée de vie par défaut : 24h)
   - Vérifiez que vous n'utilisez pas une clé de test en production ou vice versa

4. **Problèmes d'affichage du formulaire de carte**
   - Vérifiez que le composant `StripeElementsProvider` enveloppe correctement le formulaire
   - Assurez-vous que `clientSecret` est correctement passé au provider

5. **Erreurs de CORS**
   - Vérifiez les en-têtes de votre API
   - Ajoutez les domaines nécessaires à la liste des origines autorisées

### Logs et débogage

Pour faciliter le débogage :

1. Consultez les logs de votre application.
2. Vérifiez les événements dans le [dashboard Stripe](https://dashboard.stripe.com/events).
3. Utilisez l'outil de ligne de commande Stripe pour écouter les événements en temps réel :
   ```bash
   stripe listen
   ```

### Ressources supplémentaires

- [Documentation Stripe](https://stripe.com/docs)
- [Documentation React Stripe.js](https://stripe.com/docs/stripe-js/react)
- [Référence API Stripe](https://stripe.com/docs/api)
- [Centre d'aide Stripe](https://support.stripe.com)