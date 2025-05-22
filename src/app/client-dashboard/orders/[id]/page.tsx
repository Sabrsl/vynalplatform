"use client";

import { useState, useEffect, useCallback, useRef, Fragment } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase/client";
import { Loader } from "@/components/ui/loader";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, ArrowLeft, Calendar, CheckCircle, Clock, Download, FileCheck, MessageSquare, RefreshCw, ShieldAlert, ShoppingBag, User, X } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { formatDistanceToNow, format } from "date-fns";
import { fr } from "date-fns/locale";
import * as DialogRadix from '@radix-ui/react-dialog';
import Image from "next/image";
import { CurrencyDisplay } from "@/components/ui/CurrencyDisplay";
import { getCachedData, setCachedData, CACHE_EXPIRY } from "@/lib/optimizations/cache";
import { NavigationLoadingState } from "@/app/providers";

// Clés de cache pour les détails de commande
const CACHE_KEYS = {
  ORDER_DETAILS: 'client_order_details_',
  ORDER_TIMESTAMP: 'client_order_timestamp_'
};

// Types pour la commande
interface OrderDetail {
  id: string;
  created_at: string;
  updated_at: string;
  client_id: string;
  freelance_id: string;
  service_id: string;
  status: 'pending' | 'in_progress' | 'completed' | 'delivered' | 'revision_requested' | 'cancelled';
  price: number;
  delivery_time: number;
  requirements: string | null;
  completed_at: string | null;
  dispute_id?: string | null;
  delivery: {
    files?: string[];
    message?: string;
    date?: string;
  } | null;
  service: {
    title: string;
    description: string;
    images?: string[];
  };
  freelance: {
    full_name: string;
    avatar_url: string | null;
    username: string;
  };
}

// Fonctions utilitaires
const getStatusBadgeClasses = (status: OrderDetail['status']) => {
  const baseClasses = "text-[10px] sm:text-xs border";
  
  switch(status) {
    case 'in_progress':
      return cn(baseClasses, "bg-blue-700/10 text-blue-700 border-blue-700/20");
    case 'completed':
      return cn(baseClasses, "bg-green-700/10 text-green-700 border-green-700/20");
    case 'delivered':
      return cn(baseClasses, "bg-vynal-accent-primary/10 text-vynal-accent-primary border-vynal-accent-primary/20");
    case 'pending':
      return cn(baseClasses, "bg-yellow-700/10 text-yellow-700 border-yellow-700/20");
    case 'revision_requested':
      return cn(baseClasses, "bg-orange-700/10 text-orange-700 border-orange-700/20");
    case 'cancelled':
      return cn(baseClasses, "bg-red-700/10 text-red-700 border-red-700/20");
    default:
      return baseClasses;
  }
};

const getStatusText = (status: OrderDetail['status']) => {
  switch(status) {
    case 'pending':
      return "En attente";
    case 'in_progress':
      return "En cours";
    case 'completed':
      return "Terminée";
    case 'delivered':
      return "Livrée";
    case 'revision_requested':
      return "Révision demandée";
    case 'cancelled':
      return "Annulée";
    default:
      return status;
  }
};

const getProgressPercentage = (status: OrderDetail['status']) => {
  switch(status) {
    case 'pending':
      return 10;
    case 'in_progress':
      return 40;
    case 'revision_requested':
      return 60;
    case 'delivered':
      return 80;
    case 'completed':
      return 100;
    case 'cancelled':
      return 100;
    default:
      return 0;
  }
};

const getProgressBarColor = (status: OrderDetail['status']) => {
  switch(status) {
    case 'pending':
      return "bg-gradient-to-r from-amber-400 to-amber-500";
    case 'in_progress':
      return "bg-gradient-to-r from-blue-400 to-blue-500"; 
    case 'completed':
      return "bg-gradient-to-r from-emerald-400 to-emerald-500";
    case 'delivered':
      return "bg-gradient-to-r from-vynal-accent-primary to-vynal-accent-secondary";
    case 'revision_requested':
      return "bg-gradient-to-r from-amber-400 to-amber-500";
    case 'cancelled':
      return "bg-gradient-to-r from-gray-400 to-gray-500";
    default:
      return "bg-gradient-to-r from-slate-400 to-slate-500";
  }
};

const getFileName = (fileUrl: string) => {
  try {
    const url = new URL(fileUrl);
    const pathSegments = url.pathname.split('/');
    return pathSegments[pathSegments.length - 1];
  } catch {
    // Si l'URL n'est pas valide, renvoyer la chaîne originale
    const segments = fileUrl.split('/');
    return segments[segments.length - 1];
  }
};

