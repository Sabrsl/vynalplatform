import { create } from 'zustand';
import { supabase } from '@/lib/supabase/client';
import type { Database } from '@/types/database';
import { StateCreator } from 'zustand';
import { UserProfile } from '@/hooks/useUser';
import { validateMessage } from '@/lib/message-validation';
import { measure, PerformanceEventType } from '@/lib/performance/metrics';
import { 
  compressMessageData, 
  compressConversationData, 
  shouldCompressMessages 
} from '@/lib/optimizations/compression';

export type Message = Database['public']['Tables']['messages']['Row'] & {
  sender?: UserProfile;
  order_id?: string;
};

export type ConversationParticipant = UserProfile & {
  unread_count: number;
  online?: boolean;
  last_seen?: string | null;
};

export type Conversation = Database['public']['Tables']['conversations']['Row'] & {
  participants: ConversationParticipant[];
  last_message?: {
    content: string;
    created_at: string;
    sender_id: string;
  };
  // Champs optionnels pour les conversations de commandes
  order_id?: string;
  service_title?: string;
};

type OrderResponse = {
  id: string;
  created_at: string;
  updated_at: string;
  client_id: string;
  freelance_id: string;
  services: { title: string }[];
  profiles: UserProfile;
};

type MessagingState = {
  conversations: Conversation[];
  activeConversation: Conversation | null;
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  isTyping: { [userId: string]: boolean };
  fetchConversations: (userId: string) => Promise<Conversation[] | undefined>;
  fetchMessages: (conversationId: string) => Promise<Message[]>;
  sendMessage: (conversationId: string, senderId: string, content: string, attachmentUrl?: string, attachmentType?: string, attachmentName?: string) => Promise<Message | null>;
  createConversation: (participants: string[], initialMessage?: string) => Promise<string | null>;
  markAsRead: (conversationId: string, userId: string) => Promise<void>;
  setIsTyping: (conversationId: string, userId: string, isTyping: boolean) => Promise<void>;
  setupRealtimeSubscriptions: (userId: string) => () => void;
  clearError: () => void;
  markSpecificMessagesAsRead: (conversationId: string, userId: string, messageIds: string[]) => Promise<void>;
  setMessages: (messages: Message[]) => void;
};

