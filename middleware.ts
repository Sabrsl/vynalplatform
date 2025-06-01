import { NextRequest, NextResponse } from "next/server";
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";

// En-têtes de sécurité pré-calculés (seule optimisation valable)
const SECURITY_HEADERS = {
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
  "Content-Security-Policy": [
    "default-src 'self'",
    "script-src 'self' https://js.stripe.com https://statics.link.com https://applepay.cdn-apple.com https://pay.google.com 'unsafe-inline'",
    "connect-src 'self' https://*.supabase.co https://api.stripe.com https://applepay.cdn-apple.com https://pay.google.com",
    "img-src 'self' data: https://*.stripe.com https://*.supabase.co https://applepay.cdn-apple.com https://pay.google.com",
    "style-src 'self' 'unsafe-inline'",
    "font-src 'self' https://fonts.gstatic.com",
    "frame-src https://js.stripe.com https://hooks.stripe.com https://applepay.cdn-apple.com https://pay.google.com",
    "object-src 'none'",
  ].join("; "),
};

/**
 * Middleware léger et performant
 */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const hostname = req.headers.get('host') || '';
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://vynalplatform.com';
  const siteHostname = new URL(siteUrl).hostname;

  // 1. Bypass immédiat pour les ressources statiques (le plus rapide possible)
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/public") ||
    pathname === "/api/stripe/webhook" ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|css|js|woff2?)$/)
  ) {
    return NextResponse.next();
  }

  // 2. Rediriger les URL non canoniques vers l'URL canonique
  if (hostname !== siteHostname && !hostname.includes('localhost')) {
    const url = new URL(pathname, siteUrl);
    url.search = req.nextUrl.search;
    return NextResponse.redirect(url.toString(), 301);
  }

  // 3. Rediriger les chemins sans slash final vers la version avec slash final pour l'URL racine
  if (pathname === '' && !req.nextUrl.pathname.endsWith('/')) {
    const url = req.nextUrl.clone();
    url.pathname = url.pathname + '/';
    return NextResponse.redirect(url);
  }

  // 4. Créer réponse avec headers de sécurité
  const response = NextResponse.next();
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // 5. Protection CSRF simple pour les APIs modifiantes
  if (
    pathname.startsWith("/api/") &&
    ["POST", "PUT", "DELETE", "PATCH"].includes(req.method)
  ) {
    const origin = req.headers.get("origin");
    const host = req.headers.get("host");

    if (!origin || !host || !origin.includes(host)) {
      return NextResponse.json({ error: "CSRF detected" }, { status: 403 });
    }
  }

  // 6. Auth check pour routes protégées uniquement
  if (
    pathname.startsWith("/checkout") ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/account")
  ) {
    try {
      const supabase = createMiddlewareClient({ req, res: response });
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        const url = req.nextUrl.clone();
        url.pathname = "/auth/sign-in";
        url.searchParams.set("from", pathname);
        return NextResponse.redirect(url);
      }
    } catch (error) {
      console.error("Auth error:", error);
      const url = req.nextUrl.clone();
      url.pathname = "/auth/sign-in";
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|css|js|woff|woff2)$).*)",
  ],
};
