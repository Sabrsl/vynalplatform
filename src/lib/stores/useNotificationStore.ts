import { create } from 'zustand';
import { supabase } from '@/lib/supabase/client';
import type { Database } from '@/types/database';
import { StateCreator } from 'zustand';
import { eventEmitter, EVENTS, type NotificationEvent } from '@/lib/utils/events';

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
        console.log("Récupération des notifications pour l'utilisateur:", userId);
        
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
        
        console.log(`${data?.length || 0} notifications récupérées`);
        
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
        console.log("Création d'une nouvelle notification:", notification);
        
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
        
        console.log("Notification créée avec succès:", data);
        
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
    
    markAsRead: async (notificationId: string) => {
      try {
        console.log(`Marquage de la notification ${notificationId} comme lue`);
        
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
        console.log(`Marquage de toutes les notifications de l'utilisateur ${userId} comme lues`);
        
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
      
      // Retourner une fonction de nettoyage pour les abonnements
      return () => {
        supabase.removeChannel(notificationsSubscription);
        supabase.removeChannel(notificationUpdatesSubscription);
      };
    },
    
    clearError: () => {
      set({ error: null });
    }
  })) as StateCreator<NotificationState>
); 