"use client";

import { useMemo, useState, useEffect } from "react";
import ServiceReviews from "@/components/reviews/ServiceReviews";
import { Order } from "@/types/orders";

// Données mockées déplacées en dehors du composant
const MOCK_REVIEWS: Record<string, any[]> = {
  "service-1": [
    {
      id: "review-1",
      created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      rating: 5,
      comment: "Excellent travail ! Le logo est exactement ce que je recherchais. Très professionnel et réactif.",
      client_id: "client-2",
      service_id: "service-1",
      freelance_id: "freelance-1",
      order_id: "order-past-1",
      client: {
        username: "sarahb",
        full_name: "Sarah Blanc",
        avatar_url: "/avatars/sarah.jpg"
      }
    },
    {
      id: "review-2",
      created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      rating: 4,
      comment: "Très bon travail. La première proposition n'était pas tout à fait ce que je voulais mais les ajustements ont été parfaits.",
      client_id: "client-3",
      service_id: "service-1",
      freelance_id: "freelance-1",
      order_id: "order-past-2",
      client: {
        username: "thomasv",
        full_name: "Thomas Vidal",
        avatar_url: "/avatars/thomas.jpg"
      }
    }
  ],
  "service-2": [
    {
      id: "review-3",
      created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      rating: 5,
      comment: "Article très bien écrit et optimisé pour le SEO. Je recommande vivement !",
      client_id: "client-4",
      service_id: "service-2",
      freelance_id: "freelance-2",
      order_id: "order-past-3",
      client: {
        username: "carole_m",
        full_name: "Carole Mercier",
        avatar_url: "/avatars/carole.jpg"
      }
    }
  ],
  "service-3": [
    {
      id: "review-4",
      created_at: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
      rating: 3,
      comment: "Le site web fonctionne correctement mais le design pourrait être amélioré. Délai de livraison respecté.",
      client_id: "client-5",
      service_id: "service-3",
      freelance_id: "freelance-3",
      order_id: "order-past-4",
      client: {
        username: "pierre_d",
        full_name: "Pierre Durand",
        avatar_url: "/avatars/pierre.jpg"
      }
    }
  ],
  "service-4": []
};

interface OrderReviewsTabProps {
  order: Order;
}

export function OrderReviewsTab({ order }: OrderReviewsTabProps) {
  // État pour suivre si le composant est monté
  const [isMounted, setIsMounted] = useState(false);
  
  // Effet pour marquer le composant comme monté
  useEffect(() => {
    setIsMounted(true);
    
    // Nettoyage lors du démontage
    return () => {
      setIsMounted(false);
    };
  }, []);
  
  // Utiliser useMemo pour mémoriser les avis
  const serviceReviews = useMemo(() => {
    if (!order?.service?.id) return [];
    return MOCK_REVIEWS[order.service.id] || [];
  }, [order?.service?.id]);
  
  // Éviter le rendu tant que le composant n'est pas monté
  // Cela évite les flashs lors de la navigation
  if (!isMounted) {
    return (
      <div className="p-3 sm:p-4">
        <div className="animate-pulse h-80 bg-vynal-purple-secondary/5 dark:bg-vynal-purple-secondary/10 rounded-lg"></div>
      </div>
    );
  }
  
  // S'il n'y a pas de commande ou de service, afficher un message
  if (!order?.service) {
    return (
      <div className="p-3 sm:p-4">
        <div className="text-center py-8 text-vynal-purple-secondary dark:text-vynal-text-secondary">
          Aucune commande disponible
        </div>
      </div>
    );
  }

  // Rendu normal lorsque tout est prêt
  return (
    <div className="p-3 sm:p-4">
      <ServiceReviews 
        serviceId={order.service.id} 
        initialReviews={serviceReviews} 
      />
    </div>
  );
}