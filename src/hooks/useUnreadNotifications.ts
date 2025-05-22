import { useState, useEffect, useCallback } from 'react';
import { useUserNotifications } from './useUserNotifications';

/**
 * Hook pour obtenir uniquement le nombre total de notifications non lues
 * Simplifie l'utilisation du useUserNotifications quand seul le compteur est nécessaire
 * 
 * @param userId ID de l'utilisateur pour qui récupérer les notifications
 * @returns Tableau avec le nombre de notifications non lues [totalUnreadCount]
 */
export function useUnreadNotifications(userId?: string): [number] {
  const [totalUnreadCount, setTotalUnreadCount] = useState<number>(0);
  const { totalUnreadCount: unreadCount, refresh } = useUserNotifications(userId);
  
  // Mettre à jour le compteur local quand les données changent
  useEffect(() => {
    if (unreadCount !== undefined) {
      setTotalUnreadCount(unreadCount);
    }
  }, [unreadCount]);
  
  return [totalUnreadCount];
} 