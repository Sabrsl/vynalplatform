# Correction du système de messagerie

Ce document explique comment déployer la correction pour résoudre le problème de messagerie entre clients et freelances.

## Problème résolu

Le problème était que lorsqu'un client contactait un freelance via le bouton "Contacter" sur une page de détails de service, le message était bien envoyé mais :
1. Le client ne voyait pas la conversation dans son tableau de bord Messages
2. Le freelance ne recevait pas le message et ne le voyait pas dans son tableau de bord Messages

## Solutions implémentées

Nous avons apporté plusieurs corrections majeures :

1. **Redirection vers le bon tableau de bord** : Correction pour que le client soit dirigé vers son propre tableau de bord Messages au lieu du tableau de bord Freelance.

2. **Détection des conversations existantes** : La fonction `createConversation` vérifie maintenant si une conversation existe déjà entre les participants avant d'en créer une nouvelle, évitant ainsi les doublons.

3. **Mise à jour des horodatages** : Les conversations sont maintenant correctement horodatées (`last_message_time`) à chaque nouveau message pour s'assurer qu'elles apparaissent en haut de la liste.

4. **Compteurs de messages non lus** : Les compteurs sont maintenant correctement incrémentés pour tous les participants sauf l'expéditeur du message.

5. **Rafraîchissement des conversations** : Les conversations sont maintenant rafraîchies pour tous les participants après la création d'une nouvelle conversation.

6. **Amélioration des abonnements temps réel** : La suppression d'une condition restrictive permet aux messages de s'afficher immédiatement chez tous les participants.

7. **Correction des permissions Supabase** : Ajout de politiques RLS (Row Level Security) pour permettre aux utilisateurs de créer des conversations et des participations.

8. **Meilleure gestion des erreurs** : Ajout de logs détaillés pour faciliter le débogage en cas de problème.

## Comment déployer cette correction

### 1. Déployer les changements de code

Déployez le code mis à jour sur votre environnement de production.

### 2. Exécuter les migrations SQL

Deux migrations doivent être exécutées :

#### a. Mise à jour des fonctions SQL

```bash
# Méthode 1: Utiliser le script npm
npm run db:migrate:messaging

# Méthode 2: Exécuter directement avec Supabase CLI
npx supabase db push --db-url $NEXT_PUBLIC_SUPABASE_URL --auth-token $SUPABASE_SERVICE_ROLE_KEY --migration-file ./migrations/add_increment_unread_count.sql
```

#### b. Correction des permissions Supabase

Si vous rencontrez des erreurs 403 (Forbidden) lors de la création de conversations, exécutez cette migration pour corriger les permissions :

```bash
# Exécuter avec Supabase CLI
npx supabase db push --db-url $NEXT_PUBLIC_SUPABASE_URL --auth-token $SUPABASE_SERVICE_ROLE_KEY --migration-file ./migrations/fix_conversation_permissions.sql

# Ou copiez et exécutez le contenu du fichier dans l'interface SQL de Supabase
```

### 3. Vérifier le déploiement

Pour vérifier que la correction fonctionne correctement :

1. Connectez-vous en tant que client
2. Naviguez vers une page de détails de service
3. Cliquez sur le bouton "Contacter" sous "Commander ce service"
4. Envoyez un message au freelance
5. Vérifiez que vous êtes redirigé vers votre tableau de bord client Messages
6. Vérifiez que la conversation apparaît dans votre liste
7. Connectez-vous en tant que freelance et vérifiez que vous voyez le message dans votre tableau de bord Messages

### 4. Diagnostiquer les problèmes

Si vous rencontrez toujours des erreurs :

1. **Vérifiez la console du navigateur** : Les logs détaillés permettent d'identifier où se produit l'erreur

2. **Vérifiez les erreurs 403** : 
   - Si vous voyez une erreur 403, assurez-vous d'avoir exécuté la migration `fix_conversation_permissions.sql`
   - Vérifiez que l'utilisateur est correctement authentifié (token valide)

3. **Vérifiez les logs côté serveur** :
   - Dans la console Supabase, vérifiez les logs SQL pour identifier les requêtes qui échouent

4. **Vérifiez les conversations existantes** :

```sql
-- Mettre à jour toutes les conversations sans last_message_time défini
UPDATE conversations
SET 
  last_message_time = COALESCE(
    (SELECT MAX(created_at) 
     FROM messages 
     WHERE messages.conversation_id = conversations.id),
    updated_at,
    created_at
  ),
  updated_at = NOW()
WHERE last_message_time IS NULL;
```

## Support

Si vous rencontrez des problèmes avec cette correction, veuillez contacter l'équipe de développement. 