"use client";

import { useMemo, useState, useEffect } from "react";
import ServiceReviews from "@/components/reviews/ServiceReviews";
import { Order } from "@/types/orders";

interface OrderReviewsTabProps {
  order: Order;
}

export default function OrderReviewsTab({ order }: OrderReviewsTabProps) {
  const [reviews, setReviews] = useState<any[]>([]);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const response = await fetch(`/api/services/${order.service.id}/reviews`);
        const data = await response.json();
        setReviews(data);
      } catch (error) {
        console.error('Error fetching reviews:', error);
      }
    };

    fetchReviews();
  }, [order.service.id]);

  return (
    <div className="space-y-6">
      <ServiceReviews 
        serviceId={order.service.id}
        initialReviews={reviews}
      />
    </div>
  );
}