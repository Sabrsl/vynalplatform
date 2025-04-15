-- Enable les extensions nécessaires
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Création de la table des profils
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  role TEXT NOT NULL CHECK (role IN ('client', 'freelance', 'admin')),
  email TEXT
);

-- Création de la table des catégories
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE
);

-- Création de la table des sous-catégories
CREATE TABLE subcategories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  category_id UUID NOT NULL REFERENCES categories ON DELETE CASCADE
);

-- Création de la table des services
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  delivery_time INTEGER NOT NULL, -- en jours
  category_id UUID NOT NULL REFERENCES categories ON DELETE CASCADE,
  subcategory_id UUID REFERENCES subcategories ON DELETE SET NULL,
  freelance_id UUID NOT NULL REFERENCES profiles ON DELETE CASCADE,
  active BOOLEAN DEFAULT TRUE NOT NULL
);

-- Création de la table des commandes
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  client_id UUID NOT NULL REFERENCES profiles ON DELETE CASCADE,
  freelance_id UUID NOT NULL REFERENCES profiles ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed', 'delivered', 'revision_requested', 'cancelled')) DEFAULT 'pending',
  price DECIMAL(10, 2) NOT NULL,
  delivery_time INTEGER NOT NULL, -- en jours
  requirements TEXT,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Création de la table des paiements
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  order_id UUID NOT NULL REFERENCES orders ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES profiles ON DELETE CASCADE,
  freelance_id UUID NOT NULL REFERENCES profiles ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'paid', 'refunded')) DEFAULT 'pending',
  payment_method TEXT NOT NULL
);

-- Création de la table des messages
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  order_id UUID NOT NULL REFERENCES orders ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles ON DELETE CASCADE,
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE NOT NULL
);

-- Création de la table des avis
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  order_id UUID NOT NULL UNIQUE REFERENCES orders ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES profiles ON DELETE CASCADE,
  freelance_id UUID NOT NULL REFERENCES profiles ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT
);

-- Création de la table des favoris
CREATE TABLE favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  client_id UUID NOT NULL REFERENCES profiles ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services ON DELETE CASCADE,
  UNIQUE (client_id, service_id)
);

-- Création de la table des wallets
CREATE TABLE wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  user_id UUID NOT NULL UNIQUE REFERENCES profiles ON DELETE CASCADE,
  balance DECIMAL(10, 2) NOT NULL DEFAULT 0.00
);

-- Création de la table des transactions
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  wallet_id UUID NOT NULL REFERENCES wallets ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'payment', 'earning')),
  description TEXT NOT NULL,
  reference_id UUID
);

-- Création de la table des disputes
CREATE TABLE disputes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  order_id UUID NOT NULL UNIQUE REFERENCES orders ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES profiles ON DELETE CASCADE,
  freelance_id UUID NOT NULL REFERENCES profiles ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('open', 'resolved', 'closed')) DEFAULT 'open',
  reason TEXT NOT NULL,
  resolution TEXT,
  resolved_by UUID REFERENCES profiles
);

-- Fonctions et déclencheurs

-- Trigger pour mettre à jour les champs updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Appliquer le trigger à chaque table avec updated_at
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON profiles
FOR EACH ROW EXECUTE PROCEDURE update_updated_at();

CREATE TRIGGER update_services_updated_at
BEFORE UPDATE ON services
FOR EACH ROW EXECUTE PROCEDURE update_updated_at();

CREATE TRIGGER update_orders_updated_at
BEFORE UPDATE ON orders
FOR EACH ROW EXECUTE PROCEDURE update_updated_at();

CREATE TRIGGER update_payments_updated_at
BEFORE UPDATE ON payments
FOR EACH ROW EXECUTE PROCEDURE update_updated_at();

CREATE TRIGGER update_wallets_updated_at
BEFORE UPDATE ON wallets
FOR EACH ROW EXECUTE PROCEDURE update_updated_at();

CREATE TRIGGER update_disputes_updated_at
BEFORE UPDATE ON disputes
FOR EACH ROW EXECUTE PROCEDURE update_updated_at();

