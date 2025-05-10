import { NextRequest, NextResponse } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';

export async function middleware(req: NextRequest) {
  // Créer une copie de la réponse
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });
  
  // Récupérer la session depuis Supabase
  const { data: { session } } = await supabase.auth.getSession();
  
  // URL actuelle et URL de destination
  const url = req.nextUrl.clone();
  const { pathname } = url;
  
  // Vérifier si la requête contient déjà des redirections en chaîne
  const redirectCount = parseInt(req.headers.get('x-redirect-count') || '0');
  
  // Limiter le nombre de redirections pour éviter les boucles infinies
  if (redirectCount > 2) {
    console.error(`Trop de redirections détectées: ${redirectCount}. Chemin: ${pathname}`);
    url.pathname = '/';
    return NextResponse.redirect(url);
  }
  
  // Ajouter des en-têtes de sécurité
  res.headers.set('X-Frame-Options', 'DENY');
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('Referrer-Policy', 'same-origin');
  res.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  // Logique de redirection basée sur l'authentification et les rôles pourrait être ajoutée ici
  // ...
  
  // Avant de rediriger, incrémenter le compteur de redirections
  if (url.pathname !== pathname) {
    const response = NextResponse.redirect(url);
    response.headers.set('x-redirect-count', (redirectCount + 1).toString());
    
    // Conserver les en-têtes de sécurité sur la redirection
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'same-origin');
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    
    return response;
  }
  
  return res;
}

// Appliquer ce middleware à toutes les routes
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}; 