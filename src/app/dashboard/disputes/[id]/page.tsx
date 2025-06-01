"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import DisputeMessageList from "@/components/disputes/DisputeMessageList";
import { DisputeMessageForm } from "@/components/disputes/DisputeMessageForm";
import { useDisputeDetail } from "@/hooks/useDisputeDetail";
import { AlertTriangle, CheckCircle, XCircle, Loader2, ChevronLeft, Clock, User, ArrowLeftRight, RefreshCw } from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import Image from 'next/image';

export default function DisputeDetailPage() {
  const params = useParams();
  const disputeId = params?.id as string;
  const router = useRouter();
  
  const [resolutionNote, setResolutionNote] = useState("");
  const [isResolvingDialogOpen, setIsResolvingDialogOpen] = useState(false);
  const [isClosingDialogOpen, setIsClosingDialogOpen] = useState(false);
  
  const {
    dispute,
    messages,
    loading,
    messageLoading,
    error,
    messageError,
    refreshDispute,
    refreshMessages,
    isUpdatingStatus,
    updateDisputeStatus,
    sendMessage,
    isClient,
    isFreelance,
    canResolveDispute,
    getFormattedDate
  } = useDisputeDetail(disputeId, {
    useCache: true,
    autoRefreshMessages: true,
    autoRefreshInterval: 15000 // 15 secondes
  });
  
  // Formater les statuts pour l'affichage
  const getStatusBadge = () => {
    if (!dispute) return null;
    
    switch (dispute.status) {
      case 'open':
        return (
          <Badge className="bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800/30">
            <AlertTriangle className="h-3.5 w-3.5 mr-1.5" />
            En cours
          </Badge>
        );
      case 'resolved':
        return (
          <Badge className="bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800/30">
            <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
            Résolu
          </Badge>
        );
      case 'closed':
        return (
          <Badge className="bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800/40 dark:text-slate-400 dark:border-slate-700/30">
            <XCircle className="h-3.5 w-3.5 mr-1.5" />
            Fermé
          </Badge>
        );
      default:
        return (
          <Badge>
            {dispute.status}
          </Badge>
        );
    }
  };
  
  // Gérer la résolution du litige
  const handleResolveDispute = async () => {
    if (await updateDisputeStatus('resolved', resolutionNote)) {
      setResolutionNote("");
      setIsResolvingDialogOpen(false);
    }
  };
  
  // Gérer la fermeture du litige
  const handleCloseDispute = async () => {
    if (await updateDisputeStatus('closed', resolutionNote)) {
      setResolutionNote("");
      setIsClosingDialogOpen(false);
    }
  };
  
  // Gérer l'envoi d'un message
  const handleSendMessage = async (message: string, attachmentUrl?: string) => {
    try {
      await sendMessage(message, attachmentUrl);
      return true;
    } catch (error) {
      console.error("Error sending message:", error);
      return false;
    }
  };
  
  // Composant pour afficher le skeleton lors du chargement
  const DetailsSkeleton = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-8 w-24" />
      </div>
      <Skeleton className="h-6 w-full" />
      <Skeleton className="h-20 w-full" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    </div>
  );
  
  // Composant pour afficher le skeleton des messages
  const MessagesSkeleton = () => (
    <div className="space-y-4 mt-4">
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-24 w-full" />
    </div>
  );
  
  if (error) {
    return (
      <div className="w-full p-4 space-y-4 max-w-5xl mx-auto">
        <Card className="shadow-sm border-slate-200 dark:border-vynal-purple-secondary/20">
          <CardContent className="p-6">
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
              <h3 className="text-lg font-semibold text-vynal-purple-dark dark:text-vynal-text-primary mb-2">
                Erreur lors du chargement du litige
              </h3>
              <p className="text-vynal-purple-secondary dark:text-vynal-text-secondary max-w-md mb-6">
                {error}
              </p>
              <div className="flex space-x-4">
                <Button onClick={() => refreshDispute()} variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Réessayer
                </Button>
                <Button asChild>
                  <Link href="/dashboard/disputes">
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Retour aux litiges
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="w-full h-full overflow-x-hidden overflow-y-auto scrollbar-hide bg-gray-50/50 dark:bg-transparent">
      <div className="p-2 sm:p-4 space-y-4 sm:space-y-6 pb-8 sm:pb-12 max-w-5xl mx-auto">
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm" className="group h-8 gap-1 text-vynal-purple-secondary dark:text-vynal-text-secondary hover:text-vynal-accent-secondary">
            <Link href="/dashboard/disputes">
              <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
              <span>Retour</span>
            </Link>
          </Button>
          
          <Button 
            onClick={refreshDispute} 
            variant="ghost" 
            size="sm" 
            className="h-8 ml-auto flex gap-1 items-center text-xs text-vynal-purple-secondary hover:text-vynal-accent-secondary dark:text-vynal-text-secondary dark:hover:text-vynal-accent-primary"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isUpdatingStatus ? 'animate-spin' : ''}`} />
            <span>Actualiser</span>
          </Button>
        </div>
        
        <Card className="shadow-sm border border-slate-200 dark:border-vynal-purple-secondary/20">
          <CardHeader className="p-3 sm:p-4 md:p-5 space-y-2.5">
            {loading ? (
              <DetailsSkeleton />
            ) : (
              <>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <CardTitle className="text-xl text-vynal-purple-light dark:text-vynal-text-primary">
                    Détails du litige
                  </CardTitle>
                  {getStatusBadge()}
                </div>
                
                <div className="text-sm text-vynal-purple-secondary dark:text-vynal-text-secondary flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  <span>Ouvert le {getFormattedDate(dispute?.created_at || '')}</span>
                </div>
                
                <CardDescription className="text-base text-vynal-purple-secondary dark:text-vynal-text-secondary font-medium">
                  {dispute?.reason}
                </CardDescription>
                
                {/* Afficher la résolution si résolu */}
                {dispute?.status === 'resolved' && dispute?.resolution && (
                  <div className="mt-2 p-3 bg-green-50 border border-green-100 rounded-md dark:bg-emerald-900/10 dark:border-emerald-800/20">
                    <div className="flex items-center gap-1.5 mb-1 text-emerald-600 dark:text-emerald-400 font-medium text-sm">
                      <CheckCircle className="h-4 w-4" />
                      <span>Résolution du litige</span>
                    </div>
                    <p className="text-sm text-vynal-purple-secondary dark:text-vynal-text-secondary">
                      {dispute.resolution}
                    </p>
                    <div className="text-xs text-vynal-purple-secondary/70 dark:text-vynal-text-secondary/70 mt-1.5">
                      Résolu le {getFormattedDate(dispute.resolved_at || '')}
                    </div>
                  </div>
                )}
                
                {/* Afficher l'explication si fermé */}
                {dispute?.status === 'closed' && dispute?.resolution && (
                  <div className="mt-2 p-3 bg-slate-50 border border-slate-100 rounded-md dark:bg-slate-800/10 dark:border-slate-700/20">
                    <div className="flex items-center gap-1.5 mb-1 text-slate-600 dark:text-slate-400 font-medium text-sm">
                      <XCircle className="h-4 w-4" />
                      <span>Litige fermé</span>
                    </div>
                    <p className="text-sm text-vynal-purple-secondary dark:text-vynal-text-secondary">
                      {dispute.resolution}
                    </p>
                    <div className="text-xs text-vynal-purple-secondary/70 dark:text-vynal-text-secondary/70 mt-1.5">
                      Fermé le {getFormattedDate(dispute.closed_at || '')}
                    </div>
                  </div>
                )}
              </>
            )}
          </CardHeader>
          
          <CardContent className="p-0 border-t border-gray-100 dark:border-vynal-purple-secondary/20">
            {!loading && dispute && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-0.5">
                <div className="p-3 sm:p-4 md:p-5 bg-slate-50/80 dark:bg-vynal-purple-dark/30">
                  <h3 className="text-sm font-medium mb-2 text-slate-700 dark:text-vynal-text-primary flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5" />
                    <span>Client</span>
                  </h3>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-vynal-purple-secondary/30 overflow-hidden">
                      {dispute.client.avatar_url ? (
                        <Image 
                          src={dispute.client.avatar_url} 
                          alt={dispute.client.full_name || dispute.client.username || 'Client'} 
                          className="h-full w-full object-cover"
                          width={40}
                          height={40}
                          loading="lazy"
                          decoding="async"
                          sizes="40px"
                          quality={75}
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-slate-500 dark:text-vynal-text-secondary text-sm font-medium">
                          {(dispute.client.full_name || dispute.client.username || 'C')?.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-vynal-purple-dark dark:text-vynal-text-primary">
                        {dispute.client.full_name || dispute.client.username || 'Client'}
                      </div>
                      <div className="text-xs text-vynal-purple-secondary dark:text-vynal-text-secondary">
                        ID: {dispute.client_id.substring(0, 8)}...
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="p-3 sm:p-4 md:p-5 bg-slate-50/80 dark:bg-vynal-purple-dark/30">
                  <h3 className="text-sm font-medium mb-2 text-slate-700 dark:text-vynal-text-primary flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5" />
                    <span>Prestataire</span>
                  </h3>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-vynal-purple-secondary/30 overflow-hidden">
                      {dispute.freelance.avatar_url ? (
                        <Image 
                          src={dispute.freelance.avatar_url} 
                          alt={dispute.freelance.full_name || dispute.freelance.username || 'Prestataire'} 
                          className="h-full w-full object-cover"
                          width={40}
                          height={40}
                          unoptimized
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-slate-500 dark:text-vynal-text-secondary text-sm font-medium">
                          {(dispute.freelance.full_name || dispute.freelance.username || 'P')?.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-vynal-purple-dark dark:text-vynal-text-primary">
                        {dispute.freelance.full_name || dispute.freelance.username || 'Prestataire'}
                      </div>
                      <div className="text-xs text-vynal-purple-secondary dark:text-vynal-text-secondary">
                        ID: {dispute.freelance_id.substring(0, 8)}...
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {!loading && dispute && (
              <div className="p-3 sm:p-4 md:p-5 border-t border-gray-100 dark:border-vynal-purple-secondary/20">
                <h3 className="text-sm font-medium mb-2 text-slate-700 dark:text-vynal-text-primary flex items-center gap-1.5">
                  <ArrowLeftRight className="h-3.5 w-3.5" />
                  <span>Commande associée</span>
                </h3>
                <div className="bg-white dark:bg-vynal-purple-dark/50 border border-slate-100 dark:border-vynal-purple-secondary/20 rounded-md p-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium text-vynal-purple-dark dark:text-vynal-text-primary mb-0.5">
                        {dispute.order.service_title || "Service"}
                      </div>
                      <div className="text-xs text-vynal-purple-secondary dark:text-vynal-text-secondary">
                        ID Commande: {dispute.order_id.substring(0, 8)}...
                      </div>
                    </div>
                    <Button asChild variant="outline" size="sm" className="h-7 text-xs">
                      <Link href={`/dashboard/orders/${dispute.order_id}`}>
                        Voir la commande
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
          
          {!loading && dispute && dispute.status === 'open' && canResolveDispute && (
            <CardFooter className="p-3 sm:p-4 md:p-5 border-t border-gray-100 dark:border-vynal-purple-secondary/20 flex flex-wrap gap-2 justify-end">
              <Dialog open={isClosingDialogOpen} onOpenChange={setIsClosingDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" disabled={isUpdatingStatus}>
                    <XCircle className="h-4 w-4 mr-2" />
                    Fermer le litige
                  </Button>
                </DialogTrigger>
                <DialogContent aria-labelledby="close-dispute-title" aria-describedby="close-dispute-description">
                  <DialogHeader>
                    <DialogTitle id="close-dispute-title">Fermer ce litige</DialogTitle>
                    <DialogDescription id="close-dispute-description">
                      Fermez ce litige sans le résoudre. Cette action est définitive.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="close-note">Raison de la fermeture</Label>
                      <Textarea
                        id="close-note"
                        placeholder="Expliquez pourquoi ce litige est fermé sans résolution..."
                        value={resolutionNote}
                        onChange={(e) => setResolutionNote(e.target.value)}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsClosingDialogOpen(false)}>Annuler</Button>
                    <Button 
                      onClick={handleCloseDispute} 
                      disabled={isUpdatingStatus || !resolutionNote.trim()}
                    >
                      {isUpdatingStatus ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <XCircle className="h-4 w-4 mr-2" />}
                      Confirmer la fermeture
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              
              <Dialog open={isResolvingDialogOpen} onOpenChange={setIsResolvingDialogOpen}>
                <DialogTrigger asChild>
                  <Button disabled={isUpdatingStatus}>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Résoudre le litige
                  </Button>
                </DialogTrigger>
                <DialogContent aria-labelledby="resolve-dispute-title" aria-describedby="resolve-dispute-description">
                  <DialogHeader>
                    <DialogTitle id="resolve-dispute-title">Résoudre ce litige</DialogTitle>
                    <DialogDescription id="resolve-dispute-description">
                      Marquez ce litige comme résolu en expliquant la solution trouvée.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="resolution-note">Solution apportée</Label>
                      <Textarea
                        id="resolution-note"
                        placeholder="Décrivez la solution ou l'arrangement trouvé..."
                        value={resolutionNote}
                        onChange={(e) => setResolutionNote(e.target.value)}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsResolvingDialogOpen(false)}>Annuler</Button>
                    <Button 
                      onClick={handleResolveDispute} 
                      disabled={isUpdatingStatus || !resolutionNote.trim()}
                    >
                      {isUpdatingStatus ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                      Confirmer la résolution
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardFooter>
          )}
        </Card>
        
        {/* Messages section */}
        <Card className="shadow-sm border border-slate-200 dark:border-vynal-purple-secondary/20">
          <CardHeader className="p-3 sm:p-4 md:p-5 space-y-1">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl text-vynal-purple-light dark:text-vynal-text-primary">
                Messages
              </CardTitle>
              
              <Button 
                onClick={refreshMessages} 
                variant="ghost" 
                size="sm" 
                className="h-7 flex gap-1 items-center text-xs text-vynal-purple-secondary hover:text-vynal-accent-secondary dark:text-vynal-text-secondary dark:hover:text-vynal-accent-primary"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${messageLoading ? 'animate-spin' : ''}`} />
                <span>Actualiser</span>
              </Button>
            </div>
            <CardDescription>
              Historique de la communication concernant ce litige
            </CardDescription>
          </CardHeader>
          
          <CardContent className="p-0">
            {messageLoading && messages.length === 0 ? (
              <div className="p-3 sm:p-4 md:p-5">
                <MessagesSkeleton />
              </div>
            ) : messageError ? (
              <div className="p-6 text-center">
                <div className="text-red-500 mb-2">Erreur lors du chargement des messages</div>
                <Button onClick={refreshMessages} variant="outline" size="sm">
                  <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                  Réessayer
                </Button>
              </div>
            ) : messages.length === 0 ? (
              <div className="p-6 text-center text-vynal-purple-secondary dark:text-vynal-text-secondary">
                Aucun message pour l'instant.
              </div>
            ) : (
              <DisputeMessageList 
                messages={messages} 
                currentUserId={isClient ? dispute?.client_id : (isFreelance ? dispute?.freelance_id : '')}
                formatDate={getFormattedDate}
              />
            )}
          </CardContent>
          
          {!loading && dispute && dispute.status === 'open' && (
            <CardFooter className="p-3 sm:p-4 md:p-5 border-t border-gray-100 dark:border-vynal-purple-secondary/20">
              <DisputeMessageForm 
                onSendMessage={handleSendMessage}
                disputeId={disputeId}
              />
            </CardFooter>
          )}
        </Card>
      </div>
    </div>
  );
}