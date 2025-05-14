"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Info } from "lucide-react";
import { validatePaymentCurrency } from "@/lib/utils/currency-updater";
import useCurrency from "@/hooks/useCurrency";
import { cn } from "@/lib/utils";

interface PaymentCurrencyNoticeProps {
  className?: string;
  compact?: boolean;
}

/**
 * Composant qui affiche une notification sur la devise utilisée pour le paiement
 * lorsque la devise préférée de l'utilisateur diffère de celle de son pays
 */
export function PaymentCurrencyNotice({ className, compact = false }: PaymentCurrencyNoticeProps) {
  const { currency, getUserCountry } = useCurrency();
  const [currencyValidation, setCurrencyValidation] = useState<{
    isValid: boolean;
    recommendedCurrency: string;
    message?: string;
  } | null>(null);

  useEffect(() => {
    const userCountry = getUserCountry();
    if (userCountry && currency.code) {
      const validation = validatePaymentCurrency(currency.code, userCountry);
      setCurrencyValidation(validation);
    }
  }, [currency.code, getUserCountry]);

  // Si la devise est valide pour le paiement ou aucune information de validation, ne rien afficher
  if (!currencyValidation || currencyValidation.isValid) {
    return null;
  }

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