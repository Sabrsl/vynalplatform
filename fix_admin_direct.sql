-- Créer un index sur la colonne role de la table profiles pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Créer une vue pour simplifier les vérifications d'administrateur
CREATE OR REPLACE VIEW admin_users AS
SELECT id FROM profiles WHERE role = 'admin';

-- Mettre à jour la fonction is_admin de manière plus directe
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
DECLARE
  admin_status BOOLEAN;
BEGIN
  -- Utilisation directe d'une requête sans récursion possible
  SELECT EXISTS (
    SELECT 1 FROM admin_users WHERE id = auth.uid()
  ) INTO admin_status;
  
  RETURN admin_status;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Créer une politique directe pour donner tous les droits aux administrateurs
-- Cette politique est appliquée sans utiliser is_admin() pour éviter les problèmes de récursion
DO $$
BEGIN
  -- Vérifier si les politiques existent déjà pour éviter les erreurs
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admin direct access') THEN
    EXECUTE 'CREATE POLICY "Admin direct access" ON profiles FOR ALL TO authenticated USING (auth.uid() IN (SELECT id FROM admin_users))';
  END IF;
END
$$;

-- Corriger les droits d'accès pour certaines tables critiques
DO $$
DECLARE
  critical_tables TEXT[] := ARRAY['categories', 'subcategories', 'services', 'orders', 'wallets'];
  t TEXT;
BEGIN
  FOREACH t IN ARRAY critical_tables
  LOOP
    EXECUTE format('
      CREATE POLICY IF NOT EXISTS "Admin direct access %s" 
      ON %I FOR ALL TO authenticated 
      USING (auth.uid() IN (SELECT id FROM admin_users))
      WITH CHECK (auth.uid() IN (SELECT id FROM admin_users));
    ', t, t);
  END LOOP;
END
$$; 