/**
 * Script de correction des problèmes de visibilité des conversations pour les freelances
 * 
 * Ce script vérifie toutes les conversations existantes et s'assure que les freelances
 * sont correctement associés et peuvent voir les messages envoyés par les clients.
 */

import { createClient } from '@supabase/supabase-js';

// Récupération des variables d'environnement pour Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Vérifie que les variables d'environnement sont définies
if (!supabaseUrl || !supabaseServiceRole) {
  console.error('Variables d\'environnement manquantes. NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont requises.');
  process.exit(1);
}

// Crée un client Supabase avec le rôle de service pour accéder à toutes les données
const supabase = createClient(supabaseUrl, supabaseServiceRole, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function fixConversationVisibility() {
  console.log('Début de la correction des problèmes de visibilité des conversations...');
  
  try {
    // 1. Récupérer tous les freelances
    console.log('Récupération des freelances...');
    const { data: freelances, error: freelancesError } = await supabase
      .from('profiles')
      .select('id, username, full_name')
      .eq('role', 'freelance');
      
    if (freelancesError) {
      throw new Error(`Erreur lors de la récupération des freelances: ${freelancesError.message}`);
    }
    
    console.log(`${freelances.length} freelances trouvés.`);

    // 2. Récupérer toutes les conversations
    console.log('Récupération des conversations...');
    const { data: conversations, error: conversationsError } = await supabase
      .from('conversations')
      .select('id, created_at');
      
    if (conversationsError) {
      throw new Error(`Erreur lors de la récupération des conversations: ${conversationsError.message}`);
    }
    
    console.log(`${conversations.length} conversations trouvées.`);
    
    // 3. Pour chaque conversation, vérifier les participants et les messages
    let fixedConversations = 0;
    
    for (const conversation of conversations) {
      // Récupérer les participants actuels
      const { data: participants, error: participantsError } = await supabase
        .from('conversation_participants')
        .select('participant_id')
        .eq('conversation_id', conversation.id);
        
      if (participantsError) {
        console.error(`Erreur lors de la récupération des participants pour la conversation ${conversation.id}: ${participantsError.message}`);
        continue;
      }
      
      // Récupérer les messages pour identifier les expéditeurs et destinataires
      const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .select('sender_id, recipient_id')
        .eq('conversation_id', conversation.id);
        
      if (messagesError) {
        console.error(`Erreur lors de la récupération des messages pour la conversation ${conversation.id}: ${messagesError.message}`);
        continue;
      }
      
      if (messages.length === 0) {
        console.log(`Conversation ${conversation.id} sans messages, ignorée.`);
        continue;
      }
      
      // Identifier tous les IDs uniques impliqués dans la conversation
      const allUserIds = new Set<string>();
      
      messages.forEach(msg => {
        if (msg.sender_id) allUserIds.add(msg.sender_id);
        if (msg.recipient_id) allUserIds.add(msg.recipient_id);
      });
      
      participants.forEach(p => {
        if (p.participant_id) allUserIds.add(p.participant_id);
      });
      
      // Rechercher si un freelance est impliqué
      const involvedFreelances = freelances.filter(f => allUserIds.has(f.id));
      
      if (involvedFreelances.length > 0) {
        // Si un freelance est impliqué, vérifier s'il est bien listé comme participant
        for (const freelance of involvedFreelances) {
          const isParticipant = participants.some(p => p.participant_id === freelance.id);
          
          if (!isParticipant) {
            console.log(`Correction: Ajout du freelance ${freelance.username || freelance.id} à la conversation ${conversation.id}`);
            
            // Ajouter le freelance comme participant
            const { error: insertError } = await supabase
              .from('conversation_participants')
              .insert({
                conversation_id: conversation.id,
                participant_id: freelance.id,
                unread_count: 0
              });
              
            if (insertError) {
              console.error(`Erreur lors de l'ajout du freelance à la conversation: ${insertError.message}`);
            } else {
              fixedConversations++;
            }
          }
        }
      }
    }
    
    console.log(`Correction terminée. ${fixedConversations} conversations corrigées.`);
    
  } catch (error) {
    console.error('Erreur lors de l\'exécution du script:', error);
  }
}

// Exécution du script
fixConversationVisibility()
  .then(() => {
    console.log('Script terminé avec succès.');
    process.exit(0);
  })
  .catch(error => {
    console.error('Erreur lors de l\'exécution du script:', error);
    process.exit(1);
  }); 