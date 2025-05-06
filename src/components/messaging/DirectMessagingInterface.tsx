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
import { channelManager } from '@/lib/supabase/client';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

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
  
  // Référence pour les tentatives de chargement
  const retryCountRef = useRef(0);
  const maxRetries = 3;
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  
  // Observer l'interface pour détecter quand elle est visible
  const { ref: interfaceRef, inView } = useInView({
    threshold: 0.1,
    triggerOnce: false,
    // Ajouter un délai pour éviter les reflows excessifs pendant le scroll
    delay: 200
  });
  
  // Utiliser le store de messagerie
  const { 
    activeConversation,
    conversations, 
    isLoading,
    error,
    fetchConversations,
    fetchMessages,
    setupRealtimeSubscriptions,
    createConversation,
    setConversations
  } = useMessagingStore();

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

  // Récupérer les conversations déjà mises en cache
  const getCachedConversations = useCallback(() => {
    if (!user?.id) return null;
    
    const cacheKey = `${CONVERSATIONS_KEY}_${user.id}_${isFreelance ? 'freelance' : 'client'}`;
    return getCachedData(cacheKey);
  }, [user?.id, isFreelance]);
  
  // Initialisation des messages et des abonnements
  useEffect(() => {
    // Eviter les initialisations multiples
    if (mounted || !user?.id) return;
    
    const initializeDirectMessaging = async () => {
      try {
        // Charger les conversations de l'utilisateur
        const loadedConversations = await fetchConversations(user.id);
        
        // Trier les conversations par date du dernier message
        const sortedConversations = [...loadedConversations].sort((a, b) => {
          const aDate = a.last_message_time || a.updated_at || a.created_at;
          const bDate = b.last_message_time || b.updated_at || b.created_at;
          
          if (!aDate || !bDate) return 0;
          return new Date(bDate).getTime() - new Date(aDate).getTime();
        });
        
        // Mettre à jour l'état
        setConversations(sortedConversations);
        
        // Si nous avons un ID de conversation initial, charger ses messages
        if (initialConversationId) {
          const loadedMessages = await fetchMessages(initialConversationId);
        }
        // Si nous avons un ID de récepteur, vérifier si une conversation existe déjà ou en créer une nouvelle
        else if (receiverId && receiverId !== user.id) {
          // Rechercher dans les conversations directes uniquement
          const existingConversation = sortedConversations.find(conv => 
            conv.participants.some(p => p.id === receiverId)
          );
          
          if (existingConversation) {
            const loadedMessages = await fetchMessages(existingConversation.id);
          } else {
            // Créer une nouvelle conversation
            const newConversationId = await createConversation([user.id, receiverId]);
            if (newConversationId) {
              const loadedMessages = await fetchMessages(newConversationId);
            }
          }
        }
        
        // Vérifier et mettre à jour les profils participants avec optimisation de performance
        if (loadedConversations && loadedConversations.length > 0) {
          const supabase = createClientComponentClient();
          const verifyParticipants = async () => {
            try {
              // Utiliser une Set pour dédupliquer les IDs
              const incompleteProfileIdsSet = new Set<string>();
          
              // Collecter une seule fois tous les IDs qui ont besoin de mise à jour
              loadedConversations.forEach(conv => {
                conv.participants.forEach(p => {
                  if (!p.avatar_url || !p.full_name || !p.username) {
                    incompleteProfileIdsSet.add(p.id);
                  }
                });
              });
          
              // Convertir en array pour la requête
              const incompleteProfileIds = Array.from(incompleteProfileIdsSet);
          
              // Ne faire la requête que si nécessaire
              if (incompleteProfileIds.length > 0) {
                // Récupérer les informations complètes des profils
                const { data: completeProfiles } = await supabase
                  .from('profiles')
                  .select('id, username, full_name, avatar_url, last_seen')
                  .in('id', incompleteProfileIds);
              
                if (completeProfiles && completeProfiles.length > 0) {
                  // Traitement par lots des URLs d'avatar pour éviter les reflows
                  const processedProfilesMap = new Map();
              
                  // Préparer tous les profils avec leurs URLs d'avatar optimisées
                  completeProfiles.forEach(profile => {
                    processedProfilesMap.set(profile.id, {
                      ...profile,
                      avatar_url: optimizeAvatarUrl(profile.avatar_url)
                    });
                  });
              
                  // Mettre à jour toutes les conversations en une seule opération batch
                  requestAnimationFrame(() => {
                    const updatedConversations = loadedConversations.map(conv => ({
                      ...conv,
                      participants: conv.participants.map(p => {
                        const completeProfile = processedProfilesMap.get(p.id);
                        if (completeProfile) {
                          return {
                            ...p,
                            username: completeProfile.username || p.username || "Utilisateur",
                            full_name: completeProfile.full_name || p.full_name || "Utilisateur",
                            avatar_url: completeProfile.avatar_url || p.avatar_url,
                            last_seen: completeProfile.last_seen || p.last_seen
                          };
                        }
                        return p;
                      })
                    }));
                
                    // Mettre à jour l'état en une seule fois
                    setConversations(updatedConversations);
                  });
                }
              }
            } catch (error) {
              // Gérer l'erreur silencieusement
            }
          };
          
          verifyParticipants();
        }
        
        // Réinitialiser le compteur de tentatives
        retryCountRef.current = 0;
        setLoadError(null);
      } catch (error) {
        console.error("Erreur lors de l'initialisation de la messagerie directe:", error);
        
        // Incrémenter le compteur de tentatives
        retryCountRef.current += 1;
        
        if (retryCountRef.current < maxRetries) {
          // Réessayer après un délai exponentiel
          const retryDelay = 1000 * Math.pow(2, retryCountRef.current - 1);
          console.log(`Nouvelle tentative dans ${retryDelay}ms... (${retryCountRef.current}/${maxRetries})`);
          
          setTimeout(() => {
            initializeDirectMessaging();
          }, retryDelay);
        } else {
          const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
          setLoadError(`Impossible de charger les conversations après ${maxRetries} tentatives. ${errorMessage}`);
        }
      } finally {
        setMounted(true);
        setLoadingConversations(false);
      }
    };
    
    // Lancer l'initialisation
    initializeDirectMessaging();
    
    // Nettoyage lors du démontage du composant
    return () => {
      console.log("Nettoyage des ressources de messagerie...");
      
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
      
      if (cleanupRef.current) {
        try {
          cleanupRef.current();
          cleanupRef.current = null;
        } catch (error) {
          console.error("Erreur lors du nettoyage des abonnements:", error);
        }
      }
    };
  }, [initialized, user?.id, initialConversationId, receiverId, isFreelance]);

  // Rafraîchir les données lorsque l'interface devient visible
  useEffect(() => {
    if (inView && mounted && user?.id && !isInitialLoad && !isLoading) {
      // Interface visible, vérification des mises à jour
      const lastUpdate = localStorage.getItem(`last_direct_messaging_update_${isFreelance ? 'freelance' : 'client'}`);
      const now = Date.now();
      
      // Définir un intervalle minimum entre les mises à jour pour éviter trop de requêtes
      const minTimeBetweenUpdates = 60000; // 1 minute
      
      if (!lastUpdate || now - parseInt(lastUpdate) > minTimeBetweenUpdates) {
        console.log(`Rafraîchissement des conversations directes après ${lastUpdate ? Math.round((now - parseInt(lastUpdate))/1000) : 'inconnu'} secondes d'inactivité`);
        
        // Rafraîchir les conversations sans état de chargement
        fetchConversations(user.id);
        
        // Mettre à jour le timestamp du dernier rafraîchissement
        localStorage.setItem(`last_direct_messaging_update_${isFreelance ? 'freelance' : 'client'}`, now.toString());
      }
    }
  }, [inView, mounted, user?.id, isInitialLoad, isLoading, fetchConversations, isFreelance]);

  // Assurer la propreté des abonnements lors de la navigation - safety net
  useEffect(() => {
    // Supprimer les anciens abonnements de cet utilisateur
    if (user?.id) {
      const userChannelPattern = `messages-for-user-${user.id}`;
      const channels = Array.from(channelManager.activeChannels.keys())
        .filter(name => name.includes(userChannelPattern) && !name.includes(new Date().getTime().toString()));
      
      if (channels.length > 0) {
        console.log(`Nettoyage de ${channels.length} canaux obsolètes pour l'utilisateur ${user.id}`);
        channels.forEach(channelName => {
          channelManager.removeChannel(channelName);
        });
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
            console.log(`Nettoyage du canal ${channelName} avant déchargement`);
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