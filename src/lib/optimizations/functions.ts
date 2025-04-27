import { supabase } from '@/lib/supabase/client';

/**
 * Vérifie si une fonction RPC existe dans la base de données
 * @param functionName Nom de la fonction RPC à vérifier
 * @returns Booléen indiquant si la fonction existe
 */
export async function checkRPCFunctionExists(functionName: string): Promise<boolean> {
  try {
    // Tentative d'appel de la fonction avec des paramètres invalides pour vérifier son existence
    const { error } = await supabase.rpc(functionName, { 
      p_user_id: '00000000-0000-0000-0000-000000000000',
      p_user_role: 'invalid'
    });
    
    // Si l'erreur contient "function does not exist", la fonction n'existe pas
    const doesNotExist = error?.message?.includes('function does not exist') || 
                         error?.message?.includes('fonction inexistante');
    
    return !doesNotExist;
  } catch (e) {
    console.error(`Erreur lors de la vérification de la fonction RPC ${functionName}:`, e);
    return false;
  }
}

/**
 * Cache des résultats de vérification de fonctions RPC pour éviter les appels répétés
 */
const rpcFunctionCache: Record<string, {
  exists: boolean,
  timestamp: number
}> = {};

const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes

/**
 * Vérifie si une fonction RPC existe dans la base de données avec mise en cache
 * @param functionName Nom de la fonction RPC à vérifier
 * @returns Booléen indiquant si la fonction existe
 */
export async function checkRPCFunctionExistsWithCache(functionName: string): Promise<boolean> {
  const now = Date.now();
  
  // Vérifier le cache d'abord
  if (rpcFunctionCache[functionName] && 
      (now - rpcFunctionCache[functionName].timestamp) < CACHE_EXPIRY) {
    return rpcFunctionCache[functionName].exists;
  }
  
  // Sinon, faire l'appel et mettre en cache
  const exists = await checkRPCFunctionExists(functionName);
  
  rpcFunctionCache[functionName] = {
    exists,
    timestamp: now
  };
  
  return exists;
} 