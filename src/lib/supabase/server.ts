import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { Database } from '@/types/database';

// Type pour les options de création du client Supabase
interface SupabaseOptions {
  noCache?: string; // Un identifiant unique pour éviter le cache (généralement un timestamp)
}

// Client Supabase pour les composants serveur et les API routes
export function getSupabaseServer(options?: SupabaseOptions) {
  const cookieStore = cookies();
  
  // Créer un client avec les options standards
  const supabase = createServerComponentClient<Database>({ cookies: () => cookieStore });
  
  // Si l'option noCache est fournie, on peut uniquement la logguer
  if (options?.noCache) {
    console.log(`Utilisation d'un client Supabase avec contournement du cache: ${options.noCache}`);
    // Note: Nous ne pouvons pas modifier facilement le client pour ajouter un paramètre de requête
    // Le problème sera résolu côté client où le paramètre _timestamp_bypass est utilisé
  }
  
  return supabase;
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