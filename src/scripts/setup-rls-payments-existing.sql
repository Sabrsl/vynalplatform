-- Script pour configurer les règles RLS (Row Level Security) pour la table payments existante
-- Exécutez ce script dans l'interface SQL de Supabase

-- 1. Activer RLS sur la table payments
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- 2. Politique permettant aux utilisateurs de lire leurs propres paiements
DROP POLICY IF EXISTS "Les utilisateurs peuvent voir leurs propres paiements" ON public.payments;
CREATE POLICY "Les utilisateurs peuvent voir leurs propres paiements"
ON public.payments
FOR SELECT
USING (
  auth.uid() = client_id
  OR auth.uid() = freelance_id
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- 3. Politique pour l'insertion de paiements
DROP POLICY IF EXISTS "Les utilisateurs peuvent créer leurs propres paiements" ON public.payments;
CREATE POLICY "Les utilisateurs peuvent créer leurs propres paiements"
ON public.payments
FOR INSERT
WITH CHECK (
  auth.uid() = client_id
);

-- 4. Politique pour la mise à jour de paiements
DROP POLICY IF EXISTS "Les utilisateurs peuvent mettre à jour leurs propres paiements" ON public.payments;
CREATE POLICY "Les utilisateurs peuvent mettre à jour leurs propres paiements"
ON public.payments
FOR UPDATE
USING (
  auth.uid() = client_id
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- 5. Politique pour la suppression de paiements (restreinte aux administrateurs)
DROP POLICY IF EXISTS "Seuls les administrateurs peuvent supprimer des paiements" ON public.payments;
CREATE POLICY "Seuls les administrateurs peuvent supprimer des paiements"
ON public.payments
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- 6. Vue pour les administrateurs présentant un résumé des paiements
CREATE OR REPLACE VIEW payment_summary AS
SELECT
  date_trunc('day', created_at) AS day,
  COUNT(*) AS total_payments,
  COUNT(CASE WHEN status = 'paid' THEN 1 END) AS successful_payments,
  COUNT(CASE WHEN status = 'failed' THEN 1 END) AS failed_payments,
  SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) AS total_amount
FROM public.payments
GROUP BY date_trunc('day', created_at)
ORDER BY day DESC;

-- 7. Accorder les permissions nécessaires à la vue
GRANT SELECT ON payment_summary TO authenticated;

-- 8. Fonction pour vérifier le statut d'un paiement
CREATE OR REPLACE FUNCTION get_payment_status(payment_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
  user_id UUID;
BEGIN
  user_id := auth.uid();
  
  -- Vérifier que l'utilisateur a accès à ce paiement
  IF NOT EXISTS (
    SELECT 1 FROM public.payments
    WHERE id = payment_id AND (client_id = user_id OR freelance_id = user_id)
  ) THEN
    RETURN jsonb_build_object('error', 'Payment not found or access denied');
  END IF;
  
  -- Récupérer les informations du paiement
  SELECT jsonb_build_object(
    'id', p.id,
    'status', p.status,
    'amount', p.amount,
    'order_id', p.order_id,
    'created_at', p.created_at,
    'updated_at', p.updated_at,
    'payment_method', p.payment_method,
    'payment_intent_id', p.payment_intent_id
  ) INTO result
  FROM public.payments p
  WHERE p.id = payment_id;
  
  RETURN result;
END;
$$; 