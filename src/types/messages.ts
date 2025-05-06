import { UserProfile } from '@/hooks/useUser';

// Type de base pour tous les messages
export interface BaseMessage {
  id: string;
  created_at: string;
  sender_id: string;
  content: string;
  read: boolean;
  attachment_url?: string | null;
  attachment_type?: string | null;
  attachment_name?: string | null;
  is_typing: boolean;
}

// Message de conversation directe
export interface DirectMessage extends BaseMessage {
  conversation_id: string;
  order_id: null;
  sender?: UserProfile;
}

// Message lié à une commande
export interface OrderMessage extends BaseMessage {
  conversation_id: null;
  order_id: string;
  sender: {
    id: string;
    username: string;
    full_name?: string;
    avatar_url?: string;
  };
}

// Type union pour tous les types de messages
export type Message = DirectMessage | OrderMessage;

// Type pour un message partiel (utilisé lors de la création)
export interface PartialMessage {
  id?: string;
  created_at?: string;
  sender_id?: string;
  content?: string;
  read?: boolean;
  attachment_url?: string | null;
  attachment_type?: string | null;
  attachment_name?: string | null;
  is_typing?: boolean;
  conversation_id?: string | null;
  order_id?: string | null;
}

// Type pour les messages compressés (optimisation)
export interface CompressedMessage {
  id: string;
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
} 