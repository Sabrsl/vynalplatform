import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { Database } from '@/types/database';

// Client Supabase pour les composants serveur et les API routes
export function getSupabaseServer() {
  return createServerComponentClient<Database>({ cookies });
}

// Récupérer l'utilisateur connecté côté serveur
export async function getServerSession() {
  const supabase = getSupabaseServer();
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

// Récupérer les données de l'utilisateur connecté
export async function getServerUser() {
  const session = await getServerSession();
  if (!session) return null;
  
  const supabase = getSupabaseServer();
  const { data: user } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();
  
  return user;
} 