"use client";

import { useState, useEffect, useRef } from "react";
import { usePayPalButtons } from "@/lib/paypal/client";
import { Button } from "@/components/ui/button";

interface PayPalButtonsFormProps {
  amount: number;
  currency?: string;
  serviceId: string;
  onSuccess: (paymentData: any) => void;
  onError: (error: any) => void;
  loading: boolean;
  buttonText?: string;
}

/**
 * Formulaire de boutons PayPal amélioré
 * 
 * Ce composant affiche les boutons PayPal pour le paiement
 */
export function PayPalButtonsForm({
  amount,
  currency = "EUR",
  serviceId,
  onSuccess,
  onError,
  loading,
  buttonText = "Payer avec PayPal"
}: PayPalButtonsFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [paypalLoading, setPaypalLoading] = useState<boolean>(true);
  const paypalContainerRef = useRef<HTMLDivElement>(null);
  
  // Utilisation du hook PayPal
  const { isLoaded, initializePayPalButtons } = usePayPalButtons({
    amount,
    currency,
    onSuccess: async (data) => {
      setIsProcessing(true);
      try {
        console.log("PayPal transaction réussie:", data);
        // Notification du succès au parent
        onSuccess({
          provider: 'paypal',
          id: data.transactionId,
          transactionId: data.transactionId,
          status: data.status,
          details: data.details
        });
      } catch (error: any) {
        console.error("Erreur lors du traitement PayPal:", error);
        setError(error.message || "Une erreur est survenue lors du traitement du paiement");
        onError(error);
      } finally {
        setIsProcessing(false);
      }
    },
    onError: (err) => {
      setError(err.message || "Erreur lors de l'initialisation de PayPal");
      onError(err);
    }
  });
  
  // Initialisation des boutons PayPal lorsque le SDK est chargé
  useEffect(() => {
    if (isLoaded && paypalContainerRef.current) {
      setPaypalLoading(false);
      initializePayPalButtons('paypal-button-container');
    }
  }, [isLoaded, initializePayPalButtons]);
  
  return (
    <div className="space-y-4">
      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-100 dark:border-blue-800/50 text-xs text-blue-700 dark:text-blue-300 mb-4">
        Vous serez redirigé vers PayPal pour finaliser votre paiement en toute sécurité.
      </div>
      
      {error && (
        <div className="text-red-500 text-sm mt-2 p-2 bg-red-50 dark:bg-red-900/10 rounded-md">
          {error}
        </div>
      )}
      
      {/* Container pour les boutons PayPal */}
      <div id="paypal-button-container" ref={paypalContainerRef} className="w-full min-h-[150px] flex items-center justify-center">
        {paypalLoading && (
          <div className="w-full h-[150px] flex flex-col items-center justify-center space-y-2">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs text-slate-500">Chargement PayPal...</p>
          </div>
        )}
      </div>
      
      {/* PayPal protection info */}
      <div className="mt-2">
        <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          Protection acheteur PayPal incluse
        </p>
      </div>
    </div>
  );
} 