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
  '/dashboard/help',
];

// Liste des sous-routes valides du client dashboard
const validClientDashboardRoutes = [
  '/client-dashboard',
  '/client-dashboard/orders',
  '/client-dashboard/messages',
  '/client-dashboard/disputes',
  '/client-dashboard/payments',
  '/client-dashboard/profile',
  '/client-dashboard/settings',
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

// Vérifier si une route client dashboard est valide
function isValidClientRoute(pathname: string): boolean {
  // Pour les routes avec ID dynamique
  if (/\/client-dashboard\/orders\/\w+/.test(pathname)) {
    return true;
  }
  
  // Pour les routes fixes
  return validClientDashboardRoutes.some(route => 
    pathname === route || pathname.startsWith(`${route}/`)
  );
}

// Ne pas rediriger ces routes même si l'utilisateur est authentifié
const noRedirectRoutes = ['/', '/services', '/about', '/how-it-works', '/contact'];

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
  const isClientDashboardRoute = pathname.startsWith('/client-dashboard');
  const isAdminRoute = pathname.startsWith('/admin');
  const isPublicRoute = noRedirectRoutes.includes(pathname) || 
                      noRedirectRoutes.some(route => pathname.startsWith(`${route}/`));
  
  // Cache local pour le rôle utilisateur (valide uniquement pour cette requête)
  let userRole: string | null = null;
  
  // Récupérer le rôle utilisateur de manière optimisée
  const getUserRole = async (): Promise<string | null> => {
    if (userRole !== null) return userRole; // Retourner le rôle si déjà récupéré
    
    if (!session) return null;
    
    try {
      const { data, error } = await supabase.rpc('get_user_role');
      
      if (error) {
        console.error("Erreur lors de la récupération du rôle");
        return null;
      }
      
      userRole = data;
      return data;
    } catch (err) {
      console.error("Erreur lors de la récupération du rôle");
      return null;
    }
  };
  
  // Si l'utilisateur est sur une route publique, ne jamais le rediriger automatiquement
  if (isPublicRoute) {
    return res;
  }
  
  // Si l'utilisateur est connecté et tente d'accéder à une page d'auth, 
  // le rediriger vers le dashboard approprié selon son rôle
  if (session && isAuthRoute) {
    const role = await getUserRole();
    
    if (role === 'client') {
      url.pathname = '/client-dashboard';
    } else if (role === 'freelance') {
      url.pathname = '/dashboard';
    } else if (role === 'admin') {
      url.pathname = '/admin';
    } else {
      // Fallback par défaut
      url.pathname = '/dashboard';
    }
    
    return NextResponse.redirect(url);
  }
  
  // Si l'utilisateur n'est pas connecté et tente d'accéder à une zone protégée
  if (!session && (isDashboardRoute || isClientDashboardRoute || isAdminRoute)) {
    url.pathname = '/auth/login';
    
    // Ajouter le paramètre de redirection approprié
    if (isDashboardRoute && isValidRoute(pathname)) {
      url.searchParams.set('redirectTo', pathname);
    } else if (isClientDashboardRoute && isValidClientRoute(pathname)) {
      url.searchParams.set('redirectTo', pathname);
    } else if (isAdminRoute) {
      url.searchParams.set('redirectTo', '/admin');
    } else {
      // Fallback pour les routes invalides
      url.searchParams.set('redirectTo', isDashboardRoute ? '/dashboard' : 
        isClientDashboardRoute ? '/client-dashboard' : '/dashboard');
    }
    
    return NextResponse.redirect(url);
  }
  
  // Si l'utilisateur est connecté, vérifier s'il accède au bon dashboard pour son rôle
  if (session && (isDashboardRoute || isClientDashboardRoute)) {
    const role = await getUserRole();
    
    // Rediriger les clients qui tentent d'accéder au dashboard freelance
    if (role === 'client' && isDashboardRoute) {
      url.pathname = '/client-dashboard';
      return NextResponse.redirect(url);
    }
    
    // Rediriger les freelances qui tentent d'accéder au dashboard client
    if (role === 'freelance' && isClientDashboardRoute) {
      url.pathname = '/dashboard';
      return NextResponse.redirect(url);
    }
  }
  
  // Vérifier si l'utilisateur a accès à l'admin
  if (session && isAdminRoute) {
    const role = await getUserRole();
    
    if (role !== 'admin') {
      url.pathname = '/unauthorized';
      return NextResponse.redirect(url);
    }
  }
  
  // Vérification des routes valides
  if (session) {
    // Rediriger vers la route principale si la route spécifique n'existe pas
    if (isDashboardRoute && !isValidRoute(pathname)) {
      url.pathname = '/dashboard';
      return NextResponse.redirect(url);
    }
    
    if (isClientDashboardRoute && !isValidClientRoute(pathname)) {
      url.pathname = '/client-dashboard';
      return NextResponse.redirect(url);
    }
  }
  
  return res;
}

// Spécifier les chemins concernés par le middleware
export const config = {
  matcher: [
    // Routes à protéger - uniquement celles qui nécessitent une authentification
    '/dashboard/:path*',
    '/client-dashboard/:path*',
    '/admin/:path*',
    // Routes d'authentification à gérer
    '/auth/:path*',
  ],
}; 