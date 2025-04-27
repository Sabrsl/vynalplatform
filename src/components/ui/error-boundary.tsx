"use client";

import React, { Component, ReactNode, ErrorInfo } from "react";

// Étendre l'interface Window pour inclure gtag
declare global {
  interface Window {
    gtag?: (command: string, action: string, params: object) => void;
  }
}

interface ErrorBoundaryProps {
  fallback: ReactNode;
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Composant ErrorBoundary pour capturer et gérer les erreurs dans les composants enfants
 * Permet d'afficher un UI de secours en cas d'erreur au lieu de faire crasher toute l'application
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { 
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Mettre à jour l'état pour afficher l'UI de secours lors du prochain rendu
    return { 
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Possibilité de journaliser l'erreur vers un service de reporting
    console.error("Error caught by ErrorBoundary:", error);
    console.error("Component Stack:", errorInfo.componentStack);
    
    // Possibilité d'envoyer l'erreur à un service de monitoring (Sentry, etc.)
    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("event", "error", {
        error_message: error.message,
        component_stack: errorInfo.componentStack,
      });
    }
  }

  resetError = (): void => {
    this.setState({ 
      hasError: false,
      error: null
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div>
          {this.props.fallback}
          <div className="mt-4 text-center">
            <button
              onClick={this.resetError}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
            >
              Réessayer
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
} 