"use client";

import { Button } from "@/components/ui/button";
import { DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import { Check, FileText, Home } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { DialogContent } from "@/components/ui/dialog";
import { CheckIcon } from "lucide-react";
import { useRouter } from "next/navigation";

interface OrderSummaryProps {
  service: any;
  orderId: string;
  onClose: () => void;
}

export function OrderSummary({
  service,
  orderId,
  onClose
}: OrderSummaryProps) {
  const router = useRouter();
  
  const handleViewOrders = () => {
    router.push('/dashboard/orders');
    onClose();
  };

  return (
    <>
      <div className="space-y-6">
        <div className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-gradient-to-r from-vynal-purple-light to-vynal-purple-mid p-3">
              <CheckIcon className="h-6 w-6 text-white" />
            </div>
          </div>
          <DialogTitle className="text-xl text-vynal-purple-dark">Commande confirmée !</DialogTitle>
          <DialogDescription className="text-vynal-purple-mid/80 mt-1">
            Votre commande a été créée avec succès
          </DialogDescription>
        </div>

        <div className="bg-vynal-purple-light/10 border border-vynal-purple-light/20 rounded-lg p-4 space-y-3">
          <div className="flex justify-between items-center text-sm">
            <span className="text-vynal-purple-mid/80">Commande ID</span>
            <span className="font-medium text-vynal-purple-dark">{orderId}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-vynal-purple-mid/80">Service</span>
            <span className="font-medium text-vynal-purple-dark">{service.title}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-vynal-purple-mid/80">Temps de livraison</span>
            <span className="font-medium text-vynal-purple-dark">{service.delivery_time} jours</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-vynal-purple-mid/80">Prix</span>
            <span className="font-medium text-vynal-purple-dark">{formatPrice(service.price)}</span>
          </div>
        </div>

        <div className="text-center text-sm text-vynal-purple-mid/80 space-y-4 pb-2">
          <p>
            Nous avons envoyé un email de confirmation à votre adresse email.
          </p>
          <p>
            Vous pouvez suivre l'état de votre commande dans votre tableau de bord.
          </p>
        </div>

        <DialogFooter className="flex sm:flex-row gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 sm:flex-initial border-vynal-purple-light/50 text-vynal-purple-mid hover:text-vynal-purple-dark hover:bg-vynal-purple-light/10"
          >
            Fermer
          </Button>
          <Button
            onClick={handleViewOrders}
            className="flex-1 sm:flex-initial bg-gradient-to-r from-vynal-purple-light to-vynal-purple-mid hover:from-vynal-purple-mid hover:to-vynal-purple-dark text-white"
          >
            Voir mes commandes
          </Button>
        </DialogFooter>
      </div>
    </>
  );
} 