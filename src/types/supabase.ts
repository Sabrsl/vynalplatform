import { UserProfile } from '@/hooks/useUser';

export interface Message {
  id: string;
  created_at: string;
  sender_id: string;
  content: string;
  order_id?: string | null;
  conversation_id?: string | null;
  attachment_url?: string | null;
  attachment_type?: string | null;
  attachment_name?: string | null;
  is_typing?: boolean;
  read: boolean;
  sender_name?: string | null;
  sender_email?: string | null;
  subject?: string | null;
  sender?: UserProfile;
} 