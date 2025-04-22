import { useState, useCallback } from 'react';

interface UseLastRefreshResult {
  lastRefresh: Date | null;
  updateLastRefresh: () => void;
  getLastRefreshText: (shortFormat?: boolean) => string;
}

/**
 * Hook permettant de suivre le dernier moment où les données ont été rafraîchies
 * et de générer un texte formaté pour l'affichage
 */
export function useLastRefresh(): UseLastRefreshResult {
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const updateLastRefresh = useCallback(() => {
    setLastRefresh(new Date());
  }, []);

  const getLastRefreshText = useCallback((shortFormat = false) => {
    if (!lastRefresh) {
      return shortFormat ? "Jamais" : "Données jamais actualisées";
    }

    const now = new Date();
    const diff = now.getTime() - lastRefresh.getTime();
    const seconds = Math.floor(diff / 1000);
    
    if (seconds < 60) {
      return shortFormat ? "À l'instant" : "Actualisé à l'instant";
    }
    
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
      return shortFormat 
        ? `Il y a ${minutes} min` 
        : `Actualisé il y a ${minutes} minute${minutes > 1 ? 's' : ''}`;
    }
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
      return shortFormat 
        ? `Il y a ${hours}h` 
        : `Actualisé il y a ${hours} heure${hours > 1 ? 's' : ''}`;
    }
    
    const days = Math.floor(hours / 24);
    return shortFormat 
      ? `Il y a ${days}j` 
      : `Actualisé il y a ${days} jour${days > 1 ? 's' : ''}`;
  }, [lastRefresh]);

  return {
    lastRefresh,
    updateLastRefresh,
    getLastRefreshText
  };
} 