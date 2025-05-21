import { NextResponse } from 'next/server';
import { getSupabaseServer, getServerSession } from '@/lib/supabase/server';

// Marquer cette route comme dynamique car elle utilise des cookies
export const dynamic = 'force-dynamic';

/**
 * API pour récupérer les services du freelance connecté
 * Utilisé pour le rafraîchissement côté client
 */
export async function GET() {
  try {
    // Vérifier l'authentification de l'utilisateur
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Non autorisé - Veuillez vous connecter' },
        { status: 401 }
      );
    }
    
    const userId = session.user.id;
    const supabase = getSupabaseServer();
    
    // Récupérer le profil freelance
    const { data: freelanceProfile, error: freelanceError } = await supabase
      .from('freelances')
      .select('id')
      .eq('user_id', userId)
      .single();
    
    if (freelanceError || !freelanceProfile) {
      return NextResponse.json(
        { error: 'Aucun profil freelance trouvé' },
        { status: 404 }
      );
    }
    
    // Récupérer les services du freelance
    const { data: services, error: servicesError } = await supabase
      .from('services')
      .select(`
        *,
        categories (id, name, slug),
        subcategories (id, name, slug)
      `)
      .eq('freelance_id', freelanceProfile.id)
      .order('updated_at', { ascending: false });
    
    if (servicesError) {
      throw servicesError;
    }
    
    return NextResponse.json({ services: services || [] });
  } catch (error) {
    console.error('Erreur lors de la récupération des services du freelance:', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors de la récupération des services' },
      { status: 500 }
    );
  }
} 