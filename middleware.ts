import { NextRequest, NextResponse } from 'next/server';

// Configuration pour les en-têtes de sécurité
export function middleware(request: NextRequest) {
  // Créer une copie de la réponse
  const response = NextResponse.next();

  // Ajouter des en-têtes de sécurité
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'same-origin');
  
  // Ajout d'en-têtes de sécurité supplémentaires
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  return response;
}

// Limiter l'application de ce middleware aux routes du dashboard
export const config = {
  matcher: ['/dashboard/:path*'],
}; 