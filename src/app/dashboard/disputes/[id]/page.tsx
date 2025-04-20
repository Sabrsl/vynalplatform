"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { getDisputeById, getDisputeMessages, updateDispute, DisputeWithDetails, DisputeMessage as DisputeMessageType } from "@/lib/supabase/disputes";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DisputeMessageList } from "@/components/disputes/DisputeMessageList";
import { DisputeMessageForm } from "@/components/disputes/DisputeMessageForm";
import { useToast } from "@/components/ui/use-toast";
import { AlertTriangle, CheckCircle, XCircle, Loader2, ChevronLeft, Clock, User, ArrowLeftRight } from "lucide-react";
import Link from "next/link";

// Type pour le statut d'une dispute
type DisputeStatus = 'open' | 'resolved' | 'closed';

// Étendre l'interface DisputeWithDetails pour inclure les propriétés de dates
interface DisputeWithTimestamps extends DisputeWithDetails {
  resolved_at?: string;
  closed_at?: string;
}

export default function DisputeDetailPage() {
  const { id } = useParams();
  const disputeId = Array.isArray(id) ? id[0] : id;
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  // SIMULATION: Forcer l'ID utilisateur pour la démo
  const simulatedUser = {
    id: "client-1",
    user_metadata: {
      role: "client"
    }
  };
  
  const [dispute, setDispute] = useState<DisputeWithTimestamps | null>(null);
  const [messages, setMessages] = useState<DisputeMessageType[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  
  // SIMULATION: Force le rôle admin pour la démo (À SUPPRIMER EN PRODUCTION)
  const isAdmin = true; // Simuler le rôle administrateur pour tester les fonctionnalités
  
  const isClient = simulatedUser.id === dispute?.client_id;
  const isFreelance = simulatedUser.id === dispute?.freelance_id;
  // const isAdmin = user?.user_metadata?.role === "admin"; // Ligne originale commentée pour la démo
  const canResolveDispute = isAdmin;
  
  // Charger les détails de la dispute
  useEffect(() => {
    const loadDispute = async () => {
      if (disputeId) {
        setLoading(true);
        try {
          const disputeData = await getDisputeById(disputeId);
          
          // SIMULATION: Désactiver la vérification d'autorisation pour la démo
          if (!disputeData) {
            router.push("/dashboard/disputes");
            toast({
              title: "Dispute introuvable",
              description: "La dispute que vous recherchez n'existe pas.",
              variant: "destructive"
            });
            return;
          }
          
          /* Vérification originale commentée pour la démo
          // Vérifier que l'utilisateur est autorisé à voir cette dispute
          if (!disputeData || (disputeData.client_id !== user.id && disputeData.freelance_id !== user.id && user.user_metadata?.role !== "admin")) {
            router.push("/dashboard/disputes");
            toast({
              title: "Accès non autorisé",
              description: "Vous n'êtes pas autorisé à accéder à cette dispute.",
              variant: "destructive"
            });
            return;
          }
          */
          
          setDispute(disputeData);
        } catch (error) {
          console.error("Error loading dispute:", error);
          toast({
            title: "Erreur",
            description: "Impossible de charger les détails de la dispute.",
            variant: "destructive"
          });
        } finally {
          setLoading(false);
        }
      }
    };
    
    loadDispute();
  }, [disputeId, user?.id, router, toast, user?.user_metadata?.role]);
  
  // Charger les messages de la dispute
  useEffect(() => {
    const loadMessages = async () => {
      if (disputeId) {
        setLoadingMessages(true);
        try {
          const messagesData = await getDisputeMessages(disputeId);
          setMessages(messagesData);
        } catch (error) {
          console.error("Error loading messages:", error);
        } finally {
          setLoadingMessages(false);
        }
      }
    };
    
    loadMessages();
  }, [disputeId]);
  
  // Formater la date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };
  
  // Gérer le changement de statut
  const handleStatusChange = async (newStatus: DisputeStatus) => {
    if (!dispute) return;
    
    setUpdatingStatus(true);
    
    try {
      const now = new Date().toISOString();
      const updateData: any = { status: newStatus };
      
      if (newStatus === 'resolved') {
        updateData.resolved_by = simulatedUser.id;
        updateData.resolved_at = now;
      } else if (newStatus === 'closed') {
        updateData.closed_at = now;
      }
      
      const success = await updateDispute(disputeId, updateData);
      
      if (success) {
        setDispute({ 
          ...dispute, 
          status: newStatus,
          ...(newStatus === 'resolved' ? { resolved_by: simulatedUser.id, resolved_at: now } : {}),
          ...(newStatus === 'closed' ? { closed_at: now } : {})
        });
        
        toast({
          title: "Statut mis à jour",
          description: `Le statut de la dispute a été changé en "${newStatus === 'open' ? 'ouverte' : newStatus === 'resolved' ? 'résolue' : 'fermée'}"`,
        });
      } else {
        toast({
          title: "Erreur",
          description: "Impossible de mettre à jour le statut de la dispute.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error updating status:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la mise à jour du statut.",
        variant: "destructive"
      });
    } finally {
      setUpdatingStatus(false);
    }
  };
  
  // Rafraîchir les messages après l'envoi d'un nouveau message
  const handleMessageSent = async () => {
    if (disputeId) {
      try {
        const messagesData = await getDisputeMessages(disputeId);
        setMessages(messagesData);
      } catch (error) {
        console.error("Error refreshing messages:", error);
      }
    }
  };
  
  // Afficher le badge de statut
  const getStatusBadge = () => {
    if (!dispute) return null;
    
    switch (dispute.status as DisputeStatus) {
      case 'open':
        return (
          <Badge className="bg-white text-amber-600 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800/30">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Ouverte
          </Badge>
        );
      case 'resolved':
        return (
          <Badge className="bg-white text-emerald-600 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800/30">
            <CheckCircle className="h-3 w-3 mr-1" />
            Résolue
          </Badge>
        );
      case 'closed':
        return (
          <Badge className="bg-white text-slate-600 border-slate-200 dark:bg-slate-800/40 dark:text-slate-400 dark:border-slate-700/30">
            <XCircle className="h-3 w-3 mr-1" />
            Fermée
          </Badge>
        );
      default:
        return (
          <Badge className="bg-white text-slate-600 border-slate-200 dark:bg-slate-800/40 dark:text-slate-400 dark:border-slate-700/30">
            {dispute.status}
          </Badge>
        );
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400 dark:text-vynal-text-secondary" />
          <p className="mt-2 text-sm text-slate-500 dark:text-vynal-text-secondary">
            Chargement de la dispute...
          </p>
        </div>
      </div>
    );
  }
  
  if (!dispute) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <div className="mb-4 rounded-full bg-white border border-slate-200 p-3 dark:bg-vynal-purple-secondary/20 dark:border-transparent">
          <AlertTriangle className="h-6 w-6 text-slate-400 dark:text-vynal-text-secondary" />
        </div>
        <h3 className="mb-2 text-xl font-medium text-slate-800 dark:text-vynal-text-primary">
          Dispute introuvable
        </h3>
        <p className="mb-6 max-w-md text-sm text-slate-500 dark:text-vynal-text-secondary">
          La dispute que vous recherchez n'existe pas ou a été supprimée.
        </p>
        
        <Link href="/dashboard/disputes">
          <Button variant="outline" className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 dark:bg-transparent dark:border-vynal-purple-secondary/30 dark:text-vynal-text-primary dark:hover:bg-vynal-purple-secondary/10">
            <ChevronLeft className="mr-1 h-4 w-4" />
            Retour aux disputes
          </Button>
        </Link>
      </div>
    );
  }
  
  return (
    <div>
      <div className="mb-6">
        <Link 
          href="/dashboard/disputes" 
          className="flex items-center text-sm text-slate-600 hover:text-slate-900 dark:text-vynal-text-secondary dark:hover:text-vynal-text-primary"
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          Retour aux disputes
        </Link>
      </div>
      
      <div className="grid gap-6 md:grid-cols-3">
        {/* Informations sur la dispute */}
        <div className="md:col-span-1">
          <Card className="border-slate-200 dark:border-vynal-purple-secondary/20">
            <CardHeader className="pb-2 border-b border-slate-100 dark:border-vynal-purple-secondary/10">
              <CardTitle className="text-base text-slate-800 dark:text-vynal-text-primary">Détails du litige</CardTitle>
              <CardDescription className="text-xs text-slate-500 dark:text-vynal-text-secondary">Informations sur le litige</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm pt-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-600 dark:text-vynal-text-secondary">Statut</span>
                {getStatusBadge()}
              </div>
              
              <div>
                <span className="text-xs font-medium text-slate-600 dark:text-vynal-text-secondary">Identifiant</span>
                <p className="mt-1 text-xs text-slate-500 dark:text-vynal-text-secondary">
                  {dispute.id}
                </p>
              </div>
              
              <div>
                <span className="text-xs font-medium text-slate-600 dark:text-vynal-text-secondary">Date d'ouverture</span>
                <div className="mt-1 flex items-center text-xs text-slate-500 dark:text-vynal-text-secondary">
                  <Clock className="mr-1 h-3 w-3" />
                  {formatDate(dispute.created_at)}
                </div>
              </div>
              
              {dispute.status === 'resolved' && dispute.resolved_at && (
                <div>
                  <span className="text-xs font-medium text-slate-600 dark:text-vynal-text-secondary">Date de résolution</span>
                  <div className="mt-1 flex items-center text-xs text-slate-500 dark:text-vynal-text-secondary">
                    <CheckCircle className="mr-1 h-3 w-3" />
                    {formatDate(dispute.resolved_at)}
                  </div>
                </div>
              )}
              
              {dispute.status === 'closed' && dispute.closed_at && (
                <div>
                  <span className="text-xs font-medium text-slate-600 dark:text-vynal-text-secondary">Date de fermeture</span>
                  <div className="mt-1 flex items-center text-xs text-slate-500 dark:text-vynal-text-secondary">
                    <XCircle className="mr-1 h-3 w-3" />
                    {formatDate(dispute.closed_at)}
                  </div>
                </div>
              )}
              
              <div>
                <span className="text-xs font-medium text-slate-600 dark:text-vynal-text-secondary">Client</span>
                <div className="mt-1 flex items-center text-xs text-slate-500 dark:text-vynal-text-secondary">
                  <User className="mr-1 h-3 w-3" />
                  {dispute.client.full_name || dispute.client.username || 'Client'}
                </div>
              </div>
              
              <div>
                <span className="text-xs font-medium text-slate-600 dark:text-vynal-text-secondary">Prestataire</span>
                <div className="mt-1 flex items-center text-xs text-slate-500 dark:text-vynal-text-secondary">
                  <User className="mr-1 h-3 w-3" />
                  {dispute.freelance.full_name || dispute.freelance.username || 'Prestataire'}
                </div>
              </div>
              
              <div>
                <span className="text-xs font-medium text-slate-600 dark:text-vynal-text-secondary">Commande associée</span>
                <div className="mt-1 text-xs">
                  <Link 
                    href={`/dashboard/orders/${dispute.order_id}`} 
                    className="text-blue-600 hover:text-blue-800 dark:text-vynal-accent-secondary dark:hover:text-vynal-accent-primary"
                  >
                    Voir la commande
                  </Link>
                </div>
              </div>
            </CardContent>
            
            {canResolveDispute && dispute.status !== 'closed' && (
              <CardFooter className="flex-col space-y-2 pt-2 border-t border-slate-100 dark:border-vynal-purple-secondary/10">
                <Button
                  onClick={() => handleStatusChange('resolved')}
                  disabled={updatingStatus || (dispute.status as DisputeStatus) === 'resolved'}
                  className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white dark:from-emerald-600 dark:to-emerald-700 dark:hover:from-emerald-500 dark:hover:to-emerald-600 font-medium"
                  variant={(dispute.status as DisputeStatus) === 'resolved' ? "outline" : "default"}
                >
                  {updatingStatus ? (
                    <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle className="mr-1 h-4 w-4" />
                  )}
                  Marquer comme résolu
                </Button>
                
                <Button
                  onClick={() => handleStatusChange('closed')}
                  disabled={updatingStatus}
                  className="w-full bg-red-50 border-red-400 text-red-600 hover:bg-red-100 hover:text-red-700 dark:border-red-500 dark:text-red-300 dark:bg-transparent dark:hover:bg-red-900/40 dark:hover:text-red-200"
                  variant={(dispute.status as DisputeStatus) === 'closed' ? "outline" : "destructive"}
                >
                  {updatingStatus ? (
                    <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                  ) : (
                    <XCircle className="mr-1 h-4 w-4" />
                  )}
                  Fermer le litige
                </Button>
                
                {(dispute.status as DisputeStatus) !== 'open' && (
                  <Button
                    onClick={() => handleStatusChange('open')}
                    disabled={updatingStatus || (dispute.status as DisputeStatus) === 'open'}
                    className="w-full bg-amber-50 border-amber-400 text-amber-600 hover:bg-amber-100 hover:text-amber-700 dark:border-amber-500 dark:text-amber-300 dark:bg-transparent dark:hover:bg-amber-900/40 dark:hover:text-amber-200"
                    variant="outline"
                  >
                    {updatingStatus ? (
                      <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                    ) : (
                      <ArrowLeftRight className="mr-1 h-4 w-4" />
                    )}
                    Réouvrir le litige
                  </Button>
                )}
              </CardFooter>
            )}
          </Card>
        </div>
        
        {/* Section des messages */}
        <div className="md:col-span-2">
          <Card className="flex flex-col h-full border-slate-200 dark:border-vynal-purple-secondary/20">
            <CardHeader className="pb-2 border-b border-slate-100 dark:border-vynal-purple-secondary/10">
              <CardTitle className="text-base text-slate-800 dark:text-vynal-text-primary">Communication</CardTitle>
              <CardDescription>
                <div className="mt-2 text-xs font-medium text-slate-700 dark:text-vynal-text-primary">
                  Motif du litige:
                </div>
                <p className="text-xs text-slate-600 dark:text-vynal-text-secondary mt-1">
                  {dispute.reason}
                </p>
              </CardDescription>
            </CardHeader>
            
            <div className="flex-1 overflow-hidden">
              {loadingMessages ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="h-6 w-6 animate-spin text-slate-400 dark:text-vynal-text-secondary" />
                </div>
              ) : (
                <DisputeMessageList messages={messages} currentUserId={simulatedUser.id} />
              )}
            </div>
            
            {dispute.status === 'open' && (
              <DisputeMessageForm 
                disputeId={disputeId} 
                userId={simulatedUser.id} 
                onMessageSent={handleMessageSent}
                disabled={dispute.status !== 'open'}
              />
            )}
            
            {dispute.status !== 'open' && (
              <div className="p-4 border-t border-slate-100 dark:border-vynal-purple-secondary/20 text-center">
                <p className="text-xs sm:text-sm text-slate-500 dark:text-vynal-text-secondary">
                  Ce litige est {dispute.status === 'resolved' ? 'résolu' : 'fermé'}. Vous ne pouvez plus ajouter de messages.
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}