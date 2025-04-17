"use client";

import { useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { eventEmitter, EVENTS, type NotificationEvent } from '@/lib/utils/events';

/**
 * Composant qui écoute les événements de notification et affiche les toasts
 * Ce composant doit être monté à la racine de l'application pour capturer 
 * toutes les notifications émises par les stores ou services
 */
const NotificationListener = () => {
  const { toast } = useToast();

  useEffect(() => {
    // S'abonner aux événements de notification
    const unsubscribe = eventEmitter.on(EVENTS.NOTIFICATION, (notification: NotificationEvent) => {
      toast({
        title: notification.title,
        description: notification.description,
        variant: notification.variant || 'purple',
        duration: notification.duration || 5000,
      });
    });

    // Se désabonner lors du démontage du composant
    return () => {
      unsubscribe();
    };
  }, [toast]);

  // Ce composant ne rend rien visuellement
  return null;
};

export default NotificationListener; 