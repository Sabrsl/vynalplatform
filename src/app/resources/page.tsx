"use client";

import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, BookOpen, Video, FileText, Users, Lightbulb, ExternalLink, ArrowRight, Search } from "lucide-react";
import { useState } from "react";

// Type pour les ressources
interface Resource {
  id: string;
  title: string;
  description: string;
  category: string;
  image: string;
  link: string;
  type: "guide" | "video" | "template" | "tool" | "community";
  new?: boolean;
  featured?: boolean;
}

// Données des ressources
const resources: Resource[] = [
  {
    id: "r1",
    title: "Guide complet pour démarrer en tant que freelance",
    description: "Tout ce que vous devez savoir pour lancer votre carrière de freelance avec succès sur Vynal Platform.",
    category: "Guide",
    image: "/img/resources/freelance-guide.jpg",
    link: "/resources/freelance-guide",
    type: "guide",
    featured: true
  },
  {
    id: "r2",
    title: "Optimiser votre profil pour attirer plus de clients",
    description: "Conseils pratiques pour créer un profil qui se démarque et attire l'attention des clients potentiels.",
    category: "Guide",
    image: "/img/resources/profile-optimization.jpg",
    link: "/resources/profile-optimization",
    type: "guide"
  },
  {
    id: "r3",
    title: "Modèles de contrats pour freelances",
    description: "Collection de modèles de contrats personnalisables pour sécuriser vos collaborations.",
    category: "Template",
    image: "/img/resources/contract-templates.jpg",
    link: "/resources/contract-templates",
    type: "template",
    new: true
  },
  {
    id: "r4",
    title: "Tutoriel vidéo: Comment utiliser le système de messagerie",
    description: "Guide étape par étape pour communiquer efficacement avec vos clients via notre système de messagerie.",
    category: "Vidéo",
    image: "/img/resources/messaging-tutorial.jpg",
    link: "/resources/messaging-tutorial",
    type: "video"
  },
  {
    id: "r5",
    title: "Calculateur de tarifs pour freelances",
    description: "Outil interactif pour déterminer les tarifs optimaux pour vos services en fonction de votre expérience et du marché.",
    category: "Outil",
    image: "/img/resources/pricing-calculator.jpg",
    link: "/tools/pricing-calculator",
    type: "tool",
    featured: true
  },
  {
    id: "r6",
    title: "Liste de vérification avant de lancer un projet",
    description: "Vérifiez que vous avez tout préparé avant de commencer un nouveau projet avec un client.",
    category: "Template",
    image: "/img/resources/project-checklist.jpg",
    link: "/resources/project-checklist",
    type: "template"
  },
  {
    id: "r7",
    title: "Communauté Vynal: Rejoignez nos événements",
    description: "Calendrier des webinaires, ateliers et rencontres virtuelles pour développer vos compétences et votre réseau.",
    category: "Communauté",
    image: "/img/resources/community-events.jpg",
    link: "/community/events",
    type: "community",
    new: true
  },
  {
    id: "r8",
    title: "Gérer les retours clients efficacement",
    description: "Stratégies pour traiter les feedbacks et maintenir d'excellentes relations avec vos clients.",
    category: "Guide",
    image: "/img/resources/feedback-management.jpg",
    link: "/resources/feedback-management",
    type: "guide"
  },
  {
    id: "r9",
    title: "Modèles de factures pour freelances",
    description: "Modèles de factures professionnels conformes aux exigences légales locales.",
    category: "Template",
    image: "/img/resources/invoice-templates.jpg",
    link: "/resources/invoice-templates",
    type: "template"
  },
  {
    id: "r10",
    title: "Tutoriel vidéo: Système de paiement et retraits",
    description: "Comment recevoir vos paiements et effectuer des retraits sur Vynal Platform.",
    category: "Vidéo",
    image: "/img/resources/payment-tutorial.jpg",
    link: "/resources/payment-tutorial",
    type: "video"
  },
  {
    id: "r11",
    title: "Guide de marketing pour freelances",
    description: "Stratégies efficaces pour promouvoir vos services et attirer plus de clients.",
    category: "Guide",
    image: "/img/resources/marketing-guide.jpg",
    link: "/resources/marketing-guide",
    type: "guide"
  },
  {
    id: "r12",
    title: "Communauté Discord pour freelances Vynal",
    description: "Rejoignez notre communauté de freelances pour partager des conseils, des opportunités et du soutien.",
    category: "Communauté",
    image: "/img/resources/discord-community.jpg",
    link: "https://discord.gg/vynalcommunity",
    type: "community"
  }
];

// Filtres disponibles
const filters = [
  { name: "Tous", value: "all" },
  { name: "Guides", value: "guide" },
  { name: "Vidéos", value: "video" },
  { name: "Templates", value: "template" },
  { name: "Outils", value: "tool" },
  { name: "Communauté", value: "community" }
];

