import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';

interface UseFreelancerRatingReturn {
  averageRating: number;
  reviewCount: number;
  loading: boolean;
  error: string | null;
}

/**
 * Hook pour récupérer la note moyenne d'un freelance
 */
export function useFreelancerRating(freelanceId: string | null | undefined): UseFreelancerRatingReturn {
  const [averageRating, setAverageRating] = useState<number>(0);
  const [reviewCount, setReviewCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRating() {
      if (!freelanceId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // Récupérer tous les avis pour ce freelance
        const { data, error: reviewsError } = await supabase
          .from('reviews')
          .select('rating')
          .eq('freelance_id', freelanceId);
          
        if (reviewsError) {
          console.error('Erreur lors du chargement des avis:', reviewsError);
          throw new Error('Impossible de charger les avis pour ce freelance.');
        }
        
        if (data && data.length > 0) {
          const totalRating = data.reduce((sum: number, review: { rating: number }) => sum + (review.rating || 0), 0);
          setAverageRating(parseFloat((totalRating / data.length).toFixed(1)));
          setReviewCount(data.length);
        } else {
          setAverageRating(0);
          setReviewCount(0);
        }
      } catch (err: any) {
        console.error('Erreur:', err);
        setError(err.message || 'Une erreur est survenue');
      } finally {
        setLoading(false);
      }
    }
    
    fetchRating();
  }, [freelanceId]);
  
  return { averageRating, reviewCount, loading, error };
} 