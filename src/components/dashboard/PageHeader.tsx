import React from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
}

export function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <div className="mb-4">
      <h1 className="text-xl md:text-2xl font-bold text-vynal-purple-light dark:text-vynal-text-primary">
        {title}
      </h1>
      {description && (
        <p className="text-sm text-vynal-purple-secondary dark:text-vynal-text-secondary mt-1">
          {description}
        </p>
      )}
    </div>
  );
} 