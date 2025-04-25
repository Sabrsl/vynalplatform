import { useState, useEffect, useCallback, useRef } from 'react';
import { useUser } from './useUser';
import { supabase } from '@/lib/supabase/client';
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

interface UseMessageCountsOptions {
  useCache?: boolean;
}

/**
 * Hook pour récupérer et mettre à jour les compteurs de messages non lus
 */
export function useMessageCounts(options: UseMessageCountsOptions = {}) {
  const { useCache = true } = options;
  const { profile } = useUser({ useCache });
  const [counts, setCounts] = useState<MessageCounts>({ totalUnread: 0, conversationCounts: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const fetchInProgressRef = useRef<boolean>(false);
  const { lastRefresh, updateLastRefresh, getLastRefreshText } = useLastRefresh();

  // Générer une clé de cache unique
  const getCacheKey = useCallback(() => {
    if (!useCache || !profile?.id) return null;
    return `${CACHE_KEYS.MESSAGE_COUNTS}_${profile.id}`;
  }, [profile?.id, useCache]);

  // Fonction pour charger les données
  const fetchCounts = useCallback(async (forceRefresh = false) => {
    if (!profile?.id || (fetchInProgressRef.current && !forceRefresh)) {
      return;
    }

    fetchInProgressRef.current = true;

    // Vérifier le cache d'abord si ce n'est pas un forceRefresh
    if (useCache && !forceRefresh) {
      const cacheKey = getCacheKey();
      if (cacheKey) {
        const cachedCounts = getCachedData<MessageCounts>(cacheKey);
        
        if (cachedCounts) {
          setCounts(cachedCounts);
          setLoading(false);
          fetchInProgressRef.current = false;
          
          // Rafraîchir en arrière-plan
          refreshInBackground();
          return;
        }
      }
    }

    try {
      setLoading(true);
      setError(null);

      // Requête pour obtenir les messages non lus avec timeout pour éviter les blocages
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Timeout lors de la récupération des messages")), 5000);
      });
      
      const fetchPromise = supabase
        .from('messages')
        .select('conversation_id')
        .eq('recipient_id', profile.id)
        .eq('is_read', false);
      
      // Utiliser Promise.race pour implémenter le timeout
      const result = await Promise.race([fetchPromise, timeoutPromise]) as any;
      const { data, error } = result;

      if (error) throw error;

      if (data) {
        // Traiter les données pour obtenir le comptage par conversation
        const conversationCounts: Record<string, number> = {};
        
        data.forEach((message: any) => {
          const convId = message.conversation_id;
          conversationCounts[convId] = (conversationCounts[convId] || 0) + 1;
        });
        
        const totalUnread = data.length;
        const messageData = { totalUnread, conversationCounts };
        
        setCounts(messageData);
        
        // Mettre en cache si l'option est activée
        if (useCache) {
          const cacheKey = getCacheKey();
          if (cacheKey) {
            setCachedData<MessageCounts>(cacheKey, messageData, { 
              expiry: CACHE_EXPIRY.DYNAMIC // Cache court pour les messages
            });
          }
        }
        
        // Mettre à jour le dernier rafraîchissement
        updateLastRefresh();
      }
    } catch (err: any) {
      console.error('Erreur lors de la récupération des messages:', err);
      setError(err.message);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
      fetchInProgressRef.current = false;
    }
  }, [profile?.id, getCacheKey, updateLastRefresh, useCache]);

  // Rafraîchir les données en arrière-plan
  const refreshInBackground = useCallback(() => {
    if (isRefreshing || !useCache) return;
    setIsRefreshing(true);
    fetchCounts(true);
  }, [isRefreshing, fetchCounts, useCache]);

  // Forcer un rafraîchissement complet
  const refreshCounts = useCallback(() => {
    // Invalider le cache si l'option est activée
    if (useCache) {
      const cacheKey = getCacheKey();
      if (cacheKey) {
        invalidateCache(cacheKey);
      }
    }
    
    // Recharger les données
    setLoading(true);
    fetchCounts(true);
  }, [getCacheKey, fetchCounts, useCache]);

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

/**
 * Re-export du hook pour compatibilité
 * @deprecated Utilisez useMessageCounts avec l'option {useCache: true}
 */
export function useOptimizedMessageCounts() {
  return useMessageCounts({ useCache: true });
} 