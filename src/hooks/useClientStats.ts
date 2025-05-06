import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from './useAuth';
import { getCachedData, setCachedData } from '@/lib/optimizations/cache';

export interface ClientStats {
  activeOrders: number;
  completedOrders: number;
  pendingDeliveries: number;
  totalSpent: number;
  unreadMessages: number;
  favoriteFreelancers: number;
}

interface UseClientStatsOptions {
  useCache?: boolean;
}

/**
 * Hook pour récupérer les statistiques d'un client
 */
export function useClientStats(options: UseClientStatsOptions = {}) {
  const { useCache = true } = options;
  const { user } = useAuth();
  const [stats, setStats] = useState<ClientStats>({
    activeOrders: 0,
    completedOrders: 0,
    pendingDeliveries: 0,
    totalSpent: 0,
    unreadMessages: 0,
    favoriteFreelancers: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Clé de cache unique
  const cacheKey = useMemo(() => {
    if (!useCache || !user?.id) return '';
    return `client_stats_${user.id}`;
  }, [user?.id, useCache]);

  // Fonction pour récupérer les statistiques du client
  const fetchClientStats = useCallback(async (forceRefresh = false) => {
    if (!user) {
      setLoading(false);
      return;
    }

    setIsRefreshing(true);

    try {
      // Vérifier le cache si activé et pas de forceRefresh
      if (useCache && !forceRefresh) {
        const cachedData = getCachedData<ClientStats>(cacheKey);
        if (cachedData) {
          console.log("[ClientStats] Utilisation des données en cache");
          setStats(cachedData);
          setLoading(false);
          setIsRefreshing(false);
          return;
        }
      }

      // La fonction RPC n'existe pas, on passe directement aux requêtes individuelles
      console.log("[ClientStats] Récupération des stats via requêtes individuelles");
      
      // Commandes actives (en cours, en attente, révision demandée)
      const { data: activeData, error: activeError } = await supabase
        .from('orders')
        .select('count')
        .eq('client_id', user.id)
        .or('status.eq.in_progress,status.eq.pending,status.eq.revision_requested');
        
      if (activeError) throw activeError;
      
      // Commandes terminées
      const { data: completedData, error: completedError } = await supabase
        .from('orders')
        .select('count')
        .eq('client_id', user.id)
        .or('status.eq.completed,status.eq.delivered');
        
      if (completedError) throw completedError;
      
      // Commandes en attente de livraison
      const { data: pendingDeliveryData, error: pendingDeliveryError } = await supabase
        .from('orders')
        .select('count')
        .eq('client_id', user.id)
        .eq('status', 'delivered');
        
      if (pendingDeliveryError) throw pendingDeliveryError;
      
      // Total dépensé - corriger la requête qui utilise in()
      const { data: spentData, error: spentError } = await supabase
        .from('orders')
        .select('price')
        .eq('client_id', user.id)
        .or('status.eq.completed,status.eq.delivered,status.eq.in_progress');
        
      if (spentError) throw spentError;
      
      // Messages non lus
      // D'abord récupérer les IDs des conversations du client via la table conversation_participants
      const { data: conversationsData, error: conversationsError } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('participant_id', user.id);
        
      if (conversationsError) throw conversationsError;
      
      const conversationIds = conversationsData ? conversationsData.map(conv => conv.conversation_id) : [];
      
      // Si nous avons des conversations, compter les messages non lus dans ces conversations
      let unreadCount = 0;
      
      if (conversationIds.length > 0) {
        const { data: unreadMessagesData, error: unreadMessagesError } = await supabase
          .from('messages')
          .select('count')
          .eq('read', false)
          .neq('sender_id', user.id)  // Ne pas compter les messages envoyés par l'utilisateur lui-même
          .in('conversation_id', conversationIds);
          
        if (unreadMessagesError) throw unreadMessagesError;
        
        unreadCount = unreadMessagesData && unreadMessagesData[0] ? unreadMessagesData[0].count || 0 : 0;
      }
      
      // Freelancers favoris - compter les services ajoutés aux favoris groupés par freelancer
      const { data: favoritesData, error: favoritesError } = await supabase
        .from('favorites')
        .select(`
          id, 
          service_id,
          services:service_id (
            freelance_id
          )
        `)
        .eq('client_id', user.id);
        
      if (favoritesError) throw favoritesError;
      
      // Compter le nombre de freelancers uniques dont les services sont favoris
      const uniqueFreelancerIds = new Set<string>();
      if (favoritesData && favoritesData.length > 0) {
        favoritesData.forEach((fav: any) => {
          if (fav.services && fav.services.freelance_id) {
            uniqueFreelancerIds.add(fav.services.freelance_id);
          }
        });
      }
      
      // Calculer le total dépensé
      const totalSpent = spentData && spentData.length ? spentData.reduce((total, order) => {
        return total + (order.price || 0);
      }, 0) : 0;
      
      // Composer les statistiques
      const statsData = {
        activeOrders: activeData && activeData[0] ? activeData[0].count || 0 : 0,
        completedOrders: completedData && completedData[0] ? completedData[0].count || 0 : 0,
        pendingDeliveries: pendingDeliveryData && pendingDeliveryData[0] ? pendingDeliveryData[0].count || 0 : 0,
        totalSpent,
        unreadMessages: unreadCount,
        favoriteFreelancers: uniqueFreelancerIds.size
      };
      
      // Mettre à jour l'état et le cache
      setStats(statsData);
      if (useCache) {
        setCachedData(cacheKey, statsData, { expiry: 5 * 60 * 1000 }); // Cache de 5 minutes
      }
    } catch (err) {
      console.error("[ClientStats] Exception:", err);
      setError(err instanceof Error ? err.message : "Erreur inconnue");
      // Ne pas laisser l'état vide en cas d'erreur, garder les valeurs par défaut
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [user, cacheKey, useCache]);

  // Charger les données au montage du composant
  useEffect(() => {
    fetchClientStats();
  }, [fetchClientStats]);

  return {
    stats,
    loading,
    error,
    isRefreshing,
    refresh: () => fetchClientStats(true)
  };
} 