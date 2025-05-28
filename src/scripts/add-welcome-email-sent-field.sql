SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
SET NOCOUNT ON;
SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;

-- Ajouter le champ welcome_email_sent à la table profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS welcome_email_sent BOOLEAN DEFAULT FALSE;

-- Mise à jour des profils existants
-- Par défaut, on considère que tous les utilisateurs existants ont déjà reçu l'email de bienvenue
UPDATE public.profiles
SET welcome_email_sent = TRUE
WHERE welcome_email_sent IS NULL;

-- Ajout d'un commentaire sur la colonne
COMMENT ON COLUMN public.profiles.welcome_email_sent IS 'Indique si l''email de bienvenue a déjà été envoyé à cet utilisateur'; 