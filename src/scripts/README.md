# Scripts de migration et configuration

Ce dossier contient les scripts SQL pour la configuration et les migrations de la base de données.

## Liste des scripts

- `add-welcome-email-sent-field.sql` : Ajoute le champ `welcome_email_sent` à la table `profiles` pour suivre si l'email de bienvenue a déjà été envoyé
- `setup-rls-security-events.sql` : Configuration des règles de sécurité RLS pour les événements de sécurité
- `setup-rls-payments.sql` : Configuration des règles de sécurité RLS pour les paiements
- `setup-rls-payments-existing.sql` : Configuration des règles de sécurité RLS pour les paiements existants
- `run-migration.js` : Script Node.js pour exécuter les migrations SQL

## Exécution de la migration pour le champ `welcome_email_sent`

Cette migration ajoute un champ `welcome_email_sent` à la table `profiles` pour résoudre le problème d'envoi multiple des emails de bienvenue. Après cette migration, l'email de bienvenue ne sera envoyé qu'une seule fois après la première connexion réussie.

### Prérequis

- Node.js installé
- Accès à la base de données Supabase avec les identifiants de service
- Variables d'environnement configurées (`NEXT_PUBLIC_SUPABASE_URL` et `SUPABASE_SERVICE_ROLE_KEY`)

### Instructions

1. Assurez-vous que les variables d'environnement sont définies dans `.env.local` ou `.env`
2. Exécutez le script de migration :

```bash
# Installer la dépendance dotenv si nécessaire
npm install dotenv --save-dev

# Exécuter le script
node src/scripts/run-migration.js
```

### Vérification

Après l'exécution de la migration, vous pouvez vérifier que le champ a été ajouté en exécutant la requête suivante dans l'interface SQL de Supabase :

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'profiles' AND column_name = 'welcome_email_sent';
```

## Résultat attendu

Une fois la migration appliquée et le code déployé :

1. Les utilisateurs existants auront le champ `welcome_email_sent` défini à `TRUE` (considérant qu'ils ont déjà reçu l'email)
2. Pour les nouveaux utilisateurs, l'email de bienvenue ne sera envoyé qu'une seule fois après leur première connexion réussie
3. Le système vérifiera l'état de ce champ avant d'envoyer l'email de bienvenue