-- Créer automatiquement un wallet lors de la création d'un profil
CREATE OR REPLACE FUNCTION create_wallet_for_new_profile()
RETURNS TRIGGER AS $$
BEGIN
  -- Utiliser une structure try-catch pour éviter les erreurs
  BEGIN
    INSERT INTO wallets (user_id, created_at, updated_at, balance)
    VALUES (NEW.id, NOW(), NOW(), 0.00);
  EXCEPTION WHEN unique_violation THEN
    -- Si le wallet existe déjà, ne rien faire
    NULL;
  WHEN OTHERS THEN
    -- Logger l'erreur mais ne pas bloquer la création du profil
    RAISE WARNING 'Erreur lors de la création du wallet pour le profil %: %', NEW.id, SQLERRM;
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_profile_created
AFTER INSERT ON profiles
FOR EACH ROW EXECUTE PROCEDURE create_wallet_for_new_profile();

-- Créer automatiquement un profil lorsqu'un nouvel utilisateur s'inscrit
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  default_role TEXT;
BEGIN
  -- Récupérer le rôle depuis les métadonnées avec une gestion plus robuste
  BEGIN
    default_role := NEW.raw_user_meta_data->>'role';
    -- Vérifier que le rôle est valide
    IF default_role IS NULL OR default_role NOT IN ('client', 'freelance', 'admin') THEN
      default_role := 'client'; -- Valeur par défaut sécurisée
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- En cas d'erreur (format JSON incorrect, etc.), utiliser la valeur par défaut
    default_role := 'client';
  END;

  -- Créer le profil avec gestion d'erreur
  BEGIN
    INSERT INTO public.profiles (
      id, 
      email, 
      role,
      created_at,
      updated_at
    )
    VALUES (
      NEW.id,
      NEW.email,
      default_role,
      NOW(),
      NOW()
    );
  EXCEPTION WHEN unique_violation THEN
    -- Si le profil existe déjà, ne rien faire (évite les erreurs de duplication)
    RETURN NEW;
  WHEN OTHERS THEN
    -- Logger l'erreur mais permettre la continuation (ne pas bloquer la création de l'utilisateur)
    RAISE WARNING 'Erreur lors de la création du profil pour l''utilisateur %: %', NEW.id, SQLERRM;
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger qui s'exécute après l'ajout d'un nouvel utilisateur dans auth.users
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Mettre à jour l'email du profil lorsque l'email auth est modifié
CREATE OR REPLACE FUNCTION public.handle_user_email_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Utiliser une structure try-catch pour éviter les erreurs
  BEGIN
    UPDATE public.profiles
    SET 
      email = NEW.email,
      updated_at = NOW()
    WHERE id = NEW.id;
  EXCEPTION WHEN OTHERS THEN
    -- Logger l'erreur mais ne pas bloquer la mise à jour de l'email principal
    RAISE WARNING 'Erreur lors de la mise à jour de l''email du profil %: %', NEW.id, SQLERRM;
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_email_updated
AFTER UPDATE ON auth.users
FOR EACH ROW
WHEN (OLD.email IS DISTINCT FROM NEW.email)
EXECUTE PROCEDURE public.handle_user_email_update();

-- Politiques de sécurité (RLS)

-- Activer RLS sur toutes les tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;

-- Politiques pour profiles
CREATE POLICY "Les profils sont visibles par tous" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Les utilisateurs peuvent modifier leur propre profil" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Ajout des politiques permettant l'insertion dans profiles
CREATE POLICY "Service role peut insérer des profils" ON profiles
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Authenticated peut insérer son profil" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Service role peut mettre à jour n'importe quel profil" ON profiles
  FOR UPDATE USING (true);

-- Politiques pour catégories et sous-catégories
CREATE POLICY "Tout le monde peut voir les catégories" ON categories
  FOR SELECT USING (true);

CREATE POLICY "Seuls les admins peuvent modifier les catégories" ON categories
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Tout le monde peut voir les sous-catégories" ON subcategories
  FOR SELECT USING (true);

CREATE POLICY "Seuls les admins peuvent modifier les sous-catégories" ON subcategories
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Politiques pour services
CREATE POLICY "Tout le monde peut voir les services actifs" ON services
  FOR SELECT USING (active = true);

CREATE POLICY "Les freelances peuvent voir leurs services inactifs" ON services
  FOR SELECT USING (
    freelance_id = auth.uid()
  );

CREATE POLICY "Les freelances peuvent créer leurs services" ON services
  FOR INSERT WITH CHECK (
    freelance_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'freelance'
    )
  );

