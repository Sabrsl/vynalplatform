"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Search, Star, Shield, Code, Paintbrush, Megaphone, Tractor, Server, Heart, BookOpen, Mail, PieChart, Camera, Globe, Building, Banknote } from 'lucide-react';
import PageLayout from '@/components/ui/PageLayout';
import SpotlightCard from '@/components/ui/SpotlightCard';
import { TextRevealSection } from '@/components/sections/TextRevealSection';
import { BorderBeamButton } from '@/components/ui/border-beam-button';
import PartnersSection from '@/components/sections/PartnersSection';
import { useCategories } from '@/hooks/useCategories';
import { Subcategory, Category } from '@/hooks/useCategories';
import { useAuth } from "@/hooks/useAuth";
import { useUser } from "@/hooks/useUser";
import { PUBLIC_ROUTES, AUTH_ROUTES } from "@/config/routes";
import dynamic from 'next/dynamic';
import { memo } from 'react';
import { getCachedData, setCachedData } from '@/lib/optimizations';
import { PlaceholdersAndVanishInput } from '@/components/ui/PlaceholdersAndVanishInput';
import { WobbleCard } from "@/components/ui/WobbleCard";
import { GlowingEffect } from "@/components/ui/GlowingEffect";
import { BentoGridThirdDemo } from "@/components/ui/BentoGridThirdDemo";
import Image from "next/image";
import SchemaOrg from "@/components/seo/SchemaOrg";
import { Button } from "@/components/ui/button";

// Interface pour les données en cache de la page d'accueil
interface HomepageData {
  categories: Category[];
  subcategories: Subcategory[];
  timestamp: number;
  version?: string;
}

// Clé de cache pour la page d'accueil
const HOMEPAGE_CACHE_KEY = 'homepage_data';

// Chatbot chargé de manière dynamique avec SSR désactivé pour éviter les erreurs d'hydration
// et ne pas impacter les performances de chargement initiales
const WelcomeChatbotDynamic = dynamic(() => 
  import('@/components/ui/WelcomeChatbot').then(mod => mod.WelcomeChatbot),
  { ssr: false }
);

const TextRevealSectionDynamic = dynamic(() => 
  import('@/components/sections/TextRevealSection').then(mod => mod.TextRevealSection),
  { ssr: true, loading: () => <div className="h-72" /> }
);

const BorderBeamButtonDynamic = dynamic(() =>
  import('@/components/ui/border-beam-button').then(mod => mod.BorderBeamButton),
  { ssr: true }
);

const PartnersSectionDynamic = dynamic(() => 
  import('@/components/sections/PartnersSection').then(mod => mod.default || mod),
  { ssr: true, loading: () => <div className="h-48" /> }
);

// Titre principal
const FastLCPTitle = memo(() => (
  <h1 
    className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight bg-gradient-to-r from-vynal-accent-secondary to-vynal-accent-primary bg-clip-text text-transparent" 
    id="lcp-title"
  >
    Trouvez des freelances qualifiés pour tous vos projets
  </h1>
));

