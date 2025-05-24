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
          is_certified: boolean
          certification_type: 'standard' | 'premium' | 'expert' | null
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
          is_certified?: boolean
          certification_type?: 'standard' | 'premium' | 'expert' | null
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
          is_certified?: boolean
          certification_type?: 'standard' | 'premium' | 'expert' | null
        }
      }
      services: {
        Row: {
          id: string
          title: string
          description: string
          price: number
          freelance_id: string
          category_id: string
          created_at: string
          updated_at: string
          status: 'pending' | 'approved' | 'rejected' | 'active'
          rating?: number
          image_url?: string
          moderation_comment?: string
          subcategory_id?: string | null
          images?: string[]
          delivery_time?: number
          slug?: string
          active?: boolean
          admin_notes?: string | null
          validated_at?: string | null
          validated_by?: string | null
          currency_code?: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          price: number
          freelance_id: string
          category_id: string
          created_at?: string
          updated_at?: string
          status?: 'pending' | 'approved' | 'rejected' | 'active'
          rating?: number
          image_url?: string
          moderation_comment?: string
          subcategory_id?: string | null
          images?: string[]
          delivery_time?: number
          slug?: string
          active?: boolean
          admin_notes?: string | null
          validated_at?: string | null
          validated_by?: string | null
          currency_code?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          price?: number
          freelance_id?: string
          category_id?: string
          created_at?: string
          updated_at?: string
          status?: 'pending' | 'approved' | 'rejected' | 'active'
          rating?: number
          image_url?: string
          moderation_comment?: string
          subcategory_id?: string | null
          images?: string[]
          delivery_time?: number
          slug?: string
          active?: boolean
          admin_notes?: string | null
          validated_at?: string | null
          validated_by?: string | null
          currency_code?: string
        }
      }
      service_notifications: {
        Row: {
          id: string
          service_id: string
          created_at: string
          type: string
          content: string | null
        }
        Insert: {
          id?: string
          service_id: string
          created_at?: string
          type: string
          content?: string | null
        }
        Update: {
          id?: string
          service_id?: string
          created_at?: string
          type?: string
          content?: string | null
        }
      }
      service_categories: {
        Row: {
          id: string
          name: string
          description?: string
          icon?: string
        }
        Insert: {
          id?: string
          name: string
          description?: string
          icon?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          icon?: string
        }
      }
      bookings: {
        Row: {
          id: string
          service_id: string
          user_id: string
          created_at: string
          status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
          booking_date: string
        }
        Insert: {
          id?: string
          service_id: string
          user_id: string
          created_at?: string
          status?: 'pending' | 'confirmed' | 'completed' | 'cancelled'
          booking_date: string
        }
        Update: {
          id?: string
          service_id?: string
          user_id?: string
          created_at?: string
          status?: 'pending' | 'confirmed' | 'completed' | 'cancelled'
          booking_date?: string
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
          sender_name?: string | null
          sender_email?: string | null
          subject?: string | null
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
          sender_name?: string | null
          sender_email?: string | null
          subject?: string | null
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
          sender_name?: string | null
          sender_email?: string | null
          subject?: string | null
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
          emailed: boolean | null
          emailed_at: string | null
          metadata: Json | null
          link: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          type: string
          user_id?: string | null
          content?: string | null
          conversation_id?: string | null
          read?: boolean
          emailed?: boolean | null
          emailed_at?: string | null
          metadata?: Json | null
          link?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          type?: string
          user_id?: string | null
          content?: string | null
          conversation_id?: string | null
          read?: boolean
          emailed?: boolean | null
          emailed_at?: string | null
          metadata?: Json | null
          link?: string | null
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
      review_replies: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          review_id: string
          freelance_id: string
          content: string
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          review_id: string
          freelance_id: string
          content: string
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          review_id?: string
          freelance_id?: string
          content?: string
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
      order_cancellations: {
        Row: {
          id: string
          order_id: string
          reason: string
          cancelled_by: string
          cancelled_at: string
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          reason: string
          cancelled_by: string
          cancelled_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          reason?: string
          cancelled_by?: string
          cancelled_at?: string
          created_at?: string
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