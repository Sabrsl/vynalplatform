/**
 * Système d'événements simple pour la communication entre les différentes parties de l'application
 */
import React from 'react';

type EventCallback = (...args: any[]) => void;

interface EventsMap {
  [key: string]: EventCallback[];
}

class EventEmitter {
  private events: EventsMap = {};

  // S'abonner à un événement
  on(event: string, callback: EventCallback): () => void {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);

    // Retourner une fonction de désabonnement
    return () => {
      this.events[event] = this.events[event].filter(cb => cb !== callback);
    };
  }

  // Émettre un événement
  emit(event: string, ...args: any[]): void {
    const callbacks = this.events[event];
    if (callbacks) {
      callbacks.forEach(callback => {
        callback(...args);
      });
    }
  }

  // Supprimer tous les écouteurs d'un événement
  removeAllListeners(event: string): void {
    delete this.events[event];
  }
}

// Exporter une instance singleton
export const eventEmitter = new EventEmitter();

// Définir les noms d'événements comme constantes pour éviter les erreurs de typo
export const EVENTS = {
  NOTIFICATION: 'notification',
};

// Type pour les notifications
export type NotificationEvent = {
  title: string;
  description?: string;
  variant?: 'default' | 'destructive' | 'purple';
  duration?: number;
  action?: React.ReactNode;
  priority?: 'high' | 'normal';
}; 