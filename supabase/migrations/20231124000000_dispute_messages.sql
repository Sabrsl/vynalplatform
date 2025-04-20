-- Table pour les messages de disputes
CREATE TABLE dispute_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  dispute_id UUID NOT NULL REFERENCES disputes ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles ON DELETE CASCADE,
  message TEXT NOT NULL,
  attachment_url TEXT,
  attachment_type TEXT,
  attachment_name TEXT
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_dispute_messages_dispute_id ON dispute_messages(dispute_id);
CREATE INDEX IF NOT EXISTS idx_dispute_messages_user_id ON dispute_messages(user_id);

-- Activer RLS
ALTER TABLE dispute_messages ENABLE ROW LEVEL SECURITY;

-- Politiques de sécurité pour dispute_messages
CREATE POLICY "Les participants à la dispute peuvent voir les messages" ON dispute_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM disputes
      WHERE disputes.id = dispute_messages.dispute_id
      AND (disputes.client_id = auth.uid() OR disputes.freelance_id = auth.uid())
    ) OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Les participants à la dispute peuvent ajouter des messages" ON dispute_messages
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM disputes
      WHERE disputes.id = dispute_messages.dispute_id
      AND (disputes.client_id = auth.uid() OR disputes.freelance_id = auth.uid() OR
          EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
          )
      )
    )
  );

-- Créer un bucket pour les pièces jointes de disputes
INSERT INTO storage.buckets (id, name, public) VALUES ('dispute_attachments', 'dispute_attachments', FALSE);

-- Politique de stockage pour les pièces jointes
CREATE POLICY "Accès au stockage des pièces jointes de disputes" ON storage.objects
  FOR ALL USING (
    bucket_id = 'dispute_attachments' AND
    (
      -- L'utilisateur est impliqué dans la dispute
      EXISTS (
        SELECT 1 FROM disputes
        WHERE disputes.id::text = (storage.foldername(name))[1]
        AND (disputes.client_id = auth.uid() OR disputes.freelance_id = auth.uid())
      ) OR
      -- L'utilisateur est admin
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
      )
    )
  );

-- Créer un déclencheur pour envoyer des notifications lors de nouveaux messages
CREATE OR REPLACE FUNCTION public.handle_new_dispute_message()
RETURNS TRIGGER AS $$
DECLARE
  dispute_record disputes;
  other_party_id UUID;
  message_preview TEXT;
BEGIN
  -- Récupérer les détails de la dispute
  SELECT * INTO dispute_record FROM disputes WHERE id = NEW.dispute_id;
  
  -- Déterminer l'autre partie (qui n'a pas envoyé le message)
  IF NEW.user_id = dispute_record.client_id THEN
    other_party_id := dispute_record.freelance_id;
  ELSIF NEW.user_id = dispute_record.freelance_id THEN
    other_party_id := dispute_record.client_id;
  ELSE
    -- Si c'est un admin ou autre, notifier les deux parties
    -- Notification pour le client
    INSERT INTO notifications (type, user_id, content, read)
    VALUES ('dispute_message', dispute_record.client_id, 'Nouveau message concernant votre litige #' || dispute_record.id, FALSE);
    
    -- Notification pour le freelance
    INSERT INTO notifications (type, user_id, content, read)
    VALUES ('dispute_message', dispute_record.freelance_id, 'Nouveau message concernant votre litige #' || dispute_record.id, FALSE);
    
    RETURN NEW;
  END IF;
  
  -- Créer un aperçu du message (limité à 50 caractères)
  message_preview := CASE 
    WHEN length(NEW.message) > 50 THEN substr(NEW.message, 1, 47) || '...'
    ELSE NEW.message
  END;
  
  -- Envoyer une notification à l'autre partie
  INSERT INTO notifications (type, user_id, content, read)
  VALUES ('dispute_message', other_party_id, 'Nouveau message dans le litige: ' || message_preview, FALSE);
  
  -- Mettre à jour la dispute pour indiquer qu'elle a été modifiée
  UPDATE disputes SET updated_at = NOW() WHERE id = NEW.dispute_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Créer le trigger pour les nouveaux messages
CREATE TRIGGER on_dispute_message_created
AFTER INSERT ON dispute_messages
FOR EACH ROW EXECUTE PROCEDURE public.handle_new_dispute_message(); 