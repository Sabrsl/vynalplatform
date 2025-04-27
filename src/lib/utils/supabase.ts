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
  channel: { table: string; schema: string },
  callback: (payload: any) => void,
  enabled: boolean = true
) {
  // Utilisation de useCallback pour mémoriser la fonction callback et éviter les re-renders inutiles
  const stableCallback = useCallback(callback, [callback]);
  const realtimeChannel = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const { table, schema } = channel;
    
    // Créer une souscription à la table Supabase
    try {
      realtimeChannel.current = supabase
        .channel(`${schema}_${table}_changes`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: schema,
            table: table,
          },
          (payload) => {
            stableCallback(payload);
          }
        )
        .subscribe();
    } catch (error) {
      console.error(`Erreur lors de la souscription à ${schema}.${table}:`, error);
      
      // Fallback: En cas d'erreur, utiliser un polling simple
      const interval = setInterval(() => {
        stableCallback({ event: 'polling_update' });
      }, 30000); // toutes les 30 secondes
      
      return () => clearInterval(interval);
    }

    // Nettoyage
    return () => {
      if (realtimeChannel.current) {
        supabase.removeChannel(realtimeChannel.current);
      }
    };
  }, [channel.table, channel.schema, stableCallback, enabled]);
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