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

  // Fonction pour charger les compteurs de messages non lus
  const loadUnreadCounts = useCallback(async () => {
    if (!userId) return;
    
    try {
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
      
      const newCounts = { total, byConversation };
      
      // Mettre à jour l'état
      setUnreadCounts(newCounts);
      
      // Émettre un événement global pour mettre à jour les interfaces
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('vynal:messages-update', { 
          detail: { counts: newCounts, timestamp: Date.now() } 
        }));
      }
    } catch (err) {
      console.error('Erreur lors du chargement des compteurs:', err);
    }
  }, [userId]);

  // Fonction pour permettre de rafraîchir manuellement les compteurs
  const refreshCount = useCallback(() => {
    loadUnreadCounts();
  }, [loadUnreadCounts]);

  useEffect(() => {
    if (!userId) return;

    // Charger les compteurs initiaux
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
        (payload) => {
          // Utiliser setTimeout pour éviter les problèmes de fermeture de canal
          setTimeout(() => {
            loadUnreadCounts();
          }, 0);
          return undefined; // Ne pas retourner de promesse
        }
      )
      .subscribe();
    
    return () => {
      // Nettoyer proprement la souscription
      supabase.removeChannel(subscription);
    };
  }, [userId, loadUnreadCounts]);

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
        
        const newCounts = {
          total: Math.max(0, prev.total - prevCount),
          byConversation: {
            ...prev.byConversation,
            [conversationId]: 0
          }
        };
        
        // Déclencher un événement pour notifier les autres composants
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('vynal:messages-update', { 
            detail: { counts: newCounts, conversationId, timestamp: Date.now() } 
          }));
        }
        
        return newCounts;
      });
      
      // Forcer une mise à jour visuelle en modifiant la date de la conversation
      setTimeout(async () => {
        try {
          // Mettre à jour la date de dernière mise à jour pour forcer le rafraîchissement des indicateurs
          await supabase
            .from('conversations')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', conversationId);
        } catch (error) {
          console.error('Erreur lors de la mise à jour de la conversation:', error);
        }
      }, 300);
    } catch (error) {
      console.error('Erreur lors du marquage comme lu:', error);
    }
  }, [userId]);

  return { unreadCounts, markAsRead, refreshCount };
}; 