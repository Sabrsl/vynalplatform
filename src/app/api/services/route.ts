import { NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase/server';
import { getServicesPageData } from '@/app/services/server';
import { headers } from 'next/headers';

// Marquer cette route comme dynamique car elle utilise headers
export const dynamic = 'force-dynamic';

/**
 * API pour récupérer les données des services
 * Utilisé pour le rafraîchissement côté client
 */
export async function GET() {
  try {
    console.log('API: Récupération des services - Début');
    const requestHeaders = headers();
    const forceRefresh = requestHeaders.get('cache-control') === 'no-cache';
    
    if (forceRefresh) {
      console.log('API: Forçage du rafraîchissement des données');
    }
    
    // Utiliser la même fonction que pour le rendu initial mais avec l'option noCache si nécessaire
    const data = await getServicesPageData(
      forceRefresh ? { noCache: Date.now().toString() } : undefined
    );
    
    // Ajouter des informations de diagnostic
    const servicesCount = data.services?.length || 0;
    console.log(`API: ${servicesCount} services approuvés récupérés`);
    
    // Si aucun service n'est récupéré, effectuer une vérification manuelle
    if (servicesCount === 0) {
      // Créer un client Supabase pour le debug
      const supabase = getSupabaseServer({ noCache: Date.now().toString() });
      
      // Vérifier s'il y a des services dans la base de données
      const { data: debugServices, error } = await supabase
        .from('services')
        .select('id, status, active')
        .limit(5);
      
      if (error) {
        console.error('Erreur lors de la vérification des services:', error);
      } else {
        console.log('API Debug - Échantillon de services:', 
          debugServices?.map(s => `ID: ${s.id.substring(0, 8)}, Status: ${s.status}, Active: ${s.active}`).join(', ') || 'Aucun');
      }
    }
    
    console.log('API: Récupération des services - Terminé');
    
    // Retourner les données avec des en-têtes qui empêchent la mise en cache
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des services:', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors de la récupération des services' },
      { 
        status: 500,
        headers: {
          'Cache-Control': 'no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    );
  }
} 