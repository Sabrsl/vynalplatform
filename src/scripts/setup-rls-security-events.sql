SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
SET NOCOUNT ON;
SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;

-- Script pour configurer les règles RLS (Row Level Security) pour la table security_events
-- Exécutez ce script dans l'interface SQL de Supabase

-- 1. Activer RLS sur la table security_events
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

-- 2. Politique permettant aux utilisateurs authentifiés d'insérer des événements de sécurité
DROP POLICY IF EXISTS "Utilisateurs authentifiés peuvent insérer des événements" ON public.security_events;
CREATE POLICY "Utilisateurs authentifiés peuvent insérer des événements"
ON public.security_events
FOR INSERT
TO authenticated
WITH CHECK (true);

-- 3. Politique permettant aux utilisateurs de voir leurs propres événements
DROP POLICY IF EXISTS "Utilisateurs peuvent voir leurs propres événements" ON public.security_events;
CREATE POLICY "Utilisateurs peuvent voir leurs propres événements"
ON public.security_events
FOR SELECT
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- 4. Politique pour la mise à jour des événements (restreinte aux administrateurs)
DROP POLICY IF EXISTS "Seuls les administrateurs peuvent mettre à jour des événements" ON public.security_events;
CREATE POLICY "Seuls les administrateurs peuvent mettre à jour des événements"
ON public.security_events
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- 5. Politique pour la suppression des événements (restreinte aux administrateurs)
DROP POLICY IF EXISTS "Seuls les administrateurs peuvent supprimer des événements" ON public.security_events;
CREATE POLICY "Seuls les administrateurs peuvent supprimer des événements"
ON public.security_events
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
); 