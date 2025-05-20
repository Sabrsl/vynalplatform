"use client";

import React, { memo } from "react";
import { CheckCircle, XCircle, AlertCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Database } from "@/types/database";

// Type de notification basé directement sur le type de la base de données
type Notification = Database['public']['Tables']['notifications']['Row'];

interface ServiceNotificationAlertProps {
  notification: Notification;
  onClose: () => void;
}

/**
 * Composant pour afficher une alerte de notification de service avec un bouton de fermeture
 * Version compacte pour l'en-tête de page
 */
const ServiceNotificationAlert = memo(function ServiceNotificationAlert({
  notification,
  onClose
}: ServiceNotificationAlertProps) {
  // Déterminer le type d'alerte en fonction du type de notification
  const getAlertType = () => {
    switch (notification.type) {
      case 'service_approved':
        return 'success';
      case 'service_rejected':
        return 'destructive';
      case 'service_unpublished':
        return 'warning';
      default:
        return 'default';
    }
  };

  // Extraire le contenu de la notification
  const getNotificationContent = () => {
    try {
      if (notification.content) {
        const content = JSON.parse(notification.content);
        return {
          title: content.serviceTitle || '',
          message: notification.type === 'service_approved' 
            ? 'Service approuvé!' 
            : notification.type === 'service_rejected'
            ? 'Service rejeté' 
            : 'Service dépublié'
        };
      }
    } catch (err) {
      console.error('Erreur lors du parsing du contenu de la notification', err);
    }
    
    return {
      title: '',
      message: notification.content || 'Notification de service'
    };
  };

  const content = getNotificationContent();
  const alertType = getAlertType();

  return (
    <Alert 
      variant={alertType} 
      className="mb-2 py-2 px-3 flex items-center justify-between relative border-l-4 rounded-sm"
      style={{
        borderLeftColor: alertType === 'success' ? '#10b981' : 
                          alertType === 'destructive' ? '#ef4444' : 
                          alertType === 'warning' ? '#f59e0b' : '#6366f1'
      }}
    >
      <div className="flex items-center gap-2 flex-1">
        {alertType === 'success' && <CheckCircle className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />}
        {alertType === 'destructive' && <XCircle className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />}
        {alertType === 'warning' && <AlertCircle className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />}
        
        <div className="flex-1 text-xs">
          <span className="font-medium">{content.message}</span>
          {content.title && (
            <span className="ml-1 text-slate-600 dark:text-slate-400">
              - {content.title.length > 30 ? content.title.substring(0, 30) + '...' : content.title}
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
    </Alert>
  );
});

export default ServiceNotificationAlert; 