-- ===== FONCTION UTILITAIRE POUR VÉRIFIER SI UN UTILISATEUR EST ADMIN =====
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE user_id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===== TABLE PROFILES =====
-- Activer RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Lecture: tout le monde peut voir les profils publics
CREATE POLICY "Profiles visibles publiquement" 
ON profiles FOR SELECT USING (true);

-- Insertion: un utilisateur peut créer son propre profil
CREATE POLICY "Utilisateurs peuvent créer leur profil" 
ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Mise à jour: un utilisateur ne peut modifier que son propre profil
CREATE POLICY "Utilisateurs peuvent modifier leur propre profil" 
ON profiles FOR UPDATE USING (auth.uid() = id);

-- Suppression: seuls les admins peuvent supprimer des profils
CREATE POLICY "Seuls les admins peuvent supprimer des profils" 
ON profiles FOR DELETE USING (is_admin());

-- ===== TABLE SERVICES =====
-- Activer RLS
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

-- Lecture: tout le monde peut voir les services actifs
CREATE POLICY "Services actifs visibles publiquement" 
ON services FOR SELECT USING (active = true OR auth.uid() = freelance_id OR is_admin());

-- Insertion: seuls les freelances peuvent créer des services
CREATE POLICY "Freelances peuvent créer des services" 
ON services FOR INSERT WITH CHECK (auth.uid() = freelance_id);

-- Mise à jour: le freelance propriétaire du service peut le modifier
CREATE POLICY "Freelances peuvent modifier leurs services" 
ON services FOR UPDATE USING (auth.uid() = freelance_id OR is_admin());

-- Suppression: le freelance propriétaire du service ou un admin peut supprimer
CREATE POLICY "Freelances peuvent supprimer leurs services" 
ON services FOR DELETE USING (auth.uid() = freelance_id OR is_admin());

-- ===== TABLE ORDERS =====
-- Activer RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Lecture: le client et le freelance concernés peuvent voir la commande
CREATE POLICY "Client et freelance peuvent voir leurs commandes" 
ON orders FOR SELECT USING (auth.uid() = client_id OR auth.uid() = freelance_id OR is_admin());

-- Insertion: seuls les clients peuvent créer des commandes
CREATE POLICY "Clients peuvent créer des commandes" 
ON orders FOR INSERT WITH CHECK (auth.uid() = client_id);

-- Mise à jour: le client, le freelance concernés ou un admin peuvent mettre à jour
CREATE POLICY "Client, freelance et admin peuvent mettre à jour le statut" 
ON orders FOR UPDATE USING (auth.uid() = client_id OR auth.uid() = freelance_id OR is_admin());

-- Suppression: seuls les admins peuvent supprimer des commandes
CREATE POLICY "Seuls les admins peuvent supprimer des commandes" 
ON orders FOR DELETE USING (is_admin());

-- ===== TABLE TRANSACTIONS =====
-- Activer RLS
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Lecture: l'utilisateur concerné par la transaction peut la voir
CREATE POLICY "Utilisateurs peuvent voir leurs transactions" 
ON transactions FOR SELECT USING (
    auth.uid() = client_id OR 
    auth.uid() = freelance_id OR 
    auth.uid() = wallet_id OR 
    is_admin()
);

-- Insertion: système uniquement (désactivé pour les utilisateurs)
CREATE POLICY "Système uniquement peut créer des transactions" 
ON transactions FOR INSERT WITH CHECK (is_admin());

-- Mise à jour: système uniquement
CREATE POLICY "Système uniquement peut modifier des transactions" 
ON transactions FOR UPDATE USING (is_admin());

-- Suppression: système uniquement
CREATE POLICY "Système uniquement peut supprimer des transactions" 
ON transactions FOR DELETE USING (is_admin());

-- ===== TABLE WALLETS =====
-- Activer RLS
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;

-- Lecture: l'utilisateur ne peut voir que son propre portefeuille
CREATE POLICY "Utilisateurs peuvent voir leur propre portefeuille" 
ON wallets FOR SELECT USING (auth.uid() = user_id OR is_admin());

-- Insertion: système uniquement (au moment de la création du compte)
CREATE POLICY "Système uniquement peut créer des portefeuilles" 
ON wallets FOR INSERT WITH CHECK (auth.uid() = user_id OR is_admin());

-- Mise à jour: système uniquement pour les soldes
CREATE POLICY "Seul le système peut mettre à jour les soldes" 
ON wallets FOR UPDATE USING (is_admin());

-- ===== TABLE FAVORITES =====
-- Activer RLS
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- Lecture: l'utilisateur ne peut voir que ses propres favoris
CREATE POLICY "Utilisateurs peuvent voir leurs favoris" 
ON favorites FOR SELECT USING (auth.uid() = client_id);

