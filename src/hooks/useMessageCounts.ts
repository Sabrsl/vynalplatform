import { useState, useEffect, useCallback, useRef } from 'react';
import { useUser } from './useUser';
import { supabase } from '@/lib/supabase/client';
import { PostgrestError } from '@supabase/supabase-js';
import { useLastRefresh } from './useLastRefresh';

// Importations directes depuis les modules sources pour éviter les problèmes de résolution
import { 
  getCachedData, 
  setCachedData,
  invalidateCache
} from '@/lib/optimizations/cache';

interface MessageCounts {
  totalUnread: number;
  conversationCounts: Record<string, number>;
}

interface UseMessageCountsOptions {
  useCache?: boolean;
  throttleMs?: number;
  timeoutMs?: number;
}

interface UseMessageCountsReturn {
  totalUnread: number;
  conversationCounts: Record<string, number>;
  loading: boolean;
  error: Error | PostgrestError | null;
  isRefreshing: boolean;
  refreshCounts: () => Promise<void>;
  lastRefresh: number | null;
  getLastRefreshText: () => string;
}

// Constantes locales pour éviter les dépendances externes problématiques
const MESSAGE_COUNTS_KEY = 'message_counts';
const CACHE_EXPIRY_SHORT = 60 * 1000; // 1 minute
const CACHE_EXPIRY_MEDIUM = 30 * 60 * 1000; // 30 minutes

// Constantes pour la configuration du hook
const DEFAULT_THROTTLE_MS = 3000;
const DEFAULT_TIMEOUT_MS = 5000;
const DEFAULT_COUNTS: MessageCounts = { totalUnread: 0, conversationCounts: {} };

/**
 * Hook pour récupérer et mettre à jour les compteurs de messages non lus
 * Version améliorée avec meilleure gestion du cache et des erreurs
 */
