"use client";

import { useScrollRestoration } from '@/hooks/useScrollRestoration';

/**
 * Composant sans rendu pour restaurer la position de défilement entre les navigations
 */
export default function ScrollRestoration() {
  // Utiliser notre hook personnalisé
  useScrollRestoration();
  
  // Ce composant ne rend rien visuellement
  return null;
} 