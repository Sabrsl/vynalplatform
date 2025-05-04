"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function OrderIndexPage({ params }: { params: { serviceId: string } }) {
  const router = useRouter();
  const serviceId = params.serviceId;

  useEffect(() => {
    // Rediriger vers la page de paiement unifiée
    router.replace(`/order/${serviceId}/unified-checkout`);
  }, [router, serviceId]);

  return (
    <div className="fixed inset-0 bg-vynal-purple-dark/90 flex items-center justify-center z-50">
      <div className="text-center">
        <div className="h-8 w-8 animate-spin text-vynal-accent-primary mx-auto mb-2 border-4 border-current border-t-transparent rounded-full"></div>
        <p className="text-vynal-text-primary">Redirection en cours...</p>
      </div>
    </div>
  );
} 