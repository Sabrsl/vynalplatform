import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useAuth } from './useAuth';
import { useNotificationStore } from '@/lib/stores/useNotificationStore';

interface NotificationCache {
  [userId: string]: {
    count: number;
    timestamp: number;
  };
}

// Constantes pour la configuration et l'optimisation
const CACHE_EXPIRY = 60 * 1000; // 1 minute
const THROTTLE_INTERVAL = 1000; // 1 seconde

// Cache global entre les rendus/composants
const globalNotificationCache: NotificationCache = {};

/**
 * Hook optimisé pour suivre les notifications utilisateur sans polling excessif
 * - Utilise un système de cache à plusieurs niveaux
 * - Implémente la throttling pour les requêtes
 * - Gère proprement les abonnements aux événements
 * 
 * @param userId ID de l'utilisateur pour qui récupérer les notifications
 * @returns Object contenant le nombre de notifications non lues et méthodes de contrôle
 */
export const useUserNotifications = (userId?: string) => {
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { unreadCount, fetchNotifications, setupRealtimeSubscriptions } = useNotificationStore();
  
  // Références pour contrôler les effets de bord
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastFetchTimeRef = useRef<number>(0);
  const activeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Déterminer l'ID à utiliser (fourni ou de l'utilisateur actuel)
  const effectiveUserId = useMemo(() => userId || user?.id || null, [userId, user?.id]);
  
  // Fonction de récupération des notifications memoïsée
  const fetchNotificationsWithCache = useCallback(async (forceRefresh = false): Promise<void> => {
    // Valider l'id utilisateur
    if (!effectiveUserId) {
      setLoading(false);
      return;
    }
    
    // Vérifier le throttling
    const now = Date.now();
    if (!forceRefresh && now - lastFetchTimeRef.current < THROTTLE_INTERVAL) {
      return;
    }
    
    // Vérifier le cache si pas de rafraîchissement forcé
    if (!forceRefresh) {
      const cached = globalNotificationCache[effectiveUserId];
      if (cached && now - cached.timestamp < CACHE_EXPIRY) {
        setTotalUnreadCount(cached.count);
        setLoading(false);
        return;
      }
    }
    
    // Annuler toute requête précédente
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Créer nouveau controller
    abortControllerRef.current = new AbortController();
    
    try {
      setLoading(true);
      lastFetchTimeRef.current = now;
      
      // Récupérer les notifications depuis le store
      await fetchNotifications(effectiveUserId);
      
      // Mettre à jour l'état et le cache
      setTotalUnreadCount(unreadCount);
      globalNotificationCache[effectiveUserId] = {
        count: unreadCount,
        timestamp: Date.now()
      };
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('Error fetching notifications:', error);
      }
      
      // En cas d'erreur, conserver la valeur précédente si elle existe
      if (totalUnreadCount === 0) {
        setTotalUnreadCount(0);
      }
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  }, [effectiveUserId, totalUnreadCount, fetchNotifications, unreadCount]);

  // Reset optimisé pour marquer les notifications comme lues
  const markAsRead = useCallback(() => {
    setTotalUnreadCount(0);
    
    // Mettre à jour le cache également
    if (effectiveUserId) {
      globalNotificationCache[effectiveUserId] = {
        count: 0,
        timestamp: Date.now()
      };
    }
  }, [effectiveUserId]);

  useEffect(() => {
    // On initialise une variable pour le nettoyage
    let isActive = true;
    let abortController: AbortController | null = null;
    
    // Chargement des notifications uniquement si l'ID existe
    if (effectiveUserId) {
      // Créer un controller unique pour la durée de vie du hook
      abortController = new AbortController();
      abortControllerRef.current = abortController;
      
      // Chargement initial des notifications avec le nouveau controller
      const initialFetch = async () => {
        try {
          // Vérifier si le composant est toujours monté
          if (!isActive) return;
          
          // Déclencher la requête
          await fetchNotificationsWithCache();
        } catch (err) {
          console.error("Erreur lors du chargement initial des notifications:", err);
        }
      };
      
      initialFetch();
      
      // Configurer les abonnements en temps réel
      const cleanup = setupRealtimeSubscriptions(effectiveUserId);
      
      // Optimiser les écouteurs d'événements
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible' && isActive) {
          fetchNotificationsWithCache();
        }
      };
      
      const handleAppStateChange = (event: Event) => {
        const customEvent = event as CustomEvent;
        if (customEvent.detail?.type === 'visibility' 
            && customEvent.detail?.isVisible 
            && isActive) {
          fetchNotificationsWithCache();
        }
      };
      
      // Ajouter les écouteurs d'événements
      document.addEventListener('visibilitychange', handleVisibilityChange);
      window.addEventListener('vynal:app-state-changed', handleAppStateChange as EventListener);
      
      // Définir la fonction de nettoyage
      return () => {
        isActive = false;
        
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('vynal:app-state-changed', handleAppStateChange as EventListener);
        
        // Nettoyer l'abonnement en temps réel
        cleanup();
        
        // Abort la requête en cours
        if (abortController && !abortController.signal.aborted) {
          abortController.abort();
        }
        
        // Nettoyer la référence
        abortControllerRef.current = null;
        
        // Nettoyer les timers
        if (activeTimerRef.current) {
          clearTimeout(activeTimerRef.current);
          activeTimerRef.current = null;
        }
      };
    } else {
      // Si pas d'ID, juste mettre le chargement à false
      setLoading(false);
      
      // Toujours retourner une fonction de nettoyage
      return () => {
        isActive = false;
      };
    }
  }, [effectiveUserId, fetchNotificationsWithCache, setupRealtimeSubscriptions]);

  // Retourner un objet mémorisé pour éviter les re-rendus inutiles
  return useMemo(() => ({
    totalUnreadCount,
    loading,
    markAsRead,
    refresh: () => fetchNotificationsWithCache(true)
  }), [totalUnreadCount, loading, markAsRead, fetchNotificationsWithCache]);
}; 