import { NextRequest, NextResponse } from 'next/server';
import { processNotification } from '@/lib/workers/notificationWorker';
import { supabase } from '@/lib/supabase/client';

/**
 * API pour le traitement immédiat d'une notification spécifique
 * Cet endpoint traite une notification dès qu'elle est créée sans nécessiter
 * l'intervention du worker périodique
 */
export async function POST(req: NextRequest) {
  try {
    // Récupérer l'ID de la notification à traiter
    const { notificationId } = await req.json();

    // Vérifier si l'ID est fourni
    if (!notificationId) {
      return NextResponse.json(
        { success: false, message: 'ID de notification requis' },
        { status: 400 }
      );
    }

    // Récupérer la notification
    const { data: notification, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('id', notificationId)
      .single();

    if (error || !notification) {
      console.error('Erreur lors de la récupération de la notification:', error);
      return NextResponse.json(
        { success: false, message: 'Notification introuvable' },
        { status: 404 }
      );
    }

    // Traiter la notification
    await processNotification(notification);

    return NextResponse.json({
      success: true,
      message: 'Notification traitée avec succès'
    });
  } catch (error) {
    console.error('Erreur lors du traitement de la notification:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    );
  }
} 