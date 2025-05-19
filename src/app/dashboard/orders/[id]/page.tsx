"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useUser } from "@/hooks/useUser";
import { Button } from "@/components/ui/button";
import { Loader, ArrowLeft } from "lucide-react";
import { OrderDetailContent } from "@/components/orders/OrderDetailContent";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Order, OrderStatus } from "@/types/orders";
import { FreelanceGuard } from "@/lib/guards/roleGuards";
import { getCachedData, setCachedData, CACHE_EXPIRY } from "@/lib/optimizations/cache";
import { NavigationLoadingState } from "@/app/providers";
import { invalidateFreelanceOrders } from "@/lib/optimizations/freelance-cache";

// Clés de cache pour les détails de commande
const CACHE_KEYS = {
  ORDER_DETAILS: 'freelance_order_details_',
  ORDER_TIMESTAMP: 'freelance_order_timestamp_'
};

export default function OrderDetailPage() {
  const { user } = useAuth();
  const { isFreelance } = useUser();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const orderId = params?.id;
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const isFetchingRef = useRef(false);
  const initialLoadRef = useRef(true);
  
  // Fonction optimisée pour récupérer les détails de la commande avec cache
  const fetchOrderDetails = useCallback(async (forceRefresh = false) => {
    if (!user?.id || !orderId) return;
    
    // Éviter les requêtes multiples ou pendant la navigation
    if (isFetchingRef.current || (NavigationLoadingState.isNavigating && !forceRefresh)) {
      console.log("[OrderDetail] Requête ignorée: déjà en cours ou navigation en cours");
      return;
    }
    
    isFetchingRef.current = true;
    
    // Ne pas modifier l'état loading si c'est le chargement initial ou un rafraîchissement
    if (initialLoadRef.current) {
      initialLoadRef.current = false;
    } else if (!order && !forceRefresh) {
      setLoading(true);
    }
    
    try {
      // Vérifier d'abord le cache si ce n'est pas un forceRefresh
      const cacheKey = `${CACHE_KEYS.ORDER_DETAILS}${user.id}_${orderId}`;
      const timestampKey = `${CACHE_KEYS.ORDER_TIMESTAMP}${user.id}_${orderId}`;
      
      if (!forceRefresh) {
        const cachedOrder = getCachedData<Order>(cacheKey);
        const cachedTimestamp = getCachedData<number>(timestampKey);
        
        if (cachedOrder && cachedTimestamp) {
          // Utiliser les données en cache si elles existent et sont récentes (moins de 2 minutes)
          const isCacheValid = Date.now() - cachedTimestamp < 2 * 60 * 1000;
          
          if (isCacheValid) {
            console.log("[OrderDetail] Utilisation du cache pour les détails de la commande");
            setOrder(cachedOrder);
            setLoading(false);
            setError(null);
            isFetchingRef.current = false;
            return;
          }
        }
      }
      
      const supabase = createClientComponentClient();
      
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          services (*),
          client:profiles!orders_client_id_fkey (id, username, full_name, avatar_url),
          freelance:profiles!orders_freelance_id_fkey (id, username, full_name, avatar_url)
        `)
        .eq('id', orderId)
        .single();
        
      if (error) {
        console.error("[OrderDetail] Erreur de récupération de la commande:", error);
        setError("Erreur lors du chargement des données: " + error.message);
        return;
      }
      
      if (!data) {
        setError("Commande introuvable");
        return;
      }
      
      // Transformer les données
      const orderData: Order = {
        id: data.id,
        created_at: data.created_at,
        updated_at: data.updated_at,
        status: data.status as OrderStatus,
        price: data.price,
        delivery_time: data.delivery_time,
        requirements: data.requirements,
        completed_at: data.completed_at,
        service: {
          id: data.services.id,
          title: data.services.title,
          price: data.services.price,
          delivery_time: data.services.delivery_time,
          description: data.services.description,
          category: data.services.category
        },
        freelance: {
          id: data.freelance.id,
          username: data.freelance.username,
          full_name: data.freelance.full_name,
          avatar_url: data.freelance.avatar_url
        },
        client: {
          id: data.client.id,
          username: data.client.username,
          full_name: data.client.full_name,
          avatar_url: data.client.avatar_url
        }
      };
      
      // Récupérer les messages associés à cette commande
      const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: true });
        
      if (!messagesError && messages) {
        orderData.messages = messages.map(msg => ({
          id: msg.id,
          conversation_id: msg.conversation_id,
          order_id: msg.order_id,
          sender_id: msg.sender_id,
          sender: msg.sender,
          content: msg.content,
          created_at: msg.created_at,
          updated_at: msg.updated_at,
          is_read: msg.is_read,
          read: msg.read,
          is_typing: msg.is_typing
        }));
      }
      
      // Vérifier si la commande a une livraison dans son champ delivery (colonne JSON)
      if (data.delivery) {
        orderData.delivery = {
          message: data.delivery.message || '',
          delivered_at: data.delivery.delivered_at || data.updated_at,
          files: data.delivery.files || []
        };
        
        // Si le champ delivery contient des fichiers, les utiliser comme files de la commande
        if (data.delivery.files && Array.isArray(data.delivery.files)) {
          orderData.files = data.delivery.files.map((file: any) => ({
            id: file.path || file.url || '',
            name: file.name || '',
            size: file.size || 0,
            url: file.url || '',
            uploaded_at: file.uploaded_at || data.updated_at,
            uploader_id: file.uploader_id || data.freelance_id
          }));
        }
      }
      
      setOrder(orderData);
      setError(null);
      
      // Mettre en cache les résultats pour les futures visites
      setCachedData(cacheKey, orderData, {
        expiry: CACHE_EXPIRY.DASHBOARD_DATA
      });
      setCachedData(timestampKey, Date.now(), {
        expiry: CACHE_EXPIRY.DASHBOARD_DATA
      });
      
    } catch (err) {
      console.error("[OrderDetail] Exception lors de la récupération de la commande:", err);
      setError("Erreur lors du chargement des données");
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [orderId, user?.id, order]);
  
  // Écouter les événements d'invalidation du cache
  useEffect(() => {
    if (typeof window === 'undefined' || !user?.id) return;
    
    const handleCacheInvalidation = () => {
      if (user && !NavigationLoadingState.isNavigating) {
        // Recharger les données si le cache est invalidé et qu'on n'est pas en navigation
        fetchOrderDetails(true);
      }
    };
    
    window.addEventListener('vynal:freelance-orders-updated', handleCacheInvalidation);
    window.addEventListener('vynal:freelance-cache-invalidated', handleCacheInvalidation);
    window.addEventListener('vynal:navigation-end', () => {
      // Vérifier si nous devons recharger après la navigation
      if (user && !isFetchingRef.current) {
        fetchOrderDetails(false);
      }
    });
    
    return () => {
      window.removeEventListener('vynal:freelance-orders-updated', handleCacheInvalidation);
      window.removeEventListener('vynal:freelance-cache-invalidated', handleCacheInvalidation);
      window.removeEventListener('vynal:navigation-end', handleCacheInvalidation);
    };
  }, [fetchOrderDetails, user]);
  
  // Effet pour charger les données au montage
  useEffect(() => {
    if (user?.id && !NavigationLoadingState.isNavigating) {
      fetchOrderDetails(false);
    }
  }, [fetchOrderDetails, user?.id]);
  
  // Abonnement aux changements en temps réel
  useEffect(() => {
    if (!user?.id || !orderId) return;
    
    const supabase = createClientComponentClient();
    console.log("[OrderDetail] Configuration de l'abonnement aux changements en temps réel");
    
    const orderSubscription = supabase
      .channel(`order-${orderId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'orders',
        filter: `id=eq.${orderId}`
      }, () => {
        console.log("[OrderDetail] Changement détecté dans la commande, rechargement des données");
        // Invalider le cache
        if (isFreelance && user?.id) {
          invalidateFreelanceOrders(user.id);
        }
        // Forcer un rechargement des données
        fetchOrderDetails(true);
      })
      .subscribe();
    
    return () => {
      console.log("[OrderDetail] Désinscription des changements en temps réel");
      orderSubscription.unsubscribe();
    };
  }, [orderId, user?.id, isFreelance, fetchOrderDetails]);
  
  // Fonction pour rediriger vers la liste des commandes avec le bon onglet
  const navigateToOrdersList = useCallback((status: OrderStatus) => {
    router.push(`/dashboard/orders?tab=${status}`);
  }, [router]);
  
  // Afficher un état de chargement
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader className="h-8 w-8 animate-spin text-vynal-accent-primary" />
      </div>
    );
  }
  
  // Afficher une erreur si nécessaire
  if (error || !order) {
    return (
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">
            {error || "Commande introuvable"}
          </h2>
          <p className="text-vynal-purple-secondary dark:text-vynal-text-secondary mb-6">
            Impossible de charger les détails de la commande.
          </p>
          <Button asChild>
            <Link href="/dashboard/orders">Retour aux commandes</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <FreelanceGuard>
      <div className="w-full h-full overflow-x-hidden overflow-y-auto scrollbar-hide bg-gray-50/50 dark:bg-transparent">
        <div className="p-2 sm:p-4 space-y-4 sm:space-y-6 pb-12 max-w-[1600px] mx-auto">
          <div className="flex flex-col space-y-1 sm:space-y-2">
            <div className="flex items-center">
              <Button variant="ghost" size="sm" asChild className="mr-2 sm:mr-4 text-vynal-purple-secondary hover:bg-vynal-purple-secondary/5 hover:text-vynal-purple-light dark:text-vynal-text-secondary dark:hover:bg-vynal-purple-secondary/10 dark:hover:text-vynal-text-primary">
                <Link href="/dashboard/orders">
                  <ArrowLeft className="h-3.5 w-3.5 mr-1" />
                  <span className="hidden sm:inline text-[10px] sm:text-xs">Retour</span>
                </Link>
              </Button>
              <h1 className="text-sm sm:text-base md:text-lg font-bold text-vynal-purple-light dark:text-vynal-text-primary truncate">
                Détails de la commande
              </h1>
            </div>
          </div>
          
          <OrderDetailContent 
            order={order}
            isFreelance={isFreelance}
            navigateToOrdersList={navigateToOrdersList}
          />
        </div>
      </div>
    </FreelanceGuard>
  );
} 