import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';

// Configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Vérification des variables d'environnement
if (!supabaseUrl || !supabaseServiceKey) {
  console.error('ERREUR: Variables d\'environnement Supabase manquantes');
}

// Client Supabase avec role de service pour opérations admin
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * API qui installe les fonctions PostgreSQL nécessaires pour le système
 */
export async function POST(req: NextRequest) {
  try {
    // Vérifier l'authentification et les droits d'administrateur
    const cookieStore = cookies();
    const supabaseClient = createServerComponentClient({ cookies: () => cookieStore });
    const { data: { session } } = await supabaseClient.auth.getSession();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentification requise' }, { status: 401 });
    }
    
    // Vérifier si l'utilisateur est administrateur
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();
      
    if (profileError || profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Droits administrateur requis' }, { status: 403 });
    }
    
    // Créer la fonction increment_value
    try {
      await supabase.rpc('create_increment_value_function');
    } catch (error: any) {
      console.error('Erreur lors de la création de la fonction increment_value:', error);
    }
    
    // Créer la fonction decrement_value
    try {
      await supabase.rpc('create_decrement_value_function');
    } catch (error: any) {
      console.error('Erreur lors de la création de la fonction decrement_value:', error);
    }
    
    // Créer la fonction de création de la table withdrawal_requests
    try {
      await supabase.rpc('create_withdrawal_requests_if_not_exists');
    } catch (error: any) {
      console.error('Erreur lors de la création de la table withdrawal_requests:', error);
    }
    
    return NextResponse.json({
      success: true,
      message: 'Fonctions PostgreSQL installées avec succès'
    });
    
  } catch (error) {
    console.error('Erreur non gérée:', error);
    return NextResponse.json({ error: 'Une erreur inattendue s\'est produite' }, { status: 500 });
  }
} 