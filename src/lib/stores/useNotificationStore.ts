import { create } from "zustand";
import { supabase } from "@/lib/supabase/client";
import type { Database } from "@/types/database";
import { StateCreator } from "zustand";
// import { eventEmitter, EVENTS, type NotificationEvent } from '@/lib/utils/events'; // Imports inutilisÃ©s: type NotificationEvent
// import { FREELANCE_ROUTES, CLIENT_ROUTES } from "@/config/routes"; // Imports inutilisÃ©s: CLIENT_ROUTES

export type Notification = Database["public"]["Tables"]["notifications"]["Row"];

type NotificationState = {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;

  // Fonctions
  fetchNotifications: (userId: string) => Promise<void>;
  createNotification: (
    notification: Omit<
      Database["public"]["Tables"]["notifications"]["Insert"],
      "id" | "created_at" | "read"
    >,
  ) => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: (userId: string) => Promise<void>;
  setupRealtimeSubscriptions: (userId: string) => () => void;
  clearError: () => void;
  createMessageNotification: (
    userId: string,
    senderId: string,
    conversationId: string,
    content: string,
  ) => Promise<void>;
};

export const useNotificationStore = create<NotificationState>(((set, get) => ({
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

      // VÃ©rifier que l'utilisateur est bien authentifiÃ©
      const { data: userSession } = await supabase.auth.getSession();
      const sessionUserId = userSession?.session?.user?.id;

      if (!sessionUserId) {
        console.error("Utilisateur non authentifiÃ©");
        throw new Error(
          "Vous devez Ãªtre connectÃ© pour accÃ©der aux notifications",
        );
      }

      // VÃ©rifier que l'ID demandÃ© correspond Ã  l'utilisateur authentifiÃ©
      if (userId !== sessionUserId) {
        console.error(
          "Tentative d'accÃ¨s aux notifications d'un autre utilisateur",
        );
        throw new Error(
          "Vous n'Ãªtes pas autorisÃ© Ã  voir ces notifications",
        );
      }

      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error(
          "Erreur lors de la rÃ©cupÃ©ration des notifications:",
          error,
        );
        throw new Error(
          `Erreur de rÃ©cupÃ©ration des notifications: ${error.message}`,
        );
      }

      // Calculer le nombre de notifications non lues
      const unreadCount = data?.filter((notif) => !notif.read).length || 0;

      set({
        notifications: data || [],
        unreadCount,
        isLoading: false,
      });
    } catch (err: any) {
      console.error(
        "Erreur dÃ©taillÃ©e lors de la rÃ©cupÃ©ration des notifications:",
        err,
      );
      set({
        error: `Impossible de rÃ©cupÃ©rer les notifications: ${err.message || "Erreur inconnue"}`,
        isLoading: false,
      });
    }
  },

  createNotification: async (notification) => {
    try {
      const { data, error } = await supabase
        .from("notifications")
        .insert({
          ...notification,
          read: false,
        })
        .select()
        .single();

      if (error) {
        console.error(
          "Erreur lors de la crÃ©ation de la notification:",
          error,
        );
        throw error;
      }

      // Si c'est pour l'utilisateur actuel, mettre Ã  jour le store
      const { data: userSession } = await supabase.auth.getSession();
      const userId = userSession?.session?.user?.id;

      if (userId === notification.user_id) {
        set((state) => ({
          notifications: [data, ...state.notifications],
          unreadCount: state.unreadCount + 1,
        }));
      }

      return data;
    } catch (err) {
      console.error("Erreur lors de la crÃ©ation de la notification:", err);
    }
  },

  // Nouvelle fonction spÃ©cifique pour les notifications de messages pour les freelances
  createMessageNotification: async (
    userId: string,
    senderId: string,
    conversationId: string,
    content: string,
  ) => {
    try {
      // Ne pas crÃ©er de notification si l'expÃ©diteur est le destinataire
      if (userId === senderId) {
        return;
      }

      // RÃ©cupÃ©rer les informations sur l'expÃ©diteur
      const { data: senderData, error: senderError } = await supabase
        .from("profiles")
        .select("username, full_name, role")
        .eq("id", senderId)
        .single();

      if (senderError) {
        console.error(
          "Erreur lors de la rÃ©cupÃ©ration des infos de l'expÃ©diteur:",
          senderError,
        );
        return;
      }

      // DÃ©terminer si le destinataire est un freelance
      const { data: recipientData, error: recipientError } = await supabase
        .from("profiles")
        .select("role, email")
        .eq("id", userId)
        .single();

      if (recipientError) {
        console.error(
          "Erreur lors de la rÃ©cupÃ©ration du rÃ´le du destinataire:",
          recipientError,
        );
        return;
      }

      const isFreelance = recipientData?.role === "freelance";
      const senderName =
        senderData?.full_name || senderData?.username || "Quelqu'un";
      const truncatedContent =
        content.length > 50 ? `${content.substring(0, 47)}...` : content;

      // CrÃ©er une notification pour tous les utilisateurs (freelances et clients)
      const { data: notificationData, error: notifError } = await supabase
        .from("notifications")
        .insert({
          user_id: userId,
          type: "new_message",
          content: `${senderName}: ${truncatedContent}`,
          link: `${FREELANCE_ROUTES.MESSAGES}?conversation=${conversationId}`,
          read: false,
          metadata: JSON.stringify({
            conversation_id: conversationId,
            sender_id: senderId,
            sender_name: senderName,
          }),
        })
        .select()
        .single();

      if (notifError) {
        console.error(
          "Erreur lors de la crÃ©ation de la notification:",
          notifError,
        );
        return;
      }

      // Si c'est pour l'utilisateur actuel, mettre Ã  jour le store
      const { data: userSession } = await supabase.auth.getSession();
      const currentUserId = userSession?.session?.user?.id;

      if (currentUserId === userId) {
        set((state) => ({
          notifications: [notificationData, ...state.notifications],
          unreadCount: state.unreadCount + 1,
        }));
      }

      // DÃ©clencher immÃ©diatement le traitement pour envoyer l'email
      try {
        console.log(
          "Traitement immÃ©diat de la notification pour envoi d'email:",
          notificationData.id,
        );
        await fetch("/api/notifications/process-immediate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            notificationId: notificationData.id,
          }),
        });
      } catch (emailError) {
        console.error(
          "Erreur lors du dÃ©clenchement de l'envoi d'email:",
          emailError,
        );
      }
    } catch (err) {
      console.error(
        "Erreur lors de la crÃ©ation de la notification de message:",
        err,
      );
    }
  },

  markAsRead: async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("id", notificationId);

      if (error) {
        console.error(
          "Erreur lors du marquage de la notification comme lue:",
          error,
        );
        throw error;
      }

      // Mettre Ã  jour l'Ã©tat local
      set((state) => {
        const updatedNotifications = state.notifications.map((notif) =>
          notif.id === notificationId ? { ...notif, read: true } : notif,
        );

        // Recalculer le nombre de notifications non lues
        const unreadCount = updatedNotifications.filter(
          (notif) => !notif.read,
        ).length;

        return {
          notifications: updatedNotifications,
          unreadCount,
        };
      });
    } catch (err) {
      console.error(
        "Erreur lors du marquage de la notification comme lue:",
        err,
      );
    }
  },

  markAllAsRead: async (userId: string) => {
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("user_id", userId)
        .eq("read", false);

      if (error) {
        console.error(
          "Erreur lors du marquage de toutes les notifications comme lues:",
          error,
        );
        throw error;
      }

      // Mettre Ã  jour l'Ã©tat local
      set((state) => ({
        notifications: state.notifications.map((notif) => ({
          ...notif,
          read: true,
        })),
        unreadCount: 0,
      }));
    } catch (err) {
      console.error(
        "Erreur lors du marquage de toutes les notifications comme lues:",
        err,
      );
    }
  },

  setupRealtimeSubscriptions: (userId: string) => {
    // Abonnement aux changements de notifications
    const notificationsSubscription = supabase
      .channel("notifications-channel")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        async (payload: any) => {
          const { new: newNotification } = payload;

          console.log("Nouvelle notification reÃ§ue:", newNotification);

          // Ajouter la notification Ã  l'Ã©tat
          set((state) => ({
            notifications: [newNotification, ...state.notifications],
            unreadCount: state.unreadCount + 1,
          }));

          // Ã‰mettre un Ã©vÃ©nement pour afficher une notification toast
          // Les composants React peuvent s'abonner Ã  cet Ã©vÃ©nement
          eventEmitter.emit(EVENTS.NOTIFICATION, {
            title: newNotification.type,
            description: newNotification.content,
            duration: 5000,
          } as NotificationEvent);
        },
      )
      .subscribe();

    // Abonnement aux changements de statut de lecture des notifications
    const notificationUpdatesSubscription = supabase
      .channel("notification-updates-channel")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload: any) => {
          const { new: updatedNotification } = payload;

          // Mettre Ã  jour la notification dans l'Ã©tat
          set((state) => {
            const updatedNotifications = state.notifications.map((notif) =>
              notif.id === updatedNotification.id ? updatedNotification : notif,
            );

            // Recalculer le nombre de notifications non lues
            const unreadCount = updatedNotifications.filter(
              (notif) => !notif.read,
            ).length;

            return {
              notifications: updatedNotifications,
              unreadCount,
            };
          });
        },
      )
      .subscribe();

    // Abonnement aux nouveaux messages pour crÃ©er des notifications
    const messagesSubscription = supabase
      .channel("messages-for-notifications-channel")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        async (payload: any) => {
          const { new: newMessage } = payload;

          // Ignorer les messages de typing ou vides
          if (newMessage.is_typing || !newMessage.content) {
            return;
          }

          // VÃ©rifier si l'utilisateur est participant Ã  cette conversation
          if (newMessage.conversation_id) {
            // RÃ©cupÃ©rer le rÃ´le de l'utilisateur actuel
            const { data: userRole } = await supabase
              .from("profiles")
              .select("role")
              .eq("id", userId)
              .single();

            // Pour les freelances, crÃ©er des notifications pour tous les messages
            // sauf ceux qu'ils ont envoyÃ©s eux-mÃªmes
            if (
              userRole?.role === "freelance" &&
              newMessage.sender_id !== userId
            ) {
              console.log(
                `[Notification] Nouveau message dans la conversation ${newMessage.conversation_id}`,
              );

              // VÃ©rifier si l'utilisateur est dÃ©jÃ  participant Ã  cette conversation
              const { data: participantCheck } = await supabase
                .from("conversation_participants")
                .select("id")
                .eq("conversation_id", newMessage.conversation_id)
                .eq("participant_id", userId)
                .maybeSingle();

              if (participantCheck) {
                // CrÃ©er une notification pour le freelance
                get().createMessageNotification(
                  userId,
                  newMessage.sender_id,
                  newMessage.conversation_id,
                  newMessage.content,
                );
              } else {
                // Si le freelance n'est pas encore participant Ã  cette conversation
                // mais qu'il devrait recevoir des messages (par exemple, s'il est mentionnÃ©)
                // on peut ajouter une logique spÃ©cifique ici
                console.log(
                  `Le freelance n'est pas encore participant Ã  la conversation ${newMessage.conversation_id}`,
                );

                // VÃ©rifier si ce message concerne le freelance
                // Par exemple, vÃ©rifier si le message mentionne un de ses services
                const { data: servicesData } = await supabase
                  .from("services")
                  .select("id")
                  .eq("freelance_id", userId);

                if (servicesData && servicesData.length > 0) {
                  // Si le message concerne un des services du freelance
                  // ou si c'est une demande initiale, ajouter le freelance Ã  la conversation

                  // Exemple de logique pour dÃ©terminer si le message est pertinent
                  const serviceIds = servicesData.map((s) => s.id);

                  // Si c'est le premier message de la conversation
                  const { data: messageCount } = await supabase
                    .from("messages")
                    .select("count", { count: "exact", head: true })
                    .eq("conversation_id", newMessage.conversation_id);

                  if (messageCount && messageCount[0]?.count === 1) {
                    // C'est le premier message, ajouter le freelance comme participant
                    const { error: insertError } = await supabase
                      .from("conversation_participants")
                      .insert({
                        conversation_id: newMessage.conversation_id,
                        participant_id: userId,
                        unread_count: 1,
                      });

                    if (!insertError) {
                      // CrÃ©er une notification
                      get().createMessageNotification(
                        userId,
                        newMessage.sender_id,
                        newMessage.conversation_id,
                        newMessage.content,
                      );
                    }
                  }
                }
              }
            }
          }
        },
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
  },
})) as StateCreator<NotificationState>);
