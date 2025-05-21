import { NextRequest, NextResponse } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';

/**
 * Middleware allégé pour la gestion de l'authentification et de la sécurité
 * Optimisé pour minimiser l'impact sur les performances
 */
export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const { pathname } = req.nextUrl;
  
  // Appliquer les en-têtes de sécurité à toutes les réponses
  applySecurityHeaders(res);
  
  // Exceptions et optimisations
  
  // 1. Pas de vérification d'authentification pour les ressources statiques et APIs publiques
  if (
    pathname.startsWith('/_next') || 
    pathname.startsWith('/api/public') ||
    pathname === '/api/stripe/webhook'
  ) {
    return res;
  }
  
  // 2. Protection CSRF uniquement pour les routes d'API modifiant des données
  if (
    isDataModifyingMethod(req.method) &&
    pathname.startsWith('/api/') &&
    !pathname.startsWith('/api/stripe/webhook')
  ) {
    const validCsrf = validateCsrfOrigin(req);
    if (!validCsrf) {
      return NextResponse.json({ error: 'CSRF détecté' }, { status: 403 });
    }
  }
  
  // 3. Vérification d'authentification uniquement pour les routes protégées
  if (isProtectedRoute(pathname)) {
    try {
      const supabase = createMiddlewareClient({ req, res });
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        // Redirection avec compteur pour éviter les boucles
        return handleAuthRedirect(req);
      }
    } catch (err) {
      console.error('Erreur d\'authentification:', err);
      // En cas d'erreur, permettre la continuation avec les en-têtes de sécurité
      return res;
    }
  }
  
  return res;
}

/**
 * Vérifie si la méthode HTTP modifie des données
 */
function isDataModifyingMethod(method: string): boolean {
  return ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method);
}

/**
 * Vérifie si le chemin est une route protégée
 */
function isProtectedRoute(pathname: string): boolean {
  const protectedPaths = ['/checkout', '/dashboard', '/account'];
  return protectedPaths.some(path => pathname.startsWith(path));
}

/**
 * Vérifie l'origine pour la protection CSRF
 */
function validateCsrfOrigin(req: NextRequest): boolean {
  const origin = req.headers.get('origin');
  const host = req.headers.get('host');
  
  return !!origin && !!host && origin.includes(host);
}

/**
 * Gère la redirection pour l'authentification
 */
function handleAuthRedirect(req: NextRequest): NextResponse {
  const url = req.nextUrl.clone();
  const redirectCount = parseInt(req.headers.get('x-redirect-count') || '0');
  
  // Limiter le nombre de redirections
  if (redirectCount > 2) {
    url.pathname = '/';
    return applySecurityHeaders(NextResponse.redirect(url));
  }
  
  url.pathname = '/auth/sign-in';
  url.searchParams.set('callbackUrl', req.nextUrl.pathname);
  
  const response = NextResponse.redirect(url);
  response.headers.set('x-redirect-count', (redirectCount + 1).toString());
  
  return applySecurityHeaders(response);
}

/**
 * Applique les en-têtes de sécurité essentiels à une réponse
 */
function applySecurityHeaders(response: NextResponse): NextResponse {
  // En-têtes de sécurité fondamentaux (réduits au minimum nécessaire)
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  
  // CSP simplifiée mais suffisante pour la protection de base
  const csp = [
    "default-src 'self'",
    "script-src 'self' https://js.stripe.com 'unsafe-inline' 'unsafe-eval'",
    "frame-src https://js.stripe.com https://hooks.stripe.com",
    "connect-src 'self' https://api.stripe.com",
    "img-src 'self' data: https://*.stripe.com",
    "style-src 'self' 'unsafe-inline'",
    "object-src 'none'"
  ].join('; ');
  
  response.headers.set('Content-Security-Policy', csp);
  
  return response;
}

// Appliquer ce middleware uniquement aux routes nécessaires
export const config = {
  matcher: [
    // Routes protégées nécessitant une authentification
    '/checkout/:path*',
    '/dashboard/:path*',
    '/account/:path*',
    
    // Routes d'API nécessitant une protection CSRF
    '/api/:path*',
    
    // Exclure les ressources statiques et API publiques
    '/((?!_next/static|_next/image|favicon.ico|api/public).*)'
  ],
};