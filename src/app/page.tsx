"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Search, Star, Shield } from 'lucide-react';
import PageLayout from '@/components/ui/PageLayout';
import SpotlightCard from '@/components/ui/SpotlightCard';
import { TextRevealSection } from '@/components/sections/TextRevealSection';
import { BorderBeamButton } from '@/components/ui/border-beam-button';
import PartnersSection from '@/components/sections/PartnersSection';
import { useCategories } from '@/hooks/useCategories';
import { findBestCategoryMatch } from '@/lib/search/searchService';
import { useAuth } from "@/hooks/useAuth";
import { useUser } from "@/hooks/useUser";
import { PUBLIC_ROUTES, AUTH_ROUTES } from "@/config/routes";
import dynamic from 'next/dynamic';
import { memo } from 'react';
import { getCachedData, setCachedData, CACHE_EXPIRY } from '@/lib/optimizations';
import { supabase } from '@/lib/supabase/client';

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

const FastLCPTitle = memo(() => (
  <h1 
    className="text-4xl md:text-5xl font-bold mb-6 leading-tight bg-gradient-to-r from-vynal-accent-secondary to-vynal-accent-primary bg-clip-text text-transparent" 
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
  const { categories, subcategories } = useCategories();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { isFreelance, isClient, isAdmin, loading: userLoading } = useUser();

  // Référence pour suivre si le composant est monté
  const mountedRef = useRef(true);

  // Cache simple pour la page d'accueil
  useEffect(() => {
    // Fonction pour récupérer ou mettre en cache les données
    const checkCache = async () => {
      try {
        // Vérifier si des données sont en cache
        const cachedData = getCachedData(HOMEPAGE_CACHE_KEY);
        
        if (!cachedData) {
          // Si pas de cache, créer une entrée de cache avec les catégories
          setCachedData(
            HOMEPAGE_CACHE_KEY,
            {
              categories,
              timestamp: Date.now(),
              version: '1.0'
            },
            { 
              expiry: 14 * 24 * 60 * 60 * 1000, // 14 jours pour une page d'accueil
              priority: 'high'
            }
          );
        }
      } catch (error) {
        console.error('Erreur lors de la vérification du cache:', error);
      }
    };

    // Exécuter seulement côté client et si le composant est monté
    if (typeof window !== 'undefined') {
      checkCache();
    }

    return () => {
      // Marquer le composant comme démonté
      mountedRef.current = false;
    };
  }, [categories]);

  // Détecter les appareils mobiles pour optimiser les performances
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768 || navigator.userAgent.toLowerCase().includes('mobi');
      setIsMobile(mobile);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Charger les composants non critiques de manière différée
  useEffect(() => {
    // Utiliser requestIdleCallback ou setTimeout pour différer les calculs non critiques
    const loadNonCriticalComponents = () => {
      setLoadedComponents(true);
    };
    
    if (typeof window !== 'undefined') {
      if ('requestIdleCallback' in window) {
        // @ts-ignore
        window.requestIdleCallback(loadNonCriticalComponents, { timeout: 2000 });
      } else {
        // Fallback pour les navigateurs qui ne supportent pas requestIdleCallback
        setTimeout(loadNonCriticalComponents, 1000);
      }
    }
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (searchQuery.trim()) {
      setIsSearching(true);
      
      // Rediriger directement vers la page de recherche avec le terme de recherche
      router.push(`${PUBLIC_ROUTES.SERVICES}?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  // Fonction pour gérer les clics sur les catégories
  const handleCategoryClick = (categorySlug: string) => {
    // Rediriger simplement vers la catégorie sans chercher à atteindre les sous-catégories
    router.push(`${PUBLIC_ROUTES.SERVICES}?category=${categorySlug}`);
  };

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

  return (
    <PageLayout fullGradient={true}>
      {/* Chatbot visible uniquement sur la page d'accueil */}
      <WelcomeChatbotDynamic />
      
      {/* Hero Section - LCP */}
      <section className="text-slate-800 dark:text-vynal-text-primary py-16 md:py-24">
        <div className="container mx-auto px-4 flex flex-col lg:flex-row items-center justify-between">
          <div className="lg:w-1/2 mb-10 lg:mb-0" id="lcp-container">
            <FastLCPTitle />
            <p className="text-sm md:text-base lg:text-lg text-slate-600 dark:text-vynal-text-secondary mb-10">
            La solution idéale pour accéder à des services digitaux fiables, fournis par des professionnels indépendants, à prix fixe.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link 
                href={PUBLIC_ROUTES.SERVICES} 
                className="bg-vynal-accent-primary hover:bg-vynal-accent-secondary text-vynal-purple-dark py-3 px-6 rounded-lg font-medium flex items-center gap-2 transition-all duration-200 shadow-sm"
                prefetch={true}
              >
                Explorer les services <ArrowRight size={18} />
              </Link>
              <BorderBeamButton href="/devenir-freelance" className="force-white-text">
                Devenir freelance
              </BorderBeamButton>
            </div>
          </div>
          <div className="lg:w-2/5 animate-fade-in">
            <div className="bg-white/30 dark:bg-vynal-purple-dark/90 backdrop-blur-sm rounded-lg p-6 shadow-sm border border-slate-200 dark:border-vynal-purple-secondary/30">
              <form onSubmit={handleSearch}>
                <div className="flex items-center gap-2 mb-4">
                  <Search size={20} className="text-vynal-accent-primary" />
                  <input 
                    type="text" 
                    placeholder="Que recherchez-vous ?" 
                    className="w-full py-2 px-3 bg-white/40 dark:bg-vynal-purple-secondary/30 border border-slate-300 dark:border-vynal-purple-secondary/50 rounded-lg text-slate-800 dark:text-vynal-text-primary focus:outline-none focus:ring-2 focus:ring-vynal-accent-primary focus:border-vynal-accent-primary placeholder:text-slate-600 dark:placeholder:text-vynal-text-secondary/70 transition-all duration-200"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="flex flex-wrap gap-2 mb-4">
                  <Link href={`${PUBLIC_ROUTES.SERVICES}?category=developpement-web-mobile`} 
                    className="bg-white/25 dark:bg-vynal-purple-dark/90 text-slate-800 dark:text-vynal-text-primary text-sm py-1 px-3 rounded-full border border-slate-300 dark:border-vynal-accent-primary/20 hover:bg-slate-100 dark:hover:bg-vynal-purple-dark/80 transition-all duration-200"
                    onClick={(e) => {
                      e.preventDefault();
                      handleCategoryClick('developpement-web-mobile');
                    }}>
                    Développement Web & Mobile
                  </Link>
                  <Link href={`${PUBLIC_ROUTES.SERVICES}?category=design-graphique`} 
                    className="bg-white/25 dark:bg-vynal-purple-dark/90 text-slate-800 dark:text-vynal-text-primary text-sm py-1 px-3 rounded-full border border-slate-300 dark:border-vynal-accent-primary/20 hover:bg-slate-100 dark:hover:bg-vynal-purple-dark/80 transition-all duration-200"
                    onClick={(e) => {
                      e.preventDefault();
                      handleCategoryClick('design-graphique');
                    }}>
                    Design Graphique
                  </Link>
                  <Link href={`${PUBLIC_ROUTES.SERVICES}?category=marketing-digital`} 
                    className="bg-white/25 dark:bg-vynal-purple-dark/90 text-slate-800 dark:text-vynal-text-primary text-sm py-1 px-3 rounded-full border border-slate-300 dark:border-vynal-accent-primary/20 hover:bg-slate-100 dark:hover:bg-vynal-purple-dark/80 transition-all duration-200"
                    onClick={(e) => {
                      e.preventDefault();
                      handleCategoryClick('marketing-digital');
                    }}>
                    Marketing Digital
                  </Link>
                  <Link href={`${PUBLIC_ROUTES.SERVICES}?category=agriculture-elevage`}
                    className="bg-white/25 dark:bg-vynal-purple-dark/90 text-slate-800 dark:text-vynal-text-primary text-sm py-1 px-3 rounded-full border border-slate-300 dark:border-vynal-accent-primary/20 hover:bg-slate-100 dark:hover:bg-vynal-purple-dark/80 transition-all duration-200"
                    onClick={(e) => {
                      e.preventDefault();
                      handleCategoryClick('agriculture-elevage');
                    }}>
                    Agriculture & Élevage
                  </Link>
                  <Link href={`${PUBLIC_ROUTES.SERVICES}?category=informatique-reseaux`}
                    className="bg-white/25 dark:bg-vynal-purple-dark/90 text-slate-800 dark:text-vynal-text-primary text-sm py-1 px-3 rounded-full border border-slate-300 dark:border-vynal-accent-primary/20 hover:bg-slate-100 dark:hover:bg-vynal-purple-dark/80 transition-all duration-200"
                    onClick={(e) => {
                      e.preventDefault();
                      handleCategoryClick('informatique-reseaux');
                    }}>
                    Informatique & Réseaux
                  </Link>
                  <Link href={`${PUBLIC_ROUTES.SERVICES}?category=sante-bien-etre`}
                    className="bg-white/25 dark:bg-vynal-purple-dark/90 text-slate-800 dark:text-vynal-text-primary text-sm py-1 px-3 rounded-full border border-slate-300 dark:border-vynal-accent-primary/20 hover:bg-slate-100 dark:hover:bg-vynal-purple-dark/80 transition-all duration-200"
                    onClick={(e) => {
                      e.preventDefault();
                      handleCategoryClick('sante-bien-etre');
                    }}>
                    Santé & Bien-être
                  </Link>
                </div>
                <button 
                  type="submit"
                  className="w-full bg-vynal-accent-primary hover:bg-vynal-accent-secondary text-vynal-purple-dark py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center shadow-sm"
                  disabled={isSearching}
                >
                  {isSearching ? (
                    <>
                      <div className="h-4 w-4 border-2 border-vynal-purple-dark border-t-transparent rounded-full animate-spin mr-2"></div>
                      Recherche en cours...
                    </>
                  ) : (
                    "Rechercher"
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - solid background cards */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-16 bg-gradient-to-r from-vynal-accent-primary to-vynal-accent-secondary bg-clip-text text-transparent">Comment ça fonctionne</h2>
          <div className="grid md:grid-cols-3 gap-10">
            <SpotlightCard 
              className="flex flex-col items-center text-center bg-white/30 dark:bg-vynal-purple-dark/80 backdrop-blur-sm p-8 rounded-lg text-slate-800 dark:text-vynal-text-primary border border-slate-200 dark:border-vynal-purple-secondary/30 shadow-sm min-h-[320px] justify-between transition-all duration-200"
              disableEffects={isMobile}
            >
              <div className="mb-6 flex items-center justify-center">
                <Search className="w-10 h-10 text-vynal-accent-primary" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-3 text-slate-800 dark:text-vynal-text-primary">Recherchez un service</h3>
                <p className="text-slate-600 dark:text-vynal-text-secondary">
                  Parcourez notre catalogue de services proposés par des freelances talentueux dans différentes catégories.
                </p>
              </div>
            </SpotlightCard>
            <SpotlightCard 
              className="flex flex-col items-center text-center bg-white/30 dark:bg-vynal-purple-dark/80 backdrop-blur-sm p-8 rounded-lg text-slate-800 dark:text-vynal-text-primary border border-slate-200 dark:border-vynal-purple-secondary/30 shadow-sm min-h-[320px] justify-between transition-all duration-200"
              disableEffects={isMobile}
            >
              <div className="mb-6 flex items-center justify-center">
                <Star className="w-10 h-10 text-vynal-accent-primary" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-3 text-slate-800 dark:text-vynal-text-primary">Choisissez votre freelance</h3>
                <p className="text-slate-600 dark:text-vynal-text-secondary">
                  Consultez les profils, les avis et les portfolios pour trouver le freelance qui correspond à vos besoins.
                </p>
              </div>
            </SpotlightCard>
            <SpotlightCard 
              className="flex flex-col items-center text-center bg-white/30 dark:bg-vynal-purple-dark/80 backdrop-blur-sm p-8 rounded-lg text-slate-800 dark:text-vynal-text-primary border border-slate-200 dark:border-vynal-purple-secondary/30 shadow-sm min-h-[320px] justify-between transition-all duration-200"
              disableEffects={isMobile}
            >
              <div className="mb-6 flex items-center justify-center">
                <Shield className="w-10 h-10 text-vynal-accent-primary" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-3 text-slate-800 dark:text-vynal-text-primary">Commandez en toute sécurité</h3>
                <p className="text-slate-600 dark:text-vynal-text-secondary">
                  Passez commande et suivez l'avancement de votre projet. Le paiement est sécurisé et relâché uniquement à la livraison.
                </p>
              </div>
            </SpotlightCard>
          </div>
        </div>
      </section>

      {/* Text Reveal Section */}
      <TextRevealSectionDynamic />

      {/* Partners Section */}
      <PartnersSectionDynamic />

      {/* Call to Action Section */}
      <section className="text-slate-800 dark:text-vynal-text-primary py-16 md:py-24">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6 bg-gradient-to-r from-vynal-accent-primary to-vynal-accent-secondary bg-clip-text text-transparent">
            Prêt à rejoindre notre communauté?
          </h2>
          <p className="max-w-xl mx-auto mb-8 text-slate-600 dark:text-vynal-text-secondary">
            Rejoignez notre communauté de freelances et de clients et découvrez une nouvelle façon de travailler.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link 
              href={`${AUTH_ROUTES.REGISTER}?role=client`}
              className="bg-vynal-accent-primary hover:bg-vynal-accent-secondary text-vynal-purple-dark py-3 px-8 rounded-lg font-medium transition-all duration-200 shadow-sm"
            >
              S'inscrire comme client
            </Link>
            <BorderBeamButtonDynamic href="/devenir-freelance" className="force-white-text">
              S'inscrire comme freelance
            </BorderBeamButtonDynamic>
          </div>
        </div>
      </section>
    </PageLayout>
  );
}