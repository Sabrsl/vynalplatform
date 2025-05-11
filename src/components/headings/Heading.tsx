import React from 'react';

interface HeadingProps {
  title: string;
  subtitle?: string;
  className?: string;
}

export function Heading({ title, subtitle, className }: HeadingProps) {
  return (
    <div className={`mb-6 ${className || ''}`}>
      <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-vynal-text-primary">
        {title}
      </h1>
      {subtitle && (
        <p className="text-sm text-slate-600 dark:text-vynal-text-secondary mt-1">
          {subtitle}
        </p>
      )}
    </div>
  );
} 