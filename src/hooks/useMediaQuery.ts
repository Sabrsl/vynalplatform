"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';

// Constante pour l'initialisation côté serveur
const DEFAULT_SSR_MATCHES: Record<string, boolean> = {
  '(max-width: 640px)': false,
  '(max-width: 768px)': false,
  '(max-width: 1024px)': true,
  '(max-width: 1280px)': true,
  '(max-width: 1536px)': true,
  '(prefers-color-scheme: dark)': false,
  '(prefers-reduced-motion: reduce)': false
};

/**
 * Hook optimisé pour gérer les media queries avec performance maximale.
 * 
 * @param {string} query - La media query à surveiller (ex: "(max-width: 768px)")
 * @returns {boolean} - Retourne true si la media query correspond, sinon false
 */
export function useMediaQuery(query: string): boolean {
  // Utiliser useRef pour éviter de recréer la media query à chaque rendu
  const mediaQueryRef = useRef<MediaQueryList | null>(null);
  
  // État pour suivre si la media query correspond
  const [matches, setMatches] = useState<boolean>(() => {
    // Initialisation intelligente avec des valeurs par défaut pour SSR
    if (typeof window === 'undefined') {
      return DEFAULT_SSR_MATCHES[query] ?? false;
    }
    
    // Initialisation côté client
    try {
      const mql = window.matchMedia(query);
      mediaQueryRef.current = mql;
      return mql.matches;
    } catch (e) {
      console.warn(`Media query error for "${query}":`, e);
      return false;
    }
  });

  // Gestionnaire d'événement mémorisé pour éviter les recréations
  const handleChange = useCallback((event: MediaQueryListEvent): void => {
    setMatches(event.matches);
  }, []);

  // Effet pour gérer l'abonnement/désabonnement
  useEffect(() => {
    // Ne rien faire côté serveur
    if (typeof window === 'undefined') return;
    
    // Nettoyer l'ancienne requête si elle existe
    const cleanupOldQuery = (): void => {
      if (mediaQueryRef.current) {
        try {
          mediaQueryRef.current.removeEventListener('change', handleChange);
        } catch (e) {
          // Gestion silencieuse des erreurs de nettoyage
        }
      }
    };
    
    try {
      // Créer une nouvelle instance de MediaQueryList
      const mql = window.matchMedia(query);
      
      // Mettre à jour la référence
      cleanupOldQuery();
      mediaQueryRef.current = mql;
      
      // Mettre à jour immédiatement l'état
      if (matches !== mql.matches) {
        setMatches(mql.matches);
      }
      
      // Ajouter l'écouteur d'événement avec la méthode moderne
      mql.addEventListener('change', handleChange);
      
      // Nettoyage à la destruction du composant ou lors du changement de query
      return () => {
        mql.removeEventListener('change', handleChange);
        mediaQueryRef.current = null;
      };
    } catch (e) {
      console.warn(`Failed to initialize media query for "${query}":`, e);
      return cleanupOldQuery;
    }
  }, [query, handleChange, matches]);

  // Retourner une valeur mémorisée pour éviter les re-rendus inutiles
  return useMemo(() => matches, [matches]);
} 