"use client";

import { useMemo } from "react";
import { 
  AlertCircle, 
  AlertTriangle, 
  Info, 
  HelpCircle, 
  ArrowRightLeft 
} from "lucide-react";
import useCurrency from "@/hooks/useCurrency";
import { formatCurrency } from "@/lib/utils/format";
import { cn } from "@/lib/utils";

interface CurrencyInfoProps {
  amount: number;
  className?: string;
  variant?: "info" | "warning" | "neutral";
  showIcon?: boolean;
  showConversion?: boolean;
  compact?: boolean;
}

/**
 * Composant pour afficher des informations sur la conversion de devise
 * lors des transactions et paiements
 */
export function CurrencyInfo({
  amount,
  className,
  variant = "info",
  showIcon = true,
  showConversion = true,
  compact = false
}: CurrencyInfoProps) {
  const { currency, loading, convertToLocalCurrency } = useCurrency();
  
  const localAmount = useMemo(() => {
    if (loading) return 0;
    return convertToLocalCurrency(amount);
  }, [amount, convertToLocalCurrency, loading]);
  
  // Sélection de l'icône en fonction du variant
  const Icon = useMemo(() => {
    switch (variant) {
      case "warning":
        return AlertTriangle;
      case "info":
        return Info;
      case "neutral":
        return ArrowRightLeft;
      default:
        return HelpCircle;
    }
  }, [variant]);
  
  // Classes CSS en fonction du variant
  const variantClasses = useMemo(() => {
    switch (variant) {
      case "warning":
        return "bg-amber-50/70 dark:bg-amber-900/10 border-amber-200/50 dark:border-amber-700/20 text-amber-800 dark:text-amber-300";
      case "info":
        return "bg-blue-50/70 dark:bg-blue-900/10 border-blue-200/50 dark:border-blue-700/20 text-blue-800 dark:text-blue-300";
      case "neutral":
        return "bg-slate-50/70 dark:bg-slate-800/10 border-slate-200/50 dark:border-slate-700/20 text-slate-800 dark:text-slate-300";
      default:
        return "bg-slate-50/70 dark:bg-slate-800/10 border-slate-200/50 dark:border-slate-700/20 text-slate-800 dark:text-slate-300";
    }
  }, [variant]);
  
  if (loading) {
    return null;
  }
  
  if (compact) {
    return (
      <div className={cn("text-xs inline-flex items-center gap-1.5", className)}>
        {showIcon && <Icon className="h-3 w-3 flex-shrink-0" />}
        <span>
          {formatCurrency(amount)} XOF
          {showConversion && currency.code !== "XOF" && (
            <span className="ml-1 opacity-80">
              ≈ {new Intl.NumberFormat('fr-FR', {
                style: 'currency',
                currency: currency.code,
                maximumFractionDigits: currency.decimals,
                minimumFractionDigits: currency.decimals
              }).format(localAmount)}
            </span>
          )}
        </span>
      </div>
    );
  }
  
  return (
    <div className={cn(`p-3 rounded-md border text-sm ${variantClasses}`, className)}>
      <div className="flex items-start gap-2">
        {showIcon && <Icon className="h-4 w-4 flex-shrink-0 mt-0.5" />}
        <div className="space-y-1">
          <p className="font-medium">
            Montant en FCFA: {formatCurrency(amount)}
          </p>
          {showConversion && currency.code !== "XOF" && (
            <p className="text-xs opacity-90">
              Équivalent en {currency.code}: {new Intl.NumberFormat('fr-FR', {
                style: 'currency',
                currency: currency.code,
                maximumFractionDigits: currency.decimals,
                minimumFractionDigits: currency.decimals
              }).format(localAmount)}
            </p>
          )}
          <p className="text-xs opacity-80 mt-2">
            Les prix sont stockés en FCFA (XOF) et convertis automatiquement à titre indicatif.
          </p>
        </div>
      </div>
    </div>
  );
} 