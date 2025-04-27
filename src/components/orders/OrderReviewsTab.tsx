"use client";

import ServiceReviews from "@/components/reviews/ServiceReviews";
import { Order } from "@/types/orders";

interface OrderReviewsTabProps {
  order: Order;
}

export function OrderReviewsTab({ order }: OrderReviewsTabProps) {
  // Données mockées pour les avis clients - À remplacer par des données réelles
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

  return (
    <div className="p-3 sm:p-4">
      {order && (
        <ServiceReviews 
          serviceId={order.service.id} 
          initialReviews={MOCK_REVIEWS[order.service.id] || []} 
        />
      )}
    </div>
  );
} 