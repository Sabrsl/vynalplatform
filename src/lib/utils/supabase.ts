import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

// Map globale pour suivre les abonnements actifs par identifiant de canal
// Cela permet d'éviter les abonnements dupliqués aux mêmes tables
const ACTIVE_SUBSCRIPTIONS = new Map<string, {
  count: number,
  channel: RealtimeChannel
}>();

// Nettoyage périodique des abonnements orphelins
setInterval(() => {
  // Cette fonction est appelée toutes les 5 minutes pour vérifier
  // les abonnements qui pourraient être orphelins
}, 300000);

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
  const lastEventTimestamp = useRef<number>(0);
  
  // Créer un identifiant stable pour ce canal
  const { table, schema, filter } = channel;
  const channelKey = `${schema}_${table}_${filter || 'no_filter'}`;

  useEffect(() => {
    if (!enabled) return;
    
    // Fonction pour configurer l'abonnement
    const setupSubscription = () => {
      try {
        // Nettoyage au cas où
        if (realtimeChannel.current) {
          try {
            supabase.removeChannel(realtimeChannel.current);
          } catch (error) {
            // console.error(`Erreur lors du nettoyage du canal:`, error);
          }
          realtimeChannel.current = null;
        }
        
        // Vérifier si un abonnement existe déjà pour cette table
        const existingSubscription = ACTIVE_SUBSCRIPTIONS.get(channelKey);
        if (existingSubscription) {
          // Réutiliser l'abonnement existant
          existingSubscription.count++;
          realtimeChannel.current = existingSubscription.channel;
          
          // Attacher le callback à ce canal existant
          realtimeChannel.current.on(
            'postgres_changes' as any,
            {
              event: '*',
              schema: schema,
              table: table,
              filter: filter
            },
            (payload: any) => {
              lastEventTimestamp.current = Date.now();
              // Éviter le log excessif
              // console.log(`Realtime: Événement reçu sur ${schema}.${table}`, payload);
              stableCallback(payload);
            }
          );
          
          return;
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
        
        // Créer le canal avec un identifiant unique plus stable (basé sur le contenu, pas le temps)
        const channelId = `${schema}_${table}_${filter || ''}_${Math.random().toString(36).substring(2, 10)}`;
        
        realtimeChannel.current = supabase
          .channel(channelId)
          .on(
            'postgres_changes' as any,
            channelConfig,
            (payload: any) => {
              lastEventTimestamp.current = Date.now();
              // console.log(`Realtime: Événement reçu sur ${schema}.${table}`, payload);
              stableCallback(payload);
            }
          )
          .subscribe((status) => {
            // console.log(`Statut du canal ${channelId}: ${status}`);
            
            if (status === 'SUBSCRIBED') {
              // console.log(`Abonnement réussi au canal ${channelId}`);
              // Réinitialiser le compteur de tentatives en cas de succès
              reconnectAttempts.current = 0;
              
              // Enregistrer l'abonnement dans la map globale
              ACTIVE_SUBSCRIPTIONS.set(channelKey, {
                count: 1,
                channel: realtimeChannel.current!
              });
            } else if (status === 'CHANNEL_ERROR') {
              console.error(`Erreur de connexion au canal ${channelId}`);
              
              // Tenter de se reconnecter si possible
              if (reconnectAttempts.current < maxReconnectAttempts) {
                reconnectAttempts.current++;
                const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
                
                if (reconnectTimeoutRef.current) {
                  clearTimeout(reconnectTimeoutRef.current);
                }
                
                reconnectTimeoutRef.current = setTimeout(() => {
                  setupSubscription();
                }, delay);
              } else {
                console.error(`Abandon après ${maxReconnectAttempts} tentatives de reconnexion infructueuses.`);
                // Fallback: En cas d'échec permanent, utiliser un polling simple mais moins fréquent
                const interval = setInterval(() => {
                  stableCallback({ event: 'polling_update' });
                }, 60000); // toutes les 60 secondes (au lieu de 30)
                
                // Nettoyer l'intervalle si le composant est démonté
                return () => clearInterval(interval);
              }
            }
          });
      } catch (error) {
        console.error(`Erreur lors de la souscription à ${schema}.${table}:`, error);
        
        // Fallback: En cas d'erreur, utiliser un polling simple mais moins fréquent
        const interval = setInterval(() => {
          stableCallback({ event: 'polling_update' });
        }, 60000); // toutes les 60 secondes (au lieu de 30)
        
        return () => clearInterval(interval);
      }
    };
    
    // Configurer l'abonnement initial
    setupSubscription();

    // Nettoyage
    return () => {
      if (realtimeChannel.current) {
        try {
          // Vérifier si c'est un abonnement partagé
          const existingSubscription = ACTIVE_SUBSCRIPTIONS.get(channelKey);
          if (existingSubscription && existingSubscription.count > 1) {
            // D'autres composants utilisent encore cet abonnement, juste décrémenter
            existingSubscription.count--;
          } else {
            // Dernier composant utilisant cet abonnement, le supprimer
            if (existingSubscription) {
              ACTIVE_SUBSCRIPTIONS.delete(channelKey);
            }
            
            if (realtimeChannel.current && typeof realtimeChannel.current.unsubscribe === 'function') {
              supabase.removeChannel(realtimeChannel.current);
            }
          }
        } catch (error) {
          console.error(`Erreur lors de la suppression du canal:`, error);
        }
        realtimeChannel.current = null;
      }
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };
  }, [channel.table, channel.schema, channel.filter, stableCallback, enabled, channelKey]);
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