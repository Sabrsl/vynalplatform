import { create } from 'zustand';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Message, OrderMessage, DirectMessage, PartialMessage } from '@/types/messages';
import { Conversation, ConversationParticipant } from '@/components/messaging/messaging-types';
import { supabase, channelManager } from '@/lib/supabase/client';

// Créer une instance de supabase
// const supabase = createClientComponentClient(); // Commenté car nous utilisons maintenant l'instance partagée

interface LastMessage {
  id: string;
  content: string;
  created_at: string;
  sender_id: string;
  read: boolean;
  attachment_url: string | null;
  attachment_type: string | null;
}

interface ConversationData {
  id: string;
  created_at: string;
  updated_at: string;
  last_message_time: string;
  status: string;
  last_message: LastMessage | null;
}

interface Participation {
  id: string;
  unread_count: number;
  last_read_message_id: string | null;
  conversation: ConversationData;
}

interface ParticipantData {
  participant: ConversationParticipant;
}

interface MessagingState {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  activeConversation: Conversation | null;
  messages: Message[];
  unreadCounts: Record<string, number>;
  onlineUsers: Set<string>;
  isTyping: Record<string, boolean>;
  loading: boolean;
  isLoading: boolean;
  error: string | null;
  totalConversations: number;
  fetchConversations: (userId: string, options?: { page: number; pageSize: number; status: string }) => Promise<Conversation[]>;
  fetchMessages: (conversationId: string) => Promise<Message[]>;
  setupRealtimeSubscriptions: (userId: string) => () => void;
  createConversation: (participantIds: string[]) => Promise<string | null>;
  sendMessage: (conversationId: string, senderId: string, content: string, attachmentUrl?: string, attachmentType?: string, attachmentName?: string) => Promise<void>;
  markMessagesAsRead: (conversationId: string, userId: string) => Promise<void>;
  markSpecificMessagesAsRead: (conversationId: string, userId: string, messageIds: string[]) => Promise<void>;
  setIsTyping: (conversationId: string, userId: string, isTyping: boolean) => Promise<void>;
  setMessages: (messages: Message[]) => void;
  setCurrentConversation: (conversation: Conversation | null) => void;
  setActiveConversation: (conversation: Conversation | null) => void;
  setConversations: (conversations: Conversation[]) => void;
  addMessage: (message: Message) => void;
  updateMessage: (messageId: string, updates: Partial<Message>) => void;
  deleteMessage: (messageId: string) => void;
  clearMessages: () => void;
  updateConversationParticipant: (conversationId: string, updatedParticipant: any) => void;
  invalidateCache: (type: 'conversations' | 'messages', id: string) => void;
}

// Cache globaux pour les conversations et messages
const CONVERSATION_CACHE = {
  byUserId: {} as Record<string, {
    data: Conversation[],
    totalCount: number,
    timestamp: number
  }>,
  pendingRequests: new Set<string>()
};

const MESSAGE_CACHE = {
  byConversationId: {} as Record<string, {
    data: Message[],
    timestamp: number
  }>,
  pendingRequests: new Set<string>()
};

// Durée de validité des caches
const CACHE_DURATION = {
  conversations: 60000, // 1 minute
  messages: 60000 // 1 minute
};

