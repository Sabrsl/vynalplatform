"use client";

import { useEffect, useRef, useCallback, memo } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { eventEmitter, EVENTS, type NotificationEvent } from '@/lib/utils/events';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Composant optimisé qui écoute les événements de notification et affiche les toasts
 * Ce composant doit être monté à la racine de l'application pour capturer 
 * toutes les notifications émises par les stores ou services
 */
const NotificationListener = () => {
  const { toast } = useToast();
  const notificationQueueRef = useRef<NotificationEvent[]>([]);
  const isProcessingRef = useRef<boolean>(false);
  
  // Traiter les notifications en file d'attente pour éviter les chevauchements
  const processNotificationQueue = useCallback(async () => {
    if (isProcessingRef.current || notificationQueueRef.current.length === 0) return;
    
    isProcessingRef.current = true;
    
    const notification = notificationQueueRef.current.shift();
    if (notification) {
      // Appliquer des retards différents selon la priorité de la notification
      const delay = notification.priority === 'high' ? 0 : 300;
      
      // Ajouter un petit délai entre les notifications pour éviter l'encombrement
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Afficher le toast avec les options de la notification
      toast({
        title: notification.title,
        description: notification.description,
        variant: notification.variant || 'purple',
        duration: notification.duration || 5000,
        action: notification.action,
      });
    }
    
    // Attendre un peu avant de traiter la notification suivante
    setTimeout(() => {
      isProcessingRef.current = false;
      if (notificationQueueRef.current.length > 0) {
        processNotificationQueue();
      }
    }, 500);
  }, [toast]);
  
  // Fonction pour ajouter une notification à la file d'attente
  const queueNotification = useCallback((notification: NotificationEvent) => {
    // Vérifier les doublons pour éviter les notifications répétitives
    const isDuplicate = notificationQueueRef.current.some(
      n => n.title === notification.title && n.description === notification.description
    );
    
    if (!isDuplicate) {
      // Ajouter au début si haute priorité, sinon à la fin
      if (notification.priority === 'high') {
        notificationQueueRef.current.unshift(notification);
      } else {
        notificationQueueRef.current.push(notification);
      }
      
      // Limiter la file d'attente à 5 notifications max
      if (notificationQueueRef.current.length > 5) {
        notificationQueueRef.current = notificationQueueRef.current.slice(0, 5);
      }
      
      processNotificationQueue();
    }
  }, [processNotificationQueue]);

  // S'abonner aux événements de notification
  useEffect(() => {
    // Écouter les événements de notification
    const unsubscribe = eventEmitter.on(EVENTS.NOTIFICATION, queueNotification);

    // Se désabonner lors du démontage du composant
    return () => {
      unsubscribe();
      // Nettoyer la file d'attente lors du démontage
      notificationQueueRef.current = [];
    };
  }, [queueNotification]);

  // Ce composant ne rend rien visuellement
  return null;
};

export default memo(NotificationListener);