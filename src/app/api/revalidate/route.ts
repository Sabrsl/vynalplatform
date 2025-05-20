import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

// Cache pour suivre les dernières invalidations par chemin
const revalidationCache = new Map<string, number>();
const MIN_REVALIDATION_INTERVAL = 5000; // 5 secondes entre chaque invalidation du même chemin (augmenté de 3s à 5s)

/**
 * API Route pour invalider des chemins spécifiques
 * Permet de déclencher une invalidation côté serveur depuis le client
 * 
 * @param request Requête entrante avec le chemin à invalider
 * @returns Réponse JSON avec le statut de l'invalidation
 */
export async function POST(request: NextRequest) {
  try {
    // Récupérer le chemin à invalider depuis les paramètres de requête
    const path = request.nextUrl.searchParams.get('path');
    
    // Récupérer si c'est une requête forcée (bypass le contrôle de fréquence)
    const forceRevalidate = request.nextUrl.searchParams.get('force') === 'true';
    
    // Vérifier que le chemin est fourni
    if (!path) {
      return NextResponse.json(
        { error: 'Le paramètre path est requis' },
        { status: 400 }
      );
    }
    
    // Vérifier que le chemin est autorisé (sécurité)
    const allowedPaths = ['/services', '/', '/dashboard/freelance/services'];
    if (!allowedPaths.includes(path)) {
      return NextResponse.json(
        { error: 'Chemin non autorisé pour l\'invalidation' },
        { status: 403 }
      );
    }
    
    // Contrôle de fréquence - Vérifier si le chemin a été invalidé récemment
    const now = Date.now();
    const lastRevalidationTime = revalidationCache.get(path) || 0;
    const timeElapsed = now - lastRevalidationTime;
    
    // Si le temps écoulé est trop court et ce n'est pas une requête forcée, renvoyer une réponse de limitation
    if (!forceRevalidate && timeElapsed < MIN_REVALIDATION_INTERVAL) {
      console.log(`Revalidation trop fréquente pour ${path}. Dernière: il y a ${Math.floor(timeElapsed / 1000)}s`);
      return NextResponse.json({
        revalidated: false,
        throttled: true,
        path,
        retryAfter: Math.ceil((MIN_REVALIDATION_INTERVAL - timeElapsed) / 1000),
        message: `La revalidation de ce chemin a été limitée. Réessayez dans ${Math.ceil((MIN_REVALIDATION_INTERVAL - timeElapsed) / 1000)}s ou utilisez force=true`
      }, { status: 429 });
    }
    
    // Mettre à jour le cache avec le timestamp actuel
    revalidationCache.set(path, now);
    
    // Invalider le chemin
    revalidatePath(path);
    
    console.log(`API: Page ${path} invalidée avec succès`);
    
    return NextResponse.json({
      revalidated: true,
      path,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erreur lors de l\'invalidation:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'invalidation', details: String(error) },
      { status: 500 }
    );
  }
} 