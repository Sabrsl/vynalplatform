import { revalidatePath } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';
import { STATIC_PAGES } from '@/lib/optimizations/static-invalidation';
import { eventEmitter, EVENTS } from '@/lib/utils/events';

/**
 * API Route pour invalider le cache des pages qui dépendent des catégories
 * Cette route peut être appelée par des webhooks Supabase ou manuellement
 * 
 * Route: /api/revalidate/categories
 * 
 * Sécurité: Cette route devrait être protégée en production
 */
export async function POST(req: NextRequest) {
  try {
    // Vérifier le secret en production (optionnel)
    // const secret = req.headers.get('x-revalidate-secret');
    // if (process.env.NODE_ENV === 'production' && secret !== process.env.REVALIDATE_SECRET) {
    //   return NextResponse.json({ success: false, message: 'Accès non autorisé' }, { status: 401 });
    // }
    
    // Émettre l'événement d'invalidation pour la page d'accueil
    eventEmitter.emit(EVENTS.INVALIDATE_HOME);
    
    // Invalider directement en cas d'échec de l'événement
    revalidatePath(STATIC_PAGES.HOME);
    
    // Invalider également le chemin des services qui dépend des catégories
    revalidatePath('/services');
    
    return NextResponse.json({
      revalidated: true,
      message: 'Cache invalidé pour la page d\'accueil et la page des services',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    return NextResponse.json({
      revalidated: false,
      message: 'Erreur lors de l\'invalidation du cache',
      error: error.message
    }, { status: 500 });
  }
}

/**
 * Également répondre aux requêtes GET pour faciliter les tests
 */
export async function GET() {
  return NextResponse.json({
    message: 'Cette API accepte uniquement les requêtes POST pour invalider le cache'
  });
} 