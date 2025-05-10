# Composant UserAvatar Optimisé

Ce composant résout les problèmes de stabilité et de fiabilité d'affichage des avatars utilisateur dans l'interface.

## Problèmes résolus

1. **Photos d'avatar qui disparaissent aléatoirement** - Résolu avec plusieurs mécanismes:
   - Préchargement des images avant affichage
   - Gestion explicite des erreurs de chargement
   - Mécanisme de retentative avec cache-busting automatique
   - Protection contre les fuites de mémoire

2. **Clignotements et états intermédiaires indésirables** - Résolu avec:
   - Fallback visuel pendant le chargement
   - Système intelligent d'initiales comme alternative
   - Transitions visuelles fluides

3. **Cohérence de l'interface** - Assurée par:
   - Adaptation automatique au thème clair/sombre
   - Tailles standardisées et configurables
   - Styles cohérents avec l'interface globale

## Optimisations techniques

- Utilisation d'un composant mémorisé (`memo`) pour éviter les re-rendus inutiles
- Référence pour éviter les mises à jour d'état après démontage du composant
- Vérification de validité des URLs
- Priorité dans la récupération des sources d'avatar (profil > métadonnées > défaut)
- Système de rafraîchissement périodique en cas de problème
- Propriétés d'image Next.js optimisées (`priority`, `unoptimized`)

## Utilisation

```tsx
// Exemple d'utilisation simple
<UserAvatar 
  size="md"
  shape="circle"
/>

// Exemple avec options avancées
<UserAvatar 
  size="lg"
  alt="Jean Dupont"
  shape="circle"
  status="online"
  forceInitials={false}
  className="custom-class"
/>
```

## Propriétés

| Propriété | Type | Description |
|-----------|------|-------------|
| `size` | `'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl'` | Taille de l'avatar (défaut: `'md'`) |
| `shape` | `'rounded' \| 'circle'` | Forme de l'avatar (défaut: `'rounded'`) |
| `alt` | `string` | Texte alternatif pour l'accessibilité |
| `className` | `string` | Classes CSS additionnelles |
| `forceInitials` | `boolean` | Forcer l'utilisation des initiales |
| `status` | `'online' \| 'offline' \| 'away' \| 'busy' \| 'none'` | Statut en ligne de l'utilisateur |
| `loading` | `boolean` | État de chargement |
| `error` | `boolean` | État d'erreur |
| `onClick` | `React.MouseEventHandler<HTMLDivElement>` | Gestionnaire de clic |
| `showTooltip` | `boolean` | Afficher une bulle d'aide |
| `tooltipText` | `string` | Texte de la bulle d'aide | 