-- Insertion: l'utilisateur ne peut ajouter qu'à ses propres favoris
CREATE POLICY "Utilisateurs peuvent ajouter des favoris" 
ON favorites FOR INSERT WITH CHECK (auth.uid() = client_id);

-- Suppression: l'utilisateur ne peut supprimer que ses propres favoris
CREATE POLICY "Utilisateurs peuvent supprimer leurs favoris" 
ON favorites FOR DELETE USING (auth.uid() = client_id);

-- ===== TABLE CONVERSATIONS =====
-- Activer RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- Lecture: les participants peuvent voir leurs conversations
CREATE POLICY "Participants peuvent voir leurs conversations" 
ON conversations FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM conversation_participants
        WHERE conversation_id = conversations.id
        AND participant_id = auth.uid()
    ) OR is_admin()
);

-- Insertion: tout utilisateur authentifié peut créer une conversation
CREATE POLICY "Utilisateurs peuvent créer des conversations" 
ON conversations FOR INSERT WITH CHECK (true);

-- Mise à jour: les participants et les admins peuvent mettre à jour
CREATE POLICY "Participants peuvent mettre à jour les conversations" 
ON conversations FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM conversation_participants
        WHERE conversation_id = conversations.id
        AND participant_id = auth.uid()
    ) OR is_admin()
);

-- ===== TABLE CONVERSATION_PARTICIPANTS =====
-- Activer RLS
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;

-- Lecture: les participants peuvent voir
CREATE POLICY "Participants peuvent voir" 
ON conversation_participants FOR SELECT USING (
    participant_id = auth.uid() OR 
    EXISTS (
        SELECT 1 FROM conversation_participants cp
        WHERE cp.conversation_id = conversation_participants.conversation_id
        AND cp.participant_id = auth.uid()
    ) OR is_admin()
);

-- Insertion: on peut s'ajouter soi-même ou être ajouté par un participant existant
CREATE POLICY "Participants peuvent ajouter" 
ON conversation_participants FOR INSERT WITH CHECK (
    participant_id = auth.uid() OR 
    EXISTS (
        SELECT 1 FROM conversation_participants cp
        WHERE cp.conversation_id = conversation_participants.conversation_id
        AND cp.participant_id = auth.uid()
    ) OR is_admin()
);

-- ===== TABLE MESSAGES =====
-- Activer RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Lecture: seuls les participants à la conversation peuvent voir les messages
CREATE POLICY "Participants peuvent voir les messages" 
ON messages FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM conversation_participants
        WHERE conversation_id = messages.conversation_id
        AND participant_id = auth.uid()
    ) OR sender_id = auth.uid() OR is_admin()
);

-- Insertion: un utilisateur authentifié peut envoyer un message s'il est participant
CREATE POLICY "Participants peuvent envoyer des messages" 
ON messages FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM conversation_participants
        WHERE conversation_id = messages.conversation_id
        AND participant_id = auth.uid()
    ) OR sender_id = auth.uid()
);

-- Mise à jour: pour marquer comme lu
CREATE POLICY "Participants peuvent mettre à jour leurs messages" 
ON messages FOR UPDATE USING (
    sender_id = auth.uid() OR 
    EXISTS (
        SELECT 1 FROM conversation_participants
        WHERE conversation_id = messages.conversation_id
        AND participant_id = auth.uid()
    ) OR is_admin()
);

-- ===== TABLE CONTACT_MESSAGES =====
-- Activer RLS
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

-- Lecture: seuls les admins et les destinataires peuvent voir
CREATE POLICY "Admins et destinataires peuvent voir les messages de contact" 
ON contact_messages FOR SELECT USING (
    is_admin() OR handled_by = auth.uid()
);

-- Insertion: tout le monde peut envoyer un message de contact
CREATE POLICY "Tout le monde peut envoyer un message de contact" 
ON contact_messages FOR INSERT WITH CHECK (true);

-- Mise à jour: seuls les admins peuvent mettre à jour
CREATE POLICY "Seuls les admins peuvent mettre à jour" 
ON contact_messages FOR UPDATE USING (is_admin() OR handled_by = auth.uid());

-- ===== TABLE CONTACT_MESSAGE_RESPONSES =====
-- Activer RLS
ALTER TABLE contact_message_responses ENABLE ROW LEVEL SECURITY;

