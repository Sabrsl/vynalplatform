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

// Cache des rôles pour éviter les requêtes répétées
const roleCache = new Map<string, { role: string | null, timestamp: number }>();
const ROLE_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

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
  
  // Fonction optimisée pour récupérer le rôle utilisateur avec cache
  const getUserRole = async (): Promise<string | null> => {
    if (!session) return null;
    
    const userId = session.user?.id;
    if (!userId) return null;
    
    // Vérifier le cache pour ce rôle
    const cachedRole = roleCache.get(userId);
    const now = Date.now();
    
    if (cachedRole && (now - cachedRole.timestamp < ROLE_CACHE_DURATION)) {
      return cachedRole.role;
    }
    
    try {
      // D'abord essayer via les métadonnées de l'utilisateur (plus rapide)
      if (session.user?.user_metadata?.role) {
        const role = session.user.user_metadata.role;
        roleCache.set(userId, { role, timestamp: now });
        return role;
      }
      
      // Ensuite essayer via la fonction RPC
      const { data, error } = await supabase.rpc('get_user_role');
      if (error) {
        console.error("Erreur RPC:", error.message);
        
        // Fallback sur la récupération du profil
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();
          
        const role = profile?.role || null;
        roleCache.set(userId, { role, timestamp: now });
        return role;
      }
      
      roleCache.set(userId, { role: data, timestamp: now });
      return data;
    } catch (err) {
      console.error("Erreur lors de la récupération du rôle:", err);
      return null;
    }
  };
  
  // Si l'utilisateur est sur une route publique, ne jamais le rediriger
  if (isPublicRoute) {
    return res;
  }
  
  // Si l'utilisateur est connecté et tente d'accéder à une page d'auth, 
  // le rediriger vers le dashboard approprié selon son rôle
  if (session && isAuthRoute) {
    const role = await getUserRole();
    
    if (role === 'client') {
      url.pathname = '/client-dashboard';
      return NextResponse.redirect(url);
    } else if (role === 'freelance') {
      url.pathname = '/dashboard';
      return NextResponse.redirect(url);
    } else if (role === 'admin') {
      url.pathname = '/admin';
      return NextResponse.redirect(url);
    } else {
      // Fallback par défaut
      url.pathname = '/dashboard';
      return NextResponse.redirect(url);
    }
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
    
    // Ne pas vérifier les rôles si la navigation est entre des sous-routes du même dashboard
    const isNestedDashboardRoute = 
      (isDashboardRoute && pathname !== '/dashboard') || 
      (isClientDashboardRoute && pathname !== '/client-dashboard');
      
    if (isNestedDashboardRoute) {
      // Pour les sous-routes, vérifier seulement si la route est valide
      if (isDashboardRoute && !isValidRoute(pathname)) {
        url.pathname = '/dashboard';
        return NextResponse.redirect(url);
      }
      
      if (isClientDashboardRoute && !isValidClientRoute(pathname)) {
        url.pathname = '/client-dashboard';
        return NextResponse.redirect(url);
      }
      
      // Si c'est valide, ne pas rediriger
      return res;
    }
    
    // Rediriger seulement pour les routes principales des dashboards
    // Rediriger les clients qui tentent d'accéder au dashboard freelance
    if (role === 'client' && isDashboardRoute && pathname === '/dashboard') {
      url.pathname = '/client-dashboard';
      return NextResponse.redirect(url);
    }
    
    // Rediriger les freelances qui tentent d'accéder au dashboard client
    if (role === 'freelance' && isClientDashboardRoute && pathname === '/client-dashboard') {
      url.pathname = '/dashboard';
      return NextResponse.redirect(url);
    }
  }
  
  // Vérifier si l'utilisateur a accès à l'admin
  if (session && isAdminRoute) {
    const role = await getUserRole();
    
    if (role !== 'admin') {
      // Si l'utilisateur n'est pas admin, le rediriger vers une page d'erreur 403
      console.log('Accès administrateur refusé pour un utilisateur avec le rôle:', role);
      url.pathname = '/unauthorized';
      return NextResponse.redirect(url);
    } else {
      // Si c'est un admin et qu'il accède à une route admin valide, laisser passer
      console.log('Accès administrateur autorisé');
      return res;
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