CREATE POLICY "Les freelances peuvent modifier leurs services" ON services
  FOR UPDATE USING (
    freelance_id = auth.uid()
  ) WITH CHECK (
    freelance_id = auth.uid()
  );

CREATE POLICY "Les freelances peuvent supprimer leurs services" ON services
  FOR DELETE USING (
    freelance_id = auth.uid()
  );

-- Politiques pour orders
CREATE POLICY "Les clients peuvent voir leurs commandes" ON orders
  FOR SELECT USING (
    client_id = auth.uid()
  );

CREATE POLICY "Les freelances peuvent voir les commandes qui leur sont assignées" ON orders
  FOR SELECT USING (
    freelance_id = auth.uid()
  );

CREATE POLICY "Les clients peuvent créer des commandes" ON orders
  FOR INSERT WITH CHECK (
    client_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'client'
    )
  );

CREATE POLICY "Les clients et freelances peuvent mettre à jour les commandes qui les concernent" ON orders
  FOR UPDATE USING (
    client_id = auth.uid() OR freelance_id = auth.uid()
  ) WITH CHECK (
    client_id = auth.uid() OR freelance_id = auth.uid()
  );

-- Politiques pour payments
CREATE POLICY "Les utilisateurs peuvent voir leurs paiements" ON payments
  FOR SELECT USING (
    client_id = auth.uid() OR freelance_id = auth.uid()
  );

CREATE POLICY "Les clients peuvent créer des paiements" ON payments
  FOR INSERT WITH CHECK (
    client_id = auth.uid()
  );

-- Politiques pour messages
CREATE POLICY "Les utilisateurs peuvent voir leurs messages" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE (orders.id = messages.order_id) AND 
      (orders.client_id = auth.uid() OR orders.freelance_id = auth.uid())
    )
  );

CREATE POLICY "Les utilisateurs peuvent envoyer des messages pour leurs commandes" ON messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM orders
      WHERE (orders.id = messages.order_id) AND 
      (orders.client_id = auth.uid() OR orders.freelance_id = auth.uid())
    )
  );

-- Politiques pour reviews
CREATE POLICY "Tout le monde peut voir les avis" ON reviews
  FOR SELECT USING (true);

CREATE POLICY "Les clients peuvent créer des avis pour leurs commandes" ON reviews
  FOR INSERT WITH CHECK (
    client_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = reviews.order_id
      AND orders.client_id = auth.uid()
      AND orders.status = 'completed'
    )
  );

-- Politiques pour favorites
CREATE POLICY "Les utilisateurs peuvent voir leurs favoris" ON favorites
  FOR SELECT USING (
    client_id = auth.uid()
  );

CREATE POLICY "Les clients peuvent ajouter des favoris" ON favorites
  FOR INSERT WITH CHECK (
    client_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'client'
    )
  );

CREATE POLICY "Les clients peuvent supprimer leurs favoris" ON favorites
  FOR DELETE USING (
    client_id = auth.uid()
  );

-- Politiques pour wallets et transactions
CREATE POLICY "Les utilisateurs peuvent voir leur propre wallet" ON wallets
  FOR SELECT USING (
    user_id = auth.uid()
  );

CREATE POLICY "Service role peut insérer des wallets" ON wallets
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role peut mettre à jour n'importe quel wallet" ON wallets
  FOR UPDATE USING (true);

CREATE POLICY "Service role peut supprimer des wallets" ON wallets
  FOR DELETE USING (true);

CREATE POLICY "Les utilisateurs peuvent voir leurs transactions" ON transactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM wallets
      WHERE wallets.id = transactions.wallet_id
      AND wallets.user_id = auth.uid()
    )
  );

CREATE POLICY "Service role peut insérer des transactions" ON transactions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role peut mettre à jour des transactions" ON transactions
  FOR UPDATE USING (true);

-- Politiques pour disputes
CREATE POLICY "Les utilisateurs concernés peuvent voir les disputes" ON disputes
  FOR SELECT USING (
    client_id = auth.uid() OR freelance_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Les clients peuvent créer des disputes" ON disputes
  FOR INSERT WITH CHECK (
    client_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = disputes.order_id
      AND orders.client_id = auth.uid()
    )
  );

