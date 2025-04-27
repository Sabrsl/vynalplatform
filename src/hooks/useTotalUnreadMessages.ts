import { useState, useEffect } from 'react';
import { useMessagingStore } from '@/lib/stores/useMessagingStore';
import { useAuth } from '@/hooks/useAuth';

/**
 * Hook pour récupérer le nombre total de messages non lus pour l'utilisateur actuel
 */
export function useTotalUnreadMessages() {
  const { user } = useAuth();
  const { conversations, fetchConversations } = useMessagingStore();
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const calculateTotalUnread = () => {
      if (conversations.length === 0) {
        setTotalUnreadCount(0);
        return;
      }
      
      let count = 0;
      
      conversations.forEach(conversation => {
        // Trouver l'autre participant (en supposant une conversation à 2 personnes)
        const otherParticipant = conversation.participants.find(
          p => p.id !== user?.id
        );
        
        // Ajouter le nombre de messages non lus de cette conversation
        count += otherParticipant?.unread_count || 0;
      });
      
      setTotalUnreadCount(count);
      setIsLoading(false);
    };
    
    // Calculer le total des messages non lus à chaque changement de conversations
    calculateTotalUnread();
  }, [conversations, user?.id]);

  // Charger les conversations si nécessaire
  useEffect(() => {
    if (user?.id && conversations.length === 0) {
      fetchConversations(user.id)
        .finally(() => setIsLoading(false));
    } else if (conversations.length > 0) {
      setIsLoading(false);
    }
  }, [user?.id, conversations.length, fetchConversations]);

  return { totalUnreadCount, isLoading };
}

// Export par défaut pour la compatibilité rétroactive
export default useTotalUnreadMessages; 