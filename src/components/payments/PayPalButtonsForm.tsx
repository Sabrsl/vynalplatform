"use client";

import React, { useRef, useState, useEffect } from 'react';
import { usePayPalButtons, formatPayPalAmount } from "@/lib/paypal/client";
import useCurrency from '@/hooks/useCurrency';
import { convertToEur } from "@/lib/utils/currency-updater";

interface PayPalButtonsFormProps {
  amount: number;
  currency?: string;
  serviceId?: string;
  onSuccess: (data: any) => void;
  onError: (error: any) => void;
  onCancel?: () => void;
  buttonText?: string;
  loading?: boolean;
}

/**
 * Formulaire de boutons PayPal amélioré
 * 
 * Ce composant affiche les boutons PayPal pour le paiement
 */
export function PayPalButtonsForm({
  amount,
  currency = 'EUR',
  serviceId,
  onSuccess,
  onError,
  onCancel,
  buttonText = "Payer avec PayPal",
  loading = true
}: PayPalButtonsFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [paypalLoading, setPaypalLoading] = useState<boolean>(true);
  const paypalContainerRef = useRef<HTMLDivElement>(null);
  const { currency: userCurrency } = useCurrency();

  // Utilisation du hook PayPal
  const { isLoaded, initializePayPalButtons } = usePayPalButtons({
    amount,
    currency,
    onSuccess: (data) => {
      setError(null);
      console.log("PayPal transaction réussie:", data);
      onSuccess({
        ...data,
        provider: 'paypal',
        amount,
      });
    },
    onError: (error) => {
      console.error("Erreur lors du traitement PayPal:", error);
      setError(error.message || "Erreur lors du traitement du paiement");
      onError(error);
    }
  });

  // Gestion des erreurs
  useEffect(() => {
    if (error) {
      try {
        // Ne rien faire ici, l'erreur est déjà configurée
      } catch (err: any) {
        console.error("Erreur lors du traitement de l'erreur PayPal:", err);
      }
    }
  }, [error]);

  // Initialisation des boutons PayPal lorsque le SDK est chargé
  useEffect(() => {
    if (isLoaded && paypalContainerRef.current) {
      setPaypalLoading(false);
      initializePayPalButtons('paypal-button-container');
    }
  }, [isLoaded, initializePayPalButtons]);

  // Calculer le montant en EUR depuis n'importe quelle devise
  const amountInEUR = userCurrency.code !== 'EUR' 
    ? convertToEur(amount, userCurrency.code) as number
    : amount;

  // Format du montant en EUR pour l'affichage
  const formattedEURAmount = new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amountInEUR);

  return (
    <div className="w-full flex flex-col gap-3">
      {/* Info - Note informative sur le paiement */}
      <div className="mb-2 text-xs leading-relaxed text-slate-700">
        Vous serez redirigé vers PayPal pour finaliser votre paiement en toute sécurité.
      </div>
      
      {/* Message de conversion de devise */}
      {userCurrency.code !== 'EUR' && (
        <div className="p-2 bg-blue-50 border border-blue-200 rounded-md text-xs text-blue-700 mb-3">
          <p><strong>Information importante :</strong> Vous voyez le prix en {userCurrency.symbol}{amount.toLocaleString('fr-FR')} ({userCurrency.code}), 
          mais le paiement sera traité en {formattedEURAmount} (EUR).</p>
          <p>Cette conversion est nécessaire car PayPal ne supporte pas directement les paiements en {userCurrency.code}.</p>
        </div>
      )}

      {/* Container pour les boutons PayPal */}
      <div id="paypal-button-container" ref={paypalContainerRef} className="w-full min-h-[100px] flex items-center justify-center">
        {paypalLoading && (
          <div className="flex flex-col items-center justify-center">
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-1"></div>
            <p className="text-[10px] text-slate-500">Chargement PayPal...</p>
          </div>
        )}
      </div>

      {/* PayPal protection info */}
      <div className="mt-1 text-xs text-center text-slate-600 flex items-center justify-center gap-1">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
          <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
        </svg>
        Protection acheteur PayPal incluse
      </div>

      {/* Afficher les erreurs */}
      {error && (
        <div className="mt-2 text-xs text-red-600">
          {error}
        </div>
      )}
    </div>
  );
} 