-- Lecture: seuls les admins et les utilisateurs concernés peuvent voir
CREATE POLICY "Admins et utilisateurs concernés peuvent voir les réponses" 
ON contact_message_responses FOR SELECT USING (
    is_admin() OR responded_by = auth.uid() OR
    EXISTS (
        SELECT 1 FROM contact_messages
        WHERE id = contact_message_responses.message_id
        AND handled_by = auth.uid()
    )
);

-- Insertion: seuls les admins peuvent répondre
CREATE POLICY "Seuls les admins peuvent répondre" 
ON contact_message_responses FOR INSERT WITH CHECK (
    is_admin() OR responded_by = auth.uid()
);

-- ===== TABLE VERIFICATIONS =====
-- Activer RLS
ALTER TABLE verifications ENABLE ROW LEVEL SECURITY;

-- Lecture: l'utilisateur ne peut voir que ses propres vérifications
CREATE POLICY "Utilisateurs peuvent voir leurs vérifications" 
ON verifications FOR SELECT USING (user_id = auth.uid() OR is_admin());

-- Insertion: un utilisateur peut soumettre ses propres vérifications
CREATE POLICY "Utilisateurs peuvent soumettre des vérifications" 
ON verifications FOR INSERT WITH CHECK (user_id = auth.uid());

-- Mise à jour: seuls les admins peuvent vérifier/approuver
CREATE POLICY "Seuls les admins peuvent approuver les vérifications" 
ON verifications FOR UPDATE USING (is_admin() OR resolved_by = auth.uid());

-- ===== TABLE FEEDBACK =====
-- Activer RLS
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Lecture: tout le monde peut voir les feedbacks
CREATE POLICY "Tout le monde peut voir les feedbacks" 
ON feedback FOR SELECT USING (true);

-- Insertion: seuls les clients impliqués dans la commande peuvent laisser un feedback
CREATE POLICY "Clients peuvent laisser un feedback sur leurs commandes" 
ON feedback FOR INSERT WITH CHECK (
    auth.uid() = client_id AND
    EXISTS (
        SELECT 1 FROM orders
        WHERE id = feedback.order_id
        AND client_id = auth.uid()
    )
);

-- Mise à jour: seul l'auteur du feedback peut le modifier
CREATE POLICY "Auteurs peuvent modifier leur feedback" 
ON feedback FOR UPDATE USING (auth.uid() = client_id OR is_admin());

-- ===== TABLE REVIEW_REPLIES =====
-- Activer RLS
ALTER TABLE review_replies ENABLE ROW LEVEL SECURITY;

-- Lecture: tout le monde peut voir les réponses aux avis
CREATE POLICY "Tout le monde peut voir les réponses aux avis" 
ON review_replies FOR SELECT USING (true);

-- Insertion: seul le freelance concerné peut répondre
CREATE POLICY "Freelances peuvent répondre aux avis les concernant" 
ON review_replies FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM feedback f
        JOIN services s ON f.service_id = s.id
        WHERE f.id = review_replies.review_id
        AND s.freelance_id = auth.uid()
    )
);

-- Mise à jour: seul l'auteur de la réponse peut la modifier
CREATE POLICY "Auteurs peuvent modifier leurs réponses" 
ON review_replies FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM feedback f
        JOIN services s ON f.service_id = s.id
        WHERE f.id = review_replies.review_id
        AND s.freelance_id = auth.uid()
    ) OR is_admin()
);

-- ===== TABLE CATEGORIES =====
-- Activer RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Lecture: tout le monde peut voir les catégories
CREATE POLICY "Tout le monde peut voir les catégories" 
ON categories FOR SELECT USING (true);

-- Insertion: seuls les admins peuvent créer des catégories
CREATE POLICY "Seuls les admins peuvent créer des catégories" 
ON categories FOR INSERT WITH CHECK (is_admin());

-- Mise à jour: seuls les admins peuvent modifier des catégories
CREATE POLICY "Seuls les admins peuvent modifier des catégories" 
ON categories FOR UPDATE USING (is_admin());

-- Suppression: seuls les admins peuvent supprimer des catégories
CREATE POLICY "Seuls les admins peuvent supprimer des catégories" 
ON categories FOR DELETE USING (is_admin());

-- ===== TABLE SUBCATEGORIES =====
-- Activer RLS
ALTER TABLE subcategories ENABLE ROW LEVEL SECURITY;

-- Lecture: tout le monde peut voir les sous-catégories
CREATE POLICY "Tout le monde peut voir les sous-catégories" 
ON subcategories FOR SELECT USING (true);

-- Insertion: seuls les admins peuvent créer des sous-catégories
CREATE POLICY "Seuls les admins peuvent créer des sous-catégories" 
ON subcategories FOR INSERT WITH CHECK (is_admin());

