/**
 * Utilitaires de compression pour réduire la taille des données 
 * des messages et améliorer les performances
 */

import { Message, Conversation } from '@/lib/stores/useMessagingStore';

// Type pour les messages compressés
export type CompressedMessage = {
  id: string;
  conversation_id?: string;
  content: string;
  created_at: string;
  sender_id: string;
  read: boolean;
  sender?: {
    id: string;
    username: string | null;
    full_name: string | null;
    avatar_url: string | null;
  };
  attachment_url?: string | null;
  attachment_type?: string | null;
  attachment_name?: string | null;
};

// Type pour les conversations compressées
export type CompressedConversation = {
  id: string;
  created_at: string;
  updated_at: string | null;
  last_message_id: string | null;
  last_message_time: string | null;
  participants: {
    id: string;
    username: string | null;
    full_name: string | null;
    avatar_url: string | null;
    role?: string | null;
    online?: boolean;
    last_seen?: string | null;
    unread_count: number;
  }[];
  last_message?: {
    content: string;
    created_at: string;
    sender_id: string;
  };
};

/**
 * Compresse les données de messages en supprimant les champs redondants
 * et en ne conservant que les données essentielles
 * 
 * @param messages Liste des messages à compresser
 * @returns Liste de messages compressés
 */
export function compressMessageData(messages: Message[]): CompressedMessage[] {
  if (!messages || !Array.isArray(messages)) return [];
  
  return messages.map(msg => ({
    id: msg.id,
    conversation_id: msg.conversation_id,
    content: msg.content,
    created_at: msg.created_at,
    sender_id: msg.sender_id,
    read: msg.read,
    // Inclure les métadonnées minimales de l'expéditeur s'il existe
    sender: msg.sender ? {
      id: msg.sender.id,
      username: msg.sender.username,
      full_name: msg.sender.full_name,
      avatar_url: msg.sender.avatar_url
    } : undefined,
    // Inclure seulement les métadonnées nécessaires pour les pièces jointes
    attachment_url: msg.attachment_url,
    attachment_type: msg.attachment_type,
    attachment_name: msg.attachment_name,
  }));
}

/**
 * Compresse les données de conversation en supprimant les champs redondants
 * et en ne conservant que les données essentielles
 * 
 * @param conversations Liste des conversations à compresser
 * @returns Liste de conversations compressées
 */
export function compressConversationData(conversations: Conversation[]): CompressedConversation[] {
  if (!conversations || !Array.isArray(conversations)) return [];
  
  return conversations.map(conv => ({
    id: conv.id,
    created_at: conv.created_at,
    updated_at: conv.updated_at,
    last_message_id: conv.last_message_id,
    last_message_time: conv.last_message_time,
    // Ne garder que les données essentielles des participants
    participants: conv.participants.map(p => ({
      id: p.id,
      username: p.username,
      full_name: p.full_name,
      avatar_url: p.avatar_url,
      role: p.role,
      online: p.online,
      last_seen: p.last_seen,
      unread_count: p.unread_count
    })),
    // Inclure le dernier message s'il existe
    last_message: conv.last_message ? {
      content: conv.last_message.content,
      created_at: conv.last_message.created_at,
      sender_id: conv.last_message.sender_id
    } : undefined
  }));
}

/**
 * Détermine si une liste de messages est trop volumineuse et 
 * devrait être compressée avant mise en cache
 * 
 * @param messages Liste de messages à analyser
 * @param threshold Seuil en nombre de messages (défaut: 50)
 * @returns true si la liste dépasse le seuil
 */
export function shouldCompressMessages(messages: Message[], threshold = 50): boolean {
  return messages && Array.isArray(messages) && messages.length > threshold;
}

/**
 * Calculer la taille approximative d'un objet JavaScript en mémoire
 * Utile pour estimer l'empreinte mémoire et décider quand comprimer
 * 
 * @param object Objet dont on veut estimer la taille
 * @returns Taille approximative en octets
 */
export function estimateObjectSize(object: any): number {
  const objectString = JSON.stringify(object);
  return objectString ? objectString.length * 2 : 0; // Approximation (2 octets par caractère)
} 