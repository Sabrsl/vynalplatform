"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';

// Cache global pour les résultats de media queries
const mediaQueryCache = new Map<string, {
  mql: MediaQueryList;
  listeners: Set<(matches: boolean) => void>;
  matches: boolean;
}>();

// Constante pour l'initialisation côté serveur avec valeurs par défaut pour les tailles d'écran courantes
const DEFAULT_SSR_MATCHES: Record<string, boolean> = {
  '(max-width: 640px)': false,  // mobile
  '(max-width: 768px)': false,  // tablet
  '(max-width: 1024px)': true,  // small desktop
  '(max-width: 1280px)': true,  // medium desktop
  '(max-width: 1536px)': true,  // large desktop
  '(prefers-color-scheme: dark)': false,
  '(prefers-reduced-motion: reduce)': false
};

/**
 * Hook optimisé pour gérer les media queries avec performance maximale et partage de listeners.
 * - Mise en cache globale pour éviter la duplication des MediaQueryList
 * - Gestion optimisée des abonnements/désabonnements
 * - Support SSR amélioré
 * 
 * @param {string} query - La media query à surveiller (ex: "(max-width: 768px)")
 * @returns {boolean} - Retourne true si la media query correspond, sinon false
 */
export function useMediaQuery(query: string): boolean {
  // Vérifier si nous sommes côté client
  const isClient = typeof window !== 'undefined';
  
  // Utiliser le cache pour l'état initial si disponible
  const initialState = useMemo(() => {
    if (!isClient) {
      return DEFAULT_SSR_MATCHES[query] ?? false;
    }
    
    // Utiliser la valeur du cache si elle existe
    if (mediaQueryCache.has(query)) {
      return mediaQueryCache.get(query)!.matches;
    }
    
    // Sinon, créer une nouvelle entrée dans le cache
    try {
      const mql = window.matchMedia(query);
      mediaQueryCache.set(query, {
        mql,
        listeners: new Set(),
        matches: mql.matches
      });
      return mql.matches;
    } catch (e) {
      console.warn(`Media query error for "${query}":`, e);
      return false;
    }
  }, [query, isClient]);
  
  // État pour suivre si la media query correspond
  const [matches, setMatches] = useState<boolean>(initialState);
  
  // Référence pour savoir si le composant est monté
  const mountedRef = useRef(true);
  
  // Gestionnaire d'événement mémorisé avec référence stable
  const handleChange = useCallback((event: MediaQueryListEvent | boolean): void => {
    if (!mountedRef.current) return;
    
    // Si c'est un booléen, c'est une mise à jour directe
    const newMatches = typeof event === 'boolean' ? event : event.matches;
    
    setMatches(newMatches);
    
    // Mettre à jour le cache
    if (isClient && mediaQueryCache.has(query)) {
      mediaQueryCache.get(query)!.matches = newMatches;
    }
  }, [query, isClient]);
  
  // Effet unique pour la gestion du cycle de vie et des abonnements
  useEffect(() => {
    if (!isClient) return;
    
    mountedRef.current = true;
    
    let cacheEntry = mediaQueryCache.get(query);
    
    // Créer une nouvelle entrée dans le cache si nécessaire
    if (!cacheEntry) {
      try {
        const mql = window.matchMedia(query);
        cacheEntry = {
          mql,
          listeners: new Set(),
          matches: mql.matches
        };
        mediaQueryCache.set(query, cacheEntry);
      } catch (e) {
        console.warn(`Failed to initialize media query for "${query}":`, e);
        return () => {};
      }
    }
    
    // S'assurer que l'état local est synchronisé avec le cache
    if (matches !== cacheEntry.matches) {
      setMatches(cacheEntry.matches);
    }
    
    // Créer un gestionnaire spécifique pour cette instance
    const listener = (e: MediaQueryListEvent) => handleChange(e);
    
    // Ajouter l'écouteur d'événement
    cacheEntry.listeners.add(handleChange);
    cacheEntry.mql.addEventListener('change', listener);
    
    // Nettoyage à la destruction du composant
    return () => {
      mountedRef.current = false;
      
      if (mediaQueryCache.has(query)) {
        const entry = mediaQueryCache.get(query)!;
        
        // Supprimer l'écouteur d'événement
        entry.mql.removeEventListener('change', listener);
        entry.listeners.delete(handleChange);
        
        // Si plus aucun composant n'utilise cette media query, la supprimer du cache
        if (entry.listeners.size === 0) {
          mediaQueryCache.delete(query);
        }
      }
    };
  }, [query, matches, handleChange, isClient]);
  
  // Retourner une valeur mémorisée pour éviter les re-rendus inutiles
  return useMemo(() => matches, [matches]);
} 