"use client";

import React, { memo } from "react";
import { CheckCircle, XCircle, AlertTriangle, ShoppingBag, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Database } from "@/types/database";

// Type de notification basé directement sur le type de la base de données
type Notification = Database['public']['Tables']['notifications']['Row'];

interface OrderNotificationAlertProps {
  notification: Notification;
  onClose: () => void;
}

/**
 * Composant pour afficher une alerte de notification de commande avec un bouton de fermeture
 * Version compacte pour l'en-tête de page - pour les commandes reçues, annulées et litiges
 */
const OrderNotificationAlert = memo(function OrderNotificationAlert({
  notification,
  onClose
}: OrderNotificationAlertProps) {
  // Déterminer le type d'alerte en fonction du type de notification
  const getAlertType = () => {
    switch (notification.type) {
      case 'new_order':
      case 'order_confirmed':
      case 'order_delivered':
        return 'success';
      case 'order_cancelled':
        return 'destructive';
      case 'dispute_opened':
      case 'dispute_message':
        return 'warning';
      case 'dispute_resolved':
        return 'success';
      default:
        return 'default';
    }
  };

  // Extraire le contenu de la notification
  const getNotificationContent = () => {
    try {
      if (notification.content) {
        const content = typeof notification.content === 'string' 
          ? JSON.parse(notification.content) 
          : notification.content;

        return {
          title: content.orderTitle || content.serviceTitle || '',
          message: getMessageByType(notification.type),
          clientName: content.clientName || '',
          orderAmount: content.orderAmount || '',
          disputeReason: content.disputeReason || ''
        };
      }
    } catch (err) {
      console.error('Erreur lors du parsing du contenu de la notification', err);
    }
    
    return {
      title: '',
      message: getMessageByType(notification.type),
      clientName: '',
      orderAmount: '',
      disputeReason: ''
    };
  };

  // Obtenir le message en fonction du type de notification
  const getMessageByType = (type: string) => {
    switch (type) {
      case 'new_order':
        return 'Nouvelle commande';
      case 'order_confirmed':
        return 'Commande confirmée';
      case 'order_cancelled':
        return 'Commande annulée';
      case 'order_delivered':
        return 'Commande livrée';
      case 'dispute_opened':
        return 'Litige ouvert';
      case 'dispute_message':
        return 'Message de litige';
      case 'dispute_resolved':
        return 'Litige résolu';
      default:
        return 'Notification';
    }
  };

  const content = getNotificationContent();
  const alertType = getAlertType();

  return (
    <div
      className="mb-2 py-2 px-3 flex items-center justify-between relative border-l-4 rounded-sm bg-white dark:bg-gray-800 shadow-sm"
      style={{
        borderLeftColor: alertType === 'success' ? '#10b981' : 
                          alertType === 'destructive' ? '#ef4444' : 
                          alertType === 'warning' ? '#f59e0b' : '#6366f1'
      }}
    >
      <div className="flex items-center gap-2 flex-1">
        {alertType === 'success' && <CheckCircle className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />}
        {alertType === 'destructive' && <XCircle className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />}
        {alertType === 'warning' && <AlertTriangle className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />}
        {alertType === 'default' && <ShoppingBag className="h-3.5 w-3.5 text-indigo-500 flex-shrink-0" />}
        
        <div className="flex-1 text-xs">
          <span className="font-medium">{content.message}</span>
          {content.title && (
            <span className="ml-1 text-slate-600 dark:text-slate-400">
              - {content.title.length > 30 ? content.title.substring(0, 30) + '...' : content.title}
            </span>
          )}
          {content.clientName && (
            <span className="ml-1 text-slate-500 dark:text-slate-500 text-[10px]">
              ({content.clientName})
            </span>
          )}
        </div>
      </div>
      
      <Button 
        variant="ghost" 
        size="sm" 
        className="h-5 w-5 p-0 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 ml-2 flex-shrink-0" 
        onClick={onClose}
      >
        <X className="h-3 w-3" />
        <span className="sr-only">Fermer</span>
      </Button>
    </div>
  );
});

export default OrderNotificationAlert; 