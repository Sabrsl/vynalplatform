/**
 * Script de correction des problèmes de visibilité des conversations pour les freelances - Version inline
 * 
 * Version simplifiée qui n'utilise pas de variables d'environnement mais récupère
 * les informations de configuration directement depuis le code du projet.
 */

import { createClient } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';

// Utiliser le client Supabase déjà configuré dans l'application
console.log('Début de la correction des problèmes de visibilité des conversations...');

async function logConversationStats() {
  try {
    // Ne pas faire de corrections, juste un diagnostic des problèmes
    // 1. Récupérer les informations sur les conversations
    console.log('Récupération des conversations...');
    const { data: conversations, error: conversationsError } = await supabase
      .from('conversations')
      .select('id, created_at')
      .limit(10);  // Limiter pour tester
      
    if (conversationsError) {
      throw new Error(`Erreur lors de la récupération des conversations: ${conversationsError.message}`);
    }
    
    console.log(`${conversations?.length || 0} conversations trouvées.`);
    console.log(conversations);
    
    // 2. Récupérer les freelances
    console.log('Récupération des freelances...');
    const { data: freelances, error: freelancesError } = await supabase
      .from('profiles')
      .select('id, username, full_name, role')
      .eq('role', 'freelance')
      .limit(10);  // Limiter pour tester
      
    if (freelancesError) {
      throw new Error(`Erreur lors de la récupération des freelances: ${freelancesError.message}`);
    }
    
    console.log(`${freelances?.length || 0} freelances trouvés.`);
    
    // 3. Vérifier juste quelques participants pour voir si nous pouvons lire les données
    if (conversations && conversations.length > 0) {
      const firstConversationId = conversations[0].id;
      console.log(`Vérification des participants pour la conversation ${firstConversationId}...`);
      
      const { data: participants, error: participantsError } = await supabase
        .from('conversation_participants')
        .select('participant_id, conversation_id')
        .eq('conversation_id', firstConversationId);
        
      if (participantsError) {
        throw new Error(`Erreur lors de la récupération des participants: ${participantsError.message}`);
      }
      
      console.log(`${participants?.length || 0} participants trouvés pour cette conversation.`);
      console.log(participants);
      
      // 4. Vérifier les messages de cette conversation
      const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .select('id, sender_id, content, created_at')
        .eq('conversation_id', firstConversationId)
        .limit(5);
        
      if (messagesError) {
        throw new Error(`Erreur lors de la récupération des messages: ${messagesError.message}`);
      }
      
      console.log(`${messages?.length || 0} messages trouvés pour cette conversation.`);
      console.log(messages);
    }
    
  } catch (error) {
    console.error('Erreur lors de l\'exécution du script:', error);
  }
}

// Exécution du script
logConversationStats()
  .then(() => {
    console.log('Analyse terminée avec succès.');
  })
  .catch(error => {
    console.error('Erreur lors de l\'analyse:', error);
  }); 