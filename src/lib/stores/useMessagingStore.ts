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
  updateConversationParticipant: (conversationId: string, updatedParticipant: any) => void;
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
      set({ error: error instanceof Error ? error.message : 'Failed to fetch conversations', loading: false, isLoading: false });
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
          const participant = activeConversation.participants.find(p => p.id === updatedInfo.id);
          if (participant && (!participant.avatar_url || !participant.full_name)) {
            get().updateConversationParticipant(conversationId, updatedInfo);
          }
        });
      }
      
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
})); 