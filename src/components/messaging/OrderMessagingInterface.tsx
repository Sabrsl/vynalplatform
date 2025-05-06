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

// Constantes
const CACHE_EXPIRY = 60 * 1000; // 1 minute
const REFRESH_INTERVAL_CLIENT = 10000; // 10 secondes
const REFRESH_INTERVAL_FREELANCE = 20000; // 20 secondes

// Classe de transition pour les animations
const slideIn = "animate-in fade-in slide-in-from-bottom-4 duration-300 ease-out";

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

  // Fonction pour charger les messages d'une commande spécifique
  const fetchOrderData = useCallback(async () => {
    if (!orderId || !user?.id) return;
    
    try {
      setLoadingOrderData(true);
      
      const supabase = createClientComponentClient();
      
      console.log(`Chargement des détails de la commande ${orderId} pour ${isFreelance ? 'freelance' : 'client'}...`);
      
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
      console.log(`Chargement des messages pour la commande ${orderId}...`);
      const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: true });
        
      if (messagesError) {
        throw new Error(`Erreur lors de la récupération des messages: ${messagesError.message}`);
      }
      
      console.log(`${messages?.length || 0} messages chargés pour la commande ${orderId}`);
      
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
        conversation_id: null,
        is_typing: false,
        sender: msg.sender_id === orderInfo.freelance.id 
          ? orderInfo.freelance 
          : orderInfo.client
      })) || [];
      
      // Marquer les messages comme lus
      const unreadMessages = formattedMessages.filter(
        msg => !msg.read && msg.sender_id !== user.id
      );
      
      if (unreadMessages.length > 0) {
        console.log(`Marquage de ${unreadMessages.length} messages non lus comme lus...`);
        
        // Mettre à jour en base de données
        await supabase
          .from('messages')
          .update({ read: true })
          .in('id', unreadMessages.map(msg => msg.id));
          
        // Mettre à jour localement
        formattedMessages.forEach(msg => {
          if (!msg.read && msg.sender_id !== user.id) {
            msg.read = true;
          }
        });
      }
      
      setOrderDetails(orderInfo);
      setOrderMessages(formattedMessages);
      
      // Réinitialiser le compteur de tentatives
      retryCountRef.current = 0;
      setLoadError(null);
      
      // Configurer un intervalle de rafraîchissement périodique avec une fréquence différente selon le rôle
      const refreshInterval = isFreelance ? REFRESH_INTERVAL_FREELANCE : REFRESH_INTERVAL_CLIENT;
      
      console.log(`Configuration du rafraîchissement périodique des messages de commande (${refreshInterval/1000}s)...`);
      
      // Nettoyer l'intervalle précédent si nécessaire
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
      
      // Configurer le nouvel intervalle
      refreshIntervalRef.current = setInterval(() => {
        console.log(`Rafraîchissement périodique des messages de la commande ${orderId}...`);
        fetchOrderData();
      }, refreshInterval);
    } catch (err) {
      console.error("Erreur lors du chargement des données de commande:", err);
      
      // Incrémenter le compteur de tentatives
      retryCountRef.current += 1;
      
      if (retryCountRef.current < maxRetries) {
        // Réessayer après un délai exponentiel
        const retryDelay = 1000 * Math.pow(2, retryCountRef.current - 1);
        console.log(`Nouvelle tentative dans ${retryDelay / 1000} secondes... (tentative ${retryCountRef.current}/${maxRetries})`);
        
        setTimeout(() => {
          console.log(`Tentative ${retryCountRef.current}/${maxRetries} de chargement des messages de commande...`);
          fetchOrderData();
        }, retryDelay);
      } else {
        const errorMessage = err instanceof Error ? err.message : "Erreur inconnue";
        console.error(`Échec après ${maxRetries} tentatives. Erreur: ${errorMessage}`);
        setLoadError(`Impossible de charger les données de commande après ${maxRetries} tentatives. ${errorMessage}`);
      }
    } finally {
      setLoadingOrderData(false);
      setMounted(true);
      setIsInitialLoad(false);
    }
  }, [orderId, user?.id, isFreelance]);

  // Configurer l'abonnement en temps réel pour les nouveaux messages
  const setupRealtimeSubscription = useCallback(() => {
    if (!orderId || !user?.id || !orderDetails) return null;
    
    try {
      const supabase = createClientComponentClient();
      
      // Supprimer l'ancien canal s'il existe
      if (channelRef.current) {
        console.log(`Suppression de l'ancien canal pour la commande ${orderId}`);
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      
      console.log(`Configuration de l'abonnement temps réel pour les messages de la commande ${orderId} (${isFreelance ? 'freelance' : 'client'})...`);
      
      const channelId = `order_messages_${orderId}_${isFreelance ? 'freelance' : 'client'}_${Date.now()}`;
      
      // Créer un nouveau canal spécifique à cette commande
      const channel = supabase
        .channel(channelId)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `order_id=eq.${orderId}`
        },
        (payload) => {
          console.log(`Nouveau message reçu pour la commande ${orderId}:`, payload);
          
          // Typecasting obligatoire avec TypeScript
          const newMessage = payload.new as any;
          
          // Ne pas ajouter les messages de l'utilisateur actuel (ils sont déjà ajoutés lors de l'envoi)
          if (newMessage.sender_id === user.id) {
            console.log("Message envoyé par l'utilisateur actuel, ignoré dans la subscription");
            return;
          }
          
          // Trouver les informations de l'expéditeur
          const sender = isFreelance 
            ? { ...orderDetails?.client, role: 'client' } 
            : { ...orderDetails?.freelance, role: 'freelance' };
            
          console.log("Sender déterminé:", sender);
          
          // Logs de diagnostic pour s'assurer que les participants sont correctement identifiés
          console.log("Mon ID:", user.id);
          console.log("Client ID:", orderDetails?.client?.id);
          console.log("Freelance ID:", orderDetails?.freelance?.id);
          
          // Marquer le message comme lu immédiatement
          supabase
            .from('messages')
            .update({ read: true })
            .eq('id', newMessage.id);
            
          console.log(`Message ${newMessage.id} marqué comme lu`);
          
          // Ajouter le message avec les données de l'expéditeur
          setOrderMessages(prev => [...prev, {
            ...newMessage,
            read: true, // Marquer comme lu localement
            conversation_id: null, // Requis par l'interface OrderMessage
            is_typing: false, // Requis par l'interface OrderMessage
            sender
          } as OrderMessage]);
          
          // Pour la démonstration, mettre à jour le compteur de messages non lus
          console.log("✅ Message correctement intégré dans l'interface");
          
          // Jouer un son de notification
          if (audioRef.current) {
            audioRef.current.play().catch(error => {
              console.error("Erreur lors de la lecture du son de notification:", error);
            });
          }
          
          // Si le son ne peut pas être joué, essayer de montrer une notification système
          if ('Notification' in window && Notification.permission === 'granted') {
            const notificationTitle = `Nouveau message - ${sender?.username || 'Utilisateur'}`;
            const notificationBody = newMessage.content.length > 60 
              ? newMessage.content.substring(0, 60) + '...' 
              : newMessage.content;
              
            const notification = new Notification(notificationTitle, {
              body: notificationBody,
              icon: '/vynal-logo.png'
            });
            
            // Fermer la notification après quelques secondes
            setTimeout(() => notification.close(), 5000);
          }
        })
        .subscribe((status) => {
          console.log(`Statut de l'abonnement au canal ${channelId}:`, status);
          if (status === "SUBSCRIBED") {
            console.log(`✅ Abonnement réussi au canal ${channelId}`);
          } else if (status === "CHANNEL_ERROR") {
            console.error(`❌ Erreur d'abonnement au canal ${channelId}`);
            
            // Tentative de réabonnement après un délai
            setTimeout(() => {
              if (channelRef.current === channel) {
                console.log("Tentative de réabonnement après erreur...");
                setupRealtimeSubscription();
              }
            }, 5000);
          }
        });
        
      channelRef.current = channel;
      
      // Créer un système de vérification périodique de la connexion
      const checkConnectionInterval = setInterval(() => {
        if (channel && channelRef.current === channel) {
          // Envoyer un ping pour vérifier la connexion
          channel.send({
            type: 'broadcast',
            event: 'ping',
            payload: { timestamp: new Date().toISOString() }
          });
        } else {
          clearInterval(checkConnectionInterval);
        }
      }, 30000); // Vérifier toutes les 30 secondes
      
      return () => {
        console.log(`Nettoyage de l'abonnement temps réel pour ${orderId}`);
        if (channel) {
          supabase.removeChannel(channel);
          clearInterval(checkConnectionInterval);
        }
      };
    } catch (error) {
      console.error("Erreur lors de la configuration de l'abonnement temps réel:", error);
      return null;
    }
  }, [orderId, user?.id, isFreelance, orderDetails]);

  // Initialiser les données et l'abonnement temps réel
  useEffect(() => {
    // Charger les données de la commande
    fetchOrderData();
    
    // Nettoyer les ressources lors du démontage
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
      
      if (channelRef.current) {
        const supabase = createClientComponentClient();
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [fetchOrderData]);
  
  // Configurer l'abonnement en temps réel une fois les détails de la commande chargés
  useEffect(() => {
    if (orderDetails && user?.id) {
      const cleanup = setupRealtimeSubscription();
      
      return () => {
        if (cleanup) cleanup();
      };
    }
  }, [orderDetails, user?.id, setupRealtimeSubscription]);

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