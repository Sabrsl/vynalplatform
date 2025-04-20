import React from 'react';
import { cn } from '@/lib/utils';

interface UserStatusIndicatorProps {
  isOnline: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const UserStatusIndicator: React.FC<UserStatusIndicatorProps> = ({
  isOnline,
  className,
  size = 'md'
}) => {
  // Définir les tailles
  const sizeClasses = {
    sm: 'h-2 w-2',
    md: 'h-3 w-3',
    lg: 'h-4 w-4'
  };
  
  return (
    <span 
      className={cn(
        'rounded-full border-2 border-white dark:border-gray-950',
        sizeClasses[size],
        isOnline ? 'bg-green-500' : 'bg-gray-400',
        className
      )}
      title={isOnline ? 'En ligne' : 'Hors ligne'}
    />
  );
};

export default UserStatusIndicator; 