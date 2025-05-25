"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Info } from "lucide-react";
import { validatePaymentCurrency, convertXofToEur, convertToEur, normalizeAmount } from "@/lib/utils/currency-updater";
import useCurrency from "@/hooks/useCurrency";
import { cn } from "@/lib/utils";

interface PaymentCurrencyNoticeProps {
  className?: string;
  compact?: boolean;
  amount?: number; // Montant dans la devise de l'utilisateur
  useFixedAmount?: boolean; // Utiliser un montant fixe pour la démonstration (40 MAD)
  fixedAmount?: number; // Montant fixe à utiliser
}

/**
 * Composant qui affiche une notification sur la devise utilisée pour le paiement
 * Informe l'utilisateur si sa devise préférée diffère de celle utilisée pour le paiement (EUR)
 */
export function PaymentCurrencyNotice({ 
  className, 
  compact = false, 
  amount,
  useFixedAmount = false,
  fixedAmount = 40
}: PaymentCurrencyNoticeProps) {
  const { currency } = useCurrency();
  
  // Déterminer le montant à utiliser (réel ou fixe)
  const displayAmount = useFixedAmount ? fixedAmount : amount;
  
  // Vérifier si la devise est différente de EUR (utilisé pour les paiements)
  const needsCurrencyConversion = currency.code !== 'EUR' && displayAmount !== undefined;
  
  // Logging pour débogage
  console.log(`PaymentCurrencyNotice - Montant reçu: ${amount} ${currency.code}, Montant affiché: ${displayAmount} ${currency.code}`);
  
  // Si un montant est fourni, calculer la conversion
  const amountInEurFormatted = displayAmount && needsCurrencyConversion 
    ? convertToEur(normalizeAmount(displayAmount, currency.code), currency.code, true)
    : null;
    
  // Logging pour débogage
  if (amountInEurFormatted) {
    console.log(`PaymentCurrencyNotice - Conversion: ${displayAmount} ${currency.code} → ${amountInEurFormatted}`);
  }
    
  // Formatage localisé du montant dans la devise d'origine
  const formattedOriginalAmount = displayAmount 
    ? new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: currency.code,
        minimumFractionDigits: currency.code === 'XOF' || currency.code === 'XAF' ? 0 : 2,
        maximumFractionDigits: currency.code === 'XOF' || currency.code === 'XAF' ? 0 : 2
      }).format(normalizeAmount(displayAmount, currency.code))
    : null;

  // Si la devise est différente de EUR, afficher un message spécifique pour PayPal/Stripe
  if (needsCurrencyConversion) {
    // Version compacte pour les composants avec espace limité (dans les formulaires)
    if (compact) {
      return (
        <div className={cn("flex flex-col p-2 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-md", className)}>
          <div className="flex items-center gap-1.5">
            <Info className="h-3 w-3 text-blue-500 flex-shrink-0" />
            <span className="text-blue-700 dark:text-blue-400 font-medium">
              Information importante
            </span>
          </div>
          <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
            Vous voyez le prix en {formattedOriginalAmount}, mais le paiement sera traité en {amountInEurFormatted} (EUR).
          </p>
          <p className="text-[10px] text-blue-600 dark:text-blue-500 mt-0.5">
            Cette conversion est nécessaire car Stripe ne supporte pas directement les paiements en {currency.code}.
          </p>
        </div>
      );
    }

    // Version complète avec explication détaillée
    return (
      <div className={cn(
        "p-3 rounded-lg backdrop-blur-sm transition-all duration-200", 
        "bg-white/30 border border-slate-300 shadow-sm", 
        "dark:bg-slate-900/30 dark:border-slate-700/30",
        className
      )}>
        <div className="flex items-start gap-2">
          <Info className="h-5 w-5 text-vynal-accent-primary flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-slate-800 dark:text-vynal-text-primary">
              Information importante
            </h4>
            <p className="mt-0.5 text-xs text-slate-700 dark:text-vynal-text-secondary">
              Vous voyez le prix en {formattedOriginalAmount}, mais le paiement sera traité en {amountInEurFormatted} (EUR).
            </p>
            <p className="mt-1.5 text-[10px] text-slate-600 dark:text-vynal-text-secondary/80">
              Cette conversion est nécessaire car Stripe ne supporte pas directement les paiements en {currency.code}.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Si aucune condition spéciale, ne rien afficher
  return null;
} 