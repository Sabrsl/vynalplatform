import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

/**
 * Hook personnalisé pour s'abonner aux changements en temps réel sur une table Supabase
 * @param channel Configuration du canal (table, schéma)
 * @param callback Fonction à exécuter lors d'un changement
 * @param enabled Active ou désactive la souscription
 */
export function useRealtimeSubscription(
  channel: { table: string; schema: string; filter?: string },
  callback: (payload: any) => void,
  enabled: boolean = true
) {
  // Utilisation de useCallback pour mémoriser la fonction callback et éviter les re-renders inutiles
  const stableCallback = useCallback(callback, [callback]);
  const realtimeChannel = useRef<RealtimeChannel | null>(null);
  const reconnectAttempts = useRef<number>(0);
  const maxReconnectAttempts = 5;
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const { table, schema, filter } = channel;
    
    // Fonction pour configurer l'abonnement
    const setupSubscription = () => {
      try {
        // Nettoyage au cas où
        if (realtimeChannel.current) {
          supabase.removeChannel(realtimeChannel.current);
          realtimeChannel.current = null;
        }
        
        // Créer une configuration de base
        const channelConfig = {
          event: '*',
          schema: schema,
          table: table,
        };
        
        // Ajouter le filtre si présent
        if (filter) {
          Object.assign(channelConfig, { filter });
        }
        
        // Log pour le débogage
        console.log(`Configuration du canal Realtime pour ${schema}.${table}`, 
          filter ? `avec filtre: ${filter}` : 'sans filtre');
        
        // Créer le canal avec un identifiant unique basé sur le temps
        const channelId = `${schema}_${table}_${Date.now()}`;
        realtimeChannel.current = supabase
          .channel(channelId)
          .on(
            'postgres_changes' as any,
            channelConfig,
            (payload: any) => {
              console.log(`Realtime: Événement reçu sur ${schema}.${table}`, payload);
              stableCallback(payload);
            }
          )
          .subscribe((status) => {
            console.log(`Statut du canal ${channelId}: ${status}`);
            
            if (status === 'SUBSCRIBED') {
              console.log(`Abonnement réussi au canal ${channelId}`);
              // Réinitialiser le compteur de tentatives en cas de succès
              reconnectAttempts.current = 0;
            } else if (status === 'CHANNEL_ERROR') {
              console.error(`Erreur de connexion au canal ${channelId}`);
              
              // Tenter de se reconnecter si possible
              if (reconnectAttempts.current < maxReconnectAttempts) {
                reconnectAttempts.current++;
                const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
                
                console.log(`Tentative de reconnexion ${reconnectAttempts.current}/${maxReconnectAttempts} dans ${delay}ms...`);
                
                if (reconnectTimeoutRef.current) {
                  clearTimeout(reconnectTimeoutRef.current);
                }
                
                reconnectTimeoutRef.current = setTimeout(() => {
                  console.log(`Reconnexion au canal ${channelId}...`);
                  setupSubscription();
                }, delay);
              } else {
                console.error(`Abandon après ${maxReconnectAttempts} tentatives de reconnexion infructueuses.`);
                // Fallback: En cas d'échec permanent, utiliser un polling simple
                const interval = setInterval(() => {
                  console.log("Utilisation du fallback polling pour les changements");
                  stableCallback({ event: 'polling_update' });
                }, 30000); // toutes les 30 secondes
                
                // Nettoyer l'intervalle si le composant est démonté
                return () => clearInterval(interval);
              }
            }
          });
      } catch (error) {
        console.error(`Erreur lors de la souscription à ${schema}.${table}:`, error);
        
        // Fallback: En cas d'erreur, utiliser un polling simple
        const interval = setInterval(() => {
          console.log("Utilisation du fallback polling pour les changements");
          stableCallback({ event: 'polling_update' });
        }, 30000); // toutes les 30 secondes
        
        return () => clearInterval(interval);
      }
    };
    
    // Configurer l'abonnement initial
    setupSubscription();

    // Nettoyage
    return () => {
      if (realtimeChannel.current) {
        console.log(`Suppression du canal Realtime pour ${schema}.${table}`);
        supabase.removeChannel(realtimeChannel.current);
        realtimeChannel.current = null;
      }
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };
  }, [channel.table, channel.schema, channel.filter, stableCallback, enabled]);
}

/**
 * Vérifie si une fonction RPC existe dans la base de données
 * @param functionName Nom de la fonction à vérifier
 * @returns Promise qui résout à true si la fonction existe, false sinon
 */
export async function checkRpcFunctionExists(functionName: string): Promise<boolean> {
  try {
    const { error } = await supabase.rpc(functionName, {});
    
    // Si l'erreur indique que la fonction n'existe pas
    if (error && (
      error.message.includes('function does not exist') || 
      error.message.includes('function not found')
    )) {
      return false;
    }
    
    // Si d'autres erreurs (comme des arguments manquants), la fonction existe
    return true;
  } catch (err) {
    console.error(`Erreur lors de la vérification de la fonction ${functionName}:`, err);
    return false;
  }
} 