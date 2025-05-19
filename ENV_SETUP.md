# Configuration des variables d'environnement

Pour résoudre l'avertissement concernant la propriété `metadataBase` pour les images Open Graph et Twitter, vous devez configurer la variable d'environnement `NEXT_PUBLIC_SITE_URL`.

## Comment configurer

1. Créez un fichier `.env.local` à la racine de votre projet
2. Ajoutez la variable suivante :

```
# URL du site pour les métadonnées et les Open Graph images
NEXT_PUBLIC_SITE_URL=https://vynalplatform.com
```

3. Remplacez `https://vynalplatform.com` par l'URL de votre site en production
4. Pour le développement local, vous pouvez utiliser `http://localhost:3000`

## Environnements différents

- Pour le développement : `.env.local` avec `NEXT_PUBLIC_SITE_URL=http://localhost:3000`
- Pour la production : Configurez la variable dans votre plateforme d'hébergement (Vercel, Netlify, etc.)

## Pourquoi c'est important

Cette variable est utilisée pour résoudre correctement les chemins absolus des images dans les balises Open Graph et Twitter, ce qui améliore le partage sur les réseaux sociaux.

Le code suivant a été ajouté à vos fichiers de métadonnées :

```typescript
metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://vynalplatform.com'),
```

Cela permet de résoudre l'avertissement que vous voyiez précédemment. 