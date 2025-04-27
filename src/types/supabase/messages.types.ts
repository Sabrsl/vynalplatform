import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

/**
 * Interface pour la table messages
 */
export interface Message {
  /** ID unique du message - UUID généré automatiquement */
  id: string;
  
  /** Date et heure de création du message - Par défaut NOW() */
  created_at: string;
  
  /** ID de la commande associée (optionnel) - Clé étrangère vers orders.id */
  order_id: string | null;
  
  /** ID de l'expéditeur du message - Clé étrangère vers profiles.id */
  sender_id: string;
  
  /** Contenu textuel du message */
  content: string;
  
  /** Statut de lecture du message - Par défaut false */
  read: boolean;
  
  /** ID de la conversation associée (optionnel) - Clé étrangère vers conversations.id */
  conversation_id: string | null;
  
  /** URL de la pièce jointe (optionnel) */
  attachment_url: string | null;
  
  /** Type MIME de la pièce jointe (optionnel) */
  attachment_type: string | null;
  
  /** Nom de la pièce jointe (optionnel) */
  attachment_name: string | null;
  
  /** Indicateur de frappe en cours - Par défaut false */
  is_typing: boolean;
}

/**
 * Type pour les opérations d'insertion (sans les champs générés automatiquement)
 */
export type MessageInsert = Omit<Message, 'id' | 'created_at'> & {
  id?: string;
  created_at?: string;
};

/**
 * Type pour les mises à jour partielles
 */
export type MessageUpdate = Partial<Message>;

/**
 * Schéma Zod pour la validation des données
 */
export const messageSchema = z.object({
  id: z.string().uuid(),
  created_at: z.string().datetime(),
  order_id: z.string().uuid().nullable(),
  sender_id: z.string().uuid(),
  content: z.string(),
  read: z.boolean().default(false),
  conversation_id: z.string().uuid().nullable(),
  attachment_url: z.string().url().nullable(),
  attachment_type: z.string().nullable(),
  attachment_name: z.string().nullable(),
  is_typing: z.boolean().default(false),
}).refine((data) => {
  // Ensure either order_id or conversation_id is present, but not both
  return (data.order_id === null && data.conversation_id !== null) || 
         (data.order_id !== null && data.conversation_id === null);
}, {
  message: "A message must be associated with either a conversation or an order, but not both"
});

/**
 * Schéma pour la validation des insertions
 */
export const messageInsertSchema = z.object({
  id: z.string().uuid().optional(),
  created_at: z.string().datetime().optional(),
  order_id: z.string().uuid().nullable(),
  sender_id: z.string().uuid(),
  content: z.string(),
  read: z.boolean().default(false),
  conversation_id: z.string().uuid().nullable(),
  attachment_url: z.string().url().nullable(),
  attachment_type: z.string().nullable(),
  attachment_name: z.string().nullable(),
  is_typing: z.boolean().default(false),
}).refine((data) => {
  // Ensure either order_id or conversation_id is present, but not both
  return (data.order_id === null && data.conversation_id !== null) || 
         (data.order_id !== null && data.conversation_id === null);
}, {
  message: "A message must be associated with either a conversation or an order, but not both"
});

/**
 * Schéma pour la validation des mises à jour
 */
export const messageUpdateSchema = z.object({
  id: z.string().uuid().optional(),
  created_at: z.string().datetime().optional(),
  order_id: z.string().uuid().nullable().optional(),
  sender_id: z.string().uuid().optional(),
  content: z.string().optional(),
  read: z.boolean().optional(),
  conversation_id: z.string().uuid().nullable().optional(),
  attachment_url: z.string().url().nullable().optional(),
  attachment_type: z.string().nullable().optional(),
  attachment_name: z.string().nullable().optional(),
  is_typing: z.boolean().optional(),
});

/**
 * Fonctions utilitaires pour la table messages
 */
export const Messages = {
  /**
   * Crée un objet d'insertion pour un message de conversation
   */
  createConversationMessage: (data: Omit<MessageInsert, "order_id" | "conversation_id"> & { conversation_id: string }): MessageInsert => {
    return {
      id: data.id || uuidv4(),
      created_at: data.created_at || new Date().toISOString(),
      conversation_id: data.conversation_id,
      order_id: null,
      sender_id: data.sender_id,
      content: data.content,
      read: data.read || false,
      attachment_url: data.attachment_url || null,
      attachment_type: data.attachment_type || null,
      attachment_name: data.attachment_name || null,
      is_typing: data.is_typing || false,
    };
  },
  
  /**
   * Crée un objet d'insertion pour un message de commande
   */
  createOrderMessage: (data: Omit<MessageInsert, "conversation_id" | "order_id"> & { order_id: string }): MessageInsert => {
    return {
      id: data.id || uuidv4(),
      created_at: data.created_at || new Date().toISOString(),
      order_id: data.order_id,
      conversation_id: null,
      sender_id: data.sender_id,
      content: data.content,
      read: data.read || false,
      attachment_url: data.attachment_url || null,
      attachment_type: data.attachment_type || null,
      attachment_name: data.attachment_name || null,
      is_typing: data.is_typing || false,
    };
  },
  
  /**
   * Crée un objet de mise à jour pour marquer un message comme lu
   */
  markAsRead: (message: Message): MessageUpdate => {
    return {
      id: message.id,
      read: true
    };
  },
  
  /**
   * Détermine si un message a une pièce jointe
   */
  hasAttachment: (message: Message): boolean => {
    return !!message.attachment_url;
  },
  
  /**
   * Détermine si la pièce jointe est une image
   */
  isImageAttachment: (message: Message): boolean => {
    return !!message.attachment_type && message.attachment_type.startsWith('image/');
  }
}; 