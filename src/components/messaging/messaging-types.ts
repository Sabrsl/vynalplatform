/**
 * Types communs pour les interfaces de messagerie
 */

import { Message } from '@/types/messages';

// Interface de base pour les interfaces de messagerie 
export interface BaseMessagingProps {
  isFreelance: boolean;
  className?: string;
}

// Interface pour la messagerie directe
export interface DirectMessagingProps extends BaseMessagingProps {
  initialConversationId?: string;
  receiverId?: string;
}

// Interface pour la messagerie de commandes
export interface OrderMessagingProps extends BaseMessagingProps {
  orderId: string;
}

// Interface principale qui combine les deux
export interface MessagingInterfaceProps extends BaseMessagingProps {
  initialConversationId?: string;
  receiverId?: string;
  orderId?: string;
}

// Types basés sur la structure de la base de données

export interface Profile {
  id: string;
  created_at: string;
  updated_at: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  role: 'client' | 'freelance' | 'admin';
  email: string | null;
  last_seen: string | null;
  verification_level: number | null;
  verified_at: string | null;
  phone: string | null;
  is_admin: boolean | null;
  is_suspended: boolean | null;
  is_active: boolean | null;
  is_certified: boolean | null;
  certified_at: string | null;
  certification_type: 'standard' | 'premium' | 'expert' | null;
}

export interface Conversation {
  id: string;
  created_at: string;
  updated_at: string;
  last_message_id: string | null;
  last_message_time: string | null;
  status: 'active' | 'closed' | 'archived' | null;
  participants: Array<{
    id: string;
    full_name?: string | null;
    username?: string | null;
    avatar_url?: string | null;
    unread_count?: number;
    last_seen?: string | null;
  }>;
  last_message?: {
    id?: string;
    content?: string;
    created_at?: string;
    sender_id?: string;
  };
}

export interface ConversationParticipant {
  id: string;
  created_at: string;
  conversation_id: string;
  participant_id: string;
  unread_count: number;
  last_read_message_id: string | null;
}

export interface Order {
  id: string;
  created_at: string;
  updated_at: string;
  client_id: string;
  freelance_id: string;
  service_id: string;
  status: 'pending' | 'in_progress' | 'completed' | 'delivered' | 'revision_requested' | 'cancelled';
  price: number;
  delivery_time: number;
  requirements: string | null;
  completed_at: string | null;
  delivery: any | null;
}

export interface OrderDetails {
  id: string;
  created_at: string;
  updated_at: string;
  status: string;
  price: number;
  delivery_time: number;
  requirements?: string;
  completed_at?: string;
  service: {
    id: string;
    title: string;
    price: number;
    delivery_time: number;
    description: string;
  };
  freelance: {
    id: string;
    username: string;
    full_name?: string;
    avatar_url?: string;
  };
  client: {
    id: string;
    username: string;
    full_name?: string;
    avatar_url?: string;
  };
} 