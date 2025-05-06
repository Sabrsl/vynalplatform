import React from 'react';

interface UnreadBadgeProps {
  count: number;
  className?: string;
}

export const UnreadBadge: React.FC<UnreadBadgeProps> = ({ count, className = '' }) => {
  if (!count || count <= 0) return null;
  
  return (
    <div 
      className={`bg-red-500 text-white font-bold text-xs min-w-[20px] h-5 rounded-full flex items-center justify-center px-1.5 ${className}`}
    >
      {count > 99 ? '99+' : count}
    </div>
  );
}; 