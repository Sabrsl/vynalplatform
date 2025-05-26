"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Info } from "lucide-react";
import { validatePaymentCurrency, convertToEur, normalizeAmount } from "@/lib/utils/currency-updater";
import useCurrency from "@/hooks/useCurrency";
import { cn } from "@/lib/utils";

// Implémentation locale de convertCurrency si elle n'existe pas dans les imports
const convertCurrency = (
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  normalize: boolean = true
): number | string => {
  // Taux de conversion simplifiés pour les devises courantes (à ajuster selon les besoins réels)
  const rates: Record<string, Record<string, number>> = {
    'XOF': {
      'EUR': 0.00152,
      'USD': 0.00166,
      'GBP': 0.00130,
      'XOF': 1
    },
    'EUR': {
      'XOF': 655.957,
      'USD': 1.09,
      'GBP': 0.86,
      'EUR': 1
    },
    'USD': {
      'XOF': 602.71,
      'EUR': 0.92,
      'GBP': 0.79,
      'USD': 1
    },
    'GBP': {
      'XOF': 769.52,
      'EUR': 1.16,
      'USD': 1.27,
      'GBP': 1
    }
  };

  // Si nous n'avons pas le taux pour cette paire de devises
  if (!rates[fromCurrency] || !rates[fromCurrency][toCurrency]) {
    console.warn(`Taux de conversion non disponible pour ${fromCurrency} vers ${toCurrency}`);
    return amount; // Retourner le montant original
  }

  // Calculer le montant converti
  const convertedAmount = amount * rates[fromCurrency][toCurrency];
  
  // Normaliser le montant si demandé
  if (normalize) {
    // Arrondir à 2 décimales pour EUR/USD/GBP, 0 pour XOF/XAF
    if (toCurrency === 'XOF' || toCurrency === 'XAF') {
      return Math.round(convertedAmount);
    } else {
      return Number(convertedAmount.toFixed(2));
    }
  }
  
  return convertedAmount;
};

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
  className
}: PaymentCurrencyNoticeProps) {
  const { currency } = useCurrency();
  
  // Considérer que le montant est toujours en XOF (devise de la base de données)
  const originalCurrency = 'XOF';
  
  // Convertir en EUR pour le paiement
  const amountInEuros = convertToEur(amount, originalCurrency, false) as number;
  
  // Convertir le montant XOF dans la devise de l'utilisateur pour l'affichage
  const amountInUserCurrency = currency.code === 'XOF'
    ? amount
    : currency.code === 'EUR'
      ? amountInEuros
      : convertCurrency(amount, 'XOF', currency.code, false) as number;
  
  // Formater les montants pour l'affichage
  const formattedUserCurrencyAmount = new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: currency.code,
    minimumFractionDigits: currency.code === 'XOF' || currency.code === 'XAF' ? 0 : 2,
    maximumFractionDigits: currency.code === 'XOF' || currency.code === 'XAF' ? 0 : 2
  }).format(amountInUserCurrency);
  
  const formattedEuroAmount = new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amountInEuros);
  
  // Si la devise de l'utilisateur est en EUR, pas besoin d'afficher la conversion
  if (currency.code === 'EUR') {
    return (
      <div className={cn(`text-xs text-blue-700 ${compact ? 'p-0 bg-transparent border-0' : 'p-2 bg-blue-50 border border-blue-200 rounded-md'}`, className)}>
        <p className="font-semibold">Paiement en euros</p>
        <p>Le montant facturé sera de {formattedEuroAmount}.</p>
      </div>
    );
  }
  
  // Pour les utilisateurs avec une autre devise, montrer l'information de conversion
  return (
    <div className={cn(`text-xs text-blue-700 ${compact ? 'p-0 bg-transparent border-0' : 'p-2 bg-blue-50 border border-blue-200 rounded-md'}`, className)}>
      <p className="font-semibold">Information importante</p>
      <p>Bien que vous voyiez les prix en {formattedUserCurrencyAmount}, le paiement sera traité en {formattedEuroAmount} (EUR).</p>
      <p>Cette conversion est nécessaire car nos services de paiement opèrent en euros.</p>
    </div>
  );
} 