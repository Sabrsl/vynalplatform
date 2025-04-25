import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Liste des sous-routes valides du dashboard
// Cette liste aide à vérifier si une route dashboard existe avant de rediriger
const validDashboardRoutes = [
  '/dashboard',
  '/dashboard/orders',
  '/dashboard/messages',
  '/dashboard/disputes',
  '/dashboard/payments',
  '/dashboard/wallet',
  '/dashboard/wallet/withdraw',
  '/dashboard/services',
  '/dashboard/services/new',
  '/dashboard/services/edit',
  '/dashboard/profile',
  '/dashboard/stats',
  '/dashboard/certifications',
  '/dashboard/resources',
  '/dashboard/support',
  '/dashboard/settings',
];

// Vérifier si une route spécifique existe
function isValidRoute(pathname: string): boolean {
  // Pour les routes avec ID dynamique (ex: /dashboard/services/[id])
  if (/\/dashboard\/services\/\w+/.test(pathname) ||
      /\/dashboard\/orders\/\w+/.test(pathname) ||
      /\/dashboard\/services\/edit\/\w+/.test(pathname)) {
    return true;
  }
  
  // Pour les routes fixes
  return validDashboardRoutes.some(route => 
    pathname === route || pathname.startsWith(`${route}/`)
  );
}

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
  const isAdminRoute = pathname.startsWith('/admin');
  
  // Si l'utilisateur est connecté et tente d'accéder à une page d'auth, le rediriger vers le dashboard
  if (session && isAuthRoute) {
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }
  
  // Si l'utilisateur n'est pas connecté et tente d'accéder au dashboard, le rediriger vers la page de connexion
  if (!session && isDashboardRoute) {
    url.pathname = '/auth/login';
    // Ajouter la redirection en paramètre pour revenir à la page après connexion
    // Mais vérifier d'abord que la route est valide pour éviter les redirections vers des 404
    if (isValidRoute(pathname)) {
      url.searchParams.set('redirectTo', pathname);
    } else {
      // Si la route n'est pas valide, rediriger vers le dashboard principal
      url.searchParams.set('redirectTo', '/dashboard');
    }
    return NextResponse.redirect(url);
  }

  // Si l'utilisateur n'est pas connecté et tente d'accéder à l'admin, le rediriger vers la page de connexion
  if (!session && isAdminRoute) {
    url.pathname = '/auth/login';
    url.searchParams.set('redirectTo', '/admin');
    return NextResponse.redirect(url);
  }
  
  // Si l'utilisateur est connecté mais n'est pas admin et tente d'accéder à l'admin, le rediriger vers une page non autorisée
  if (session && isAdminRoute) {
    try {
      // Vérifier si l'utilisateur a le rôle admin
      const { data: userRole, error } = await supabase.rpc('get_user_role');
      
      if (error || userRole !== 'admin') {
        url.pathname = '/unauthorized';
        return NextResponse.redirect(url);
      }
    } catch (err) {
      console.error("Erreur lors de la vérification du rôle admin:", err);
      url.pathname = '/unauthorized';
      return NextResponse.redirect(url);
    }
  }
  
  // Vérifier si la route dashboard existe (pour éviter les 404)
  if (session && isDashboardRoute && !isValidRoute(pathname)) {
    // Rediriger vers le dashboard principal si la route n'est pas valide
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }
  
  return res;
}

// Spécifier les chemins concernés par le middleware
export const config = {
  matcher: [
    // Routes à protéger
    '/dashboard/:path*',
    '/admin/:path*',
    // Routes d'authentification à gérer
    '/auth/:path*',
  ],
}; 