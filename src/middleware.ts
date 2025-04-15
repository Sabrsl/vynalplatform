import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });
  
  // Récupérer la session depuis Supabase
  const { data: { session } } = await supabase.auth.getSession();
  
  // URL actuelle et URL de destination
  const url = req.nextUrl.clone();
  const { pathname } = url;
  
  // Vérifier si l'utilisateur accède à une route protégée
  const isAuthRoute = pathname.startsWith('/auth');
  const isDashboardRoute = pathname.startsWith('/dashboard');
  
  // Si l'utilisateur est connecté et tente d'accéder à une page d'auth, le rediriger vers le dashboard
  if (session && isAuthRoute) {
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }
  
  // Si l'utilisateur n'est pas connecté et tente d'accéder au dashboard, le rediriger vers la page de connexion
  if (!session && isDashboardRoute) {
    url.pathname = '/auth/login';
    // Ajouter la redirection en paramètre pour revenir à la page après connexion
    url.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(url);
  }
  
  return res;
}

// Spécifier les chemins concernés par le middleware
export const config = {
  matcher: [
    // Routes à protéger
    '/dashboard/:path*',
    // Routes d'authentification à gérer
    '/auth/:path*',
  ],
}; 