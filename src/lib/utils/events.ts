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
  // Événements d'invalidation de cache pour les pages statiques
  INVALIDATE_ABOUT: 'invalidate_about',
  INVALIDATE_HOW_IT_WORKS: 'invalidate_how_it_works',
  INVALIDATE_STATUS: 'invalidate_status',
  INVALIDATE_FREELANCE: 'invalidate_freelance',
  INVALIDATE_CONTACT: 'invalidate_contact',
  INVALIDATE_FAQ: 'invalidate_faq',
  INVALIDATE_TERMS: 'invalidate_terms',
  INVALIDATE_PRIVACY: 'invalidate_privacy',
  INVALIDATE_CODE_OF_CONDUCT: 'invalidate_code_of_conduct',
  INVALIDATE_HOME: 'invalidate_home',
  INVALIDATE_SERVICES: 'invalidate_services',
  // Événements génériques pour les types de pages
  INVALIDATE_STATIC_PAGES: 'invalidate_static_pages',
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