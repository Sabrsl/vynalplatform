'use client';

import React, { useState, useEffect } from 'react';

interface ErrorThrowingComponentProps {
  throwImmediately?: boolean;
  throwAfterMs?: number;
  errorMessage?: string;
}

const ErrorThrowingComponent: React.FC<ErrorThrowingComponentProps> = ({
  throwImmediately = false,
  throwAfterMs = 2000,
  errorMessage = 'Ceci est une erreur de test intentionnelle!'
}) => {
  const [shouldThrow, setShouldThrow] = useState(throwImmediately);
  const [countdown, setCountdown] = useState(throwAfterMs / 1000);

  useEffect(() => {
    if (throwImmediately) {
      return;
    }
    
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setShouldThrow(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [throwImmediately, throwAfterMs]);
  
  if (shouldThrow) {
    throw new Error(errorMessage);
  }
  
  return (
    <div className="p-4 border border-orange-300 bg-orange-50 rounded-md">
      <p className="font-semibold text-orange-700">
        Ce composant va générer une erreur {throwImmediately ? 'immédiatement' : `dans ${countdown} secondes`}
      </p>
      {!throwImmediately && (
        <div className="mt-2 w-full bg-gray-200 rounded-full h-2.5">
          <div 
            className="bg-orange-500 h-2.5 rounded-full transition-all duration-1000 ease-linear" 
            style={{ width: `${(countdown / (throwAfterMs / 1000)) * 100}%` }}
          ></div>
        </div>
      )}
    </div>
  );
};

export default ErrorThrowingComponent; 