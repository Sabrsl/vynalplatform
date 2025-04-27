import { useState, useCallback, useMemo } from 'react';

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

/**
 * Hook optimisé pour suivre le dernier moment où les données ont été rafraîchies
 * et générer un texte formaté pour l'affichage
 */
export function useLastRefresh(): UseLastRefreshResult {
  // Utiliser un timestamp au lieu d'un objet Date pour optimiser les performances
  const [lastRefresh, setLastRefresh] = useState<number | null>(null);

  // Mémoiser cette fonction pour éviter les recréations inutiles
  const updateLastRefresh = useCallback(() => {
    setLastRefresh(Date.now());
  }, []);

  // Optimiser la fonction de formatage du texte
  const getLastRefreshText = useCallback((shortFormat = false): string => {
    if (lastRefresh === null) {
      return shortFormat ? "Jamais" : "Données jamais actualisées";
    }

    const now = Date.now();
    const diff = now - lastRefresh;
    
    // Utiliser des constantes pour améliorer la lisibilité et les performances
    if (diff < MINUTE_MS) {
      return shortFormat ? "À l'instant" : "Actualisé à l'instant";
    }
    
    if (diff < HOUR_MS) {
      const minutes = Math.floor(diff / MINUTE_MS);
      return shortFormat 
        ? `Il y a ${minutes} min` 
        : `Actualisé il y a ${minutes} minute${minutes > 1 ? 's' : ''}`;
    }
    
    if (diff < DAY_MS) {
      const hours = Math.floor(diff / HOUR_MS);
      return shortFormat 
        ? `Il y a ${hours}h` 
        : `Actualisé il y a ${hours} heure${hours > 1 ? 's' : ''}`;
    }
    
    const days = Math.floor(diff / DAY_MS);
    return shortFormat 
      ? `Il y a ${days}j` 
      : `Actualisé il y a ${days} jour${days > 1 ? 's' : ''}`;
  }, [lastRefresh]);

  // Création d'un objet mémoïsé pour éviter les recréations inutiles à chaque rendu
  return useMemo(() => ({
    lastRefresh,
    updateLastRefresh,
    getLastRefreshText
  }), [lastRefresh, updateLastRefresh, getLastRefreshText]);
} 