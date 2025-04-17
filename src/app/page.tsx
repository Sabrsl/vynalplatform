import Link from 'next/link';
import { ArrowRight, Search, Star, Shield, Clock } from 'lucide-react';
import PageLayout from '@/components/ui/PageLayout';
import SpotlightCard from '@/components/ui/SpotlightCard';
import { TextRevealSection } from '@/components/sections/TextRevealSection';
import { BorderBeamButton } from '@/components/ui/border-beam-button';

export default function Home() {
  return (
    <PageLayout fullGradient={true}>
      {/* Hero Section */}
      <section className="text-vynal-text-primary py-24">
        <div className="container mx-auto px-4 flex flex-col lg:flex-row items-center justify-between">
          <div className="lg:w-1/2 mb-10 lg:mb-0">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight bg-gradient-to-r from-vynal-accent-primary to-vynal-accent-secondary bg-clip-text text-transparent">
              Trouvez des freelances qualifiés pour tous vos projets
            </h1>
            <p className="text-xl text-vynal-text-secondary mb-10">
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
            <div className="bg-vynal-purple-dark/90 rounded-xl p-6 shadow-lg shadow-vynal-accent-secondary/20 border border-vynal-purple-secondary/30">
              <div className="flex items-center gap-2 mb-4">
                <Search size={20} className="text-vynal-accent-primary" />
                <input 
                  type="text" 
                  placeholder="Que recherchez-vous ?" 
                  className="w-full py-2 px-3 bg-vynal-purple-secondary/30 border border-vynal-purple-secondary/50 rounded-md text-vynal-text-primary focus:outline-none focus:ring-2 focus:ring-vynal-accent-primary focus:border-vynal-accent-primary placeholder:text-vynal-text-secondary/70"
                />
              </div>
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="bg-vynal-purple-secondary/20 text-vynal-text-secondary text-sm py-1 px-3 rounded-full border border-vynal-purple-secondary/30">Développement Web & Mobile</span>
                <span className="bg-vynal-purple-secondary/20 text-vynal-text-secondary text-sm py-1 px-3 rounded-full border border-vynal-purple-secondary/30">Design Graphique</span>
                <span className="bg-vynal-purple-secondary/20 text-vynal-text-secondary text-sm py-1 px-3 rounded-full border border-vynal-purple-secondary/30">Marketing Digital</span>
                <span className="bg-vynal-purple-secondary/20 text-vynal-text-secondary text-sm py-1 px-3 rounded-full border border-vynal-purple-secondary/30">Agriculture & Élevage</span>
                <span className="bg-vynal-purple-secondary/20 text-vynal-text-secondary text-sm py-1 px-3 rounded-full border border-vynal-purple-secondary/30">Informatique & Réseaux</span>
                <span className="bg-vynal-purple-secondary/20 text-vynal-text-secondary text-sm py-1 px-3 rounded-full border border-vynal-purple-secondary/30">Santé & Bien-être</span>
              </div>
              <button className="w-full bg-vynal-accent-primary hover:bg-vynal-accent-secondary text-vynal-purple-dark py-2 rounded-md font-medium transition-all">
                Rechercher
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - solid background cards */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-16 text-vynal-text-primary">Comment ça fonctionne</h2>
          <div className="grid md:grid-cols-3 gap-10">
            <SpotlightCard className="flex flex-col items-center text-center bg-vynal-purple-dark/80 p-8 rounded-xl text-vynal-text-primary border border-vynal-purple-secondary/30 shadow-lg shadow-vynal-accent-secondary/10 min-h-[320px] justify-between">
              <div className="mb-6 flex items-center justify-center">
                <Search className="w-10 h-10 text-vynal-accent-primary" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-3">Recherchez un service</h3>
                <p className="text-vynal-text-secondary">
                  Parcourez notre catalogue de services proposés par des freelances talentueux dans différentes catégories.
                </p>
              </div>
            </SpotlightCard>
            <SpotlightCard className="flex flex-col items-center text-center bg-vynal-purple-dark/80 p-8 rounded-xl text-vynal-text-primary border border-vynal-purple-secondary/30 shadow-lg shadow-vynal-accent-secondary/10 min-h-[320px] justify-between">
              <div className="mb-6 flex items-center justify-center">
                <Star className="w-10 h-10 text-vynal-accent-primary" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-3">Choisissez votre freelance</h3>
                <p className="text-vynal-text-secondary">
                  Consultez les profils, les avis et les portfolios pour trouver le freelance qui correspond à vos besoins.
                </p>
              </div>
            </SpotlightCard>
            <SpotlightCard className="flex flex-col items-center text-center bg-vynal-purple-dark/80 p-8 rounded-xl text-vynal-text-primary border border-vynal-purple-secondary/30 shadow-lg shadow-vynal-accent-secondary/10 min-h-[320px] justify-between">
              <div className="mb-6 flex items-center justify-center">
                <Shield className="w-10 h-10 text-vynal-accent-primary" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-3">Commandez en toute sécurité</h3>
                <p className="text-vynal-text-secondary">
                  Passez commande et suivez l'avancement de votre projet. Le paiement est sécurisé et relâché uniquement à la livraison.
                </p>
              </div>
            </SpotlightCard>
          </div>
        </div>
      </section>

      {/* Text Reveal Section */}
      <TextRevealSection />

      {/* Call to Action Section */}
      <section className="text-vynal-text-primary py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6 bg-gradient-to-r from-vynal-accent-primary to-vynal-accent-secondary bg-clip-text text-transparent">
            Prêt à rejoindre notre communauté?
          </h2>
          <p className="max-w-xl mx-auto mb-8 text-vynal-text-secondary">
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