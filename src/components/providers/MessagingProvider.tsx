"use client";

import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useMessagingStore } from '@/lib/stores/useMessagingStore';
import requestCoordinator from '@/lib/optimizations/requestCoordinator';

/**
 * Fournisseur global pour les abonnements de messagerie en temps réel
 * Évite les abonnements multiples lors de la navigation entre les pages
 * et centralise les connexions pour réduire les requêtes parallèles
 */
export function MessagingProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { setupRealtimeSubscriptions, fetchConversations } = useMessagingStore();
  const [isInitialized, setIsInitialized] = useState(false);
  const cleanupRef = useRef<(() => void) | null>(null);
  const connectionTimestampRef = useRef<number | null>(null);

  // Configuré une seule fois lors du montage initial
  useEffect(() => {
    // Ne rien faire si l'utilisateur n'est pas connecté
    if (!user?.id) return;

    // Si déjà initialisé, ne pas réinitialiser
    if (isInitialized) return;

    console.log("[MessagingProvider] Initialisation des abonnements temps réel");
    
    // Utiliser le requestCoordinator pour éviter les connexions multiples
    const setupMessaging = () => {
      // Enregistrer le timestamp de la connexion
      connectionTimestampRef.current = Date.now();
      
      // Configurer les abonnements en temps réel
      const cleanup = setupRealtimeSubscriptions(user.id);
      cleanupRef.current = cleanup;
      
      // Précharger les conversations pour éviter des requêtes multiples plus tard
      requestCoordinator.scheduleRequest(
        `initial_conversations_${user.id}`,
        async () => {
          console.log("[MessagingProvider] Préchargement initial des conversations");
          await fetchConversations(user.id);
        },
        'low' // Priorité basse car c'est un préchargement initial
      );
      
      setIsInitialized(true);
    };
    
    // Utiliser le coordinateur pour établir la connexion
    requestCoordinator.scheduleRequest(
      `setup_messaging_${user.id}`,
      async () => setupMessaging(),
      'high' // Priorité haute car essentiel au fonctionnement
    );

    // Fonction de nettoyage lors du démontage du composant
    return () => {
      console.log("[MessagingProvider] Nettoyage des abonnements temps réel");
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
    };
  }, [user?.id, setupRealtimeSubscriptions, isInitialized, fetchConversations]);

  // Aucun rendu supplémentaire
  return <>{children}</>;
} 