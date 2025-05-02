"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Search, Star, Shield, Clock } from 'lucide-react';
import PageLayout from '@/components/ui/PageLayout';
import SpotlightCard from '@/components/ui/SpotlightCard';
import { TextRevealSection } from '@/components/sections/TextRevealSection';
import { BorderBeamButton } from '@/components/ui/border-beam-button';
import PartnersSection from '@/components/sections/PartnersSection';
import { useCategories } from '@/hooks/useCategories';
import { findBestCategoryMatch } from '@/lib/search/searchService';
import { useAuth } from "@/hooks/useAuth";
import { useUser } from "@/hooks/useUser";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const { categories, subcategories } = useCategories();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { isFreelance, isClient, isAdmin, loading: userLoading } = useUser();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (searchQuery.trim()) {
      setIsSearching(true);
      
      // Rediriger directement vers la page de recherche avec le terme de recherche
      router.push(`/services?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  // Fonction pour gérer les clics sur les catégories
  const handleCategoryClick = (categorySlug: string) => {
    // Rediriger simplement vers la catégorie sans chercher à atteindre les sous-catégories
    router.push(`/services?category=${categorySlug}`);
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
      {/* Hero Section */}
      <section className="text-vynal-text-primary py-24">
        <div className="container mx-auto px-4 flex flex-col lg:flex-row items-center justify-between">
          <div className="lg:w-1/2 mb-10 lg:mb-0">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight bg-gradient-to-r from-vynal-accent-primary to-vynal-accent-secondary bg-clip-text text-transparent">
              Trouvez des freelances qualifiés pour tous vos projets
            </h1>
            <p className="text-lg md:text-xl text-foreground dark:text-muted-foreground mb-10">
            La solution idéale pour accéder à des services digitaux fiables, fournis par des professionnels indépendants, à prix fixe.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link 
                href="/services" 
                className="bg-vynal-accent-primary hover:bg-vynal-accent-secondary text-vynal-purple-dark py-3 px-6 rounded-md font-medium flex items-center gap-2 transition-all shadow-lg shadow-vynal-accent-primary/20"
              >
                Explorer les services <ArrowRight size={18} />
              </Link>
              <BorderBeamButton href="/auth/signup?role=freelance">
                Devenir freelance
              </BorderBeamButton>
            </div>
          </div>
          <div className="lg:w-2/5 animate-fade-in">
            <div className="bg-white dark:bg-vynal-purple-dark/90 rounded-xl p-6 shadow-lg shadow-vynal-accent-secondary/20 border border-vynal-purple-dark/10 dark:border-vynal-purple-secondary/30">
              <form onSubmit={handleSearch}>
                <div className="flex items-center gap-2 mb-4">
                  <Search size={20} className="text-vynal-accent-primary" />
                  <input 
                    type="text" 
                    placeholder="Que recherchez-vous ?" 
                    className="w-full py-2 px-3 bg-vynal-purple-dark/5 dark:bg-vynal-purple-secondary/30 border border-vynal-purple-dark/20 dark:border-vynal-purple-secondary/50 rounded-md text-vynal-purple-dark dark:text-vynal-text-primary focus:outline-none focus:ring-2 focus:ring-vynal-accent-primary focus:border-vynal-accent-primary placeholder:text-vynal-purple-dark/50 dark:placeholder:text-vynal-text-secondary/70"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="flex flex-wrap gap-2 mb-4">
                  <Link href="/services?category=developpement-web-mobile" 
                    className="bg-white dark:bg-vynal-purple-dark/90 text-foreground dark:text-vynal-text-primary text-sm py-1 px-3 rounded-full border border-vynal-purple-dark/20 dark:border-vynal-accent-primary/20 hover:bg-vynal-purple-dark/5 dark:hover:bg-vynal-purple-dark/80 transition-all"
                    onClick={(e) => {
                      e.preventDefault();
                      handleCategoryClick('developpement-web-mobile');
                    }}>
                    Développement Web & Mobile
                  </Link>
                  <Link href="/services?category=design-graphique" 
                    className="bg-white dark:bg-vynal-purple-dark/90 text-foreground dark:text-vynal-text-primary text-sm py-1 px-3 rounded-full border border-vynal-purple-dark/20 dark:border-vynal-accent-primary/20 hover:bg-vynal-purple-dark/5 dark:hover:bg-vynal-purple-dark/80 transition-all"
                    onClick={(e) => {
                      e.preventDefault();
                      handleCategoryClick('design-graphique');
                    }}>
                    Design Graphique
                  </Link>
                  <Link href="/services?category=marketing-digital" 
                    className="bg-white dark:bg-vynal-purple-dark/90 text-foreground dark:text-vynal-text-primary text-sm py-1 px-3 rounded-full border border-vynal-purple-dark/20 dark:border-vynal-accent-primary/20 hover:bg-vynal-purple-dark/5 dark:hover:bg-vynal-purple-dark/80 transition-all"
                    onClick={(e) => {
                      e.preventDefault();
                      handleCategoryClick('marketing-digital');
                    }}>
                    Marketing Digital
                  </Link>
                  <Link href="/services?category=agriculture-elevage" 
                    className="bg-white dark:bg-vynal-purple-dark/90 text-foreground dark:text-vynal-text-primary text-sm py-1 px-3 rounded-full border border-vynal-purple-dark/20 dark:border-vynal-accent-primary/20 hover:bg-vynal-purple-dark/5 dark:hover:bg-vynal-purple-dark/80 transition-all"
                    onClick={(e) => {
                      e.preventDefault();
                      handleCategoryClick('agriculture-elevage');
                    }}>
                    Agriculture & Élevage
                  </Link>
                  <Link href="/services?category=informatique-reseaux" 
                    className="bg-white dark:bg-vynal-purple-dark/90 text-foreground dark:text-vynal-text-primary text-sm py-1 px-3 rounded-full border border-vynal-purple-dark/20 dark:border-vynal-accent-primary/20 hover:bg-vynal-purple-dark/5 dark:hover:bg-vynal-purple-dark/80 transition-all"
                    onClick={(e) => {
                      e.preventDefault();
                      handleCategoryClick('informatique-reseaux');
                    }}>
                    Informatique & Réseaux
                  </Link>
                  <Link href="/services?category=sante-bien-etre" 
                    className="bg-white dark:bg-vynal-purple-dark/90 text-foreground dark:text-vynal-text-primary text-sm py-1 px-3 rounded-full border border-vynal-purple-dark/20 dark:border-vynal-accent-primary/20 hover:bg-vynal-purple-dark/5 dark:hover:bg-vynal-purple-dark/80 transition-all"
                    onClick={(e) => {
                      e.preventDefault();
                      handleCategoryClick('sante-bien-etre');
                    }}>
                    Santé & Bien-être
                  </Link>
                </div>
                <button 
                  type="submit"
                  className="w-full bg-vynal-accent-primary hover:bg-vynal-accent-secondary text-vynal-purple-dark py-2 rounded-md font-medium transition-all flex items-center justify-center"
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
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-16 bg-gradient-to-r from-vynal-accent-primary to-vynal-accent-secondary bg-clip-text text-transparent">Comment ça fonctionne</h2>
          <div className="grid md:grid-cols-3 gap-10">
            <SpotlightCard className="flex flex-col items-center text-center bg-white dark:bg-vynal-purple-dark/80 p-8 rounded-xl text-foreground dark:text-vynal-text-primary border border-vynal-purple-dark/20 dark:border-vynal-purple-secondary/30 shadow-lg shadow-vynal-accent-secondary/10 min-h-[320px] justify-between">
              <div className="mb-6 flex items-center justify-center">
                <Search className="w-10 h-10 text-foreground dark:text-vynal-accent-primary" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-3 text-foreground dark:text-vynal-text-primary">Recherchez un service</h3>
                <p className="text-foreground/70 dark:text-vynal-text-secondary">
                  Parcourez notre catalogue de services proposés par des freelances talentueux dans différentes catégories.
                </p>
              </div>
            </SpotlightCard>
            <SpotlightCard className="flex flex-col items-center text-center bg-white dark:bg-vynal-purple-dark/80 p-8 rounded-xl text-foreground dark:text-vynal-text-primary border border-vynal-purple-dark/20 dark:border-vynal-purple-secondary/30 shadow-lg shadow-vynal-accent-secondary/10 min-h-[320px] justify-between">
              <div className="mb-6 flex items-center justify-center">
                <Star className="w-10 h-10 text-foreground dark:text-vynal-accent-primary" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-3 text-foreground dark:text-vynal-text-primary">Choisissez votre freelance</h3>
                <p className="text-foreground/70 dark:text-vynal-text-secondary">
                  Consultez les profils, les avis et les portfolios pour trouver le freelance qui correspond à vos besoins.
                </p>
              </div>
            </SpotlightCard>
            <SpotlightCard className="flex flex-col items-center text-center bg-white dark:bg-vynal-purple-dark/80 p-8 rounded-xl text-foreground dark:text-vynal-text-primary border border-vynal-purple-dark/20 dark:border-vynal-purple-secondary/30 shadow-lg shadow-vynal-accent-secondary/10 min-h-[320px] justify-between">
              <div className="mb-6 flex items-center justify-center">
                <Shield className="w-10 h-10 text-foreground dark:text-vynal-accent-primary" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-3 text-foreground dark:text-vynal-text-primary">Commandez en toute sécurité</h3>
                <p className="text-foreground/70 dark:text-vynal-text-secondary">
                  Passez commande et suivez l'avancement de votre projet. Le paiement est sécurisé et relâché uniquement à la livraison.
                </p>
              </div>
            </SpotlightCard>
          </div>
        </div>
      </section>

      {/* Text Reveal Section */}
      <TextRevealSection />

      {/* Partners Section */}
      <PartnersSection />

      {/* Call to Action Section */}
      <section className="text-vynal-text-primary py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6 bg-gradient-to-r from-vynal-accent-primary to-vynal-accent-secondary bg-clip-text text-transparent">
            Prêt à rejoindre notre communauté?
          </h2>
          <p className="max-w-xl mx-auto mb-8 text-foreground dark:text-muted-foreground">
            Rejoignez notre communauté de freelances et de clients et découvrez une nouvelle façon de travailler.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link 
              href="/auth/signup?role=client" 
              className="bg-vynal-accent-primary hover:bg-vynal-accent-secondary text-vynal-purple-dark py-3 px-8 rounded-md font-medium transition-all shadow-lg shadow-vynal-accent-primary/20"
            >
              S'inscrire comme client
            </Link>
            <BorderBeamButton href="/auth/signup?role=freelance">
              S'inscrire comme freelance
            </BorderBeamButton>
          </div>
        </div>
      </section>
    </PageLayout>
  );
}