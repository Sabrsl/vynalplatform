import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { nanoid } from 'nanoid';

export function csrfMiddleware(request: NextRequest) {
  // Ne pas appliquer le middleware pour les requêtes GET
  if (request.method === 'GET') {
    return NextResponse.next();
  }

  const csrfToken = request.headers.get('x-csrf-token');
  const storedToken = request.cookies.get('csrf_token')?.value;

  if (!csrfToken || !storedToken || csrfToken !== storedToken) {
    return new NextResponse(
      JSON.stringify({ error: 'Invalid CSRF token' }),
      { status: 403 }
    );
  }

  return NextResponse.next();
}

export function generateCsrfToken() {
  return nanoid();
} 