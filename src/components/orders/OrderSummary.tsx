"use client";

import { Button } from "@/components/ui/button";
import { DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import { Check, FileText, Home, AlertCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { DialogContent } from "@/components/ui/dialog";
import { CheckIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast as hotToast } from "react-hot-toast";

interface OrderSummaryProps {
  service: any;
  orderId: string;
  onClose: () => void;
  isTestMode?: boolean;
}

export function OrderSummary({
  service,
  orderId,
  onClose,
  isTestMode = false
}: OrderSummaryProps) {
  const router = useRouter();
  
  // Effet pour s'assurer que l'ID de commande est valide
  useEffect(() => {
    if (!orderId) {
      console.error("ID de commande manquant dans le résumé de commande");
      hotToast.error("Une erreur est survenue avec votre commande");
      // Fermer automatiquement après 2 secondes si pas d'ID de commande
      const timer = setTimeout(() => {
        onClose();
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [orderId, onClose]);
  
  const handleViewOrders = () => {
    try {
      router.push('/dashboard/orders');
      onClose();
    } catch (error) {
      console.error("Erreur lors de la redirection vers les commandes:", error);
      hotToast.error("Impossible de naviguer vers vos commandes");
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <div className={`rounded-full ${isTestMode ? 'bg-amber-500' : 'bg-gradient-to-r from-vynal-purple-light to-vynal-purple-mid'} p-3`}>
              <CheckIcon className="h-6 w-6 text-white" />
            </div>
          </div>
          <DialogTitle className="text-xl text-vynal-purple-dark">
            {isTestMode ? "Commande test confirmée !" : "Commande confirmée !"}
          </DialogTitle>
          <DialogDescription className="text-vynal-purple-mid/80 mt-1">
            {isTestMode ? "Votre commande test a été créée avec succès" : "Votre commande a été créée avec succès"}
          </DialogDescription>
        </div>

        {isTestMode && (
          <div className="p-3 bg-amber-500/20 border border-amber-500/40 rounded-lg">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5 mr-2 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-medium text-amber-500">Mode Test</h3>
                <p className="text-xs text-amber-400/80 mt-1">
                  Cette commande est une simulation et est marquée comme TEST dans le système.
                  Vous pourrez la voir dans votre tableau de bord, mais aucune transaction réelle n'a été effectuée.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-vynal-purple-light/10 border border-vynal-purple-light/20 rounded-lg p-4 space-y-3">
          <div className="flex justify-between items-center text-sm">
            <span className="text-vynal-purple-mid/80">Commande ID</span>
            <span className="font-medium text-vynal-purple-dark">
              {orderId}
              {isTestMode && (
                <Badge className="ml-2 bg-amber-500 text-[10px] h-4" variant="secondary">TEST</Badge>
              )}
            </span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-vynal-purple-mid/80">Service</span>
            <span className="font-medium text-vynal-purple-dark truncate max-w-[200px]">{service.title}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-vynal-purple-mid/80">Temps de livraison</span>
            <span className="font-medium text-vynal-purple-dark">{service.delivery_time} jours</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-vynal-purple-mid/80">Prix</span>
            <span className="font-medium text-vynal-purple-dark">{formatPrice(service.price)}</span>
          </div>
          {isTestMode && (
            <div className="flex justify-between items-center text-sm">
              <span className="text-vynal-purple-mid/80">Type</span>
              <span className="font-medium text-amber-500">Commande test (fictive)</span>
            </div>
          )}
        </div>

        <div className="text-center text-sm text-vynal-purple-mid/80 space-y-4 pb-2">
          {!isTestMode && (
            <p>
              Nous avons envoyé un email de confirmation à votre adresse email.
            </p>
          )}
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
            className={`flex-1 sm:flex-initial ${isTestMode ? 'bg-amber-500 hover:bg-amber-600' : 'bg-gradient-to-r from-vynal-purple-light to-vynal-purple-mid hover:from-vynal-purple-mid hover:to-vynal-purple-dark'} text-white`}
          >
            Voir mes commandes
          </Button>
        </DialogFooter>
      </div>
    </>
  );
} 