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
 * Version optimisée avec références consolidées
 */
export function useRefreshControl(options: RefreshControlOptions = {}) {
  const {
    minInterval = 10000,
    backgroundRefreshInterval = 30000,
    debounceDelay = 1000
  } = options;
  
  // Consolidation des références en un seul objet
  const refs = useRef({
    lastRefreshTime: 0,
    refreshCount: 0,
    timers: new Set<NodeJS.Timeout>(),
    isMounted: true
  });
  
  // Nettoyer tous les timers au démontage
  useEffect(() => {
    refs.current.isMounted = true;
    
    return () => {
      refs.current.isMounted = false;
      // Nettoyer tous les timers en une seule fois
      refs.current.timers.forEach(timer => clearTimeout(timer));
      refs.current.timers.clear();
    };
  }, []);
  
  /**
   * Fonction utilitaire pour ajouter un timer et le suivre
   */
  const trackTimer = useCallback((timer: NodeJS.Timeout): void => {
    refs.current.timers.add(timer);
  }, []);
  
  /**
   * Fonction utilitaire pour supprimer un timer du suivi
   */
  const untrackTimer = useCallback((timer: NodeJS.Timeout): void => {
    refs.current.timers.delete(timer);
  }, []);
  
  /**
   * Vérifie si un rafraîchissement est autorisé en fonction du temps écoulé
   */
  const canRefresh = useCallback((force: boolean = false): boolean => {
    const now = Date.now();
    return force || (now - refs.current.lastRefreshTime >= minInterval);
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
      if (refs.current.isMounted && canRefresh(force)) {
        refs.current.lastRefreshTime = Date.now();
        refs.current.refreshCount += 1;
        callback();
      }
      // Retirer le timer de la liste une fois exécuté
      untrackTimer(timerId);
    }, delay);
    
    // Suivre le timer pour le nettoyage
    trackTimer(timerId);
    
    // Retourner une fonction pour annuler si nécessaire
    return () => {
      clearTimeout(timerId);
      untrackTimer(timerId);
    };
  }, [canRefresh, debounceDelay, trackTimer, untrackTimer]);
  
  /**
   * Planifie un rafraîchissement en arrière-plan si nécessaire
   */
  const scheduleBackgroundRefresh = useCallback((callback: () => void): void => {
    if (!refs.current.isMounted) return;
    
    const now = Date.now();
    if (now - refs.current.lastRefreshTime >= backgroundRefreshInterval) {
      scheduleRefresh(callback, debounceDelay, false);
    }
  }, [backgroundRefreshInterval, debounceDelay, scheduleRefresh]);
  
  /**
   * Exécute immédiatement un rafraîchissement manuel
   */
  const refreshNow = useCallback((callback: () => void): void => {
    if (!refs.current.isMounted) return;
    
    refs.current.lastRefreshTime = Date.now();
    refs.current.refreshCount += 1;
    callback();
  }, []);
  
  /**
   * Retourne le temps restant avant le prochain rafraîchissement autorisé
   */
  const getTimeUntilNextRefresh = useCallback((): number => {
    const now = Date.now();
    const elapsed = now - refs.current.lastRefreshTime;
    return Math.max(0, minInterval - elapsed);
  }, [minInterval]);
  
  /**
   * Retourne le nombre total de rafraîchissements effectués
   */
  const getRefreshCount = useCallback((): number => {
    return refs.current.refreshCount;
  }, []);
  
  return {
    canRefresh,
    scheduleRefresh,
    scheduleBackgroundRefresh,
    refreshNow,
    getTimeUntilNextRefresh,
    getRefreshCount,
    lastRefreshTime: refs.current.lastRefreshTime
  };
} 