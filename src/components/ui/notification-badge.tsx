import React from 'react';
import { cn } from '@/lib/utils';

interface NotificationBadgeProps {
  count: number;
  maxCount?: number;
  className?: string;
}

/**
 * Composant d'affichage d'un badge de notification avec le nombre d'éléments non lus
 */
export function NotificationBadge({ count, maxCount = 99, className }: NotificationBadgeProps) {
  if (count <= 0) return null;
  
  const displayCount = count > maxCount ? `${maxCount}+` : count.toString();
  
  return (
    <span 
      className={cn(
        "absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] text-xs font-medium rounded-full bg-pink-600 text-white px-1 z-10",
        className
      )}
      aria-label={`${count} notifications non lues`}
    >
      {displayCount}
    </span>
  );
}

export default NotificationBadge; 