import { OrderMessage } from './messages';

export type OrderStatus = "pending" | "in_progress" | "completed" | "delivered" | "revision_requested" | "cancelled" | "in_dispute";

export interface OrderFile {
  id: string;
  name: string;
  size: number;
  url: string;
  uploaded_at: string;
  uploader_id: string;
}

export interface OrderDelivery {
  message: string;
  delivered_at: string;
  files: any[];
}

export interface Profile {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string;
}

export interface Service {
  id: string;
  title: string;
  price: number;
  delivery_time: number;
  description: string;
  category: string;
}

export interface Order {
  id: string;
  created_at: string;
  updated_at: string;
  status: OrderStatus;
  price: number;
  delivery_time: number;
  requirements: string | null;
  completed_at: string | null;
  service: Service;
  freelance: Profile;
  client: Profile;
  // Champs optionnels/additionnels
  messages?: OrderMessage[];
  files?: OrderFile[];
  delivery?: OrderDelivery;
  payment_status?: string;
  delivery_date?: string; // Champ calculé basé sur delivery_time
  dispute_id?: string;    // Pour compatibilité avec l'existant
} 