export const useMessagingStore = create<MessagingState>((set, get) => {
  // Fonction pour mettre à jour les informations des participants dans une conversation
  const updateParticipantsInfo = (conversationId: string, messages: any[], get: any, set: any) => {
    const { activeConversation } = get();
    if (activeConversation && activeConversation.id === conversationId) {
      const participantsToUpdate = new Map();
      
      // Collecter les informations les plus récentes des expéditeurs
      messages.forEach((message: any) => {
        if (message.sender && message.sender.id) {
          const existingInfo = participantsToUpdate.get(message.sender.id);
          
          // N'écraser que si on a de nouvelles informations
          if (!existingInfo || !existingInfo.avatar_url || !existingInfo.full_name) {
            participantsToUpdate.set(message.sender.id, {
              id: message.sender.id,
              username: message.sender.username || existingInfo?.username,
              full_name: message.sender.full_name || existingInfo?.full_name,
              avatar_url: message.sender.avatar_url || existingInfo?.avatar_url
            });
          }
        }
      });
      
      // Mettre à jour chaque participant
      participantsToUpdate.forEach((updatedInfo) => {
        const participant = activeConversation.participants.find((p: { id: string }) => p.id === updatedInfo.id);
        if (participant && (!participant.avatar_url || !participant.full_name)) {
          get().updateConversationParticipant(conversationId, updatedInfo);
        }
      });
    }
  };

  // Méthode de secours avec des requêtes séparées
  const fetchConversationsLegacy = async (userId: string, options = { page: 1, pageSize: 20, status: 'all' }) => {
    if (!userId) {
      console.warn("fetchConversationsLegacy: userId is required");
      return [];
    }
    
    // Vérifier si des conversations sont déjà en cache et récentes (moins de 30 secondes)
    const cacheKey = `conversations_${userId}`;
    const cachedData = localStorage.getItem(cacheKey);
    const now = Date.now();
    
    if (cachedData) {
      try {
        const { data, timestamp } = JSON.parse(cachedData);
        // Si le cache est récent (moins de 30 secondes), utiliser les données en cache
        if (now - timestamp < 30000) {
          console.log(`[useMessagingStore] Utilisation du cache pour les conversations (${Math.round((now - timestamp)/1000)}s)`);
          return data;
        }
      } catch (e) {
        console.error("Erreur lors de la lecture du cache des conversations:", e);
      }
    }
    
    try {
      set({ isLoading: true, error: null });
      
      // Récupérer les participations aux conversations
      const { data: participations, error: participationsError } = await supabase
        .from('conversation_participants')
        .select(`
          id,
          unread_count,
          last_read_message_id,
          conversation:conversation_id (
            id,
            created_at,
            updated_at,
            last_message_time,
            status,
            messages!conversation_id (
              id,
              content,
              created_at,
              sender_id,
              read,
              attachment_url,
              attachment_type
            )
          )
        `)
        .eq('participant_id', userId)
        .order('conversation(last_message_time)', { ascending: false })
        .range((options.page - 1) * options.pageSize, options.page * options.pageSize - 1);

      if (participationsError) throw participationsError;
      
      if (!participations || participations.length === 0) {
        set({ isLoading: false, conversations: [] });
        return [];
      }
      
      // Créer un map pour stocker toutes les participations par ID de conversation
      const conversationIds = participations.map((participation: any) => participation.conversation.id);
      
      // Récupérer tous les participants en une seule requête pour toutes les conversations
      const { data: allParticipants, error: partListError } = await supabase
        .from('conversation_participants')
        .select(`
          conversation_id,
          participant:participant_id (
            id,
            username,
            full_name,
            avatar_url,
            last_seen
          )
        `)
        .in('conversation_id', conversationIds)
        .neq('participant_id', userId);
      
      if (partListError) throw partListError;
      
      // Organiser les participants par ID de conversation
      const participantsByConversation = allParticipants?.reduce((acc, participant) => {
        if (!acc[participant.conversation_id]) {
          acc[participant.conversation_id] = [];
        }
        acc[participant.conversation_id].push(participant.participant);
        return acc;
      }, {} as Record<string, any[]>);
      
      // Construire les conversations complètes avec participants
      const conversationsWithParticipants = participations.map((participation: any) => {
        // Récupérer les participants pour cette conversation
        const participants = participantsByConversation[participation.conversation.id] || [];
        
        // Récupérer le dernier message en triant par date décroissante
        const lastMessage = participation.conversation.messages
          ?.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0] || null;

        return {
          ...participation,
          conversation: {
            ...participation.conversation,
            last_message: lastMessage,
            participants: participants.map((p: any) => ({
              id: p.id,
              username: p.username || "Utilisateur",
              full_name: p.full_name || "Utilisateur",
              avatar_url: p.avatar_url,
              last_seen: p.last_seen || null,
              unread_count: participation.unread_count
            })) || []
          }
        };
      });

      // Extract and map conversations
      const conversations = conversationsWithParticipants.map((participation: any) => ({
        id: participation.conversation.id,
        created_at: participation.conversation.created_at,
        updated_at: participation.conversation.updated_at,
        last_message_time: participation.conversation.last_message_time,
        status: participation.conversation.status,
        participants: participation.conversation.participants,
        unread_count: participation.unread_count,
        last_message: participation.conversation.last_message,
        last_read_message_id: participation.last_read_message_id,
        last_message_id: participation.conversation.last_message?.id || null
      })) as Conversation[];

      // Mettre à jour le cache local
      localStorage.setItem(cacheKey, JSON.stringify({
        data: conversations,
        timestamp: now
      }));
      
      set({ isLoading: false, conversations });
      return conversations;
    } catch (error) {
      console.error("Erreur lors du chargement des conversations:", error);
      set({ isLoading: false, error: error instanceof Error ? error.message : 'Failed to fetch conversations' });
      return [];
    }
  };

  const fetchMessagesLegacy = async (conversationId: string, set: any, get: any) => {
    try {
      const { data: messages, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:sender_id (
            id,
            username,
            full_name,
            avatar_url,
            role
          )
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // S'assurer que chaque message a les informations de l'expéditeur
      const messagesWithSenders = messages?.map(message => {
        // Si les informations d'expéditeur sont manquantes, utiliser un objet par défaut
        if (!message.sender) {
          console.warn(`Sender information missing for message: ${message.id}`);
          message.sender = {
            id: message.sender_id,
            username: 'Utilisateur inconnu',
            full_name: 'Utilisateur inconnu',
            avatar_url: null,
            role: 'client' // Utiliser une valeur de rôle valide conforme à la contrainte
          };
        }
        return message;
      }) || [];

      set({ messages: messagesWithSenders as Message[] });

      // NOUVEAU: Mettre à jour les informations des participants de la conversation
      const { activeConversation } = get();
      if (activeConversation && activeConversation.id === conversationId) {
        const participantsToUpdate = new Map();
        
        // Collecter les informations les plus récentes des expéditeurs
        messagesWithSenders.forEach(message => {
          if (message.sender && message.sender.id) {
            const existingInfo = participantsToUpdate.get(message.sender.id);
            
            // N'écraser que si on a de nouvelles informations
            if (!existingInfo || !existingInfo.avatar_url || !existingInfo.full_name) {
              participantsToUpdate.set(message.sender.id, {
                id: message.sender.id,
                username: message.sender.username || existingInfo?.username,
                full_name: message.sender.full_name || existingInfo?.full_name,
                avatar_url: message.sender.avatar_url || existingInfo?.avatar_url
              });
            }
          }
        });
        
        // Mettre à jour chaque participant
        participantsToUpdate.forEach((updatedInfo) => {
          const participant = activeConversation.participants.find((p: { id: string }) => p.id === updatedInfo.id);
          if (participant && (!participant.avatar_url || !participant.full_name)) {
            get().updateConversationParticipant(conversationId, updatedInfo);
          }
        });
      }
      
      return messagesWithSenders as Message[];
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to fetch messages' });
      return [];
    }
  };

  return {
    conversations: [],
    currentConversation: null,
    activeConversation: null,
    messages: [],
    unreadCounts: {},
    onlineUsers: new Set(),
    isTyping: {},
    loading: false,
    isLoading: false,
    error: null,
    totalConversations: 0,

    fetchConversations: async (userId: string, options = { page: 1, pageSize: 20, status: 'all' }) => {
      if (!userId) {
        console.error("ID utilisateur manquant pour fetchConversations");
        return [];
      }

      // Créer une clé de cache unique basée sur les paramètres de la requête
      const cacheKey = `${userId}_${options.page}_${options.pageSize}_${options.status}`;
      
      // Vérifier si une requête est déjà en cours pour éviter les doublons
      if (CONVERSATION_CACHE.pendingRequests.has(cacheKey)) {
        console.log("Requête déjà en cours pour", cacheKey);
        return get().conversations;
      }
      
      // Vérifier si des données en cache sont disponibles et valides
      const cachedData = CONVERSATION_CACHE.byUserId[cacheKey];
      const now = Date.now();
      
      if (cachedData && (now - cachedData.timestamp < CACHE_DURATION.conversations)) {
        console.log("Utilisation du cache pour les conversations de", userId);
        
        // Mise à jour du store avec les données en cache
        if (get().conversations.length !== cachedData.data.length) {
          set({ 
            conversations: cachedData.data, 
            totalConversations: cachedData.totalCount,
            loading: false,
            isLoading: false
          });
        }
        
        return cachedData.data;
      }
      
      // Aucune donnée en cache valide, procéder à la requête
      set({ loading: true, isLoading: true, error: null });
      CONVERSATION_CACHE.pendingRequests.add(cacheKey);
      
      try {
        // Calculer les indices de pagination
        const { page, pageSize, status } = options;
        
        // Utiliser une fonction RPC pour récupérer toutes les données en une seule requête
        const { data: rpcData, error: rpcError } = await supabase.rpc('get_user_conversations', { 
          p_user_id: userId,
          p_page: page,
          p_page_size: pageSize,
          p_status: status === 'all' ? null : status
        });
        
        // Supprimer cette requête de la liste des requêtes en cours
        CONVERSATION_CACHE.pendingRequests.delete(cacheKey);
        
        if (rpcError) {
          // Vérifier si c'est une erreur 404 (fonction RPC non trouvée)
          if (rpcError.code === "404" || rpcError.message?.includes("function") || rpcError.message?.includes("not found")) {
            console.warn("[fetchConversations] Fonction RPC 'get_user_conversations' non disponible, utilisation de la méthode traditionnelle");
          } else {
            console.error("Erreur RPC:", rpcError);
          }
          // Si la RPC échoue, recourir à l'ancienne méthode avec des requêtes distinctes
          return await fetchConversationsLegacy(userId, options);
        }
        
        if (!rpcData || !Array.isArray(rpcData.conversations)) {
          console.error("Format de données RPC inattendu:", rpcData);
          return await fetchConversationsLegacy(userId, options);
        }
        
        // Formater les conversations retournées par la RPC
        const formattedConversations: Conversation[] = rpcData.conversations.map((conv: any) => ({
          id: conv.id,
          created_at: conv.created_at,
          updated_at: conv.updated_at,
          status: conv.status,
          last_message_id: conv.last_message?.id || null,
          last_message_time: conv.last_message_time,
          participants: conv.participants || [],
          last_message: conv.last_message ? {
            id: conv.last_message.id,
            content: conv.last_message.content,
            created_at: conv.last_message.created_at,
            sender_id: conv.last_message.sender_id
          } : undefined
        }));

        // Mettre à jour le cache
        CONVERSATION_CACHE.byUserId[cacheKey] = {
          data: formattedConversations,
          totalCount: rpcData.total_count || 0,
          timestamp: now
        };

        // Mettre à jour le store avec les conversations paginées et le compte total
        set({ 
          conversations: formattedConversations, 
          loading: false, 
          isLoading: false,
          totalConversations: rpcData.total_count || 0
        });
        
        return formattedConversations;
      } catch (error) {
        // Supprimer cette requête de la liste des requêtes en cours
        CONVERSATION_CACHE.pendingRequests.delete(cacheKey);
        
        console.error("Erreur lors de la récupération des conversations:", error);
        set({ error: error instanceof Error ? error.message : 'Failed to fetch conversations', loading: false, isLoading: false });
        return [];
      }
    },

    fetchMessages: async (conversationId: string) => {
      if (!conversationId) {
        console.error("ID de conversation manquant pour fetchMessages");
        return [];
      }
      
      // Vérifier si une requête est déjà en cours pour éviter les doublons
      if (MESSAGE_CACHE.pendingRequests.has(conversationId)) {
        console.log("Requête de messages déjà en cours pour", conversationId);
        return get().messages;
      }
      
      // Vérifier si des données en cache sont disponibles et valides
      const cachedData = MESSAGE_CACHE.byConversationId[conversationId];
      const now = Date.now();
      
      if (cachedData && (now - cachedData.timestamp < CACHE_DURATION.messages)) {
        console.log("Utilisation du cache pour les messages de la conversation", conversationId);
        
        // Mise à jour du store avec les données en cache
        if (get().messages.length !== cachedData.data.length) {
          set({ messages: cachedData.data });
        }
        
        return cachedData.data;
      }
      
      set({ loading: true, error: null });
      MESSAGE_CACHE.pendingRequests.add(conversationId);
      
      try {
        // Tenter d'utiliser la fonction RPC optimisée
        const { data: rpcData, error: rpcError } = await supabase.rpc('get_conversation_messages', {
          p_conversation_id: conversationId
        });
        
        // Supprimer cette requête de la liste des requêtes en cours
        MESSAGE_CACHE.pendingRequests.delete(conversationId);
        
        if (rpcError) {
          // Vérifier si c'est une erreur 404 (fonction RPC non trouvée)
          if (rpcError.code === "404" || rpcError.message?.includes("function") || rpcError.message?.includes("not found")) {
            console.warn("[fetchMessages] Fonction RPC 'get_conversation_messages' non disponible, utilisation de la méthode traditionnelle");
          } else {
            console.error("[fetchMessages] Erreur RPC:", rpcError);
          }
          // Méthode de secours avec la requête traditionnelle
          return await fetchMessagesLegacy(conversationId, set, get);
        }
        
        if (!rpcData || !Array.isArray(rpcData)) {
          console.error("[fetchMessages] Format de données RPC inattendu:", rpcData);
          return await fetchMessagesLegacy(conversationId, set, get);
        }
        
        // Traiter les messages retournés par la RPC
        const formattedMessages = rpcData.map((msg: any) => ({
          ...msg,
          sender: msg.sender || {
            id: msg.sender_id,
            username: 'Utilisateur inconnu',
            full_name: 'Utilisateur inconnu',
            avatar_url: null,
            role: 'client'
          }
        }));
        
        // Mettre à jour le cache
        MESSAGE_CACHE.byConversationId[conversationId] = {
          data: formattedMessages,
          timestamp: now
        };
        
        set({ messages: formattedMessages, loading: false });
        
        // Mettre à jour les informations des participants si nécessaire
        updateParticipantsInfo(conversationId, formattedMessages, get, set);
        
        return formattedMessages;
      } catch (error) {
        // Supprimer cette requête de la liste des requêtes en cours
        MESSAGE_CACHE.pendingRequests.delete(conversationId);
        
        console.error("[fetchMessages] Exception:", error);
        set({ error: error instanceof Error ? error.message : 'Failed to fetch messages', loading: false });
        return [];
      }
    },

    sendMessage: async (conversationId: string, senderId: string, content: string, attachmentUrl?: string, attachmentType?: string, attachmentName?: string) => {
      try {
        // Utiliser la fonction RPC sécurisée
        const { data: messageId, error: sendError } = await supabase
          .rpc('send_secure_message', {
            p_conversation_id: conversationId,
            p_sender_id: senderId,
            p_content: content,
            p_attachment_url: attachmentUrl || null,
            p_attachment_type: attachmentType || null,
            p_attachment_name: attachmentName || null
          });
        
        if (sendError) {
          console.error("Erreur lors de l'envoi du message:", sendError);
          throw sendError;
        }
        
        // Récupérer le message complet pour l'ajouter à l'état
        const { data: message, error: msgError } = await supabase
          .from('messages')
          .select(`
            *,
            sender:sender_id (
              id,
              username,
              full_name,
              avatar_url,
              role
            )
          `)
          .eq('id', messageId)
          .single();
        
        if (msgError) {
          console.error("Erreur lors de la récupération du message:", msgError);
          throw msgError;
        }
        
        get().addMessage(message as Message);
      } catch (error) {
        console.error("Erreur lors de l'envoi du message:", error);
        set({ error: error instanceof Error ? error.message : 'Failed to send message' });
      }
    },

    markMessagesAsRead: async (conversationId: string, userId: string) => {
      try {
        // Appeler la fonction RPC existante sans la modifier
        const { error } = await supabase
          .rpc('mark_messages_as_read', {
            p_conversation_id: conversationId,
            p_user_id: userId
          });
        
        if (error) throw error;
        
        // 1. Mettre à jour les messages dans l'état local
        set(state => ({
          ...state,
          messages: state.messages.map(msg => 
            msg.conversation_id === conversationId && !msg.read && msg.sender_id !== userId
              ? { ...msg, read: true }
              : msg
          )
        }));
        
        // 2. Mettre à jour les compteurs de messages non lus dans l'état des conversations
        set(state => {
          // Mettre à jour les conversations
          return {
            conversations: state.conversations.map(conv => 
              conv.id === conversationId 
                ? { 
                    ...conv, 
                    // Mettre à jour tous les participants pour cet utilisateur
                    participants: conv.participants.map(part => 
                      part.id === userId 
                        ? { ...part, unread_count: 0 }
                        : part
                    )
                  }
                : conv
            )
          };
        });
        
        // 3. Forcer une mise à jour de la conversation pour déclencher le rafraîchissement des VV
        setTimeout(async () => {
          try {
            // Mettre à jour manuellement la date de dernière mise à jour de la conversation
            // Cela va forcer une mise à jour des indicateurs visuels
            await supabase
              .from('conversations')
              .update({ updated_at: new Date().toISOString() })
              .eq('id', conversationId);
            
            // Rafraîchir la liste des conversations (pour s'assurer que les badges sont mis à jour)
            if (userId) {
              get().fetchConversations(userId);
            }
          } catch (refreshError) {
            console.error('Erreur lors du rafraîchissement des conversations:', refreshError);
          }
        }, 500); // Petit délai pour s'assurer que les mises à jour précédentes sont terminées
      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    },

    markSpecificMessagesAsRead: async (conversationId: string, userId: string, messageIds: string[]) => {
      try {
        const { error } = await supabase
          .from('messages')
          .update({ read: true })
          .in('id', messageIds)
        .eq('conversation_id', conversationId)
        .eq('read', false);

        if (error) throw error;

        set((state) => ({
          messages: state.messages.map((msg) => {
            if (messageIds.includes(msg.id)) {
              return { ...msg, read: true };
            }
            return msg;
          })
        }));
      } catch (error) {
        set({ error: error instanceof Error ? error.message : 'Failed to mark specific messages as read' });
      }
    },

    setIsTyping: async (conversationId: string, userId: string, isTyping: boolean) => {
      try {
        // Mise à jour de l'état local immédiatement
        set((state) => ({
          isTyping: { ...state.isTyping, [userId]: isTyping },
        }));
        
        if (isTyping) {
          // D'abord, supprimer tout message "typing" existant pour être sûr
          await supabase
            .from('messages')
            .delete()
            .match({ 
              conversation_id: conversationId, 
              sender_id: userId, 
              is_typing: true 
            });
          
          // Puis insérer un nouveau message "typing"
          const { data, error } = await supabase
            .from('messages')
            .insert({
              conversation_id: conversationId,
              sender_id: userId,
              content: '', // Message vide pour le typing
              is_typing: true,
              created_at: new Date().toISOString()
            });

          if (error) throw error;
        } else {
          // Supprimer le message "en train d'écrire" quand l'utilisateur arrête de taper
          const { error } = await supabase
            .from('messages')
            .delete()
            .match({ 
              conversation_id: conversationId, 
              sender_id: userId, 
              is_typing: true 
            });

          if (error) throw error;
        }
      } catch (error) {
        console.error('Error setting typing status:', error);
        set({ error: error instanceof Error ? error.message : 'Failed to update typing status' });
      }
    },

    setMessages: (messages) => {
      set({ messages });
    },

    setCurrentConversation: (conversation) => {
      set({ currentConversation: conversation });
    },

    setActiveConversation: (conversation) => {
      set({ activeConversation: conversation });
    },

    setConversations: (conversations) => {
      set({ conversations });
    },

    addMessage: (message) => {
      set((state) => ({
        messages: [...state.messages, message as Message],
      }));
    },

    updateMessage: (messageId, updates) => {
      set((state) => ({
        messages: state.messages.map((msg) => {
          if (msg.id === messageId) {
            return { ...msg, ...updates } as Message;
          }
          return msg;
        })
      }));
    },

    deleteMessage: (messageId) => {
      set((state) => ({
        messages: state.messages.filter((msg) => msg.id !== messageId),
      }));
    },

    clearMessages: () => {
      set({ messages: [] });
    },

    setupRealtimeSubscriptions: (userId: string) => {
      if (!userId) {
        console.error("Impossible de configurer les abonnements en temps réel: userId manquant");
        return () => {}; // Fonction de nettoyage vide
      }

      console.log("Configuration des abonnements en temps réel pour l'utilisateur:", userId);
      
      // Nettoyer d'abord les canaux existants pour cet utilisateur
      const userChannelPrefix = `messages-for-user-${userId}`;
      Array.from(channelManager.activeChannels.keys())
        .filter(name => name.startsWith(userChannelPrefix))
        .forEach(name => {
          console.log("Suppression du canal existant:", name);
          channelManager.removeChannel(name);
        });
      
      // Fonction pour gérer les mises à jour de conversation
      const handleConversationUpdate = async (payload: any) => {
        try {
          const { new: participant } = payload;
          if (!participant) {
            console.log("Mise à jour de conversation reçue sans données de participant", payload);
            return;
          }

          console.log("Mise à jour de conversation reçue:", participant);

          // Récupérer les détails de la conversation
          const { data: conversation, error } = await supabase
            .from('conversations')
            .select('*')
            .eq('id', participant.conversation_id)
            .single();

          if (error) {
            console.error("Erreur lors de la récupération de la conversation:", error);
            return;
          }

          if (conversation) {
            console.log("Conversation mise à jour:", conversation);
            
            // Mettre à jour l'état des conversations
            set((state) => {
              const existingConversation = state.conversations.find(c => c.id === conversation.id);
              if (existingConversation) {
                console.log("Mise à jour d'une conversation existante");
                return {
                  conversations: state.conversations.map(c => 
                    c.id === conversation.id ? { ...c, ...conversation } : c
                  )
                };
              } else {
                console.log("Ajout d'une nouvelle conversation");
                // Forcer un rafraîchissement complet plutôt que d'ajouter directement
                // Utiliser un timeout pour éviter les problèmes de fermeture de canal
                setTimeout(() => get().fetchConversations(userId), 100);
                return state;
              }
            });
          }
        } catch (error) {
          console.error("Erreur lors de la mise à jour de la conversation:", error);
        }
      };

      // Fonction pour vérifier et gérer les nouveaux messages
      const checkAndHandleNewMessage = async (message: any, userId: string) => {
        try {
          if (!message || !message.conversation_id) {
            console.log("Message reçu sans conversation_id:", message);
            return;
          }

          console.log("Nouveau message reçu:", message);

          // Vérifier si l'utilisateur est participant à cette conversation
          const { data: participations, error } = await supabase
            .from('conversation_participants')
            .select('conversation_id')
            .eq('participant_id', userId)
            .eq('conversation_id', message.conversation_id)
            .limit(1);

          if (error) {
            console.error("Erreur lors de la vérification des participations:", error);
            return;
          }

          if (participations && participations.length > 0) {
            console.log("L'utilisateur est participant à cette conversation, ajout du message");
            
            // L'utilisateur est participant à cette conversation
            get().addMessage(message as Message);
            
            // Mettre à jour la liste des conversations si nécessaire
            const existingConversation = get().conversations.find(c => c.id === message.conversation_id);
            if (!existingConversation) {
              console.log("La conversation n'existe pas encore dans l'état local, rafraîchissement");
              // Utiliser un timeout pour éviter les problèmes de fermeture de canal
              setTimeout(() => get().fetchConversations(userId), 100);
            }
          } else {
            console.log("L'utilisateur n'est pas participant à cette conversation");
          }
        } catch (error) {
          console.error("Erreur lors de la vérification du nouveau message:", error);
        }
      };

      // Fonction pour gérer les mises à jour de statut des messages
      const handleMessageStatusUpdate = (message: any) => {
        try {
          if (!message) {
            console.log("Mise à jour de statut de message reçue sans données");
            return;
          }
          
          console.log("Mise à jour du statut du message:", message);
          
          // Utiliser un setTimeout pour éviter les problèmes de fermeture de canal
          setTimeout(() => {
            get().updateMessage(message.id, { read: message.read });
          }, 0);
        } catch (error) {
          console.error("Erreur lors de la mise à jour du statut du message:", error);
        }
      };

      try {
        console.log("Création des abonnements aux canaux...");

        // Configurer les canaux avec des traitements d'événements qui ne renvoient pas de promesses
        const conversationsSubscription = supabase
          .channel(`conversation-updates-${userId}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'conversation_participants',
              filter: `participant_id=eq.${userId}`
            },
            (payload) => {
              console.log("Événement de conversation reçu:", payload);
              // Utiliser un setTimeout pour éviter les problèmes de fermeture de canal
              setTimeout(() => handleConversationUpdate(payload), 0);
              return undefined; // Retourner undefined au lieu d'une promesse
            }
          )
          .subscribe((status) => {
            console.log(`Statut de l'abonnement aux conversations: ${status}`);
          });

        // S'abonner aux nouveaux messages
        const messagesSubscription = supabase
          .channel(`message-updates-${userId}`)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'messages'
            },
            (payload) => {
              console.log("Événement de nouveau message reçu:", payload);
              // Utiliser un setTimeout pour éviter les problèmes de fermeture de canal
              setTimeout(() => checkAndHandleNewMessage(payload.new, userId), 0);
              return undefined; // Retourner undefined au lieu d'une promesse
            }
          )
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'messages',
              filter: `read=eq.true`
            },
            (payload) => {
              console.log("Événement de mise à jour de message reçu:", payload);
              // Utiliser un setTimeout pour éviter les problèmes de fermeture de canal
              setTimeout(() => handleMessageStatusUpdate(payload.new), 0);
              return undefined; // Retourner undefined au lieu d'une promesse
            }
          )
          .subscribe((status) => {
            console.log(`Statut de l'abonnement aux messages: ${status}`);
          });

        // Enregistrer les canaux dans le gestionnaire
        channelManager.registerChannel(`conversation-updates-${userId}`, conversationsSubscription);
        channelManager.registerChannel(`message-updates-${userId}`, messagesSubscription);

        console.log("Abonnements configurés avec succès");

        // Fonction de nettoyage
        return () => {
          console.log("Nettoyage des abonnements");
          channelManager.removeChannel(`conversation-updates-${userId}`);
          channelManager.removeChannel(`message-updates-${userId}`);
        };
      } catch (error) {
        console.error("Erreur lors de la configuration des abonnements:", error);
        return () => {}; // Fonction de nettoyage vide en cas d'erreur
      }
    },

    createConversation: async (participantIds: string[]) => {
      try {
        console.log("Création d'une conversation entre:", participantIds);
        
        // Vérifier si tous les participants sont définis et non vides
        if (!participantIds || participantIds.length < 2 || participantIds.some(id => !id)) {
          console.error("IDs des participants invalides:", participantIds);
          throw new Error("Les IDs des participants sont invalides");
        }

        // Récupérer l'ID de l'utilisateur actuel
        const { data } = await supabase.auth.getUser();
        const user = data?.user;
        
        if (!user || !user.id) {
          throw new Error('Utilisateur non authentifié');
        }
        
        // Utiliser la fonction RPC sécurisée
        const { data: conversationId, error } = await supabase
          .rpc('create_secure_conversation', {
            creator_id: user.id,
            participant_ids: participantIds
          });
        
        if (error) {
          console.error("Erreur lors de la création de la conversation:", error);
          throw error;
        }
        
        if (!conversationId) {
          console.error("Échec de la création de la conversation: aucune donnée retournée");
          throw new Error('Échec de la création de la conversation');
        }
        
        console.log("Conversation créée avec succès:", conversationId);
        
        // Rafraîchir les conversations
        setTimeout(() => {
          get().fetchConversations(user.id);
        }, 500);
        
        return conversationId;
      } catch (error) {
        console.error("Erreur lors de la création de la conversation:", error);
        set({ error: error instanceof Error ? error.message : 'Failed to create conversation' });
        return null;
      }
    },

    updateConversationParticipant: (conversationId, updatedParticipant) => {
      set(state => {
        // Mettre à jour les conversations
        const updatedConversations = state.conversations.map(conv => {
          if (conv.id === conversationId) {
            return {
              ...conv,
              participants: conv.participants.map(p => 
                p.id === updatedParticipant.id ? { ...p, ...updatedParticipant } : p
              )
            };
          }
          return conv;
        });
        
        // Mettre à jour la conversation active si c'est la même
        let updatedActiveConversation = state.activeConversation;
        if (state.activeConversation && state.activeConversation.id === conversationId) {
          updatedActiveConversation = {
            ...state.activeConversation,
            participants: state.activeConversation.participants.map(p => 
              p.id === updatedParticipant.id ? { ...p, ...updatedParticipant } : p
            )
          };
        }
        
        return { 
          conversations: updatedConversations,
          activeConversation: updatedActiveConversation
        };
      });
    },

    // Ajouter une méthode pour invalider le cache
    invalidateCache: (type: 'conversations' | 'messages', id: string) => {
      if (type === 'conversations') {
        // Supprimer tous les caches liés à cet utilisateur
        Object.keys(CONVERSATION_CACHE.byUserId)
          .filter(key => key.startsWith(`${id}_`))
          .forEach(key => {
            delete CONVERSATION_CACHE.byUserId[key];
          });
      } else if (type === 'messages') {
        // Supprimer le cache pour cette conversation
        delete MESSAGE_CACHE.byConversationId[id];
      }
    }
  };
}); 