CREATE POLICY "Les admins peuvent résoudre les disputes" ON disputes
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Création d'index pour améliorer les performances
-- Index sur les colonnes fréquemment jointes
CREATE INDEX IF NOT EXISTS idx_services_freelance_id ON services(freelance_id);
CREATE INDEX IF NOT EXISTS idx_services_category_id ON services(category_id);
CREATE INDEX IF NOT EXISTS idx_services_subcategory_id ON subcategories(category_id);
CREATE INDEX IF NOT EXISTS idx_orders_client_id ON orders(client_id);
CREATE INDEX IF NOT EXISTS idx_orders_freelance_id ON orders(freelance_id);
CREATE INDEX IF NOT EXISTS idx_orders_service_id ON orders(service_id);
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_client_id ON payments(client_id);
CREATE INDEX IF NOT EXISTS idx_payments_freelance_id ON payments(freelance_id);
CREATE INDEX IF NOT EXISTS idx_messages_order_id ON messages(order_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_reviews_order_id ON reviews(order_id);
CREATE INDEX IF NOT EXISTS idx_reviews_service_id ON reviews(service_id);
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_wallet_id ON transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_disputes_order_id ON disputes(order_id);

-- Index textuels pour les recherches
CREATE INDEX IF NOT EXISTS idx_services_title_gin ON services USING gin(to_tsvector('french', title));
CREATE INDEX IF NOT EXISTS idx_services_description_gin ON services USING gin(to_tsvector('french', description));
CREATE INDEX IF NOT EXISTS idx_profiles_username_gin ON profiles USING gin(to_tsvector('french', username));

-- Fonction de maintenance pour éviter les données orphelines
CREATE OR REPLACE FUNCTION public.cleanup_unused_data()
RETURNS void AS $$
BEGIN
  -- Nettoyer les services inactifs et sans commandes depuis plus de 1 an
  DELETE FROM services
  WHERE active = false
  AND id NOT IN (SELECT service_id FROM orders)
  AND updated_at < NOW() - INTERVAL '1 year';

  -- Autres opérations de nettoyage peuvent être ajoutées ici
END;
$$ LANGUAGE plpgsql;

-- Fonction pour valider la structure de la base de données au démarrage
CREATE OR REPLACE FUNCTION public.validate_database_structure()
RETURNS TEXT AS $$
DECLARE
  result TEXT := 'Structure de base de données validée';
  missing_tables TEXT := '';
  missing_triggers TEXT := '';
  missing_roles TEXT := '';
BEGIN
  -- Vérifier les tables essentielles
  IF NOT EXISTS (SELECT 1 FROM pg_catalog.pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN
    missing_tables := missing_tables || 'profiles, ';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_catalog.pg_tables WHERE schemaname = 'public' AND tablename = 'wallets') THEN
    missing_tables := missing_tables || 'wallets, ';
  END IF;
  
  -- Vérifier les triggers essentiels
  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_trigger t
    JOIN pg_catalog.pg_class c ON t.tgrelid = c.oid
    JOIN pg_catalog.pg_namespace n ON c.relnamespace = n.oid
    WHERE n.nspname = 'public' AND c.relname = 'profiles' AND t.tgname = 'on_profile_created'
  ) THEN
    missing_triggers := missing_triggers || 'on_profile_created, ';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_trigger t
    JOIN pg_catalog.pg_class c ON t.tgrelid = c.oid
    JOIN pg_catalog.pg_namespace n ON c.relnamespace = n.oid
    WHERE n.nspname = 'auth' AND c.relname = 'users' AND t.tgname = 'on_auth_user_created'
  ) THEN
    missing_triggers := missing_triggers || 'on_auth_user_created, ';
  END IF;
  
  -- Vérifier si des tables essentielles manquent
  IF missing_tables <> '' THEN
    result := result || E'\nTables manquantes: ' || rtrim(missing_tables, ', ');
  END IF;
  
  -- Vérifier si des triggers essentiels manquent
  IF missing_triggers <> '' THEN
    result := result || E'\nTriggers manquants: ' || rtrim(missing_triggers, ', ');
  END IF;
  
  -- Retourner le résultat de la validation
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Exécuter la validation au démarrage et enregistrer le résultat
DO $$
BEGIN
  RAISE NOTICE '%', public.validate_database_structure();
END
$$; 