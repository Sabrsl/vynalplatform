"use client";

import { Button } from "@/components/ui/button";
import { DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { formatPrice } from "@/lib/utils";
import { AlertCircle, ArrowLeft, FileText, Loader } from "lucide-react";
import Image from "next/image";
import { PaymentForm } from "./PaymentForm";

interface PaymentDetailsProps {
  service: any;
  selectedPaymentMethod: string;
  cardNumber: string;
  setCardNumber: (value: string) => void;
  cardHolder: string;
  setCardHolder: (value: string) => void;
  expiryDate: string;
  setExpiryDate: (value: string) => void;
  cvv: string;
  setCvv: (value: string) => void;
  paypalEmail: string;
  setPaypalEmail: (value: string) => void;
  phoneNumber: string;
  setPhoneNumber: (value: string) => void;
  mobileOperator: "orange-money" | "free-money" | "wave";
  setMobileOperator: (value: "orange-money" | "free-money" | "wave") => void;
  loading: boolean;
  error: string | null;
  onBack: () => void;
  onNext: () => void;
}

export function PaymentDetails({
  service,
  selectedPaymentMethod,
  cardNumber,
  setCardNumber,
  cardHolder,
  setCardHolder,
  expiryDate,
  setExpiryDate,
  cvv,
  setCvv,
  paypalEmail,
  setPaypalEmail,
  phoneNumber,
  setPhoneNumber,
  mobileOperator,
  setMobileOperator,
  loading,
  error,
  onBack,
  onNext
}: PaymentDetailsProps) {
  
  return (
    <>
      <DialogHeader>
        <DialogTitle>Détails de paiement</DialogTitle>
        <DialogDescription>
          Veuillez entrer vos informations de paiement
        </DialogDescription>
      </DialogHeader>
      
      <div className="space-y-4 py-2">
        {/* Résumé du service commandé */}
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
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
              <h3 className="text-sm font-medium line-clamp-1">{service?.title}</h3>
              <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                Vous payez avec : <span className="font-medium">
                  {selectedPaymentMethod === 'card' ? 'Carte bancaire' :
                   selectedPaymentMethod === 'paypal' ? 'PayPal' :
                   selectedPaymentMethod === 'orange-money' ? 'Orange Money' :
                   selectedPaymentMethod === 'free-money' ? 'Free Money' :
                   selectedPaymentMethod === 'wave' ? 'Wave' : 
                   'Méthode inconnue'}
                </span>
              </p>
            </div>
          </div>
        </div>
        
        {/* Affichage des erreurs */}
        {error && (
          <div className="bg-red-50 p-2 rounded-md flex items-start gap-2 text-red-700 text-xs">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}
        
        {/* Formulaire de paiement */}
        <PaymentForm
          method={selectedPaymentMethod}
          cardNumber={cardNumber}
          setCardNumber={setCardNumber}
          cardHolder={cardHolder}
          setCardHolder={setCardHolder}
          expiryDate={expiryDate}
          setExpiryDate={setExpiryDate}
          cvv={cvv}
          setCvv={setCvv}
          paypalEmail={paypalEmail}
          setPaypalEmail={setPaypalEmail}
          phoneNumber={phoneNumber}
          setPhoneNumber={setPhoneNumber}
          mobileOperator={mobileOperator}
          setMobileOperator={setMobileOperator}
        />
        
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
          disabled={loading}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour
        </Button>
        
        <Button 
          onClick={onNext}
          className="bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader className="mr-2 h-4 w-4 animate-spin" />
              Traitement...
            </>
          ) : (
            "Finaliser le paiement"
          )}
        </Button>
      </DialogFooter>
    </>
  );
} 