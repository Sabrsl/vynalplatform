-- Fonction pour créer la table de demandes de retrait si elle n'existe pas déjà
CREATE OR REPLACE FUNCTION public.create_withdrawal_requests_if_not_exists()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Vérifier si la table existe déjà
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'withdrawal_requests') THEN
    -- Créer la table si elle n'existe pas
    EXECUTE '
      CREATE TABLE public.withdrawal_requests (
        id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
        created_at timestamp with time zone NOT NULL DEFAULT now(),
        updated_at timestamp with time zone NOT NULL DEFAULT now(),
        user_id uuid NOT NULL,
        wallet_id uuid NOT NULL,
        amount numeric(10, 2) NOT NULL,
        fee_amount numeric(10, 2) NOT NULL,
        net_amount numeric(10, 2) NOT NULL,
        payment_method text NOT NULL,
        status text NOT NULL DEFAULT ''pending'',
        notes text,
        processed_by uuid,
        processed_at timestamp with time zone,
        payment_reference text,
        CONSTRAINT withdrawal_requests_pkey PRIMARY KEY (id),
        CONSTRAINT withdrawal_requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE,
        CONSTRAINT withdrawal_requests_wallet_id_fkey FOREIGN KEY (wallet_id) REFERENCES wallets(id) ON DELETE CASCADE,
        CONSTRAINT withdrawal_requests_processed_by_fkey FOREIGN KEY (processed_by) REFERENCES profiles(id) ON DELETE SET NULL
      );
      
      CREATE INDEX idx_withdrawal_requests_user_id ON public.withdrawal_requests USING btree (user_id);
      CREATE INDEX idx_withdrawal_requests_wallet_id ON public.withdrawal_requests USING btree (wallet_id);
      CREATE INDEX idx_withdrawal_requests_status ON public.withdrawal_requests USING btree (status);
      
      CREATE TRIGGER update_withdrawal_requests_updated_at
      BEFORE UPDATE ON public.withdrawal_requests
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at();
    ';
    
    -- Ajout des politiques RLS
    EXECUTE '
      ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;
      
      -- Politique pour les utilisateurs (freelances) - voir uniquement leurs propres demandes
      CREATE POLICY "Les utilisateurs peuvent voir leurs propres demandes de retrait"
      ON public.withdrawal_requests FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
      
      -- Politique pour les utilisateurs (freelances) - créer uniquement leurs propres demandes
      CREATE POLICY "Les utilisateurs peuvent créer leurs propres demandes de retrait"
      ON public.withdrawal_requests FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
      
      -- Politique pour les administrateurs - voir toutes les demandes
      CREATE POLICY "Les administrateurs peuvent voir toutes les demandes de retrait"
      ON public.withdrawal_requests FOR ALL
      TO authenticated
      USING (EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = ''admin''
      ));
    ';
  END IF;
END;
$$; 