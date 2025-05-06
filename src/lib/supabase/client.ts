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

// Gestionnaire amélioré pour les canaux de souscription
export const channelManager = {
  activeChannels: new Map<string, any>(),
  
  registerChannel(channelName: string, channel: any) {
    this.activeChannels.set(channelName, channel);
    console.log(`Canal enregistré: ${channelName}`);
    return channel;
  },
  
  removeChannel(channelName: string) {
    if (this.activeChannels.has(channelName)) {
      const channel = this.activeChannels.get(channelName);
      this.activeChannels.delete(channelName);
      console.log(`Canal supprimé: ${channelName}`);
      return supabase.removeChannel(channel);
    }
    return false;
  },
  
  removeAllChannels() {
    console.log(`Nettoyage de ${this.activeChannels.size} canaux actifs`);
    for (const [name, channel] of this.activeChannels.entries()) {
      try {
        supabase.removeChannel(channel);
        console.log(`Canal supprimé: ${name}`);
      } catch (error) {
        console.error(`Erreur lors de la suppression du canal ${name}:`, error);
      }
    }
    this.activeChannels.clear();
  }
};

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