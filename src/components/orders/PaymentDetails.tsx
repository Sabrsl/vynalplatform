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
      <DialogHeader className="bg-gradient-to-b from-vynal-purple-dark to-vynal-purple-darkest p-4 rounded-t-lg border-b border-vynal-purple-secondary/30">
        <DialogTitle className="text-vynal-text-primary">Détails de paiement</DialogTitle>
        <DialogDescription className="text-vynal-text-secondary">
          Veuillez entrer vos informations de paiement
        </DialogDescription>
      </DialogHeader>
      
      <div className="space-y-4 py-2 px-4">
        {/* Résumé du service commandé */}
        <div className="bg-vynal-purple-secondary/10 rounded-lg p-4 border border-vynal-purple-secondary/30">
          <div className="flex items-start gap-3">
            <div className="relative h-14 w-14 rounded-md overflow-hidden flex-shrink-0 bg-vynal-purple-secondary/20">
              {service?.images && service.images.length > 0 ? (
                <Image 
                  src={service.images[0]} 
                  alt={service.title}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-vynal-purple-secondary/30">
                  <FileText className="h-5 w-5 text-vynal-accent-primary" />
                </div>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium line-clamp-1 text-vynal-text-primary">{service?.title}</h3>
              <p className="text-xs text-vynal-text-secondary mt-1 line-clamp-1">
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
          <div className="bg-vynal-status-error/20 p-2 rounded-md flex items-start gap-2 text-vynal-status-error text-xs border border-vynal-status-error/30">
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
        
        <div className="pt-2 mt-2 border-t border-vynal-purple-secondary/30">
          <div className="flex items-center justify-between w-full">
            <div className="text-sm text-vynal-text-secondary">
              Prix total (TTC)
            </div>
            <div className="font-medium text-lg text-vynal-accent-primary">
              {formatPrice(service?.price || 0)}
            </div>
          </div>
        </div>
      </div>
      
      <DialogFooter className="flex justify-between sm:justify-between px-4 py-3 bg-vynal-purple-secondary/10 border-t border-vynal-purple-secondary/30">
        <Button
          onClick={onBack}
          variant="ghost"
          className="text-vynal-text-primary hover:text-vynal-accent-primary hover:bg-vynal-purple-secondary/20"
          disabled={loading}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour
        </Button>
        
        <Button 
          onClick={onNext}
          className="bg-vynal-accent-primary hover:bg-vynal-accent-secondary text-vynal-purple-dark"
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