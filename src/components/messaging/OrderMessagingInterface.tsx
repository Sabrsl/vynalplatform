"use client";

import React, { useEffect, useRef, useState, useCallback, useMemo, MouseEvent } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useInView } from 'react-intersection-observer';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { MessageSquare, FileIcon } from 'lucide-react';
import { OrderMessageForm } from './OrderMessageForm';
import Image from 'next/image';
import { Loader } from '@/components/ui/loader';
import { OrderMessagingProps, OrderDetails } from './messaging-types';
import { OrderMessage } from '@/types/messages';
import requestCoordinator from '@/lib/optimizations/requestCoordinator';

// Constantes
const CACHE_EXPIRY = 60 * 1000; // 1 minute
const REFRESH_INTERVAL_CLIENT = 10000; // 10 secondes
const REFRESH_INTERVAL_FREELANCE = 20000; // 20 secondes

// Classe de transition pour les animations
const slideIn = "animate-in fade-in slide-in-from-bottom-4 duration-300 ease-out";

// Définir la structure des données du cache
type OrderCache = {
  orderInfo: OrderDetails;
  messages: OrderMessage[];
  timestamp: number;
};

// Version simplifiée du type OrderDetails pour éviter les erreurs de typage
type ServiceInfo = {
  id: string;
  title: string;
  price: number;
  delivery_time: number;
  description: string;
  image_url?: string;
};

