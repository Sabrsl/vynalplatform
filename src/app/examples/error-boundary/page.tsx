'use client';

import React, { useState, useEffect } from 'react';
import { ClientErrorBoundary } from '@/components/layouts/ClientWrapper';

const ImmediateErrorComponent = () => {
  // Utiliser useState pour s'assurer que ce code ne s'exécute que côté client
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // Ne jeter l'erreur que côté client, pas pendant le build
  if (isClient) {
    throw new Error('This is an immediate error from ErrorThrowingComponent');
  }
  
  return <div>Attendez que le composant se charge côté client...</div>;
};

const DelayedErrorComponent = () => {
  const [shouldError, setShouldError] = useState(false);

  useEffect(() => {
    // Set shouldError to true after 3 seconds
    const timer = setTimeout(() => setShouldError(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  if (shouldError) {
    throw new Error('This is a delayed error from ErrorThrowingComponent');
  }

  return <div className="p-4 border rounded">This component will throw an error after 3 seconds...</div>;
};

export default function ErrorBoundaryExamplePage() {
  return (
    <div className="p-8 space-y-8">
      <h1 className="text-3xl font-bold">Error Boundary Example</h1>
      
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">1. Component with Immediate Error</h2>
        <ClientErrorBoundary fallback={<div className="p-4 border border-red-500 bg-red-50 text-red-600 rounded">
          An error occurred in the component! The error boundary caught it.
        </div>}>
          <ImmediateErrorComponent />
        </ClientErrorBoundary>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">2. Component with Delayed Error</h2>
        <ClientErrorBoundary fallback={<div className="p-4 border border-red-500 bg-red-50 text-red-600 rounded">
          An error occurred after a delay! The error boundary caught it.
        </div>}>
          <DelayedErrorComponent />
        </ClientErrorBoundary>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">3. Understanding ClientErrorBoundary</h2>
        <p>
          The ClientErrorBoundary component is a React error boundary that catches JavaScript errors
          in its child component tree and displays a fallback UI instead of crashing the whole application.
        </p>
        <p>
          This is especially useful in client components where we want to gracefully handle errors
          and provide feedback to users rather than showing a blank page.
        </p>
      </div>
    </div>
  );
} 