"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Info } from "lucide-react";
import { validatePaymentCurrency, convertXofToEur, convertToEur } from "@/lib/utils/currency-updater";
import useCurrency from "@/hooks/useCurrency";
import { cn } from "@/lib/utils";

interface PaymentCurrencyNoticeProps {
  className?: string;
  compact?: boolean;
  amount?: number; // Montant dans la devise de l'utilisateur
}

/**
 * Composant qui affiche une notification sur la devise utilisée pour le paiement
 * Informe l'utilisateur si sa devise préférée diffère de celle utilisée pour le paiement (EUR)
 */
export function PaymentCurrencyNotice({ className, compact = false, amount }: PaymentCurrencyNoticeProps) {
  const { currency, getUserCountry } = useCurrency();
  const [currencyValidation, setCurrencyValidation] = useState<{
    isValid: boolean;
    recommendedCurrency: string;
    message?: string;
  } | null>(null);

  // Vérifier si la devise est différente de EUR (utilisé pour les paiements)
  const needsCurrencyConversion = currency.code !== 'EUR' && amount !== undefined;
  
  // Si un montant est fourni, calculer la conversion
  const amountInEurFormatted = amount && needsCurrencyConversion 
    ? convertToEur(amount, currency.code, true)
    : null;

  useEffect(() => {
    const userCountry = getUserCountry();
    if (userCountry && currency.code) {
      const validation = validatePaymentCurrency(currency.code, userCountry);
      setCurrencyValidation(validation);
    }
  }, [currency.code, getUserCountry]);

  // Si la devise est différente de EUR, afficher un message spécifique pour PayPal/Stripe
  if (needsCurrencyConversion) {
    // Version compacte pour les composants avec espace limité (dans les formulaires)
    if (compact) {
      return (
        <div className={cn("flex items-center gap-1.5 text-xs p-2 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-md", className)}>
          <Info className="h-3 w-3 text-blue-500 flex-shrink-0" />
          <span className="text-blue-700 dark:text-blue-400">
            Paiement traité en euros: {amountInEurFormatted}
          </span>
        </div>
      );
    }

    // Version complète avec explication détaillée
    return (
      <div className={cn("p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-md", className)}>
        <div className="flex items-start gap-2">
          <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300">
              Conversion de devise pour le paiement
            </h4>
            <p className="mt-0.5 text-xs text-blue-700 dark:text-blue-400">
              Vous voyez le prix en {currency.symbol}{amount?.toLocaleString('fr-FR')} ({currency.code}), 
              mais le paiement sera traité en {amountInEurFormatted} (EUR).
            </p>
            <p className="mt-1.5 text-[10px] text-blue-600 dark:text-blue-500">
              Cette conversion est nécessaire car PayPal et Stripe n'acceptent pas directement 
              les paiements en {currency.code}. Le montant sera converti selon le taux de change actuel.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Si la devise n'est pas valide pour le paiement selon le pays, afficher le message d'avertissement standard
  if (currencyValidation && !currencyValidation.isValid) {
    // Version compacte pour les composants avec espace limité
    if (compact) {
      return (
        <div className={cn("flex items-center gap-1.5 text-xs p-1.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-md", className)}>
          <AlertTriangle className="h-3 w-3 text-amber-500 flex-shrink-0" />
          <span className="text-amber-700 dark:text-amber-400">
            Paiement en {currencyValidation.recommendedCurrency}
          </span>
        </div>
      );
    }

    // Version complète avec explication
    return (
      <div className={cn("p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-md", className)}>
        <div className="flex items-start gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-amber-800 dark:text-amber-300">
              Devise de paiement adaptée
            </h4>
            <p className="mt-0.5 text-xs text-amber-700 dark:text-amber-400">
              {currencyValidation.message}
            </p>
            <p className="mt-1.5 text-[10px] text-amber-600 dark:text-amber-500">
              Vous pouvez continuer à visualiser les prix dans votre devise préférée ({currency.code}), 
              mais les transactions financières seront effectuées en {currencyValidation.recommendedCurrency} 
              conformément aux réglementations bancaires locales.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Si aucune condition spéciale, ne rien afficher
  return null;
} 