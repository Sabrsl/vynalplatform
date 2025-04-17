import { NextRequest, NextResponse } from 'next/server';
import { validateMessage } from '@/lib/message-validation';
import { getSupabaseServer } from '@/lib/supabase/server';
import { z } from 'zod';

// Schéma de validation pour le message
const messageSchema = z.object({
  content: z.string().min(1).max(5000),
  recipientId: z.string().uuid(),
  conversationId: z.string().uuid().optional(),
});

interface ConversationParticipant {
  conversation_id: string;
  participant_id: string;
  unread_count?: number;
}

export async function POST(request: NextRequest) {
  try {
    // Créer l'instance Supabase
    const supabase = getSupabaseServer();
    
    // Récupérer la session utilisateur
    const { data: { session } } = await supabase.auth.getSession();
    
    // Vérifier que l'utilisateur est authentifié
    if (!session) {
      return NextResponse.json(
        { error: 'Vous devez être connecté pour envoyer un message' },
        { status: 401 }
      );
    }
    
    const senderId = session.user.id;
    
    // Récupérer les données de la requête
    const body = await request.json();
    
    // Valider les données avec Zod
    const validationResult = messageSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Données de message invalides', details: validationResult.error.format() },
        { status: 400 }
      );
    }
    
    const { content, recipientId, conversationId } = validationResult.data;
    
    // Valider le contenu du message (vérifier les mots interdits)
    const messageValidationResult = validateMessage(content, {
      maxLength: 5000,
      minLength: 1,
      // En production, vous voulez probablement bloquer plutôt que censurer
      censorInsteadOfBlock: false,
    });
    
    // Si le message contient des mots interdits, le rejeter
    if (!messageValidationResult.isValid) {
      return NextResponse.json(
        { 
          error: 'Message invalide', 
          details: messageValidationResult.errors,
          forbiddenWords: messageValidationResult.forbiddenWords 
        },
        { status: 400 }
      );
    }
    
    // Création ou récupération de la conversation
    let actualConversationId = conversationId;
    
    if (!actualConversationId) {
      // Vérifier si une conversation existe déjà entre ces utilisateurs
      const { data: existingParticipants } = await supabase
        .from('conversation_participants')
        .select('conversation_id, participant_id')
        .in('participant_id', [senderId, recipientId]);
      
      if (existingParticipants && existingParticipants.length >= 2) {
        // Regrouper par conversation_id pour trouver les conversations qui ont les deux participants
        const conversationMap = new Map<string, string[]>();
        
        existingParticipants.forEach((participant: ConversationParticipant) => {
          if (!conversationMap.has(participant.conversation_id)) {
            conversationMap.set(participant.conversation_id, []);
          }
          const participants = conversationMap.get(participant.conversation_id);
          if (participants) {
            participants.push(participant.participant_id);
          }
        });
        
        // Trouver une conversation qui contient les deux utilisateurs
        // Utiliser Array.from pour éviter les problèmes de compatibilité avec ES5
        for (const [convId, participants] of Array.from(conversationMap.entries())) {
          if (participants.includes(senderId) && participants.includes(recipientId)) {
            actualConversationId = convId;
            break;
          }
        }
      }
      
      // Si aucune conversation existante n'a été trouvée, créer une nouvelle
      if (!actualConversationId) {
        // Créer une nouvelle conversation
        const { data: newConversation, error: conversationError } = await supabase
          .from('conversations')
          .insert({})
          .select('id')
          .single();
        
        if (conversationError) {
          return NextResponse.json(
            { error: 'Impossible de créer la conversation', details: conversationError.message },
            { status: 500 }
          );
        }
        
        actualConversationId = newConversation.id;
        
        // Ajouter les participants à la conversation
        const participantsToInsert = [
          { conversation_id: actualConversationId, participant_id: senderId },
          { conversation_id: actualConversationId, participant_id: recipientId }
        ];
        
        const { error: participantsError } = await supabase
          .from('conversation_participants')
          .insert(participantsToInsert);
        
        if (participantsError) {
          return NextResponse.json(
            { error: 'Impossible d\'ajouter les participants à la conversation', details: participantsError.message },
            { status: 500 }
          );
        }
      }
    }
    
    // Insérer le message dans la base de données
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .insert({
        sender_id: senderId,
        recipient_id: recipientId,
        conversation_id: actualConversationId,
        content: messageValidationResult.message, // Utiliser le message potentiellement censuré
      })
      .select('*')
      .single();
    
    if (messageError) {
      return NextResponse.json(
        { error: 'Impossible d\'envoyer le message', details: messageError.message },
        { status: 500 }
      );
    }
    
    // Mettre à jour la dernière activité de la conversation
    await supabase
      .from('conversations')
      .update({ 
        updated_at: new Date().toISOString(),
        last_message_id: message.id,
        last_message_time: new Date().toISOString()
      })
      .eq('id', actualConversationId);
    
    // Mise à jour du compteur de messages non lus pour le destinataire
    try {
      // D'abord récupérer l'entrée actuelle du participant
      const { data: participantData } = await supabase
        .from('conversation_participants')
        .select('unread_count')
        .eq('conversation_id', actualConversationId)
        .eq('participant_id', recipientId)
        .single();
      
      // Incrémenter le compteur
      const newUnreadCount = (participantData?.unread_count || 0) + 1;
      
      // Mettre à jour avec la nouvelle valeur
      await supabase
        .from('conversation_participants')
        .update({ unread_count: newUnreadCount })
        .eq('conversation_id', actualConversationId)
        .eq('participant_id', recipientId);
        
    } catch (error) {
      console.error('Erreur lors de la mise à jour du compteur de messages non lus:', error);
      // Ne pas bloquer l'envoi du message si cette partie échoue
    }
    
    return NextResponse.json({ 
      message,
      censored: messageValidationResult.censored
    }, { status: 201 });
    
  } catch (error) {
    console.error('Erreur lors de l\'envoi du message:', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de l\'envoi du message' },
      { status: 500 }
    );
  }
} 