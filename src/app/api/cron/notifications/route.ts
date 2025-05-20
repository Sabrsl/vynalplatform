import { NextRequest, NextResponse } from 'next/server';
import { processNotifications } from '@/lib/workers/notificationWorker';

/**
 * API pour le traitement périodique des notifications par cron job
 * Cet endpoint est conçu pour être appelé automatiquement par un service cron
 * Il ne nécessite pas d'authentification, mais utilise une clé API pour sécuriser l'accès
 */
export async function GET(req: NextRequest) {
  try {
    // Vérification de l'API key
    const url = new URL(req.url);
    const key = url.searchParams.get('key');
    const apiKey = process.env.CRON_API_KEY;
    
    if (!apiKey || key !== apiKey) {
      return NextResponse.json(
        { success: false, message: 'Non autorisé' },
        { status: 401 }
      );
    }
    
    // Traiter toutes les notifications en attente
    await processNotifications();
    
    return NextResponse.json({
      success: true,
      message: 'Notifications traitées avec succès',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erreur lors du traitement des notifications:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    );
  }
} 