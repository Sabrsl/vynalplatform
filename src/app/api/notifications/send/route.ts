import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { processNotification } from '@/lib/workers/notificationWorker';
import { notificationSchema } from '@/types/supabase/notifications.types';

/**
 * API pour envoyer une notification directement par email
 * Cette API est utilisée pour les envois ponctuels d'emails
 * 
 * @param req Requête entrante contenant les détails de la notification
 */
export async function POST(req: NextRequest) {
  try {
    // Vérifier l'authentification
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Non autorisé' },
        { status: 401 }
      );
    }
    
    // Vérifier les autorisations (admin ou système)
    const { data: userData } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();
      
    if (!userData || userData.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Permission refusée' },
        { status: 403 }
      );
    }
    
    // Parser le corps de la requête
    const body = await req.json();
    const { userId, type, content, conversationId } = body;
    
    if (!userId || !type) {
      return NextResponse.json(
        { success: false, message: 'Paramètres manquants: userId et type sont requis' },
        { status: 400 }
      );
    }
    
    // Créer une notification dans la base de données
    const { data: notification, error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type,
        content: content || null,
        conversation_id: conversationId || null,
        read: false
      })
      .select()
      .single();
      
    if (error) {
      console.error('Erreur lors de la création de la notification:', error);
      return NextResponse.json(
        { success: false, message: 'Erreur lors de la création de la notification' },
        { status: 500 }
      );
    }
    
    // Traiter la notification (envoyer l'email)
    if (notification) {
      await processNotification(notification);
      
      return NextResponse.json({
        success: true,
        message: 'Notification créée et email envoyé avec succès',
        notification
      });
    } else {
      return NextResponse.json(
        { success: false, message: 'Erreur lors de la création de la notification' },
        { status: 500 }
      );
    }
    
  } catch (error) {
    console.error('Erreur lors de l\'envoi de la notification par email:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    );
  }
} 