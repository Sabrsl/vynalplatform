import { useState, useCallback, useMemo, useRef } from 'react';

interface UseLastRefreshResult {
  lastRefresh: number | null; // Timestamp en millisecondes plutôt que Date pour éviter de recréer des objets
  updateLastRefresh: () => void;
  getLastRefreshText: (shortFormat?: boolean) => string;
}

// Constantes pour les calculs de temps (évite de recalculer ces valeurs à chaque rendu)
const SECOND_MS = 1000;
const MINUTE_MS = 60 * SECOND_MS;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

// Formats prédéfinis pour réduire les calculs et créations de chaînes
const TEXT_FORMATS = {
  NEVER: {
    SHORT: "Jamais",
    LONG: "Données jamais actualisées"
  },
  JUST_NOW: {
    SHORT: "À l'instant",
    LONG: "Actualisé à l'instant"
  }
};

/**
 * Hook optimisé pour suivre le dernier moment où les données ont été rafraîchies
 * et générer un texte formaté pour l'affichage
 * Version améliorée avec meilleure gestion des rendus
 */
export function useLastRefresh(): UseLastRefreshResult {
  // Utiliser un timestamp au lieu d'un objet Date
  const [lastRefresh, setLastRefresh] = useState<number | null>(null);
  
  // Référence pour les données qui ne déclenchent pas de re-render
  const refs = useRef({
    formatCache: new Map<string, string>(), // Cache de formatage pour éviter de recréer les mêmes chaînes
    lastFormatTime: 0 // Timestamp de la dernière mise à jour du format
  });
  
  // Mise à jour du timestamp de rafraîchissement
  const updateLastRefresh = useCallback(() => {
    const now = Date.now();
    setLastRefresh(now);
    
    // Vider le cache de formatage car les textes vont changer
    refs.current.formatCache.clear();
    refs.current.lastFormatTime = now;
  }, []);

  // Formatage optimisé du texte avec mise en cache
  const getLastRefreshText = useCallback((shortFormat = false): string => {
    // Vérifier si la valeur est dans le cache
    const cacheKey = `${lastRefresh}-${shortFormat ? 'short' : 'long'}`;
    
    // Si la valeur est dans le cache et que moins d'une minute s'est écoulée
    // depuis la dernière mise en forme, retourner la valeur en cache
    if (refs.current.formatCache.has(cacheKey)) {
      const now = Date.now();
      const cacheAge = now - refs.current.lastFormatTime;
      
      // Ne pas utiliser le cache si plus d'une minute s'est écoulée
      // car le texte pourrait changer (ex: "à l'instant" -> "il y a 1 minute")
      if (cacheAge < MINUTE_MS) {
        return refs.current.formatCache.get(cacheKey)!;
      }
    }
    
    // Valeur jamais rafraîchie
    if (lastRefresh === null) {
      const result = shortFormat 
        ? TEXT_FORMATS.NEVER.SHORT
        : TEXT_FORMATS.NEVER.LONG;
      
      refs.current.formatCache.set(cacheKey, result);
      return result;
    }

    const now = Date.now();
    const diff = now - lastRefresh;
    let result: string;
    
    // Utiliser des constantes pour améliorer la lisibilité et les performances
    if (diff < MINUTE_MS) {
      result = shortFormat 
        ? TEXT_FORMATS.JUST_NOW.SHORT
        : TEXT_FORMATS.JUST_NOW.LONG;
    } else if (diff < HOUR_MS) {
      const minutes = Math.floor(diff / MINUTE_MS);
      result = shortFormat 
        ? `Il y a ${minutes} min` 
        : `Actualisé il y a ${minutes} minute${minutes > 1 ? 's' : ''}`;
    } else if (diff < DAY_MS) {
      const hours = Math.floor(diff / HOUR_MS);
      result = shortFormat 
        ? `Il y a ${hours}h` 
        : `Actualisé il y a ${hours} heure${hours > 1 ? 's' : ''}`;
    } else {
      const days = Math.floor(diff / DAY_MS);
      result = shortFormat 
        ? `Il y a ${days}j` 
        : `Actualisé il y a ${days} jour${days > 1 ? 's' : ''}`;
    }
    
    // Mettre à jour le cache
    refs.current.formatCache.set(cacheKey, result);
    refs.current.lastFormatTime = now;
    
    return result;
  }, [lastRefresh]);

  // Objet mémoïsé pour éviter les recréations
  return useMemo(() => ({
    lastRefresh,
    updateLastRefresh,
    getLastRefreshText
  }), [lastRefresh, updateLastRefresh, getLastRefreshText]);
} 