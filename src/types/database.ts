// Ce fichier contient les types générés par Supabase
// pour la base de données du projet Vynal Platform

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          username: string | null
          full_name: string | null
          avatar_url: string | null
          bio: string | null
          role: 'client' | 'freelance' | 'admin'
          email: string | null
        }
        Insert: {
          id: string
          created_at?: string
          updated_at?: string
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          role?: 'client' | 'freelance' | 'admin'
          email?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          role?: 'client' | 'freelance' | 'admin'
          email?: string | null
        }
      }
      services: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          title: string
          slug: string
          description: string
          price: number
          delivery_time: number
          category_id: string
          subcategory_id: string | null
          freelance_id: string
          active: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          title: string
          slug: string
          description: string
          price: number
          delivery_time: number
          category_id: string
          subcategory_id?: string | null
          freelance_id: string
          active?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          title?: string
          slug?: string
          description?: string
          price?: number
          delivery_time?: number
          category_id?: string
          subcategory_id?: string | null
          freelance_id?: string
          active?: boolean
        }
      }
      categories: {
        Row: {
          id: string
          created_at: string
          name: string
          slug: string
        }
        Insert: {
          id?: string
          created_at?: string
          name: string
          slug: string
        }
        Update: {
          id?: string
          created_at?: string
          name?: string
          slug?: string
        }
      }
      subcategories: {
        Row: {
          id: string
          created_at: string
          name: string
          slug: string
          category_id: string
        }
        Insert: {
          id?: string
          created_at?: string
          name: string
          slug: string
          category_id: string
        }
        Update: {
          id?: string
          created_at?: string
          name?: string
          slug?: string
          category_id?: string
        }
      }
      orders: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          client_id: string
          freelance_id: string
          service_id: string
          status: 'pending' | 'in_progress' | 'completed' | 'delivered' | 'revision_requested' | 'cancelled'
          price: number
          delivery_time: number
          requirements: string | null
          completed_at: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          client_id: string
          freelance_id: string
          service_id: string
          status?: 'pending' | 'in_progress' | 'completed' | 'delivered' | 'revision_requested' | 'cancelled'
          price: number
          delivery_time: number
          requirements?: string | null
          completed_at?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          client_id?: string
          freelance_id?: string
          service_id?: string
          status?: 'pending' | 'in_progress' | 'completed' | 'delivered' | 'revision_requested' | 'cancelled'
          price?: number
          delivery_time?: number
          requirements?: string | null
          completed_at?: string | null
        }
      }
      payments: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          order_id: string
          client_id: string
          freelance_id: string
          amount: number
          status: 'pending' | 'paid' | 'refunded'
          payment_method: string
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          order_id: string
          client_id: string
          freelance_id: string
          amount: number
          status?: 'pending' | 'paid' | 'refunded'
          payment_method: string
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          order_id?: string
          client_id?: string
          freelance_id?: string
          amount?: number
          status?: 'pending' | 'paid' | 'refunded'
          payment_method?: string
        }
      }
      messages: {
        Row: {
          id: string
          created_at: string
          conversation_id: string
          sender_id: string
          content: string
          read: boolean
          attachment_url: string | null
          attachment_type: string | null
          attachment_name: string | null
          is_typing: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          conversation_id: string
          sender_id: string
          content: string
          read?: boolean
          attachment_url?: string | null
          attachment_type?: string | null
          attachment_name?: string | null
          is_typing?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          conversation_id?: string
          sender_id?: string
          content?: string
          read?: boolean
          attachment_url?: string | null
          attachment_type?: string | null
          attachment_name?: string | null
          is_typing?: boolean
        }
      }
      conversations: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          last_message_id: string | null
          last_message_time: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          last_message_id?: string | null
          last_message_time?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          last_message_id?: string | null
          last_message_time?: string | null
        }
      }
      notifications: {
        Row: {
          id: string
          created_at: string
          type: string
          user_id: string | null
          content: string | null
          conversation_id: string | null
          read: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          type: string
          user_id?: string | null
          content?: string | null
          conversation_id?: string | null
          read?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          type?: string
          user_id?: string | null
          content?: string | null
          conversation_id?: string | null
          read?: boolean
        }
      }
      conversation_participants: {
        Row: {
          id: string
          created_at: string
          conversation_id: string
          participant_id: string
          unread_count: number
          last_read_message_id: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          conversation_id: string
          participant_id: string
          unread_count?: number
          last_read_message_id?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          conversation_id?: string
          participant_id?: string
          unread_count?: number
          last_read_message_id?: string | null
        }
      }
      reviews: {
        Row: {
          id: string
          created_at: string
          order_id: string
          client_id: string
          freelance_id: string
          service_id: string
          rating: number
          comment: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          order_id: string
          client_id: string
          freelance_id: string
          service_id: string
          rating: number
          comment?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          order_id?: string
          client_id?: string
          freelance_id?: string
          service_id?: string
          rating?: number
          comment?: string | null
        }
      }
      favorites: {
        Row: {
          id: string
          created_at: string
          client_id: string
          service_id: string
        }
        Insert: {
          id?: string
          created_at?: string
          client_id: string
          service_id: string
        }
        Update: {
          id?: string
          created_at?: string
          client_id?: string
          service_id?: string
        }
      }
      wallets: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          user_id: string
          balance: number
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id: string
          balance?: number
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id?: string
          balance?: number
        }
      }
      transactions: {
        Row: {
          id: string
          created_at: string
          wallet_id: string
          amount: number
          type: 'deposit' | 'withdrawal' | 'payment' | 'earning'
          description: string
          reference_id: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          wallet_id: string
          amount: number
          type: 'deposit' | 'withdrawal' | 'payment' | 'earning'
          description: string
          reference_id?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          wallet_id?: string
          amount?: number
          type?: 'deposit' | 'withdrawal' | 'payment' | 'earning'
          description?: string
          reference_id?: string | null
        }
      }
      disputes: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          order_id: string
          client_id: string
          freelance_id: string
          status: 'open' | 'resolved' | 'closed'
          reason: string
          resolution: string | null
          resolved_by: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          order_id: string
          client_id: string
          freelance_id: string
          status?: 'open' | 'resolved' | 'closed'
          reason: string
          resolution?: string | null
          resolved_by?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          order_id?: string
          client_id?: string
          freelance_id?: string
          status?: 'open' | 'resolved' | 'closed'
          reason?: string
          resolution?: string | null
          resolved_by?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
} 