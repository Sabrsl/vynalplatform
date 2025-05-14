import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/database';

// Cache pour les opérations list_changes
const LIST_CHANGES_CACHE = new Map<string, {
  data: any,
  timestamp: number
}>();

// Cache pour les promesses en cours d'exécution (déduplication)
const PENDING_REQUESTS = new Map<string, Promise<any>>();

// Durée de vie du cache en ms (30 secondes au lieu de 5)
const CACHE_TTL = 30000; 

// Nettoyer le cache périodiquement (toutes les minutes)
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of LIST_CHANGES_CACHE.entries()) {
    if (now - value.timestamp > 300000) { // 5 minutes de durée maximale (au lieu de 1)
      LIST_CHANGES_CACHE.delete(key);
    }
  }
  // Nettoyer les requêtes en attente qui seraient bloquées
  for (const [key] of PENDING_REQUESTS.entries()) {
    if (!LIST_CHANGES_CACHE.has(key)) {
      PENDING_REQUESTS.delete(key);
    }
  }
}, 60000);

// Implémentation simple d'un compteur de requêtes directement dans ce fichier
class RequestCounter {
  private stats = {
    totalRequests: 0,
    requestsInLastMinute: 0,
    recentRequests: [] as {timestamp: number, endpoint: string}[],
    maxRequestsPerMinute: 1000,
    blocked: false,
    blockTimeRemaining: 0,
    lastCalculation: Date.now(),
    trackingPeriod: 60 * 1000, // 1 minute
  };

  trackRequest(endpoint: string): boolean {
    this.stats.totalRequests++;
    const now = Date.now();
    
    // Optimisation: Si l'endpoint est realtime.list_changes, traiter différemment
    if (endpoint.includes('realtime.list_changes')) {
      return true; // Toujours autoriser car nous avons une stratégie de cache spécifique
    }
    
    // Ajouter cette requête à l'historique
    this.stats.recentRequests.push({
      timestamp: now,
      endpoint
    });
    
    // Nettoyer les anciennes requêtes
    this.stats.recentRequests = this.stats.recentRequests.filter(
      req => now - req.timestamp < this.stats.trackingPeriod
    );
    
    // Calculer le nombre de requêtes dans la dernière minute
    this.stats.requestsInLastMinute = this.stats.recentRequests.length;
    
    // Vérifier si nous devons limiter les requêtes
    if (this.stats.requestsInLastMinute > this.stats.maxRequestsPerMinute) {
      return false; // Trop de requêtes
    }
    
    return true; // Requête autorisée
  }
}

// Créer une instance du compteur de requêtes
const requestCounter = new RequestCounter();

// Cache global pour le client Supabase
const clientCache = new Map();

// Type pour le cache des handlers de subscription
interface ChannelHandler {
  event: string;
  callback: Function;
}

// Cache pour les gestionnaires d'événements par canal
const channelHandlersCache = new Map<string, ChannelHandler[]>();

// Créer le client Supabase pour le composant
export function createClient() {
  let client = clientCache.get('client');
  
  if (!client) {
    client = createClientComponentClient<Database>();
    clientCache.set('client', client);
  }
  
  return client;
}

