import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';
import { DisputeWithDetails, DisputeMessage, getDisputeById, getDisputeMessages, updateDispute, addDisputeMessage } from '@/lib/supabase/disputes';
import { useToast } from '@/components/ui/use-toast';
import { useUser } from './useUser';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface UseDisputeDetailOptions {
  useCache?: boolean;
  autoRefreshMessages?: boolean;
  autoRefreshInterval?: number;
}

export function useDisputeDetail(disputeId: string, options: UseDisputeDetailOptions = {}) {
  const {
    useCache = true,
    autoRefreshMessages = false,
    autoRefreshInterval = 10000 // 10 secondes par défaut
  } = options;
  
  const { profile, isClient, isFreelance } = useUser();
  const { toast } = useToast();
  
  // États
  const [dispute, setDispute] = useState<DisputeWithDetails | null>(null);
  const [messages, setMessages] = useState<DisputeMessage[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [messageLoading, setMessageLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [messageError, setMessageError] = useState<string | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<boolean>(false);
  
  // Références pour empêcher les requêtes concurrentes
  const isFetchingDisputeRef = useRef(false);
  const isFetchingMessagesRef = useRef(false);
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Déterminer si l'utilisateur peut résoudre le litige
  const canResolveDispute = useCallback(() => {
    if (!dispute || !profile) return false;
    
    const isDisputeOpen = dispute.status === 'open';
    const isPartyInDispute = 
      (isClient && dispute.client_id === profile.id) || 
      (isFreelance && dispute.freelance_id === profile.id);
    
    return isDisputeOpen && isPartyInDispute;
  }, [dispute, profile, isClient, isFreelance]);
  
  // Récupérer les détails du litige
  const fetchDisputeDetails = useCallback(async () => {
    if (!disputeId || !profile || isFetchingDisputeRef.current) return;
    
    isFetchingDisputeRef.current = true;
    setLoading(true);
    setError(null);
    
    try {
      console.log("[DisputeDetail] Récupération des détails du litige:", disputeId);
      const dispute = await getDisputeById(disputeId);
      
      if (!dispute) {
        setError("Impossible de trouver ce litige.");
        return;
      }
      
      // Vérifier que l'utilisateur est impliqué dans ce litige
      if (dispute.client_id !== profile.id && dispute.freelance_id !== profile.id) {
        setError("Vous n'avez pas accès à ce litige.");
        return;
      }
      
      setDispute(dispute);
    } catch (err) {
      console.error("Erreur lors de la récupération du litige:", err);
      setError("Une erreur est survenue lors du chargement du litige.");
    } finally {
      setLoading(false);
      isFetchingDisputeRef.current = false;
    }
  }, [disputeId, profile]);
  
  // Récupérer les messages du litige
  const fetchMessages = useCallback(async () => {
    if (!disputeId || isFetchingMessagesRef.current) return;
    
    isFetchingMessagesRef.current = true;
    setMessageLoading(true);
    setMessageError(null);
    
    try {
      console.log("[DisputeDetail] Récupération des messages du litige:", disputeId);
      const fetchedMessages = await getDisputeMessages(disputeId);
      setMessages(fetchedMessages);
    } catch (err) {
      console.error("Erreur lors de la récupération des messages:", err);
      setMessageError("Impossible de charger les messages du litige.");
    } finally {
      setMessageLoading(false);
      isFetchingMessagesRef.current = false;
    }
  }, [disputeId]);
  
  // Mettre à jour le statut du litige
  const updateDisputeStatus = useCallback(async (status: 'resolved' | 'closed', resolution: string) => {
    if (!dispute || !profile || isUpdatingStatus) return false;
    
    setIsUpdatingStatus(true);
    
    try {
      console.log(`[DisputeDetail] Mise à jour du statut du litige: ${status}`);
      let updateData: any = {
        status,
        resolution
      };
      
      // Ajouter des champs spécifiques selon le statut
      if (status === 'resolved') {
        updateData.resolved_by = profile.id;
        updateData.resolved_at = new Date().toISOString();
      } else if (status === 'closed') {
        updateData.closed_at = new Date().toISOString();
      }
      
      const success = await updateDispute(disputeId, updateData);
      
      if (success) {
        toast({
          title: status === 'resolved' ? "Litige résolu" : "Litige fermé",
          description: status === 'resolved' 
            ? "Le litige a été marqué comme résolu avec succès." 
            : "Le litige a été fermé avec succès.",
        });
        
        // Mettre à jour les données locales
        fetchDisputeDetails();
        return true;
      } else {
        toast({
          title: "Erreur",
          description: "Impossible de mettre à jour le statut du litige.",
          variant: "destructive"
        });
        return false;
      }
    } catch (err) {
      console.error("Erreur lors de la mise à jour du statut:", err);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la mise à jour du statut.",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsUpdatingStatus(false);
    }
  }, [dispute, profile, disputeId, isUpdatingStatus, toast, fetchDisputeDetails]);
  
  // Envoyer un message
  const sendMessage = useCallback(async (message: string, attachmentUrl?: string) => {
    if (!dispute || !profile) {
      throw new Error("Impossible d'envoyer le message: profil ou litige manquant.");
    }
    
    try {
      console.log("[DisputeDetail] Envoi d'un nouveau message");
      const success = await addDisputeMessage(
        disputeId,
        profile.id,
        message,
        attachmentUrl
      );
      
      if (success) {
        // Actualiser les messages
        await fetchMessages();
        return true;
      } else {
        throw new Error("Échec de l'envoi du message.");
      }
    } catch (err) {
      console.error("Erreur lors de l'envoi du message:", err);
      throw err;
    }
  }, [dispute, profile, disputeId, fetchMessages]);
  
  // Formater les dates pour l'affichage
  const getFormattedDate = useCallback((dateStr: string) => {
    if (!dateStr) return '';
    
    try {
      return format(new Date(dateStr), 'dd MMMM yyyy à HH:mm', { locale: fr });
    } catch (err) {
      console.error("Erreur lors du formatage de la date:", err);
      return dateStr;
    }
  }, []);
  
  // Charger les données initiales
  useEffect(() => {
    if (disputeId && profile) {
      fetchDisputeDetails();
      fetchMessages();
    }
    
    return () => {
      // Nettoyer lors du démontage
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
    };
  }, [disputeId, profile, fetchDisputeDetails, fetchMessages]);
  
  // Configuration de l'actualisation automatique des messages
  useEffect(() => {
    if (!autoRefreshMessages || !disputeId) return;
    
    if (refreshTimerRef.current) {
      clearInterval(refreshTimerRef.current);
    }
    
    refreshTimerRef.current = setInterval(() => {
      console.log("[DisputeDetail] Actualisation automatique des messages");
      fetchMessages();
    }, autoRefreshInterval);
    
    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
    };
  }, [autoRefreshMessages, autoRefreshInterval, disputeId, fetchMessages]);
  
  // Abonnement aux changements en temps réel
  useEffect(() => {
    if (!disputeId) return;
    
    console.log("[DisputeDetail] Configuration des abonnements en temps réel");
    
    const disputesChannel = supabase
      .channel(`dispute-${disputeId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'disputes',
        filter: `id=eq.${disputeId}`
      }, () => {
        console.log("[DisputeDetail] Mise à jour du litige détectée en temps réel");
        fetchDisputeDetails();
      })
      .subscribe();
    
    const messagesChannel = supabase
      .channel(`dispute-messages-${disputeId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'dispute_messages',
        filter: `dispute_id=eq.${disputeId}`
      }, () => {
        console.log("[DisputeDetail] Nouveau message détecté en temps réel");
        fetchMessages();
      })
      .subscribe();
    
    return () => {
      console.log("[DisputeDetail] Nettoyage des abonnements en temps réel");
      supabase.removeChannel(disputesChannel);
      supabase.removeChannel(messagesChannel);
    };
  }, [disputeId, fetchDisputeDetails, fetchMessages]);
  
  return {
    dispute,
    messages,
    loading,
    messageLoading,
    error,
    messageError,
    isUpdatingStatus,
    refreshDispute: fetchDisputeDetails,
    refreshMessages: fetchMessages,
    updateDisputeStatus,
    sendMessage,
    isClient,
    isFreelance,
    canResolveDispute: canResolveDispute(),
    getFormattedDate
  };
} 