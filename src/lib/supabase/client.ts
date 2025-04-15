import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/database';

// Ce client est utilisé côté client (browser)
export const createClient = () => {
  return createClientComponentClient<Database>();
};

// Helper pour faciliter l'utilisation
export const supabase = createClient(); 