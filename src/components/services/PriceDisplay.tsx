"use client";

import { Badge } from "@/components/ui/badge";
import { CurrencyDisplay } from "@/components/ui/CurrencyDisplay";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { CURRENCY_CHANGE_EVENT } from "@/lib/utils/currency-updater";

interface PriceDisplayProps {
  price: number;
  className?: string;
  variant?: 'badge' | 'text';
  badgeClassName?: string;
  showFixedIndicator?: boolean;
}

/**
 * Composant pour afficher les prix avec conversion de devise pour les services
 * Peut être utilisé en mode badge ou en mode texte
 */
export function PriceDisplay({
  price,
  className = "",
  variant = 'text',
  badgeClassName = "",
  showFixedIndicator = false
}: PriceDisplayProps) {
  // État local pour forcer le rafraîchissement
  const [forceUpdate, setForceUpdate] = useState(0);
  
  // Écouter les événements de changement de devise
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleCurrencyChange = () => {
      // Forcer la mise à jour du composant
      setForceUpdate(prev => prev + 1);
    };
    
    // Écouter l'événement global de changement de devise
    window.addEventListener(CURRENCY_CHANGE_EVENT, handleCurrencyChange);
    
    return () => {
      window.removeEventListener(CURRENCY_CHANGE_EVENT, handleCurrencyChange);
    };
  }, []);
  
  if (variant === 'badge') {
    return (
      <div className={cn("absolute bottom-0 right-0 p-1 hidden sm:block", className)}>
        <Badge 
          variant="outline" 
          className={cn(
            "shadow-sm text-[10px] bg-vynal-accent-primary/90 text-white hover:bg-vynal-accent-primary border-vynal-accent-primary/30 dark:bg-vynal-accent-primary dark:text-white dark:hover:bg-vynal-accent-primary/90 dark:border-vynal-accent-primary/50", 
            badgeClassName
          )}
        >
          <CurrencyDisplay 
            amount={price} 
            showFixedIndicator={false}
            fixedIndicatorClassName="text-white h-2 w-2 ml-0.5"
            displayFullName={true}
            key={`currency-badge-${forceUpdate}`}
          />
        </Badge>
      </div>
    );
  }
  
  return (
    <div className={className}>
      <CurrencyDisplay 
        amount={price} 
        showFixedIndicator={false}
        displayFullName={true}
        key={`currency-text-${forceUpdate}`}
      />
    </div>
  );
} 