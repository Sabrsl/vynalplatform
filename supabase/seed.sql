-- Script d'initialisation des données pour la plateforme de freelance
BEGIN;  -- Début de la transaction principale

DO $$
DECLARE
  -- UUIDs pour les catégories principales
  cat_dev_id UUID := '10000000-0000-0000-0000-000000000001';
  cat_design_id UUID := '20000000-0000-0000-0000-000000000002';
  cat_marketing_id UUID := '30000000-0000-0000-0000-000000000003';
  cat_redaction_id UUID := '40000000-0000-0000-0000-000000000004';
  cat_video_id UUID := '50000000-0000-0000-0000-000000000005';
  cat_formation_id UUID := '60000000-0000-0000-0000-000000000006';
  cat_business_id UUID := '70000000-0000-0000-0000-000000000007';
  cat_artisanat_id UUID := '80000000-0000-0000-0000-000000000008';
  cat_agriculture_id UUID := '90000000-0000-0000-0000-000000000009';
  cat_informatique_id UUID := 'a0000000-0000-0000-0000-00000000000a';
  cat_admin_id UUID := 'b0000000-0000-0000-0000-00000000000b';
  cat_mode_id UUID := 'c0000000-0000-0000-0000-00000000000c';
  cat_religion_id UUID := 'd0000000-0000-0000-0000-00000000000d';
  cat_sante_id UUID := 'e0000000-0000-0000-0000-00000000000e';
