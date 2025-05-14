import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from './useAuth';

/**
 * Hook pour traiter automatiquement les notifications
 * Ce hook est utilisé dans les composants pour effectuer un traitement périodique des notifications
 * Il est particulièrement utile pour les pages d'administration
 */
export const useNotificationProcessor = (autoProcess = false, intervalMs = 60000) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastProcessed, setLastProcessed] = useState<Date | null>(null);
  const [pendingCount, setPendingCount] = useState<number | null>(null);
  const { user } = useAuth();

  // Fonction pour vérifier les notifications en attente
  const checkPendingNotifications = useCallback(async () => {
    if (!user) return;
    
    try {
      const response = await fetch('/api/notifications/process', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setPendingCount(data.pendingNotifications);
        return data.pendingNotifications;
      } else {
        console.error('Erreur lors de la vérification des notifications en attente');
        return null;
      }
    } catch (err) {
      console.error('Erreur lors de la vérification des notifications');
      return null;
    }
  }, [user]);

  // Fonction pour traiter les notifications
  const processNotifications = useCallback(async () => {
    if (!user) return false;
    
    try {
      setIsProcessing(true);
      setError(null);
      
      const response = await fetch('/api/notifications/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        setLastProcessed(new Date());
        await checkPendingNotifications();
        return true;
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Erreur lors du traitement des notifications');
        return false;
      }
    } catch (err) {
      setError('Erreur de connexion au serveur');
      console.error('Erreur lors du traitement des notifications');
      return false;
    } finally {
      setIsProcessing(false);
    }
  }, [user, checkPendingNotifications]);

  // Fonction pour envoyer une notification spécifique par email
  const sendNotificationEmail = useCallback(async (userId: string, type: string, content?: string, conversationId?: string) => {
    if (!user) return false;
    
    try {
      const response = await fetch('/api/notifications/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          type,
          content,
          conversationId,
        }),
      });
      
      if (response.ok) {
        return true;
      } else {
        const errorData = await response.json();
        console.error('Erreur lors de l\'envoi de la notification');
        return false;
      }
    } catch (err) {
      console.error('Erreur de connexion au serveur');
      return false;
    }
  }, [user]);

  // Configuration du traitement automatique si activé
  useEffect(() => {
    if (!autoProcess || !user) return;
    
    // Vérification initiale des notifications en attente
    checkPendingNotifications();
    
    // Configuration de l'intervalle de traitement automatique
    const intervalId = setInterval(() => {
      processNotifications();
    }, intervalMs);
    
    // Nettoyage
    return () => {
      clearInterval(intervalId);
    };
  }, [autoProcess, intervalMs, user, processNotifications, checkPendingNotifications]);

  return {
    isProcessing,
    error,
    lastProcessed,
    pendingCount,
    processNotifications,
    checkPendingNotifications,
    sendNotificationEmail,
  };
}; 