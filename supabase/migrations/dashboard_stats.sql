-- Fonction RPC pour récupérer toutes les statistiques du dashboard en un seul appel
-- Cela évite la cascade de requêtes qui fait planter l'application
-- Les paramètres sont:
--   p_user_id - l'ID de l'utilisateur
--   p_user_role - le rôle de l'utilisateur ('client' ou 'freelance')

CREATE OR REPLACE FUNCTION get_dashboard_stats(
  p_user_id UUID,
  p_user_role TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSONB;
  client_id_field TEXT := 'client_id';
  freelance_id_field TEXT := 'freelance_id';
  active_orders_count INT;
  unread_messages_count INT;
  pending_deliveries_count INT;
  pending_reviews_count INT;
  total_earnings DECIMAL;
  services_count INT;
BEGIN
  -- Vérifier que le rôle est valide
  IF p_user_role NOT IN ('client', 'freelance') THEN
    RAISE EXCEPTION 'Rôle invalide: %', p_user_role;
  END IF;

  -- Compter les messages non lus pour tous les utilisateurs
  SELECT COUNT(*)
  INTO unread_messages_count
  FROM messages
  WHERE receiver_id = p_user_id AND read = false;

  -- Requêtes spécifiques selon le rôle
  IF p_user_role = 'client' THEN
    -- Commandes actives pour le client
    SELECT COUNT(*)
    INTO active_orders_count
    FROM orders
    WHERE client_id = p_user_id
    AND status IN ('pending', 'in_progress', 'revision_requested');
    
    -- Livraisons en attente pour le client
    SELECT COUNT(*)
    INTO pending_deliveries_count
    FROM orders
    WHERE client_id = p_user_id
    AND status = 'delivered'
    AND completed_at IS NULL;
    
    -- Commandes complétées sans avis
    SELECT COUNT(*)
    INTO pending_reviews_count
    FROM orders
    WHERE client_id = p_user_id
    AND status = 'completed'
    AND has_review = false;
    
    -- Construire le résultat pour le client
    result := jsonb_build_object(
      'active_orders', active_orders_count,
      'unread_messages', unread_messages_count,
      'pending_deliveries', pending_deliveries_count,
      'pending_reviews', pending_reviews_count
    );
  ELSE
    -- Commandes actives pour le freelance
    SELECT COUNT(*)
    INTO active_orders_count
    FROM orders
    WHERE freelance_id = p_user_id
    AND status IN ('pending', 'in_progress', 'revision_requested');
    
    -- Livraisons en attente de validation
    SELECT COUNT(*)
    INTO pending_deliveries_count
    FROM orders
    WHERE freelance_id = p_user_id
    AND status = 'delivered'
    AND completed_at IS NULL;
    
    -- Compter les services proposés
    SELECT COUNT(*)
    INTO services_count
    FROM services
    WHERE freelance_id = p_user_id;
    
    -- Calculer les gains totaux
    SELECT COALESCE(SUM(amount), 0)
    INTO total_earnings
    FROM orders
    WHERE freelance_id = p_user_id
    AND status = 'completed';
    
    -- Construire le résultat pour le freelance
    result := jsonb_build_object(
      'active_orders', active_orders_count,
      'unread_messages', unread_messages_count,
      'pending_deliveries', pending_deliveries_count,
      'total_earnings', total_earnings,
      'services_count', services_count
    );
  END IF;

  RETURN result;
END;
$$; 