"use client";

import { useState, useEffect } from 'react';

/**
 * Hook personnalisé pour détecter si une media query correspond.
 * @param {string} query - La media query à vérifier (ex: "(max-width: 768px)")
 * @returns {boolean} - Retourne true si la media query correspond, sinon false
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(false);

  useEffect(() => {
    // Vérifier d'abord si window est défini (côté client)
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia(query);
      
      // Définir la valeur initiale
      setMatches(mediaQuery.matches);

      // Créer un gestionnaire d'événement pour les changements
      const handler = (event: MediaQueryListEvent) => {
        setMatches(event.matches);
      };

      // Ajouter l'écouteur d'événement
      mediaQuery.addEventListener('change', handler);

      // Nettoyage à la destruction du composant
      return () => {
        mediaQuery.removeEventListener('change', handler);
      };
    }

    // Par défaut, retourner false si window n'est pas défini (SSR)
    return () => {};
  }, [query]);

  return matches;
} 