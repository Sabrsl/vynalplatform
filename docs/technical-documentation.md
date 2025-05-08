# Documentation Technique Vynal Platform

## Table des matières
1. [Mise à jour en temps réel](#mise-à-jour-en-temps-réel)
2. [Optimisation des composants](#optimisation-des-composants)
3. [Configuration Email](#configuration-email)

## Mise à jour en temps réel

### Problèmes potentiels et solutions

#### 1. Gestion des abonnements en temps réel

##### Problème
La mise à jour en temps réel n'est pas correctement implémentée avec Supabase Realtime, ce qui peut entraîner des problèmes de synchronisation et de performance.

##### Solution
Implémentation d'une solution robuste pour les mises à jour en temps réel :

```typescript
// Configuration de Supabase Realtime pour les messages
const setupRealtime = (supabase, userId) => {
  // S'abonner aux nouvelles conversations où l'utilisateur est participant
  const conversationsSubscription = supabase
    .channel('conversation-updates')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'conversation_participants',
        filter: `participant_id=eq.${userId}`
      },
      (payload) => handleConversationUpdate(payload)
    )
    .subscribe();

  // S'abonner aux nouveaux messages dans toutes les conversations de l'utilisateur
  const messagesSubscription = supabase
    .channel('message-updates')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages'
      },
      (payload) => {
        // Vérifier si le message appartient à une conversation de l'utilisateur
        checkAndHandleNewMessage(payload.new, userId);
      }
    )
    .subscribe();

  return { conversationsSubscription, messagesSubscription };
};
```

### Bonnes pratiques pour le temps réel

1. **Utiliser des identifiants de canal uniques**
2. **Implémenter un système de fallback**
3. **Limiter la fréquence des mises à jour**
4. **Nettoyer les ressources**
5. **Gérer les reconnexions**
6. **Loguer les erreurs**
7. **Optimiser les filtres**

## Optimisation des composants

### 1. Utilisation des hooks optimisés

| Hook standard | Hook optimisé |
|--------------|---------------|
| `useAuth` | `useOptimizedAuth` |
| `useUser` | `useOptimizedUser` |
| `useServices` | `useOptimizedServices` |
| `usePaginatedServices` | `useOptimizedPaginatedServices` |
| `useTotalUnreadMessages` | `useMessageCounts` |
| `useDashboard` | `useOptimizedDashboard` |

### 2. Indicateurs de rafraîchissement

Utilisez le composant `RefreshIndicator` pour tous les boutons de rafraîchissement :

```tsx
<Button onClick={refreshData} disabled={isRefreshing}>
  <RefreshIndicator 
    isRefreshing={isRefreshing} 
    size="md" 
    text 
    variant="primary"
  />
</Button>
```

### 3. Suivi du dernier rafraîchissement

```tsx
const { lastRefresh, updateLastRefresh, getLastRefreshText } = useLastRefresh();
```

### Conseils de performance

- Évitez les calculs inutiles dans le rendu
- Utilisez `useCallback` et `useMemo`
- Implémentez le chargement en arrière-plan
- Préchargez les données fréquemment utilisées

## Configuration Email

### Architecture

Le système d'email utilise :
- **Nodemailer** comme bibliothèque principale
- **Templates HTML** stockés dans `src/templates/email/`
- **Variables d'environnement** pour la configuration SMTP

### Configuration requise

Variables d'environnement nécessaires dans `.env.local` :

```
EMAIL_SMTP_HOST=smtp.votreservice.com
EMAIL_SMTP_PORT=587
EMAIL_SMTP_USER=votre@email.com
EMAIL_SMTP_PASSWORD=votre-mot-de-passe
EMAIL_FROM_NAME=Vynal Platform
EMAIL_FROM_ADDRESS=support@vynalplatform.com
EMAIL_REPLY_TO=contact@vynalplatform.com
```

### Services SMTP recommandés

1. **Gmail** (limité à 500 emails/jour)
2. **SendGrid** (recommandé pour la production)
3. **Amazon SES** (adapté à de gros volumes)

### Bonnes pratiques

1. **Sécurité**
   - Ne stockez jamais les identifiants SMTP dans le code
   - Utilisez des mots de passe d'application sécurisés
   - Utilisez des variables d'environnement en production

2. **Performance**
   - Envoi asynchrone
   - Utilisation du cache de transporteur
   - Option de pool en production

3. **Delivrabilité**
   - Tests réguliers
   - Utilisation de SPF et DKIM
   - Éviter le contenu spam

4. **Limites de taux**
   - Respecter les limites du fournisseur
   - Utiliser `canSendEmailToUser`
   - Implémenter une queue pour les envois massifs 