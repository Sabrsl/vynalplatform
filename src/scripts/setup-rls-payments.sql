-- Script pour configurer les règles RLS (Row Level Security) pour les paiements
-- Exécutez ce script dans l'interface SQL de Supabase

-- 1. Assurez-vous que la table payment_intents existe
CREATE TABLE IF NOT EXISTS payment_intents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  client_id UUID NOT NULL REFERENCES auth.users(id),
  freelance_id UUID NOT NULL REFERENCES auth.users(id),
  service_id UUID NOT NULL REFERENCES services(id),
  amount BIGINT NOT NULL,
  currency TEXT DEFAULT 'eur',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded', 'canceled')),
  stripe_payment_intent_id TEXT,
  client_secret TEXT,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- 2. Activer RLS sur la table payment_intents
ALTER TABLE payment_intents ENABLE ROW LEVEL SECURITY;

-- 3. Créer un déclencheur pour mettre à jour le champ updated_at
CREATE OR REPLACE FUNCTION update_payment_intents_updated_at()
RETURNS TRIGGER AS $BODY$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$BODY$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_payment_intents_updated_at ON payment_intents;
CREATE TRIGGER set_payment_intents_updated_at
BEFORE UPDATE ON payment_intents
FOR EACH ROW
EXECUTE FUNCTION update_payment_intents_updated_at();

-- 4. Politique permettant aux utilisateurs de lire leurs propres paiements
DROP POLICY IF EXISTS "Les utilisateurs peuvent voir leurs propres paiements" ON payment_intents;
CREATE POLICY "Les utilisateurs peuvent voir leurs propres paiements"
ON payment_intents
FOR SELECT
USING (
  auth.uid() = client_id
  OR auth.uid() = freelance_id
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- 5. Politique pour l'insertion de paiements
DROP POLICY IF EXISTS "Les utilisateurs peuvent créer leurs propres paiements" ON payment_intents;
CREATE POLICY "Les utilisateurs peuvent créer leurs propres paiements"
ON payment_intents
FOR INSERT
WITH CHECK (
  auth.uid() = client_id
);

-- 6. Politique pour la mise à jour de paiements
DROP POLICY IF EXISTS "Les utilisateurs peuvent mettre à jour leurs propres paiements" ON payment_intents;
CREATE POLICY "Les utilisateurs peuvent mettre à jour leurs propres paiements"
ON payment_intents
FOR UPDATE
USING (
  auth.uid() = client_id
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- 7. Politique pour la suppression de paiements (restreinte aux administrateurs)
DROP POLICY IF EXISTS "Seuls les administrateurs peuvent supprimer des paiements" ON payment_intents;
CREATE POLICY "Seuls les administrateurs peuvent supprimer des paiements"
ON payment_intents
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- 8. Index pour améliorer les performances des requêtes
CREATE INDEX IF NOT EXISTS payment_intents_client_id_idx ON payment_intents (client_id);
CREATE INDEX IF NOT EXISTS payment_intents_freelance_id_idx ON payment_intents (freelance_id);
CREATE INDEX IF NOT EXISTS payment_intents_service_id_idx ON payment_intents (service_id);
CREATE INDEX IF NOT EXISTS payment_intents_status_idx ON payment_intents (status);
CREATE INDEX IF NOT EXISTS payment_intents_stripe_id_idx ON payment_intents (stripe_payment_intent_id);

-- 9. Vue pour les administrateurs présentant un résumé des paiements
CREATE OR REPLACE VIEW payment_summary AS
SELECT
  date_trunc('day', created_at) AS day,
  COUNT(*) AS total_payments,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) AS successful_payments,
  COUNT(CASE WHEN status = 'failed' THEN 1 END) AS failed_payments,
  SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) / 100.0 AS total_amount
FROM payment_intents
GROUP BY date_trunc('day', created_at)
ORDER BY day DESC;

-- 10. Accorder les permissions nécessaires à la vue
GRANT SELECT ON payment_summary TO authenticated;

-- 11. Fonction pour vérifier le statut d'un paiement
CREATE OR REPLACE FUNCTION get_payment_status(payment_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $BODY$
DECLARE
  result JSONB;
  user_id UUID;
BEGIN
  user_id := auth.uid();
  
  -- Vérifier que l'utilisateur a accès à ce paiement
  IF NOT EXISTS (
    SELECT 1 FROM payment_intents
    WHERE id = payment_id AND (client_id = user_id OR freelance_id = user_id)
  ) THEN
    RETURN jsonb_build_object('error', 'Payment not found or access denied');
  END IF;
  
  -- Récupérer les informations du paiement
  SELECT jsonb_build_object(
    'id', p.id,
    'status', p.status,
    'amount', p.amount / 100.0,
    'currency', p.currency,
    'created_at', p.created_at,
    'updated_at', p.updated_at,
    'service_id', p.service_id
  ) INTO result
  FROM payment_intents p
  WHERE p.id = payment_id;
  
  RETURN result;
END;
$BODY$; 