export function useMessageCounts(options: UseMessageCountsOptions = {}): UseMessageCountsReturn {
  const { 
    useCache = true,
    throttleMs = DEFAULT_THROTTLE_MS,
    timeoutMs = DEFAULT_TIMEOUT_MS
  } = options;
  
  const { profile } = useUser();
  const [counts, setCounts] = useState<MessageCounts>(DEFAULT_COUNTS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | PostgrestError | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Références pour éviter les conditions de course
  const fetchInProgressRef = useRef<boolean>(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastFetchTimeRef = useRef<number>(0);
  const { lastRefresh, updateLastRefresh, getLastRefreshText } = useLastRefresh();

  // Générer une clé de cache unique avec mémoisation
  const getCacheKey = useCallback((): string | null => {
    if (!useCache || !profile?.id) return null;
    return `${MESSAGE_COUNTS_KEY}_${profile.id}`;
  }, [profile?.id, useCache]);

  // Fonction pour charger les données avec gestion améliorée des erreurs
  const fetchCounts = useCallback(async (forceRefresh = false): Promise<void> => {
    // Vérification de l'ID de profil
    if (!profile?.id) {
      setError(new Error('Aucun profil utilisateur disponible'));
      setLoading(false);
      return;
    }
    
    // Éviter les appels simultanés
    if (fetchInProgressRef.current && !forceRefresh) {
      return;
    }
    
    // Throttling pour éviter les appels excessifs
    const now = Date.now();
    if (!forceRefresh && now - lastFetchTimeRef.current < throttleMs) {
      return;
    }
    
    // Annuler toute requête en cours
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Créer un nouveau contrôleur d'annulation
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;
    
    fetchInProgressRef.current = true;
    lastFetchTimeRef.current = now;

    // Utilisation du cache pour une réponse immédiate
    if (useCache && !forceRefresh) {
      const cacheKey = getCacheKey();
      if (cacheKey) {
        const cachedCounts = getCachedData<MessageCounts>(cacheKey);
        
        if (cachedCounts) {
          setCounts(cachedCounts);
          setLoading(false);
          
          // Actualisation asynchrone en arrière-plan sans bloquer l'interface utilisateur
          setTimeout(() => refreshInBackground(), 0);
          return;
        }
      }
    }

    try {
      !isRefreshing && setLoading(true);
      setError(null);

      // Utilisation d'AbortController pour annuler proprement
      const timeoutId = setTimeout(() => {
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
      }, timeoutMs);
      
      // Requête optimisée pour obtenir uniquement les données nécessaires
      const { data, error: supabaseError } = await supabase
        .from('messages')
        .select('conversation_id')
        .neq('sender_id', profile.id)
        .eq('read', false)
        .abortSignal(signal);
      
      clearTimeout(timeoutId);
      
      if (supabaseError) throw supabaseError;
      if (signal.aborted) throw new Error('Requête annulée');

      if (data) {
        // Traitement optimisé des données - utilisation d'un reduce plutôt qu'un forEach
        const conversationCounts = data.reduce<Record<string, number>>((acc, message) => {
          const convId = message.conversation_id;
          if (!convId) return acc;
          
          acc[convId] = (acc[convId] || 0) + 1;
          return acc;
        }, {});
        
        const totalUnread = data.length;
        const messageData: MessageCounts = { totalUnread, conversationCounts };
        
        setCounts(messageData);
        
        // Mise en cache avec expiration adaptative
        if (useCache) {
          const cacheKey = getCacheKey();
          if (cacheKey) {
            setCachedData<MessageCounts>(cacheKey, messageData, { 
              expiry: totalUnread > 100 ? CACHE_EXPIRY_SHORT : CACHE_EXPIRY_MEDIUM
            });
          }
        }
        
        // Mise à jour du timestamp de rafraîchissement
        updateLastRefresh();
      }
    } catch (err) {
      console.error('Erreur lors de la récupération des messages:', err);
      
      // Gestion améliorée des erreurs - conservation de la structure complète
      if (err instanceof Error) {
        setError(err);
      } else {
        setError(new Error('Erreur inconnue lors de la récupération des messages'));
      }
      
      // Ne pas réinitialiser les compteurs en cas d'erreur si nous avons déjà des données
      if (counts.totalUnread === 0) {
        setCounts(DEFAULT_COUNTS);
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
      fetchInProgressRef.current = false;
      abortControllerRef.current = null;
    }
  }, [profile?.id, getCacheKey, updateLastRefresh, useCache, throttleMs, timeoutMs, isRefreshing, counts.totalUnread]);

  // Rafraîchir les données en arrière-plan sans impacter l'UX
  const refreshInBackground = useCallback((): void => {
    if (isRefreshing || !useCache) return;
    
    setIsRefreshing(true);
    
    // Utiliser requestIdleCallback si disponible, sinon setTimeout avec priorité basse
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      (window as any).requestIdleCallback(() => fetchCounts(true), { timeout: 2000 });
    } else {
      setTimeout(() => fetchCounts(true), 100);
    }
  }, [isRefreshing, fetchCounts, useCache]);

  // Fonction publique pour forcer un rafraîchissement
  const refreshCounts = useCallback(async (): Promise<void> => {
    // Invalider le cache si utilisé
    if (useCache) {
      const cacheKey = getCacheKey();
      if (cacheKey) {
        invalidateCache(cacheKey);
      }
    }
    
    // Recharger les données avec priorité
    return fetchCounts(true);
  }, [getCacheKey, fetchCounts, useCache]);

  // Initialisation et abonnement aux mises à jour
  useEffect(() => {
    if (!profile?.id) return;
    
    // Chargement initial
    fetchCounts();
    
    // Abonnement aux changements en temps réel
    const subscription = supabase
      .channel('message-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'messages',
        filter: `sender_id=neq.${profile.id} AND read=eq.false`
      }, () => {
        // Rafraîchir intelligemment - avec debounce intégré
        if (Date.now() - lastFetchTimeRef.current > throttleMs) {
          refreshInBackground();
        }
      })
      .subscribe();
    
    // Nettoyage à la désactivation du composant
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      supabase.removeChannel(subscription);
    };
  }, [profile?.id, fetchCounts, refreshInBackground, throttleMs]);

  return {
    totalUnread: counts.totalUnread,
    conversationCounts: counts.conversationCounts,
    loading,
    error,
    isRefreshing,
    refreshCounts,
    lastRefresh,
    getLastRefreshText
  };
}

/**
 * Version optimisée du hook pour compatibilité
 * @deprecated Utilisez useMessageCounts avec l'option {useCache: true}
 */
export function useOptimizedMessageCounts() {
  return useMessageCounts({ useCache: true });
} 