import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

interface UnreadCounts {
  total: number;
  byConversation: Record<string, number>;
}

// Cache global pour partager les données entre les instances du hook
const CACHE = {
  unreadCounts: null as UnreadCounts | null,
  lastFetchTime: 0,
  subscriptionCount: 0,
  pendingRefresh: false
};

// Durée en ms entre deux rafraîchissements
const THROTTLE_DURATION = 30000; // 30 secondes

export const useUnreadMessages = (userId: string | undefined) => {
  const [unreadCounts, setUnreadCounts] = useState<UnreadCounts>({
    total: 0,
    byConversation: {}
  });
  
  // Références pour garder trace de l'état de la requête
  const isActiveRef = useRef(true);
  const lastFetchTimeRef = useRef(0);

  // Fonction pour charger les compteurs de messages non lus
  const loadUnreadCounts = useCallback(async (force = false) => {
    if (!userId) return;
    
    // Vérifier si nous devons vraiment faire une requête
    const now = Date.now();
    const timeSinceLastFetch = now - CACHE.lastFetchTime;
    
    // Si nous avons des données en cache et que le temps de throttle n'est pas écoulé
    if (!force && CACHE.unreadCounts && timeSinceLastFetch < THROTTLE_DURATION) {
      // Utiliser les données en cache
      setUnreadCounts(CACHE.unreadCounts);
      return;
    }
    
    // Si une requête est déjà en cours, ne pas en lancer une autre
    if (CACHE.pendingRefresh) return;
    
    try {
      CACHE.pendingRefresh = true;
      lastFetchTimeRef.current = now;
      CACHE.lastFetchTime = now;
      
      const { data, error } = await supabase
        .from('conversation_participants')
        .select('conversation_id, unread_count')
        .eq('participant_id', userId);
      
      CACHE.pendingRefresh = false;
      
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
      
      // Mettre à jour le cache global
      CACHE.unreadCounts = newCounts;
      
      // Mettre à jour l'état uniquement si le composant est toujours monté
      if (isActiveRef.current) {
        setUnreadCounts(newCounts);
      }
      
      // Émettre un événement global pour mettre à jour les interfaces
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('vynal:messages-update', { 
          detail: { counts: newCounts, timestamp: now } 
        }));
      }
    } catch (err) {
      CACHE.pendingRefresh = false;
      console.error('Erreur lors du chargement des compteurs:', err);
    }
  }, [userId]);

  // Fonction pour permettre de rafraîchir manuellement les compteurs
  const refreshCount = useCallback(() => {
    loadUnreadCounts(true); // Force le rafraîchissement
  }, [loadUnreadCounts]);

  useEffect(() => {
    if (!userId) return;
    
    isActiveRef.current = true;
    CACHE.subscriptionCount++;

    // Charger depuis le cache si disponible, sinon faire une requête
    if (CACHE.unreadCounts) {
      setUnreadCounts(CACHE.unreadCounts);
      
      // Vérifier si nous devons rafraîchir en arrière-plan
      const now = Date.now();
      if (now - CACHE.lastFetchTime > THROTTLE_DURATION) {
        loadUnreadCounts();
      }
    } else {
      // Premier chargement
      loadUnreadCounts();
    }
    
    // S'abonner aux mises à jour des compteurs si c'est la première instance
    let subscription: RealtimeChannel | undefined;
    if (CACHE.subscriptionCount === 1) {
      subscription = supabase
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
              // Vérifier si nous devons throttler
              const now = Date.now();
              if (now - CACHE.lastFetchTime > THROTTLE_DURATION) {
                loadUnreadCounts();
              }
            }, 0);
            return undefined; // Ne pas retourner de promesse
          }
        )
        .subscribe();
    }
    
    // S'abonner aux événements de visibilité pour rafraîchir
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const now = Date.now();
        if (now - CACHE.lastFetchTime > THROTTLE_DURATION) {
          loadUnreadCounts();
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      isActiveRef.current = false;
      CACHE.subscriptionCount--;
      
      // Nettoyage
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      
      // Nettoyer proprement la souscription si c'est la dernière instance
      if (CACHE.subscriptionCount === 0 && subscription) {
        supabase.removeChannel(subscription);
      }
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
      
      // Mettre à jour l'état local et le cache immédiatement pour une UX fluide
      const updateCounts = (prev: UnreadCounts): UnreadCounts => {
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
      };
      
      // Mettre à jour l'état local
      setUnreadCounts(prev => {
        const newCounts = updateCounts(prev);
        // Mettre à jour le cache global également
        CACHE.unreadCounts = newCounts;
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