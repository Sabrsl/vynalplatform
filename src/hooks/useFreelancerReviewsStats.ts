import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase/client';

interface RatingDistribution {
  '1': number;
  '2': number;
  '3': number;
  '4': number;
  '5': number;
}

interface FreelancerReviewsStats {
  freelance_id: string;
  total_reviews: number;
  average_rating: number;
  ratings_distribution: RatingDistribution;
}

interface UseFreelancerReviewsStatsReturn {
  stats: FreelancerReviewsStats | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

// Cache pour les statistiques des avis
const statsCache = new Map<string, {
  stats: FreelancerReviewsStats;
  timestamp: number;
}>();

// Durée de validité du cache (5 minutes)
const CACHE_TTL = 5 * 60 * 1000;

/**
 * Hook pour récupérer les statistiques des avis d'un freelance
 * Utilise la fonction SQL get_freelancer_reviews_stats
 */
export function useFreelancerReviewsStats(freelanceId: string | null | undefined): UseFreelancerReviewsStatsReturn {
  const [stats, setStats] = useState<FreelancerReviewsStats | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Référence pour suivre la requête en cours et le montage du composant
  const refs = useRef({
    isMounted: true,
    abortController: null as AbortController | null,
    freelanceId: freelanceId
  });
  
  // Fonction de récupération des statistiques
  const fetchStats = useCallback(async (id: string, useCache = true): Promise<void> => {
    if (!id) return;
    
    // Vérifier le cache d'abord
    if (useCache) {
      const cachedData = statsCache.get(id);
      if (cachedData && (Date.now() - cachedData.timestamp < CACHE_TTL)) {
        if (refs.current.isMounted) {
          setStats(cachedData.stats);
          setLoading(false);
          setError(null);
        }
        return;
      }
    }
    
    // Annuler toute requête en cours
    if (refs.current.abortController) {
      refs.current.abortController.abort();
    }
    
    // Créer un nouveau contrôleur d'annulation
    refs.current.abortController = new AbortController();
    
    // Mettre à jour l'état pour indiquer le chargement
    if (refs.current.isMounted) {
      setLoading(true);
      setError(null);
    }
    
    try {
      // Appeler la fonction RPC get_freelancer_reviews_stats
      const { data, error: rpcError } = await supabase
        .rpc('get_freelancer_reviews_stats', { p_freelance_id: id });
      
      if (rpcError) {
        throw new Error(rpcError.message || 'Erreur lors de la récupération des statistiques des avis');
      }
      
      if (data) {
        // Mettre à jour le cache
        statsCache.set(id, {
          stats: data,
          timestamp: Date.now()
        });
        
        // Mettre à jour l'état
        if (refs.current.isMounted) {
          setStats(data);
          setLoading(false);
          setError(null);
        }
      }
    } catch (err: any) {
      console.error('Erreur lors du chargement des statistiques des avis:', err);
      
      // Mettre à jour l'état d'erreur
      if (refs.current.isMounted) {
        setLoading(false);
        setError(err.message || 'Une erreur est survenue');
      }
    }
  }, []);
  
  // Fonction de rafraîchissement exposée
  const refresh = useCallback(async (): Promise<void> => {
    if (refs.current.freelanceId) {
      await fetchStats(refs.current.freelanceId, false);
    }
  }, [fetchStats]);
  
  // Effet pour charger les données
  useEffect(() => {
    refs.current.isMounted = true;
    refs.current.freelanceId = freelanceId;
    
    if (freelanceId) {
      fetchStats(freelanceId);
    } else {
      // Réinitialiser l'état si pas d'ID
      setStats(null);
      setLoading(false);
      setError(null);
    }
    
    // Nettoyage
    return () => {
      refs.current.isMounted = false;
      
      // Annuler toute requête en cours
      if (refs.current.abortController) {
        refs.current.abortController.abort();
        refs.current.abortController = null;
      }
    };
  }, [freelanceId, fetchStats]);
  
  // Retourner un objet memoïsé
  return useMemo(() => ({
    stats,
    loading,
    error,
    refresh
  }), [stats, loading, error, refresh]);
} 