import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useOptimizedUser } from './useOptimizedUser';
import { 
  getCachedData, 
  setCachedData, 
  invalidateCache, 
  CACHE_KEYS, 
  CACHE_EXPIRY 
} from '@/lib/optimizations';
import { useLastRefresh } from './useLastRefresh';

interface MessageCounts {
  totalUnread: number;
  conversationCounts: Record<string, number>;
}

/**
 * Hook optimisé pour récupérer et mettre à jour les compteurs de messages non lus
 */
export function useMessageCounts() {
  const { profile } = useOptimizedUser();
  const [counts, setCounts] = useState<MessageCounts>({ totalUnread: 0, conversationCounts: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { lastRefresh, updateLastRefresh, getLastRefreshText } = useLastRefresh();

  // Générer une clé de cache unique
  const getCacheKey = useCallback(() => {
    if (!profile?.id) return null;
    return `${CACHE_KEYS.MESSAGE_COUNTS}_${profile.id}`;
  }, [profile?.id]);

  // Fonction pour charger les données
  const fetchCounts = useCallback(async (forceRefresh = false) => {
    if (!profile?.id) {
      setLoading(false);
      return;
    }

    // Vérifier le cache d'abord si ce n'est pas un forceRefresh
    const cacheKey = getCacheKey();
    if (!forceRefresh && cacheKey) {
      const cachedCounts = getCachedData<MessageCounts>(cacheKey);
      
      if (cachedCounts) {
        setCounts(cachedCounts);
        setLoading(false);
        
        // Rafraîchir en arrière-plan
        refreshInBackground();
        return;
      }
    }

    try {
      setLoading(true);
      setError(null);

      // Requête pour obtenir les messages non lus
      const { data, error } = await supabase
        .from('messages')
        .select('conversation_id, count')
        .eq('recipient_id', profile.id)
        .eq('is_read', false)
        .select('conversation_id')
        .then(({ data, error }) => {
          // Traiter les données pour obtenir le comptage par conversation
          if (data) {
            const conversationCounts: Record<string, number> = {};
            
            data.forEach((message: any) => {
              const convId = message.conversation_id;
              conversationCounts[convId] = (conversationCounts[convId] || 0) + 1;
            });
            
            const totalUnread = data.length;
            
            return {
              data: { totalUnread, conversationCounts },
              error
            };
          }
          
          return { data: null, error };
        });

      if (error) throw error;

      if (data) {
        setCounts(data);
        
        // Mettre en cache
        if (cacheKey) {
          setCachedData<MessageCounts>(cacheKey, data, { 
            expiry: CACHE_EXPIRY.DYNAMIC // Cache court pour les messages
          });
        }
        
        // Mettre à jour le dernier rafraîchissement
        updateLastRefresh();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [profile?.id, getCacheKey, updateLastRefresh]);

  // Rafraîchir les données en arrière-plan
  const refreshInBackground = useCallback(() => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    fetchCounts(true);
  }, [isRefreshing, fetchCounts]);

  // Forcer un rafraîchissement complet
  const refreshCounts = useCallback(() => {
    setLoading(true);
    
    // Invalider le cache
    const cacheKey = getCacheKey();
    if (cacheKey) {
      invalidateCache(cacheKey);
    }
    
    // Recharger les données
    fetchCounts(true);
  }, [getCacheKey, fetchCounts]);

  // S'abonner aux événements de mise à jour des messages
  useEffect(() => {
    if (!profile?.id) return;
    
    // Charger les données initiales
    fetchCounts();
    
    // Abonnement aux changements de messages en temps réel
    const subscription = supabase
      .channel('message-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'messages',
        filter: `recipient_id=eq.${profile.id}`
      }, () => {
        // Rafraîchir les compteurs quand il y a des changements
        refreshInBackground();
      })
      .subscribe();
    
    return () => {
      supabase.removeChannel(subscription);
    };
  }, [profile?.id, fetchCounts, refreshInBackground]);

  return {
    totalUnread: counts.totalUnread,
    conversationCounts: counts.conversationCounts,
    loading,
    error,
    isRefreshing,
    refreshCounts,
    lastRefresh,
    getLastRefreshText
  };
} 