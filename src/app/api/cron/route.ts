import { NextRequest, NextResponse } from 'next/server';
import { processNotifications } from '@/lib/workers/notificationWorker';

// Marquer cette route comme dynamique pour éviter l'erreur de build
export const dynamic = 'force-dynamic';

/**
 * API pour les tâches cron de Vynal Platform
 * Cet endpoint est conçu pour être appelé par un service cron ou un job scheduler
 * Il ne nécessite pas d'authentification, mais utilise une clé secrète pour sécuriser l'accès
 */
export async function POST(req: NextRequest) {
  try {
    // Vérifier la clé d'API pour sécuriser l'endpoint
    const authHeader = req.headers.get('authorization');
    const apiKey = process.env.CRON_API_KEY;
    
    if (!apiKey || authHeader !== `Bearer ${apiKey}`) {
      return NextResponse.json(
        { success: false, message: 'Non autorisé' },
        { status: 401 }
      );
    }
    
    // Récupérer l'action à exécuter
    const { action } = await req.json();
    
    switch (action) {
      case 'process_notifications':
        // Traiter les notifications en attente
        await processNotifications();
        return NextResponse.json({
          success: true,
          message: 'Traitement des notifications effectué avec succès'
        });
        
      default:
        return NextResponse.json(
          { success: false, message: 'Action non reconnue' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Erreur lors de l\'exécution de la tâche cron:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

/**
 * Version GET pour les services de monitoring comme UptimeRobot
 */
export async function GET(req: NextRequest) {
  // Vérifier la clé secrète dans les paramètres d'URL pour plus de sécurité
  const url = new URL(req.url);
  const key = url.searchParams.get('key');
  const apiKey = process.env.CRON_API_KEY;
  
  if (!apiKey || key !== apiKey) {
    return NextResponse.json(
      { success: false, message: 'Non autorisé' },
      { status: 401 }
    );
  }
  
  const action = url.searchParams.get('action');
  
  if (action === 'process_notifications') {
    try {
      await processNotifications();
      return NextResponse.json({
        success: true,
        message: 'Traitement des notifications effectué avec succès'
      });
    } catch (error) {
      console.error('Erreur lors du traitement des notifications via GET:', error);
      return NextResponse.json(
        { success: false, message: 'Erreur serveur' },
        { status: 500 }
      );
    }
  }
  
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
} 