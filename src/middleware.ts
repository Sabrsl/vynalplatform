import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Types pour améliorer la robustesse du code
type UserRole = 'client' | 'freelance' | 'admin';
type CacheEntry = { role: UserRole; timestamp: number };
type RouteValidation = { isValid: boolean; fallback: string };
interface UserSession {
  user?: {
    id?: string;
    user_metadata?: {
      role?: UserRole;
    };
  };
}

// Cache optimisé avec nettoyage automatique
const roleCache = new Map<string, CacheEntry>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Routes publiques (pas d'auth requise)
const PUBLIC_ROUTES = new Set(['/', '/services', '/about', '/how-it-works', '/contact']);

// Validation des routes (version optimisée mais complète)
const VALID_ROUTES = {
  dashboard: new Set([
    '/dashboard', '/dashboard/orders', '/dashboard/messages', '/dashboard/disputes',
    '/dashboard/payments', '/dashboard/wallet', '/dashboard/wallet/withdraw',
    '/dashboard/services', '/dashboard/services/new', '/dashboard/services/edit',
    '/dashboard/profile', '/dashboard/stats', '/dashboard/certifications',
    '/dashboard/resources', '/dashboard/support', '/dashboard/settings', '/dashboard/help'
  ]),
  clientDashboard: new Set([
    '/client-dashboard', '/client-dashboard/orders', '/client-dashboard/messages',
    '/client-dashboard/disputes', '/client-dashboard/payments', 
    '/client-dashboard/profile', '/client-dashboard/settings'
  ])
};

/**
 * Middleware d'authentification optimisé SANS casser les fonctionnalités
 */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  
  // 1. Early return pour routes publiques (le plus rapide)
  if (PUBLIC_ROUTES.has(pathname) || pathname.startsWith('/api/')) {
    return NextResponse.next();
  }
  
  // 2. Récupérer la session une seule fois
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });
  const { data: { session } } = await supabase.auth.getSession();
  
  // 3. Déterminer le type de route et agir
  if (pathname.startsWith('/auth')) {
    return handleAuthRoute(req, session, supabase);
  }
  
  if (isProtectedRoute(pathname)) {
    return handleProtectedRoute(req, session, supabase, pathname);
  }
  
  return res;
}

/**
 * Vérifie si c'est une route protégée
 */
function isProtectedRoute(pathname: string): boolean {
  return pathname.startsWith('/dashboard') || 
         pathname.startsWith('/client-dashboard') || 
         pathname.startsWith('/admin');
}

/**
 * Validation rapide des routes avec support des routes dynamiques
 */
function isValidRoute(pathname: string): RouteValidation {
  // Routes dashboard
  if (pathname.startsWith('/dashboard')) {
    // Route exacte
    if (VALID_ROUTES.dashboard.has(pathname)) {
      return { isValid: true, fallback: '/dashboard' };
    }
    
    // Routes dynamiques (optimisé avec regex plus robuste)
    if (/^\/dashboard\/(services|orders)\/[a-zA-Z0-9_-]+$/.test(pathname) ||
        /^\/dashboard\/services\/edit\/[a-zA-Z0-9_-]+$/.test(pathname)) {
      return { isValid: true, fallback: '/dashboard' };
    }
    
    return { isValid: false, fallback: '/dashboard' };
  }
  
  // Routes client dashboard
  if (pathname.startsWith('/client-dashboard')) {
    // Route exacte
    if (VALID_ROUTES.clientDashboard.has(pathname)) {
      return { isValid: true, fallback: '/client-dashboard' };
    }
    
    // Routes dynamiques avec regex améliorée
    if (/^\/client-dashboard\/orders\/[a-zA-Z0-9_-]+$/.test(pathname)) {
      return { isValid: true, fallback: '/client-dashboard' };
    }
    
    return { isValid: false, fallback: '/client-dashboard' };
  }
  
  // Admin routes (toutes valides par défaut)
  if (pathname.startsWith('/admin')) {
    return { isValid: true, fallback: '/admin' };
  }
  
  return { isValid: true, fallback: '/' };
}

/**
 * Gère les routes d'authentification
 */
