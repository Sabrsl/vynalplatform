import { Database } from './database';

export type Service = Database['public']['Tables']['services']['Row'];

export interface ActiveService extends Service {
  bookings_count: number;
  last_booked_at: string | null;
}

export interface ServiceCategory {
  id: string;
  name: string;
  description?: string;
  icon?: string;
}

export interface ServiceFilter {
  category_id?: string;
  min_price?: number;
  max_price?: number;
  rating?: number;
  sort_by?: 'price' | 'rating' | 'newest';
  sort_order?: 'asc' | 'desc';
} 