FastLCPTitle.displayName = "FastLCPTitle";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [loadedComponents, setLoadedComponents] = useState(false);
  const [localCategories, setLocalCategories] = useState<Category[]>([]);
  const [localSubcategories, setLocalSubcategories] = useState<Subcategory[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const { categories, subcategories, loading: categoriesLoading } = useCategories();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { isFreelance, isClient, isAdmin, loading: userLoading } = useUser();

  // Référence pour suivre si le composant est monté
  const mountedRef = useRef(true);

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (searchQuery.trim()) {
      setIsSearching(true);
      router.push(`${PUBLIC_ROUTES.SERVICES}?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  // Liste des exemples de recherche qui défileront dans le placeholder
  const searchPlaceholders = [
    "Que cherchez vous? Par exemple : Marketing..."
  ];
  
  // Version mobile du placeholder
  const [mobilePlaceholder, setMobilePlaceholder] = useState(searchPlaceholders[0]);
  
  // Mettre à jour le placeholder en fonction de la taille de l'écran
  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth < 640;
      setMobilePlaceholder(isMobile ? "Que cherchez vous ? Par exemple : IA..." : searchPlaceholders[0]);
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    
    return () => window.removeEventListener('resize', handleResize);
  }, [searchPlaceholders]);

  // Fonction pour gérer les clics sur les catégories
  const handleCategoryClick = (categorySlug: string) => {
    router.push(`${PUBLIC_ROUTES.SERVICES}?category=${categorySlug}`);
  };

  // Gestion optimisée du cache pour les catégories et sous-catégories
  useEffect(() => {
    const loadCategoriesFromCache = () => {
      try {
        const cachedHomepageData = getCachedData<HomepageData | null>(HOMEPAGE_CACHE_KEY);
        
        if (cachedHomepageData?.categories?.length && cachedHomepageData?.subcategories?.length) {
          setLocalCategories(cachedHomepageData.categories);
          setLocalSubcategories(cachedHomepageData.subcategories);
          setIsLoadingCategories(false);
          
          const cacheAge = Date.now() - cachedHomepageData.timestamp;
          const MAX_AGE = 24 * 60 * 60 * 1000; // 24 heures
          
          if (cacheAge < MAX_AGE) return;
        }
      } catch (error) {
        console.error('Erreur lors de la récupération du cache:', error);
      }
    };

    loadCategoriesFromCache();
  }, []);

  // Effet pour mettre à jour le cache quand les données fraîches sont disponibles
  useEffect(() => {
    if (!categoriesLoading && categories && subcategories) {
      setLocalCategories(categories);
      setLocalSubcategories(subcategories);
      setIsLoadingCategories(false);
      
      setCachedData(
        HOMEPAGE_CACHE_KEY,
        {
          categories,
          subcategories,
          timestamp: Date.now(),
          version: '1.1'
        },
        {
          expiry: 14 * 24 * 60 * 60 * 1000,
          priority: 'high'
        }
      );
    }
  }, [categories, subcategories, categoriesLoading]);

  // Détecter les appareils mobiles pour optimiser les performances
  useEffect(() => {
    const checkMobile = () => {
      const isMobile = window.innerWidth < 768 || /mobi/i.test(navigator.userAgent);
      setIsMobile(isMobile);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Charger les composants non critiques de manière différée
  useEffect(() => {
    const loadNonCriticalComponents = () => setLoadedComponents(true);
    
    if (typeof window !== 'undefined') {
      if ('requestIdleCallback' in window) {
        window.requestIdleCallback(loadNonCriticalComponents, { timeout: 2000 });
      } else {
        setTimeout(loadNonCriticalComponents, 1000);
      }
    }
  }, []);

  useEffect(() => {
    const isLoading = authLoading || userLoading;
    
    // Si pas encore chargé, attendre
    if (isLoading) return;
    
    // Désactiver la redirection automatique vers le dashboard
    // Les utilisateurs connectés peuvent maintenant accéder à la page d'accueil
    
    /* Ancien code de redirection automatique désactivé
    if (user) {
      if (isAdmin) {
        router.push('/admin');
      } else if (isFreelance) {
        router.push('/dashboard'); // Dashboard freelance
      } else if (isClient) {
        router.push('/client-dashboard'); // Dashboard client
      } else {
        // Si le rôle n'est pas encore défini
        router.push('/onboarding');
      }
    }
    */
  }, [router, user, isFreelance, isClient, isAdmin, authLoading, userLoading]);

  const schemaData = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    'name': 'Vynal Platform',
    'url': 'https://vynalplatform.com',
    'logo': 'https://vynalplatform.com/assets/logo/logo_vynal_platform_simple',
    'sameAs': [
      'https://www.facebook.com/vynalplatform',
      'https://www.instagram.com/vynalplatform/',
      'https://www.linkedin.com/company/vynalplatform/'
    ],
    'description': 'Vynal Platform est la première marketplace de freelance conçue pour l\'Afrique, connectant les talents locaux avec des clients du monde entier.',
  };

  return (
    <PageLayout fullGradient={true}>
      {/* Chatbot visible uniquement sur la page d'accueil */}
      {/* WelcomeChatbotDynamic temporairement désactivé */}
      {/* <WelcomeChatbotDynamic /> */}
      
      {/* Hero Section - LCP */}
      <section className="text-slate-800 dark:text-vynal-text-primary py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="w-full max-w-3xl mx-auto mb-10" id="lcp-container">
            {/* Titre principal */}
            <FastLCPTitle />
          </div>
          
          {/* Barre de recherche */}
          <div className="relative w-full max-w-xl mx-auto">
            <form onSubmit={handleSearch} className="relative" role="search" aria-label="Recherche de services">
              <div className="relative">
                <input
                  type="text"
                  className="w-full py-3 pl-5 pr-14 rounded-full bg-white/40 dark:bg-slate-800/40 text-slate-800 dark:text-white border-2 border-slate-300 dark:border-slate-700/30 shadow-md focus:ring-2 focus:ring-vynal-accent-primary/30 dark:focus:ring-vynal-accent-primary/40 outline-none transition-all text-sm placeholder:text-slate-500 placeholder:text-[10px] xs:placeholder:text-xs sm:placeholder:text-sm"
                  placeholder={mobilePlaceholder}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label="Rechercher un service"
                />
                <GlowingEffect disabled={isMobile} spread={30} variant="default" borderWidth={2} />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-vynal-accent-primary hover:bg-vynal-accent-secondary text-white p-2 rounded-full transition-all"
                  aria-label="Rechercher"
                >
                  <Search className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </form>
          </div>

          {/* Section des logos partenaires */}
          <div className="mt-4 text-center">
            <div className="flex justify-center items-center overflow-x-auto whitespace-nowrap py-2 px-4 w-full">
              <div className="flex items-center justify-center space-x-6 md:space-x-8 mx-auto">
                <Image 
                  src="/assets/partners/logo_free_money.webp" 
                  alt="Logo Free Money - Partenaire de paiement" 
                  width={84}
                  height={18}
                  className="h-4 md:h-5 w-auto object-contain grayscale hover:grayscale-0 transition-all duration-300"
                  decoding="async"
                />
                <Image 
                  src="/assets/partners/logo_stripe.webp" 
                  alt="Logo Stripe - Partenaire de paiement" 
                  width={84}
                  height={18}
                  className="h-4 md:h-5 w-auto object-contain grayscale hover:grayscale-0 transition-all duration-300"
                  decoding="async"
                />
                <Image 
                  src="/assets/partners/logo_wave_.webp" 
                  alt="Logo Wave - Partenaire de paiement" 
                  width={84}
                  height={18}
                  className="h-4 md:h-5 w-auto object-contain grayscale hover:grayscale-0 transition-all duration-300"
                  decoding="async"
                />
                <Image 
                  src="/assets/partners/om_logo_.webp" 
                  alt="Logo Orange Money - Partenaire de paiement" 
                  width={84}
                  height={18}
                  className="h-4 md:h-5 w-auto object-contain grayscale hover:grayscale-0 transition-all duration-300"
                  decoding="async"
                />
                <Image 
                  src="/assets/partners/Google_.webp" 
                  alt="Logo Google - Partenaire de paiement" 
                  width={84}
                  height={18}
                  className="h-4 md:h-5 w-auto object-contain grayscale hover:grayscale-0 transition-all duration-300"
                  decoding="async"
                />
                <Image 
                  src="/assets/partners/Logo-GitHub-Black.webp" 
                  alt="GitHub" 
                  width={84}
                  height={18}
                  className="h-4 md:h-5 w-auto object-contain dark:invert grayscale hover:grayscale-0 transition-all duration-300" 
                />
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* Catégories de services Section */}
      <section className="py-10 md:py-16 bg-gradient-to-b from-white to-slate-50 dark:from-vynal-purple-dark dark:to-vynal-purple-darkest" aria-labelledby="categories-title">
        <div className="container mx-auto px-4">
          <h2 id="categories-title" className="text-2xl md:text-3xl font-bold text-center mb-8 text-slate-800 dark:bg-gradient-to-r dark:from-vynal-accent-primary dark:to-vynal-accent-secondary dark:bg-clip-text dark:text-transparent">
            Accédez facilement aux talents selon leurs spécialités
          </h2>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4 md:gap-6">
            {localCategories?.length > 0 && 
              localCategories
                .filter(cat => [
                  'Développement Web & Mobile',
                  'Design Graphique',
                  'Marketing Digital',
                  'Rédaction & Traduction',
                  'Vidéo & Audio',
                  'Intelligence Artificielle',
                  'Informatique & Réseaux',
                  'Services Administratifs'
                ].includes(cat.name))
                .map((cat) => {
                  const iconMap = {
                    'Design': Paintbrush,
                    'Marketing': Megaphone,
                    'Rédaction': BookOpen,
                    'Traduction': BookOpen,
                    'Vidéo': Camera,
                    'Audio': Camera,
                    'Intelligence': Server,
                    'Artificielle': Server,
                    'Informatique': Server,
                    'Développement': Code,
                    'Administratif': Shield
                  };
                  
                  const Icon = Object.entries(iconMap).find(([key]) => 
                    cat.name.includes(key)
                  )?.[1] || Code;
                  
                  // Masquer Services Administratifs sur desktop
                  const isAdmin = cat.name === 'Services Administratifs';
                  const hideOnDesktop = isAdmin ? 'lg:hidden' : '';
                  
                  return (
                    <Link
                      key={cat.id}
                      href={`${PUBLIC_ROUTES.SERVICES}?category=${cat.slug}`}
                      className={`flex flex-col items-center justify-center p-3 md:p-4 rounded-xl 
                        bg-white/30 dark:bg-slate-800/30 backdrop-blur-sm 
                        border border-slate-300 dark:border-slate-700/30 
                        shadow-sm hover:shadow-md 
                        hover:border-vynal-accent-primary/40 dark:hover:border-vynal-accent-primary/40 
                        hover:-translate-y-1 transition-all duration-200 group ${hideOnDesktop}`}
                      aria-label={`Voir les services de ${cat.name}`}
                    >
                      <div className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full bg-vynal-accent-10 dark:bg-vynal-accent-10 border border-vynal-accent-primary/20 dark:border-vynal-accent-primary/20 mb-2 md:mb-3 text-vynal-accent-primary group-hover:bg-vynal-accent-20 dark:group-hover:bg-vynal-accent-20 group-hover:border-vynal-accent-primary/30 dark:group-hover:border-vynal-accent-primary/40 transition-all duration-200">
                        <Icon className="w-5 h-5 md:w-6 md:h-6 stroke-[1.5]" aria-hidden="true" />
                      </div>
                      <span className="text-xs md:text-sm font-medium text-center text-slate-600 dark:text-vynal-text-secondary leading-tight">
                        {cat.name.split(' & ')[0]}
                      </span>
                    </Link>
                  );
                })
            }
          </div>
          
          {/* Bouton Voir tous les services */}
          <div className="text-center mt-8">
            <Link
              href={PUBLIC_ROUTES.SERVICES}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full
                bg-vynal-accent-primary/20 hover:bg-vynal-accent-primary/30
                dark:bg-vynal-accent-primary/10 dark:hover:bg-vynal-accent-primary/20
                text-vynal-accent-primary font-medium text-xs
                transition-all duration-200 hover:-translate-y-0.5"
              aria-label="Voir tous les services disponibles"
            >
              Voir tous les services
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Bento Grid Section */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-slate-50 to-white dark:from-vynal-purple-darkest dark:to-vynal-purple-dark" aria-labelledby="how-it-works-title">
        <div className="container mx-auto px-4">
          <h2 id="how-it-works-title" className="text-3xl font-bold text-center mb-16 text-slate-800 dark:bg-gradient-to-r dark:from-vynal-accent-primary dark:to-vynal-accent-secondary dark:bg-clip-text dark:text-transparent">
            Comment ça marche ?
          </h2>
          <BentoGridThirdDemo />
        </div>
      </section>

      {/* Text Reveal Section */}
      <TextRevealSectionDynamic />

      {/* Bento Grid Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-16 text-slate-800 dark:bg-gradient-to-r dark:from-vynal-accent-primary dark:to-vynal-accent-secondary dark:bg-clip-text dark:text-transparent">
            Pourquoi les entreprises choisissent 
            Vynal Platform
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6 max-w-6xl mx-auto">
            {/* Grande carte à gauche */}
            <WobbleCard
              containerClassName="bg-gradient-to-br from-pink-500 to-purple-600 dark:from-pink-600 dark:to-purple-700 h-full"
              className="p-8 md:p-10 h-full"
            >
              <div className="flex flex-col justify-between h-full">
                <div>
                  <h3 className="text-3xl md:text-4xl font-bold mb-4 text-white">Des microservices pour tout, en 1 clic</h3>
                  <p className="text-white/90 text-lg md:text-xl">
                    Propulse l'ensemble de vos projets
                  </p>
                </div>
                
                <div className="mt-6">
                  <p className="text-white/90 mb-6">
                  Commandez en 3 clics. Discutez avec le vendeur. Recevez votre service dans les délais. Zéro prise de tête. Graphisme, rédaction, marketing, IA... 
                  Trouvez le bon expert en quelques secondes. Plus besoin de chercher partout.
                  </p>
                  <div className="overflow-hidden rounded-xl bg-gray-200 dark:bg-gray-800 flex items-center justify-center h-[250px]">
                    <Image
                      src="/images/profil5.webp"
                      alt="Freelance professionnel travaillant sur un projet - Vynal Platform"
                      width={320}
                      height={200}
                      quality={75}
                      className="w-full h-full object-cover object-[center_30%]"
                      decoding="async"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      priority={true}
                    />
                  </div>
                </div>
              </div>
            </WobbleCard>
            
            {/* Colonne de droite */}
            <div className="grid grid-cols-1 gap-3 md:gap-6 h-full">
              {/* Carte supérieure */}
              <WobbleCard
                containerClassName="bg-gradient-to-br from-indigo-500 to-blue-600 dark:from-indigo-600 dark:to-blue-700"
                className="p-8 md:p-10"
              >
                <div className="text-center">
                  <h3 className="text-2xl md:text-3xl font-bold mb-4 text-white">
                    Zéro contrainte
                  </h3>
                  <p className="text-white/90 mb-4">
                   Passez à l'action sans embaucher.
                   Vos données sont protégées, votre confidentialité est respectée. Et en cas de besoin, notre assistance est disponible 24/7.
                  </p>
                </div>
              </WobbleCard>
              
              {/* Carte inférieure */}
              <WobbleCard
                containerClassName="bg-gradient-to-br from-vynal-accent-primary to-vynal-accent-secondary dark:from-vynal-accent-primary/90 dark:to-vynal-accent-secondary/90"
                className="p-8 md:p-10"
              >
                <div className="flex flex-col items-center">
                  <h3 className="text-2xl md:text-3xl font-bold mb-6 text-white text-center">
                    Inscription rapide
                  </h3>
                  <p className="text-white/90 mb-6 text-center">
                    Rejoignez la plateforme Vynal, une première en Afrique !
                  </p>
                  <a 
                    href="/auth/signup?role=client"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.location.href = '/auth/signup?role=client';
                    }}
                    className="bg-white/25 hover:bg-white/30 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 border border-white/30 cursor-pointer z-50 relative"
                  >
                    Commencer maintenant
                  </a>
                </div>
              </WobbleCard>
            </div>
          </div>
        </div>
      </section>

      {/* Partners Section */}
<PartnersSectionDynamic />

{/* Section des sous-catégories populaires */}
<section className="py-8 md:py-12 lg:py-16 bg-gradient-to-b from-white to-slate-50 dark:from-vynal-purple-dark dark:to-vynal-purple-darkest">
  <div className="container mx-auto px-4 sm:px-6">
    <div className="max-w-4xl mx-auto text-center mb-8">
      <h2 className="text-2xl md:text-3xl font-bold text-slate-800 dark:bg-gradient-to-r dark:from-vynal-accent-primary dark:to-vynal-accent-secondary dark:bg-clip-text dark:text-transparent">
        Ce que vous cherchez, nous l'avons déjà
      </h2>
    </div>
    
    <div className="flex flex-wrap gap-2 md:gap-3 justify-center max-w-5xl mx-auto">
      {localSubcategories && localSubcategories.length > 0 ? (
        (() => {
          // Liste des sous-catégories à exclure de la page d'accueil
          const excludedSubcategories = [
            // Services administratifs et juridiques
            'accompagnement-juridique',
            'aide-declaration-impots',
            'assistance-administrative',
            'conseil-fiscal',
            
            // Services artisanaux et créatifs
            'artisanat-local',
            'broderie-personnalisee',
            'calligraphie-art-traditionnel',
            'creation-logos-tissus-africains',
            'creation-tenues-personnalisees',
            
            // Services religieux et spirituels
            'coaching-religieux',
            'accompagnement-spirituel',
            'conception-flyers-religieux',
            'montage-videos-spirituelles',
            
            // Services techniques et spécialisés
            'conception-poulaillers',
            'configuration-routeurs',
            'configuration-cameras',
            'conseils-agriculture-bio',
            
            // Services de bien-être et beauté
            'medecine-alternative',
            'mise-en-beaute',
            
            // Services généraux
            'assistance-distance',
            'conseils-style-vestimentaire'
          ];

          // Filtrer les sous-catégories exclues
          const filteredSubcategories = [...localSubcategories]
            .filter(sub => !excludedSubcategories.includes(sub.slug));
          
          // Liste des slugs des sous-catégories les plus demandées (par ordre de popularité)
          const topSubcategorySlugs = [
            'developpement-web',
            'marketing-digital', 
            'conception-graphique',
            'developpement-mobile',
            'wordpress',
            'seo',
            'social-media',
            'redaction-web',
            'montage-video',
            'traduction',
            'design-ui-ux',
            'logo-design',
            'community-management',
            'copywriting',
            'portraits-ia',
            'redaction-seo-ia',
            'chatbots-e-commerce',
            'automatisation-process',
            'logos-ia',
            'resumes-documents',
            'assistants-medias-sociaux',
            'traduction-specialisee',
            'analyse-predictive',
            'videos-ia',
            'recherche-ia',
            'voix-synthetiques',
            'motion-design',
            'developpement-ecommerce',
            'integration-web',
            'creation-site-vitrine'
          ];
          
          // Prioriser les sous-catégories populaires, puis ajouter d'autres jusqu'à atteindre la limite
          let displayedSubcategories: Subcategory[] = [];
          
          // D'abord, ajouter les sous-catégories prioritaires (si elles existent dans notre base)
          topSubcategorySlugs.forEach(slug => {
            const matchingSubcategory = filteredSubcategories.find(sub => sub.slug === slug);
            if (matchingSubcategory && !displayedSubcategories.some(sub => sub.id === matchingSubcategory.id)) {
              displayedSubcategories.push(matchingSubcategory);
            }
          });
          
          // Si on n'a pas assez de sous-catégories prioritaires, compléter avec d'autres
          if (displayedSubcategories.length < 24) {
            const remainingSubcategories = filteredSubcategories.filter(
              sub => !displayedSubcategories.some(displayedSub => displayedSub.id === sub.id)
            );
            
            // Trier les sous-catégories restantes par ordre alphabétique
            const sortedRemaining = [...remainingSubcategories]
              .sort((a, b) => a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' }));
              
            // Ajouter autant de sous-catégories que nécessaire pour atteindre la limite
            const neededCount = 24 - displayedSubcategories.length;
            displayedSubcategories = [
              ...displayedSubcategories,
              ...sortedRemaining.slice(0, neededCount)
            ];
          }
          // Créer les liens pour chaque sous-catégorie
          return displayedSubcategories.map(subcategory => {
            // Trouver la catégorie parente pour la sous-catégorie
            const parentCategory = localCategories.find(cat => cat.id === subcategory.category_id);
            const parentSlug = parentCategory ? parentCategory.slug : '';
            
            return (
              <Link
                key={subcategory.id}
                href={`/services?category=${parentSlug}&subcategory=${subcategory.slug}`}
                className={`group inline-flex items-center rounded-full px-2 py-1 
                  text-[10px] md:text-xs transition-all duration-200
                  bg-white/30 dark:bg-slate-800/30 
                  backdrop-blur-sm border border-slate-200 dark:border-slate-700/30
                  shadow-sm 
                  text-slate-700 dark:text-vynal-text-primary
                  hover:bg-white/40 dark:hover:bg-slate-800/40
                  hover:shadow-md 
                  hover:border-vynal-accent-primary/30 dark:hover:border-vynal-accent-primary/40
                  hover:text-vynal-accent-primary dark:hover:text-vynal-accent-primary
                  hover:-translate-y-0.5`}
              >
                {subcategory.name}
              </Link>
            );
          });
        })()
      ) : (
        // Fallback avec des données statiques des services les plus demandés
        [
          { name: 'Développement Web', category: 'developpement-web-mobile', subcategory: 'developpement-web' },
          { name: 'Marketing Digital', category: 'marketing-digital', subcategory: 'marketing-digital' },
          { name: 'Design UI/UX', category: 'design-graphique', subcategory: 'design-ui-ux' },
          { name: 'WordPress', category: 'developpement-web-mobile', subcategory: 'wordpress' },
          { name: 'Portraits IA', category: 'intelligence-artificielle', subcategory: 'portraits-ia' },
          { name: 'Développement Mobile', category: 'developpement-web-mobile', subcategory: 'developpement-mobile' },
          { name: 'Rédaction SEO IA', category: 'intelligence-artificielle', subcategory: 'redaction-seo-ia' },
          { name: 'Montage Vidéo', category: 'video-audio', subcategory: 'montage-video' },
          { name: 'Social Media', category: 'marketing-digital', subcategory: 'social-media' },
          { name: 'Chatbots E-commerce', category: 'intelligence-artificielle', subcategory: 'chatbots-e-commerce' },
          { name: 'Logos IA', category: 'intelligence-artificielle', subcategory: 'logos-ia' },
          { name: 'Motion Design', category: 'video-audio', subcategory: 'motion-design' },
          { name: 'E-commerce', category: 'developpement-web-mobile', subcategory: 'developpement-ecommerce' },
          { name: 'Traduction Spécialisée', category: 'intelligence-artificielle', subcategory: 'traduction-specialisee' },
          { name: 'Community Management', category: 'marketing-digital', subcategory: 'community-management' },
          { name: 'Création Site Vitrine', category: 'developpement-web-mobile', subcategory: 'creation-site-vitrine' },
          { name: 'Vidéos IA', category: 'intelligence-artificielle', subcategory: 'videos-ia' },
          { name: 'Automatisation Process', category: 'intelligence-artificielle', subcategory: 'automatisation-process' },
          { name: 'Analyse Prédictive', category: 'intelligence-artificielle', subcategory: 'analyse-predictive' },
          { name: 'Assistants Médias Sociaux', category: 'intelligence-artificielle', subcategory: 'assistants-medias-sociaux' },
          { name: 'Recherche IA', category: 'intelligence-artificielle', subcategory: 'recherche-ia' },
          { name: 'Voix Synthétiques', category: 'intelligence-artificielle', subcategory: 'voix-synthetiques' },
          { name: 'Résumés Documents', category: 'intelligence-artificielle', subcategory: 'resumes-documents' },
          { name: 'Logo Design', category: 'design-graphique', subcategory: 'logo-design' },
        ].map((subcat, index) => (
          <Link
            key={index}
            href={`/services?category=${subcat.category}&subcategory=${subcat.subcategory}`}
            className={`group inline-flex items-center rounded-full px-2 py-1 
              text-[10px] md:text-xs transition-all duration-200
              bg-white/30 dark:bg-slate-800/30 
              backdrop-blur-sm border border-slate-200 dark:border-slate-700/30 
              shadow-sm 
              text-slate-700 dark:text-vynal-text-primary
              hover:bg-white/40 dark:hover:bg-slate-800/40
              hover:shadow-md 
              hover:border-vynal-accent-primary/30 dark:hover:border-vynal-accent-primary/40
              hover:text-vynal-accent-primary dark:hover:text-vynal-accent-primary
              hover:-translate-y-0.5`}
          >
            {subcat.name}
          </Link>
        ))
      )}
    </div>
    
    {/* Bouton "Voir plus" pour accéder à toutes les sous-catégories */}
    <div className="text-center mt-8">
      <Link
        href="/services"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full
          bg-vynal-accent-primary/20 hover:bg-vynal-accent-primary/30
          dark:bg-vynal-accent-primary/10 dark:hover:bg-vynal-accent-primary/20
          text-vynal-accent-primary font-medium text-sm
          transition-all duration-200 hover:-translate-y-0.5"
      >
        Voir tous les services
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </Link>
    </div>
  </div>
</section>

      {/* Call to Action Section */}
      <section className="text-slate-800 dark:text-vynal-text-primary py-16 md:py-24">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-r from-vynal-accent-primary to-vynal-accent-secondary p-8 md:p-10 rounded-xl shadow-lg">
              <div className="flex flex-col items-center">
                <h2 className="text-2xl md:text-3xl font-bold mb-6 text-white text-center">
                  Prêt à rejoindre notre communauté?
                </h2>
                <p className="text-white/90 mb-8 text-center max-w-xl mx-auto">
                  Rejoignez notre communauté de freelances et de clients et découvrez une nouvelle façon de travailler.
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                  <Link 
                    href={`${AUTH_ROUTES.REGISTER}?role=client`}
                    className="bg-vynal-accent-primary hover:bg-vynal-accent-secondary text-white py-3 px-8 rounded-lg font-medium transition-all duration-300 shadow-md hover:shadow-vynal-accent-primary/20"
                  >
                    S'inscrire comme client
                  </Link>
                  <BorderBeamButtonDynamic href="/devenir-freelance" className="force-white-text">
                    S'inscrire comme freelance
                  </BorderBeamButtonDynamic>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <SchemaOrg data={schemaData} />
    </PageLayout>
  );
}