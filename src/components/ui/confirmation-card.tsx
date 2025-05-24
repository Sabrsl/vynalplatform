"use client";

import React from "react";
import { X, ArrowUp, CheckCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

export type ConfirmationVariant = "info" | "success" | "error";

interface ConfirmationCardProps {
  variant: ConfirmationVariant;
  title: string;
  description: string;
  primaryActionLabel?: string;
  secondaryActionLabel?: string;
  onPrimaryAction?: () => void;
  onSecondaryAction?: () => void;
  onClose?: () => void;
  progress?: number;
  showProgress?: boolean;
  className?: string;
}

/**
 * Composant de carte de confirmation pour différents types de messages
 * - info: message d'information ou en cours (bleu)
 * - success: message de succès (vert)
 * - error: message d'erreur (rouge)
 */
const ConfirmationCard: React.FC<ConfirmationCardProps> = ({
  variant = "info",
  title,
  description,
  primaryActionLabel,
  secondaryActionLabel,
  onPrimaryAction,
  onSecondaryAction,
  onClose,
  progress,
  showProgress = false,
  className,
}) => {
  // Déterminer les couleurs et icônes en fonction de la variante
  const getVariantStyles = () => {
    switch (variant) {
      case "info":
        return {
          background: "bg-gradient-to-tr from-blue-900/70 via-slate-900 to-slate-900/95",
          iconColor: "text-blue-500",
          icon: <ArrowUp className="w-8 h-8" />,
          buttonHover: "hover:bg-blue-500 hover:text-white",
          progressColor: "bg-gradient-to-r from-blue-800 via-blue-600 to-blue-500",
        };
      case "success":
        return {
          background: "bg-gradient-to-tr from-emerald-900/70 via-slate-900 to-slate-900/95",
          iconColor: "text-emerald-500",
          icon: <CheckCircle className="w-8 h-8" />,
          buttonHover: "hover:bg-emerald-500 hover:text-white",
          progressColor: "bg-emerald-500",
        };
      case "error":
        return {
          background: "bg-gradient-to-tr from-red-900/70 via-slate-900 to-slate-900/95",
          iconColor: "text-red-500",
          icon: <XCircle className="w-8 h-8" />,
          buttonHover: "hover:bg-red-500 hover:text-white",
          progressColor: "bg-red-500",
        };
      default:
        return {
          background: "bg-gradient-to-tr from-blue-900/70 via-slate-900 to-slate-900/95",
          iconColor: "text-blue-500",
          icon: <ArrowUp className="w-8 h-8" />,
          buttonHover: "hover:bg-blue-500 hover:text-white",
          progressColor: "bg-gradient-to-r from-blue-800 via-blue-600 to-blue-500",
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div
      className={cn(
        "w-full max-w-lg rounded-lg shadow-lg transition-opacity duration-200 ease-in opacity-95 hover:opacity-100",
        styles.background,
        className
      )}
    >
      <div className="absolute top-0 right-0 p-2">
        {onClose && (
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className={cn("flex-shrink-0", styles.iconColor)}>
            {styles.icon}
          </div>
          
          <div className="flex-grow">
            <h3 className="text-base font-semibold text-white mb-1">
              {title}
            </h3>
            <p className="text-gray-300 text-sm">
              {description}
            </p>

            {showProgress && (
              <div className="mt-3 w-full">
                <div className="flex justify-end mb-1">
                  <span className="text-xs font-medium text-gray-300">{progress || 0}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-1">
                  <div
                    className={cn("h-1 rounded-full", styles.progressColor)}
                    style={{ width: `${progress || 0}%` }}
                  ></div>
                </div>
              </div>
            )}

            <div className="mt-4 flex gap-2">
              {primaryActionLabel && (
                <Button
                  variant="outline"
                  onClick={onPrimaryAction}
                  className={cn(
                    "border-slate-700 bg-slate-800 text-white text-xs h-8 px-3",
                    styles.buttonHover
                  )}
                >
                  {primaryActionLabel}
                </Button>
              )}
              
              {secondaryActionLabel && (
                <Button
                  variant="outline"
                  onClick={onSecondaryAction}
                  className="border-slate-700 bg-slate-800 text-white text-xs h-8 px-3 hover:bg-slate-700"
                >
                  {secondaryActionLabel}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationCard; 