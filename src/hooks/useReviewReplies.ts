import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/use-toast';

export type ReviewReply = {
  id: string;
  created_at: string;
  updated_at: string;
  review_id: string;
  freelance_id: string;
  content: string;
};

type UseReviewRepliesParams = {
  reviewId?: string;
  freelanceId?: string;
  enabled?: boolean;
};

type UseReviewRepliesReturn = {
  reply: ReviewReply | null;
  isLoading: boolean;
  error: Error | null;
  submitReply: (content: string) => Promise<void>;
  updateReply: (content: string) => Promise<void>;
  deleteReply: () => Promise<void>;
};

/**
 * Hook pour gérer les réponses aux avis
 */
export function useReviewReplies({
  reviewId,
  freelanceId,
  enabled = true
}: UseReviewRepliesParams): UseReviewRepliesReturn {
  const [reply, setReply] = useState<ReviewReply | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!reviewId || !enabled) return;
    
    async function fetchReply() {
      setIsLoading(true);
      setError(null);
      
      try {
        const { data, error: fetchError } = await supabase
          .from('review_replies')
          .select('*')
          .eq('review_id', reviewId)
          .single();
          
        if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "no rows returned" error
          console.error('Erreur lors du chargement de la réponse:', fetchError);
          throw new Error('Impossible de charger la réponse à cet avis');
        }
        
        setReply(data || null);
      } catch (err: any) {
        console.error('Erreur:', err);
        setError(err);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchReply();
  }, [reviewId, enabled]);

  const submitReply = async (content: string) => {
    if (!reviewId || !freelanceId) {
      throw new Error('ID de l\'avis ou du freelance manquant');
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error: insertError } = await supabase
        .from('review_replies')
        .insert({
          review_id: reviewId,
          freelance_id: freelanceId,
          content
        })
        .select('*')
        .single();
        
      if (insertError) {
        console.error('Erreur lors de l\'ajout de la réponse:', insertError);
        throw new Error('Impossible d\'ajouter votre réponse');
      }
      
      setReply(data);
      toast({
        title: 'Réponse publiée',
        description: 'Votre réponse a été publiée avec succès',
        variant: 'success'
      });
    } catch (err: any) {
      console.error('Erreur:', err);
      setError(err);
      toast({
        title: 'Erreur',
        description: err.message || 'Une erreur est survenue lors de l\'envoi de votre réponse',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateReply = async (content: string) => {
    if (!reply?.id) {
      throw new Error('Aucune réponse à mettre à jour');
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error: updateError } = await supabase
        .from('review_replies')
        .update({ content })
        .eq('id', reply.id)
        .select('*')
        .single();
        
      if (updateError) {
        console.error('Erreur lors de la mise à jour de la réponse:', updateError);
        throw new Error('Impossible de mettre à jour votre réponse');
      }
      
      setReply(data);
      toast({
        title: 'Réponse mise à jour',
        description: 'Votre réponse a été mise à jour avec succès',
        variant: 'success'
      });
    } catch (err: any) {
      console.error('Erreur:', err);
      setError(err);
      toast({
        title: 'Erreur',
        description: err.message || 'Une erreur est survenue lors de la mise à jour de votre réponse',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const deleteReply = async () => {
    if (!reply?.id) {
      throw new Error('Aucune réponse à supprimer');
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const { error: deleteError } = await supabase
        .from('review_replies')
        .delete()
        .eq('id', reply.id);
        
      if (deleteError) {
        console.error('Erreur lors de la suppression de la réponse:', deleteError);
        throw new Error('Impossible de supprimer votre réponse');
      }
      
      setReply(null);
      toast({
        title: 'Réponse supprimée',
        description: 'Votre réponse a été supprimée avec succès',
        variant: 'success'
      });
    } catch (err: any) {
      console.error('Erreur:', err);
      setError(err);
      toast({
        title: 'Erreur',
        description: err.message || 'Une erreur est survenue lors de la suppression de votre réponse',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    reply,
    isLoading,
    error,
    submitReply,
    updateReply,
    deleteReply
  };
} 