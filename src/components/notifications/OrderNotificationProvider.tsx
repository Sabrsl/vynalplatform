"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useToast } from "@/components/ui/use-toast";
import { useUser } from "@/hooks/useUser";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

// Interface pour les données des notifications - adaptée du modèle Order du projet
interface PendingOrderNotification {
  id: string;
  created_at: string;
  service: {
    title: string;
  };
  client: {
    username: string;
    full_name: string | null;
  };
}

// Contexte pour les notifications
type OrderNotificationContextType = {
  unreadCount: number;
  markAllAsRead: () => Promise<void>;
  lastNotifications: PendingOrderNotification[];
};

const OrderNotificationContext = createContext<OrderNotificationContextType>({
  unreadCount: 0,
  markAllAsRead: async () => {},
  lastNotifications: []
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
  
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastNotifications, setLastNotifications] = useState<PendingOrderNotification[]>([]);
  const [notificationsInitialized, setNotificationsInitialized] = useState(false);

  // Fonction pour récupérer les notifications non lues
  const fetchUnreadNotifications = async () => {
    if (!profile?.id) return;
    
    try {
      const supabase = createClientComponentClient();
      
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
          return;
        }
        
        if (!data) {
          setUnreadCount(0);
          setLastNotifications([]);
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
        
        // Mettre à jour le compteur
        setUnreadCount(pendingOrders.length);
        
        // Stocker les dernières notifications
        setLastNotifications(pendingOrders);
        
        // Si c'est la première initialisation et qu'il y a des commandes en attente, on notifie
        if (!notificationsInitialized && pendingOrders.length > 0) {
          const latestOrder = pendingOrders[0];
          const clientName = latestOrder.client.full_name || latestOrder.client.username;
          
          toast({
            title: "Nouvelle commande en attente",
            description: `${clientName} vous a commandé "${latestOrder.service.title}"`,
            action: (
              <Button
                variant="link"
                size="sm"
                onClick={() => router.push(`/dashboard/orders/${latestOrder.id}`)}
                className="p-0 h-auto font-normal"
              >
                Voir
              </Button>
            ),
          });
        }
      }
      
      setNotificationsInitialized(true);
    } catch (err) {
      console.error("Exception lors de la récupération des notifications:", err);
    }
  };
  
  // Fonction pour marquer toutes les notifications comme lues
  const markAllAsRead = async () => {
    if (!profile?.id || !isFreelance) return;
    
    try {
      const supabase = createClientComponentClient();
      
      // Pour les freelances, on met à jour toutes les commandes en attente
      const { error } = await supabase
        .from('orders')
        .update({ status: 'in_progress' })
        .eq('freelance_id', profile.id)
        .eq('status', 'pending');
        
      if (error) {
        console.error("Erreur lors du marquage des notifications:", error);
        return;
      }
      
      // Mettre à jour le compteur
      setUnreadCount(0);
      setLastNotifications([]);
      
      toast({
        title: "Commandes acceptées",
        description: "Toutes les commandes en attente ont été acceptées.",
      });
    } catch (err) {
      console.error("Exception lors du marquage des notifications:", err);
    }
  };
  
  // Initialiser les abonnements aux changements
  useEffect(() => {
    if (!profile?.id) return;
    
    // Charger les notifications initiales
    fetchUnreadNotifications();
    
    // S'abonner aux changements sur la table orders
    const supabase = createClientComponentClient();
    
    const ordersSubscription = supabase
      .channel('order-notifications')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'orders',
        filter: isFreelance 
          ? `freelance_id=eq.${profile.id}` 
          : `client_id=eq.${profile.id}`
      }, (payload) => {
        console.log("[Notifications] Changement détecté dans les commandes", payload);
        fetchUnreadNotifications();
        
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
              if (error || !data) return;
              
              // Transformer les données pour correspondre à notre type PendingOrderNotification
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
              
              const clientName = orderData.client.full_name || orderData.client.username;
              
              toast({
                title: "Nouvelle commande",
                description: `${clientName} vous a commandé "${orderData.service.title}"`,
                action: (
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => router.push(`/dashboard/orders/${orderData.id}`)}
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
    
    // Nettoyer les abonnements
    return () => {
      ordersSubscription.unsubscribe();
    };
  }, [profile?.id, isFreelance, toast, router]);

  return (
    <OrderNotificationContext.Provider
      value={{
        unreadCount,
        markAllAsRead,
        lastNotifications
      }}
    >
      {children}
    </OrderNotificationContext.Provider>
  );
} 