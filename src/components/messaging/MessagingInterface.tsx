"use client";

import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { useMessagingStore } from '@/lib/stores/useMessagingStore';
import dynamic from 'next/dynamic';
import { Loader } from '@/components/ui/loader';
import { useAuth } from '@/hooks/useAuth';
import { useInView } from 'react-intersection-observer';
import { 
  getCachedData, 
  setCachedData,
  invalidateCache
} from '@/lib/optimizations/cache';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { MessageSquare, FileIcon } from 'lucide-react';
import { OrderMessageForm } from './OrderMessageForm';
import Image from 'next/image';

// Constantes locales pour éviter les dépendances problématiques
const CONVERSATIONS_KEY = 'conversations';
const CACHE_EXPIRY_DYNAMIC = 60 * 1000; // 1 minute

// Chargement dynamique des composants pour réduire la taille du bundle initial
const ConversationList = dynamic(() => import('./ConversationList'), {
  loading: () => <ConversationListSkeleton />,
  ssr: false
});

const ChatWindow = dynamic(() => import('./ChatWindow'), {
  loading: () => <ChatWindowSkeleton />,
  ssr: false
});

// Optimiser le squelette de chargement pour la liste de conversations
const ConversationListSkeleton = () => (
  <div className="flex flex-col h-full">
    <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-800">
      <div className="h-7 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
      <div className="h-10 w-full bg-gray-200 dark:bg-gray-700 rounded-full"></div>
    </div>
    <div className="flex-1 p-2 space-y-2">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center p-3 mb-1 rounded-lg bg-white dark:bg-gray-850">
          <div className="h-12 w-12 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0"></div>
          <div className="ml-3 flex-1 space-y-2">
            <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-3 w-4/5 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Optimiser le squelette de chargement pour la fenêtre de chat
const ChatWindowSkeleton = () => (
  <div className="flex flex-col h-full">
    <div className="flex items-center px-4 py-3 border-b border-gray-200 dark:border-gray-800 bg-gradient-to-r from-pink-600 to-purple-600">
      <div className="h-10 w-10 rounded-full bg-white/20"></div>
      <div className="ml-3">
        <div className="h-4 w-32 bg-white/20 rounded mb-1"></div>
        <div className="h-3 w-24 bg-white/30 rounded"></div>
      </div>
    </div>
    <div className="flex-1 p-4 bg-gray-50 dark:bg-gray-900">
      <div className="space-y-4 w-full max-w-md mx-auto">
        {[...Array(4)].map((_, i) => (
          <div key={i} className={`flex items-start ${i % 2 === 0 ? 'justify-end' : ''}`}>
            {i % 2 !== 0 && (
              <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 mr-2"></div>
            )}
            <div 
              className={`h-[60px] rounded-2xl ${i % 2 === 0 ? 'bg-indigo-100 dark:bg-indigo-900/30 w-[65%]' : 'bg-gray-100 dark:bg-gray-800 w-[70%]'}`}
            ></div>
          </div>
        ))}
      </div>
    </div>
    <div className="p-3 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
      <div className="flex">
        <div className="flex space-x-2 mr-2">
          <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700"></div>
          <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700"></div>
        </div>
        <div className="h-10 flex-1 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
      </div>
    </div>
  </div>
);

// Ajouter une nouvelle classe de transition en haut du fichier
const slideIn = "animate-in fade-in duration-500 ease-in-out";

interface MessagingInterfaceProps {
  initialConversationId?: string;
  receiverId?: string;
  orderId?: string;
  className?: string;
  isFreelance?: boolean;
}

const MessagingInterface: React.FC<MessagingInterfaceProps> = ({
  initialConversationId,
  receiverId,
  orderId,
  className = '',
  isFreelance: propIsFreelance
}) => {
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showContent, setShowContent] = useState(false);
  const [orderMessages, setOrderMessages] = useState<any[]>([]);
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [loadingOrderData, setLoadingOrderData] = useState(false);
  
  // Intersection Observer pour détecter quand l'interface est visible
  const { ref: interfaceRef, inView } = useInView({
    threshold: 0.1,
    triggerOnce: false
  });
  
  // Référence pour suivre le nombre de tentatives de chargement
  const retryCountRef = useRef(0);
  const maxRetries = 3;
  
  const { 
    activeConversation,
    conversations, 
    isLoading,
    error,
    fetchConversations,
    fetchMessages,
    setupRealtimeSubscriptions,
    createConversation
  } = useMessagingStore();

  // Déterminer si l'utilisateur est un freelance ou un client (mémorisé)
  const isFreelance = useMemo(() => {
    if (propIsFreelance !== undefined) return propIsFreelance;
    return user?.user_metadata?.role === 'freelance';
  }, [propIsFreelance, user?.user_metadata?.role]);

  // Mémoriser le tri des conversations
  const sortedConversations = useMemo(() => {
    if (!conversations.length) return [];
    
    return [...conversations].sort((a, b) => {
      // Trier par la date du dernier message, du plus récent au plus ancien
      const aTime = a.last_message_time || a.updated_at || a.created_at;
      const bTime = b.last_message_time || b.updated_at || b.created_at;
      return new Date(bTime).getTime() - new Date(aTime).getTime();
    });
  }, [conversations]);

  // Récupérer les conversations déjà mises en cache
  const getCachedConversations = useCallback(() => {
    if (!user?.id) return null;
    
    const cacheKey = `${CONVERSATIONS_KEY}_${user.id}`;
    return getCachedData(cacheKey);
  }, [user?.id]);

  // Charger les messages d'une commande spécifique si orderId est fourni
  useEffect(() => {
    const fetchOrderData = async () => {
      if (!orderId || !user?.id) return;
      
      try {
        setLoadingOrderData(true);
        
        const supabase = createClientComponentClient();
        
        // Récupérer les détails de la commande
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .select(`
            *,
            services(*),
            profiles!orders_client_id_fkey(*),
            freelance:profiles!orders_freelance_id_fkey(*)
          `)
          .eq('id', orderId)
          .single();
          
        if (orderError) {
          throw new Error(`Erreur lors de la récupération de la commande: ${orderError.message}`);
        }
        
        if (!orderData) {
          throw new Error('Commande introuvable');
        }
        
        // Vérifier que l'utilisateur est bien impliqué dans cette commande
        const isUserInvolved = 
          user.id === orderData.client_id || 
          user.id === orderData.freelance_id;
        
        if (!isUserInvolved) {
          throw new Error("Vous n'êtes pas autorisé à voir cette commande");
        }
        
        // Récupérer les messages associés à cette commande
        const { data: messages, error: messagesError } = await supabase
          .from('messages')
          .select('*')
          .eq('order_id', orderId)
          .order('created_at', { ascending: true });
          
        if (messagesError) {
          throw new Error(`Erreur lors de la récupération des messages: ${messagesError.message}`);
        }
        
        // Transformer les données
        const orderInfo = {
          id: orderData.id,
          created_at: orderData.created_at,
          updated_at: orderData.updated_at,
          status: orderData.status,
          price: orderData.price,
          delivery_time: orderData.delivery_time,
          requirements: orderData.requirements,
          completed_at: orderData.completed_at,
          service: {
            id: orderData.services.id,
            title: orderData.services.title,
            price: orderData.services.price,
            delivery_time: orderData.services.delivery_time,
            description: orderData.services.description
          },
          freelance: {
            id: orderData.freelance.id,
            username: orderData.freelance.username,
            full_name: orderData.freelance.full_name,
            avatar_url: orderData.freelance.avatar_url
          },
          client: {
            id: orderData.profiles.id,
            username: orderData.profiles.username,
            full_name: orderData.profiles.full_name,
            avatar_url: orderData.profiles.avatar_url
          }
        };
        
        // Transformer les messages
        const formattedMessages = messages?.map(msg => ({
          id: msg.id,
          sender_id: msg.sender_id,
          content: msg.content,
          created_at: msg.created_at,
          read: msg.read,
          attachment_url: msg.attachment_url,
          attachment_type: msg.attachment_type,
          attachment_name: msg.attachment_name,
          order_id: msg.order_id,
          sender: msg.sender_id === orderInfo.freelance.id 
            ? orderInfo.freelance 
            : orderInfo.client
        })) || [];
        
        // Mettre en place l'abonnement en temps réel pour les nouveaux messages
        const channel = supabase
          .channel(`order_messages_${orderId}`)
          .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `order_id=eq.${orderId}`
          }, (payload) => {
            const newMessage = payload.new as any;
            const sender = newMessage.sender_id === orderInfo.freelance.id 
              ? orderInfo.freelance 
              : orderInfo.client;
              
            setOrderMessages(prev => [...prev, {
              ...newMessage,
              sender
            }]);
          })
          .subscribe();
        
        setOrderDetails(orderInfo);
        setOrderMessages(formattedMessages);
        
        // Réinitialiser le compteur de tentatives
        retryCountRef.current = 0;
        setLoadError(null);
        
        return () => {
          supabase.removeChannel(channel);
        };
      } catch (err) {
        console.error("Erreur lors du chargement des données de commande:", err);
        
        // Incrémenter le compteur de tentatives
        retryCountRef.current += 1;
        
        if (retryCountRef.current < maxRetries) {
          console.log(`Tentative de rechargement ${retryCountRef.current}/${maxRetries}...`);
        } else {
          setLoadError(err instanceof Error ? err.message : "Erreur lors du chargement des données de commande");
        }
      } finally {
        setLoadingOrderData(false);
        setMounted(true);
        setIsInitialLoad(false);
      }
    };
    
    if (orderId) {
      fetchOrderData();
    }
  }, [orderId, user?.id]);

  // Création d'une nouvelle conversation si receiverId est fourni
  useEffect(() => {
    const initializeMessaging = async () => {
      if (!user?.id) return;
      
      // Si nous avons un orderId, nous n'avons pas besoin d'initialiser la messagerie normale
      if (orderId) {
        setMounted(true);
        setIsInitialLoad(false);
        return;
      }
      
      try {
        // Vérifier d'abord si nous avons des données en cache
        const cachedData = getCachedConversations();
        if (cachedData && isInitialLoad) {
          // Utiliser les données du cache pour le premier rendu
          console.log("Utilisation des données en cache pour l'affichage initial");
        }
        
        // Initialiser les abonnements en temps réel
        const cleanup = setupRealtimeSubscriptions(user.id);
        
        // Charger toutes les conversations de l'utilisateur
        await fetchConversations(user.id);
        
        // Si nous avons un ID de conversation initial, le charger
        if (initialConversationId) {
          await fetchMessages(initialConversationId);
        }
        // Si nous avons un ID de récepteur mais pas de conversation active,
        // vérifier si une conversation existe déjà
        else if (receiverId && conversations.length > 0) {
          // Rechercher une conversation existante avec le récepteur
          const existingConversation = conversations.find(conv => 
            conv.participants.some(p => p.id === receiverId)
          );
          
          if (existingConversation) {
            await fetchMessages(existingConversation.id);
          } else if (receiverId !== user.id) {
            // Créer une nouvelle conversation si elle n'existe pas déjà
            const newConversationId = await createConversation([user.id, receiverId]);
            if (newConversationId) {
              await fetchMessages(newConversationId);
            }
          }
        }
        
        // Réinitialiser le compteur de tentatives
        retryCountRef.current = 0;
        setLoadError(null);
        
        // Indiquer que le composant est monté et que le chargement initial est terminé
        setMounted(true);
        
        // Ajouter un léger délai avant d'afficher le contenu pour une transition fluide
        setTimeout(() => {
          setIsInitialLoad(false);
          setShowContent(true);
        }, 300);
        
        // Mettre en cache les conversations pour une utilisation future
        if (conversations.length > 0) {
          const cacheKey = `${CONVERSATIONS_KEY}_${user.id}`;
          setCachedData(cacheKey, conversations, { 
            expiry: CACHE_EXPIRY_DYNAMIC 
          });
        }
        
        // Nettoyer les abonnements à la déconnexion
        return cleanup;
      } catch (err) {
        console.error("Erreur d'initialisation de la messagerie:", err);
        
        // Incrémenter le compteur de tentatives
        retryCountRef.current += 1;
        
        // Si nous n'avons pas dépassé le nombre maximum de tentatives, réessayer
        if (retryCountRef.current < maxRetries) {
          console.log(`Tentative de rechargement ${retryCountRef.current}/${maxRetries}...`);
          
          // Réessayer après un délai exponentiel
          setTimeout(() => {
            fetchConversations(user.id);
          }, 1000 * Math.pow(2, retryCountRef.current - 1));
        } else {
          // Définir un message d'erreur après avoir épuisé les tentatives
          setLoadError("Impossible de charger les conversations après plusieurs tentatives.");
          setIsInitialLoad(false);
        }
      }
    };
    
    initializeMessaging();
  }, [user?.id, initialConversationId, receiverId, conversations.length, setupRealtimeSubscriptions, fetchConversations, fetchMessages, createConversation, getCachedConversations, isInitialLoad]);

  // Rechargement lorsque l'interface devient visible 
  useEffect(() => {
    if (inView && mounted && user?.id && !isInitialLoad && !isLoading && !orderId) {
      console.log("Interface visible, vérification des mises à jour");
      // Rafraîchir les données uniquement si nécessaire
      const lastUpdate = localStorage.getItem('last_messaging_update');
      const now = Date.now();
      
      if (!lastUpdate || now - parseInt(lastUpdate) > 60000) { // 1 minute
        // Rafraîchir subtilement, sans état de chargement
        fetchConversations(user.id);
        localStorage.setItem('last_messaging_update', now.toString());
      }
    }
  }, [inView, mounted, user?.id, isInitialLoad, isLoading, fetchConversations, orderId]);
  
  // Si nous avons un orderId, afficher les messages de commande
  if (orderId) {
    // Afficher l'état de chargement pour les données de commande
    if (loadingOrderData && !orderDetails) {
      return (
        <div className={`h-[calc(100vh-200px)] grid grid-cols-1 gap-0 bg-white dark:bg-gray-950 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-800 ${slideIn}`}>
          <div className="h-full">
            <ChatWindowSkeleton />
          </div>
        </div>
      );
    }
    
    // Afficher une erreur si nécessaire
    if ((error || loadError) && !loadingOrderData) {
      return (
        <div className="w-full p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">{loadError || error}</p>
          <button 
            onClick={() => {
              retryCountRef.current = 0;
              setLoadError(null);
              // Forcer le rechargement de la page
              window.location.reload();
            }}
            className="mt-4 px-3 py-1 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors"
          >
            Réessayer
          </button>
        </div>
      );
    }
    
    // Afficher l'interface de messages de commande
    return (
      <div 
        ref={interfaceRef}
        className={`h-[calc(100vh-200px)] grid grid-cols-1 gap-0 bg-white dark:bg-gray-950 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-800 ${slideIn} ${className}`}
      >
        {orderDetails && (
          <div className="h-full flex flex-col">
            <div className="flex items-center p-3 sm:p-4 border-b border-gray-200 dark:border-gray-800 bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center text-white overflow-hidden">
                  {orderDetails.service?.title?.charAt(0) || 'S'}
                </div>
                <div className="ml-3">
                  <div className="font-medium">{orderDetails.service?.title || "Commande"}</div>
                  <div className="text-xs text-white/80">
                    {isFreelance ? `Client: ${orderDetails.client?.full_name || orderDetails.client?.username || "Client"}` 
                     : `Freelance: ${orderDetails.freelance?.full_name || orderDetails.freelance?.username || "Freelance"}`}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900 p-4 no-scrollbar">
              {orderMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="p-4 rounded-full bg-gray-100 dark:bg-gray-800">
                    <MessageSquare className="h-10 w-10 text-gray-400 dark:text-gray-500" />
                  </div>
                  <p className="mt-4 text-gray-600 dark:text-gray-400">Aucun message pour le moment</p>
                  <p className="text-sm text-gray-500 dark:text-gray-500">
                    Commencez à discuter avec {isFreelance ? "votre client" : "votre freelance"}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {orderMessages.map((message) => {
                    const isCurrentUser = message.sender_id === user?.id;
                    return (
                      <div 
                        key={message.id} 
                        className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                      >
                        {!isCurrentUser && (
                          <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 mr-2 overflow-hidden">
                            {message.sender?.avatar_url ? (
                              <Image 
                                src={message.sender.avatar_url} 
                                alt={message.sender.full_name || message.sender.username} 
                                className="h-full w-full object-cover"
                                width={32}
                                height={32}
                                unoptimized={message.sender.avatar_url.startsWith('data:')}
                              />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center bg-purple-500 text-white">
                                {(message.sender?.full_name || message.sender?.username || "U").charAt(0)}
                              </div>
                            )}
                          </div>
                        )}
                        <div 
                          className={`max-w-[75%] px-4 py-2 rounded-lg ${
                            isCurrentUser 
                              ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-900 dark:text-indigo-100' 
                              : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white'
                          }`}
                        >
                          <div className="text-sm">{message.content}</div>
                          {message.attachment_url && (
                            <div className="mt-2">
                              {message.attachment_type?.startsWith('image/') ? (
                                <a href={message.attachment_url} target="_blank" rel="noopener noreferrer" className="block">
                                  <Image 
                                    src={message.attachment_url} 
                                    alt={message.attachment_name || "Pièce jointe"} 
                                    className="max-h-[150px] max-w-full object-contain rounded"
                                    width={300}
                                    height={150}
                                    style={{ maxHeight: '150px' }}
                                    unoptimized={message.attachment_url.startsWith('data:')}
                                  />
                                </a>
                              ) : (
                                <a 
                                  href={message.attachment_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="flex items-center p-2 bg-gray-50 dark:bg-gray-900 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                                >
                                  <FileIcon className="h-5 w-5 mr-2" />
                                  <div className="text-xs truncate">{message.attachment_name}</div>
                                </a>
                              )}
                            </div>
                          )}
                          <div className="text-xs mt-1 opacity-70">
                            {new Date(message.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            
            <OrderMessageForm orderId={orderId} orderDetails={orderDetails} onMessageSent={message => {
              const sender = message.sender_id === orderDetails.freelance.id 
                ? orderDetails.freelance 
                : orderDetails.client;
                
              setOrderMessages(prev => [...prev, {
                ...message,
                sender
              }]);
            }} />
          </div>
        )}
      </div>
    );
  }
  
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
        {retryCountRef.current >= maxRetries && (
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
        )}
      </div>
    );
  }
  
  // Afficher l'interface de messagerie standard
  return (
    <div 
      ref={interfaceRef}
      className={`flex flex-col md:flex-row w-full h-[calc(100vh-8rem)] bg-black/5 dark:bg-gray-950 rounded-lg shadow-sm border border-purple-800/20 overflow-hidden overflow-x-hidden ${showContent ? slideIn : 'opacity-0'} ${className}`}
    >
      {/* Sidebar des conversations - caché sur mobile si une conversation est active */}
      <div className={`${showMobileMenu || !activeConversation ? 'flex' : 'hidden'} md:flex md:w-80 lg:w-96 border-r border-purple-800/10 flex-col h-full`}>
        <ConversationList 
          conversations={sortedConversations}
          onSelectConversation={(id) => {
            fetchMessages(id);
            setShowMobileMenu(false);
          }}
          activeConversationId={activeConversation?.id}
          isFreelance={isFreelance}
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

// Mémoiser le composant pour éviter les rendus inutiles
export default React.memo(MessagingInterface); 