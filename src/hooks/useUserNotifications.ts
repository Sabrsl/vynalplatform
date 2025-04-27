import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';

/**
 * Hook optimisé pour suivre les notifications utilisateur sans polling excessif
 * @param userId ID de l'utilisateur pour qui récupérer les notifications
 * @returns Object contenant le nombre de notifications non lues
 */
export const useUserNotifications = (userId?: string) => {
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Fonction de récupération des notifications memoïsée
  const fetchNotifications = useCallback(async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      
      // TODO: Remplacer par l'appel API réel pour récupérer les notifications
      // Ceci est juste une implémentation temporaire
      
      // Simuler l'appel API avec un compte aléatoire à des fins de démonstration
      await new Promise(resolve => setTimeout(resolve, 500));
      const mockCount = Math.floor(Math.random() * 5); // Nombre aléatoire 0-4
      
      setTotalUnreadCount(mockCount);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setTotalUnreadCount(0);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    // Ignorer si aucun userId n'est fourni
    if (!userId) {
      setLoading(false);
      return;
    }

    // Chargement initial des notifications
    fetchNotifications();
    
    // Écouter les événements de visibilité de l'onglet du navigateur plutôt que de faire un polling constant
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchNotifications();
      }
    };
    
    // Écouter les événements de changement d'état d'application pour actualiser
    const handleAppStateChange = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail?.type === 'visibility' && customEvent.detail?.isVisible) {
        fetchNotifications();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('vynal:app-state-changed', handleAppStateChange as EventListener);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('vynal:app-state-changed', handleAppStateChange as EventListener);
    };
  }, [userId, fetchNotifications]);

  return {
    totalUnreadCount,
    loading,
    markAsRead: () => setTotalUnreadCount(0),
    refresh: fetchNotifications // Exposer la méthode de rafraîchissement pour un contrôle manuel
  };
}; 