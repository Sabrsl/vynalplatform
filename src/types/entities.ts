/**
 * Types pour les entités principales de l'application
 * Ces types sont utilisés pour la page des services et autres fonctionnalités
 */

// Type pour une catégorie
export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  created_at?: string;
}

// Type pour une sous-catégorie
export interface Subcategory {
  id: string;
  name: string;
  slug: string;
  category_id: string;
  description?: string;
  created_at?: string;
}

// Type pour un profil utilisateur (version simplifiée)
export interface Profile {
  id: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  bio?: string;
}

// Type pour un service
export interface Service {
  id: string;
  title: string;
  description: string;
  price: number;
  category_id: string;
  subcategory_id: string;
  user_id: string;
  status: 'active' | 'inactive' | 'pending' | 'rejected';
  is_verified: boolean;
  created_at: string;
  updated_at?: string;
  delivery_time?: number;
  revision_count?: number;
  // Relations
  profiles?: Profile;
  categories?: Category;
  subcategories?: Subcategory;
} 