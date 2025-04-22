'use client';

import React, { Component, Suspense } from 'react';

interface ClientWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ClientErrorBoundary extends Component<ClientWrapperProps, ErrorBoundaryState> {
  constructor(props: ClientWrapperProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error("Error in component:", error, errorInfo);
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      return this.props.fallback || <div className="p-4 text-red-500">Une erreur est survenue. Veuillez rafraîchir la page.</div>;
    }

    return this.props.children;
  }
}

export default function ClientWrapper({ 
  children,
  fallback = <div className="flex items-center justify-center p-4">Chargement...</div>
}: ClientWrapperProps) {
  return (
    <Suspense fallback={fallback}>
      <ClientErrorBoundary>
        {children}
      </ClientErrorBoundary>
    </Suspense>
  );
} 