"use client";

import React, { useRef, useState, useEffect } from "react";
import { usePayPalButtons, formatPayPalAmount } from "@/lib/paypal/client";
import useCurrency from "@/hooks/useCurrency";
import { convertToEur, convertCurrency } from "@/lib/utils/currency-updater";

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
  currency = "XOF", // Par défaut tous les prix de la base sont en XOF
  serviceId,
  onSuccess,
  onError,
  onCancel,
  buttonText = "Payer avec PayPal",
  loading = true,
}: PayPalButtonsFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [paypalLoading, setPaypalLoading] = useState<boolean>(true);
  const paypalContainerRef = useRef<HTMLDivElement>(null);
  const { currency: userCurrency } = useCurrency();

  // Ajouter une fonction de normalisation des montants
  const normalizeAmount = (value: number, currencyCode: string): number => {
    // Valeurs attendues par devise
    const expectedRanges = {
      EUR: { max: 10000 }, // La plupart des services coûtent moins de 10 000 €
      XOF: { max: 6000000 }, // La plupart des services coûtent moins de 6 000 000 FCFA
      USD: { max: 10000 },
      default: { max: 10000 },
    };

    // Obtenir la plage pour cette devise
    const range =
      expectedRanges[currencyCode as keyof typeof expectedRanges] ||
      expectedRanges.default;

    // Si le montant est anormalement élevé pour un service
    if (value > range.max) {
      // Si c'est en FCFA et que le montant est beaucoup trop grand, diviser par 1000
      if (currencyCode === "XOF" && value > 1000000) {
        return value / 1000;
      }
      // Si c'est en EUR et que le montant est beaucoup trop grand, diviser par 1000
      if (currencyCode === "EUR" && value > 10000) {
        return value / 1000;
      }
    }

    return value;
  };

  // Normaliser le montant avant le calcul (toujours partir du XOF)
  const normalizedAmount = normalizeAmount(amount, "XOF");

  // Calculer le montant en EUR depuis XOF (supposant que tous les prix sont stockés en XOF)
  const amountInEUR = convertToEur(normalizedAmount, "XOF", false) as number;

  // Si l'utilisateur voit les prix en XOF, c'est sa devise locale
  // Sinon, on convertit le prix original pour l'affichage dans sa devise
  const amountInUserCurrency =
    userCurrency.code === "XOF"
      ? normalizedAmount
      : userCurrency.code === "EUR"
        ? amountInEUR
        : (convertCurrency(
            normalizedAmount,
            "XOF",
            userCurrency.code,
            false,
          ) as number);

  // Utilisation du hook PayPal avec le montant converti en EUR
  const { isLoaded, initializePayPalButtons } = usePayPalButtons({
    // Important: On transmet le montant déjà converti en EUR à PayPal
    amount: amountInEUR,
    currency: "EUR", // Toujours forcer EUR pour PayPal
    onSuccess: (data) => {
      setError(null);
      onSuccess({
        ...data,
        provider: "paypal",
        amount: amountInEUR, // Montant en EUR
        originalAmount: normalizedAmount, // Montant original normalisé en XOF
        originalCurrency: "XOF", // Devise originale toujours XOF
        userCurrency: userCurrency.code, // Devise affichée à l'utilisateur
        amountInUserCurrency: amountInUserCurrency, // Montant dans la devise de l'utilisateur
        isOriginallyEUR: false, // Jamais original en EUR car toujours en XOF
        wasNormalized: normalizedAmount !== amount, // Indique si une normalisation a été appliquée
      });
    },
    onError: (error) => {
      setError(error.message || "Erreur lors du traitement du paiement");
      onError(error);
    },
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
      initializePayPalButtons("paypal-button-container");
    }
  }, [isLoaded, initializePayPalButtons]);

  // Format du montant en EUR pour l'affichage
  const formattedEURAmount = new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amountInEUR);

  // Format du montant dans la devise de l'utilisateur
  const formattedUserCurrencyAmount = new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: userCurrency.code,
    minimumFractionDigits: userCurrency.code === "XOF" ? 0 : 2,
    maximumFractionDigits: userCurrency.code === "XOF" ? 0 : 2,
  }).format(amountInUserCurrency);

  return (
    <div className="w-full flex flex-col gap-3">
      {/* Info - Note informative sur le paiement */}
      <div className="mb-1 text-[11px] sm:text-xs leading-relaxed text-slate-800 dark:text-vynal-text-primary">
        Vous serez redirigé vers PayPal pour finaliser votre paiement en toute
        sécurité.
      </div>

      {/* Message de conversion de devise */}
      {userCurrency.code !== "EUR" ? (
        <div className="p-2 bg-blue-50 border border-blue-200 rounded-md text-[11px] sm:text-xs text-blue-700 mb-1">
          <p>
            <strong>Information importante :</strong> Vous voyez le prix en{" "}
            {formattedUserCurrencyAmount}, mais le paiement sera traité en{" "}
            {formattedEURAmount} (EUR).
          </p>
          <p>
            Cette conversion est nécessaire car PayPal ne supporte pas
            directement les paiements en {userCurrency.code}.
          </p>
        </div>
      ) : (
        <div className="p-2 bg-blue-50 border border-blue-200 rounded-md text-[11px] sm:text-xs text-blue-700 mb-1">
          <p>
            <strong>Information :</strong> Votre paiement sera traité en euros.
          </p>
          <p>Le montant facturé sera de {formattedEURAmount}.</p>
        </div>
      )}

      {/* Container pour les boutons PayPal */}
      <div
        id="paypal-button-container"
        ref={paypalContainerRef}
        className="w-full min-h-[100px] flex items-center justify-center"
      >
        {paypalLoading && (
          <div className="flex flex-col items-center justify-center">
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-1"></div>
            <p className="text-[10px] text-slate-500">Chargement PayPal...</p>
          </div>
        )}
      </div>

      {/* PayPal protection info */}
      <div className="mt-1 text-xs text-center text-slate-600 flex items-center justify-center gap-1">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="w-3 h-3"
        >
          <path
            fillRule="evenodd"
            d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z"
            clipRule="evenodd"
          />
        </svg>
        Protection acheteur PayPal incluse
      </div>

      {/* Afficher les erreurs */}
      {error && (
        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md text-xs text-red-700">
          <p className="font-medium">Erreur lors du traitement du paiement</p>
          <p>{error}</p>
        </div>
      )}
    </div>
  );
}
