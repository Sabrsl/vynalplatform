"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { formatPrice } from "@/lib/utils";
import { AlertCircle, ArrowLeft, ArrowRight, FileText } from "lucide-react";
import Image from "next/image";
import { PaymentMethodCard } from "./PaymentMethodCard";
import { PAYMENT_METHODS } from "./constants";

interface PaymentMethodSelectionProps {
  service: any;
  requirements: string;
  deliveryDate: string;
  files: FileList | null;
  selectedPaymentMethod: string;
  setSelectedPaymentMethod: (value: string) => void;
  error: string | null;
  onBack: () => void;
  onNext: () => void;
}

export function PaymentMethodSelection({
  service,
  requirements,
  deliveryDate,
  files,
  selectedPaymentMethod,
  setSelectedPaymentMethod,
  error,
  onBack,
  onNext
}: PaymentMethodSelectionProps) {
  
  return (
    <>
      <DialogHeader>
        <DialogTitle>Choisir votre méthode de paiement</DialogTitle>
        <DialogDescription>
          Sélectionnez la méthode de paiement qui vous convient
        </DialogDescription>
      </DialogHeader>
      
      <div className="space-y-4 py-2">
        {/* Résumé de la commande */}
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
          <h3 className="font-medium text-sm mb-2">Résumé de la commande</h3>
          <div className="flex items-start gap-3">
            <div className="relative h-14 w-14 rounded-md overflow-hidden flex-shrink-0 bg-gray-100">
              {service?.images && service.images.length > 0 ? (
                <Image 
                  src={service.images[0]} 
                  alt={service.title}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-200">
                  <FileText className="h-5 w-5 text-gray-400" />
                </div>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-medium line-clamp-1 text-gray-900">
                {service?.title}
              </h4>
              <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">
                Date de livraison souhaitée: {deliveryDate || 'Non spécifiée'}
              </p>
              <div className="mt-1">
                <Badge variant="outline" className="text-xs bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-200">
                  {requirements.split(' ').length} mots d'instructions
                </Badge>
                {files && files.length > 0 && (
                  <Badge variant="outline" className="text-xs bg-green-50 text-green-700 hover:bg-green-100 border-green-200 ml-1">
                    {files.length} fichier{files.length > 1 ? 's' : ''}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 p-2 rounded-md flex items-start gap-2 text-red-700 text-xs mb-3 max-h-20 overflow-y-auto">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}
        
        <div className="space-y-3">
          {PAYMENT_METHODS.map((method) => (
            <PaymentMethodCard
              key={method.id}
              id={method.id}
              name={method.name}
              description={method.description}
              logo={method.logo}
              selected={selectedPaymentMethod === method.id}
              onSelect={setSelectedPaymentMethod}
            />
          ))}
        </div>
        
        <div className="pt-2 mt-2 border-t border-gray-100">
          <div className="flex items-center justify-between w-full">
            <div className="text-sm text-slate-500">
              Prix total (TTC)
            </div>
            <div className="font-medium text-lg">
              {formatPrice(service?.price || 0)}
            </div>
          </div>
        </div>
      </div>
      
      <DialogFooter className="flex justify-between sm:justify-between">
        <Button
          onClick={onBack}
          variant="ghost"
          className="flex items-center"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour
        </Button>
        
        <Button 
          onClick={onNext}
          className="bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800"
          disabled={!selectedPaymentMethod}
        >
          Continuer
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </DialogFooter>
    </>
  );
} 