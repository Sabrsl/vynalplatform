/**
 * Déclaration de types personnalisés pour Supabase
 */

// Référence au type Database défini dans le projet
type DatabaseDefinition = import('./database').Database;

// Déclaration pour les types Supabase
declare module '@supabase/supabase-js' {
  interface SupabaseClientOptions<
    SchemaName extends string = 'public',
  > {
    db?: {
      schema?: SchemaName;
    };
    auth?: {
      autoRefreshToken?: boolean;
      persistSession?: boolean;
      detectSessionInUrl?: boolean;
    };
    global?: {
      headers?: Record<string, string>;
      fetch?: typeof fetch;
    };
  }

  class SupabaseClient<
    Database = any,
    SchemaName extends string = 'public',
    Schema extends Record<string, any> = any
  > {
    constructor(
      supabaseUrl: string,
      supabaseKey: string,
      options?: SupabaseClientOptions<SchemaName>
    );
    // Méthodes communes du client Supabase
    from: any;
    rpc: any;
    auth: any;
    storage: any;
    functions: any;
    channel: any;
    // ... autres méthodes ...
  }

  // Ré-exporter la classe pour la rendre utilisable avec import
  export { SupabaseClient };
}

// Déclaration pour les helpers nextjs de Supabase
declare module '@supabase/auth-helpers-nextjs' {
  import { SupabaseClient } from '@supabase/supabase-js';
  
  export function createClientComponentClient<
    Database = DatabaseDefinition,
    SchemaName extends string = 'public',
    Schema extends Record<string, any> = any
  >(options?: any): SupabaseClient<Database, SchemaName, Schema>;
  
  export function createRouteHandlerClient<
    Database = DatabaseDefinition,
    SchemaName extends string = 'public',
    Schema extends Record<string, any> = any
  >(context: any, options?: any): SupabaseClient<Database, SchemaName, Schema>;
  
  export function createMiddlewareClient<
    Database = DatabaseDefinition,
    SchemaName extends string = 'public',
    Schema extends Record<string, any> = any
  >(context: any, options?: any): SupabaseClient<Database, SchemaName, Schema>;
}

// Extension pour les types d'authentification
declare module '@supabase/gotrue-js' {
  interface User {
    app_metadata: {
      provider?: string;
      [key: string]: any;
    };
    user_metadata: {
      name?: string;
      avatar_url?: string;
      [key: string]: any;
    };
  }
}