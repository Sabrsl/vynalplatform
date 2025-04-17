import { create } from 'zustand';
import { supabase } from '@/lib/supabase/client';
import type { Database } from '@/types/database';
import { StateCreator } from 'zustand';
import { Profile } from '@/hooks/useUser';

export type Message = Database['public']['Tables']['messages']['Row'] & {
  sender?: Profile;
};

export type ConversationParticipant = Profile & {
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
};

type MessagingState = {
  conversations: Conversation[];
  activeConversation: Conversation | null;
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  isTyping: { [userId: string]: boolean };
  fetchConversations: (userId: string) => Promise<void>;
  fetchMessages: (conversationId: string) => Promise<void>;
  sendMessage: (conversationId: string, senderId: string, content: string, attachmentUrl?: string, attachmentType?: string, attachmentName?: string) => Promise<void>;
  createConversation: (participants: string[], initialMessage?: string) => Promise<string | null>;
  markAsRead: (conversationId: string, userId: string) => Promise<void>;
  setIsTyping: (conversationId: string, userId: string, isTyping: boolean) => Promise<void>;
  setupRealtimeSubscriptions: (userId: string) => () => void;
  clearError: () => void;
  markSpecificMessagesAsRead: (conversationId: string, userId: string, messageIds: string[]) => Promise<void>;
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
      set({ isLoading: true, error: null });
      try {
        console.log("Récupération des conversations pour l'utilisateur:", userId);
        
        // Vérifier que l'ID est valide
        if (!userId) {
          console.error("ID utilisateur non valide");
          throw new Error("ID utilisateur non valide");
        }
        
        // Vérifier que l'utilisateur est bien authentifié
        const { data: userSession } = await supabase.auth.getSession();
        const sessionUserId = userSession?.session?.user?.id;
        
        if (!sessionUserId) {
          console.error("Utilisateur non authentifié");
          throw new Error("Vous devez être connecté pour accéder aux conversations");
        }
        
        // Vérifier que l'ID demandé correspond à l'utilisateur authentifié
        if (userId !== sessionUserId) {
          console.error("Tentative d'accès aux conversations d'un autre utilisateur");
          throw new Error("Vous n'êtes pas autorisé à voir ces conversations");
        }
        
        console.log("Authentification vérifiée, récupération des conversations...");
        
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
          throw new Error(`Erreur de récupération des conversations: ${error.message}`);
        }
        
        if (!data || data.length === 0) {
          console.log("Aucune conversation trouvée pour l'utilisateur");
          set({ conversations: [], isLoading: false });
          return;
        }
        
        console.log(`${data.length} conversations trouvées pour l'utilisateur:`, data);
        
        // Récupérer les IDs de conversations valides
        const validConversations = data.filter(item => item.conversations);
        const conversationIds = validConversations.map(item => item.conversation_id);
        
        if (conversationIds.length === 0) {
          console.log("Aucune conversation valide trouvée");
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
              const profile = Array.isArray(p.profiles) ? p.profiles[0] as Profile : p.profiles as Profile;
              
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
        
        console.log(`${processedConversations.length} conversations traitées avec succès`);
        set({ conversations: processedConversations, isLoading: false });
      } catch (err: any) {
        console.error('Erreur détaillée lors de la récupération des conversations:', err);
        set({ 
          error: `Impossible de récupérer les conversations: ${err.message || 'Erreur inconnue'}`, 
          isLoading: false,
          conversations: []
        });
      }
    },

    fetchMessages: async (conversationId: string) => {
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
        
        console.log("Accès vérifié, récupération des messages...");
        
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
              updated_at
            )
          `)
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: true });

        if (error) {
          console.error("Erreur lors de la récupération des messages:", error);
          throw error;
        }
        
        console.log(`${data?.length || 0} messages récupérés avec succès`);

        const messages = data.map((msg: any) => ({
          ...msg,
          sender: msg.profiles
        }));

        set({ messages, isLoading: false });
        
        // Mettre à jour la conversation active
        const { conversations } = get();
        const activeConversation = conversations.find((c: Conversation) => c.id === conversationId) || null;
        
        if (!activeConversation) {
          console.warn(`Conversation active non trouvée dans les conversations chargées (ID: ${conversationId})`);
        }
        
        set({ activeConversation });
      } catch (err: any) {
        console.error('Erreur détaillée lors de la récupération des messages:', err);
        set({ 
          error: `Impossible de récupérer les messages: ${err.message || 'Erreur inconnue'}`, 
          isLoading: false 
        });
      }
    },

    sendMessage: async (
      conversationId: string, 
      senderId: string, 
      content: string, 
      attachmentUrl?: string, 
      attachmentType?: string, 
      attachmentName?: string
    ) => {
      set({ isLoading: true, error: null });
      try {
        console.log(`Envoi d'un message dans la conversation ${conversationId} par ${senderId}`);
        
        // Créer un nouveau message
        console.log("Insertion du message dans la base de données...");
        const { data, error } = await supabase
          .from('messages')
          .insert({
            conversation_id: conversationId,
            sender_id: senderId,
            content,
            read: false,
            attachment_url: attachmentUrl || null,
            attachment_type: attachmentType || null,
            attachment_name: attachmentName || null,
            is_typing: false
          })
          .select()
          .single();

        if (error) {
          console.error("Erreur lors de l'insertion du message:", error);
          throw error;
        }
        
        console.log("Message inséré avec succès:", data);

        // Mettre à jour le dernier message de la conversation
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

        // Mettre à jour les compteurs de messages non lus pour tous les participants sauf l'expéditeur
        console.log("Mise à jour des compteurs de messages non lus...");
        try {
          await supabase.rpc('increment_unread_count', {
            p_conversation_id: conversationId,
            p_sender_id: senderId
          });
          console.log("Compteurs de messages non lus mis à jour");
        } catch (incrementError) {
          console.error("Erreur lors de la mise à jour des compteurs:", incrementError);
        }

        // Ajouter le message à la liste des messages
        console.log("Récupération des informations de l'expéditeur...");
        const { data: senderData, error: senderError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', senderId)
          .single();
          
        if (senderError) {
          console.error("Erreur lors de la récupération des informations de l'expéditeur:", senderError);
        } else {
          console.log("Informations de l'expéditeur récupérées avec succès");
        }

        const newMessage: Message = {
          ...data,
          sender: senderData || undefined
        };

        set((state: MessagingState) => ({
          messages: [...state.messages, newMessage],
          isLoading: false
        }));
        
        console.log("Message envoyé avec succès");
      } catch (err) {
        console.error('Erreur détaillée lors de l\'envoi du message:', err);
        set({ error: 'Impossible d\'envoyer le message', isLoading: false });
      }
    },

    createConversation: async (participants: string[], initialMessage?: string) => {
      set({ isLoading: true, error: null });
      try {
        console.log("Début de création de conversation entre:", participants);

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

        // Utiliser la fonction RPC pour créer la conversation en une seule transaction
        console.log("Appel de la fonction RPC create_conversation_with_message");
        const { data, error } = await supabase.rpc('create_conversation_with_message', {
          p_participants: participants,
          p_initial_message: initialMessage.trim(),
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
        
        // Mise à jour en base de données
        const { error } = await supabase
          .from('messages')
          .update({ read: true })
          .in('id', messageIds)
          .eq('conversation_id', conversationId)
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
            msg => msg.conversation_id === conversationId && 
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
            event: 'INSERT',
            schema: 'public',
            table: 'messages'
          },
          async (payload: any) => {
            const { new: newMessage } = payload;
            
            // Ignorer les messages de type "is_typing"
            if (newMessage.is_typing) {
              return;
            }
            
            // Skip empty messages
            if (!newMessage.content || newMessage.content.trim() === '') {
              return;
            }
            
            // Récupérer les détails du message
            const { data: messageData } = await supabase
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
                  updated_at
                )
              `)
              .eq('id', newMessage.id)
              .single();
              
            if (!messageData) return;
            
            const { activeConversation, messages } = get();
            
            // Si c'est un message pour la conversation active, l'ajouter
            if (activeConversation?.id === newMessage.conversation_id) {
              // Éviter les doublons
              if (!messages.some((m: Message) => m.id === newMessage.id)) {
                set((state: MessagingState) => ({
                  messages: [...state.messages, { ...messageData, sender: messageData.profiles }]
                }));
                
                // IMPORTANT: Ne pas marquer automatiquement comme lu les nouveaux messages
                // C'est maintenant géré par la détection de visibilité dans le composant ChatWindow
              }
            }
            
            // Mettre à jour la liste des conversations pour refléter le nouveau message
            get().fetchConversations(userId);
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
    }
  })) as StateCreator<MessagingState>
); 