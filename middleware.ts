import { NextRequest, NextResponse } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';

/**
 * Middleware pour la gestion de l'authentification et de la sécurité
 * 
 * Ce middleware s'exécute sur chaque requête et permet de :
 * - Vérifier l'authentification pour les routes protégées
 * - Définir des en-têtes de sécurité pour toutes les réponses
 * - Protéger contre les attaques CSRF
 * - Gérer les redirections pour l'authentification
 */
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
  res.headers.set('X-XSS-Protection', '1; mode=block');
  
  // Ajout de la politique de sécurité du contenu pour Stripe
  res.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' https://js.stripe.com 'unsafe-inline' 'unsafe-eval'; " +
    "frame-src https://js.stripe.com https://hooks.stripe.com; " +
    "connect-src 'self' https://api.stripe.com; " +
    "img-src 'self' data: https://*.stripe.com; " +
    "font-src 'self' data:; " +
    "style-src 'self' 'unsafe-inline';"
  );
  
  // Vérification de l'authentification pour les routes protégées
  if (
    pathname.startsWith('/checkout') ||
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/account')
  ) {
    // Si l'utilisateur n'est pas authentifié, rediriger vers la page de connexion
    if (!session) {
      url.pathname = '/auth/sign-in';
      url.searchParams.set('callbackUrl', pathname);
      
      const response = NextResponse.redirect(url);
      response.headers.set('x-redirect-count', (redirectCount + 1).toString());
      
      // Conserver les en-têtes de sécurité sur la redirection
      response.headers.set('X-Frame-Options', 'DENY');
      response.headers.set('X-Content-Type-Options', 'nosniff');
      response.headers.set('Referrer-Policy', 'same-origin');
      response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
      response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
      response.headers.set('X-XSS-Protection', '1; mode=block');
      
      return response;
    }
  }
  
  // Protection contre les attaques CSRF pour les routes d'API modifiant des données
  if (
    (req.method === 'POST' || req.method === 'PUT' || req.method === 'DELETE') &&
    pathname.startsWith('/api/') &&
    !pathname.startsWith('/api/stripe/webhook') // Exception pour le webhook Stripe
  ) {
    const origin = req.headers.get('origin');
    const host = req.headers.get('host');
    
    // Vérification que l'origine de la requête correspond à notre domaine
    if (!origin || !host || !origin.includes(host)) {
      return NextResponse.json(
        { error: 'CSRF détecté. Origine non autorisée.' },
        { status: 403 }
      );
    }
  }
  
  // Exception pour le webhook Stripe qui utilise sa propre authentification
  if (pathname === '/api/stripe/webhook') {
    // Pas de vérification d'authentification ici car validé par la signature Stripe
    return res;
  }
  
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
    response.headers.set('X-XSS-Protection', '1; mode=block');
    
    return response;
  }
  
  return res;
}

// Appliquer ce middleware à toutes les routes sauf les ressources statiques
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};