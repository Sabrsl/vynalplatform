import { NextRequest, NextResponse } from 'next/server';
import { isSuspiciousActivity } from '@/lib/security/audit';

/**
 * API pour vérifier si une activité est suspecte
 * 
 * Route: GET /api/security/check-activity
 * Paramètres:
 *   - userId: ID de l'utilisateur
 *   - eventType: Type d'événement à vérifier
 */
export async function GET(req: NextRequest) {
  // Extraction des paramètres de l'URL
  const searchParams = req.nextUrl.searchParams;
  const userId = searchParams.get('userId');
  const eventType = searchParams.get('eventType');
  
  // Vérification des paramètres requis
  if (!userId || !eventType) {
    return NextResponse.json(
      { error: 'Les paramètres userId et eventType sont requis' },
      { status: 400 }
    );
  }
  
  try {
    // Vérification de l'activité suspecte
    const suspicious = await isSuspiciousActivity(userId, eventType as any);
    
    // Retour du résultat
    return NextResponse.json({
      userId,
      eventType,
      isSuspicious: suspicious
    });
  } catch (error: any) {
    console.error('Erreur lors de la vérification de l\'activité suspecte:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la vérification de l\'activité' },
      { status: 500 }
    );
  }
} 