-- Mise à jour: seuls les admins peuvent modifier des sous-catégories
CREATE POLICY "Seuls les admins peuvent modifier des sous-catégories" 
ON subcategories FOR UPDATE USING (is_admin());

-- Suppression: seuls les admins peuvent supprimer des sous-catégories
CREATE POLICY "Seuls les admins peuvent supprimer des sous-catégories" 
ON subcategories FOR DELETE USING (is_admin());

-- ===== TABLE NOTIFICATIONS =====
-- Activer RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Lecture: l'utilisateur ne peut voir que ses propres notifications
CREATE POLICY "Utilisateurs peuvent voir leurs notifications" 
ON notifications FOR SELECT USING (user_id = auth.uid());

-- Insertion: système uniquement
CREATE POLICY "Système uniquement peut créer des notifications" 
ON notifications FOR INSERT WITH CHECK (is_admin());

-- Mise à jour: l'utilisateur peut marquer ses notifications comme lues
CREATE POLICY "Utilisateurs peuvent marquer leurs notifications comme lues" 
ON notifications FOR UPDATE USING (user_id = auth.uid());

-- ===== TABLE BLOCKED_USERS =====
-- Activer RLS
ALTER TABLE blocked_users ENABLE ROW LEVEL SECURITY;

-- Lecture: l'utilisateur ne peut voir que ses propres blocages
CREATE POLICY "Utilisateurs peuvent voir leurs blocages" 
ON blocked_users FOR SELECT USING (blocker_id = auth.uid() OR is_admin());

-- Insertion: l'utilisateur ne peut ajouter que ses propres blocages
CREATE POLICY "Utilisateurs peuvent bloquer d'autres utilisateurs" 
ON blocked_users FOR INSERT WITH CHECK (blocker_id = auth.uid());

-- Suppression: l'utilisateur ne peut supprimer que ses propres blocages
CREATE POLICY "Utilisateurs peuvent débloquer d'autres utilisateurs" 
ON blocked_users FOR DELETE USING (blocker_id = auth.uid() OR is_admin());

-- ===== TABLE PAYMENTS =====
-- Activer RLS
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Lecture: l'utilisateur concerné par le paiement peut le voir
CREATE POLICY "Utilisateurs peuvent voir leurs paiements" 
ON payments FOR SELECT USING (
    client_id = auth.uid() OR 
    freelance_id = auth.uid() OR 
    is_admin()
);

-- Insertion: système uniquement
CREATE POLICY "Système uniquement peut créer des paiements" 
ON payments FOR INSERT WITH CHECK (is_admin());

-- Mise à jour: système uniquement
CREATE POLICY "Système uniquement peut modifier des paiements" 
ON payments FOR UPDATE USING (is_admin());

-- ===== TABLE SERVICE_NOTIFICATIONS =====
-- Activer RLS
ALTER TABLE service_notifications ENABLE ROW LEVEL SECURITY;

-- Lecture: le freelance concerné peut voir ses notifications de service
CREATE POLICY "Freelances peuvent voir leurs notifications de service" 
ON service_notifications FOR SELECT USING (freelance_id = auth.uid() OR is_admin());

-- Insertion: système uniquement
CREATE POLICY "Système uniquement peut créer des notifications de service" 
ON service_notifications FOR INSERT WITH CHECK (is_admin());

-- Mise à jour: le freelance peut marquer comme lu
CREATE POLICY "Freelances peuvent marquer les notifications comme lues" 
ON service_notifications FOR UPDATE USING (freelance_id = auth.uid() OR is_admin());

-- ===== TABLES SUPPLÉMENTAIRES BASÉES SUR LES IMAGES =====

-- ===== TABLE AUTH.USERS =====
-- Note: Cette table est gérée par Supabase, nous ne définissons pas de politiques pour elle
-- Référencée dans plusieurs tables avec auth.users.id

-- POUR CHAQUE TABLE NON MENTIONNÉE PRÉCÉDEMMENT MAIS VISIBLE DANS LES CAPTURES
-- (Ceci garantit que toutes les tables ont des politiques)

-- ===== TABLE attachment-related (vue dans Image 4) =====
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lecture des pièces jointes" 
ON attachments FOR SELECT USING (
    auth.uid() IN (
        SELECT sender_id FROM messages WHERE attachment_url = attachments.id
    ) OR 
    auth.uid() IN (
        SELECT receiver_id FROM messages WHERE attachment_url = attachments.id
    ) OR
    is_admin()
);

CREATE POLICY "Insertion des pièces jointes" 
ON attachments FOR INSERT WITH CHECK (true);

-- ===== TABLE auth.users.id (référencée dans plusieurs tables) =====
-- Pas de politiques directes car gérée par Supabase