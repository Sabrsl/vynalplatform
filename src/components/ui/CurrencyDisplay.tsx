"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import useCurrency from "@/hooks/useCurrency";
import { LockIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { CURRENCY_CHANGE_EVENT } from "@/lib/utils/currency-updater";

// Cache local pour stocker les montants formatés
// Cela évite de recalculer le même montant plusieurs fois
const formattedAmountsCache = new Map<string, { value: string, timestamp: number }>();

// Durée de validité du cache local (prolongée à 24 heures)
const CACHE_EXPIRY = 24 * 60 * 60 * 1000;

// Référence globale pour suivre les devises utilisées et éviter des rerenders inutiles
let lastCurrencyCode: string | null = null;
let lastUpdateTimestamp = 0;
let lastCacheCleanup = 0;

// Variable globale pour suivre les mises à jour en cours
let currencyDisplayUpdateInProgress = false;

// Exporter le type UseCurrencyResult pour le rendre utilisable par d'autres composants
// Nous ajoutons convertAmount comme alias de convertToLocalCurrency pour la rétrocompatibilité
export interface UseCurrencyResult {
  loading: boolean;
  currency: {
    code: string;
    name: string;
    symbol: string;
    rate_to_xof: number;
    decimals: number;
    rate_fixed?: boolean;
  };
  formatAmount: (amount: number) => string;
  convertToLocalCurrency: (amountInXOF: number) => number;
  convertToXOF: (amountInLocalCurrency: number) => number;
  convertAmount?: (amountInXOF: number) => number; // Alias pour convertToLocalCurrency (pour la rétrocompatibilité)
  getUserCountry: () => string | null;
  updateUserCurrencyPreference: (currencyCode: string) => Promise<void>;
}

interface CurrencyDisplayProps {
  amount: number;
  className?: string;
  showFixedIndicator?: boolean;
  fixedIndicatorClassName?: string;
  displayFullName?: boolean;
}

/**
 * Version optimisée du composant CurrencyDisplay
 * Utilise un système de cache avancé et limite les re-rendus au maximum
 */
export function CurrencyDisplay({ 
  amount, 
  className = "", 
  showFixedIndicator = false,
  fixedIndicatorClassName = "",
  displayFullName = false
}: CurrencyDisplayProps) {
  const { currency, formatAmount, loading } = useCurrency({ disableCache: false });
  
  // Créez un état local pour forcer la mise à jour
  const [forceUpdate, setForceUpdate] = useState(0);
  const [key, setKey] = useState(0);
  const currencyInfoRef = useRef<any>(null);
  const componentRef = useRef<HTMLSpanElement>(null);

  // Utilisez une référence pour stocker l'état de mise à jour
  const updateInProgressRef = useRef(false);
  
  // Stocker le montant formaté dans une référence pour éviter les calculs inutiles
  const formattedValueRef = useRef<string>("");
  
  // Écouter les événements de changement de devise avec protection anti-rebond
  const handleCurrencyChange = useCallback(() => {
    // Éviter les mises à jour multiples rapprochées
    if (updateInProgressRef.current) {
      return;
    }
    
    // Marquer qu'une mise à jour est en cours
    updateInProgressRef.current = true;
    
    // Forcer le re-rendu du composant avec un léger délai pour éviter les mises à jour en cascade
    setTimeout(() => {
      setKey(prev => prev + 1);
      setForceUpdate(prev => prev + 1);
      updateInProgressRef.current = false;
    }, 16); // Utiliser une temporisation plus courte (1 frame à 60fps)
  }, []);
  
  // Setup de l'écouteur d'événements une seule fois
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Écouter l'événement global de changement de devise
    window.addEventListener(CURRENCY_CHANGE_EVENT, handleCurrencyChange);
    
    // Écouter l'événement spécifique pour ce composant
    const element = componentRef.current;
    if (element) {
      element.addEventListener('currency-update', handleCurrencyChange);
    }
    
    return () => {
      window.removeEventListener(CURRENCY_CHANGE_EVENT, handleCurrencyChange);
      if (element) {
        element.removeEventListener('currency-update', handleCurrencyChange);
      }
    };
  }, [handleCurrencyChange]);
  
  // Recalculer le montant formaté chaque fois que nécessaire
  useEffect(() => {
    if (!loading && currency) {
      try {
        formattedValueRef.current = formatAmount(amount);
        currencyInfoRef.current = currency;
      } catch (error) {
        console.error("Erreur de formatage:", error);
      }
    }
  }, [amount, currency, formatAmount, loading, displayFullName, forceUpdate]);
  
  // Afficher un skeleton pendant le chargement
  if (loading) {
    return <Skeleton className={cn("h-4 w-16", className)} />;
  }
  
  // Utiliser la valeur mise en cache si disponible
  const formattedValue = formattedValueRef.current || formatAmount(amount);

  return (
    <span 
      ref={componentRef}
      id={`currency-display-${key}`}
      data-currency-component="true"
      data-price-amount={amount}
      data-force-update={forceUpdate}
      data-currency-code={currency.code}
      data-display-mode={displayFullName ? 'full-name' : 'symbol'}
      className={cn("currency-display", className)}
      style={{ 
        // Animation CSS pour la mise à jour de devise
        "--highlight-color": "rgba(56, 189, 248, 0.2)",
        transition: "background-color 0.5s ease-out",
      } as React.CSSProperties}
    >
      {formattedValue}
      
      {showFixedIndicator && currency.rate_fixed && (
        <span 
          className={cn(
            "ml-1 inline-flex items-center text-[9px] px-1 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-sm",
            fixedIndicatorClassName
          )}
          title="Taux de change fixe"
        >
          <LockIcon size={8} className="mr-0.5" />
          fixe
        </span>
      )}
    </span>
  );
} 