// Icônes pour chaque type de ressource
const resourceTypeIcons = {
  guide: <BookOpen className="h-5 w-5" />,
  video: <Video className="h-5 w-5" />,
  template: <FileText className="h-5 w-5" />,
  tool: <Lightbulb className="h-5 w-5" />,
  community: <Users className="h-5 w-5" />
};

// Page Ressources principale
export default function ResourcesPage() {
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Filtrage des ressources
  const filteredResources = resources.filter(resource => {
    const matchesFilter = activeFilter === "all" || resource.type === activeFilter;
    const matchesSearch = resource.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         resource.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Ressources mises en avant
  const featuredResources = resources.filter(resource => resource.featured);

  return (
    <div className="min-h-screen bg-vynal-purple-dark">
      {/* En-tête décoratif */}
      <div className="absolute top-0 left-0 right-0 h-60 md:h-72 bg-gradient-to-b from-vynal-purple-dark to-vynal-purple-darkest -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/img/grid-pattern.svg')] bg-center opacity-10"></div>
        <div className="absolute -top-20 -right-20 w-60 md:w-96 h-60 md:h-96 bg-vynal-accent-secondary/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-20 -left-20 w-60 md:w-96 h-60 md:h-96 bg-vynal-accent-primary/20 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-4 py-8 md:py-12 relative">
        {/* Hero Section */}
        <div className="mb-10 md:mb-16 text-center">
          <h1 className="text-3xl md:text-5xl font-bold text-vynal-text-primary mb-4 md:mb-6 bg-clip-text text-transparent bg-gradient-to-r from-vynal-accent-primary to-vynal-accent-secondary">
            Centre de ressources
          </h1>
          <p className="mt-3 text-base md:text-lg text-vynal-text-secondary max-w-3xl mx-auto px-2">
            Découvrez notre collection de guides, outils et ressources pour développer vos compétences et maximiser votre succès sur Vynal Platform.
          </p>
        </div>

        {/* Recherche et filtres - Placé en haut sur mobile */}
        <div className="mb-8 md:mb-12">
          <div className="flex flex-col space-y-4">
            {/* Recherche - pleine largeur sur mobile */}
            <div className="w-full">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-vynal-text-secondary" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full pl-12 pr-4 py-3 bg-vynal-purple-secondary/10 border border-vynal-purple-secondary/30 rounded-xl text-vynal-text-primary placeholder-vynal-text-secondary/50 focus:ring-vynal-accent-primary focus:border-vynal-accent-primary"
                  placeholder="Rechercher une ressource..."
                />
              </div>
            </div>

            {/* Filtres - scroll horizontal sur mobile */}
            <div className="flex overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
              {filters.map((filter) => (
                <button
                  key={filter.value}
                  onClick={() => setActiveFilter(filter.value)}
                  className={`px-4 py-2 mx-1 whitespace-nowrap flex-shrink-0 font-medium rounded-full text-sm transition-colors ${
                    activeFilter === filter.value
                      ? "bg-vynal-accent-primary text-vynal-purple-dark"
                      : "bg-vynal-purple-secondary/20 text-vynal-text-primary hover:bg-vynal-purple-secondary/30"
                  }`}
                >
                  {filter.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Ressources mises en avant */}
        {featuredResources.length > 0 && (
          <div className="mb-12 md:mb-20">
            <h2 className="text-xl md:text-2xl font-bold text-vynal-text-primary mb-6 md:mb-8">Ressources recommandées</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
              {featuredResources.map((resource) => (
                <Link href={resource.link} key={resource.id}>
                  <Card className="bg-gradient-card border border-vynal-purple-secondary/30 rounded-xl overflow-hidden h-full shadow-lg shadow-vynal-accent-secondary/10 hover:shadow-vynal-accent-primary/20 transition-all duration-300 hover:scale-[1.02] hover:border-vynal-accent-primary/40">
                    <div className="relative h-40 md:h-48 overflow-hidden">
                      <div className="absolute inset-0 bg-vynal-purple-dark/60 z-10" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Image
                          src={resource.image}
                          alt={resource.title}
                          width={500}
                          height={300}
                          className="w-full h-full object-cover"
                          priority={true}
                          loading="lazy"
                          decoding="async"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          quality={75}
                        />
                      </div>
                      <div className="absolute top-3 md:top-4 left-3 md:left-4 z-20">
                        <span className="inline-flex items-center px-2 py-1 md:px-3 md:py-1 rounded-full text-xs font-medium bg-vynal-accent-primary/90 text-vynal-purple-dark">
                          {resourceTypeIcons[resource.type]}
                          <span className="ml-1">{resource.category}</span>
                        </span>
                      </div>
                      {resource.new && (
                        <div className="absolute top-3 md:top-4 right-3 md:right-4 z-20">
                          <span className="inline-flex items-center px-2 py-1 md:px-3 md:py-1 rounded-full text-xs font-medium bg-vynal-status-success/90 text-vynal-purple-dark">
                            Nouveau
                          </span>
                        </div>
                      )}
                    </div>
                    <CardHeader className="py-3 px-4 md:py-4 md:px-5">
                      <CardTitle className="text-lg md:text-xl text-vynal-text-primary">{resource.title}</CardTitle>
                      <CardDescription className="text-sm md:text-base text-vynal-text-secondary line-clamp-2">{resource.description}</CardDescription>
                    </CardHeader>
                    <CardFooter className="pt-0 px-4 pb-3 md:px-5 md:pb-4">
                      <Button variant="link" className="text-vynal-accent-primary hover:text-vynal-accent-secondary p-0 text-sm md:text-base font-medium">
                        Découvrir <ArrowRight className="ml-2 h-3 w-3 md:h-4 md:w-4" />
                      </Button>
                    </CardFooter>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Liste des ressources */}
        {filteredResources.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {filteredResources.map((resource) => (
              <Link href={resource.link} key={resource.id}>
                <Card className="bg-vynal-purple-dark/90 border border-vynal-purple-secondary/30 rounded-xl overflow-hidden h-full shadow-lg hover:shadow-vynal-accent-secondary/20 transition-all duration-300 hover:border-vynal-accent-primary/30">
                  <div className="relative h-32 sm:h-40 overflow-hidden">
                    <div className="absolute inset-0 bg-vynal-purple-dark/50 z-10" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Image
                        src={resource.image}
                        alt={resource.title}
                        width={400}
                        height={225}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        decoding="async"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        quality={75}
                      />
                    </div>
                    <div className="absolute top-2 left-2 md:top-3 md:left-3 z-20">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-vynal-accent-primary/80 text-vynal-purple-dark">
                        {resourceTypeIcons[resource.type]}
                        <span className="ml-1">{resource.category}</span>
                      </span>
                    </div>
                    {resource.new && (
                      <div className="absolute top-2 right-2 md:top-3 md:right-3 z-20">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-vynal-status-success/80 text-vynal-purple-dark">
                          Nouveau
                        </span>
                      </div>
                    )}
                  </div>
                  <CardHeader className="py-3 px-4 md:py-4 md:px-5">
                    <CardTitle className="text-base md:text-lg text-vynal-text-primary line-clamp-1">{resource.title}</CardTitle>
                    <CardDescription className="text-sm text-vynal-text-secondary line-clamp-2">{resource.description}</CardDescription>
                  </CardHeader>
                  <CardFooter className="pt-0 px-4 pb-3 md:px-5 md:pb-4">
                    <Button variant="link" className="text-vynal-accent-primary hover:text-vynal-accent-secondary p-0 text-sm font-medium">
                      {resource.link.startsWith("http") ? (
                        <>
                          Accéder <ExternalLink className="ml-1 h-3 w-3" />
                        </>
                      ) : (
                        <>
                          Consulter <ArrowRight className="ml-1 h-3 w-3" />
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 md:py-12">
            <p className="text-vynal-text-secondary text-base md:text-lg">Aucune ressource ne correspond à votre recherche.</p>
            <Button 
              variant="link" 
              className="text-vynal-accent-primary mt-2"
              onClick={() => {
                setActiveFilter("all");
                setSearchQuery("");
              }}
            >
              Réinitialiser les filtres
            </Button>
          </div>
        )}

        {/* Accès aux ressources supplémentaires */}
        <div className="mt-16 md:mt-24 max-w-3xl mx-auto">
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-r from-vynal-accent-primary/20 to-vynal-accent-secondary/20 rounded-2xl blur-xl opacity-70"></div>
            <Card className="bg-vynal-purple-dark/90 border-vynal-purple-secondary/30 rounded-xl overflow-hidden shadow-lg shadow-vynal-accent-secondary/20 backdrop-blur-sm relative">
              <CardContent className="p-6 md:p-8 text-center">
                <h2 className="text-xl md:text-2xl font-bold text-vynal-text-primary mb-3 md:mb-4">
                  Ressources exclusives
                </h2>
                <p className="text-sm md:text-base text-vynal-text-secondary mb-5 md:mb-6 max-w-xl mx-auto">
                  Accédez à notre bibliothèque complète de ressources premium pour développer vos compétences et faire passer votre carrière au niveau supérieur.
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-3 md:gap-4">
                  <Button className="bg-vynal-accent-primary hover:bg-vynal-accent-secondary text-vynal-purple-dark text-sm md:text-base">
                    <Download className="mr-2 h-4 w-4" /> Télécharger le guide complet
                  </Button>
                  <Link href="/community" className="w-full sm:w-auto">
                    <Button variant="outline" className="w-full border-vynal-purple-secondary/50 text-vynal-text-primary hover:bg-vynal-purple-secondary/20 text-sm md:text-base">
                      Rejoindre la communauté
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 