const OrderMessagingInterface: React.FC<OrderMessagingProps> = ({
  orderId,
  isFreelance,
  className = ''
}) => {
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [orderMessages, setOrderMessages] = useState<OrderMessage[]>([]);
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [loadingOrderData, setLoadingOrderData] = useState(false);

  // Référence pour les tentatives de chargement
  const retryCountRef = useRef(0);
  const maxRetries = 3;
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const channelRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Observer l'interface pour détecter quand elle est visible
  const { ref: interfaceRef, inView } = useInView({
    threshold: 0.1,
    triggerOnce: false
  });

  // Charger les données de la commande avec coordination
  const fetchOrderDataCoordinated = useCallback(async () => {
    if (!orderId || !user?.id) return;
    
    try {
      setLoadingOrderData(true);
      
      // Utiliser le coordinateur pour éviter les requêtes multiples pour la même commande
      return await requestCoordinator.scheduleRequest(
        `order_data_${orderId}`,
        async () => {
          // Vérifier d'abord si des données sont en cache et récentes (moins de 60 secondes)
          const cacheKey = `order_messages_${orderId}`;
          const cachedData = localStorage.getItem(cacheKey);
          const now = Date.now();
          
          if (cachedData) {
            try {
              const { orderInfo, messages, timestamp } = JSON.parse(cachedData) as OrderCache;
              
              // Si le cache est récent, utiliser les données
              if (now - timestamp < CACHE_EXPIRY) {
                console.log(`Utilisation du cache pour la commande ${orderId} (${Math.round((now - timestamp)/1000)}s)`);
                setOrderDetails(orderInfo);
                setOrderMessages(messages);
                return { orderInfo, messages };
              }
            } catch (e) {
              console.error("Erreur lors de la lecture du cache des messages de commande:", e);
            }
          }
          
          // Récupérer les détails de la commande
          const supabase = createClientComponentClient();
          const { data: orderData, error: orderError } = await supabase
            .from('orders')
            .select('*, freelance:freelance_id(*), service:service_id(*), client:client_id(*)')
            .eq('id', orderId)
            .single();
          
          if (orderError) throw orderError;
          if (!orderData) throw new Error("Commande non trouvée");
          
          // Créer un objet OrderDetails complet avec tous les champs requis
          const orderInfo: OrderDetails = {
            id: orderData.id,
            status: orderData.status,
            created_at: orderData.created_at,
            updated_at: orderData.updated_at || orderData.created_at,
            price: orderData.price || 0,
            delivery_time: orderData.delivery_time || 0,
            requirements: orderData.requirements || '',
            completed_at: orderData.completed_at || null,
            service: {
              id: orderData.service.id,
              title: orderData.service.title,
              price: orderData.service.price || 0,
              delivery_time: orderData.service.delivery_time || 0,
              description: orderData.service.description || '',
              // Ignorer l'erreur de typage pour image_url
            } as ServiceInfo,
            client: {
              id: orderData.client.id,
              username: orderData.client.username || '',
              full_name: orderData.client.full_name || '',
              avatar_url: orderData.client.avatar_url || null
            },
            freelance: {
              id: orderData.freelance.id,
              username: orderData.freelance.username || '',
              full_name: orderData.freelance.full_name || '',
              avatar_url: orderData.freelance.avatar_url || null
            }
          };
          
          // Récupérer les messages de la commande
          const { data: messagesData, error: messagesError } = await supabase
            .from('order_messages')
            .select('*')
            .eq('order_id', orderId)
            .order('created_at', { ascending: true });
          
          if (messagesError) throw messagesError;
          
          // Formater les messages avec le sender requis
          const formattedMessages = messagesData.map(msg => {
            const sender = msg.sender_id === orderInfo.freelance.id 
              ? orderInfo.freelance 
              : orderInfo.client;
              
            return {
              id: msg.id,
              content: msg.content,
              created_at: msg.created_at,
              sender_id: msg.sender_id,
              read: msg.read,
              attachment_url: msg.attachment_url,
              attachment_type: msg.attachment_type,
              attachment_name: msg.attachment_name || '',
              order_id: msg.order_id,
              conversation_id: null,
              is_typing: false,
              sender: sender,
              message_type: msg.message_type || 'text',
              metadata: msg.metadata || null
            } as OrderMessage;
          });
          
          // Marquer les messages non lus comme lus si je ne suis pas l'expéditeur
          const unreadMessages = formattedMessages.filter(
            msg => !msg.read && msg.sender_id !== user.id
          );
          
          if (unreadMessages.length > 0) {
            console.log(`Marquage de ${unreadMessages.length} messages non lus comme lus...`);
            
            // Mettre à jour en base de données
            await supabase
              .from('order_messages')
              .update({ read: true })
              .in('id', unreadMessages.map(msg => msg.id));
              
            // Mettre à jour localement
            formattedMessages.forEach(msg => {
              if (!msg.read && msg.sender_id !== user.id) {
                msg.read = true;
              }
            });
          }
          
          // Mettre à jour l'état local
          setOrderDetails(orderInfo);
          setOrderMessages(formattedMessages);
          
          // Mettre en cache les données
          localStorage.setItem(cacheKey, JSON.stringify({
            orderInfo,
            messages: formattedMessages,
            timestamp: now
          }));
          
          // Réinitialiser le compteur de tentatives
          retryCountRef.current = 0;
          setLoadError(null);
          
          return { orderInfo, messages: formattedMessages };
        },
        'medium' // Priorité moyenne
      );
    } catch (error) {
      console.error("Erreur lors du chargement des données de commande:", error);
      setLoadError("Impossible de charger les données de la commande. Veuillez réessayer.");
      
      // Augmenter le compteur de tentatives
      if (retryCountRef.current < maxRetries) {
        retryCountRef.current++;
        // Nouvelle tentative avec délai exponentiel
        setTimeout(() => {
          console.log(`Tentative ${retryCountRef.current}/${maxRetries} de chargement des données de commande...`);
          fetchOrderDataCoordinated();
        }, 1000 * Math.pow(2, retryCountRef.current));
      }
      
      return null;
    } finally {
      setLoadingOrderData(false);
    }
  }, [orderId, user?.id]);

  // Remplacer l'ancien fetchOrderData par le nouveau coordonné
  const fetchOrderData = fetchOrderDataCoordinated;

  // Configurer l'abonnement en temps réel pour les nouveaux messages
  useEffect(() => {
    if (!orderId || !user?.id) return;
    
    // Initialiser les données de la commande
    fetchOrderData();
    
    // Configurer l'intervalle de rafraîchissement avec une utilisation de requestCoordinator
    const setupRefreshInterval = () => {
      // Nettoyer l'intervalle précédent si nécessaire
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
      
      // Déterminer l'intervalle en fonction du rôle (plus court pour client)
      const refreshInterval = isFreelance ? REFRESH_INTERVAL_FREELANCE : REFRESH_INTERVAL_CLIENT;
      
      console.log(`Configuration du rafraîchissement périodique des messages de commande (${refreshInterval/1000}s)...`);
      
      // Configurer un nouvel intervalle qui utilise le coordinateur de requêtes
      refreshIntervalRef.current = setInterval(() => {
        // Utiliser requestCoordinator pour éviter de multiples requêtes simultanées
        requestCoordinator.scheduleRequest(
          `refresh_order_${orderId}`,
          async () => {
            console.log(`Rafraîchissement périodique des messages de la commande ${orderId}...`);
            await fetchOrderData();
          },
          'low' // Priorité basse pour les rafraîchissements automatiques
        );
      }, refreshInterval);
    };
    
    setupRefreshInterval();
    
    // Configurer la connexion temps réel
    try {
      const supabase = createClientComponentClient();
      
      console.log(`Configuration de l'abonnement temps réel pour les messages de la commande ${orderId}...`);
      
      // S'abonner aux nouveaux messages pour cette commande
      const channel = supabase
        .channel(`order-messages-${orderId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'order_messages',
            filter: `order_id=eq.${orderId}`
          },
          (payload) => {
            console.log("Nouveau message de commande reçu:", payload);
            // Rafraîchir les données
            fetchOrderData();
            
            // Jouer un son de notification si le message n'est pas de l'utilisateur actuel
            if (payload.new && payload.new.sender_id !== user.id && audioRef.current) {
              audioRef.current.play().catch(e => console.log("Erreur de lecture audio:", e));
            }
          }
        )
        .subscribe();
      
      // Stocker la référence du canal pour le nettoyage
      channelRef.current = channel;
    } catch (error) {
      console.error("Erreur lors de la configuration de l'abonnement temps réel:", error);
    }
    
    return () => {
      // Nettoyage à la fermeture
      if (channelRef.current) {
        try {
          const supabase = createClientComponentClient();
          supabase.removeChannel(channelRef.current);
        } catch (error) {
          console.error("Erreur lors de la déconnexion du canal temps réel:", error);
        }
        channelRef.current = null;
      }
      
      // Nettoyer l'intervalle
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    };
  }, [orderId, user?.id, fetchOrderData, isFreelance]);

  // Initialiser les données et l'abonnement temps réel
  useEffect(() => {
    if (!orderId || !user?.id) return;
    
    console.log(`Initialisation de l'interface de messages pour la commande ${orderId}...`);
    
    // Charger les données initiales
    fetchOrderData();
    
    // Configurer l'élément audio pour les notifications
    audioRef.current = new Audio('/sounds/notification.mp3');
    audioRef.current.volume = 0.5;
    
    setMounted(true);
    
    return () => {
      console.log(`Nettoyage de l'interface de messages pour la commande ${orderId}...`);
      // Nettoyer l'intervalle de rafraîchissement
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    };
  }, [orderId, user?.id, fetchOrderData]);
  
  // Rafraîchir les données lorsque l'interface devient visible
  useEffect(() => {
    if (inView && mounted && user?.id && !isInitialLoad && !loadingOrderData) {
      const lastUpdate = localStorage.getItem(`last_order_messaging_update_${orderId}`);
      const now = Date.now();
      
      // Définir un intervalle minimum entre les mises à jour pour éviter trop de requêtes
      const minTimeBetweenUpdates = 30000; // 30 secondes
      
      if (!lastUpdate || now - parseInt(lastUpdate) > minTimeBetweenUpdates) {
        console.log(`Rafraîchissement des messages de commande après ${lastUpdate ? Math.round((now - parseInt(lastUpdate))/1000) : 'inconnu'} secondes d'inactivité`);
        
        // Rafraîchir les messages de la commande
        fetchOrderData();
        
        // Mettre à jour le timestamp du dernier rafraîchissement
        localStorage.setItem(`last_order_messaging_update_${orderId}`, now.toString());
      }
    }
  }, [inView, mounted, user?.id, isInitialLoad, loadingOrderData, fetchOrderData, orderId]);

  // Afficher l'état de chargement pour les données de commande
  if (loadingOrderData && !orderDetails) {
    return (
      <div className={`h-[calc(100vh-200px)] grid grid-cols-1 gap-0 bg-white dark:bg-gray-950 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-800 ${slideIn}`}>
        <div className="h-full animate-in fade-in duration-500 flex items-center justify-center">
          <div className="text-center">
            <Loader size="lg" className="mx-auto mb-4" />
            <p className="text-sm text-gray-500">Chargement des messages de la commande...</p>
          </div>
        </div>
      </div>
    );
  }
  
  // Afficher une erreur si nécessaire
  if (loadError && !loadingOrderData) {
    return (
      <div className="w-full p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600 text-sm">{loadError}</p>
        <button 
          onClick={() => {
            retryCountRef.current = 0;
            setLoadError(null);
            // Forcer le rechargement
            fetchOrderData();
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
          
          <OrderMessageForm 
            orderId={orderId} 
            orderDetails={orderDetails!} 
            onMessageSent={message => {
              if (!orderDetails) return;
              
              const sender = message.sender_id === orderDetails.freelance.id 
                ? orderDetails.freelance 
                : orderDetails.client;
                
              setOrderMessages(prev => [...prev, {
                ...message,
                sender
              }]);
            }} 
          />
        </div>
      )}
    </div>
  );
};

export default React.memo(OrderMessagingInterface); 