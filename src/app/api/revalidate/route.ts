import { revalidatePath } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

// Token pour sécuriser l'API (défini dans les variables d'environnement)
const REVALIDATION_TOKEN = process.env.REVALIDATION_TOKEN || 'default_token';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Récupérer les paramètres de la requête
    const searchParams = request.nextUrl.searchParams;
    const path = searchParams.get('path');
    const secret = searchParams.get('secret');

    // Vérifier que le secret est valide
    // On vérifie également que le token dans le client correspond, pour plus de sécurité
    if (secret !== process.env.NEXT_PUBLIC_REVALIDATION_TOKEN && secret !== REVALIDATION_TOKEN) {
      return NextResponse.json({ 
        success: false, 
        message: 'Token de revalidation invalide' 
      }, { 
        status: 401,
        statusText: 'Unauthorized'
      });
    }

    // Vérifier qu'un chemin a été fourni
    if (!path) {
      return NextResponse.json({ 
        success: false, 
        message: 'Paramètre "path" manquant' 
      }, { 
        status: 400,
        statusText: 'Bad Request'
      });
    }

    // Revalider le chemin spécifié
    revalidatePath(path);

    // Retourner une réponse de succès
    return NextResponse.json({ 
      success: true, 
      message: `La page ${path} a été revalidée avec succès`,
      revalidatedAt: new Date().toISOString()
    });
    
  } catch (error: any) {
    // En cas d'erreur, logger et retourner une erreur
    console.error('Erreur lors de la revalidation:', error);
    
    return NextResponse.json({ 
      success: false, 
      message: `Erreur lors de la revalidation: ${error.message || 'Erreur inconnue'}` 
    }, { 
      status: 500,
      statusText: 'Internal Server Error'
    });
  }
} 