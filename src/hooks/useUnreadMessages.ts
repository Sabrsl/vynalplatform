import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';

interface UnreadCounts {
  total: number;
  byConversation: Record<string, number>;
}

export const useUnreadMessages = (userId: string | undefined) => {
  const [unreadCounts, setUnreadCounts] = useState<UnreadCounts>({
    total: 0,
    byConversation: {}
  });

  useEffect(() => {
    if (!userId) return;

    // Charger les compteurs initiaux
    const loadUnreadCounts = async () => {
      const { data, error } = await supabase
        .from('conversation_participants')
        .select('conversation_id, unread_count')
        .eq('participant_id', userId);
      
      if (error) {
        console.error('Erreur lors du chargement des compteurs:', error);
        return;
      }
      
      // Traiter les données
      const byConversation: Record<string, number> = {};
      let total = 0;
      
      data?.forEach(item => {
        byConversation[item.conversation_id] = item.unread_count || 0;
        total += (item.unread_count || 0);
      });
      
      setUnreadCounts({ total, byConversation });
    };
    
    loadUnreadCounts();
    
    // S'abonner aux mises à jour des compteurs
    const subscription = supabase
      .channel('unread-counters')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'conversation_participants',
          filter: `participant_id=eq.${userId}`
        },
        () => loadUnreadCounts() // Recharger tous les compteurs à chaque mise à jour
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(subscription);
    };
  }, [userId]);

  // Fonction pour marquer une conversation comme lue
  const markAsRead = useCallback(async (conversationId: string) => {
    if (!userId || !conversationId) return;
    
    try {
      // Appeler la fonction RPC existante
      await supabase.rpc('mark_messages_as_read', {
        p_conversation_id: conversationId,
        p_user_id: userId
      });
      
      // Mettre à jour l'état local immédiatement pour une UX fluide
      setUnreadCounts(prev => {
        const prevCount = prev.byConversation[conversationId] || 0;
        
        return {
          total: Math.max(0, prev.total - prevCount),
          byConversation: {
            ...prev.byConversation,
            [conversationId]: 0
          }
        };
      });
    } catch (error) {
      console.error('Erreur lors du marquage comme lu:', error);
    }
  }, [userId]);

  return { unreadCounts, markAsRead };
}; 