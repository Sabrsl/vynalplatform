# Cas de Test pour l'Intégration Stripe

Ce document décrit les cas de test à exécuter pour valider le bon fonctionnement de l'intégration Stripe dans Vynal Platform.

## 1. Tests des Paiements Réussis

### Test 1.1: Paiement standard réussi
- **Carte de test**: 4242 4242 4242 4242
- **Montant**: 29.99€
- **Résultat attendu**: 
  - Paiement accepté
  - Webhook `payment_intent.succeeded` reçu
  - Commande créée en base avec statut 'pending'
  - Paiement enregistré avec statut 'paid'
  - Transaction créée dans le wallet du freelance

### Test 1.2: Paiement avec authentification 3D Secure
- **Carte de test**: 4000 0025 0000 3155
- **Montant**: 29.99€
- **Résultat attendu**: 
  - Redirection vers 3D Secure
  - Après validation, paiement accepté
  - Mêmes mises à jour que pour le test 1.1

## 2. Tests des Paiements Échoués

### Test 2.1: Carte refusée
- **Carte de test**: 4000 0000 0000 0002
- **Montant**: 29.99€
- **Résultat attendu**:
  - Paiement refusé avec message "Votre carte a été refusée"
  - Webhook `payment_intent.payment_failed` reçu
  - Aucune commande créée ou mise à jour avec statut 'cancelled' si orderId présent
  - Aucun paiement enregistré ou mise à jour avec statut 'failed' si déjà existant

### Test 2.2: Carte expirée
- **Carte de test**: 4000 0000 0000 0069
- **Montant**: 29.99€
- **Résultat attendu**:
  - Paiement refusé avec message "Votre carte est expirée"
  - Mêmes mises à jour que pour le test 2.1

### Test 2.3: CVC incorrect
- **Carte de test**: 4000 0000 0000 0127
- **Montant**: 29.99€
- **Résultat attendu**:
  - Paiement refusé avec message "Le code de sécurité est incorrect"
  - Mêmes mises à jour que pour le test 2.1

### Test 2.4: Fonds insuffisants
- **Carte de test**: 4000 0000 0000 0101
- **Montant**: 29.99€
- **Résultat attendu**:
  - Paiement refusé avec message "Fonds insuffisants"
  - Mêmes mises à jour que pour le test 2.1

## 3. Tests des Webhooks

### Test 3.1: Webhook payment_intent.succeeded
- **Utiliser**: La page de test de webhook avec l'événement "payment_intent.succeeded"
- **Résultat attendu**:
  - Webhook reçu et traité
  - Commande créée
  - Paiement enregistré
  - Transaction créée

### Test 3.2: Webhook payment_intent.payment_failed
- **Utiliser**: La page de test de webhook avec l'événement "payment_intent.payment_failed"
- **Résultat attendu**:
  - Webhook reçu et traité
  - Si orderId fourni, commande mise à jour avec statut 'cancelled'
  - Si orderId fourni, paiement mis à jour avec statut 'failed'

### Test 3.3: Webhook charge.refunded
- **Utiliser**: La page de test de webhook avec l'événement "charge.refunded"
- **Résultat attendu**:
  - Webhook reçu et traité
  - Paiement mis à jour avec statut 'refunded'
  - Commande mise à jour avec statut 'cancelled'

## 4. Tests de Sécurité

### Test 4.1: Validation de la signature du webhook
- **Utiliser**: Requête curl directe à l'endpoint webhook sans signature valide
- **Résultat attendu**:
  - Webhook rejeté
  - Erreur 400 avec message "Signature webhook invalide"
  - Événement de sécurité enregistré

### Test 4.2: Tentatives multiples de paiement
- **Procédure**: Effectuer 4+ tentatives de paiement en moins de 5 minutes
- **Résultat attendu**:
  - 4ème tentative rejetée
  - Message "Trop de tentatives de paiement. Veuillez réessayer plus tard."
  - Événement de sécurité enregistré

## 5. Tests des Métadonnées

### Test 5.1: Validation des métadonnées requises
- **Procédure**: Envoyer une requête de création de PaymentIntent sans serviceId
- **Résultat attendu**:
  - Requête rejetée
  - Message d'erreur "Données incomplètes. Montant et ID du service requis."

### Test 5.2: Récupération automatique de l'ID freelance
- **Procédure**: Envoyer une requête sans freelanceId mais avec serviceId valide
- **Résultat attendu**:
  - Requête acceptée
  - freelanceId récupéré automatiquement à partir du serviceId

## 6. Tests de Remboursement

### Test 6.1: Remboursement depuis le dashboard Stripe
- **Procédure**:
  1. Effectuer un paiement réussi
  2. Se connecter au dashboard Stripe
  3. Rembourser le paiement
- **Résultat attendu**:
  - Webhook charge.refunded reçu
  - Paiement mis à jour avec statut 'refunded'
  - Commande mise à jour avec statut 'cancelled'

## Validation des Tests

Pour chaque test, validez les points suivants:

1. **Interface utilisateur**:
   - Messages appropriés affichés
   - États de chargement corrects
   - Pas de plantage de l'application

2. **Base de données**:
   - Vérifier les tables orders, payments et transactions
   - Vérifier que les statuts sont corrects
   - Vérifier que les montants sont corrects

3. **Logs**:
   - Vérifier que les événements de sécurité sont enregistrés
   - Vérifier qu'il n'y a pas d'erreurs dans les logs

4. **Dashboard Stripe**:
   - Vérifier que les paiements sont visibles
   - Vérifier que les métadonnées sont correctes 