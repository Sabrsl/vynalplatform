"use client";

import React, { useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from 'next-themes';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface UserAvatarProps {
  /**
   * Taille prédéfinie de l'avatar
   * @default "md"
   */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  
  /**
   * Classes CSS additionnelles
   */
  className?: string;
  
  /**
   * URL de l'image à afficher (prioritaire sur l'image de l'utilisateur)
   */
  imageUrl?: string;
  
  /**
   * Forcer l'utilisation des initiales même si une image est disponible
   * @default false
   */
  forceInitials?: boolean;
  
  /**
   * Nom à utiliser pour les initiales (prioritaire sur le nom de l'utilisateur)
   */
  name?: string;
  
  /**
   * Email à utiliser pour les initiales (prioritaire sur l'email de l'utilisateur)
   */
  email?: string;
  
  /**
   * Forme de l'avatar (carrée ou ronde)
   * @default "rounded"
   */
  shape?: 'rounded' | 'circle';
  
  /**
   * Texte alternatif pour l'accessibilité
   */
  alt?: string;
  
  /**
   * Fonction de clic sur l'avatar
   */
  onClick?: React.MouseEventHandler<HTMLDivElement>;
  
  /**
   * État de chargement
   * @default false
   */
  loading?: boolean;
  
  /**
   * État d'erreur
   * @default false
   */
  error?: boolean;
  
  /**
   * État en ligne
   */
  status?: 'online' | 'offline' | 'away' | 'busy' | 'none';
}

/**
 * Composant Avatar utilisateur optimisé
 * - Support des thèmes clair/sombre
 * - Gestion des erreurs et états de chargement
 * - Accessibilité améliorée
 * - Options de personnalisation étendues
 * - Performance optimisée
 */
export function UserAvatar({
  size = 'md',
  className = '',
  imageUrl,
  forceInitials = false,
  name,
  email,
  shape = 'rounded',
  alt,
  onClick,
  loading = false,
  error = false,
  status
}: UserAvatarProps) {
  // Récupérer les données utilisateur
  const { user } = useAuth();
  const { resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme === 'dark';
  
  // Calcul des classes de taille
  const sizeConfig = useMemo(() => {
    const sizes = {
      xs: {
        container: 'w-5 h-5',
        fontSize: 'text-xs',
        statusSize: 'w-1.5 h-1.5',
        statusPosition: '-right-0.5 -bottom-0.5'
      },
      sm: {
        container: 'w-6 h-6',
        fontSize: 'text-xs',
        statusSize: 'w-2 h-2',
        statusPosition: '-right-0.5 -bottom-0.5'
      },
      md: {
        container: 'w-8 h-8',
        fontSize: 'text-sm',
        statusSize: 'w-2.5 h-2.5',
        statusPosition: '-right-0.5 -bottom-0.5'
      },
      lg: {
        container: 'w-10 h-10',
        fontSize: 'text-base',
        statusSize: 'w-3 h-3',
        statusPosition: '-right-1 -bottom-1'
      },
      xl: {
        container: 'w-14 h-14',
        fontSize: 'text-lg',
        statusSize: 'w-3.5 h-3.5',
        statusPosition: '-right-1 -bottom-1'
      }
    };
    
    return sizes[size] || sizes.md;
  }, [size]);
  
  // Calcul des classes de forme
  const shapeClass = useMemo(() => {
    return shape === 'circle' ? 'rounded-full' : 'rounded-md';
  }, [shape]);
  
  // Déterminer l'image à afficher
  const finalImageUrl = useMemo(() => {
    if (error || forceInitials) return null;
    
    // Priorité à l'URL d'image fournie explicitement
    if (imageUrl) return imageUrl;
    
    // Ensuite, utiliser l'image de l'utilisateur si disponible
    return user?.user_metadata?.avatar_url || user?.user_metadata?.picture || null;
  }, [imageUrl, user, forceInitials, error]);
  
  // Calculer les initiales de l'utilisateur de manière fiable
  const initials = useMemo(() => {
    try {
      // Priorité aux props fournies explicitement
      if (name) {
        return name.trim().charAt(0).toUpperCase();
      }
      
      if (email) {
        return email.trim().charAt(0).toUpperCase();
      }
      
      // Ensuite, utiliser les données de l'utilisateur
      if (user?.user_metadata?.name) {
        return user.user_metadata.name.trim().charAt(0).toUpperCase();
      }
      
      if (user?.user_metadata?.full_name) {
        return user.user_metadata.full_name.trim().charAt(0).toUpperCase();
      }
      
      if (user?.email) {
        return user.email.trim().charAt(0).toUpperCase();
      }
      
      if (user?.user_metadata?.email) {
        return user.user_metadata.email.trim().charAt(0).toUpperCase();
      }
      
      // Utiliser les données brutes si nécessaire
      if (user?.user_metadata?.name) {
        return user.user_metadata.name.trim().charAt(0).toUpperCase();
      }
      
      // Fallback sécurisé
      return "U";
    } catch (e) {
      console.error("Error generating user initials:", e);
      return "U";
    }
  }, [name, email, user]);
  
  // Calculer le dégradé de fond pour les initiales
  const backgroundGradient = useMemo(() => {
    // Utiliser des couleurs adaptées au thème
    if (isDarkMode) {
      return 'bg-gradient-to-br from-vynal-accent-primary to-vynal-accent-secondary';
    }
    return 'bg-gradient-to-br from-vynal-accent-primary to-vynal-accent-secondary';
  }, [isDarkMode]);
  
  // Générer les couleurs de statut
  const statusColor = useMemo(() => {
    if (!status || status === 'none') return null;
    
    const statusColors = {
      online: 'bg-green-500',
      offline: isDarkMode ? 'bg-gray-500' : 'bg-gray-400',
      away: 'bg-amber-500',
      busy: 'bg-red-500'
    };
    
    return statusColors[status];
  }, [status, isDarkMode]);
  
  // Générer le texte alternatif pour l'accessibilité
  const accessibilityText = useMemo(() => {
    if (alt) return alt;
    
    const userName = name || 
                     user?.user_metadata?.name || 
                     user?.user_metadata?.full_name ||
                     email ||
                     user?.email ||
                     user?.user_metadata?.email ||
                     'Utilisateur';
    
    if (status) {
      const statusText = {
        online: 'en ligne',
        offline: 'hors ligne',
        away: 'absent',
        busy: 'occupé',
        none: ''
      }[status];
      
      return `Avatar de ${userName}, ${statusText}`;
    }
    
    return `Avatar de ${userName}`;
  }, [alt, name, user, email, status]);
  
  // Rendu du composant
  return (
    <div 
      className={cn(
        sizeConfig.container,
        shapeClass,
        'relative flex items-center justify-center overflow-hidden shadow-sm',
        'transition-all duration-200',
        onClick ? 'cursor-pointer hover:opacity-90 hover:shadow-md' : '',
        loading ? 'animate-pulse' : '',
        className
      )}
      onClick={onClick}
      role={onClick ? 'button' : 'img'}
      aria-label={accessibilityText}
      title={accessibilityText}
    >
      {/* Image de l'avatar */}
      {finalImageUrl && !loading ? (
        <Image
          src={finalImageUrl}
          alt={accessibilityText}
          fill
          className="object-cover"
          sizes={sizeConfig.container.replace('w-', '').replace('h-', '')}
          priority={size === 'lg' || size === 'xl'}
          onError={() => console.error("Failed to load avatar image")}
        />
      ) : (
        /* Fallback avec initiales */
        <div className={cn(
          'w-full h-full flex items-center justify-center text-white font-medium',
          backgroundGradient,
          sizeConfig.fontSize
        )}>
          {loading ? '' : initials}
        </div>
      )}
      
      {/* Indicateur de statut */}
      {statusColor && (
        <div className={cn(
          'absolute border-2',
          isDarkMode ? 'border-vynal-purple-dark' : 'border-white',
          statusColor,
          sizeConfig.statusSize,
          sizeConfig.statusPosition,
          shape === 'circle' ? 'rounded-full' : 'rounded-full'
        )} 
        aria-hidden="true"
        />
      )}
    </div>
  );
}