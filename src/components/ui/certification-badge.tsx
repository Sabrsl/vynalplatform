import React from 'react';
import { Shield, Medal, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface CertificationBadgeProps {
  type: 'standard' | 'premium' | 'expert';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

/**
 * Badge de certification pour afficher le statut de certification d'un utilisateur
 * - Standard: bouclier bleu
 * - Premium: médaille violette 
 * - Expert: étincelles dorées
 */
export function CertificationBadge({ 
  type, 
  size = 'sm', 
  showLabel = false,
  className 
}: CertificationBadgeProps) {
  // Configuration selon le type de certification
  const config = {
    standard: {
      icon: Shield,
      className: 'text-blue-500 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400',
      label: 'Standard'
    },
    premium: {
      icon: Medal,
      className: 'text-purple-500 bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400',
      label: 'Premium'
    },
    expert: {
      icon: Sparkles,
      className: 'text-amber-500 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400',
      label: 'Expert'
    }
  }[type];
  
  // Taille de l'icône et du badge
  const sizeStyles = {
    sm: {
      container: 'p-0.5 gap-1',
      icon: 'h-3 w-3',
      text: 'text-[10px]'
    },
    md: {
      container: 'p-1 gap-1.5',
      icon: 'h-4 w-4',
      text: 'text-xs'
    },
    lg: {
      container: 'p-1.5 gap-2',
      icon: 'h-5 w-5',
      text: 'text-sm'
    }
  }[size];
  
  const IconComponent = config.icon;
  
  return (
    <div 
      className={cn(
        'flex items-center justify-center rounded-full',
        sizeStyles.container,
        config.className,
        !showLabel && 'aspect-square',
        showLabel && 'px-2',
        className
      )}
      title={`Certification ${config.label}`}
    >
      <IconComponent className={cn(sizeStyles.icon)} />
      {showLabel && (
        <span className={cn(sizeStyles.text, 'font-medium')}>{config.label}</span>
      )}
    </div>
  );
} 