import { create } from 'zustand';
import { supabase } from '@/lib/supabase/client';
import type { Database } from '@/types/database';
import { StateCreator } from 'zustand';
import { eventEmitter, EVENTS, type NotificationEvent } from '@/lib/utils/events';
import { FREELANCE_ROUTES, CLIENT_ROUTES } from "@/config/routes";

export type Notification = Database['public']['Tables']['notifications']['Row'];

type NotificationState = {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  
  // Fonctions
  fetchNotifications: (userId: string) => Promise<void>;
  createNotification: (notification: Omit<Database['public']['Tables']['notifications']['Insert'], 'id' | 'created_at' | 'read'>) => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: (userId: string) => Promise<void>;
  setupRealtimeSubscriptions: (userId: string) => () => void;
  clearError: () => void;
  createMessageNotification: (userId: string, senderId: string, conversationId: string, content: string) => Promise<void>;
};

export const useNotificationStore = create<NotificationState>(
  ((set, get) => ({
    notifications: [],
    unreadCount: 0,
    isLoading: false,
    error: null,
    
    fetchNotifications: async (userId: string) => {
      set({ isLoading: true, error: null });
      try {
        if (!userId) {
          console.error("ID utilisateur non valide");
          throw new Error("ID utilisateur non valide");
        }
        
        // Vérifier que l'utilisateur est bien authentifié
        const { data: userSession } = await supabase.auth.getSession();
        const sessionUserId = userSession?.session?.user?.id;
        
        if (!sessionUserId) {
          console.error("Utilisateur non authentifié");
          throw new Error("Vous devez être connecté pour accéder aux notifications");
        }
        
        // Vérifier que l'ID demandé correspond à l'utilisateur authentifié
        if (userId !== sessionUserId) {
          console.error("Tentative d'accès aux notifications d'un autre utilisateur");
          throw new Error("Vous n'êtes pas autorisé à voir ces notifications");
        }
        
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });
        
        if (error) {
          console.error("Erreur lors de la récupération des notifications:", error);
          throw new Error(`Erreur de récupération des notifications: ${error.message}`);
        }
        
        // Calculer le nombre de notifications non lues
        const unreadCount = data?.filter(notif => !notif.read).length || 0;
        
        set({ 
          notifications: data || [],
          unreadCount,
          isLoading: false
        });
      } catch (err: any) {
        console.error('Erreur détaillée lors de la récupération des notifications:', err);
        set({ 
          error: `Impossible de récupérer les notifications: ${err.message || 'Erreur inconnue'}`, 
          isLoading: false
        });
      }
    },
    
    createNotification: async (notification) => {
      try {
        const { data, error } = await supabase
          .from('notifications')
          .insert({
            ...notification,
            read: false
          })
          .select()
          .single();
          
        if (error) {
          console.error("Erreur lors de la création de la notification:", error);
          throw error;
        }
        
        // Si c'est pour l'utilisateur actuel, mettre à jour le store
        const { data: userSession } = await supabase.auth.getSession();
        const userId = userSession?.session?.user?.id;
        
        if (userId === notification.user_id) {
          set((state) => ({
            notifications: [data, ...state.notifications],
            unreadCount: state.unreadCount + 1
          }));
        }
        
        return data;
      } catch (err) {
        console.error('Erreur lors de la création de la notification:', err);
      }
    },
    
    // Nouvelle fonction spécifique pour les notifications de messages pour les freelances
    createMessageNotification: async (userId: string, senderId: string, conversationId: string, content: string) => {
      try {
        // Ne pas créer de notification si l'expéditeur est le destinataire
        if (userId === senderId) {
          return;
        }
        
        // Récupérer les informations sur l'expéditeur
        const { data: senderData, error: senderError } = await supabase
          .from('profiles')
          .select('username, full_name, role')
          .eq('id', senderId)
          .single();
          
        if (senderError) {
          console.error("Erreur lors de la récupération des infos de l'expéditeur:", senderError);
          return;
        }
        
        // Déterminer si le destinataire est un freelance
        const { data: recipientData, error: recipientError } = await supabase
          .from('profiles')
          .select('role, email')
          .eq('id', userId)
          .single();
          
        if (recipientError) {
          console.error("Erreur lors de la récupération du rôle du destinataire:", recipientError);
          return;
        }
        
        const isFreelance = recipientData?.role === 'freelance';
        const senderName = senderData?.full_name || senderData?.username || "Quelqu'un";
        const truncatedContent = content.length > 50 ? `${content.substring(0, 47)}...` : content;
        
        // Créer une notification pour tous les utilisateurs (freelances et clients)
        const { data: notificationData, error: notifError } = await supabase
          .from('notifications')
          .insert({
            user_id: userId,
            type: 'new_message',
            content: `${senderName}: ${truncatedContent}`,
            link: `${FREELANCE_ROUTES.MESSAGES}?conversation=${conversationId}`,
            read: false,
            metadata: JSON.stringify({
              conversation_id: conversationId,
              sender_id: senderId,
              sender_name: senderName
            })
          })
          .select()
          .single();
          
        if (notifError) {
          console.error("Erreur lors de la création de la notification:", notifError);
          return;
        }
        
        // Si c'est pour l'utilisateur actuel, mettre à jour le store
        const { data: userSession } = await supabase.auth.getSession();
        const currentUserId = userSession?.session?.user?.id;
        
        if (currentUserId === userId) {
          set((state) => ({
            notifications: [notificationData, ...state.notifications],
            unreadCount: state.unreadCount + 1
          }));
        }
        
        // Déclencher immédiatement le traitement pour envoyer l'email
        try {
          console.log("Traitement immédiat de la notification pour envoi d'email:", notificationData.id);
          await fetch('/api/notifications/process-immediate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              notificationId: notificationData.id
            })
          });
        } catch (emailError) {
          console.error('Erreur lors du déclenchement de l\'envoi d\'email:', emailError);
        }
      } catch (err) {
        console.error('Erreur lors de la création de la notification de message:', err);
      }
    },
    
    markAsRead: async (notificationId: string) => {
      try {
        const { error } = await supabase
          .from('notifications')
          .update({ read: true })
          .eq('id', notificationId);
          
        if (error) {
          console.error("Erreur lors du marquage de la notification comme lue:", error);
          throw error;
        }
        
        // Mettre à jour l'état local
        set((state) => {
          const updatedNotifications = state.notifications.map(notif => 
            notif.id === notificationId ? { ...notif, read: true } : notif
          );
          
          // Recalculer le nombre de notifications non lues
          const unreadCount = updatedNotifications.filter(notif => !notif.read).length;
          
          return { 
            notifications: updatedNotifications,
            unreadCount
          };
        });
      } catch (err) {
        console.error('Erreur lors du marquage de la notification comme lue:', err);
      }
    },
    
    markAllAsRead: async (userId: string) => {
      try {
        const { error } = await supabase
          .from('notifications')
          .update({ read: true })
          .eq('user_id', userId)
          .eq('read', false);
          
        if (error) {
          console.error("Erreur lors du marquage de toutes les notifications comme lues:", error);
          throw error;
        }
        
        // Mettre à jour l'état local
        set((state) => ({
          notifications: state.notifications.map(notif => ({ ...notif, read: true })),
          unreadCount: 0
        }));
      } catch (err) {
        console.error('Erreur lors du marquage de toutes les notifications comme lues:', err);
      }
    },
    
    setupRealtimeSubscriptions: (userId: string) => {
      // Abonnement aux changements de notifications
      const notificationsSubscription = supabase
        .channel('notifications-channel')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${userId}`
          },
          async (payload: any) => {
            const { new: newNotification } = payload;
            
            console.log("Nouvelle notification reçue:", newNotification);
            
            // Ajouter la notification à l'état
            set((state) => ({
              notifications: [newNotification, ...state.notifications],
              unreadCount: state.unreadCount + 1
            }));
            
            // Émettre un événement pour afficher une notification toast
            // Les composants React peuvent s'abonner à cet événement
            eventEmitter.emit(EVENTS.NOTIFICATION, {
              title: newNotification.type,
              description: newNotification.content,
              duration: 5000
            } as NotificationEvent);
          }
        )
        .subscribe();
        
      // Abonnement aux changements de statut de lecture des notifications
      const notificationUpdatesSubscription = supabase
        .channel('notification-updates-channel')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${userId}`
          },
          (payload: any) => {
            const { new: updatedNotification } = payload;
            
            // Mettre à jour la notification dans l'état
            set((state) => {
              const updatedNotifications = state.notifications.map(notif => 
                notif.id === updatedNotification.id ? updatedNotification : notif
              );
              
              // Recalculer le nombre de notifications non lues
              const unreadCount = updatedNotifications.filter(notif => !notif.read).length;
              
              return { 
                notifications: updatedNotifications,
                unreadCount
              };
            });
          }
        )
        .subscribe();
      
      // Abonnement aux nouveaux messages pour créer des notifications
      const messagesSubscription = supabase
        .channel('messages-for-notifications-channel')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages'
          },
          async (payload: any) => {
            const { new: newMessage } = payload;
            
            // Ignorer les messages de typing ou vides
            if (newMessage.is_typing || !newMessage.content) {
              return;
            }
            
            // Vérifier si l'utilisateur est participant à cette conversation
            if (newMessage.conversation_id) {
              // Récupérer le rôle de l'utilisateur actuel
              const { data: userRole } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', userId)
                .single();
                
              // Pour les freelances, créer des notifications pour tous les messages
              // sauf ceux qu'ils ont envoyés eux-mêmes
              if (userRole?.role === 'freelance' && newMessage.sender_id !== userId) {
                console.log(`[Notification] Nouveau message dans la conversation ${newMessage.conversation_id}`);
                
                // Vérifier si l'utilisateur est déjà participant à cette conversation
                const { data: participantCheck } = await supabase
                  .from('conversation_participants')
                  .select('id')
                  .eq('conversation_id', newMessage.conversation_id)
                  .eq('participant_id', userId)
                  .maybeSingle();
                
                if (participantCheck) {
                  // Créer une notification pour le freelance
                  get().createMessageNotification(
                    userId,
                    newMessage.sender_id,
                    newMessage.conversation_id,
                    newMessage.content
                  );
                } else {
                  // Si le freelance n'est pas encore participant à cette conversation
                  // mais qu'il devrait recevoir des messages (par exemple, s'il est mentionné)
                  // on peut ajouter une logique spécifique ici
                  console.log(`Le freelance n'est pas encore participant à la conversation ${newMessage.conversation_id}`);
                  
                  // Vérifier si ce message concerne le freelance
                  // Par exemple, vérifier si le message mentionne un de ses services
                  const { data: servicesData } = await supabase
                    .from('services')
                    .select('id')
                    .eq('freelance_id', userId);
                    
                  if (servicesData && servicesData.length > 0) {
                    // Si le message concerne un des services du freelance
                    // ou si c'est une demande initiale, ajouter le freelance à la conversation
                    
                    // Exemple de logique pour déterminer si le message est pertinent
                    const serviceIds = servicesData.map(s => s.id);
                    
                    // Si c'est le premier message de la conversation
                    const { data: messageCount } = await supabase
                      .from('messages')
                      .select('count', { count: 'exact', head: true })
                      .eq('conversation_id', newMessage.conversation_id);
                      
                    if (messageCount && messageCount[0]?.count === 1) {
                      // C'est le premier message, ajouter le freelance comme participant
                      const { error: insertError } = await supabase
                        .from('conversation_participants')
                        .insert({
                          conversation_id: newMessage.conversation_id,
                          participant_id: userId,
                          unread_count: 1
                        });
                        
                      if (!insertError) {
                        // Créer une notification
                        get().createMessageNotification(
                          userId,
                          newMessage.sender_id,
                          newMessage.conversation_id,
                          newMessage.content
                        );
                      }
                    }
                  }
                }
              }
            }
          }
        )
        .subscribe();
      
      // Retourner une fonction de nettoyage pour les abonnements
      return () => {
        supabase.removeChannel(notificationsSubscription);
        supabase.removeChannel(notificationUpdatesSubscription);
        supabase.removeChannel(messagesSubscription);
      };
    },
    
    clearError: () => {
      set({ error: null });
    }
  })) as StateCreator<NotificationState>
);