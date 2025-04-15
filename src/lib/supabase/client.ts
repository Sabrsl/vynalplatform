import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/database';

// Ce client est utilisé côté client (browser)
export function createClient() {
  return createClientComponentClient({});
}

// Helper pour faciliter l'utilisation
export const supabase = createClient(); 