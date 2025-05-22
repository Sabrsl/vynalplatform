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
      const { error: sessionError } = await supabase.auth.exchangeCodeForSession(code);
      
      if (sessionError) {
        console.error('Erreur lors de l\'échange du code pour une session:', sessionError);
        return NextResponse.redirect(new URL(redirectTo, requestUrl.origin));
      }
      
      // Récupération du rôle utilisateur pour la redirection appropriée
      const { data: userRole, error: roleError } = await supabase.rpc('get_user_role');
      
      let finalRole = userRole;
      
      if (roleError) {
        console.error('Erreur lors de la récupération du rôle via RPC:', roleError);
        
        // Récupération alternative du rôle
        try {
          // Essayer d'abord via la session utilisateur
          const { data: { user } } = await supabase.auth.getUser();
          
          if (user?.user_metadata?.role) {
            console.log('Rôle récupéré via user_metadata:', user.user_metadata.role);
            finalRole = user.user_metadata.role;
          } else {
            // Sinon essayer de récupérer depuis le profil
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('role')
              .eq('id', user?.id)
              .single();
              
            if (!profileError && profile?.role) {
              console.log('Rôle récupéré via le profil:', profile.role);
              finalRole = profile.role;
            } else {
              console.log('Impossible de déterminer le rôle utilisateur, utilisation du rôle par défaut.');
              finalRole = 'freelance'; // Par défaut, rediriger vers le dashboard freelance
            }
          }
        } catch (err) {
          console.error('Exception lors de la récupération alternative du rôle:', err);
          finalRole = 'freelance'; // Par défaut, rediriger vers le dashboard freelance
        }
      }
      
      // Si le rôle est récupéré avec succès
      if (finalRole) {
        console.log('Utilisateur authentifié avec le rôle final:', finalRole);
        
        // Récupérer les informations de l'utilisateur pour l'email de bienvenue
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
          console.error('Erreur lors de la récupération des informations utilisateur:', userError);
        }
        
        if (user) {
          console.log('Informations utilisateur récupérées:', user.email);
          
          try {
            // Récupérer le profil pour obtenir le nom complet
            const { data: profile, error: profileError } = await supabase.from('profiles')
              .select('full_name')
              .eq('id', user.id)
              .single();
              
            if (profileError) {
              console.error('Erreur lors de la récupération du profil:', profileError);
            }
            
            const userName = profile?.full_name || user.email?.split('@')[0] || 'Utilisateur';
            console.log('Préparation de l\'envoi de l\'email de bienvenue basique à:', user.email, 'Nom:', userName);
            
            // Vérification des variables d'environnement email
            console.log('Variables d\'environnement email:');
            console.log('- EMAIL_SMTP_HOST:', process.env.EMAIL_SMTP_HOST);
            console.log('- EMAIL_SMTP_PORT:', process.env.EMAIL_SMTP_PORT);
            console.log('- EMAIL_SMTP_USER set:', !!process.env.EMAIL_SMTP_USER);
            console.log('- EMAIL_SMTP_PASSWORD set:', !!process.env.EMAIL_SMTP_PASSWORD);
            console.log('- NODE_ENV:', process.env.NODE_ENV);
            
            // Envoyer l'email de bienvenue
            const emailResult = await sendBasicWelcomeEmail({
              to: user.email || '',
              name: userName,
              role: finalRole as 'client' | 'freelance'
            });
            
            console.log('Résultat de l\'envoi de l\'email de bienvenue:', emailResult ? 'Succès' : 'Échec');
          } catch (emailError) {
            console.error('Exception lors de l\'envoi de l\'email de bienvenue:', emailError);
          }
        }
        
        // Redirection en fonction du rôle
        if (finalRole === 'client') {
          return NextResponse.redirect(new URL('/client-dashboard', requestUrl.origin));
        } else if (finalRole === 'freelance') {
          console.log('Redirection du freelance vers le dashboard principal');
          return NextResponse.redirect(new URL('/dashboard', requestUrl.origin));
        } else if (finalRole === 'admin') {
          return NextResponse.redirect(new URL('/admin', requestUrl.origin));
        }
      }
    } catch (err) {
      console.error('Exception générale dans le callback auth:', err);
    }
  } else {
    console.log('Aucun code de redirection trouvé dans l\'URL');
  }

  // Redirection par défaut si pas de code ou erreur dans la récupération du rôle
  return NextResponse.redirect(new URL(redirectTo, requestUrl.origin));
} 