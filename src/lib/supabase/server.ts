import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/types/database';

// Type pour les options de création du client Supabase
interface SupabaseOptions {
  noCache?: string; // Un identifiant unique pour éviter le cache (généralement un timestamp)
}

// Client Supabase pour les composants serveur et les API routes
export function getSupabaseServer(options?: SupabaseOptions) {
  try {
    const cookieStore = cookies();
    
    // Créer un client avec les options standards
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '', 
      {
        cookies: {
          get(name) {
            return cookieStore.get(name)?.value;
          },
          set(name, value, options) {
            cookieStore.set(name, value);
          },
          remove(name, options) {
            cookieStore.delete(name);
          }
        }
      }
    );
    
    // Si l'option noCache est fournie, on peut uniquement la logguer
    if (options?.noCache) {
      console.log(`Utilisation d'un client Supabase avec contournement du cache: ${options.noCache}`);
    }
    
    return supabase;
  } catch (error) {
    console.error('Erreur lors de la création du client Supabase:', error);
    throw error;
  }
}

// Récupérer l'utilisateur connecté côté serveur
export async function getServerSession() {
  try {
    const supabase = getSupabaseServer();
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  } catch (error) {
    console.error('Erreur lors de la récupération de la session:', error);
    return null;
  }
}

// Récupérer les données de l'utilisateur connecté
export async function getServerUser() {
  try {
    const session = await getServerSession();
    if (!session) return null;
    
    const supabase = getSupabaseServer();
    const { data: user } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();
    
    return user;
  } catch (error) {
    console.error('Erreur lors de la récupération des données utilisateur:', error);
    return null;
  }
} 