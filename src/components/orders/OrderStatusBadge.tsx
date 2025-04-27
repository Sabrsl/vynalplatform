"use client";

import { Badge } from "@/components/ui/badge";
import { 
  Clock, 
  CheckCircle, 
  FileCheck, 
  RefreshCw, 
  AlertTriangle 
} from "lucide-react";

type OrderStatus = "pending" | "in_progress" | "completed" | "delivered" | "revision_requested" | "cancelled" | "in_dispute";

interface OrderStatusBadgeProps {
  status: OrderStatus;
  showIcon?: boolean;
  size?: "sm" | "md" | "lg";
}

export function OrderStatusBadge({ status, showIcon = true, size = "md" }: OrderStatusBadgeProps) {
  // Définitions des styles basés sur le statut
  const statusStyles = {
    pending: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800/30",
    in_progress: "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800/30",
    completed: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800/30",
    delivered: "bg-vynal-accent-primary/10 text-vynal-accent-primary border-vynal-accent-primary/20 dark:bg-vynal-accent-primary/20 dark:border-vynal-accent-primary/30",
    revision_requested: "bg-vynal-purple-secondary/10 text-vynal-purple-secondary border-vynal-purple-secondary/20 dark:bg-vynal-purple-secondary/20 dark:border-vynal-purple-secondary/30",
    cancelled: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800/30",
    in_dispute: "bg-red-100 text-red-600 border-red-200 dark:bg-red-700/30 dark:text-red-400 dark:border-red-500/40",
  };
  
  const statusLabels = {
    pending: "En attente",
    in_progress: "En cours",
    completed: "Terminée",
    delivered: "Livrée",
    revision_requested: "Révision demandée",
    cancelled: "Annulée",
    in_dispute: "En litige",
  };
  
  const statusIcons = {
    pending: <Clock className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} />,
    in_progress: <Clock className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} />,
    completed: <CheckCircle className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} />,
    delivered: <FileCheck className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} />,
    revision_requested: <RefreshCw className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} />,
    cancelled: <Clock className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} />,
    in_dispute: <AlertTriangle className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} />,
  };
  
  const sizeClasses = {
    sm: "text-[10px] py-0.5 px-1.5",
    md: "text-xs py-1 px-2",
    lg: "text-sm py-1 px-2.5"
  };

  return (
    <Badge 
      variant="outline" 
      className={`${statusStyles[status]} ${sizeClasses[size]} flex items-center`}
    >
      {showIcon && (
        <span className="mr-1">
          {statusIcons[status]}
        </span>
      )}
      {statusLabels[status]}
    </Badge>
  );
} 