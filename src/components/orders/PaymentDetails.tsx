"use client";

import { Button } from "@/components/ui/button";
import { DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { formatPrice } from "@/lib/utils";
import { AlertCircle, ArrowLeft, FileText, Loader, CheckCircle, XCircle } from "lucide-react";
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
  isTestMode?: boolean;
  testPaymentSuccess?: boolean | null;
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
  onNext,
  isTestMode = false,
  testPaymentSuccess = null
}: PaymentDetailsProps) {
  
  return (
    <>
      <DialogHeader className="bg-gradient-to-b from-vynal-purple-dark to-vynal-purple-darkest p-4 rounded-t-lg border-b border-vynal-purple-secondary/30">
        <DialogTitle className="text-vynal-text-primary">Détails de paiement</DialogTitle>
        <DialogDescription className="text-vynal-text-secondary">
          {isTestMode ? "Simuler un paiement pour test" : "Veuillez entrer vos informations de paiement"}
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
                  {isTestMode ? 'Paiement fictif (TEST)' : (
                    selectedPaymentMethod === 'card' ? 'Carte bancaire' :
                    selectedPaymentMethod === 'paypal' ? 'PayPal' :
                    selectedPaymentMethod === 'orange-money' ? 'Orange Money' :
                    selectedPaymentMethod === 'free-money' ? 'Free Money' :
                    selectedPaymentMethod === 'wave' ? 'Wave' : 
                    'Méthode inconnue'
                  )}
                </span>
              </p>
            </div>
          </div>
        </div>
        
        {/* Message de mode test si activé */}
        {isTestMode && (
          <div className={`p-3 ${testPaymentSuccess === true ? 'bg-green-500/20 border-green-500/40' : testPaymentSuccess === false ? 'bg-red-500/20 border-red-500/40' : 'bg-amber-500/20 border-amber-500/40'} border rounded-lg`}>
            <div className="flex items-start">
              {testPaymentSuccess === true ? (
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
              ) : testPaymentSuccess === false ? (
                <XCircle className="h-5 w-5 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
              ) : (
                <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5 mr-2 flex-shrink-0" />
              )}
              <div>
                <h3 className={`text-sm font-medium ${testPaymentSuccess === true ? 'text-green-500' : testPaymentSuccess === false ? 'text-red-500' : 'text-amber-500'}`}>
                  {testPaymentSuccess === true ? 'Paiement fictif réussi!' : 
                   testPaymentSuccess === false ? 'Échec du paiement fictif' : 
                   'Mode Test activé'}
                </h3>
                <p className={`text-xs ${testPaymentSuccess === true ? 'text-green-400/80' : testPaymentSuccess === false ? 'text-red-400/80' : 'text-amber-400/80'} mt-1`}>
                  {testPaymentSuccess === true ? 'La commande test a été créée avec succès.' : 
                   testPaymentSuccess === false ? 'Une erreur est survenue lors de la création de la commande test.' : 
                   'En mode test, vous pouvez passer une commande fictive sans entrer de vraies informations de paiement.'}
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Affichage des erreurs */}
        {error && !isTestMode && (
          <div className="bg-vynal-status-error/20 p-2 rounded-md flex items-start gap-2 text-vynal-status-error text-xs border border-vynal-status-error/30">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}
        
        {/* Formulaire de paiement - masqué en mode test */}
        {!isTestMode && (
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
        )}
        
        {/* En mode test, on affiche un message explicatif au lieu du formulaire */}
        {isTestMode && (
          <div className="py-4 px-6 bg-vynal-purple-secondary/10 rounded-lg border border-vynal-purple-secondary/30">
            <p className="text-sm text-vynal-text-primary text-center">
              En mode test, le paiement sera simulé sans nécessiter de vraies coordonnées bancaires.
            </p>
          </div>
        )}
        
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
          className={`${isTestMode ? 'bg-amber-500 hover:bg-amber-600' : 'bg-vynal-accent-primary hover:bg-vynal-accent-secondary'} text-vynal-purple-dark`}
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader className="mr-2 h-4 w-4 animate-spin" />
              Traitement...
            </>
          ) : (
            isTestMode ? "Simuler le paiement" : "Finaliser le paiement"
          )}
        </Button>
      </DialogFooter>
    </>
  );
} 