BEGIN
  -- Nettoyage de transaction en cas d'erreur
  SET CONSTRAINTS ALL DEFERRED;

  -- Insertion des catégories principales
  INSERT INTO categories (id, name, slug) VALUES
    (cat_dev_id, 'Développement Web & Mobile', 'developpement-web-mobile'),
    (cat_design_id, 'Design Graphique', 'design-graphique'),
    (cat_marketing_id, 'Marketing Digital', 'marketing-digital'),
    (cat_redaction_id, 'Rédaction & Traduction', 'redaction-traduction'),
    (cat_video_id, 'Vidéo & Audio', 'video-audio'),
    (cat_formation_id, 'Formation & Éducation', 'formation-education'),
    (cat_business_id, 'Conseil & Business', 'conseil-business'),
    (cat_artisanat_id, 'Artisanat & Création', 'artisanat-creation'),
    (cat_agriculture_id, 'Agriculture & Élevage', 'agriculture-elevage'),
    (cat_informatique_id, 'Informatique & Réseaux', 'informatique-reseaux'),
    (cat_admin_id, 'Services Administratifs', 'services-administratifs'),
    (cat_mode_id, 'Mode & Beauté', 'mode-beaute'),
    (cat_religion_id, 'Religion & Spiritualité', 'religion-spiritualite'),
    (cat_sante_id, 'Santé & Bien-être', 'sante-bien-etre')
  ON CONFLICT (id) DO NOTHING;

  -- Insertion des sous-catégories par catégorie
  -- 1. Développement Web & Mobile
  INSERT INTO subcategories (id, name, slug, category_id) VALUES
    (uuid_generate_v4(), 'Frontend (React, Vue, HTML/CSS)', 'frontend', cat_dev_id),
    (uuid_generate_v4(), 'Backend (Node.js, Django, PHP...)', 'backend', cat_dev_id),
    (uuid_generate_v4(), 'WordPress / CMS', 'wordpress-cms', cat_dev_id),
    (uuid_generate_v4(), 'Applications mobiles (Android/iOS)', 'applications-mobiles', cat_dev_id),
    (uuid_generate_v4(), 'Maintenance & Bug Fixing', 'maintenance-bug-fixing', cat_dev_id),
    (uuid_generate_v4(), 'Intégration API', 'integration-api', cat_dev_id)
  ON CONFLICT (id) DO NOTHING;
  
  -- 2. Design Graphique
  INSERT INTO subcategories (id, name, slug, category_id) VALUES
    (uuid_generate_v4(), 'Logo & Identité visuelle', 'logo-identite-visuelle', cat_design_id),
    (uuid_generate_v4(), 'Affiches & Flyers', 'affiches-flyers', cat_design_id),
    (uuid_generate_v4(), 'Cartes de visite', 'cartes-visite', cat_design_id),
    (uuid_generate_v4(), 'Design pour réseaux sociaux', 'design-reseaux-sociaux', cat_design_id),
    (uuid_generate_v4(), 'Design UI/UX', 'design-ui-ux', cat_design_id),
    (uuid_generate_v4(), 'Infographies', 'infographies', cat_design_id)
  ON CONFLICT (id) DO NOTHING;
  
  -- 3. Marketing Digital
  INSERT INTO subcategories (id, name, slug, category_id) VALUES
    (uuid_generate_v4(), 'Gestion réseaux sociaux', 'gestion-reseaux-sociaux', cat_marketing_id),
    (uuid_generate_v4(), 'Publicité Facebook & Instagram', 'publicite-facebook-instagram', cat_marketing_id),
    (uuid_generate_v4(), 'Création de contenu', 'creation-contenu', cat_marketing_id),
    (uuid_generate_v4(), 'Community management', 'community-management', cat_marketing_id),
    (uuid_generate_v4(), 'Email marketing', 'email-marketing', cat_marketing_id),
    (uuid_generate_v4(), 'Référencement (SEO/SEA)', 'referencement-seo-sea', cat_marketing_id)
  ON CONFLICT (id) DO NOTHING;
  
  -- 4. Rédaction & Traduction
  INSERT INTO subcategories (id, name, slug, category_id) VALUES
    (uuid_generate_v4(), 'Rédaction web', 'redaction-web', cat_redaction_id),
    (uuid_generate_v4(), 'Copywriting', 'copywriting', cat_redaction_id),
    (uuid_generate_v4(), 'Correction & Relecture', 'correction-relecture', cat_redaction_id),
    (uuid_generate_v4(), 'Traduction (FR <-> EN, FR <-> AR)', 'traduction', cat_redaction_id),
    (uuid_generate_v4(), 'Rédaction de CV & Lettres de motivation', 'redaction-cv-lettres', cat_redaction_id)
  ON CONFLICT (id) DO NOTHING;
  
  -- 5. Vidéo & Audio
  INSERT INTO subcategories (id, name, slug, category_id) VALUES
    (uuid_generate_v4(), 'Montage vidéo', 'montage-video', cat_video_id),
    (uuid_generate_v4(), 'Animation & Motion design', 'animation-motion-design', cat_video_id),
    (uuid_generate_v4(), 'Doublage / Voix off (FR, Wolof…)', 'doublage-voix-off', cat_video_id),
    (uuid_generate_v4(), 'Musique d''intro / jingle', 'musique-intro-jingle', cat_video_id),
    (uuid_generate_v4(), 'Podcasts & édition audio', 'podcasts-edition-audio', cat_video_id)
  ON CONFLICT (id) DO NOTHING;
  
  -- 6. Formation & Éducation
  INSERT INTO subcategories (id, name, slug, category_id) VALUES
    (uuid_generate_v4(), 'Cours en ligne (maths, anglais, informatique…)', 'cours-en-ligne', cat_formation_id),
    (uuid_generate_v4(), 'Préparation aux concours (Bac, CFEE, BFEM)', 'preparation-concours', cat_formation_id),
    (uuid_generate_v4(), 'Alphabétisation digitale', 'alphabetisation-digitale', cat_formation_id),
    (uuid_generate_v4(), 'Coaching scolaire & universitaire', 'coaching-scolaire-universitaire', cat_formation_id)
  ON CONFLICT (id) DO NOTHING;
  
  -- 7. Conseil & Business
  INSERT INTO subcategories (id, name, slug, category_id) VALUES
    (uuid_generate_v4(), 'Création d''entreprise (business plan, formalités…)', 'creation-entreprise', cat_business_id),
    (uuid_generate_v4(), 'Gestion / Finance / Comptabilité', 'gestion-finance-comptabilite', cat_business_id),
    (uuid_generate_v4(), 'Accompagnement juridique', 'accompagnement-juridique', cat_business_id),
    (uuid_generate_v4(), 'Conseil fiscal (impôts, taxes…)', 'conseil-fiscal', cat_business_id),
    (uuid_generate_v4(), 'Coaching personnel ou pro', 'coaching-personnel-pro', cat_business_id)
  ON CONFLICT (id) DO NOTHING;
  
  -- 8. Artisanat & Création
  INSERT INTO subcategories (id, name, slug, category_id) VALUES
    (uuid_generate_v4(), 'Création de logos en tissus africains', 'logos-tissus-africains', cat_artisanat_id),
    (uuid_generate_v4(), 'Broderie personnalisée', 'broderie-personnalisee', cat_artisanat_id),
    (uuid_generate_v4(), 'Artisanat local (bijoux, objets…)', 'artisanat-local', cat_artisanat_id),
    (uuid_generate_v4(), 'Calligraphie & Art traditionnel', 'calligraphie-art-traditionnel', cat_artisanat_id)
  ON CONFLICT (id) DO NOTHING;
  
  -- 9. Agriculture & Élevage
  INSERT INTO subcategories (id, name, slug, category_id) VALUES
    (uuid_generate_v4(), 'Conseils en agriculture bio', 'conseils-agriculture-bio', cat_agriculture_id),
    (uuid_generate_v4(), 'Planification de culture maraîchère', 'planification-culture-maraichere', cat_agriculture_id),
    (uuid_generate_v4(), 'Soins animaux & vétérinaires', 'soins-animaux-veterinaires', cat_agriculture_id),
    (uuid_generate_v4(), 'Conception de poulaillers / fermes', 'conception-poulaillers-fermes', cat_agriculture_id)
  ON CONFLICT (id) DO NOTHING;
  
  -- 10. Informatique & Réseaux
  INSERT INTO subcategories (id, name, slug, category_id) VALUES
    (uuid_generate_v4(), 'Installation de logiciels', 'installation-logiciels', cat_informatique_id),
    (uuid_generate_v4(), 'Assistance à distance', 'assistance-distance', cat_informatique_id),
    (uuid_generate_v4(), 'Sécurité informatique', 'securite-informatique', cat_informatique_id),
    (uuid_generate_v4(), 'Configuration de routeurs / caméras', 'configuration-routeurs-cameras', cat_informatique_id)
  ON CONFLICT (id) DO NOTHING;
  
  -- 11. Services Administratifs
  INSERT INTO subcategories (id, name, slug, category_id) VALUES
    (uuid_generate_v4(), 'Création de documents officiels (CV, lettres…)', 'creation-documents-officiels', cat_admin_id),
    (uuid_generate_v4(), 'Aide à la déclaration d''impôts', 'aide-declaration-impots', cat_admin_id),
    (uuid_generate_v4(), 'Assistance administrative (demande de visa, carte d''identité…)', 'assistance-administrative', cat_admin_id),
    (uuid_generate_v4(), 'Rédaction juridique (contrats…)', 'redaction-juridique', cat_admin_id)
  ON CONFLICT (id) DO NOTHING;
  
  -- 12. Mode & Beauté
  INSERT INTO subcategories (id, name, slug, category_id) VALUES
    (uuid_generate_v4(), 'Conseils en style vestimentaire', 'conseils-style-vestimentaire', cat_mode_id),
    (uuid_generate_v4(), 'Mise en beauté (maquillage virtuel, tuto…)', 'mise-en-beaute', cat_mode_id),
    (uuid_generate_v4(), 'Création de tenues personnalisées', 'creation-tenues-personnalisees', cat_mode_id),
    (uuid_generate_v4(), 'Coaching image', 'coaching-image', cat_mode_id)
  ON CONFLICT (id) DO NOTHING;
  
  -- 13. Religion & Spiritualité
  INSERT INTO subcategories (id, name, slug, category_id) VALUES
    (uuid_generate_v4(), 'Conception de flyers religieux (mosquées, églises…)', 'conception-flyers-religieux', cat_religion_id),
    (uuid_generate_v4(), 'Montage de vidéos spirituelles', 'montage-videos-spirituelles', cat_religion_id),
    (uuid_generate_v4(), 'Coaching religieux / Accompagnement spirituel', 'coaching-religieux-spirituel', cat_religion_id)
  ON CONFLICT (id) DO NOTHING;
  
  -- 14. Santé & Bien-être
  INSERT INTO subcategories (id, name, slug, category_id) VALUES
    (uuid_generate_v4(), 'Conseils nutrition', 'conseils-nutrition', cat_sante_id),
    (uuid_generate_v4(), 'Coaching sport / remise en forme', 'coaching-sport-remise-forme', cat_sante_id),
    (uuid_generate_v4(), 'Médecine alternative (plantes africaines, massages…)', 'medecine-alternative', cat_sante_id),
    (uuid_generate_v4(), 'Accompagnement bien-être mental', 'accompagnement-bien-etre-mental', cat_sante_id)
  ON CONFLICT (id) DO NOTHING;

  -- Réactiver les contraintes
  SET CONSTRAINTS ALL IMMEDIATE;

  -- Log de succès
  RAISE NOTICE 'Données de seed importées avec succès: 14 catégories et leurs sous-catégories';
EXCEPTION WHEN OTHERS THEN
  -- En cas d'erreur, capturer et logguer le problème
  RAISE WARNING 'Erreur lors de l''importation des données de seed: %', SQLERRM;
  -- La transaction sera annulée automatiquement
  RAISE EXCEPTION '%', SQLERRM;
END
$$;

-- Si nous arrivons ici, tout s'est bien passé
COMMIT;  -- Validation de la transaction principale

-- Note: Les utilisateurs, services et autres données seront créés après l'inscription des utilisateurs réels 