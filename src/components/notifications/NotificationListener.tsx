"use client";

import { useEffect, useRef, useCallback, memo } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { eventEmitter, EVENTS, type NotificationEvent } from '@/lib/utils/events';

// Clé pour stocker les notifications déjà affichées dans localStorage
const DISPLAYED_NOTIFICATIONS_KEY = 'vynal_displayed_notifications';
// Délai minimum entre les mêmes notifications (24 heures en millisecondes)
const MIN_NOTIFICATION_INTERVAL = 24 * 60 * 60 * 1000;

// Interface pour le stockage des notifications
interface SessionToasts {
  [key: string]: number;
}

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

  // Vérifier si une notification a déjà été affichée récemment
  const shouldShowNotification = useCallback((notification: NotificationEvent): boolean => {
    if (typeof window === 'undefined') return true;
    
    try {
      // Générer un ID unique pour cette notification basé sur son contenu
      const notificationId = `${notification.title}-${notification.description}`.replace(/\s+/g, '-').toLowerCase();
      
      // Récupérer l'état des notifications depuis le stockage global ou localStorage
      let sessionToasts: SessionToasts = {};
      
      if (window.vynal_sessionToasts) {
        sessionToasts = window.vynal_sessionToasts as unknown as SessionToasts;
      } else {
        try {
          const storedState = localStorage.getItem(DISPLAYED_NOTIFICATIONS_KEY);
          sessionToasts = storedState ? JSON.parse(storedState) : {};
          window.vynal_sessionToasts = sessionToasts as any;
        } catch (err) {
          console.warn('[NotificationListener] Erreur localStorage:', err);
          sessionToasts = {};
        }
      }
      
      // Vérifier si la notification a déjà été affichée et quand
      const now = Date.now();
      const lastShown = sessionToasts[notificationId];
      
      // Si jamais affichée ou affichée il y a plus de 24h, on l'affiche
      if (!lastShown || (now - lastShown) > MIN_NOTIFICATION_INTERVAL) {
        // Mettre à jour l'heure de dernière affichage
        sessionToasts[notificationId] = now;
        
        // Persister l'état
        localStorage.setItem(DISPLAYED_NOTIFICATIONS_KEY, JSON.stringify(sessionToasts));
        return true;
      }
      
      return false;
    } catch (err) {
      console.warn('[NotificationListener] Erreur dans shouldShowNotification:', err);
      return true; // En cas d'erreur, on affiche la notification par précaution
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
      
      // Vérifier si on doit afficher cette notification
      if (!shouldShowNotification(notification)) {
        isProcessingRef.current = false;
        if (notificationQueueRef.current.length > 0) {
          processNotificationQueue();
        }
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
  }, [toast, clearTimers, shouldShowNotification]);
  
  // Configurer les écouteurs d'événements pour les notifications
  useEffect(() => {
    const handleNotification = (event: NotificationEvent) => {
      notificationQueueRef.current.push(event);
      
      // Si on n'est pas déjà en train de traiter, lancer le traitement
      if (!isProcessingRef.current) {
        processNotificationQueue();
      }
    };
    
    // S'abonner à l'événement de notification
    const unsubscribe = eventEmitter.on(EVENTS.NOTIFICATION, handleNotification);
    
    // Nettoyage lors du démontage du composant
    return () => {
      unsubscribe(); // Utiliser la fonction de désinscription retournée
      clearTimers();
    };
  }, [processNotificationQueue, clearTimers]);
  
  // Ce composant ne rend rien, il se contente d'écouter les événements
  return null;
};

export default memo(NotificationListener);