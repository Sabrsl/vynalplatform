"use client";

import React from 'react';
import { useAuth } from '@/hooks/useAuth';

interface UserAvatarProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function UserAvatar({ size = 'md', className = '' }: UserAvatarProps) {
  const { user } = useAuth();
  
  const sizeClass = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8', 
    lg: 'w-10 h-10'
  }[size];
  
  const initials = user?.user_metadata?.name 
    ? user.user_metadata.name.charAt(0).toUpperCase() 
    : user?.email?.charAt(0).toUpperCase() || "U";
  
  return (
    <div className={`${sizeClass} rounded-md bg-gradient-to-br from-vynal-accent-primary to-vynal-accent-secondary flex items-center justify-center text-white font-medium shadow-sm ${className}`}>
      {initials}
    </div>
  );
} 