import { NextRequest, NextResponse } from 'next/server';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { logSecurityEvent } from '@/lib/security/audit';

/**
 * API pour récupérer les paiements d'un utilisateur
 * 
 * Route: GET /api/user/payments
 * Paramètres de requête optionnels:
 * - status: Filtre par statut (completed, processing, failed, refunded)
 * - limit: Nombre maximum de paiements à récupérer (par défaut: 50)
 * - page: Numéro de page pour la pagination (par défaut: 1)
 */
export async function GET(req: NextRequest) {
  const clientIp = req.headers.get('x-forwarded-for') || req.ip || 'unknown';
  const userAgent = req.headers.get('user-agent') || 'unknown';
  
  try {
    // Récupérer les paramètres de la requête
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const offset = (page - 1) * limit;
    
    // Vérifier l'authentification
    const supabase = createClientComponentClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    // Vérifier si l'utilisateur est authentifié
    if (!session?.user) {
      // Journaliser la tentative d'accès non autorisé
      await logSecurityEvent({
        type: 'security_violation',
        ipAddress: clientIp as string,
        userAgent: userAgent as string,
        severity: 'medium',
        details: {
          message: "Tentative d'accès aux paiements sans authentification",
          endpoint: '/api/user/payments'
        }
      });
      
      return NextResponse.json(
        { error: 'Non autorisé. Authentification requise.' },
        { status: 401 }
      );
    }
    
    const userId = session.user.id;
    
    // Construire la requête pour récupérer les paiements
    let query = supabase
      .from('payments')
      .select(`
        *,
        service:service_id (
          title
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    // Ajouter le filtre par statut si spécifié
    if (status) {
      query = query.eq('status', status);
    }
    
    // Exécuter la requête
    const { data, error, count } = await query;
    
    if (error) {
      console.error('Erreur lors de la récupération des paiements:', error);
      throw new Error(error.message);
    }
    
    // Journaliser l'accès aux données de paiement
    await logSecurityEvent({
      type: 'sensitive_data_access',
      userId,
      ipAddress: clientIp as string,
      userAgent: userAgent as string,
      severity: 'low',
      details: {
        action: "retrieve_payment_history",
        count: data?.length || 0,
        filters: { status, limit, page }
      }
    });
    
    // Transformer les données si nécessaire avant de les renvoyer
    const transformedData = data?.map(payment => ({
      ...payment,
      // Ajouter ici d'autres transformations si nécessaire
    })) || [];
    
    // Renvoyer les données avec les métadonnées de pagination
    return NextResponse.json(transformedData, {
      headers: {
        'X-Total-Count': count?.toString() || '0',
        'X-Page': page.toString(),
        'X-Limit': limit.toString()
      }
    });
  } catch (error: any) {
    console.error('Erreur lors de la récupération des paiements:', error);
    
    // Journaliser l'erreur
    await logSecurityEvent({
      type: 'security_violation',
      ipAddress: clientIp as string,
      userAgent: userAgent as string,
      severity: 'medium',
      details: {
        message: "Erreur lors de la récupération des paiements",
        error: error.message,
        endpoint: '/api/user/payments'
      }
    });
    
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de la récupération de vos paiements' },
      { status: 500 }
    );
  }
}