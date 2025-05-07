"use client";

import { ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface WalletStatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  isLoading?: boolean;
  variant?: "blue" | "green" | "amber" | "red" | "purple" | "default";
}

/**
 * Composant réutilisable pour les cartes de statistiques financières
 */
export function WalletStatCard({
  title,
  value,
  icon: Icon,
  isLoading = false,
  variant = "default"
}: WalletStatCardProps) {
  // Styles basés sur la variante
  const styles = {
    blue: {
      iconBg: "bg-gradient-to-tr from-blue-200/80 to-blue-100/80 shadow-sm dark:from-blue-900/20 dark:to-blue-800/20",
      iconText: "text-blue-600 dark:text-blue-400",
      cardBg: "bg-gradient-to-br from-white to-blue-50/50 dark:from-vynal-purple-dark/50 dark:to-blue-900/20",
      valueText: "text-blue-600 dark:text-blue-400"
    },
    green: {
      iconBg: "bg-gradient-to-tr from-green-200/80 to-green-100/80 shadow-sm dark:from-green-900/20 dark:to-green-800/20",
      iconText: "text-green-600 dark:text-green-400",
      cardBg: "bg-gradient-to-br from-white to-green-50/50 dark:from-vynal-purple-dark/50 dark:to-green-900/20",
      valueText: "text-green-600 dark:text-green-400"
    },
    amber: {
      iconBg: "bg-gradient-to-tr from-amber-200/80 to-amber-100/80 shadow-sm dark:from-amber-900/20 dark:to-amber-800/20",
      iconText: "text-amber-600 dark:text-amber-400",
      cardBg: "bg-gradient-to-br from-white to-amber-50/50 dark:from-vynal-purple-dark/50 dark:to-amber-900/20",
      valueText: "text-amber-600 dark:text-amber-400"
    },
    red: {
      iconBg: "bg-gradient-to-tr from-red-200/80 to-red-100/80 shadow-sm dark:from-red-900/20 dark:to-red-800/20",
      iconText: "text-red-600 dark:text-red-400",
      cardBg: "bg-gradient-to-br from-white to-red-50/50 dark:from-vynal-purple-dark/50 dark:to-red-900/20",
      valueText: "text-red-600 dark:text-red-400"
    },
    purple: {
      iconBg: "bg-gradient-to-tr from-purple-200/80 to-purple-100/80 shadow-sm dark:from-purple-900/20 dark:to-purple-800/20",
      iconText: "text-purple-600 dark:text-purple-400",
      cardBg: "bg-gradient-to-br from-white to-purple-50/50 dark:from-vynal-purple-dark/50 dark:to-purple-900/20",
      valueText: "text-purple-600 dark:text-purple-400"
    },
    default: {
      iconBg: "bg-gradient-to-tr from-vynal-purple-secondary/30 to-vynal-purple-secondary/20 shadow-sm",
      iconText: "text-vynal-purple-secondary dark:text-vynal-text-secondary",
      cardBg: "bg-white dark:bg-vynal-purple-dark/10",
      valueText: "text-vynal-purple-light dark:text-vynal-text-primary"
    }
  };

  const currentStyle = styles[variant];
  
  return (
    <Card className={cn(
      "rounded-2xl border border-vynal-purple-secondary/10 shadow-sm hover:shadow-md transition-all duration-300",
      currentStyle.cardBg
    )}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 px-3 pt-3 sm:px-4 sm:pt-4">
        <CardDescription className="text-[10px] sm:text-xs font-medium text-vynal-purple-light dark:text-vynal-text-primary">
          {title}
        </CardDescription>
        <div className={cn("p-1.5 rounded-full", currentStyle.iconBg)}>
          <Icon className={cn("h-3 w-3 sm:h-3.5 sm:w-3.5", currentStyle.iconText)} />
        </div>
      </CardHeader>
      <CardContent className="px-3 pb-3 sm:px-4 sm:pb-4">
        {isLoading ? (
          <div className="h-6 w-28 bg-vynal-purple-secondary/30 rounded-md animate-pulse"></div>
        ) : (
          <div className={cn("text-sm sm:text-base font-bold", currentStyle.valueText)}>{value}</div>
        )}
      </CardContent>
    </Card>
  );
} 