export const useMessagingStore = create<MessagingState>(
  ((set, get) => ({
    conversations: [],
    activeConversation: null,
    messages: [],
    isLoading: false,
    error: null,
    isTyping: {},

    fetchConversations: async (userId: string) => {
      return measure(
        PerformanceEventType.CONVERSATIONS_LOAD,
        async () => {
          set({ isLoading: true, error: null });
          try {
            console.log("Récupération des conversations pour l'utilisateur:", userId);
            
            // Vérifier que l'ID est valide
            if (!userId) {
              console.error("ID utilisateur non valide");
              set({ error: "ID utilisateur non valide", isLoading: false });
              return;
            }
            
            // Vérifier que l'utilisateur est bien authentifié
            const { data: userSession } = await supabase.auth.getSession();
            const sessionUserId = userSession?.session?.user?.id;
            
            if (!sessionUserId) {
              console.error("Utilisateur non authentifié");
              set({ error: "Vous devez être connecté pour accéder aux conversations", isLoading: false });
              return;
            }
            
            // Vérifier que l'ID demandé correspond à l'utilisateur authentifié
            if (userId !== sessionUserId) {
              console.error("Tentative d'accès aux conversations d'un autre utilisateur");
              set({ error: "Vous n'êtes pas autorisé à voir ces conversations", isLoading: false });
              return;
            }
            
            console.log("Authentification vérifiée, récupération des conversations...");
            
            // CORRECTION: Utiliser une requête plus simple et robuste pour éviter les erreurs 500
            try {
              // D'abord vérifier si la table de messages est accessible
              const healthCheck = await supabase
                .from('messages')
                .select('count', { count: 'exact', head: true })
                .limit(1);
              
              if (healthCheck.error) {
                console.error("Erreur lors de la vérification de la table messages:", healthCheck.error);
                set({ error: "La base de données est temporairement indisponible", isLoading: false, conversations: [] });
                return;
              }
            } catch (innerError) {
              console.error("Erreur de connexion à la base de données:", innerError);
              set({ error: "Impossible de se connecter à la base de données", isLoading: false, conversations: [] });
              return;
            }
            
            // Récupérer le rôle de l'utilisateur courant
            const { data: userData, error: userError } = await supabase
              .from('profiles')
              .select('role')
              .eq('id', userId)
              .single();
            
            if (userError) {
              console.error("Erreur lors de la récupération du rôle de l'utilisateur:", userError);
            }
            
            const userRole = userData?.role;
            console.log(`Rôle de l'utilisateur actuel: ${userRole}`);
            
            const isFreelance = userRole === 'freelance';
            
            // Récupérer les messages de commandes si utilisateur est un freelance
            let orderConversations: Conversation[] = [];
            
            if (isFreelance) {
              console.log("Recherche de messages de commandes pour le freelance...");
              try {
                // Récupérer les commandes où l'utilisateur est le freelance
                const { data: ordersData, error: ordersError } = await supabase
                  .from('orders')
                  .select(`
                    id,
                    created_at,
                    updated_at,
                    client_id,
                    freelance_id,
                    services(title),
                    profiles!orders_client_id_fkey(id, username, full_name, avatar_url, role)
                  `)
                  .eq('freelance_id', userId) as { data: OrderResponse[] | null, error: any };
                
                if (ordersError) {
                  console.error("Erreur lors de la récupération des commandes:", ordersError);
                } else if (ordersData && ordersData.length > 0) {
                  console.log(`${ordersData.length} commandes trouvées pour le freelance`);
                  
                  // Pour chaque commande, récupérer le dernier message
                  for (const order of ordersData) {
                    // Vérifier s'il y a des messages pour cette commande
                    const { data: orderMessages, error: messagesError } = await supabase
                      .from('messages')
                      .select('id, content, created_at, sender_id, read')
                      .eq('order_id', order.id)
                      .order('created_at', { ascending: false })
                      .limit(1);
                      
                    if (messagesError) {
                      console.error(`Erreur lors de la récupération des messages pour la commande ${order.id}:`, messagesError);
                      continue;
                    }
                    
                    if (orderMessages && orderMessages.length > 0) {
                      const lastMessage = orderMessages[0];
                      
                      // Compter les messages non lus
                      const { count: unreadCount, error: countError } = await supabase
                        .from('messages')
                        .select('id', { count: 'exact' })
                        .eq('order_id', order.id)
                        .eq('read', false)
                        .neq('sender_id', userId);
                        
                      if (countError) {
                        console.error(`Erreur lors du comptage des messages non lus pour la commande ${order.id}:`, countError);
                      }
                      
                      // Créer une "pseudo-conversation" pour cette commande
                      // Préparer un participant qui correspond à la définition de ConversationParticipant
                      const clientProfile: ConversationParticipant = {
                        id: (order.profiles as any)?.id || '',
                        username: (order.profiles as any)?.username || '',
                        full_name: (order.profiles as any)?.full_name || '',
                        avatar_url: (order.profiles as any)?.avatar_url || '',
                        role: ((order.profiles as any)?.role) || 'client',
                        email: '',
                        bio: '',
                        created_at: order.created_at || new Date().toISOString(),
                        updated_at: order.updated_at || new Date().toISOString(),
                        last_seen: null,
                        unread_count: unreadCount || 0,
                        online: false,
                        verification_level: 0,
                        phone: null
                      };
                      
                      const orderConversation: Conversation = {
                        id: `order-${order.id}`, // ID unique pour cette "conversation de commande"
                        created_at: order.created_at,
                        updated_at: order.updated_at,
                        last_message_id: lastMessage.id,
                        last_message_time: lastMessage.created_at,
                        participants: [clientProfile],
                        last_message: {
                          content: lastMessage.content,
                          created_at: lastMessage.created_at,
                          sender_id: lastMessage.sender_id
                        },
                        order_id: order.id, // Ajout d'un champ pour identifier que c'est une commande
                        service_title: Array.isArray(order.services) && order.services[0] ? order.services[0].title : 'Commande' // Titre du service pour l'affichage
                      };
                      
                      orderConversations.push(orderConversation);
                    }
                  }
                  
                  console.log(`${orderConversations.length} conversations de commandes créées`);
                }
              } catch (orderError) {
                console.error("Erreur lors de la récupération des commandes:", orderError);
              }
            }
            
            // Approche simplifiée: récupérer les conversations à partir des participants avec jointure
            const { data, error } = await supabase
              .from('conversation_participants')
              .select(`
                conversation_id,
                unread_count,
                conversations:conversation_id (
                  id, 
                  created_at, 
                  updated_at, 
                  last_message_id,
                  last_message_time
                )
              `)
              .eq('participant_id', userId);
            
            if (error) {
              console.error("Erreur lors de la récupération des conversations:", error);
              set({ error: `Erreur de récupération des conversations: ${error.message}`, isLoading: false, conversations: [] });
              return;
            }
            
            if (!data || data.length === 0) {
              console.log("Aucune conversation trouvée pour l'utilisateur");
              
              // Si on a des conversations de commandes mais pas de conversations normales
              if (orderConversations.length > 0) {
                console.log("Retour des conversations de commandes uniquement");
                set({ conversations: orderConversations, isLoading: false });
                return orderConversations;
              }
              
              set({ conversations: [], isLoading: false });
              return;
            }
            
            console.log(`${data.length} conversations trouvées pour l'utilisateur:`, data);
            
            // Récupérer les IDs de conversations valides
            const validConversations = data.filter(item => item.conversations);
            const conversationIds = validConversations.map(item => item.conversation_id);
            
            if (conversationIds.length === 0) {
              console.log("Aucune conversation valide trouvée");
              
              // Si on a des conversations de commandes mais pas de conversations normales
              if (orderConversations.length > 0) {
                console.log("Retour des conversations de commandes uniquement");
                set({ conversations: orderConversations, isLoading: false });
                return orderConversations;
              }
              
              set({ conversations: [], isLoading: false });
              return;
            }
            
            console.log("Liste des IDs de conversations valides:", conversationIds);
            
            // Récupérer tous les participants pour ces conversations
            const { data: allParticipantsData, error: participantsError } = await supabase
              .from('conversation_participants')
              .select(`
                conversation_id,
                unread_count,
                profiles:participant_id (
                  id,
                  username,
                  full_name,
                  avatar_url,
                  bio,
                  role,
                  email,
                  created_at,
                  updated_at,
                  last_seen
                )
              `)
              .in('conversation_id', conversationIds);
            
            if (participantsError) {
              console.error("Erreur lors de la récupération des participants:", participantsError);
              throw new Error(`Erreur de récupération des participants: ${participantsError.message}`);
            }
            
            if (!allParticipantsData || allParticipantsData.length === 0) {
              console.error("Aucun participant trouvé pour les conversations");
              throw new Error("Erreur de données: participants manquants");
            }
            
            console.log(`${allParticipantsData.length} participants trouvés au total`);
            
            // Récupérer les derniers messages
            const lastMessageIds = validConversations
              .filter(conv => (conv.conversations as any)?.last_message_id)
              .map(conv => (conv.conversations as any).last_message_id);
              
            let lastMessages: Record<string, any> = {};
            
            if (lastMessageIds.length > 0) {
              const { data: messagesData, error: messagesError } = await supabase
                .from('messages')
                .select('id, content, created_at, sender_id')
                .in('id', lastMessageIds);
                
              if (messagesError) {
                console.error("Erreur lors de la récupération des derniers messages:", messagesError);
              } else if (messagesData) {
                messagesData.forEach(msg => {
                  lastMessages[msg.id] = msg;
                });
              }
            }
            
            // Construire les objets Conversation
            const processedConversations: Conversation[] = validConversations.map(convItem => {
              const conv = convItem.conversations as any;
              
              // Regrouper les participants par conversation
              const participants = allParticipantsData
                .filter(p => p.conversation_id === convItem.conversation_id)
                .map(p => {
                  const profile = Array.isArray(p.profiles) ? p.profiles[0] as UserProfile : p.profiles as UserProfile;
                  
                  // Vérifier si l'utilisateur est en ligne (actif dans les 2 dernières minutes)
                  const isOnline = (lastSeen: any): boolean => {
                    if (!lastSeen) return false;
                    
                    try {
                      const now = new Date();
                      const lastSeenDate = new Date(lastSeen);
                      const twoMinutesAgo = new Date(now.getTime() - 2 * 60 * 1000);
                      
                      return lastSeenDate >= twoMinutesAgo;
                    } catch (error) {
                      console.error('Erreur lors de la vérification du statut en ligne:', error);
                      return false;
                    }
                  };

                  return {
                    ...profile,
                    unread_count: profile.id === userId ? p.unread_count : 0,
                    online: isOnline(profile.last_seen)
                  } as ConversationParticipant;
                });
                
              // Récupérer le dernier message
              const lastMessage = conv.last_message_id 
                ? lastMessages[conv.last_message_id] 
                : undefined;
                
              return {
                id: conv.id,
                created_at: conv.created_at,
                updated_at: conv.updated_at,
                last_message_id: conv.last_message_id,
                last_message_time: conv.last_message_time,
                participants,
                last_message: lastMessage
              } as Conversation;
            });
            
            // Combiner les conversations régulières avec les conversations de commandes
            let combinedConversations = [...processedConversations, ...orderConversations];
            
            // Ne pas filtrer par rôle pour les freelances pour s'assurer qu'ils voient tous leurs messages
            // Pour les clients, on peut toujours filtrer pour ne montrer que les conversations avec des freelances
            if (userRole) {
              if (userRole === 'freelance') {
                // Les freelances doivent voir toutes leurs conversations
                console.log(`Utilisateur freelance: affichage de toutes les ${combinedConversations.length} conversations`);
                
                // Trier par date du dernier message
                combinedConversations.sort((a, b) => {
                  const aTime = a.last_message_time || a.updated_at || a.created_at;
                  const bTime = b.last_message_time || b.updated_at || b.created_at;
                  return new Date(bTime).getTime() - new Date(aTime).getTime();
                });
                
                set({ conversations: combinedConversations, isLoading: false });
                return combinedConversations;
              } else {
                // Pour les clients, on filtre comme avant
                const compatibleRole = 'freelance'; // Les clients ne voient que les conversations avec des freelances
                
                const filteredConversations = combinedConversations.filter(conversation => {
                  // Si c'est une conversation de commande, l'inclure automatiquement
                  if ('order_id' in conversation) return true;
                  
                  // Trouver l'autre participant (autre que l'utilisateur actuel)
                  const otherParticipant = conversation.participants.find(p => p.id !== userId);
                  // Vérifier si l'autre participant a le rôle compatible
                  return otherParticipant?.role === compatibleRole;
                });
                
                console.log(`${filteredConversations.length}/${combinedConversations.length} conversations filtrées par rôle pour client`);
                set({ conversations: filteredConversations, isLoading: false });
                return filteredConversations;
              }
            }

            // Si pas de filtrage par rôle (erreur ou rôle non défini), on garde toutes les conversations
            console.log(`${combinedConversations.length} conversations traitées avec succès`);
            set({ conversations: combinedConversations, isLoading: false });

            if (combinedConversations.length > 10) {
              // Compresser les données si trop nombreuses
              const compressedData = compressConversationData(combinedConversations);
              set({ conversations: compressedData as Conversation[], isLoading: false });
            }
            
            return combinedConversations;
          } catch (err: any) {
            console.error('Erreur détaillée lors de la récupération des conversations:', err);
            set({ 
              error: `Impossible de récupérer les conversations: ${err.message || 'Erreur inconnue'}`, 
              isLoading: false,
              conversations: []
            });
            throw err;
          }
        },
        { userId }
      );
    },

    fetchMessages: async (conversationId: string) => {
      return measure(
        PerformanceEventType.MESSAGES_LOAD,
        async () => {
          set({ isLoading: true, error: null });
          try {
            console.log(`Récupération des messages pour la conversation ${conversationId}...`);
            
            if (!conversationId) {
              console.error("ID de conversation non valide");
              throw new Error("ID de conversation non valide");
            }
            
            // 1. Vérifier si l'utilisateur a accès à cette conversation
            const { data: userSession } = await supabase.auth.getSession();
            const userId = userSession?.session?.user?.id;
            
            if (!userId) {
              console.error("Utilisateur non authentifié");
              throw new Error("Vous devez être connecté pour accéder aux messages");
            }
            
            console.log(`Vérification des permissions pour l'utilisateur ${userId}...`);
            
            // Si c'est une conversation de commande, vérifier directement l'accès à la commande
            if (conversationId.startsWith('order-')) {
              const orderId = conversationId.replace('order-', '');
              const { data: orderData, error: orderError } = await supabase
                .from('orders')
                .select(`
                  id,
                  created_at,
                  updated_at,
                  client_id,
                  freelance_id,
                  services(title),
                  profiles!orders_client_id_fkey(
                    id,
                    username,
                    full_name,
                    avatar_url,
                    bio,
                    role,
                    email,
                    created_at,
                    updated_at,
                    verification_level,
                    last_seen,
                    phone
                  )
                `)
                .eq('id', orderId)
                .single();
                
              if (orderError) {
                console.error("Erreur lors de la vérification de l'accès à la commande:", orderError);
                throw new Error(`Permission refusée: ${orderError.message}`);
              }
              
              if (!orderData || (orderData.freelance_id !== userId && orderData.client_id !== userId)) {
                console.error("L'utilisateur n'a pas accès à cette commande");
                throw new Error("Vous n'avez pas accès à cette commande");
              }
            } else {
              // Pour les conversations normales, vérifier via conversation_participants
              const { data: participantCheck, error: participantError } = await supabase
                .from('conversation_participants')
                .select('conversation_id')
                .eq('conversation_id', conversationId)
                .eq('participant_id', userId)
                .maybeSingle();
              
              if (participantError) {
                console.error("Erreur lors de la vérification des permissions:", participantError);
                throw new Error(`Permission refusée: ${participantError.message}`);
              }
              
              if (!participantCheck) {
                console.error("L'utilisateur n'a pas accès à cette conversation");
                throw new Error("Vous n'avez pas accès à cette conversation");
              }
            }
            
            console.log("Accès vérifié, récupération des messages...");
            
            // Récupérer les messages avec les informations de l'expéditeur
            const { data, error } = await supabase
              .from('messages')
              .select(`
                *,
                profiles:sender_id (
                  id,
                  username,
                  full_name,
                  avatar_url,
                  bio,
                  role,
                  email,
                  created_at,
                  updated_at,
                  verification_level,
                  last_seen,
                  phone
                )
              `)
              .eq(conversationId.startsWith('order-') ? 'order_id' : 'conversation_id', 
                  conversationId.startsWith('order-') ? conversationId.replace('order-', '') : conversationId)
              .order('created_at', { ascending: true });

            if (error) {
              console.error("Erreur lors de la récupération des messages:", error);
              throw error;
            }
            
            console.log(`${data?.length || 0} messages récupérés avec succès`);

            // Transformer les messages pour inclure les informations de l'expéditeur
            const messages = data.map((msg: any) => {
              // Créer un objet message avec les informations de base
              const message: Message = {
                id: msg.id,
                sender_id: msg.sender_id,
                content: msg.content,
                created_at: msg.created_at,
                read: msg.read,
                attachment_url: msg.attachment_url,
                attachment_type: msg.attachment_type,
                attachment_name: msg.attachment_name,
                conversation_id: msg.conversation_id,
                order_id: msg.order_id,
                is_typing: false,
                sender: msg.profiles ? {
                  id: msg.profiles.id,
                  username: msg.profiles.username,
                  full_name: msg.profiles.full_name,
                  avatar_url: msg.profiles.avatar_url,
                  bio: msg.profiles.bio,
                  role: msg.profiles.role,
                  email: msg.profiles.email,
                  created_at: msg.profiles.created_at,
                  updated_at: msg.profiles.updated_at,
                  verification_level: msg.profiles.verification_level,
                  last_seen: msg.profiles.last_seen,
                  phone: msg.profiles.phone
                } : undefined
              };

              return message;
            });

            // Mettre à jour la conversation active avant de mettre à jour les messages
            const { conversations } = get();
            let activeConversation = conversations.find((c: Conversation) => c.id === conversationId);
            
            if (!activeConversation) {
              console.log("Conversation non trouvée dans la liste, création d'une nouvelle conversation...");
              if (conversationId.startsWith('order-')) {
                const orderId = conversationId.replace('order-', '');
                const { data: orderData } = await supabase
                  .from('orders')
                  .select(`
                    id,
                    created_at,
                    updated_at,
                    client_id,
                    freelance_id,
                    services(title),
                    profiles!orders_client_id_fkey(
                      id,
                      username,
                      full_name,
                      avatar_url,
                      bio,
                      role,
                      email,
                      created_at,
                      updated_at,
                      verification_level,
                      last_seen,
                      phone
                    )
                  `)
                  .eq('id', orderId)
                  .single();
                  
                if (orderData) {
                  const clientProfile = orderData.profiles as unknown as UserProfile;
                  activeConversation = {
                    id: conversationId,
                    created_at: orderData.created_at,
                    updated_at: orderData.updated_at,
                    last_message_id: null,
                    last_message_time: null,
                    participants: [
                      {
                        ...clientProfile,
                        unread_count: 0,
                        online: false,
                        last_seen: null
                      }
                    ],
                    order_id: orderId,
                    service_title: orderData.services?.[0]?.title || 'Commande'
                  } as Conversation;
                }
              }
            }

            if (activeConversation) {
              // Mettre à jour le dernier message de la conversation
              const lastMessage = messages[messages.length - 1];
              if (lastMessage) {
                activeConversation.last_message = {
                  content: lastMessage.content,
                  created_at: lastMessage.created_at,
                  sender_id: lastMessage.sender_id
                };
              }
              
              set({ activeConversation });
            }

            // Mettre à jour les messages
            if (shouldCompressMessages(messages, 30)) {
              const compressedMessages = compressMessageData(messages);
              set({ messages: compressedMessages as Message[], isLoading: false });
            } else {
              set({ messages, isLoading: false });
            }

            return messages;
          } catch (err: any) {
            console.error('Erreur détaillée lors de la récupération des messages:', err);
            set({ 
              error: `Impossible de récupérer les messages: ${err.message || 'Erreur inconnue'}`, 
              isLoading: false 
            });
            throw err;
          }
        },
        { conversationId }
      );
    },

    sendMessage: async (
      conversationId: string, 
      senderId: string, 
      content: string, 
      attachmentUrl?: string, 
      attachmentType?: string, 
      attachmentName?: string
    ) => {
      return measure(
        PerformanceEventType.MESSAGE_SEND,
        async () => {
          set({ isLoading: true, error: null });
          try {
            console.log(`Envoi d'un message dans la conversation ${conversationId} par ${senderId}`);
            
            // Déterminer si c'est une conversation de commande
            const isOrderConversation = conversationId.startsWith('order-');
            const actualConversationId = isOrderConversation ? conversationId.replace('order-', '') : conversationId;
            
            // Créer un nouveau message
            console.log("Insertion du message dans la base de données...");
            const messageData: {
              sender_id: string;
              content: string;
              read: boolean;
              attachment_url: string | null;
              attachment_type: string | null;
              attachment_name: string | null;
              is_typing: boolean;
              conversation_id?: string;
              order_id?: string;
            } = {
              sender_id: senderId,
              content,
              read: false,
              attachment_url: attachmentUrl || null,
              attachment_type: attachmentType || null,
              attachment_name: attachmentName || null,
              is_typing: false
            };

            // Ajouter le bon champ d'ID selon le type de conversation
            if (isOrderConversation) {
              messageData.order_id = actualConversationId;
            } else {
              messageData.conversation_id = actualConversationId;
            }

            // Insérer le message et récupérer les détails complets
            const { data, error } = await supabase
              .from('messages')
              .insert(messageData)
              .select(`
                *,
                profiles:sender_id (
                  id,
                  username,
                  full_name,
                  avatar_url,
                  bio,
                  role,
                  email,
                  created_at,
                  updated_at,
                  verification_level,
                  last_seen,
                  phone
                )
              `)
              .single();

            if (error) {
              console.error("Erreur lors de l'insertion du message:", error);
              throw error;
            }
            
            console.log("Message inséré avec succès:", data);

            // Mettre à jour le dernier message de la conversation
            if (!isOrderConversation) {
              console.log("Mise à jour du dernier message de la conversation...");
              const { error: updateError } = await supabase
                .from('conversations')
                .update({
                  last_message_id: data.id,
                  last_message_time: data.created_at,
                  updated_at: new Date().toISOString()
                })
                .eq('id', conversationId);
                
              if (updateError) {
                console.error("Erreur lors de la mise à jour du dernier message:", updateError);
              } else {
                console.log("Dernier message mis à jour avec succès");
              }
            }

            // Mettre à jour les compteurs de messages non lus
            console.log("Mise à jour des compteurs de messages non lus...");
            try {
              if (isOrderConversation) {
                // Pour les commandes, on met à jour directement le compteur
                const { error: updateError } = await supabase
                  .from('messages')
                  .update({ read: false })
                  .eq('order_id', actualConversationId)
                  .neq('sender_id', senderId);
                  
                if (updateError) {
                  console.error("Erreur lors de la mise à jour des compteurs de commande:", updateError);
                }
              } else {
                await supabase.rpc('increment_unread_count', {
                  p_conversation_id: conversationId,
                  p_sender_id: senderId
                });
              }
              console.log("Compteurs de messages non lus mis à jour");
            } catch (incrementError) {
              console.error("Erreur lors de la mise à jour des compteurs:", incrementError);
            }

            // Créer le nouveau message avec les informations de l'expéditeur
            const newMessage: Message = {
              ...data,
              sender: data.profiles
            };

            // Mettre à jour l'état local avec le nouveau message
            set((state: MessagingState) => ({
              messages: [...state.messages, newMessage],
              isLoading: false
            }));
            
            // Rafraîchir la liste des conversations pour mettre à jour les compteurs
            await get().fetchConversations(senderId);
            
            console.log("Message envoyé avec succès");
            
            return newMessage;
          } catch (err) {
            console.error('Erreur détaillée lors de l\'envoi du message:', err);
            set({ error: 'Impossible d\'envoyer le message', isLoading: false });
            throw err;
          }
        },
        { conversationId, senderId, messageSize: content.length, hasAttachment: !!attachmentUrl }
      );
    },

    createConversation: async (participants: string[], initialMessage?: string) => {
      set({ isLoading: true, error: null });
      try {
        console.log("Début de création de conversation entre:", participants);
        console.log("Message initial (avant validation):", initialMessage);

        if (!initialMessage || initialMessage.trim() === '') {
          console.error("Message initial requis");
          throw new Error("Un message initial est requis pour créer une conversation");
        }
        
        // Validation supplémentaire des ID de participants
        if (!Array.isArray(participants) || participants.length < 2) {
          console.error("Au moins deux participants sont requis");
          throw new Error("Au moins deux participants sont requis pour une conversation");
        }
        
        const uuidRegex = /^[0-9a-fA-F-]{36}$/;
        for (const participantId of participants) {
          if (!uuidRegex.test(participantId)) {
            console.error("ID de participant invalide:", participantId);
            throw new Error("ID de participant invalide");
          }
        }

        // Vérification de l'authentification actuelle
        const { data: sessionData } = await supabase.auth.getSession();
        if (!sessionData?.session?.user?.id) {
          console.error("Utilisateur non authentifié");
          throw new Error("Vous devez être connecté pour créer une conversation");
        }
        
        const currentUserId = sessionData.session.user.id;
        if (!participants.includes(currentUserId)) {
          console.error("L'utilisateur actuel doit être un participant");
          throw new Error("Vous devez être l'un des participants de la conversation");
        }

        // Validation du contenu du message côté store (doublon de sécurité)
        console.log("Validation du message dans createConversation...");
        const validationResult = validateMessage(initialMessage.trim(), {
          maxLength: 5000,
          minLength: 1,
          censorInsteadOfBlock: true,
          allowQuotedWords: true,
          allowLowSeverityWords: true,
          respectRecommendedActions: true
        });
        
        console.log("Résultat de validation dans store:", validationResult);
        
        // Si la validation échoue, ne pas créer la conversation
        if (!validationResult.isValid) {
          const errMsg = validationResult.errors.join(', ');
          console.error("Validation du message échouée dans le store:", errMsg);
          throw new Error(errMsg);
        }
        
        // Utiliser le message potentiellement censuré
        let finalMessageText = validationResult.message;
        
        // Si le message a été censuré, ajouter un marqueur spécial
        if (validationResult.censored) {
          finalMessageText += " [Ce message a été modéré automatiquement]";
          console.log("Message censuré dans le store:", finalMessageText);
        }

        // Utiliser la fonction RPC pour créer la conversation en une seule transaction
        console.log("Appel de la fonction RPC create_conversation_with_message");
        console.log("Message à envoyer (après validation):", finalMessageText.trim());
        
        const { data, error } = await supabase.rpc('create_conversation_with_message', {
          p_participants: participants,
          p_initial_message: finalMessageText.trim(),
          p_sender_id: currentUserId // Utiliser l'ID de l'utilisateur actuel comme expéditeur
        });

        if (error) {
          console.error("Erreur lors de l'appel à create_conversation_with_message:", error);
          throw new Error(`Erreur lors de la création de la conversation: ${error.message}`);
        }

        const conversationId = data;
        console.log("Conversation créée avec succès via RPC, ID:", conversationId);

        // Récupérer les conversations mises à jour
        console.log("Mise à jour de la liste des conversations...");
        await get().fetchConversations(currentUserId);
        console.log("Liste des conversations mise à jour");

        set({ isLoading: false });
        return conversationId;
      } catch (err) {
        console.error('Erreur détaillée lors de la création de la conversation:', err);
        const errorMessage = err instanceof Error ? err.message : 'Impossible de créer la conversation';
        set({ error: errorMessage, isLoading: false });
        return null;
      }
    },

    markAsRead: async (conversationId: string, userId: string) => {
      set({ isLoading: true, error: null });
      try {
        console.log(`Marquage des messages comme lus pour la conversation ${conversationId}`);
        
        // Utiliser la fonction RPC pour marquer les messages comme lus en une seule transaction
        const { error } = await supabase.rpc('mark_messages_as_read', {
          p_conversation_id: conversationId,
          p_user_id: userId
        });
        
        if (error) {
          console.error("Erreur lors du marquage des messages comme lus:", error);
          throw error;
        }
        
        console.log("Messages marqués comme lus avec succès");
        
        // Mettre à jour l'état local
        set((state: MessagingState) => {
          // Mettre à jour le compteur de messages non lus dans les conversations
          const updatedConversations = state.conversations.map((conv: Conversation) => {
            if (conv.id === conversationId) {
              const updatedParticipants = conv.participants.map((p: any) => 
                p.id === userId ? { ...p, unread_count: 0 } : p
              );
              return { ...conv, participants: updatedParticipants };
            }
            return conv;
          });
          
          // Mettre à jour le flag "read" de tous les messages dans l'état
          const updatedMessages = state.messages.map((msg: Message) => 
            msg.conversation_id === conversationId && msg.sender_id !== userId
              ? { ...msg, read: true }
              : msg
          );
          
          return { 
            conversations: updatedConversations,
            messages: updatedMessages,
            isLoading: false
          };
        });
        
        console.log("État local mis à jour pour refléter les messages lus");
      } catch (err) {
        console.error('Erreur détaillée lors du marquage des messages comme lus:', err);
        set({ isLoading: false });
      }
    },
    
    // Nouvelle fonction pour marquer uniquement des messages spécifiques comme lus
    markSpecificMessagesAsRead: async (conversationId: string, userId: string, messageIds: string[]) => {
      if (!messageIds || messageIds.length === 0) return;
      
      try {
        console.log(`Marquage de ${messageIds.length} messages spécifiques comme lus`);
        
        // Extraire l'ID de commande si c'est une conversation de commande
        const actualConversationId = conversationId.startsWith('order-') 
          ? conversationId.replace('order-', '') 
          : conversationId;
        
        // Mise à jour en base de données
        const { error } = await supabase
          .from('messages')
          .update({ read: true })
          .in('id', messageIds)
          .eq(conversationId.startsWith('order-') ? 'order_id' : 'conversation_id', actualConversationId)
          .neq('sender_id', userId);  // Ne pas marquer les messages envoyés par l'utilisateur
          
        if (error) {
          console.error("Erreur lors du marquage des messages spécifiques comme lus:", error);
          return;
        }
        
        // Mise à jour de l'état local
        set((state: MessagingState) => {
          const updatedMessages = state.messages.map((msg: Message) => 
            messageIds.includes(msg.id) ? { ...msg, read: true } : msg
          );
          
          // Recalculer le nombre de messages non lus pour cette conversation
          const unreadMessages = updatedMessages.filter(
            msg => (msg.conversation_id === conversationId || msg.order_id === actualConversationId) && 
                  msg.sender_id !== userId && 
                  !msg.read
          ).length;
          
          // Mettre à jour le compteur dans les participants de la conversation
          const updatedConversations = state.conversations.map((conv: Conversation) => {
            if (conv.id === conversationId) {
              const updatedParticipants = conv.participants.map((p: any) => 
                p.id === userId ? { ...p, unread_count: unreadMessages } : p
              );
              return { ...conv, participants: updatedParticipants };
            }
            return conv;
          });
          
          return { 
            messages: updatedMessages,
            conversations: updatedConversations
          };
        });
        
      } catch (err) {
        console.error('Erreur lors du marquage des messages spécifiques comme lus:', err);
      }
    },

    setIsTyping: async (conversationId: string, userId: string, isTyping: boolean) => {
      try {
        // Mettre à jour l'état local uniquement
        set((state: MessagingState) => ({
          isTyping: { ...state.isTyping, [userId]: isTyping }
        }));

        // Au lieu d'insérer un message, utilisons un canal en temps réel pour signaler l'activité de frappe
        await supabase.channel('typing-channel')
          .send({
            type: 'broadcast',
            event: 'typing',
            payload: { 
              conversation_id: conversationId, 
              user_id: userId, 
              is_typing: isTyping 
            }
          });
        
        // Si l'utilisateur ne tape plus, réinitialiser après un court délai
        if (!isTyping) {
          setTimeout(() => {
            set((state: MessagingState) => {
              // Vérifier si l'état n'a pas été modifié entre-temps
              if (state.isTyping[userId] === isTyping) {
                return { isTyping: { ...state.isTyping, [userId]: false } };
              }
              return state;
            });
          }, 500);
        }
      } catch (err) {
        console.error('Erreur lors de la mise à jour du statut de frappe:', err);
      }
    },

    setupRealtimeSubscriptions: (userId: string) => {
      // Abonnement aux changements de messages
      const messagesSubscription = supabase
        .channel('messages-channel')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'messages'
          },
          async (payload: any) => {
            const { new: newMessage } = payload;
            const { activeConversation, messages } = get();

            // Créer un objet message complet avec les informations de l'expéditeur
            const messageData = {
              ...newMessage,
              sender: newMessage.profiles
            };

            // Vérifier si le message est pour la conversation active
            const isForActiveConversation = 
              (activeConversation?.id === newMessage.conversation_id) || 
              (activeConversation?.id === `order-${newMessage.order_id}`);
            
            if (isForActiveConversation) {
              // Éviter les doublons
              if (!messages.some((m: Message) => m.id === newMessage.id)) {
                console.log("Ajout du nouveau message à la conversation active:", messageData.id);
                set((state: MessagingState) => ({
                  messages: [...state.messages, { ...messageData, sender: messageData.profiles }]
                }));
              }
            }

            // Mettre à jour la liste des conversations immédiatement
            console.log("Mise à jour de la liste des conversations suite à un nouveau message");
            const updatedConversations = await get().fetchConversations(userId);
            
            // S'assurer que les conversations sont bien mises à jour dans le store
            if (updatedConversations) {
              set((state: MessagingState) => ({
                conversations: updatedConversations
              }));
            }
          }
        )
        .subscribe();

      // Abonnement aux indicateurs de frappe
      const typingSubscription = supabase
        .channel('typing-channel')
        .on('broadcast', { event: 'typing' }, (payload) => {
          const { user_id, is_typing } = payload.payload as { user_id: string, is_typing: boolean };
          
          // Mettre à jour l'état local
          set((state: MessagingState) => ({
            isTyping: { ...state.isTyping, [user_id]: is_typing }
          }));
          
          // Réinitialiser après un délai si l'utilisateur est en train d'écrire
          if (is_typing) {
            setTimeout(() => {
              set((state: MessagingState) => {
                // Seulement réinitialiser si l'état est toujours "en train d'écrire"
                if (state.isTyping[user_id]) {
                  return { isTyping: { ...state.isTyping, [user_id]: false } };
                }
                return state;
              });
            }, 3000);
          }
        })
        .subscribe();

      // Abonnement aux changements de conversation
      const conversationsSubscription = supabase
        .channel('conversations-channel')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'conversations'
          },
          () => {
            // Actualiser la liste des conversations
            get().fetchConversations(userId);
          }
        )
        .subscribe();

      // Retourner une fonction de nettoyage pour les abonnements
      return () => {
        supabase.removeChannel(messagesSubscription);
        supabase.removeChannel(typingSubscription);
        supabase.removeChannel(conversationsSubscription);
      };
    },

    clearError: () => {
      set({ error: null });
    },

    setMessages: (messages: Message[]) => set({ messages }),
  })) as StateCreator<MessagingState>
); 