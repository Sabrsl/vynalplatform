"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Loader, ArrowLeft } from "lucide-react";
import { OrderDetailContent } from "@/components/orders/OrderDetailContent";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Order, OrderStatus } from "@/types/orders";

export default function OrderDetailPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const orderId = params.id;
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  
  // On force le rôle freelance
  const isFreelance = true;
  
  // Simuler un chargement initial depuis l'API
  useEffect(() => {
    setLoading(true);
    setError(null);
    
    // Fonction pour récupérer les détails de la commande
    const fetchOrderDetails = async () => {
      try {
        const supabase = createClientComponentClient();
        
        const { data, error } = await supabase
          .from('orders')
          .select(`
            *,
            services (*),
            profiles!orders_client_id_fkey (id, username, full_name, avatar_url),
            freelance:profiles!orders_freelance_id_fkey (id, username, full_name, avatar_url)
          `)
          .eq('id', orderId)
          .single();
          
        if (error) {
          console.error("Erreur de récupération de la commande:", error);
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
            id: data.profiles.id,
            username: data.profiles.username,
            full_name: data.profiles.full_name,
            avatar_url: data.profiles.avatar_url
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
            sender_id: msg.sender_id,
            content: msg.content,
            timestamp: msg.created_at,
            is_read: msg.read
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
      } catch (err) {
        console.error("Exception lors de la récupération de la commande:", err);
        setError("Erreur lors du chargement des données");
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrderDetails();
  }, [orderId]);
  
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
  );
} 