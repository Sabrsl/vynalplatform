-- Fonction pour créer la fonction d'incrémentation
CREATE OR REPLACE FUNCTION public.create_increment_value_function()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Vérifier si la fonction existe déjà
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc 
    JOIN pg_namespace ON pg_namespace.oid = pg_proc.pronamespace
    WHERE proname = 'increment_value' 
    AND nspname = 'public'
  ) THEN
    -- Créer la fonction increment_value
    EXECUTE '
      CREATE OR REPLACE FUNCTION public.increment_value(
        table_name text,
        column_name text,
        row_id uuid,
        increment_amount numeric
      )
      RETURNS numeric
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $func$
      DECLARE
        current_value numeric;
        new_value numeric;
        query text;
      BEGIN
        -- Construire et exécuter la requête pour obtenir la valeur actuelle
        query := format(''SELECT %I FROM %I WHERE id = $1'', column_name, table_name);
        EXECUTE query INTO current_value USING row_id;
        
        -- Calculer la nouvelle valeur
        new_value := COALESCE(current_value, 0) + increment_amount;
        
        RETURN new_value;
      END;
      $func$;
    ';
  END IF;
END;
$$;

-- Fonction pour créer la fonction de décrémentation
CREATE OR REPLACE FUNCTION public.create_decrement_value_function()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Vérifier si la fonction existe déjà
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc 
    JOIN pg_namespace ON pg_namespace.oid = pg_proc.pronamespace
    WHERE proname = 'decrement_value' 
    AND nspname = 'public'
  ) THEN
    -- Créer la fonction decrement_value
    EXECUTE '
      CREATE OR REPLACE FUNCTION public.decrement_value(
        table_name text,
        column_name text,
        row_id uuid,
        decrement_amount numeric
      )
      RETURNS numeric
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $func$
      DECLARE
        current_value numeric;
        new_value numeric;
        query text;
      BEGIN
        -- Construire et exécuter la requête pour obtenir la valeur actuelle
        query := format(''SELECT %I FROM %I WHERE id = $1'', column_name, table_name);
        EXECUTE query INTO current_value USING row_id;
        
        -- Calculer la nouvelle valeur
        new_value := COALESCE(current_value, 0) - decrement_amount;
        
        -- Empêcher les valeurs négatives
        IF new_value < 0 THEN
          new_value := 0;
        END IF;
        
        RETURN new_value;
      END;
      $func$;
    ';
  END IF;
END;
$$; 