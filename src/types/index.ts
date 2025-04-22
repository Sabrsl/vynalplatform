// Types pour l'application Vynal Platform

// Type pour le profil utilisateur
export interface UserProfile {
  id: string;
  role: 'client' | 'freelance' | 'admin';
  email: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string | null;
  updated_at: string | null;
}

// Types pour l'utilisateur Supabase
export type UserType = any; // À remplacer par le type approprié de Supabase Auth 