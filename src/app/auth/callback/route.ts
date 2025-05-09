import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const redirectTo = requestUrl.searchParams.get('redirectTo') || '/dashboard';

  if (code) {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Échange du code contre une session
    await supabase.auth.exchangeCodeForSession(code);
    
    // Récupération du rôle utilisateur pour la redirection appropriée
    try {
      const { data: userRole, error } = await supabase.rpc('get_user_role');
      
      // Si le rôle est récupéré avec succès, rediriger en fonction du rôle
      if (!error && userRole) {
        if (userRole === 'client') {
          return NextResponse.redirect(new URL('/client-dashboard', requestUrl.origin));
        } else if (userRole === 'freelance') {
          return NextResponse.redirect(new URL('/dashboard', requestUrl.origin));
        } else if (userRole === 'admin') {
          return NextResponse.redirect(new URL('/admin', requestUrl.origin));
        }
      }
    } catch (err) {
      console.error('Erreur lors de la récupération du rôle:', err);
    }
  }

  // Redirection par défaut si pas de code ou erreur dans la récupération du rôle
  return NextResponse.redirect(new URL(redirectTo, requestUrl.origin));
} 