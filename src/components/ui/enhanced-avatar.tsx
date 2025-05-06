"use client"

import * as React from "react"
import { useState, useEffect } from "react"
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
  const maxRetries = 2;

  // Reset error state if src changes
  useEffect(() => {
    if (src) {
      setError(false);
      setRetryCount(0);
    }
  }, [src]);

  const handleError = () => {
    if (retryCount < maxRetries) {
      // Wait a bit and retry loading the image
      const timer = setTimeout(() => {
        setRetryCount(prev => prev + 1);
        setError(false); // Reset error to trigger image reload
      }, 1000);
      
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
      {src && !error ? (
        <AvatarImage 
          src={src} 
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