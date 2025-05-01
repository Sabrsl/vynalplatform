import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useMessagingStore } from '@/lib/stores/useMessagingStore';
import { useAuth } from '@/hooks/useAuth';

/**
 * Hook optimisé pour récupérer le nombre total de messages non lus pour l'utilisateur actuel
 * - Utilise useCallback et useMemo pour éviter les calculs inutiles
 * - Implémente une mémorisation pour les données précédentes
 * - Optimise les cycles de vie avec des références
 */
export function useTotalUnreadMessages() {
  const { user } = useAuth();
  const { conversations, fetchConversations } = useMessagingStore();
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  
  // Utiliser une référence pour suivre l'état précédent et éviter les calculs inutiles
  const previousDataRef = useRef({
    conversationIds: new Set<string>(),
    unreadCounts: new Map<string, number>(),
    totalCount: 0
  });
  
  // Identifiant de l'utilisateur mémorisé
  const userId = useMemo(() => user?.id, [user]);
  
  // Mémoiser les IDs de conversation pour la comparaison
  const currentConversationIds = useMemo(() => {
    return new Set(conversations.map(conv => conv.id));
  }, [conversations]);
  
  // Calculer le total des messages non lus de manière optimisée
  const calculateTotalUnread = useCallback(() => {
    if (conversations.length === 0) {
      setTotalUnreadCount(0);
      return;
    }
    
    // Vérifier si les conversations ont changé
    const prevIds = previousDataRef.current.conversationIds;
    const currentIds = currentConversationIds;
    
    // Vérifier si le jeu de conversations est identique
    const conversationsUnchanged = 
      prevIds.size === currentIds.size && 
      [...prevIds].every(id => currentIds.has(id));
    
    // Si les mêmes conversations et aucun changement détecté, éviter le recalcul
    if (conversationsUnchanged && previousDataRef.current.totalCount > 0) {
      // Vérifier profondément si les compteurs ont changé
      let hasChanged = false;
      for (const conv of conversations) {
        const otherParticipant = conv.participants.find(p => p.id !== userId);
        const currentCount = otherParticipant?.unread_count || 0;
        const previousCount = previousDataRef.current.unreadCounts.get(conv.id) || 0;
        
        if (currentCount !== previousCount) {
          hasChanged = true;
          break;
        }
      }
      
      // Si aucun changement, réutiliser la valeur précédente
      if (!hasChanged) {
        return;
      }
    }
    
    // Calcul optimisé avec accumulateur
    const newUnreadCounts = new Map<string, number>();
    const total = conversations.reduce((count, conversation) => {
      // Trouver l'autre participant (en supposant une conversation à 2 personnes)
      const otherParticipant = conversation.participants.find(
        p => p.id !== userId
      );
      
      const unreadCount = otherParticipant?.unread_count || 0;
      newUnreadCounts.set(conversation.id, unreadCount);
      
      return count + unreadCount;
    }, 0);
    
    // Mettre à jour l'état et la référence
    setTotalUnreadCount(total);
    
    // Mettre à jour les références pour les comparaisons futures
    previousDataRef.current = {
      conversationIds: currentConversationIds,
      unreadCounts: newUnreadCounts,
      totalCount: total
    };
    
    setIsLoading(false);
  }, [conversations, userId, currentConversationIds]);
  
  // Calculer le total à chaque changement de conversations
  useEffect(() => {
    calculateTotalUnread();
  }, [calculateTotalUnread]);

  // Charger les conversations si nécessaire avec callback mémorisé
  const loadConversations = useCallback(async () => {
    if (!userId) return;
    
    try {
      await fetchConversations(userId);
    } finally {
      setIsLoading(false);
    }
  }, [userId, fetchConversations]);
  
  // Effet optimisé pour charger les conversations
  useEffect(() => {
    if (userId && conversations.length === 0) {
      loadConversations();
    } else if (conversations.length > 0) {
      setIsLoading(false);
    }
  }, [userId, conversations.length, loadConversations]);

  return { totalUnreadCount, isLoading };
}

// Export par défaut pour la compatibilité rétroactive
export default useTotalUnreadMessages; 