import React from 'react';
import { Shield, Medal, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface CertificationBadgeProps {
  type: 'standard' | 'premium' | 'expert';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

/**
 * Badge de certification pour afficher le statut de certification d'un utilisateur
 * - Standard: bouclier bleu
 * - Premium: médaille violette 
 * - Expert: cercle avec V (style Facebook)
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
      icon: Check,
      className: 'text-white bg-[#FF66B2] dark:bg-[#FF66B2]',
      label: 'Expert'
    }
  }[type];
  
  // Taille de l'icône et du badge
  const sizeStyles = {
    xs: {
      container: 'p-0.5 gap-0.5',
      icon: 'h-2 w-2',
      text: 'text-[8px]'
    },
    sm: {
      container: 'p-0.5 gap-1',
      icon: 'h-2.5 w-2.5',
      text: 'text-[10px]'
    },
    md: {
      container: 'p-1 gap-1.5',
      icon: 'h-3.5 w-3.5',
      text: 'text-xs'
    },
    lg: {
      container: 'p-1.5 gap-2',
      icon: 'h-4.5 w-4.5',
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
        type === 'expert' && 'border-2 border-white dark:border-vynal-purple-dark shadow-sm',
        className
      )}
      title={`Certification ${config.label}`}
    >
      <IconComponent className={cn(
        sizeStyles.icon,
        type === 'expert' && 'stroke-[3]'
      )} />
      {showLabel && (
        <span className={cn(sizeStyles.text, 'font-medium')}>{config.label}</span>
      )}
    </div>
  );
} 