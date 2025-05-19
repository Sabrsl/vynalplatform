"use client";

import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { useMessagingStore } from '@/lib/stores/useMessagingStore';
import { Loader } from '@/components/ui/loader';
import { useAuth } from '@/hooks/useAuth';
import { useInView } from 'react-intersection-observer';
import { 
  getCachedData, 
  setCachedData
} from '@/lib/optimizations/cache';
import dynamic from 'next/dynamic';
import { DirectMessagingProps } from './messaging-types';
import { Conversation } from './messaging-types';
import { channelManager } from '@/lib/supabase/client';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { MessagingInterfaceProps } from './messaging-types';
import requestCoordinator from '@/lib/optimizations/requestCoordinator';
import { NavigationLoadingState } from '@/app/providers';

// Squelette de chargement pour la liste de conversations
const ConversationListSkeleton = () => (
  <div className="flex flex-col h-full">
    <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-800">
      <div className="h-7 w-32 bg-vynal-purple-secondary/30 rounded mb-4 animate-pulse"></div>
      <div className="h-10 w-full bg-vynal-purple-secondary/30 rounded-full animate-pulse"></div>
    </div>
    <div className="flex-1 p-2 space-y-2">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center p-3 mb-1 rounded-lg bg-white dark:bg-gray-850">
          <div className="h-12 w-12 rounded-full bg-vynal-purple-secondary/30 flex-shrink-0 animate-pulse"></div>
          <div className="ml-3 flex-1 space-y-2">
            <div className="h-4 w-1/2 bg-vynal-purple-secondary/30 rounded animate-pulse"></div>
            <div className="h-3 w-4/5 bg-vynal-purple-secondary/30 rounded animate-pulse"></div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Squelette de chargement pour la fenêtre de chat
const ChatWindowSkeleton = () => (
  <div className="flex flex-col h-full">
    <div className="flex items-center px-4 py-3 border-b border-gray-200 dark:border-gray-800 bg-gradient-to-r from-pink-600 to-purple-600">
      <div className="h-10 w-10 rounded-full bg-vynal-purple-secondary/30"></div>
      <div className="ml-3">
        <div className="h-4 w-32 bg-vynal-purple-secondary/30 rounded mb-1"></div>
        <div className="h-3 w-24 bg-vynal-purple-secondary/30 rounded"></div>
      </div>
    </div>
    <div className="flex-1 p-4 bg-gray-50 dark:bg-gray-900">
      <div className="space-y-4 w-full max-w-md mx-auto">
        {[...Array(4)].map((_, i) => (
          <div key={i} className={`flex items-start ${i % 2 === 0 ? 'justify-end' : ''}`}>
            {i % 2 !== 0 && (
              <div className="h-8 w-8 rounded-full bg-vynal-purple-secondary/30 mr-2"></div>
            )}
            <div 
              className={`h-[60px] rounded-2xl ${i % 2 === 0 ? 'bg-vynal-purple-secondary/30 w-[65%]' : 'bg-vynal-purple-secondary/30 w-[70%]'}`}
            ></div>
          </div>
        ))}
      </div>
    </div>
    <div className="p-3 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
      <div className="flex">
        <div className="flex space-x-2 mr-2">
          <div className="h-10 w-10 rounded-full bg-vynal-purple-secondary/30"></div>
          <div className="h-10 w-10 rounded-full bg-vynal-purple-secondary/30"></div>
        </div>
        <div className="h-10 flex-1 bg-vynal-purple-secondary/30 rounded-full"></div>
      </div>
    </div>
  </div>
);

// Importer les composants nécessaires
const ConversationList = dynamic(() => import('./ConversationList'), {
  loading: () => <ConversationListSkeleton />,
  ssr: false
});

const ChatWindow = dynamic(() => import('./ChatWindow'), {
  loading: () => <ChatWindowSkeleton />,
  ssr: false
});

// Constantes locales
const CONVERSATIONS_KEY = 'direct_conversations';
const CACHE_EXPIRY = 60 * 1000; // 1 minute
const REFRESH_INTERVAL_CLIENT = 15000; // 15 secondes
const REFRESH_INTERVAL_FREELANCE = 30000; // 30 secondes

// Classe de transition pour les animations
const slideIn = "animate-in fade-in slide-in-from-bottom-4 duration-300 ease-out";

// Optimiser le traitement des avatars pour éviter les reflows
// Utiliser cette fonction au lieu de manipuler directement les URLs dans le render
const optimizeAvatarUrl = (avatarUrl: string | null | undefined): string | null => {
  if (!avatarUrl) return null;
  
  // Ne pas manipuler les URLs déjà complètes
  if (avatarUrl.startsWith('http') || avatarUrl.startsWith('data:')) {
    return avatarUrl;
  }
  
  // Ajouter le domaine Supabase si l'URL est relative
  if (avatarUrl.startsWith('/')) {
    return `${process.env.NEXT_PUBLIC_SUPABASE_URL || ''}${avatarUrl}`;
  }
  
  return avatarUrl;
};

// Fonction pour charger les conversations avec une coordination
const loadConversationsCoordinated = (
  userId: string, 
  setIsLoading: (val: boolean) => void, 
  fetchFunc: (userId: string, options?: any) => Promise<any>
) => {
  if (!userId) return Promise.resolve([]);
  
  // Ne pas charger les conversations si la navigation est en cours
  if (NavigationLoadingState.isNavigating) {
    console.log("[DirectMessaging] Navigation en cours, chargement des conversations reporté");
    return Promise.resolve([]);
  }
  
  setIsLoading(true);
  
  // Utiliser le coordinateur pour éviter les multiples appels API simultanés
  return requestCoordinator.scheduleRequest(
    `load_conversations_${userId}`,
    async () => {
      try {
        return await fetchFunc(userId);
      } finally {
        setIsLoading(false);
      }
    },
    'medium' // Priorité moyenne pour les conversations
  );
};

// Charger les messages d'une conversation avec coordination
const loadMessagesCoordinated = (
  conversationId: string, 
  setIsLoadingMessages: (val: boolean) => void, 
  fetchFunc: (conversationId: string) => Promise<any>
) => {
  if (!conversationId) return Promise.resolve([]);
  
  // Ne pas charger les messages si la navigation est en cours
  if (NavigationLoadingState.isNavigating) {
    console.log("[DirectMessaging] Navigation en cours, chargement des messages reporté");
    return Promise.resolve([]);
  }
  
  setIsLoadingMessages(true);
  
  return requestCoordinator.scheduleRequest(
    `load_messages_${conversationId}`,
    async () => {
      try {
        return await fetchFunc(conversationId);
      } finally {
        setIsLoadingMessages(false);
      }
    },
    'high' // Priorité haute pour les messages
  );
};

const DirectMessagingInterface: React.FC<DirectMessagingProps> = ({
  initialConversationId,
  receiverId,
  isFreelance,
  className = ''
}) => {
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showContent, setShowContent] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [conversationsLoading, setConversationsLoading] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Référence pour les tentatives de chargement
  const retryCountRef = useRef(0);
  const maxRetries = 3;
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  // Référence pour éviter les actualisations en boucle
  const didInitialUpdateRef = useRef(false);
  // Référence pour stocker l'ID de la conversation active
  const conversationIdRef = useRef<string | null>(null);
  
  // Ajouter une référence pour suivre si un chargement est nécessaire après la navigation
  const needsRefreshAfterNavigation = useRef(false);
  
  // Récupérer les fonctions du store
  const { 
    activeConversation,
    setActiveConversation,
    currentConversation,
    setCurrentConversation,
    conversations,
    messages,
    fetchConversations,
    fetchMessages,
    setupRealtimeSubscriptions,
    createConversation,
    setConversations,
    isLoading,
    error
  } = useMessagingStore();
  
  // Observer l'interface pour détecter quand elle est visible
  const { ref: interfaceRef, inView } = useInView({
    threshold: 0.1,
    triggerOnce: false,
    // Ajouter un délai pour éviter les reflows excessifs pendant le scroll
    delay: 200
  });
  
  // Fonction pour récupérer les conversations mises en cache
  const getCachedConversations = useCallback(() => {
    if (!user) return null;
    
    const isFreelanceStr = isFreelance ? 'freelance' : 'client';
    const cacheKey = `${CONVERSATIONS_KEY}_${user.id}_${isFreelanceStr}`;
    return getCachedData(cacheKey) as Conversation[] | null;
  }, [user?.id, isFreelance]);
  
  // Définir les fonctions de mise à jour et d'initialisation avec useCallback
  const handleRefreshMessaging = useCallback(async () => {
    if (!user?.id || !mounted || isRefreshing || NavigationLoadingState.isNavigating) {
      // Si la navigation est en cours, marquer qu'un rafraîchissement sera nécessaire plus tard
      if (NavigationLoadingState.isNavigating) {
        needsRefreshAfterNavigation.current = true;
      }
      return;
    }
    
    setIsRefreshing(true);
    
    try {
      // Invalider le cache des conversations pour forcer une nouvelle requête
      useMessagingStore.getState().invalidateCache('conversations', user.id);
      
      // Récupérer les conversations mises à jour
      await loadConversationsCoordinated(
        user.id,
        () => {}, // pas besoin de setter loading state ici
        fetchConversations
      );
      
      // Si une conversation est active, recharger ses messages
      if (activeConversation?.id) {
        await loadMessagesCoordinated(
          activeConversation.id,
          () => {}, // pas besoin de setter loading state ici
          fetchMessages
        );
      }
      
      // Mettre à jour le timestamp du dernier rafraîchissement
      localStorage.setItem(`last_direct_messaging_update_${isFreelance ? 'freelance' : 'client'}`, Date.now().toString());
    } finally {
      setIsRefreshing(false);
    }
  }, [user?.id, mounted, isRefreshing, fetchConversations, fetchMessages, activeConversation, isFreelance]);
  
  // Fonction pour initialiser la messagerie
  const handleInitializeMessaging = useCallback(async () => {
    if (!user?.id || !mounted || isRefreshing || initialized || NavigationLoadingState.isNavigating) {
      // Si la navigation est en cours, marquer qu'un rafraîchissement sera nécessaire plus tard
      if (NavigationLoadingState.isNavigating) {
        needsRefreshAfterNavigation.current = true;
      }
      return;
    }
    
    try {
      setLoadingConversations(true);
      
      // Vérifier si des conversations sont déjà disponibles dans le cache
      const cachedConversations = getCachedConversations();
      if (cachedConversations && Array.isArray(cachedConversations) && cachedConversations.length > 0) {
        setConversations(cachedConversations);
      }
      
      // Établir l'abonnement en temps réel
      const cleanup = setupRealtimeSubscriptions(user.id);
      cleanupRef.current = cleanup;
      
      // Mettre à jour l'état d'initialisation
      setInitialized(true);
      setIsInitialLoad(false);
      
      // Charger les conversations
      await loadConversationsCoordinated(
        user.id,
        setLoadingConversations,
        fetchConversations
      );
      
      // Si un ID de conversation initial est spécifié, l'activer
      if (initialConversationId) {
        const targetConversation = conversations.find(c => c.id === initialConversationId);
        if (targetConversation) {
          setActiveConversation(targetConversation);
          setCurrentConversation(targetConversation);
        }
      }
      
    } catch (error) {
      console.error("Erreur lors de l'initialisation de la messagerie:", error);
      retryCountRef.current += 1;
      
      if (retryCountRef.current < maxRetries) {
        setTimeout(() => {
          handleInitializeMessaging();
        }, 1000 * Math.pow(2, retryCountRef.current));
      } else {
        setLoadError("Impossible de charger les messages. Veuillez réessayer.");
      }
    } finally {
      setLoadingConversations(false);
    }
  }, [user?.id, mounted, isRefreshing, initialized, fetchConversations, setupRealtimeSubscriptions, getCachedConversations, conversations, initialConversationId, setActiveConversation, setCurrentConversation, setConversations]);
  
  // Ajouter un écouteur pour l'événement de fin de navigation
  useEffect(() => {
    const handleNavigationEnd = () => {
      if (needsRefreshAfterNavigation.current && user?.id && mounted) {
        console.log("[DirectMessaging] Navigation terminée, reprise du chargement");
        needsRefreshAfterNavigation.current = false;
        
        // Petit délai pour s'assurer que tout est stabilisé après la navigation
        setTimeout(() => {
          if (initialized) {
            handleRefreshMessaging();
          } else {
            handleInitializeMessaging();
          }
        }, 100);
      }
    };
    
    window.addEventListener('vynal:navigation-end', handleNavigationEnd);
    
    return () => {
      window.removeEventListener('vynal:navigation-end', handleNavigationEnd);
    };
  }, [user?.id, mounted, initialized, handleRefreshMessaging, handleInitializeMessaging]);

  // Mémoriser le tri des conversations
  const sortedConversations = useMemo(() => {
    if (!conversations.length) return [];
    
    // Trier les conversations par la date du dernier message
    return [...conversations].sort((a, b) => {
      const aTime = a.last_message_time || a.updated_at || a.created_at;
      const bTime = b.last_message_time || b.updated_at || b.created_at;
      return new Date(bTime).getTime() - new Date(aTime).getTime();
    });
  }, [conversations]);

  // Effet pour charger les conversations initialement
  useEffect(() => {
    if (user?.id && !conversationsLoading) {
      loadConversationsCoordinated(
        user.id, 
        setConversationsLoading, 
        fetchConversations
      );
    }
  }, [user?.id, fetchConversations, conversationsLoading]);

  // Effet pour charger les messages d'une conversation
  useEffect(() => {
    if (activeConversation?.id && !messagesLoading) {
      // Ne charger que si l'ID de conversation a changé
      if (conversationIdRef.current !== activeConversation.id) {
        conversationIdRef.current = activeConversation.id;
        loadMessagesCoordinated(
          activeConversation.id,
          setMessagesLoading,
          fetchMessages
        );
      }
    }
  }, [activeConversation?.id, fetchMessages, messagesLoading]);

  // Rafraîchir les données lorsque l'interface devient visible - mais pas à chaque render
  useEffect(() => {
    let refreshTimeout: NodeJS.Timeout | null = null;
    let isFirstLoad = true;
    
    // Fonction de rafraîchissement contrôlée par délai
    const refreshConversations = () => {
      if (!user?.id || !mounted || isRefreshing || NavigationLoadingState.isNavigating) {
        // Si la navigation est en cours, marquer qu'un rafraîchissement sera nécessaire plus tard
        if (NavigationLoadingState.isNavigating) {
          needsRefreshAfterNavigation.current = true;
        }
        return;
      }
      
      const lastUpdate = localStorage.getItem(`last_direct_messaging_update_${isFreelance ? 'freelance' : 'client'}`);
      const now = Date.now();
      
      // Définir un intervalle minimum entre les mises à jour pour éviter trop de requêtes
      const minTimeBetweenUpdates = 60000; // 1 minute
      
      if (isFirstLoad || !lastUpdate || now - parseInt(lastUpdate) > minTimeBetweenUpdates) {
        // Rafraîchir les conversations avec le coordinateur de requêtes
        loadConversationsCoordinated(
          user.id,
          () => {}, // pas besoin de setter loading state ici
          fetchConversations
        );
        
        // Mettre à jour le timestamp du dernier rafraîchissement
        localStorage.setItem(`last_direct_messaging_update_${isFreelance ? 'freelance' : 'client'}`, now.toString());
        isFirstLoad = false;
      }
    };
    
    // Effectuer le rafraîchissement initial après un délai
    if (inView && user?.id && mounted && !isInitialLoad) {
      refreshTimeout = setTimeout(refreshConversations, 500);
    }
    
    return () => {
      if (refreshTimeout) clearTimeout(refreshTimeout);
    };
  }, [inView, user?.id, mounted, isInitialLoad, isLoading, fetchConversations, isFreelance]);

  // Assurer la propreté des abonnements lors de la navigation - safety net
  useEffect(() => {
    // Supprimer les anciens abonnements de cet utilisateur
    if (user?.id) {
      // Au lieu d'utiliser cleanupRedundantChannels, implémentons la logique directement ici
      let cleanedCount = 0;
      
      // 1. Réutiliser la logique de nettoyage des canaux existante
      // Vérifier les canaux qui contiennent l'ID de l'utilisateur
      const userChannelPattern = `messages-for-user-${user.id}`;
      const channels = Array.from(channelManager.activeChannels.keys())
        .filter(name => name.includes(user.id) || name.includes(userChannelPattern));
      
      // 2. Regrouper les canaux par table
      const channelsByTable = new Map<string, string[]>();
      
      channels.forEach(channelName => {
        // Extraire la table du nom du canal si possible
        const tableMatch = channelName.match(/postgres_changes.*table=([a-zA-Z_]+)/);
        const tableName = tableMatch ? tableMatch[1] : 
                         channelName.includes('messages') ? 'messages' :
                         channelName.includes('conversations') ? 'conversations' :
                         channelName.includes('services') ? 'services' :
                         channelName.includes('reviews') ? 'reviews' : 
                         channelName.includes('profiles') ? 'profiles' : null;
        
        if (tableName) {
          if (!channelsByTable.has(tableName)) {
            channelsByTable.set(tableName, []);
          }
          channelsByTable.get(tableName)!.push(channelName);
        }
      });
      
      // 3. Pour chaque table, ne garder que le canal le plus récent
      for (const [_, tableChannels] of channelsByTable.entries()) {
        if (tableChannels.length > 1) {
          // Trier par timestamp (plus récent d'abord)
          const sortedChannels = [...tableChannels].sort((a, b) => {
            const tsA = a.includes('_t') ? parseInt(a.split('_t').pop() || '0') : 0;
            const tsB = b.includes('_t') ? parseInt(b.split('_t').pop() || '0') : 0;
            return tsB - tsA;
          });
          
          // Garder le plus récent, supprimer les autres
          const [keep, ...remove] = sortedChannels;
          
          for (const channelName of remove) {
            channelManager.removeChannel(channelName);
            cleanedCount++;
          }
        }
      }
      
      if (cleanedCount > 0) {
        console.log(`Nettoyage automatique: ${cleanedCount} canaux redondants supprimés pour l'utilisateur ${user.id}`);
      }
    }
    
    // Nettoyer tous les canaux au déchargement de la page
    const handleBeforeUnload = () => {
      console.log("Nettoyage complet avant déchargement de la page");
      if (user?.id) {
        // Nettoyer spécifiquement les canaux de cet utilisateur
        const userChannelPatterns = [
          `messages-for-user-${user.id}`,
          `presence-for-user-${user.id}`,
          `user-conversations-${user.id}`
        ];
        
        Array.from(channelManager.activeChannels.keys())
          .filter(name => userChannelPatterns.some(pattern => name.includes(pattern)))
          .forEach(channelName => {
            channelManager.removeChannel(channelName);
          });
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      
      // Nettoyage explicite lors du démontage du composant
      if (cleanupRef.current) {
        try {
          console.log("Exécution de la fonction de nettoyage des abonnements");
          cleanupRef.current();
          cleanupRef.current = null;
        } catch (error) {
          console.error("Erreur lors du nettoyage des abonnements:", error);
        }
      }
    };
  }, [user?.id]);

  // Effet pour écouter les événements d'actualisation externes
  useEffect(() => {
    if (!user?.id) return;

    // Gestionnaire pour les événements d'actualisation des conversations
    const handleConversationsRefreshEvent = (event: Event) => {
      const customEvent = event as CustomEvent;
      // Vérifier si l'événement concerne cet utilisateur
      if (customEvent.detail?.userId === user.id && !isRefreshing) {
        // Actualiser les conversations sans montrer l'animation
        fetchConversations(user.id);
      }
    };

    // Écouter les événements
    window.addEventListener('vynal:conversations-refreshed', handleConversationsRefreshEvent);

    return () => {
      // Nettoyer les écouteurs
      window.removeEventListener('vynal:conversations-refreshed', handleConversationsRefreshEvent);
    };
  }, [user?.id, fetchConversations, isRefreshing]);

  // Effet pour initialiser la messagerie
  useEffect(() => {
    // Éviter les initialisations multiples
    if (initialized || !user?.id || !mounted) return;
    
    // Si la navigation est en cours, ne pas initialiser maintenant, mais marquer comme nécessaire pour plus tard
    if (NavigationLoadingState.isNavigating) {
      needsRefreshAfterNavigation.current = true;
      return;
    }
    
    // Initialiser la messagerie
    handleInitializeMessaging();
    
  }, [user?.id, mounted, initialized, handleInitializeMessaging]);

  // Optimiser l'état de chargement
  if (isLoading && !mounted) {
    return (
      <div className={`h-[calc(100vh-200px)] grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-0 bg-white dark:bg-gray-950 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-800 ${slideIn}`}>
        <div className="md:col-span-1 border-r border-gray-200 dark:border-gray-800 h-full">
          <ConversationListSkeleton />
        </div>
        <div className="hidden md:block md:col-span-2 lg:col-span-3 h-full">
          <ChatWindowSkeleton />
        </div>
      </div>
    );
  }
  
  // Si une erreur s'est produite
  if ((error || loadError) && !isLoading) {
    return (
      <div className="w-full p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600 text-sm">{loadError || error}</p>
        <button 
          onClick={() => {
            retryCountRef.current = 0;
            setLoadError(null);
            if (user?.id) fetchConversations(user.id);
          }}
          className="mt-4 px-3 py-1 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors"
        >
          Réessayer
        </button>
      </div>
    );
  }
  
  // Interface de messagerie directe
  return (
    <div 
      ref={interfaceRef}
      className={`flex flex-col md:flex-row w-full h-[calc(100vh-8rem)] bg-black/5 dark:bg-gray-950 rounded-none md:rounded-lg shadow-sm border-x-0 border-t-0 md:border border-purple-800/20 overflow-hidden ${slideIn} ${className}`}
    >
      {/* Sidebar des conversations - caché sur mobile si une conversation est active */}
      <div className={`${showMobileMenu || !activeConversation ? 'flex' : 'hidden'} md:flex md:w-80 lg:w-96 border-r border-purple-800/10 flex-col h-full`}>
        <ConversationList 
          conversations={sortedConversations}
          onSelectConversation={(id) => {
            const selectedConversation = sortedConversations.find(c => c.id === id);
            if (selectedConversation) {
              useMessagingStore.setState({ activeConversation: selectedConversation });
              fetchMessages(id);
              setShowMobileMenu(false);
            }
          }}
          activeConversationId={activeConversation?.id}
          isFreelance={isFreelance}
          showOrderConversations={false}
          onRefresh={handleRefreshMessaging}
          isRefreshing={isRefreshing}
        />
      </div>
      
      {/* Fenêtre de chat - montrée sur mobile uniquement si une conversation est active */}
      <div className={`${!showMobileMenu && activeConversation ? 'flex' : 'hidden'} md:flex flex-1 flex-col h-full`}>
        {activeConversation ? (
          <ChatWindow 
            conversation={activeConversation}
            onBack={() => setShowMobileMenu(true)}
            isFreelance={isFreelance}
            key={activeConversation.id} // Forcer le remontage lors du changement de conversation
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
            <p>Sélectionnez une conversation pour commencer à discuter</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(DirectMessagingInterface); 