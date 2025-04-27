# Configuration d'Email pour Vynal Platform

Ce document explique la configuration du système d'envoi d'emails pour Vynal Platform.

## Architecture

Le système d'email de Vynal Platform utilise :

- **Nodemailer** comme bibliothèque principale pour l'envoi d'emails
- **Templates HTML** stockés dans `src/templates/email/`
- **Variables d'environnement** pour configurer les paramètres SMTP

## Configuration requise

Pour configurer correctement le système d'email, vous devez définir les variables d'environnement suivantes dans votre fichier `.env.local` :

```
# Configuration SMTP
EMAIL_SMTP_HOST=smtp.votreservice.com
EMAIL_SMTP_PORT=587
EMAIL_SMTP_USER=votre@email.com
EMAIL_SMTP_PASSWORD=votre-mot-de-passe

# Configuration de l'expéditeur
EMAIL_FROM_NAME=Vynal Platform
EMAIL_FROM_ADDRESS=support@vynalplatform.com
EMAIL_REPLY_TO=contact@vynalplatform.com

# Configuration optionnelle
EMAIL_RATE_LIMIT_SECONDS=60
EMAIL_DEBUG=false
```

## Services SMTP recommandés

Vous pouvez utiliser les services SMTP suivants :

1. **Gmail** (limité à 500 emails par jour) :
   - `EMAIL_SMTP_HOST=smtp.gmail.com`
   - `EMAIL_SMTP_PORT=587` (ou 465 pour SSL)
   - Nécessite un "mot de passe d'application" pour l'authentification

2. **SendGrid** (recommandé pour la production) :
   - `EMAIL_SMTP_HOST=smtp.sendgrid.net`
   - `EMAIL_SMTP_PORT=587`
   - Meilleures performances et statistiques de livraison

3. **Amazon SES** (adapté à de gros volumes) :
   - `EMAIL_SMTP_HOST=email-smtp.{region}.amazonaws.com`
   - `EMAIL_SMTP_PORT=587`
   - Bonnes performances de mise à l'échelle

## Templates d'Email

Les templates HTML sont stockés dans :
- `src/templates/email/client/` - Templates pour les clients
- `src/templates/email/freelance/` - Templates pour les freelances
- `src/templates/email/` - Templates généraux

### Variables disponibles dans les templates

- `{{clientName}}` - Nom du client
- `{{resetLink}}` - Lien de réinitialisation de mot de passe
- `{{orderNumber}}` - Numéro de commande
- Variables globales :
  - `{{contactEmail}}` - Email de contact (APP_CONFIG.contactEmail)
  - `{{currentYear}}` - Année courante
  - `{{siteName}}` - Nom du site (APP_CONFIG.siteName)

## Utilisation

### Fonctions principales

La bibliothèque expose les fonctions suivantes dans `src/lib/email.ts` :

```typescript
// Envoi d'un email personnalisé
sendEmail({
  to: 'destinataire@example.com',
  subject: 'Sujet de l\'email',
  html: '<p>Contenu HTML</p>',
  text: 'Contenu texte (optionnel)',
});

// Envoi d'un email basé sur un template
sendTemplateEmail(
  'destinataire@example.com',
  'Sujet de l\'email',
  'src/templates/email/client/welcome.html',
  { clientName: 'John Doe' }
);

// Emails spécifiques
sendWelcomeEmail({
  to: 'client@example.com',
  name: 'John Doe',
  role: 'client'
});

sendOrderConfirmationEmail({
  to: 'client@example.com',
  orderNumber: 'ORD123456',
  // Autres paramètres...
});

sendPasswordResetEmail({
  to: 'client@example.com',
  resetLink: 'https://vynalplatform.com/reset-password?token=abc123'
});
```

## Tests

Pour tester la configuration d'email :

```bash
npm run test:email
```

Ce script vérifie :
1. La présence des variables d'environnement requises
2. La connexion au serveur SMTP
3. Permet d'envoyer un email de test

## Bonnes pratiques

1. **Sécurité**
   - Ne stockez jamais les identifiants SMTP dans le code ou le dépôt Git
   - Utilisez des mots de passe d'application sécurisés
   - En production, utilisez des variables d'environnement gérées par le service d'hébergement

2. **Performance**
   - L'envoi d'emails est asynchrone, ne bloquez pas le thread principal
   - Utilisez le cache de transporteur mis en place pour de meilleures performances
   - En production, utilisez l'option de pool pour gérer les connexions

3. **Delivrabilité**
   - Testez régulièrement la délivrabilité avec différents clients email
   - Utilisez des SPF et DKIM pour améliorer la délivrabilité
   - Évitez le contenu qui pourrait déclencher des filtres anti-spam

4. **Limites de taux**
   - Respectez les limites de taux de votre fournisseur SMTP
   - Utilisez la fonction `canSendEmailToUser` pour éviter l'envoi excessif
   - Implémentez une queue d'emails pour les envois massifs

## Dépannage

Si les emails ne sont pas envoyés :

1. Vérifiez les logs dans la console 
2. Assurez-vous que les variables d'environnement sont correctement définies
3. Vérifiez que le service SMTP autorise les connexions depuis votre serveur/IP
4. Pour Gmail, assurez-vous d'utiliser un "mot de passe d'application" 
5. Vérifiez les paramètres de sécurité de votre fournisseur SMTP

Pour activer les logs détaillés, définissez `EMAIL_DEBUG=true` dans vos variables d'environnement. 