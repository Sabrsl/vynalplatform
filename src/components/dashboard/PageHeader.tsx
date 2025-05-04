import React from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
}

export function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <div className="mb-4">
      <h1 className="text-base sm:text-lg md:text-xl font-bold text-vynal-purple-light dark:text-vynal-text-primary">
        {title}
      </h1>
      {description && (
        <p className="text-[10px] sm:text-xs text-vynal-purple-secondary dark:text-vynal-text-secondary/80 mt-1">
          {description}
        </p>
      )}
    </div>
  );
} 