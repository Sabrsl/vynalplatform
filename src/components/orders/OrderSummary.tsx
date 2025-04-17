"use client";

import { Button } from "@/components/ui/button";
import { DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import { Check, FileText, Home } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

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
  return (
    <>
      <DialogHeader>
        <div className="flex items-center justify-center mb-2">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <Check className="h-8 w-8 text-green-600" />
          </div>
        </div>
        <DialogTitle className="text-center">Commande validée</DialogTitle>
        <DialogDescription className="text-center">
          Votre commande a été validée et enregistrée avec succès
        </DialogDescription>
      </DialogHeader>
      
      <div className="space-y-6 py-4">
        <div className="p-4 bg-green-50 rounded-lg border border-green-100 text-sm text-green-800 flex items-start">
          <div className="space-y-2 w-full">
            <div className="flex items-center justify-between w-full">
              <span className="font-medium">Numéro de commande:</span>
              <span className="font-mono text-xs bg-white px-2 py-1 rounded border border-green-200">
                {orderId}
              </span>
            </div>
            <p className="text-xs text-green-700">
              Un email de confirmation a été envoyé à votre adresse email
            </p>
          </div>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
          <h3 className="text-sm font-medium mb-3">Détails de la commande</h3>
          
          <div className="flex items-start gap-3 mb-4">
            <div className="relative h-14 w-14 rounded overflow-hidden flex-shrink-0 bg-gray-100">
              {service?.images && service.images.length > 0 ? (
                <Image 
                  src={service.images[0]} 
                  alt={service.title}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-200">
                  <FileText className="h-6 w-6 text-gray-400" />
                </div>
              )}
            </div>
            
            <div className="flex-1">
              <h4 className="font-medium text-sm line-clamp-2">
                {service?.title}
              </h4>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="bg-white text-xs">
                  Délai: {service?.delivery_time} jours
                </Badge>
                {service?.rating && (
                  <Badge variant="outline" className="bg-white text-xs">
                    {service.rating} ⭐
                  </Badge>
                )}
              </div>
              <div className="mt-2 text-lg font-semibold text-indigo-700">
                {formatPrice(service?.price || 0)}
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-200 pt-3 mt-3">
            <div className="text-xs text-gray-500 mb-1">Prochaines étapes:</div>
            <ol className="text-sm space-y-2 pl-5 list-decimal">
              <li>Le prestataire va examiner votre commande</li>
              <li>Vous pouvez échanger des messages avec le prestataire</li>
              <li>Le prestataire livrera le travail dans les {service?.delivery_time} jours</li>
              <li>Vous pourrez valider la livraison ou demander des révisions</li>
            </ol>
          </div>
        </div>
      </div>
      
      <DialogFooter className="flex flex-col sm:flex-row gap-3">
        <Button 
          variant="outline" 
          onClick={onClose}
          className="w-full sm:w-auto"
        >
          Fermer
        </Button>
        
        <Button 
          asChild
          className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-indigo-700"
        >
          <Link href="/dashboard/orders">
            <Home className="mr-2 h-4 w-4" />
            Voir mes commandes
          </Link>
        </Button>
      </DialogFooter>
    </>
  );
} 