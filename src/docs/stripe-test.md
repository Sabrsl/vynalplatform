# Guide de Test des Paiements Stripe

Ce document explique comment tester l'intégration Stripe dans votre application sans effectuer de vraies transactions.

## Mode Test vs Mode Production

Stripe propose deux environnements distincts :
- **Mode Test** : Utilisez les clés préfixées par `pk_test_` et `sk_test_` pour des transactions simulées
- **Mode Production** : Utilisez les clés préfixées par `pk_live_` et `sk_live_` pour des transactions réelles

## Cartes de Test

Vous pouvez utiliser ces cartes pour tester différents scénarios sans effectuer de vraies transactions :

### Paiement réussi
- **Numéro** : `4242 4242 4242 4242`
- **Date** : N'importe quelle date future
- **CVC** : N'importe quel code à 3 chiffres
- **Code postal** : N'importe quel code postal à 5 chiffres

### Échec du paiement
- **Numéro** : `4000 0000 0000 0002`
- **Date** : N'importe quelle date future
- **CVC** : N'importe quel code à 3 chiffres

### Authentification 3D Secure requise
- **Numéro** : `4000 0000 0000 3220`
- **Date** : N'importe quelle date future
- **CVC** : N'importe quel code à 3 chiffres

### Carte refusée
- **Numéro** : `4000 0000 0000 0069`
- **Date** : N'importe quelle date future
- **CVC** : N'importe quel code à 3 chiffres

## Tester les Webhooks en Local

Pour tester les webhooks en environnement de développement local :

1. Installez l'outil CLI Stripe :
   ```bash
   npm install -g stripe
   ```

2. Connectez-vous à votre compte Stripe :
   ```bash
   stripe login
   ```

3. Démarrez l'écoute des événements :
   ```bash
   stripe listen --forward-to http://localhost:3000/api/stripe/webhook
   ```

4. L'outil vous fournira une clé de webhook à utiliser. Copiez-la dans votre fichier `.env.development.local` :
   ```
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

5. Vous pouvez également déclencher des événements manuellement :
   ```bash
   stripe trigger payment_intent.succeeded
   ```

## Vérification des Paiements

Pour vérifier les paiements de test :

1. Connectez-vous au [Dashboard Stripe](https://dashboard.stripe.com/test/payments)
2. Allez dans l'onglet "Paiements" pour voir toutes les transactions de test

## Passer en Production

Lorsque vous êtes prêt à passer en production :

1. Assurez-vous que tous les tests sont réussis
2. Vérifiez que les webhooks sont correctement configurés en production
3. Mettez à jour les variables d'environnement pour utiliser les clés de production
4. Effectuez un paiement de test réel avec une petite somme
5. Surveillez attentivement les premiers paiements

## Rappel Importante : Sécurité des Clés API

- Ne stockez jamais les clés API dans votre code source
- Ne versionnez jamais les fichiers `.env` contenant des clés
- Utilisez des variables d'environnement sur votre serveur de production
- Révoqué immédiatement les clés compromises

Pour plus d'informations, consultez la [documentation Stripe](https://stripe.com/docs/testing).