async function handleAuthRoute(
  req: NextRequest, 
  session: UserSession | null, 
  supabase: any
): Promise<NextResponse> {
  if (!session) {
    return NextResponse.next();
  }
  
  // Utilisateur connecté, rediriger selon son rôle
  const role = await getUserRole(session, supabase);
  const url = req.nextUrl.clone();
  
  url.pathname = role === 'client' ? '/client-dashboard' : 
                 role === 'admin' ? '/admin' : '/dashboard';
  
  return NextResponse.redirect(url);
}

/**
 * Gère les routes protégées avec validation complète
 */
async function handleProtectedRoute(
  req: NextRequest,
  session: UserSession | null,
  supabase: any,
  pathname: string
): Promise<NextResponse> {
  const url = req.nextUrl.clone();
  
  // Pas de session = redirection vers login
  if (!session) {
    url.pathname = '/auth/login';
    
    // Valider la route avant de la mettre en redirectTo
    const { isValid, fallback } = isValidRoute(pathname);
    url.searchParams.set('redirectTo', isValid ? pathname : fallback);
    
    return NextResponse.redirect(url);
  }
  
  // Récupérer le rôle une seule fois
  const role = await getUserRole(session, supabase);
  
  // Validation des routes + gestion des permissions
  const { isValid, fallback } = isValidRoute(pathname);
  
  // Route invalide = redirection vers fallback
  if (!isValid) {
    url.pathname = fallback;
    return NextResponse.redirect(url);
  }
  
  // Vérifier les permissions selon la route
  if (pathname.startsWith('/admin')) {
    if (role !== 'admin') {
      url.pathname = '/unauthorized';
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }
  
  if (pathname.startsWith('/client-dashboard')) {
    if (role === 'freelance') {
      url.pathname = '/dashboard';
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }
  
  if (pathname.startsWith('/dashboard')) {
    if (role === 'client') {
      url.pathname = '/client-dashboard';
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }
  
  return NextResponse.next();
}

/**
 * Récupère le rôle utilisateur avec cache optimisé
 * UN SEUL APPEL par requête, cache intelligent
 */
async function getUserRole(
  session: UserSession | null, 
  supabase: any
): Promise<UserRole> {
  const userId = session?.user?.id;
  if (!userId) return 'freelance';
  
  // Vérifier le cache
  const cached = roleCache.get(userId);
  const now = Date.now();
  
  if (cached && (now - cached.timestamp) < CACHE_TTL) {
    return cached.role;
  }
  
  // Nettoyer le cache si nécessaire
  if (roleCache.size > 100) {
    cleanExpiredCache();
  }
  
  try {
    // 1. Métadonnées utilisateur (le plus rapide)
    const metadataRole = session.user?.user_metadata?.role;
    if (metadataRole && isValidRole(metadataRole)) {
      roleCache.set(userId, { role: metadataRole, timestamp: now });
      return metadataRole;
    }
    
    // 2. RPC Supabase
    const { data: rpcRole, error: rpcError } = await supabase.rpc('get_user_role');
    if (rpcError) {
      console.warn('Erreur RPC get_user_role:', rpcError.message);
    } else if (rpcRole && isValidRole(rpcRole)) {
      roleCache.set(userId, { role: rpcRole, timestamp: now });
      return rpcRole;
    }
    
    // 3. Table profiles fallback
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();
    
    if (profileError) {
      console.warn('Erreur récupération profil:', profileError.message);
    }
    
    const finalRole = profile?.role && isValidRole(profile.role) 
      ? profile.role 
      : 'freelance';
    
    roleCache.set(userId, { role: finalRole, timestamp: now });
    return finalRole;
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Erreur critique récupération rôle:', errorMessage);
    const defaultRole: UserRole = 'freelance';
    roleCache.set(userId, { role: defaultRole, timestamp: now });
    return defaultRole;
  }
}

/**
 * Vérifie si une valeur est un rôle valide
 */
function isValidRole(role: any): role is UserRole {
  return ['client', 'freelance', 'admin'].includes(role);
}

/**
 * Nettoie les entrées expirées du cache
 */
function cleanExpiredCache(): void {
  const now = Date.now();
  const expiredKeys: string[] = [];
  
  roleCache.forEach((value, key) => {
    if (now - value.timestamp > CACHE_TTL) {
      expiredKeys.push(key);
    }
  });
  
  expiredKeys.forEach(key => roleCache.delete(key));
}

// Configuration matcher
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/client-dashboard/:path*', 
    '/admin/:path*',
    '/auth/:path*'
  ],
};