/**
 * Déclaration de types personnalisés pour Supabase
 */

// Forcer TypeScript à traiter les modules comme des modules avec types
declare module '@supabase/supabase-js';
declare module '@supabase/auth-helpers-nextjs' {
  import { SupabaseClient } from '@supabase/supabase-js';
  import { Database } from '../types/database';
  
  export function createClientComponentClient(options?: any): SupabaseClient<Database>;
  export function createRouteHandlerClient(context: any, options?: any): SupabaseClient<Database>;
  export function createMiddlewareClient(context: any, options?: any): SupabaseClient<Database>;
}