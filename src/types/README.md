# Types et déclarations de types

Ce répertoire contient les déclarations de types TypeScript pour le projet Vynal Platform.

## Structure

- `index.ts` - Types principaux de l'application
- `database.ts` - Types liés à la base de données
- `global.d.ts` - Déclarations de types globaux pour résoudre les problèmes de linter
- `supabase.d.ts` / `supabase.ts` - Types liés à Supabase
- Autres fichiers de types spécifiques à certaines fonctionnalités

## À propos de `global.d.ts`

Le fichier `global.d.ts` contient des déclarations de types globaux qui servent à résoudre les erreurs de linter liées aux références de types dans les fichiers système de TypeScript (comme `lib.dom.d.ts`).

Ces déclarations sont vides et ne fournissent pas d'implémentation réelle. Elles sont utilisées uniquement pour satisfaire le système de types de TypeScript sans modifier les fichiers système.

### Pourquoi cette approche?

1. Elle évite de modifier les fichiers système de TypeScript qui seraient écrasés lors des mises à jour
2. Elle fonctionne avec `skipLibCheck: true` dans `tsconfig.json`
3. Elle est conforme aux meilleures pratiques de TypeScript et Next.js

### Utilisation

Ces types sont automatiquement disponibles dans l'ensemble du projet grâce à la configuration TypeScript. 