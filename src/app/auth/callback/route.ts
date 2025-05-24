import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { sendBasicWelcomeEmail } from '@/lib/email';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const redirectTo = requestUrl.searchParams.get('redirectTo') || '/dashboard';

  if (code) {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    try {
      // Échange du code contre une session
      const { data: sessionData, error: sessionError } = await supabase.auth.exchangeCodeForSession(code);
      
      if (sessionError) {
        console.error('Erreur lors de l\'échange du code pour une session:', sessionError);
        return NextResponse.redirect(new URL(redirectTo, requestUrl.origin));
      }
      
      // Récupération du rôle utilisateur pour la redirection appropriée
      const { data: userRole, error: roleError } = await supabase.rpc('get_user_role');
      
      let finalRole = userRole;
      
      if (roleError) {
        // Récupération alternative du rôle
        try {
          // Essayer d'abord via la session utilisateur
          const { data: { user } } = await supabase.auth.getUser();
          
          if (user?.user_metadata?.role) {
            finalRole = user.user_metadata.role;
          } else {
            // Sinon essayer de récupérer depuis le profil
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('role')
              .eq('id', user?.id)
              .single();
              
            if (!profileError && profile?.role) {
              finalRole = profile.role;
            } else {
              finalRole = 'freelance'; // Par défaut, rediriger vers le dashboard freelance
            }
          }
        } catch (err) {
          finalRole = 'freelance'; // Par défaut, rediriger vers le dashboard freelance
        }
      }
      
      // Si le rôle est récupéré avec succès
      if (finalRole) {
        // Récupérer les informations de l'utilisateur pour l'email de bienvenue
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (!userError && user) {
          try {
            // Récupérer le profil pour obtenir le nom complet
            const { data: profile, error: profileError } = await supabase.from('profiles')
              .select('full_name')
              .eq('id', user.id)
              .single();
              
            const userName = profile?.full_name || user.email?.split('@')[0] || 'Utilisateur';
            
            // Envoyer l'email de bienvenue
            await sendBasicWelcomeEmail({
              to: user.email || '',
              name: userName,
              role: finalRole as 'client' | 'freelance'
            });
          } catch (emailError) {
            // Erreur de l'email de bienvenue - continuer quand même
          }
        }
        
        // Redirection en fonction du rôle
        if (finalRole === 'client') {
          return NextResponse.redirect(new URL('/client-dashboard', requestUrl.origin));
        } else if (finalRole === 'freelance') {
          return NextResponse.redirect(new URL('/dashboard', requestUrl.origin));
        } else if (finalRole === 'admin') {
          return NextResponse.redirect(new URL('/admin', requestUrl.origin));
        }
      }
    } catch (err) {
      console.error('Exception générale dans le callback auth:', err);
    }
  }

  // Redirection par défaut si pas de code ou erreur dans la récupération du rôle
  return NextResponse.redirect(new URL(redirectTo, requestUrl.origin));
} 