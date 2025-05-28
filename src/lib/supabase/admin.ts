import { createClient } from '@supabase/supabase-js';
// import { Database } from '@/types/database'; // Imports inutilisÃ©s: Database

// Ce client est utilisÃ© cÃ´tÃ© serveur avec des droits d'admin (service_role)
// Il permet d'outrepasser les rÃ¨gles RLS pour des opÃ©rations spÃ©cifiques
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
); 
