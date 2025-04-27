import { useRef, useCallback, useEffect } from 'react';

interface RefreshControlOptions {
  /**
   * Intervalle minimum entre les rafraîchissements automatiques en millisecondes
   * @default 10000 (10 secondes)
   */
  minInterval?: number;
  
  /**
   * Intervalle minimum pour les rafraîchissements en arrière-plan
   * @default 30000 (30 secondes)
   */
  backgroundRefreshInterval?: number;
  
  /**
   * Délai pour le debounce des événements qui déclenchent un rafraîchissement
   * @default 1000 (1 seconde)
   */
  debounceDelay?: number;
}

/**
 * Hook personnalisé pour contrôler les rafraîchissements de données
 * Évite les rafraîchissements excessifs et fournit une API cohérente
 */
export function useRefreshControl(options: RefreshControlOptions = {}) {
  const {
    minInterval = 10000,
    backgroundRefreshInterval = 30000,
    debounceDelay = 1000
  } = options;
  
  // Références pour suivre les états
  const lastRefreshTimeRef = useRef<number>(0);
  const refreshCountRef = useRef<number>(0);
  const timersRef = useRef<NodeJS.Timeout[]>([]);
  
  // Nettoyer tous les timers au démontage
  useEffect(() => {
    return () => {
      timersRef.current.forEach(timer => clearTimeout(timer));
      timersRef.current = [];
    };
  }, []);
  
  /**
   * Vérifie si un rafraîchissement est autorisé en fonction du temps écoulé
   */
  const canRefresh = useCallback((force: boolean = false): boolean => {
    const now = Date.now();
    return force || (now - lastRefreshTimeRef.current >= minInterval);
  }, [minInterval]);
  
  /**
   * Planifie un rafraîchissement après un délai
   */
  const scheduleRefresh = useCallback((
    callback: () => void, 
    delay: number = debounceDelay,
    force: boolean = false
  ): (() => void) => {
    // Créer un timer et le stocker
    const timerId = setTimeout(() => {
      // Vérifier à nouveau avant d'exécuter
      if (canRefresh(force)) {
        lastRefreshTimeRef.current = Date.now();
        refreshCountRef.current += 1;
        callback();
      }
    }, delay);
    
    timersRef.current.push(timerId);
    
    // Retourner une fonction pour annuler si nécessaire
    return () => {
      clearTimeout(timerId);
      timersRef.current = timersRef.current.filter(id => id !== timerId);
    };
  }, [canRefresh, debounceDelay]);
  
  /**
   * Planifie un rafraîchissement en arrière-plan si nécessaire
   */
  const scheduleBackgroundRefresh = useCallback((callback: () => void): void => {
    const now = Date.now();
    if (now - lastRefreshTimeRef.current >= backgroundRefreshInterval) {
      scheduleRefresh(callback, debounceDelay, false);
    }
  }, [backgroundRefreshInterval, debounceDelay, scheduleRefresh]);
  
  /**
   * Exécute immédiatement un rafraîchissement manuel
   */
  const refreshNow = useCallback((callback: () => void): void => {
    lastRefreshTimeRef.current = Date.now();
    refreshCountRef.current += 1;
    callback();
  }, []);
  
  /**
   * Retourne le temps restant avant le prochain rafraîchissement autorisé
   */
  const getTimeUntilNextRefresh = useCallback((): number => {
    const now = Date.now();
    const elapsed = now - lastRefreshTimeRef.current;
    return Math.max(0, minInterval - elapsed);
  }, [minInterval]);
  
  /**
   * Retourne le nombre total de rafraîchissements effectués
   */
  const getRefreshCount = useCallback((): number => {
    return refreshCountRef.current;
  }, []);
  
  return {
    canRefresh,
    scheduleRefresh,
    scheduleBackgroundRefresh,
    refreshNow,
    getTimeUntilNextRefresh,
    getRefreshCount,
    lastRefreshTime: lastRefreshTimeRef
  };
} 