export default function OrderDetailPage() {
  const params = useParams();
  const orderId = params?.id as string;
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [disputeDialogOpen, setDisputeDialogOpen] = useState(false);
  const [disputeReason, setDisputeReason] = useState("");
  const [disputeSuccessDialogOpen, setDisputeSuccessDialogOpen] = useState(false);
  const [createdDisputeId, setCreatedDisputeId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [revisionDialogOpen, setRevisionDialogOpen] = useState(false);
  const [revisionMessage, setRevisionMessage] = useState("");
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState<number | null>(null);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [cancelConfirmDialogOpen, setCancelConfirmDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const isFetchingRef = useRef(false);
  const initialLoadRef = useRef(true);
  
  // Classes de style unifiées pour une UI cohérente
  const mainCardClasses = "bg-white/30 dark:bg-slate-900/30 backdrop-blur-sm border border-slate-200/30 dark:border-slate-700/30 shadow-sm rounded-lg transition-all duration-200";
  const secondaryCardClasses = "bg-white/20 dark:bg-slate-900/20 backdrop-blur-sm border border-slate-200/20 dark:border-slate-700/20 shadow-none rounded-lg transition-all duration-200";
  const innerCardClasses = "bg-white/25 dark:bg-slate-800/25 backdrop-blur-sm border border-slate-200/15 dark:border-slate-700/15";
  
  // Classes de style pour les textes
  const titleClasses = "text-slate-800 dark:text-vynal-text-primary";
  const subtitleClasses = "text-slate-600 dark:text-vynal-text-secondary";
  
  // Formattage de la description avec préservation des sauts de ligne et sections
  const formatDescription = useCallback((description: string) => {
    if (!description) return "Aucune description disponible";
    
    try {
      // Définir les sections principales avec leurs emojis
      const mainSections = [
        "📝 Description du service",
        "🎯 Ce que vous obtiendrez",
        "🛠️ Ce dont j'ai besoin de vous",
        "⏱️ Délais et révisions",
        "❌ Ce qui n'est pas inclus"
      ];

      // Diviser le texte en sections
      const sections = description.split('\n\n');
      let currentSection = "";
      let currentContent = "";
      const formattedSections = [];

      for (const section of sections) {
        const lines = section.split('\n');
        const title = lines[0];
        const content = lines.slice(1).join('\n');

        // Si c'est une section principale
        if (mainSections.some(mainSection => title.includes(mainSection))) {
          // Si on avait une section précédente, l'ajouter
          if (currentSection) {
            formattedSections.push(
              <div key={currentSection} className="mb-4">
                <h4 className={`text-xs sm:text-sm font-medium mb-2 ${titleClasses}`}>{currentSection}</h4>
                <div className={`text-[8px] sm:text-xs ${subtitleClasses} whitespace-pre-wrap`}>{currentContent}</div>
              </div>
            );
          }
          currentSection = title;
          currentContent = content;
        } else {
          // Si ce n'est pas une section principale, l'ajouter au contenu actuel
          currentContent += (currentContent ? '\n\n' : '') + section;
        }
      }

      // Ajouter la dernière section
      if (currentSection) {
        formattedSections.push(
          <div key={currentSection} className="mb-4">
            <h4 className={`text-xs sm:text-sm font-medium mb-2 ${titleClasses}`}>{currentSection}</h4>
            <div className={`text-[8px] sm:text-xs ${subtitleClasses} whitespace-pre-wrap`}>{currentContent}</div>
          </div>
        );
      }

      // Retourner les sections avec des séparateurs
      return formattedSections.map((section, index) => (
        <Fragment key={index}>
          {section}
          {index < formattedSections.length - 1 && (
            <div className="h-[1px] bg-gradient-to-r from-transparent via-slate-300 dark:via-slate-700 to-transparent my-3" />
          )}
        </Fragment>
      ));
    } catch {
      return description;
    }
  }, [titleClasses, subtitleClasses]);

  // Récupération de la commande avec cache
  const fetchOrder = useCallback(async (forceRefresh = false) => {
    if (!user || !orderId) return;
    
    // Éviter les requêtes multiples ou pendant la navigation
    if (isFetchingRef.current || (NavigationLoadingState.isNavigating && !forceRefresh)) return;
    
    isFetchingRef.current = true;
    
    // Ne pas modifier l'état loading si c'est le chargement initial
    if (initialLoadRef.current) {
      initialLoadRef.current = false;
    } else if (!order) {
      setLoading(true);
    }

    try {
      // Vérifier d'abord le cache si ce n'est pas un forceRefresh
      const cacheKey = `${CACHE_KEYS.ORDER_DETAILS}${user.id}_${orderId}`;
      const timestampKey = `${CACHE_KEYS.ORDER_TIMESTAMP}${user.id}_${orderId}`;
      
      if (!forceRefresh) {
        const cachedOrder = getCachedData<OrderDetail>(cacheKey);
        const cachedTimestamp = getCachedData<number>(timestampKey);
        
        if (cachedOrder && cachedTimestamp) {
          // Utiliser les données en cache si elles existent et sont récentes (moins de 2 minutes)
          const isCacheValid = Date.now() - cachedTimestamp < 2 * 60 * 1000;
          
          if (isCacheValid) {
            console.log("Utilisation du cache pour les détails de la commande");
            setOrder(cachedOrder);
            setLoading(false);
            isFetchingRef.current = false;
            return;
          }
        }
      }

      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          service:services(*),
          freelance:profiles!freelance_id(*)
        `)
        .eq('id', orderId)
        .eq('client_id', user.id)
        .single();

      if (error) throw error;

      // Mettre à jour l'état et le cache
      setOrder(data);
      
      // Mettre en cache les résultats pour les futures visites
      setCachedData(cacheKey, data, {
        expiry: CACHE_EXPIRY.DASHBOARD_DATA
      });
      setCachedData(timestampKey, Date.now(), {
        expiry: CACHE_EXPIRY.DASHBOARD_DATA
      });
      
    } catch (error) {
      console.error("Erreur lors du chargement de la commande:", error);
      setError("Impossible de charger les détails de la commande.");
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [user, orderId, order]);

  // Accepter une livraison
  const handleAcceptDelivery = async () => {
    if (!order || !user) return;
    
    setSubmitting(true);
    setError(null);
    
    try {
      // Appeler l'API pour compléter la commande et transférer les fonds
      const response = await fetch('/api/orders/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderId: order.id }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l\'acceptation de la livraison');
      }
      
      // Mise à jour optimiste de l'interface utilisateur
      const updatedOrder: OrderDetail = { 
        ...order, 
        status: 'completed' as const, 
        completed_at: new Date().toISOString() 
      };
      
      setSuccess("Livraison acceptée avec succès!");
      setOrder(updatedOrder);
      
      // Mise à jour du cache pour éviter une requête réseau inutile
      const cacheKey = `${CACHE_KEYS.ORDER_DETAILS}${user.id}_${order.id}`;
      const timestampKey = `${CACHE_KEYS.ORDER_TIMESTAMP}${user.id}_${order.id}`;
      
      setCachedData(cacheKey, updatedOrder, {
        expiry: CACHE_EXPIRY.DASHBOARD_DATA
      });
      setCachedData(timestampKey, Date.now(), {
        expiry: CACHE_EXPIRY.DASHBOARD_DATA
      });
      
      // Notification au freelance
      await supabase.from('notifications').insert({
        user_id: order.freelance_id,
        type: 'order_completed',
        content: `Le client a accepté la livraison de la commande "${order.service.title}"`,
        data: { 
          order_id: order.id,
          message: "La commande a été marquée comme terminée avec succès."
        }
      });
      
      // Notification à l'admin
      await supabase.from('admin_notifications').insert({
        type: 'order_completed',
        content: `Commande #${order.id} terminée avec succès`,
        data: { 
          order_id: order.id,
          client_id: user.id,
          freelance_id: order.freelance_id,
          service_title: order.service.title
        }
      });
      
      // Émettre un événement pour invalider le cache des listes de commandes
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('vynal:orders-updated'));
      }
      
    } catch (error) {
      console.error("Erreur lors de l'acceptation de la livraison:", error);
      setError(error instanceof Error ? error.message : "Une erreur est survenue.");
    } finally {
      setSubmitting(false);
    }
  };
  
  // Demander une révision
  const handleRequestRevision = async () => {
    if (!order || !user || !revisionMessage.trim()) return;
    
    setSubmitting(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('orders')
        .update({
          status: 'revision_requested',
          updated_at: new Date().toISOString()
        })
        .eq('id', order.id)
        .eq('client_id', user.id)
        .select()
        .single();
      
      if (error) throw error;
      
      // Enregistrer le message de révision
      await supabase.from('order_messages').insert({
        order_id: order.id,
        sender_id: user.id,
        content: revisionMessage,
        type: 'revision_request',
        created_at: new Date().toISOString()
      });
      
      setSuccess("Révision demandée avec succès!");
      setRevisionDialogOpen(false);
      
      // Mise à jour optimiste de l'interface utilisateur
      const updatedOrder: OrderDetail = { 
        ...order, 
        status: 'revision_requested' as const 
      };
      setOrder(updatedOrder);
      
      // Mise à jour du cache pour éviter une requête réseau inutile
      const cacheKey = `${CACHE_KEYS.ORDER_DETAILS}${user.id}_${order.id}`;
      const timestampKey = `${CACHE_KEYS.ORDER_TIMESTAMP}${user.id}_${order.id}`;
      
      setCachedData(cacheKey, updatedOrder, {
        expiry: CACHE_EXPIRY.DASHBOARD_DATA
      });
      setCachedData(timestampKey, Date.now(), {
        expiry: CACHE_EXPIRY.DASHBOARD_DATA
      });
      
      // Notification au freelance
      await supabase.from('notifications').insert({
        user_id: order.freelance_id,
        type: 'revision_requested',
        content: `Le client a demandé une révision pour la commande "${order.service.title}"`,
        data: { 
          order_id: order.id,
          message: revisionMessage
        }
      });
      
      // Émettre un événement pour invalider le cache des listes de commandes
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('vynal:orders-updated'));
      }
      
    } catch (error) {
      console.error("Erreur lors de la demande de révision:", error);
      setError("Impossible de demander une révision. Veuillez réessayer.");
    } finally {
      setSubmitting(false);
      setRevisionMessage("");
    }
  };
  
  // Annuler une commande
  const handleCancelOrder = async () => {
    if (!order || !user || !cancelReason.trim()) return;
    
    setSubmitting(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('orders')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', order.id)
        .eq('client_id', user.id)
        .select()
        .single();
      
      if (error) throw error;
      
      setSuccess("Commande annulée avec succès!");
      setCancelDialogOpen(false);
      setCancelConfirmDialogOpen(false);
      
      // Mise à jour optimiste de l'interface utilisateur
      const updatedOrder: OrderDetail = { 
        ...order, 
        status: 'cancelled' as const 
      };
      setOrder(updatedOrder);
      
      // Mise à jour du cache pour éviter une requête réseau inutile
      const cacheKey = `${CACHE_KEYS.ORDER_DETAILS}${user.id}_${order.id}`;
      const timestampKey = `${CACHE_KEYS.ORDER_TIMESTAMP}${user.id}_${order.id}`;
      
      setCachedData(cacheKey, updatedOrder, {
        expiry: CACHE_EXPIRY.DASHBOARD_DATA
      });
      setCachedData(timestampKey, Date.now(), {
        expiry: CACHE_EXPIRY.DASHBOARD_DATA
      });
      
      // Notification au freelance
      await supabase.from('notifications').insert({
        user_id: order.freelance_id,
        type: 'order_cancelled',
        content: `Le client a annulé la commande "${order.service.title}"`,
        data: { 
          order_id: order.id,
          reason: cancelReason
        }
      });
      
      // Notification à l'admin
      await supabase.from('admin_notifications').insert({
        type: 'order_cancelled',
        content: `Commande #${order.id} annulée par le client`,
        data: { 
          order_id: order.id,
          client_id: user.id,
          freelance_id: order.freelance_id,
          reason: cancelReason,
          service_title: order.service.title
        }
      });
      
      // Enregistrer le message d'annulation
      await supabase.from('order_messages').insert({
        order_id: order.id,
        sender_id: user.id,
        content: `Commande annulée. Raison: ${cancelReason}`,
        type: 'system',
        created_at: new Date().toISOString()
      });
      
      // Émettre un événement pour invalider le cache des listes de commandes
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('vynal:orders-updated'));
      }
      
    } catch (error) {
      console.error("Erreur lors de l'annulation de la commande:", error);
      setError("Impossible d'annuler la commande. Veuillez réessayer.");
    } finally {
      setSubmitting(false);
      setCancelReason("");
    }
  };
  
  // Ouvrir un litige
  const handleOpenDispute = async () => {
    if (!order || !user || !disputeReason.trim()) return;
    
    setSubmitting(true);
    setError(null);
    
    try {
      // 1. Créer le litige
      const { data: dispute, error: disputeError } = await supabase
        .from('disputes')
        .insert({
          order_id: order.id,
          initiator_id: user.id,
          respondent_id: order.freelance_id,
          reason: disputeReason,
          status: 'open',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (disputeError) throw disputeError;
      
      // 2. Mettre à jour la commande avec l'ID du litige
      const { data: updatedOrderData, error: orderError } = await supabase
        .from('orders')
        .update({
          dispute_id: dispute.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', order.id)
        .eq('client_id', user.id)
        .select()
        .single();
      
      if (orderError) throw orderError;
      
      // Mise à jour optimiste de l'interface utilisateur
      const updatedOrder: OrderDetail = { 
        ...order, 
        dispute_id: dispute.id 
      };
      
      setSuccess("Litige ouvert avec succès! Un administrateur va examiner votre demande.");
      setOrder(updatedOrder);
      setDisputeDialogOpen(false);
      setDisputeSuccessDialogOpen(true);
      setCreatedDisputeId(dispute.id);
      
      // Mise à jour du cache pour éviter une requête réseau inutile
      const cacheKey = `${CACHE_KEYS.ORDER_DETAILS}${user.id}_${order.id}`;
      const timestampKey = `${CACHE_KEYS.ORDER_TIMESTAMP}${user.id}_${order.id}`;
      
      setCachedData(cacheKey, updatedOrder, {
        expiry: CACHE_EXPIRY.DASHBOARD_DATA
      });
      setCachedData(timestampKey, Date.now(), {
        expiry: CACHE_EXPIRY.DASHBOARD_DATA
      });
      
      // Notification au freelance
      await supabase.from('notifications').insert({
        user_id: order.freelance_id,
        type: 'dispute_opened',
        content: `Le client a ouvert un litige pour la commande "${order.service.title}"`,
        data: { 
          order_id: order.id,
          dispute_id: dispute.id,
          reason: disputeReason
        }
      });
      
      // Notification à l'admin
      await supabase.from('admin_notifications').insert({
        type: 'dispute_opened',
        content: `Nouveau litige créé pour la commande #${order.id}`,
        data: { 
          order_id: order.id,
          dispute_id: dispute.id,
          client_id: user.id,
          freelance_id: order.freelance_id,
          reason: disputeReason,
          service_title: order.service.title
        }
      });
      
      // Enregistrer le message d'ouverture de litige
      await supabase.from('order_messages').insert({
        order_id: order.id,
        sender_id: user.id,
        content: `Un litige a été ouvert. Raison: ${disputeReason}`,
        type: 'dispute',
        created_at: new Date().toISOString()
      });
      
      // Émettre un événement pour invalider le cache des litiges et des commandes
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('vynal:disputes-updated'));
        window.dispatchEvent(new CustomEvent('vynal:orders-updated'));
      }
      
    } catch (error) {
      console.error("Erreur lors de l'ouverture du litige:", error);
      setError("Impossible d'ouvrir un litige. Veuillez réessayer.");
    } finally {
      setSubmitting(false);
      setDisputeReason("");
    }
  };

  const handleViewDispute = () => {
    if (createdDisputeId) {
      router.push(`/client-dashboard/disputes/${createdDisputeId}`);
    }
  };

  // Soumettre un feedback
  const handleSubmitFeedback = async () => {
    if (!order || !user || !feedbackRating) return;
    
    setSubmitting(true);
    setError(null);
    
    try {
      // Créer l'avis
      const { error } = await supabase
        .from('reviews')
        .insert({
          order_id: order.id,
          client_id: user.id,
          freelance_id: order.freelance_id,
          rating: feedbackRating,
          comment: feedbackComment.trim(),
          service_id: order.service_id
        });
      
      if (error) throw error;
      
      setSuccess("Merci pour votre avis!");
      setFeedbackDialogOpen(false);
      setFeedbackRating(null);
      setFeedbackComment("");
      
      // Notification au freelance
      await supabase.from('notifications').insert({
        user_id: order.freelance_id,
        type: 'new_review',
        content: `Vous avez reçu un nouvel avis pour la commande "${order.service.title}"`,
        data: { 
          order_id: order.id,
          rating: feedbackRating
        }
      });
      
    } catch (error) {
      console.error("Erreur lors de la soumission de l'avis:", error);
      setError("Impossible de soumettre votre avis. Veuillez réessayer.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleContactFreelance = async () => {
    if (!order || !user) return;
    
    try {
      // Vérifier le rôle de l'utilisateur
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;
      if (profile.role !== 'client') {
        throw new Error('Vous devez être un client pour créer une conversation');
      }

      // Vérifier si une conversation existe déjà entre les deux participants
      const { data: existingConversations, error: convError } = await supabase
        .from('conversation_participants')
        .select(`
          conversation_id,
          conversation:conversations!inner(
            id,
            status
          )
        `)
        .in('participant_id', [user.id, order.freelance_id])
        .eq('conversation.status', 'active');

      if (convError) throw convError;

      // Trouver une conversation où les deux participants sont présents
      const conversationCounts = existingConversations?.reduce((acc, curr) => {
        acc[curr.conversation_id] = (acc[curr.conversation_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const existingConversationId = Object.entries(conversationCounts || {})
        .find(([_, count]) => count === 2)?.[0];

      if (existingConversationId) {
        // Si la conversation existe, rediriger vers celle-ci
        router.push(`/client-dashboard/messages?conversationId=${existingConversationId}`);
        return;
      }

      // Créer une nouvelle conversation
      const { data: newConversation, error: newConvError } = await supabase
        .from('conversations')
        .insert({
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (newConvError) throw newConvError;

      // Ajouter les participants
      const { error: participantError } = await supabase
        .from('conversation_participants')
        .insert([
          {
            conversation_id: newConversation.id,
            participant_id: user.id,
            created_at: new Date().toISOString(),
            unread_count: 0
          },
          {
            conversation_id: newConversation.id,
            participant_id: order.freelance_id,
            created_at: new Date().toISOString(),
            unread_count: 0
          }
        ]);

      if (participantError) throw participantError;

      // Rediriger vers la nouvelle conversation
      router.push(`/client-dashboard/messages?conversationId=${newConversation.id}`);
    } catch (error) {
      console.error("Erreur lors de la création de la conversation:", error);
      setError("Impossible de créer la conversation. Veuillez réessayer.");
    }
  };

  // Écouter les événements d'invalidation du cache
  useEffect(() => {
    if (typeof window === 'undefined' || !user) return;
    
    const handleCacheInvalidation = () => {
      if (user && !NavigationLoadingState.isNavigating) {
        // Recharger les données si le cache est invalidé et qu'on n'est pas en navigation
        fetchOrder(true);
      }
    };
    
    window.addEventListener('vynal:client-cache-invalidated', handleCacheInvalidation);
    window.addEventListener('vynal:orders-updated', handleCacheInvalidation);
    window.addEventListener('vynal:navigation-end', () => {
      // Vérifier si nous devons recharger après la navigation
      if (user && !isFetchingRef.current) {
        fetchOrder(false);
      }
    });
    
    return () => {
      window.removeEventListener('vynal:client-cache-invalidated', handleCacheInvalidation);
      window.removeEventListener('vynal:orders-updated', handleCacheInvalidation);
      window.removeEventListener('vynal:navigation-end', handleCacheInvalidation);
    };
  }, [fetchOrder, user]);

  // Effet pour charger les données au montage
  useEffect(() => {
    if (user && !NavigationLoadingState.isNavigating) {
      fetchOrder(false);
    }
  }, [fetchOrder, user]);

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader className="h-8 w-8 text-vynal-accent-primary" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-6">
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erreur</AlertTitle>
          <AlertDescription>
            {error || "Cette commande n'existe pas ou vous n'avez pas les permissions pour y accéder."}
          </AlertDescription>
        </Alert>
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="text-xs font-medium mb-4"
        >
          <Link href="/client-dashboard/orders">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour aux commandes
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto px-4 py-6">
      {/* En-tête avec retour et statut */}
      <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 mb-6">
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="h-8 w-8 p-0 text-vynal-accent-primary"
          >
            <Link href="/client-dashboard/orders">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Retour</span>
            </Link>
          </Button>
          <div>
            <h1 className={`text-[10px] sm:text-base md:text-lg font-bold ${titleClasses} flex items-center`}>
              <ShoppingBag className="mr-2 h-3 w-3 sm:h-4 sm:w-4 text-vynal-accent-primary" />
              Détails de la commande
            </h1>
            <p className={`text-[8px] sm:text-xs ${subtitleClasses}`}>
              Commande #{order.id.slice(0, 8)} • {formatDistanceToNow(new Date(order.created_at), { addSuffix: true, locale: fr })}
            </p>
          </div>
        </div>
        <Badge 
          variant="outline" 
          className={getStatusBadgeClasses(order.status)}
        >
          {getStatusText(order.status)}
        </Badge>
      </div>

      {/* Alertes de succès/erreur */}
      {success && (
        <Alert className="mb-4 bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800/30">
          <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />
          <AlertTitle className="text-[10px] sm:text-sm">Succès</AlertTitle>
          <AlertDescription className="text-[8px] sm:text-xs">{success}</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4" />
          <AlertTitle className="text-[10px] sm:text-sm">Erreur</AlertTitle>
          <AlertDescription className="text-[8px] sm:text-xs">{error}</AlertDescription>
        </Alert>
      )}

      {/* Carte principale de la commande */}
      <Card className={`${mainCardClasses} mb-6 overflow-hidden`}>
        <div className="w-full h-1.5 bg-gray-100 dark:bg-slate-800/70">
          <div 
            className={`h-full ${getProgressBarColor(order.status)} transition-all duration-500 ease-out`}
            style={{ width: `${getProgressPercentage(order.status)}%` }}
          ></div>
        </div>
        
        <CardHeader className="pb-0">
          <div className="flex items-start gap-3">
            {order.service.images && order.service.images.length > 0 && (
              <Image 
                src={order.service.images[0]} 
                alt={order.service.title}
                width={48}
                height={48}
                className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 rounded-lg object-cover border border-slate-200/30 dark:border-slate-700/30 flex-shrink-0"
              />
            )}
            <div className="flex-1">
              <CardTitle className={`text-[10px] sm:text-base md:text-lg ${titleClasses} mb-1`}>
                {order.service.title}
              </CardTitle>
              <CardContent className="flex items-center text-[8px] sm:text-xs p-0">
                <div className="flex items-center">
                  {order.freelance.avatar_url ? (
                    <Image 
                      src={order.freelance.avatar_url} 
                      alt={order.freelance.full_name || order.freelance.username}
                      width={32}
                      height={32}
                      className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 rounded-full mr-1.5 sm:mr-2 object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 rounded-full mr-1.5 sm:mr-2 bg-slate-200 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
                      <User className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 text-slate-500 dark:text-slate-400" />
                    </div>
                  )}
                  <span className="truncate">Freelance: {order.freelance.full_name || order.freelance.username}</span>
                </div>
              </CardContent>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-3 sm:p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div className={`p-3 rounded-lg ${secondaryCardClasses}`}>
              <div className="flex justify-between items-center mb-2">
                <span className={`text-[8px] sm:text-xs font-medium ${titleClasses}`}>Statut</span>
                <Badge 
                  variant="outline" 
                  className={getStatusBadgeClasses(order.status)}
                >
                  {getStatusText(order.status)}
                </Badge>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className={`text-[8px] sm:text-xs font-medium ${titleClasses}`}>Prix total</span>
                <Badge variant="outline" className="bg-vynal-accent-primary/20 text-vynal-accent-primary border-vynal-accent-primary/30 text-[8px] sm:text-[10px]">
                  <CurrencyDisplay amount={order.price} displayFullName={true} />
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className={`text-[8px] sm:text-xs font-medium ${titleClasses}`}>Délai de livraison</span>
                <Badge variant="outline" className="bg-slate-100/50 text-slate-700 border-slate-200 dark:bg-slate-800/50 dark:text-slate-300 dark:border-slate-700 text-[8px] sm:text-[10px]">
                  {order.delivery_time} {order.delivery_time > 1 ? 'jours' : 'jour'}
                </Badge>
              </div>
            </div>
            
            <div className={`p-3 rounded-lg ${secondaryCardClasses}`}>
              <div className="flex justify-between items-center mb-2">
                <span className={`text-[8px] sm:text-xs font-medium ${titleClasses}`}>Date de commande</span>
                <span className={`text-[8px] sm:text-xs ${subtitleClasses}`}>
                  {format(new Date(order.created_at), 'dd/MM/yyyy à HH:mm', { locale: fr })}
                </span>
              </div>
              {order.status === 'completed' && order.completed_at && (
                <div className="flex justify-between items-center">
                  <span className={`text-[8px] sm:text-xs font-medium ${titleClasses}`}>Date de livraison</span>
                  <span className={`text-[8px] sm:text-xs ${subtitleClasses}`}>
                    {format(new Date(order.completed_at), 'dd/MM/yyyy à HH:mm', { locale: fr })}
                  </span>
                </div>
              )}
            </div>
          </div>
          
          <div className="mb-4">
            <h3 className={`text-[10px] sm:text-sm font-medium mb-2 ${titleClasses}`}>Description du service</h3>
            <div className={`p-3 rounded-lg ${secondaryCardClasses}`}>
              <div className="prose prose-sm max-w-none overflow-hidden break-words">
                {formatDescription(order.service.description)}
              </div>
            </div>
          </div>
          
          {order.requirements && (
            <div className="mb-4">
              <h3 className={`text-[10px] sm:text-sm font-medium mb-2 ${titleClasses}`}>Exigences spécifiées</h3>
              <div className={`p-3 rounded-lg ${secondaryCardClasses} text-[8px] sm:text-xs ${subtitleClasses} whitespace-pre-wrap`}>
                {order.requirements}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contenu de livraison (si disponible) */}
      {order.delivery && (
        <Card className={`${mainCardClasses} mb-6`}>
          <CardHeader className="pb-2">
            <CardTitle className={`text-[10px] sm:text-base ${titleClasses}`}>
              <div className="flex items-center">
                <FileCheck className="mr-2 h-3 w-3 sm:h-4 sm:w-4 text-vynal-accent-primary" />
                Livraison
              </div>
            </CardTitle>
            {order.delivery.date && (
              <CardDescription className="flex items-center text-[8px] sm:text-xs mt-1">
                <Calendar className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1.5" />
                Livré le {format(new Date(order.delivery.date), 'dd/MM/yyyy à HH:mm', { locale: fr })}
              </CardDescription>
            )}
          </CardHeader>
          
          <CardContent className="py-3">
            {order.delivery.message && (
              <div className="mb-4">
                <h3 className={`text-[10px] sm:text-sm font-medium mb-2 ${titleClasses}`}>Message du freelance</h3>
                <div className={`p-3 rounded-lg ${innerCardClasses} text-[8px] sm:text-xs ${subtitleClasses} whitespace-pre-wrap`}>
                  {order.delivery.message}
                </div>
              </div>
            )}
            
            {order.delivery.files && order.delivery.files.length > 0 && (
              <div>
                <h3 className={`text-[10px] sm:text-sm font-medium mb-2 ${titleClasses}`}>Fichiers livrés</h3>
                <div className="space-y-2">
                  {order.delivery.files.map((file, index) => (
                    <div key={index} className={`p-3 rounded-lg ${innerCardClasses} flex items-center justify-between`}>
                      <div className="flex items-center space-x-2">
                        <FileCheck className="h-3 w-3 sm:h-4 sm:w-4 text-vynal-accent-primary" />
                        <span className={`text-[8px] sm:text-xs ${subtitleClasses} truncate max-w-[200px] sm:max-w-[300px]`}>
                          {getFileName(file)}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 sm:h-8 sm:w-8 p-0"
                        asChild
                      >
                        <a href={file} target="_blank" rel="noopener noreferrer">
                          <Download className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span className="sr-only">Télécharger</span>
                        </a>
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
      
      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 sm:justify-center">
        <Button
          onClick={handleAcceptDelivery}
          disabled={submitting || order.status !== 'delivered'}
          className="text-[10px] sm:text-sm h-8 sm:h-10 bg-emerald-500 hover:bg-emerald-600 text-white dark:bg-emerald-500/80 dark:hover:bg-emerald-500/90 disabled:opacity-40 disabled:cursor-not-allowed dark:disabled:opacity-30"
        >
          <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
          Accepter la livraison
        </Button>

        <Button
          onClick={() => setRevisionDialogOpen(true)}
          disabled={!!(
            submitting || 
            order.status !== 'delivered' || 
            order.completed_at !== null || 
            !!order.dispute_id ||
            // Ajout vérification du délai de 3 jours après livraison
            (order.delivery?.date && new Date() > new Date(new Date(order.delivery.date).getTime() + 3 * 24 * 60 * 60 * 1000))
          )}
          title={
            order.status !== 'delivered' ? "Le travail doit être livré pour demander une révision" :
            order.completed_at !== null ? "Commande déjà validée" :
            !!order.dispute_id ? "Un litige est déjà ouvert" :
            (order.delivery?.date && new Date() > new Date(new Date(order.delivery.date).getTime() + 3 * 24 * 60 * 60 * 1000)) ? 
              "Le délai de 3 jours pour demander une révision est expiré" : ""
          }
          variant="outline"
          className="text-[10px] sm:text-sm h-8 sm:h-10 border-blue-500 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/20 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
          Demander une révision
        </Button>

        <DialogRadix.Root open={disputeDialogOpen} onOpenChange={setDisputeDialogOpen}>
          <DialogRadix.Trigger asChild>
            <Button
              disabled={!!(
                // Désactivé si la commande est terminée
                order.status === 'completed' || 
                // Désactivé si un litige est déjà en cours
                !!order.dispute_id ||
                // Désactivé si le freelance n'a pas encore livré un travail
                !(['delivered', 'revision_requested'].includes(order.status)) && 
                // Exception: Activé si le freelance a dépassé le délai de livraison
                !(order.status === 'in_progress' && new Date() > new Date(new Date(order.created_at).getTime() + order.delivery_time * 24 * 60 * 60 * 1000))
              )}
              title={
                order.status === 'completed' ? "Impossible d'ouvrir un litige pour une commande validée" :
                !!order.dispute_id ? "Un litige est déjà en cours pour cette commande" :
                !(['delivered', 'revision_requested'].includes(order.status)) && 
                !(order.status === 'in_progress' && new Date() > new Date(new Date(order.created_at).getTime() + order.delivery_time * 24 * 60 * 60 * 1000)) ?
                "Un litige ne peut être ouvert qu'après la livraison ou si le freelance ne répond plus" : ""
              }
              variant="outline"
              className="text-[10px] sm:text-sm h-8 sm:h-10 border-amber-500 text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ShieldAlert className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
              Ouvrir un litige
            </Button>
          </DialogRadix.Trigger>
          <DialogRadix.Portal>
            <DialogRadix.Overlay className="fixed inset-0 bg-black/50 z-50" />
            <DialogRadix.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-slate-900 rounded-lg p-4 w-full max-w-[425px] mx-4 z-50">
              <DialogRadix.Title className="text-[12px] sm:text-sm md:text-base font-semibold mb-2">
                Ouvrir un litige
              </DialogRadix.Title>
              <DialogRadix.Description className="text-[10px] sm:text-xs md:text-sm text-slate-600 dark:text-slate-400 mb-4">
                Veuillez expliquer la raison de votre litige. Notre équipe examinera votre demande.
              </DialogRadix.Description>
              <Textarea
                placeholder="Raison du litige..."
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                className="text-[10px] sm:text-xs md:text-sm min-h-[100px] mb-4"
              />
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setDisputeDialogOpen(false)}
                  className="text-[10px] sm:text-xs md:text-sm"
                >
                  Annuler
                </Button>
                <Button
                  onClick={handleOpenDispute}
                  disabled={!disputeReason.trim() || submitting}
                  className="text-[10px] sm:text-xs md:text-sm bg-amber-500 hover:bg-amber-600 text-white"
                >
                  Soumettre le litige
                </Button>
              </div>
            </DialogRadix.Content>
          </DialogRadix.Portal>
        </DialogRadix.Root>

        {/* Bouton d'annulation - toujours visible mais désactivé selon les règles métier */}
        <DialogRadix.Root open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
          <DialogRadix.Trigger asChild>
            <Button
              variant="outline"
              className="text-[10px] sm:text-sm h-8 sm:h-10 border-red-500 text-red-500 hover:bg-red-100 dark:hover:bg-red-950/20"
              disabled={
                !((order.status === 'pending') || 
                (order.status === 'in_progress' && new Date() > new Date(new Date(order.created_at).getTime() + order.delivery_time * 24 * 60 * 60 * 1000))) ||
                !!order.dispute_id ||
                (['revision_requested', 'delivered', 'completed', 'cancelled'] as OrderDetail['status'][]).includes(order.status)
              }
              title={
                order.dispute_id ? "Impossible d'annuler car un litige est déjà ouvert" :
                order.status === 'revision_requested' ? "Impossible d'annuler pendant une révision" :
                ['delivered', 'completed'].includes(order.status) ? "Impossible d'annuler une commande livrée" :
                order.status === 'cancelled' ? "Cette commande est déjà annulée" :
                !((order.status === 'pending') || 
                (order.status === 'in_progress' && new Date() > new Date(new Date(order.created_at).getTime() + order.delivery_time * 24 * 60 * 60 * 1000))) ?
                "Vous pouvez annuler uniquement si la commande est en attente ou si le délai est dépassé" : ""
              }
            >
              <X className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
              Annuler la commande
            </Button>
          </DialogRadix.Trigger>
          <DialogRadix.Portal>
            <DialogRadix.Overlay className="fixed inset-0 bg-black/50 z-50" />
            <DialogRadix.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-slate-900 rounded-lg p-4 w-full max-w-[425px] mx-4 z-50">
              <DialogRadix.Title className="text-[12px] sm:text-sm md:text-base font-semibold mb-2">
                Annuler la commande
              </DialogRadix.Title>
              <DialogRadix.Description className="text-[10px] sm:text-xs md:text-sm text-slate-600 dark:text-slate-400 mb-4">
                Veuillez indiquer la raison de l'annulation de votre commande.
              </DialogRadix.Description>
              <Textarea
                placeholder="Raison de l'annulation..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="text-[10px] sm:text-xs md:text-sm min-h-[100px] mb-4"
              />
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setCancelDialogOpen(false);
                    setCancelReason("");
                  }}
                  className="text-[10px] sm:text-xs md:text-sm"
                >
                  Annuler
                </Button>
                <Button
                  onClick={() => {
                    setCancelDialogOpen(false);
                    setCancelConfirmDialogOpen(true);
                  }}
                  disabled={!cancelReason.trim()}
                  className="text-[10px] sm:text-xs md:text-sm bg-red-500 hover:bg-red-600 text-white"
                >
                  Continuer
                </Button>
              </div>
            </DialogRadix.Content>
          </DialogRadix.Portal>
        </DialogRadix.Root>

        <Button
          variant="outline"
          size="sm"
          onClick={handleContactFreelance}
          className="text-[10px] sm:text-sm h-8 sm:h-10"
        >
          <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
          Contacter le freelance
        </Button>
      </div>
      
      {/* Dialog de confirmation d'annulation */}
      <DialogRadix.Root open={cancelConfirmDialogOpen} onOpenChange={setCancelConfirmDialogOpen}>
        <DialogRadix.Portal>
          <DialogRadix.Overlay className="fixed inset-0 bg-black/50 z-50" />
          <DialogRadix.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-slate-900 rounded-lg p-4 w-full max-w-[425px] mx-4 z-50">
            <DialogRadix.Title className="text-[12px] sm:text-sm md:text-base font-semibold mb-2">
              Confirmer l'annulation
            </DialogRadix.Title>
            <DialogRadix.Description className="text-[10px] sm:text-xs md:text-sm text-slate-600 dark:text-slate-400 mb-4">
              Êtes-vous sûr de vouloir annuler cette commande ? Cette action est irréversible.
            </DialogRadix.Description>
            <div className="p-3 rounded-lg bg-white/25 dark:bg-slate-800/25 mb-4">
              <p className="font-medium mb-2">Raison de l'annulation :</p>
              <p className="whitespace-pre-wrap">{cancelReason}</p>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setCancelConfirmDialogOpen(false);
                  setCancelDialogOpen(true);
                }}
                className="text-[10px] sm:text-xs md:text-sm border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Retour
              </Button>
              <Button
                onClick={handleCancelOrder}
                disabled={submitting}
                className="text-[10px] sm:text-xs md:text-sm bg-red-500 hover:bg-red-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Confirmer l'annulation
              </Button>
            </DialogFooter>
          </DialogRadix.Content>
        </DialogRadix.Portal>
      </DialogRadix.Root>
      
      {/* Dialog de succès du litige */}
      <Dialog open={disputeSuccessDialogOpen} onOpenChange={setDisputeSuccessDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50">
          <DialogHeader>
            <DialogTitle className="text-[12px] sm:text-sm md:text-base font-semibold text-slate-900 dark:text-slate-50">Litige créé avec succès</DialogTitle>
            <DialogDescription className="text-[10px] sm:text-xs md:text-sm text-slate-600 dark:text-slate-400">
              Votre litige a été créé et sera examiné par notre équipe. Vous pouvez suivre son évolution dans votre espace litiges.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDisputeSuccessDialogOpen(false)}
              className="text-[10px] sm:text-xs md:text-sm border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Fermer
            </Button>
            <Button
              onClick={handleViewDispute}
              className="text-[10px] sm:text-xs md:text-sm bg-vynal-accent-primary hover:bg-vynal-accent-primary/90 text-white"
            >
              Voir le litige
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de révision */}
      <DialogRadix.Root open={revisionDialogOpen} onOpenChange={setRevisionDialogOpen}>
        <DialogRadix.Portal>
          <DialogRadix.Overlay className="fixed inset-0 bg-black/50 z-50" />
          <DialogRadix.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-slate-900 rounded-lg p-4 w-full max-w-[425px] mx-4 z-50">
            <DialogRadix.Title className="text-[12px] sm:text-sm md:text-base font-semibold mb-2">
              Demander une révision
            </DialogRadix.Title>
            <DialogRadix.Description className="text-[10px] sm:text-xs md:text-sm text-slate-600 dark:text-slate-400 mb-4">
              Veuillez expliquer en détail les modifications que vous souhaitez apporter à la livraison.
            </DialogRadix.Description>
            <Textarea
              placeholder="Détaillez les modifications souhaitées..."
              value={revisionMessage}
              onChange={(e) => setRevisionMessage(e.target.value)}
              className="text-[10px] sm:text-xs md:text-sm min-h-[100px] mb-4"
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setRevisionDialogOpen(false)}
                className="text-[10px] sm:text-xs md:text-sm"
              >
                Annuler
              </Button>
              <Button
                onClick={handleRequestRevision}
                disabled={!revisionMessage.trim() || submitting}
                className="text-[10px] sm:text-xs md:text-sm bg-blue-500 hover:bg-blue-600 text-white"
              >
                Envoyer la demande
              </Button>
            </div>
          </DialogRadix.Content>
        </DialogRadix.Portal>
      </DialogRadix.Root>

      {/* Dialog de feedback */}
      <DialogRadix.Root open={feedbackDialogOpen} onOpenChange={setFeedbackDialogOpen}>
        <DialogRadix.Portal>
          <DialogRadix.Overlay className="fixed inset-0 bg-black/50 z-50" />
          <DialogRadix.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-slate-900 rounded-lg p-4 w-full max-w-[425px] mx-4 z-50">
            <DialogRadix.Title className="text-[12px] sm:text-sm md:text-base font-semibold mb-2">
              Donnez votre avis
            </DialogRadix.Title>
            <DialogRadix.Description className="text-[10px] sm:text-xs md:text-sm text-slate-600 dark:text-slate-400 mb-4">
              Partagez votre expérience avec le freelance pour aider la communauté.
            </DialogRadix.Description>
            <div className="space-y-4">
              <div className="flex justify-center space-x-2">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    onClick={() => setFeedbackRating(rating)}
                    className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-colors
                      ${feedbackRating === rating 
                        ? 'bg-vynal-accent-primary text-white' 
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                  >
                    {rating}
                  </button>
                ))}
              </div>
              <Textarea
                placeholder="Partagez votre expérience (optionnel)..."
                value={feedbackComment}
                onChange={(e) => setFeedbackComment(e.target.value)}
                className="text-[10px] sm:text-xs md:text-sm min-h-[100px]"
              />
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setFeedbackDialogOpen(false);
                  setFeedbackRating(null);
                  setFeedbackComment("");
                }}
                className="text-[10px] sm:text-xs md:text-sm"
              >
                Plus tard
              </Button>
              <Button
                onClick={handleSubmitFeedback}
                disabled={!feedbackRating || submitting}
                className="text-[10px] sm:text-xs md:text-sm bg-vynal-accent-primary hover:bg-vynal-accent-primary/90 text-white"
              >
                Envoyer l'avis
              </Button>
            </div>
          </DialogRadix.Content>
        </DialogRadix.Portal>
      </DialogRadix.Root>
    </div>
  );
}