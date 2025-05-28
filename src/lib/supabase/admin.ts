import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';

// Ce client est utilisé côté serveur avec des droits d'admin (service_role)
// Il permet d'outrepasser les règles RLS pour des opérations spécifiques
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
); 