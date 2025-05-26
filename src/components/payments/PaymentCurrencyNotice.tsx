"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Info } from "lucide-react";
import {
  validatePaymentCurrency,
  convertToEur,
  normalizeAmount,
  convertCurrency as globalConvertCurrency,
} from "@/lib/utils/currency-updater";
import useCurrency from "@/hooks/useCurrency";
import { cn } from "@/lib/utils";

interface PaymentCurrencyNoticeProps {
  amount: number;
  compact?: boolean;
  useFixedAmount?: boolean;
  className?: string;
}

/**
 * Affiche une notification informant l'utilisateur de la devise utilisée pour le paiement
 *
 * @param amount Montant du paiement (toujours en XOF depuis la base de données)
 * @param compact Afficher une version compacte du message
 * @param useFixedAmount Utiliser un montant fixe (true) ou dynamique (false)
 * @param className Classes CSS additionnelles
 */
export function PaymentCurrencyNotice({
  amount,
  compact = false,
  useFixedAmount = true,
  className,
}: PaymentCurrencyNoticeProps) {
  const { currency } = useCurrency();

  // Vérifier et normaliser le montant d'entrée
  const normalizedAmount = normalizeAmount(amount, "XOF");
  console.log(
    `[DEBUG CONVERSION] PaymentCurrencyNotice - Montant original: ${amount} XOF`,
  );
  console.log(
    `[DEBUG CONVERSION] PaymentCurrencyNotice - Montant normalisé: ${normalizedAmount} XOF`,
  );

  // Convertir en EUR pour le paiement
  const amountInEuros = convertToEur(normalizedAmount, "XOF", false) as number;
  console.log(
    `[DEBUG CONVERSION] PaymentCurrencyNotice - Montant en EUR: ${amountInEuros} EUR`,
  );

  // Convertir le montant XOF dans la devise de l'utilisateur pour l'affichage
  const amountInUserCurrency =
    currency.code === "XOF"
      ? normalizedAmount
      : currency.code === "EUR"
        ? amountInEuros
        : (globalConvertCurrency(
            normalizedAmount,
            "XOF",
            currency.code,
            false,
          ) as number);

  // Ajouter des logs pour le débogage
  console.log("[DEBUG CONVERSION] PaymentCurrencyNotice - Conversion:", {
    originalAmount: amount,
    normalizedAmount,
    userCurrency: currency.code,
    amountInUserCurrency,
    amountInEuros,
  });

  // Formater les montants pour l'affichage
  const formattedUserCurrencyAmount = new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: currency.code,
    minimumFractionDigits:
      currency.code === "XOF" || currency.code === "XAF" ? 0 : 2,
    maximumFractionDigits:
      currency.code === "XOF" || currency.code === "XAF" ? 0 : 2,
  }).format(amountInUserCurrency);

  const formattedEuroAmount = new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amountInEuros);

  // Si la devise de l'utilisateur est en EUR, pas besoin d'afficher la conversion
  if (currency.code === "EUR") {
    return (
      <div
        className={cn(
          `text-xs text-blue-700 ${compact ? "p-0 bg-transparent border-0" : "p-2 bg-blue-50 border border-blue-200 rounded-md"}`,
          className,
        )}
      >
        <p className="font-semibold">Paiement en euros</p>
        <p>Le montant facturé sera de {formattedEuroAmount}.</p>
      </div>
    );
  }

  // Pour les utilisateurs avec une autre devise, montrer l'information de conversion
  return (
    <div
      className={cn(
        `text-xs text-blue-700 ${compact ? "p-0 bg-transparent border-0" : "p-2 bg-blue-50 border border-blue-200 rounded-md"}`,
        className,
      )}
    >
      <p className="font-semibold">Information importante</p>
      <p>
        Bien que vous voyiez les prix en {formattedUserCurrencyAmount}, le
        paiement sera traité en {formattedEuroAmount} (EUR).
      </p>
      <p>
        Cette conversion est nécessaire car nos services de paiement opèrent en
        euros.
      </p>
    </div>
  );
}
