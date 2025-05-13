import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { Database } from '@/types/database';

// Configuration pour indiquer que cette route est dynamique
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }
    
    // Vérifier le rôle admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, is_admin')
      .eq('id', user.id)
      .single();
      
    if (profileError) {
      console.error('Erreur lors de la récupération du profil:', profileError);
      return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
    
    const isAdmin = profile?.role === 'admin' || profile?.is_admin === true || user?.user_metadata?.role === 'admin';
    
    if (!isAdmin) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }
    
    // Récupérer le montant minimum de retrait depuis les paramètres du système
    const { data: settings, error: settingsError } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'min_withdrawal_amount')
      .single();
      
    if (settingsError) {
      console.error('Erreur lors de la récupération des paramètres:', settingsError);
      
      // Valeur par défaut si aucun paramètre n'est trouvé
      if (settingsError.code === 'PGRST116') { // Code pour "aucune ligne trouvée"
        return NextResponse.json({ amount: 5000 });
      }
      
      return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
    
    return NextResponse.json({ amount: parseInt(settings.value) });
  } catch (error) {
    console.error('Erreur lors de la récupération du montant minimum:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
} 