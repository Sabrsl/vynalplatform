import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/database';

// Ce client est utilisé côté client (browser)
export function createClient() {
  try {
    const client = createClientComponentClient({});
    
    if (!client) {
      throw new Error('Erreur d\'initialisation du client Supabase');
    }
    
    return client;
  } catch (error) {
    // Dernier recours: tenter de créer un nouveau client
    return createClientComponentClient({});
  }
}

// Helper pour faciliter l'utilisation
export const supabase = createClient();

// Test de connexion à la base de données
export async function testConnection() {
  try {
    const { data, error } = await supabase
      .from('services')
      .select('count')
      .limit(1);
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    return { success: true, data };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erreur inconnue' 
    };
  }
} 