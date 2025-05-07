"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useToast } from "@/components/ui/use-toast";
import { useUser } from "@/hooks/useUser";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { eventEmitter, EVENTS } from "@/lib/utils/events";
import { FREELANCE_ROUTES, CLIENT_ROUTES } from "@/config/routes";

// Interface pour les données des notifications - adaptée du modèle Order du projet
interface PendingOrderNotification {
  id: string;
  created_at: string;
  service?: {
    title: string;
  };
  client?: {
    username: string;
    full_name: string | null;
  };
}

// Contexte pour les notifications avec typage complet
type OrderNotificationContextType = {
  unreadCount: number;
  markAllAsRead: () => Promise<void>;
  lastNotifications: PendingOrderNotification[];
  isLoading: boolean;
};

const OrderNotificationContext = createContext<OrderNotificationContextType>({
  unreadCount: 0,
  markAllAsRead: async () => {},
  lastNotifications: [],
  isLoading: true
});

export const useOrderNotifications = () => useContext(OrderNotificationContext);

export function OrderNotificationProvider({
  children
}: {
  children: React.ReactNode;
}) {
  const { profile, isFreelance } = useUser();
  const { toast } = useToast();
  const router = useRouter();
  
  // États
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastNotifications, setLastNotifications] = useState<PendingOrderNotification[]>([]);
  const [notificationsInitialized, setNotificationsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Références pour éviter les problèmes de course
  const notificationsRef = useRef<PendingOrderNotification[]>([]);
  const supabaseRef = useRef(createClientComponentClient());
  const mountedRef = useRef(false);
  const lastFetchRef = useRef<number>(0);

  // Fonction optimisée pour récupérer les notifications non lues
  const fetchUnreadNotifications = useCallback(async (silent = false) => {
    if (!profile?.id || !mountedRef.current) return;
    
    // Limiter la fréquence des appels API (pas plus d'une fois toutes les 3 secondes)
    const now = Date.now();
    if (now - lastFetchRef.current < 3000 && notificationsInitialized) return;
    lastFetchRef.current = now;
    
    // Mettre à jour l'état de chargement seulement lors du chargement initial ou si demandé explicitement
    if (!notificationsInitialized || !silent) {
      setIsLoading(true);
    }
    
    try {
      const supabase = supabaseRef.current;
      
      // Pour les freelances, chercher les nouvelles commandes avec status=pending
      if (isFreelance) {
        const { data, error } = await supabase
          .from('orders')
          .select(`
            id, 
            created_at, 
            services!inner (
              title
            ),
            profiles!orders_client_id_fkey (
              username, 
              full_name
            )
          `)
          .eq('freelance_id', profile.id)
          .eq('status', 'pending')
          .order('created_at', { ascending: false });
          
        if (error) {
          console.error("Erreur lors de la récupération des notifications:", error);
          if (mountedRef.current) {
            setIsLoading(false);
          }
          return;
        }
        
        if (!data) {
          if (mountedRef.current) {
            setUnreadCount(0);
            setLastNotifications([]);
            notificationsRef.current = [];
            setIsLoading(false);
          }
          return;
        }
        
        // Transformer les données pour correspondre à notre type PendingOrderNotification
        const pendingOrders = data.map(item => ({
          id: item.id,
          created_at: item.created_at,
          service: {
            title: item.services[0]?.title || 'Service sans titre'
          },
          client: {
            username: item.profiles[0]?.username || 'utilisateur',
            full_name: item.profiles[0]?.full_name
          }
        }));
        
        if (mountedRef.current) {
          // Mettre à jour le compteur
          setUnreadCount(pendingOrders.length);
          
          // Stocker les dernières notifications
          notificationsRef.current = pendingOrders;
          setLastNotifications(pendingOrders);
          
          // Si c'est la première initialisation et qu'il y a des commandes en attente, on notifie
          if (!notificationsInitialized && pendingOrders.length > 0) {
            const latestOrder = pendingOrders[0];
            const clientName = latestOrder.client?.full_name || latestOrder.client?.username;
            
            // Utiliser le système d'événements pour envoyer une notification
            eventEmitter.emit(EVENTS.NOTIFICATION, {
              title: "Nouvelle commande en attente",
              description: `${clientName} vous a commandé "${latestOrder.service?.title}"`,
              variant: "purple",
              priority: "high",
              action: (
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => router.push(`${FREELANCE_ROUTES.ORDERS}/${latestOrder.id}`)}
                  className="p-0 h-auto font-normal"
                >
                  Voir
                </Button>
              )
            });
          }
          
          setNotificationsInitialized(true);
          setIsLoading(false);
        }
      } else {
        // Si l'utilisateur n'est pas freelance, réinitialiser les états
        if (mountedRef.current) {
          setUnreadCount(0);
          setLastNotifications([]);
          notificationsRef.current = [];
          setNotificationsInitialized(true);
          setIsLoading(false);
        }
      }
    } catch (err) {
      console.error("Exception lors de la récupération des notifications:", err);
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [profile?.id, isFreelance, notificationsInitialized, router]);
  
  // Fonction optimisée pour marquer toutes les notifications comme lues
  const markAllAsRead = useCallback(async () => {
    if (!profile?.id || !isFreelance || !mountedRef.current) return;
    
    try {
      const supabase = supabaseRef.current;
      
      // Pour les freelances, on met à jour toutes les commandes en attente
      const { error } = await supabase
        .from('orders')
        .update({ status: 'in_progress' })
        .eq('freelance_id', profile.id)
        .eq('status', 'pending');
        
      if (error) {
        console.error("Erreur lors du marquage des notifications:", error);
        throw error;
      }
      
      // Mettre à jour le compteur immédiatement pour un feedback utilisateur rapide
      if (mountedRef.current) {
        setUnreadCount(0);
        setLastNotifications([]);
        notificationsRef.current = [];
      }
      
      // Utiliser le système d'événements pour envoyer une notification
      eventEmitter.emit(EVENTS.NOTIFICATION, {
        title: "Commandes acceptées",
        description: "Toutes les commandes en attente ont été acceptées.",
        variant: "success",
      });
      
      // Rafraîchir les données pour s'assurer que tout est à jour
      await fetchUnreadNotifications(true);
      
    } catch (err) {
      console.error("Exception lors du marquage des notifications:", err);
      throw err;
    }
  }, [profile?.id, isFreelance, fetchUnreadNotifications]);
  
  // Initialiser le composant
  useEffect(() => {
    mountedRef.current = true;
    
    return () => {
      mountedRef.current = false;
    };
  }, []);
  
  // Initialiser les abonnements aux changements
  useEffect(() => {
    if (!profile?.id) {
      setIsLoading(false);
      return;
    }
    
    // Charger les notifications initiales
    fetchUnreadNotifications();
    
    // S'abonner aux changements sur la table orders
    const supabase = supabaseRef.current;
    
    const ordersSubscription = supabase
      .channel('order-notifications')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'orders',
        filter: isFreelance 
          ? `freelance_id=eq.${profile.id}` 
          : `client_id=eq.${profile.id}`
      }, async (payload) => {
        // Optimisation: vérifier si nous sommes encore montés avant de traiter
        if (!mountedRef.current) return;
        
        console.log("[Notifications] Changement détecté dans les commandes", payload);
        
        // Rafraîchir la liste pour tout changement
        await fetchUnreadNotifications(true);
        
        // Notifier pour les nouvelles commandes (création)
        if (payload.eventType === 'INSERT' && isFreelance && payload.new.status === 'pending') {
          // Récupérer des informations supplémentaires
          supabase
            .from('orders')
            .select(`
              id, 
              created_at,
              services!inner (
                title
              ),
              profiles!orders_client_id_fkey (
                username, 
                full_name
              )
            `)
            .eq('id', payload.new.id)
            .single()
            .then(({ data, error }) => {
              if (error || !data || !mountedRef.current) return;
              
              // Transformer les données
              const orderData: PendingOrderNotification = {
                id: data.id,
                created_at: data.created_at,
                service: {
                  title: data.services[0]?.title || 'Service sans titre'
                },
                client: {
                  username: data.profiles[0]?.username || 'utilisateur',
                  full_name: data.profiles[0]?.full_name
                }
              };
              
              const clientName = orderData.client?.full_name || orderData.client?.username;
              
              // Utiliser le système d'événements pour envoyer une notification
              eventEmitter.emit(EVENTS.NOTIFICATION, {
                title: "Nouvelle commande",
                description: `${clientName} vous a commandé "${orderData.service?.title}"`,
                variant: "purple",
                priority: "high",
                action: (
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => router.push(`${FREELANCE_ROUTES.ORDERS}/${orderData.id}`)}
                    className="p-0 h-auto font-normal"
                  >
                    Voir
                  </Button>
                ),
              });
            });
        }
      })
      .subscribe();
    
    // Mettre en place un intervalle pour actualiser les notifications périodiquement (toutes les 30 secondes)
    const intervalId = setInterval(() => {
      if (mountedRef.current) {
        fetchUnreadNotifications(true);
      }
    }, 30000);
    
    // Nettoyer les abonnements
    return () => {
      ordersSubscription.unsubscribe();
      clearInterval(intervalId);
    };
  }, [profile?.id, isFreelance, router, fetchUnreadNotifications]);

  // Valeur du contexte mémorisée
  const contextValue = useMemo(() => ({
    unreadCount,
    markAllAsRead,
    lastNotifications,
    isLoading
  }), [unreadCount, markAllAsRead, lastNotifications, isLoading]);

  return (
    <OrderNotificationContext.Provider value={contextValue}>
      {children}
    </OrderNotificationContext.Provider>
  );
}