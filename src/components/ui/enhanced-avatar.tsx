"use client"

import React, { useState, useEffect, useRef } from 'react';
import * as AvatarPrimitive from "@radix-ui/react-avatar"
import { cn } from "@/lib/utils"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"

export interface EnhancedAvatarProps {
  src?: string | null;
  alt?: string;
  fallback?: string;
  className?: string;
  fallbackClassName?: string;
  onError?: () => void;
}

/**
 * Avatar amélioré avec gestion avancée des erreurs et retry limité
 * Évite les boucles infinies de chargement
 */
export const EnhancedAvatar: React.FC<EnhancedAvatarProps> = ({
  src,
  alt = "",
  fallback = "",
  className = "",
  fallbackClassName = "",
  onError
}) => {
  const [error, setError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 1; // Réduit le nombre de retries pour éviter les boucles
  const prevSrcRef = useRef<string | null | undefined>(null);
  const imgErrorTimestampRef = useRef<number>(0);
  
  // Vérifier si l'URL est valide
  const isValidUrl = src && typeof src === 'string' && src.trim() !== '';
  
  // Reset error state if src changes to a different valid URL
  useEffect(() => {
    if (src !== prevSrcRef.current && isValidUrl) {
      // Vérifier si l'erreur est récente (moins de 5 secondes)
      // pour éviter une boucle de chargement
      const now = Date.now();
      if (now - imgErrorTimestampRef.current > 5000) {
        setError(false);
        setRetryCount(0);
      }
      prevSrcRef.current = src;
    }
    // Si src devient null ou invalide, afficher le fallback
    if (!isValidUrl) {
      setError(true);
    }
  }, [src, isValidUrl]);

  const handleError = () => {
    // Enregistrer l'horodatage de cette erreur
    imgErrorTimestampRef.current = Date.now();
    
    if (retryCount < maxRetries) {
      // Tentative de rechargement avec un délai croissant
      const timer = setTimeout(() => {
        setRetryCount(prev => prev + 1);
        setError(false); // Reset error to trigger image reload
      }, 1000 * (retryCount + 1)); // Délai progressif: 1s, 2s, etc.
      
      return () => clearTimeout(timer);
    } else {
      setError(true);
      if (onError) onError();
    }
  };

  // Get initials from alt text
  const getInitials = (name: string): string => {
    if (!name) return "?";
    return name
      .split(" ")
      .map(word => word[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <Avatar className={className}>
      {isValidUrl && !error ? (
        <AvatarImage 
          src={src as string} 
          alt={alt}
          onError={handleError}
          key={`${src}-${retryCount}`} // Force reload on retry
        />
      ) : null}
      <AvatarFallback className={fallbackClassName}>
        {getInitials(fallback || alt)}
      </AvatarFallback>
    </Avatar>
  );
};

export default EnhancedAvatar; 