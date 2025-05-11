import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// Configuration Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Vérification de la présence des variables d'environnement requises
if (!supabaseUrl || !supabaseServiceKey) {
  console.error('ERREUR CRITIQUE: Variables d\'environnement Supabase manquantes');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * API pour mettre à jour le montant minimum de retrait dans les wallets
 */
export async function POST(req: NextRequest) {
  try {
    // Vérifier l'authentification
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
    
    // Récupérer le nouveau montant depuis la requête
    const { amount } = await req.json();
    
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      return NextResponse.json({ error: 'Montant invalide' }, { status: 400 });
    }
    
    // Mettre à jour tous les wallets avec le nouveau montant minimum
    const { error: updateError } = await supabase
      .from('wallets')
      .update({ min_withdrawal_amount: parseFloat(amount) })
      .neq('id', 0); // Mettre à jour tous les wallets
      
    if (updateError) {
      return NextResponse.json({ error: `Erreur de mise à jour: ${updateError.message}` }, { status: 500 });
    }
    
    // Réponse
    return NextResponse.json({
      success: true,
      message: `Le montant minimum de retrait a été mis à jour à ${parseFloat(amount)} FCFA`
    });
    
  } catch (error: any) {
    console.error('Erreur non gérée:', error);
    return NextResponse.json({ 
      error: `Une erreur inattendue s'est produite: ${error.message || 'Erreur inconnue'}` 
    }, { status: 500 });
  }
} 