// Créer un proxy pour intercepter les appels au client Supabase et surveiller le nombre de requêtes
function createMonitoredClient() {
  // Créer le client original
  const originalClient = createClientComponentClient<Database>();
  
  // Créer un proxy pour intercepter les appels
  return new Proxy(originalClient, {
    get(target, prop, receiver) {
      // Obtenir la propriété originale
      const originalValue = Reflect.get(target, prop, receiver);
      
      // Intercepter spécifiquement l'appel à rpc pour optimiser list_changes
      if (prop === 'rpc') {
        return function(...args: any[]) {
          // Si c'est un appel à realtime.list_changes, utiliser le cache
          if (args[0] === 'realtime.list_changes') {
            // Créer une clé de cache basée sur les arguments
            const cacheKey = `list_changes_${JSON.stringify(args)}`;
            
            // Vérifier si nous avons une version en cache récente
            const cached = LIST_CHANGES_CACHE.get(cacheKey);
            const now = Date.now();
            
            if (cached && now - cached.timestamp < CACHE_TTL) {
              // console.log(`[Cache] Utilisation du cache pour realtime.list_changes`);
              return Promise.resolve(cached.data);
            }
            
            // Vérifier si une requête identique est déjà en cours
            const pendingRequest = PENDING_REQUESTS.get(cacheKey);
            if (pendingRequest) {
              // console.log(`[Cache] Réutilisation d'une requête en cours pour realtime.list_changes`);
              return pendingRequest;
            }
            
            // Si pas en cache ou cache expiré et pas de requête en cours
            const result = originalValue.apply(target, args);
            
            // Stocker la promesse pour éviter les requêtes dupliquées
            PENDING_REQUESTS.set(cacheKey, result);
            
            // Une fois la requête terminée, mettre en cache et nettoyer
            result.then(
              (data: any) => {
                LIST_CHANGES_CACHE.set(cacheKey, {
                  data,
                  timestamp: now
                });
                PENDING_REQUESTS.delete(cacheKey);
                return data;
              },
              (error: any) => {
                PENDING_REQUESTS.delete(cacheKey);
                throw error;
              }
            );
            
            return result;
          }
          
          // Pour les autres appels rpc, comportement normal
          return originalValue.apply(target, args);
        };
      }
      
      // Si c'est une fonction, l'envelopper pour surveiller les appels
      if (typeof originalValue === 'function') {
        return function(...args: any[]) {
          // Suivre la requête
          const isAllowed = requestCounter.trackRequest(`supabase.${String(prop)}`);
          
          // Si trop de requêtes, retarder au lieu de bloquer
          if (!isAllowed) {
            console.warn(`[Supabase] Requête ${String(prop)} retardée (trop de requêtes)`);
            return new Promise((resolve) => {
              setTimeout(() => {
                // console.log(`[Supabase] Réessai de la requête ${String(prop)}`);
                resolve(originalValue.apply(target, args));
              }, 1500); // Attendre 1.5 secondes avant de réessayer
            });
          }
          
          // Sinon, exécuter la requête originale
          return originalValue.apply(target, args);
        };
      }
      
      // Si c'est un objet (comme .from(), .auth(), etc.), intercepter récursivement
      if (originalValue && typeof originalValue === 'object') {
        return new Proxy(originalValue, {
          get(subTarget, subProp, subReceiver) {
            const subValue = Reflect.get(subTarget, subProp, subReceiver);
            
            // Intercepter les fonctions comme .select(), .insert(), etc.
            if (typeof subValue === 'function') {
              return function(...args: any[]) {
                // Suivre la requête
                const endpointName = `supabase.${String(prop)}.${String(subProp)}`;
                const isAllowed = requestCounter.trackRequest(endpointName);
                
                // Si trop de requêtes, retarder au lieu de bloquer
                if (!isAllowed) {
                  console.warn(`[Supabase] Requête ${endpointName} retardée (trop de requêtes)`);
                  return new Promise((resolve) => {
                    setTimeout(() => {
                      // console.log(`[Supabase] Réessai de la requête ${endpointName}`);
                      resolve(subValue.apply(subTarget, args));
                    }, 1500); // Attendre 1.5 secondes avant de réessayer
                  });
                }
                
                // Sinon, exécuter la requête originale
                return subValue.apply(subTarget, args);
              };
            }
            
            return subValue;
          }
        });
      }
      
      return originalValue;
    }
  });
}

// Helper pour faciliter l'utilisation - une seule instance sera créée
export const supabase = createMonitoredClient();

// Gestionnaire amélioré pour les canaux de souscription
export const channelManager = {
  activeChannels: new Map<string, any>(),
  
  registerChannel(channelName: string, channel: any) {
    this.activeChannels.set(channelName, channel);
    // console.log(`Canal enregistré: ${channelName}`);
    return channel;
  },
  
  removeChannel(channelName: string) {
    if (this.activeChannels.has(channelName)) {
      const channel = this.activeChannels.get(channelName);
      this.activeChannels.delete(channelName);
      // console.log(`Canal supprimé: ${channelName}`);
      try {
        if (channel && typeof channel.unsubscribe === 'function') {
          return supabase.removeChannel(channel);
        }
      } catch (error) {
        console.error(`Erreur lors de la suppression du canal ${channelName}:`, error);
      }
    }
    return false;
  },
  
  removeAllChannels() {
    // console.log(`Nettoyage de ${this.activeChannels.size} canaux actifs`);
    for (const [name, channel] of this.activeChannels.entries()) {
      try {
        if (channel && typeof channel.unsubscribe === 'function') {
          supabase.removeChannel(channel);
          // console.log(`Canal supprimé: ${name}`);
        }
      } catch (error) {
        console.error(`Erreur lors de la suppression du canal ${name}:`, error);
      }
    }
    this.activeChannels.clear();
  }
};

// Test de connexion à la base de données
export async function testConnection() {
  try {
    const { data, error } = await supabase
      .from('services')
      .select('count')
      .limit(1);
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    return { success: true, data };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erreur inconnue' 
    };
  }
} 