"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useToast } from "@/components/ui/use-toast";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Order, OrderStatus } from "@/types/orders";
import { formatPrice } from "@/lib/utils";
import { FREELANCE_ROUTES, CLIENT_ROUTES } from "@/config/routes";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

import {
  AlertCircle,
  AlertTriangle,
  Calendar,
  Clock,
  CreditCard,
  FileCheck,
  Loader,
  Check,
  X,
  AlertOctagon
} from "lucide-react";

interface OrderSidebarProps {
  order: Order;
  isFreelance: boolean;
  statusColors: Record<string, string>;
  statusLabels: Record<string, string>;
  navigateToOrdersList: (status: OrderStatus) => void;
}

export function OrderSidebar({ 
  order, 
  isFreelance, 
  statusColors, 
  statusLabels, 
  navigateToOrdersList 
}: OrderSidebarProps) {
  const { toast } = useToast();
  const otherParty = order.client; // Toujours prendre le client car on est en mode freelance
  const [isProcessing, setIsProcessing] = useState(false);

  // Fonction pour accepter une commande
  const handleAcceptOrder = async () => {
    if (isProcessing) return;
    
    try {
      setIsProcessing(true);
      const supabase = createClientComponentClient();
      
      // Indiquer le chargement
      toast({
        title: "Acceptation en cours",
        description: "Veuillez patienter pendant la mise à jour de la commande..."
      });
      
      // Mettre à jour le statut de la commande
      const { error } = await supabase
        .from('orders')
        .update({ status: 'in_progress' })
        .eq('id', order.id);
      
      if (error) {
        console.error("Erreur lors de l'acceptation:", error);
        toast({
          title: "Erreur",
          description: "Impossible d'accepter la commande: " + error.message,
          variant: "destructive"
        });
        return;
      }
      
      // Envoyer un message
      await supabase
        .from('messages')
        .insert({
          order_id: order.id,
          sender_id: order.freelance.id,
          content: "J'ai accepté votre commande et je commence à y travailler. N'hésitez pas à me contacter si vous avez des questions.",
          read: false
        });
      
      toast({
        title: "Commande acceptée",
        description: "Vous avez accepté la commande avec succès. Vous pouvez maintenant commencer à travailler dessus.",
      });
      
      // Rediriger vers la liste avec le bon filtre
      setTimeout(() => navigateToOrdersList('in_progress'), 1500);
    } catch (err) {
      console.error("Exception lors de l'acceptation:", err);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'acceptation. Veuillez réessayer.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Fonction pour rejeter/annuler une commande
  const handleCancelOrder = async () => {
    if (isProcessing) return;
    
    try {
      setIsProcessing(true);
      const supabase = createClientComponentClient();
      
      // Indiquer le chargement
      toast({
        title: "Annulation en cours",
        description: "Veuillez patienter pendant la mise à jour de la commande..."
      });
      
      // Mettre à jour le statut de la commande
      const { error } = await supabase
        .from('orders')
        .update({ status: 'cancelled' })
        .eq('id', order.id);
      
      if (error) {
        console.error("Erreur lors de l'annulation:", error);
        toast({
          title: "Erreur",
          description: "Impossible d'annuler la commande: " + error.message,
          variant: "destructive"
        });
        return;
      }
      
      // Envoyer un message
      await supabase
        .from('messages')
        .insert({
          order_id: order.id,
          sender_id: order.freelance.id,
          content: "J'ai dû annuler votre commande. Je vous invite à me contacter pour plus d'informations.",
          read: false
        });
      
      toast({
        title: "Commande annulée",
        description: "Vous avez annulé la commande avec succès.",
      });
      
      // Rediriger vers la liste avec le bon filtre
      setTimeout(() => navigateToOrdersList('cancelled'), 1500);
    } catch (err) {
      console.error("Exception lors de l'annulation:", err);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'annulation. Veuillez réessayer.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Fonction pour livrer une commande
  const handleDeliverOrder = async () => {
    if (isProcessing) return;
    
    try {
      setIsProcessing(true);
      const supabase = createClientComponentClient();
      
      // Indiquer le chargement
      toast({
        title: "Livraison en cours",
        description: "Veuillez patienter pendant la mise à jour de la commande..."
      });
      
      // Préparer les données de livraison
      const deliveryData = {
        message: "Voici la livraison de votre commande. J'espère que cela correspond à vos attentes.",
        delivered_at: new Date().toISOString(),
        files: []
      };
      
      // Mettre à jour le statut de la commande et ajouter les données de livraison directement
      const { error } = await supabase
        .from('orders')
        .update({ 
          status: 'delivered',
          delivery: deliveryData
        })
        .eq('id', order.id);
      
      if (error) {
        console.error("Erreur lors de la livraison:", error);
        toast({
          title: "Erreur",
          description: "Impossible de livrer la commande: " + error.message,
          variant: "destructive"
        });
        return;
      }
      
      // Envoyer un message
      await supabase
        .from('messages')
        .insert({
          order_id: order.id,
          sender_id: order.freelance.id,
          content: "J'ai livré le travail. N'hésitez pas à me contacter si vous avez des questions.",
          read: false
        });
      
      toast({
        title: "Commande livrée",
        description: "Vous avez marqué la commande comme livrée avec succès.",
      });
      
      // Rediriger vers la liste avec le bon filtre
      setTimeout(() => navigateToOrdersList('delivered'), 1500);
    } catch (err) {
      console.error("Exception lors de la livraison:", err);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la livraison. Veuillez réessayer.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Fonction pour livrer une révision
  const handleDeliverRevision = async () => {
    if (isProcessing) return;
    
    try {
      setIsProcessing(true);
      const supabase = createClientComponentClient();
      
      // Indiquer le chargement
      toast({
        title: "Livraison en cours",
        description: "Veuillez patienter pendant la mise à jour de la commande..."
      });
      
      // Préparer les données de livraison
      const deliveryData = {
        message: "Voici la version révisée selon vos demandes.",
        delivered_at: new Date().toISOString(),
        files: order.delivery?.files || []
      };
      
      // Mettre à jour le statut de la commande et ajouter les données de livraison directement
      const { error } = await supabase
        .from('orders')
        .update({ 
          status: 'delivered',
          delivery: deliveryData
        })
        .eq('id', order.id);
      
      if (error) {
        console.error("Erreur lors de la livraison de la révision:", error);
        toast({
          title: "Erreur",
          description: "Impossible de livrer la révision: " + error.message,
          variant: "destructive"
        });
        return;
      }
      
      // Envoyer un message
      await supabase
        .from('messages')
        .insert({
          order_id: order.id,
          sender_id: order.freelance.id,
          content: "J'ai effectué les révisions demandées. N'hésitez pas à me contacter si vous avez des questions.",
          read: false
        });
      
      toast({
        title: "Révision livrée",
        description: "Vous avez livré la révision avec succès.",
      });
      
      // Rediriger vers la liste avec le bon filtre
      setTimeout(() => navigateToOrdersList('delivered'), 1500);
    } catch (err) {
      console.error("Exception lors de la livraison de révision:", err);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la livraison de la révision. Veuillez réessayer.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const statusIcons = {
    pending: <Clock className="h-3.5 w-3.5 text-amber-500 dark:text-amber-400" />,
    in_progress: <Clock className="h-3.5 w-3.5 text-yellow-600 dark:text-yellow-400" />,
    completed: <FileCheck className="h-3.5 w-3.5 text-emerald-500 dark:text-emerald-400" />,
    delivered: <FileCheck className="h-3.5 w-3.5 text-vynal-accent-primary dark:text-vynal-accent-primary" />,
    revision_requested: <Clock className="h-3.5 w-3.5 text-vynal-purple-secondary dark:text-vynal-purple-secondary" />,
    cancelled: <Clock className="h-3.5 w-3.5 text-red-500 dark:text-red-400" />,
    in_dispute: <AlertTriangle className="h-3.5 w-3.5 text-red-600 dark:text-red-500" />,
  };

  return (
    <Card className="lg:col-span-1 border border-vynal-purple-secondary/10 shadow-sm bg-white dark:bg-vynal-purple-dark/20">
      <CardHeader className="p-3 sm:p-4 pb-2 sm:pb-3 border-b border-vynal-purple-secondary/10 dark:border-vynal-purple-secondary/20">
        <CardTitle className="text-xs sm:text-sm font-semibold text-vynal-purple-light dark:text-vynal-text-primary">
          Détails de la commande
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 sm:p-4 space-y-4">
        <div className="flex flex-col p-3 sm:p-4 space-y-3 sm:space-y-4">
          <div>
            <h4 className="text-[10px] sm:text-xs text-vynal-purple-secondary dark:text-vynal-text-secondary mb-1.5">
              Service commandé
            </h4>
            <p className="text-[11px] sm:text-[12px] font-medium text-vynal-purple-light dark:text-vynal-text-primary">
              {order.service.title}
            </p>
          </div>
          <div className="flex items-center space-x-1.5 sm:space-x-2 mt-1">
            <div className="flex-shrink-0">
              <Avatar className="h-6 w-6 sm:h-7 sm:w-7 rounded-full">
                <AvatarImage src={otherParty.avatar_url || ""} alt={otherParty.username} />
                <AvatarFallback className="text-[8px] sm:text-[9px] bg-vynal-purple-secondary/10 text-vynal-accent-primary">
                  {otherParty.username.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
            <div>
              <p className="text-[10px] sm:text-xs font-medium text-vynal-purple-light dark:text-vynal-text-primary">
                {otherParty.full_name || otherParty.username}
              </p>
              <p className="text-[8px] sm:text-[9px] text-vynal-purple-secondary dark:text-vynal-text-secondary">
                Client
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <div>
              <p className="text-[10px] sm:text-xs text-vynal-purple-secondary dark:text-vynal-text-secondary mb-1">
                Référence
              </p>
              <p className="text-[8px] sm:text-[9px] font-medium text-vynal-purple-light dark:text-vynal-text-primary">
                #{order.id.substring(0, 8)}
              </p>
            </div>
            <div>
              <p className="text-[10px] sm:text-xs text-vynal-purple-secondary dark:text-vynal-text-secondary mb-1">
                Date
              </p>
              <p className="text-[8px] sm:text-[9px] font-medium text-vynal-purple-light dark:text-vynal-text-primary">
                {format(new Date(order.created_at), 'dd/MM/yyyy', { locale: fr })}
              </p>
            </div>
            <div>
              <p className="text-[10px] sm:text-xs text-vynal-purple-secondary dark:text-vynal-text-secondary mb-1">
                Montant
              </p>
              <p className="text-[8px] sm:text-[9px] font-medium text-vynal-purple-light dark:text-vynal-text-primary">
                {formatPrice(order.price)}
              </p>
            </div>
            <div>
              <p className="text-[10px] sm:text-xs text-vynal-purple-secondary dark:text-vynal-text-secondary mb-1">
                Délai
              </p>
              <div className="flex items-center">
                <Clock className="h-2.5 w-2.5 mr-1 text-vynal-purple-secondary dark:text-vynal-text-secondary" />
                <p className="text-[8px] sm:text-[9px] font-medium text-vynal-purple-light dark:text-vynal-text-primary">
                  {order.delivery_time} jours
                </p>
              </div>
            </div>
          </div>
          <div className="flex justify-center mt-2">
            <Badge className={`text-[8px] sm:text-[9px] px-2 py-0.5 border ${statusColors[order.status]} capitalize`}>
              {statusLabels[order.status]}
            </Badge>
          </div>
        </div>
        
        <div className="space-y-2 border-t border-b border-vynal-purple-secondary/10 dark:border-vynal-purple-secondary/20 py-2 sm:py-3 my-2 sm:my-3">
          <div className="flex justify-between items-center">
            <span className="text-xs sm:text-sm text-vynal-purple-secondary dark:text-vynal-text-secondary">Prix:</span>
            <span className="font-medium text-sm sm:text-base text-vynal-purple-light dark:text-vynal-text-primary">{order.service.price} €</span>
          </div>
          
          {order.payment_status && (
            <div className="flex justify-between items-center">
              <span className="text-xs sm:text-sm text-vynal-purple-secondary dark:text-vynal-text-secondary">Paiement:</span>
              <Badge variant="outline" className={`text-xs ${
                order.payment_status === "paid" 
                  ? "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800/30"
                  : order.payment_status === "pending"
                  ? "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800/30"
                  : order.payment_status === "refunded"
                  ? "bg-vynal-accent-primary/10 text-vynal-accent-primary border-vynal-accent-primary/20 dark:bg-vynal-accent-primary/20 dark:border-vynal-accent-primary/30"
                  : "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800/30"
              }`}>
                <CreditCard className="h-3 w-3 mr-1" />
                {order.payment_status === "paid" ? "Payé" : 
                 order.payment_status === "pending" ? "En attente" : 
                 order.payment_status === "refunded" ? "Remboursé" : 
                 "Contesté"}
              </Badge>
            </div>
          )}
          
          {/* Condition pour la date de livraison calculée */}
          {order.delivery_time && (
            <div className="flex justify-between items-center">
              <span className="text-xs sm:text-sm text-vynal-purple-secondary dark:text-vynal-text-secondary">Date prévue:</span>
              <span className="font-medium text-xs sm:text-sm text-vynal-purple-light dark:text-vynal-text-primary flex items-center">
                <Calendar className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1 sm:mr-1.5 text-vynal-purple-secondary/70" />
                {/* Calculer la date de livraison en ajoutant le nombre de jours à la date de création */}
                {format(new Date(new Date(order.created_at).getTime() + order.delivery_time * 24 * 60 * 60 * 1000), 'dd MMM yyyy', { locale: fr })}
              </span>
            </div>
          )}
        </div>
        
        <div>
          <h4 className="text-xs sm:text-sm font-medium text-vynal-purple-light dark:text-vynal-text-primary mb-2">
            Client
          </h4>
          <div className="flex items-center">
            <Avatar className="h-8 w-8 sm:h-10 sm:w-10 mr-2 sm:mr-3">
              <AvatarImage src={otherParty.avatar_url} alt={otherParty.full_name || otherParty.username} />
              <AvatarFallback className="bg-vynal-accent-primary/20 text-vynal-accent-primary text-xs sm:text-sm">
                {(otherParty.full_name || otherParty.username).substring(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-sm sm:text-base text-vynal-purple-light dark:text-vynal-text-primary">
                {otherParty.full_name || otherParty.username}
              </p>
              <p className="text-xs text-vynal-purple-secondary dark:text-vynal-text-secondary/80">
                @{otherParty.username}
              </p>
            </div>
          </div>
        </div>

        {/* Options spécifiques au freelance */}
        <div className="pt-4 space-y-2">
          {/* Bouton pour accepter une commande */}
          {isFreelance && order.status === "pending" && (
            <Button 
              variant="default" 
              className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-medium"
              onClick={handleAcceptOrder}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <Loader className="h-4 w-4 mr-1.5 animate-spin" />
              ) : (
                <Check className="h-4 w-4 mr-1.5" />
              )}
              Accepter la commande
            </Button>
          )}
          
          {/* Bouton pour livrer une commande */}
          {isFreelance && order.status === "in_progress" && (
            <Button 
              variant="default" 
              className="w-full bg-gradient-to-r from-vynal-accent-primary to-vynal-accent-secondary hover:from-vynal-accent-primary/90 hover:to-vynal-accent-secondary/90 text-white font-medium"
              onClick={handleDeliverOrder}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <Loader className="h-4 w-4 mr-1.5 animate-spin" />
              ) : (
                <FileCheck className="h-4 w-4 mr-1.5" />
              )}
              Livrer la commande
            </Button>
          )}
          
          {/* Bouton pour livrer une révision */}
          {isFreelance && order.status === "revision_requested" && (
            <Button 
              variant="default" 
              className="w-full bg-gradient-to-r from-vynal-accent-primary to-vynal-accent-secondary hover:from-vynal-accent-primary/90 hover:to-vynal-accent-secondary/90 text-white font-medium"
              onClick={handleDeliverRevision}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <Loader className="h-4 w-4 mr-1.5 animate-spin" />
              ) : (
                <FileCheck className="h-4 w-4 mr-1.5" />
              )}
              Livrer la révision
            </Button>
          )}
          
          {/* Bouton pour annuler une commande - toujours visible mais désactivé selon les conditions */}
          {isFreelance && (
            <Button 
              variant="outline" 
              className="w-full border-red-400 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/30 dark:hover:text-red-300"
              onClick={handleCancelOrder}
              disabled={isProcessing || order.status !== "pending"}
              title={order.status !== "pending" ? "Vous ne pouvez annuler la commande qu'avant de l'accepter" : ""}
            >
              {isProcessing ? (
                <Loader className="h-4 w-4 mr-1.5 animate-spin" />
              ) : (
                <X className="h-4 w-4 mr-1.5" />
              )}
              Annuler la commande
            </Button>
          )}
        </div>
        
        {/* Afficher un lien vers le litige existant s'il y en a un */}
        {order.dispute_id && (
          <div className="pt-2">
            <Button
              variant="outline"
              className="w-full border-amber-400 text-amber-600 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-400 dark:hover:bg-amber-900/30 dark:hover:text-amber-300"
              asChild
            >
              <Link href={`${FREELANCE_ROUTES.DISPUTES}/${order.dispute_id}`}>
                <AlertCircle className="h-4 w-4 mr-1.5" />
                Voir le litige
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 