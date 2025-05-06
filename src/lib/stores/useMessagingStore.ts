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
  fetchConversations: (userId: string) => Promise<Conversation[]>;
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
}

export const useMessagingStore = create<MessagingState>((set, get) => ({
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

    fetchConversations: async (userId: string) => {
    set({ loading: true, isLoading: true, error: null });
    try {
      const { data: participations, error: partError } = await supabase
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
        .order('conversation(last_message_time)', { ascending: false });

      if (partError) throw partError;
      if (!participations) return [];

      const conversationsWithParticipants = await Promise.all(
        participations.map(async (participation: any) => {
          // Récupérer les participants de la conversation
          const { data: participants, error: partListError } = await supabase
            .from('conversation_participants')
            .select(`
              participant:participant_id (
                id,
                username,
                full_name,
                avatar_url,
                last_seen
              )
            `)
            .eq('conversation_id', participation.conversation.id)
            .neq('participant_id', userId);

          if (partListError) throw partListError;

          // Récupérer le dernier message en triant par date décroissante
          const lastMessage = participation.conversation.messages
            ?.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0] || null;

          return {
            ...participation,
            conversation: {
              ...participation.conversation,
              last_message: lastMessage,
              participants: participants?.map((p: any) => ({
                id: p.participant.id,
                username: p.participant.username || "Utilisateur",
                full_name: p.participant.full_name || "Utilisateur",
                avatar_url: p.participant.avatar_url,
                last_seen: p.participant.last_seen || null,
                unread_count: participation.unread_count
              })) || []
            }
          };
        })
      );

      const formattedConversations: Conversation[] = conversationsWithParticipants.map(participation => ({
        id: participation.conversation.id,
        created_at: participation.conversation.created_at,
        updated_at: participation.conversation.updated_at,
        status: participation.conversation.status,
        last_message_id: participation.conversation.last_message?.id || null,
        last_message_time: participation.conversation.last_message_time,
        participants: participation.conversation.participants,
        last_message: participation.conversation.last_message ? {
          id: participation.conversation.last_message.id,
          content: participation.conversation.last_message.content,
          created_at: participation.conversation.last_message.created_at,
          sender_id: participation.conversation.last_message.sender_id
        } : undefined
      }));

      set({ conversations: formattedConversations, loading: false, isLoading: false });
      return formattedConversations;
    } catch (error) {
      console.error("Erreur lors de la récupération des conversations:", error);
      set({ error: error instanceof Error ? error.message : 'Failed to fetch conversations' });
      return [];
    }
  },

    fetchMessages: async (conversationId: string) => {
    set({ loading: true, error: null });
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
      return messagesWithSenders as Message[];
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to fetch messages' });
      return [];
    } finally {
      set({ loading: false });
    }
  },

  sendMessage: async (conversationId: string, senderId: string, content: string, attachmentUrl?: string, attachmentType?: string, attachmentName?: string) => {
    try {
      const messageData: PartialMessage = {
        content,
        sender_id: senderId,
        conversation_id: conversationId,
        is_typing: false,
        read: false,
        created_at: new Date().toISOString(),
      };

      // Ajouter les pièces jointes si nécessaire
      if (attachmentUrl) {
        messageData.attachment_url = attachmentUrl;
        messageData.attachment_type = attachmentType || null;
        messageData.attachment_name = attachmentName || null;
      }

      const { data, error } = await supabase
        .from('messages')
        .insert([messageData])
        .select()
        .single();

      if (error) {
        console.error("Erreur lors de l'envoi du message:", error);
        throw error;
      }

      get().addMessage(data as Message);
    } catch (error) {
      console.error("Erreur lors de l'envoi du message:", error);
      set({ error: error instanceof Error ? error.message : 'Failed to send message' });
    }
  },

  markMessagesAsRead: async (conversationId: string, userId: string) => {
    try {
      const { error } = await supabase.rpc('mark_messages_as_read', {
        p_conversation_id: conversationId,
        p_user_id: userId
      });

      if (error) throw error;

      set(state => ({
        ...state,
        messages: state.messages.map(msg => 
          msg.conversation_id === conversationId && !msg.read
            ? { ...msg, read: true }
            : msg
        )
      }));
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
    // Nettoyer d'abord les canaux existants pour cet utilisateur
    const userChannelPrefix = `messages-for-user-${userId}`;
    Array.from(channelManager.activeChannels.keys())
      .filter(name => name.startsWith(userChannelPrefix))
      .forEach(name => channelManager.removeChannel(name));
    
    // Fonction pour gérer les mises à jour de conversation
    const handleConversationUpdate = async (payload: any) => {
      try {
        const { new: participant } = payload;
        if (!participant) return;

        // Récupérer les détails de la conversation
        const { data: conversation } = await supabase
          .from('conversations')
          .select('*')
          .eq('id', participant.conversation_id)
          .single();

        if (conversation) {
          // Mettre à jour l'état des conversations
          set((state) => {
            const existingConversation = state.conversations.find(c => c.id === conversation.id);
            if (existingConversation) {
              return {
                conversations: state.conversations.map(c => 
                  c.id === conversation.id ? { ...c, ...conversation } : c
                )
              };
            } else {
              return {
                conversations: [...state.conversations, conversation]
              };
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
        if (!message || message.sender_id === userId) return;

        // Vérifier si l'utilisateur est participant à cette conversation
        if (message.conversation_id) {
          const { data: participations } = await supabase
            .from('conversation_participants')
            .select('conversation_id')
            .eq('participant_id', userId)
            .eq('conversation_id', message.conversation_id)
            .limit(1);

          if (participations && participations.length > 0) {
            // L'utilisateur est participant à cette conversation
            get().addMessage(message as Message);
          }
        }
      } catch (error) {
        console.error("Erreur lors de la vérification du nouveau message:", error);
      }
    };

    // Fonction pour gérer les mises à jour de statut des messages
    const handleMessageStatusUpdate = (message: any) => {
      try {
        if (!message) return;
        get().updateMessage(message.id, { read: message.read });
      } catch (error) {
        console.error("Erreur lors de la mise à jour du statut du message:", error);
      }
    };

    // S'abonner aux nouvelles conversations où l'utilisateur est participant
    const conversationsSubscription = supabase
      .channel('conversation-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversation_participants',
          filter: `participant_id=eq.${userId}`
        },
        (payload) => handleConversationUpdate(payload)
      )
      .subscribe();

    // S'abonner aux nouveaux messages dans toutes les conversations de l'utilisateur
    const messagesSubscription = supabase
      .channel('message-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        (payload) => {
          // Vérifier si le message appartient à une conversation de l'utilisateur
          checkAndHandleNewMessage(payload.new, userId);
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
        (payload) => handleMessageStatusUpdate(payload.new)
      )
      .subscribe();

    // Enregistrer les canaux dans le gestionnaire
    channelManager.registerChannel('conversation-updates', conversationsSubscription);
    channelManager.registerChannel('message-updates', messagesSubscription);

    // Fonction de nettoyage
    return () => {
      channelManager.removeChannel('conversation-updates');
      channelManager.removeChannel('message-updates');
    };
  },

  createConversation: async (participantIds: string[]) => {
    try {
      // Créer une nouvelle conversation
      const { data: conversation, error } = await supabase
        .from('conversations')
        .insert({
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      if (!conversation) throw new Error('Échec de la création de la conversation');

      // Ajouter les participants
      const participants = participantIds.map(id => ({
        conversation_id: conversation.id,
        participant_id: id,
        created_at: new Date().toISOString(),
        unread_count: 0
      }));

      const { error: participantError } = await supabase
        .from('conversation_participants')
        .insert(participants);

      if (participantError) throw participantError;

      // Mettre à jour l'état
      get().fetchConversations(participantIds[0]);
      
      return conversation.id;
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to create conversation' });
      return null;
    }
  },
})); 