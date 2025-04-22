-- Création de la table des réponses aux avis
CREATE TABLE IF NOT EXISTS review_replies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  freelance_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL
);

-- Création d'index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_review_replies_review_id ON review_replies(review_id);
CREATE INDEX IF NOT EXISTS idx_review_replies_freelance_id ON review_replies(freelance_id);

-- Activer RLS (Row Level Security)
ALTER TABLE review_replies ENABLE ROW LEVEL SECURITY;

-- Trigger pour mettre à jour le timestamp updated_at
CREATE TRIGGER update_review_replies_updated_at
BEFORE UPDATE ON review_replies
FOR EACH ROW EXECUTE PROCEDURE update_updated_at();

-- Politiques de sécurité RLS pour les réponses aux avis
CREATE POLICY "Tout le monde peut voir les réponses aux avis" ON review_replies
  FOR SELECT USING (true);

CREATE POLICY "Les freelances peuvent répondre à leurs avis" ON review_replies
  FOR INSERT WITH CHECK (
    freelance_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM reviews
      WHERE reviews.id = review_id
      AND reviews.freelance_id = auth.uid()
    )
  );

CREATE POLICY "Les freelances peuvent modifier leurs réponses aux avis" ON review_replies
  FOR UPDATE USING (
    freelance_id = auth.uid()
  ) WITH CHECK (
    freelance_id = auth.uid()
  );

CREATE POLICY "Les freelances peuvent supprimer leurs réponses aux avis" ON review_replies
  FOR DELETE USING (
    freelance_id = auth.uid()
  );

-- Ajouter une contrainte unique pour garantir une seule réponse par avis
ALTER TABLE review_replies ADD CONSTRAINT unique_review_reply UNIQUE (review_id); 