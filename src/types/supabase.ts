import { Profile } from '@/hooks/useUser';

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
  sender?: Profile;
} 