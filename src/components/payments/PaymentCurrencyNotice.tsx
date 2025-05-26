"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Info } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
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

  // Convertir en EUR pour le paiement
  const amountInEuros = convertToEur(normalizedAmount, "XOF", false) as number;

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
      <Alert
        className={cn(
          "mb-4 text-[10px] bg-amber-200 dark:bg-amber-950/20 border-amber-400 dark:border-amber-800/20 backdrop-blur-sm",
          className,
        )}
      >
        <Info className="h-3 w-3 text-amber-700 dark:text-vynal-text-secondary" />
        <AlertTitle className="text-[10px] font-medium text-amber-900 dark:text-vynal-text-primary">
          Paiement en euros
        </AlertTitle>
        <AlertDescription className="text-[10px] text-amber-800 dark:text-vynal-text-secondary">
          Le montant facturé sera de {formattedEuroAmount}.
        </AlertDescription>
      </Alert>
    );
  }

  // Pour les utilisateurs avec une autre devise, montrer l'information de conversion
  return (
    <Alert
      className={cn(
        "mb-4 text-[10px] bg-amber-200 dark:bg-amber-950/20 border-amber-400 dark:border-amber-800/20 backdrop-blur-sm",
        className,
      )}
    >
      <Info className="h-3 w-3 text-amber-700 dark:text-vynal-text-secondary" />
      <AlertTitle className="text-[10px] font-medium text-amber-900 dark:text-vynal-text-primary">
        Information importante
      </AlertTitle>
      <AlertDescription className="text-[10px] text-amber-800 dark:text-vynal-text-secondary">
        Bien que vous voyiez les prix en {formattedUserCurrencyAmount}, le
        paiement sera traité en {formattedEuroAmount} (EUR). Cette conversion
        est nécessaire car nos services de paiement opèrent en euros.
      </AlertDescription>
    </Alert>
  );
}
