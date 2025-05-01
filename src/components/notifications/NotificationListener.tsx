"use client";

import { useEffect, useRef, useCallback, memo } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { eventEmitter, EVENTS, type NotificationEvent } from '@/lib/utils/events';

/**
 * Composant optimisé qui écoute les événements de notification et affiche les toasts
 * Ce composant doit être monté à la racine de l'application pour capturer 
 * toutes les notifications émises par les stores ou services
 */
const NotificationListener = () => {
  const { toast } = useToast();
  const notificationQueueRef = useRef<NotificationEvent[]>([]);
  const isProcessingRef = useRef<boolean>(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Optimisation: fonction pour nettoyer les timers
  const clearTimers = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
  }, []);
  
  // Traiter les notifications en file d'attente pour éviter les chevauchements
  const processNotificationQueue = useCallback(async () => {
    // Ne rien faire si déjà en train de traiter ou si la file est vide
    if (isProcessingRef.current || notificationQueueRef.current.length === 0) return;
    
    isProcessingRef.current = true;
    
    try {
      const notification = notificationQueueRef.current.shift();
      if (!notification) {
        isProcessingRef.current = false;
        return;
      }
      
      // Appliquer des retards différents selon la priorité de la notification
      const delay = notification.priority === 'high' ? 0 : 300;
      
      // Utiliser une référence pour pouvoir annuler le timeout si nécessaire
      await new Promise<void>((resolve) => {
        clearTimers();
        timeoutRef.current = setTimeout(() => {
          // Afficher le toast avec les options de la notification
          toast({
            title: notification.title,
            description: notification.description,
            variant: notification.variant || 'purple',
            duration: notification.duration || 5000,
            action: notification.action,
          });
          resolve();
        }, delay);
      });
    } catch (error) {
      console.error('Erreur lors du traitement de la notification:', error);
    } finally {
      // Utiliser une référence pour pouvoir annuler le timeout si nécessaire
      clearTimers();
      timeoutRef.current = setTimeout(() => {
        isProcessingRef.current = false;
        timeoutRef.current = null;
        
        // Continuer à traiter la file si elle contient d'autres notifications
        if (notificationQueueRef.current.length > 0) {
          processNotificationQueue();
        }
      }, 500);
    }
  }, [toast, clearTimers]);
  
  // Optimisation: fonction avec debounce pour ajouter une notification à la file d'attente
  const queueNotification = useCallback((notification: NotificationEvent) => {
    // Annuler tout debounce en cours
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    debounceTimerRef.current = setTimeout(() => {
      // Utiliser Set pour détecter les doublons de manière plus efficace
      const notificationKey = `${notification.title}|${notification.description}`;
      const existingKeys = new Set(
        notificationQueueRef.current.map(n => `${n.title}|${n.description}`)
      );
      
      // Ne pas ajouter si un doublon existe déjà
      if (!existingKeys.has(notificationKey)) {
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
        
        // Démarrer le traitement si ce n'est pas déjà en cours
        if (!isProcessingRef.current) {
          processNotificationQueue();
        }
      }
      
      debounceTimerRef.current = null;
    }, 50); // Petit délai pour grouper les notifications similaires
  }, [processNotificationQueue]);

  // S'abonner aux événements de notification
  useEffect(() => {
    // Écouter les événements de notification
    const unsubscribe = eventEmitter.on(EVENTS.NOTIFICATION, queueNotification);

    // Se désabonner lors du démontage du composant
    return () => {
      unsubscribe();
      // Nettoyer les ressources lors du démontage
      clearTimers();
      notificationQueueRef.current = [];
    };
  }, [queueNotification, clearTimers]);

  // Ce composant ne rend rien visuellement
  return null;
};

export default memo(NotificationListener);