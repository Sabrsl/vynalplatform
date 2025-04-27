import { z } from 'zod';

/**
 * Interface pour la table notifications
 */
export interface Notification {
  /** ID unique de la notification - UUID généré automatiquement */
  id: string;
  
  /** Date et heure de création de la notification - Par défaut NOW() */
  created_at: string;
  
  /** ID de l'utilisateur destinataire - Clé étrangère vers profiles.id */
  user_id: string | null;
  
  /** Type de notification */
  type: string;
  
  /** Contenu textuel de la notification */
  content: string | null;
  
  /** ID de la conversation associée (optionnel) - Clé étrangère vers conversations.id */
  conversation_id: string | null;
  
  /** Statut de lecture de la notification - Par défaut false */
  read: boolean | null;
  
  /** Indique si un email a été envoyé pour cette notification */
  emailed?: boolean | null;
  
  /** Date et heure d'envoi de l'email pour cette notification */
  emailed_at?: string | null;
}

/**
 * Type pour les opérations d'insertion (sans les champs générés automatiquement)
 */
export type NotificationInsert = Omit<Notification, 'id' | 'created_at' | 'emailed' | 'emailed_at'> & {
  id?: string;
  created_at?: string;
  emailed?: boolean | null;
  emailed_at?: string | null;
};

/**
 * Type pour les mises à jour partielles
 */
export type NotificationUpdate = Partial<Omit<Notification, 'id' | 'created_at' | 'user_id' | 'type'>>;

/**
 * Schéma Zod pour la validation des données
 */
export const notificationSchema = z.object({
  id: z.string().uuid(),
  created_at: z.string().datetime(),
  user_id: z.string().uuid().nullable(),
  type: z.string(),
  content: z.string().nullable(),
  conversation_id: z.string().uuid().nullable(),
  read: z.boolean().nullable().default(false),
  emailed: z.boolean().nullable().optional(),
  emailed_at: z.string().datetime().nullable().optional(),
});

/**
 * Schéma pour la validation des insertions
 */
export const notificationInsertSchema = z.object({
  user_id: z.string().uuid().nullable(),
  type: z.string(),
  content: z.string().nullable(),
  conversation_id: z.string().uuid().nullable(),
  read: z.boolean().nullable().default(false),
  id: z.string().uuid().optional(),
  created_at: z.string().datetime().optional(),
  emailed: z.boolean().nullable().optional(),
  emailed_at: z.string().datetime().nullable().optional(),
});

/**
 * Schéma pour la validation des mises à jour
 */
export const notificationUpdateSchema = z.object({
  content: z.string().nullable().optional(),
  conversation_id: z.string().uuid().nullable().optional(),
  read: z.boolean().nullable().optional(),
  emailed: z.boolean().nullable().optional(),
  emailed_at: z.string().datetime().nullable().optional(),
});

/**
 * Types de notifications disponibles
 */
export enum NotificationType {
  NEW_MESSAGE = 'new_message',
  NEW_CONVERSATION = 'new_conversation',
  ORDER_STATUS = 'order_status',
  SYSTEM = 'system',
  
  // Types pour les notifications de commandes
  ORDER_CONFIRMED = 'order_confirmed',
  ORDER_DELIVERED = 'order_delivered',
  NEW_ORDER = 'new_order',
  
  // Types pour les notifications de litiges
  DISPUTE_MESSAGE = 'dispute_message',
  DISPUTE_OPENED = 'dispute_opened',
  DISPUTE_RESOLVED = 'dispute_resolved',
  
  // Type pour les rappels de messages non lus
  UNREAD_MESSAGE_REMINDER = 'unread_message_reminder',
}

/**
 * Fonctions utilitaires pour la table notifications
 */
export const Notifications = {
  /**
   * Crée un objet d'insertion pour une notification de nouveau message
   */
  createNewMessageNotification: (
    userId: string,
    content: string,
    conversationId: string,
  ): NotificationInsert => {
    return {
      user_id: userId,
      type: NotificationType.NEW_MESSAGE,
      content,
      conversation_id: conversationId,
      read: false,
    };
  },
  
  /**
   * Crée un objet d'insertion pour une notification de nouvelle conversation
   */
  createNewConversationNotification: (
    userId: string,
    content: string,
    conversationId: string,
  ): NotificationInsert => {
    return {
      user_id: userId,
      type: NotificationType.NEW_CONVERSATION,
      content,
      conversation_id: conversationId,
      read: false,
    };
  },
  
  /**
   * Crée un objet d'insertion pour une notification système
   */
  createSystemNotification: (
    userId: string,
    content: string,
  ): NotificationInsert => {
    return {
      user_id: userId,
      type: NotificationType.SYSTEM,
      content,
      conversation_id: null,
      read: false,
    };
  },
  
  /**
   * Crée un objet d'insertion pour une notification de changement de statut de commande
   */
  createOrderStatusNotification: (
    userId: string,
    content: string,
  ): NotificationInsert => {
    return {
      user_id: userId,
      type: NotificationType.ORDER_STATUS,
      content,
      conversation_id: null,
      read: false,
    };
  },
  
  /**
   * Crée un objet de mise à jour pour marquer une notification comme lue
   */
  markAsRead: (): NotificationUpdate => {
    return {
      read: true,
    };
  },
  
  /**
   * Crée un objet de mise à jour pour marquer une notification comme traitée par email
   */
  markAsEmailed: (success: boolean): NotificationUpdate => {
    return {
      emailed: success,
      emailed_at: new Date().toISOString(),
    };
  }
}; 