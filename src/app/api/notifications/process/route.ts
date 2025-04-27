import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { processNotifications } from '@/lib/workers/notificationWorker';

/**
 * API pour le traitement des notifications
 * Déclenche le worker de notifications qui envoie des emails
 * Cette route est protégée et nécessite une authentification
 * 
 * @param req Requête entrante
 */
export async function POST(req: NextRequest) {
  try {
    // Vérifier l'authentification
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();
    
    // Si pas de session, rejeter la requête
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Non autorisé' },
        { status: 401 }
      );
    }
    
    // Vérifier si l'utilisateur a les droits (admin uniquement)
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
    
    // Déclencher le traitement des notifications
    await processNotifications();
    
    return NextResponse.json({
      success: true,
      message: 'Traitement des notifications déclenché avec succès'
    });
  } catch (error) {
    console.error('Erreur lors du traitement des notifications:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur lors du traitement des notifications' },
      { status: 500 }
    );
  }
}

/**
 * API pour vérifier l'état du service de notifications
 */
export async function GET() {
  try {
    // Vérifier l'authentification (admin uniquement)
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Non autorisé' },
        { status: 401 }
      );
    }
    
    // Vérifier si l'utilisateur est admin
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
    
    // Obtenir des statistiques sur les notifications
    const { data: notificationStats, error } = await supabase
      .from('notifications')
      .select('emailed', { count: 'exact' })
      .is('emailed', null);
      
    const pendingNotifications = notificationStats ? notificationStats.length : 0;
    
    return NextResponse.json({
      success: true,
      status: 'OK',
      pendingNotifications,
      lastChecked: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erreur lors de la vérification du service de notifications:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    );
  }
} 