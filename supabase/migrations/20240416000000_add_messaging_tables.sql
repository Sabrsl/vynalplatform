-- Création d'une table de conversations pour la messagerie directe
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  last_message_id UUID,
  last_message_time TIMESTAMP WITH TIME ZONE
);

-- Création d'une table pour les participants d'une conversation
CREATE TABLE IF NOT EXISTS conversation_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  unread_count INTEGER DEFAULT 0 NOT NULL,
  last_read_message_id UUID,
  UNIQUE(conversation_id, participant_id)
);

-- Modification de la table de messages pour supporter les conversations directes
-- Nous conservons la compatibilité avec les messages liés aux commandes
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS attachment_url TEXT,
ADD COLUMN IF NOT EXISTS attachment_type TEXT,
ADD COLUMN IF NOT EXISTS attachment_name TEXT,
ADD COLUMN IF NOT EXISTS is_typing BOOLEAN DEFAULT FALSE;

-- Modifier la contrainte pour permettre soit order_id, soit conversation_id
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_order_id_fkey;
ALTER TABLE messages ADD CONSTRAINT messages_order_id_fkey 
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;

-- Make order_id nullable
ALTER TABLE messages ALTER COLUMN order_id DROP NOT NULL;

-- Ajouter une contrainte pour s'assurer qu'au moins un des deux est non NULL
ALTER TABLE messages ADD CONSTRAINT messages_conversation_or_order 
  CHECK (
    (conversation_id IS NOT NULL AND order_id IS NULL) OR 
    (conversation_id IS NULL AND order_id IS NOT NULL)
  );

-- Trigger pour mettre à jour le dernier message dans une conversation
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.conversation_id IS NOT NULL THEN
    UPDATE conversations
    SET 
      last_message_id = NEW.id,
      last_message_time = NEW.created_at,
      updated_at = now()
    WHERE id = NEW.conversation_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_message_inserted
AFTER INSERT ON messages
FOR EACH ROW EXECUTE PROCEDURE update_conversation_last_message();

-- Fonction pour incrémenter le compteur de messages non lus
CREATE OR REPLACE FUNCTION increment_unread_count(p_conversation_id UUID, p_sender_id UUID) 
RETURNS void AS $$
BEGIN
  UPDATE conversation_participants
  SET unread_count = unread_count + 1
  WHERE 
    conversation_id = p_conversation_id AND
    participant_id != p_sender_id;
END;
$$ LANGUAGE plpgsql;

-- Appliquer le trigger de updated_at à la table conversations
CREATE TRIGGER update_conversations_updated_at
BEFORE UPDATE ON conversations
FOR EACH ROW EXECUTE PROCEDURE update_updated_at();

-- Politiques de sécurité (RLS) pour les conversations
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- Politiques pour la table conversations
DROP POLICY IF EXISTS "Lecture des conversations pour les participants" ON conversations;
DROP POLICY IF EXISTS "Création de conversations pour tous les utilisateurs authentifiés" ON conversations;
DROP POLICY IF EXISTS "Mise à jour des conversations pour les participants" ON conversations;
DROP POLICY IF EXISTS "Suppression des conversations pour les participants" ON conversations;

CREATE POLICY "Lecture des conversations pour les participants" 
ON conversations FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM conversation_participants
    WHERE conversation_participants.conversation_id = id
    AND conversation_participants.participant_id = auth.uid()
  )
);

CREATE POLICY "Création de conversations pour tous les utilisateurs authentifiés" 
ON conversations FOR INSERT 
WITH CHECK (
  auth.role() = 'authenticated'
);

CREATE POLICY "Mise à jour des conversations pour les participants" 
ON conversations FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM conversation_participants
    WHERE conversation_participants.conversation_id = id
    AND conversation_participants.participant_id = auth.uid()
  )
);

CREATE POLICY "Suppression des conversations pour les participants" 
ON conversations FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM conversation_participants
    WHERE conversation_participants.conversation_id = id
    AND conversation_participants.participant_id = auth.uid()
  )
);

-- Politiques pour les participants aux conversations
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lecture des participants pour les membres de la conversation" ON conversation_participants;
DROP POLICY IF EXISTS "Ajout de participants à ses propres conversations" ON conversation_participants;
DROP POLICY IF EXISTS "Mise à jour de son propre statut de participant" ON conversation_participants;
DROP POLICY IF EXISTS "Suppression de participants pour les membres de la conversation" ON conversation_participants;

CREATE POLICY "Lecture des participants pour les membres de la conversation" 
ON conversation_participants FOR SELECT 
USING (
  participant_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM conversation_participants cp
    WHERE cp.conversation_id = conversation_id
    AND cp.participant_id = auth.uid()
  )
);

CREATE POLICY "Ajout de participants à ses propres conversations" 
ON conversation_participants FOR INSERT 
WITH CHECK (
  -- Peut ajouter soi-même comme participant
  participant_id = auth.uid() OR
  -- Ou peut ajouter d'autres personnes à une conversation dont on est déjà participant
  EXISTS (
    SELECT 1 FROM conversation_participants cp
    WHERE cp.conversation_id = conversation_id
    AND cp.participant_id = auth.uid()
  )
);

CREATE POLICY "Mise à jour de son propre statut de participant" 
ON conversation_participants FOR UPDATE 
USING (
  participant_id = auth.uid()
);

CREATE POLICY "Suppression de participants pour les membres de la conversation" 
ON conversation_participants FOR DELETE 
USING (
  -- Peut se retirer soi-même d'une conversation
  participant_id = auth.uid() OR
  -- Ou peut retirer d'autres personnes d'une conversation dont on est déjà participant
  EXISTS (
    SELECT 1 FROM conversation_participants cp
    WHERE cp.conversation_id = conversation_id
    AND cp.participant_id = auth.uid()
  )
);

-- Mettre à jour les politiques pour les messages
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lecture des messages pour les participants" ON messages;
DROP POLICY IF EXISTS "Création de messages pour les participants" ON messages;
DROP POLICY IF EXISTS "Mise à jour de ses propres messages" ON messages;
DROP POLICY IF EXISTS "Suppression de ses propres messages" ON messages;

CREATE POLICY "Lecture des messages pour les participants" 
ON messages FOR SELECT 
USING (
  (
    -- Pour les messages liés à une commande
    order_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_id
      AND (orders.client_id = auth.uid() OR orders.freelance_id = auth.uid())
    )
  ) OR (
    -- Pour les messages de conversation directe
    conversation_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_participants.conversation_id = conversation_id
      AND conversation_participants.participant_id = auth.uid()
    )
  )
);

CREATE POLICY "Création de messages pour les participants" 
ON messages FOR INSERT 
WITH CHECK (
  sender_id = auth.uid() AND
  (
    -- Pour les messages liés à une commande
    (
      order_id IS NOT NULL AND
      EXISTS (
        SELECT 1 FROM orders
        WHERE orders.id = order_id
        AND (orders.client_id = auth.uid() OR orders.freelance_id = auth.uid())
      )
    ) OR (
      -- Pour les messages de conversation directe
      conversation_id IS NOT NULL AND
      EXISTS (
        SELECT 1 FROM conversation_participants
        WHERE conversation_participants.conversation_id = conversation_id
        AND conversation_participants.participant_id = auth.uid()
      )
    )
  )
);

CREATE POLICY "Mise à jour de ses propres messages" 
ON messages FOR UPDATE 
USING (
  sender_id = auth.uid() AND
  -- Le message doit exister depuis moins de 24 heures pour être modifiable
  created_at > (now() - interval '24 hours')
);

CREATE POLICY "Suppression de ses propres messages" 
ON messages FOR DELETE 
USING (
  sender_id = auth.uid() AND
  -- Le message doit exister depuis moins de 24 heures pour être supprimable
  created_at > (now() - interval '24 hours')
);

-- Fonction pour marquer les messages comme lus
CREATE OR REPLACE FUNCTION mark_messages_as_read(p_conversation_id UUID, p_user_id UUID)
RETURNS void AS $$
BEGIN
  -- Marquer tous les messages comme lus pour l'utilisateur spécifié
  UPDATE messages
  SET read = true
  WHERE 
    conversation_id = p_conversation_id AND 
    sender_id <> p_user_id AND
    read = false;
    
  -- Réinitialiser le compteur de messages non lus
  UPDATE conversation_participants
  SET 
    unread_count = 0,
    last_read_message_id = (
      SELECT id FROM messages 
      WHERE conversation_id = p_conversation_id 
      ORDER BY created_at DESC 
      LIMIT 1
    )
  WHERE 
    conversation_id = p_conversation_id AND
    participant_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Index pour les performances de la messagerie
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_conversation_id ON conversation_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_participant_id ON conversation_participants(participant_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message_time ON conversations(last_message_time);

-- Fonction pour créer une conversation avec des participants et un message initial
CREATE OR REPLACE FUNCTION create_conversation_with_message(
  p_participants UUID[],
  p_initial_message TEXT,
  p_sender_id UUID
)
RETURNS UUID AS $$
DECLARE
  v_conversation_id UUID;
  v_message_id UUID;
  v_participant UUID;
BEGIN
  -- Vérifier que l'expéditeur est authentifié et fait partie des participants
  IF auth.uid() IS NULL OR auth.uid() <> p_sender_id THEN
    RAISE EXCEPTION 'Utilisateur non authentifié ou ne correspond pas à l''expéditeur';
  END IF;
  
  IF NOT p_participants @> ARRAY[p_sender_id]::UUID[] THEN
    RAISE EXCEPTION 'L''expéditeur doit faire partie des participants';
  END IF;
  
  -- Créer la conversation
  INSERT INTO conversations (id, created_at, updated_at)
  VALUES (
    gen_random_uuid(),
    now(),
    now()
  )
  RETURNING id INTO v_conversation_id;
  
  -- Ajouter tous les participants
  FOREACH v_participant IN ARRAY p_participants
  LOOP
    INSERT INTO conversation_participants (
      conversation_id, 
      participant_id, 
      unread_count,
      created_at
    )
    VALUES (
      v_conversation_id,
      v_participant,
      CASE WHEN v_participant = p_sender_id THEN 0 ELSE 1 END,
      now()
    );
  END LOOP;
  
  -- Créer le message initial
  INSERT INTO messages (
    id,
    created_at,
    conversation_id,
    sender_id,
    content,
    read
  )
  VALUES (
    gen_random_uuid(),
    now(),
    v_conversation_id,
    p_sender_id,
    p_initial_message,
    false
  )
  RETURNING id INTO v_message_id;
  
  -- Mettre à jour le dernier message de la conversation
  UPDATE conversations
  SET 
    last_message_id = v_message_id,
    last_message_time = now(),
    updated_at = now()
  WHERE id = v_conversation_id;
  
  RETURN v_conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 