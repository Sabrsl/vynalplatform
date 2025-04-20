import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Users, Target, Clock, Globe, Award, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "À propos | Vynal Platform",
  description: "Découvrez l'histoire et la mission de Vynal Platform, la plateforme de mise en relation entre freelances et clients au Sénégal",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-vynal-purple-dark">
      {/* En-tête décoratif */}
      <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-vynal-purple-dark to-vynal-purple-darkest -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/img/grid-pattern.svg')] bg-center opacity-10"></div>
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-vynal-accent-secondary/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-vynal-accent-primary/20 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-4 py-12 relative">
        {/* Hero Section */}
        <div className="mb-16 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-vynal-text-primary mb-6">
            Notre histoire
          </h1>
          <p className="mt-4 text-lg text-vynal-text-secondary max-w-3xl mx-auto">
            Vynal Platform est née d'une vision simple mais ambitieuse : créer un pont entre les talents freelance et les entreprises au Sénégal et en Afrique.
          </p>
        </div>

        {/* Vision & Mission */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-20">
          <div className="relative">
            <div className="absolute -inset-2 bg-gradient-to-r from-vynal-accent-primary/20 to-vynal-accent-secondary/20 rounded-2xl blur-xl opacity-70"></div>
            <Card className="h-full bg-vynal-purple-dark/90 border-vynal-purple-secondary/30 rounded-xl overflow-hidden shadow-lg shadow-vynal-accent-secondary/20 backdrop-blur-sm relative">
              <CardContent className="p-8">
                <div className="w-12 h-12 mb-6 flex items-center justify-center bg-vynal-purple-secondary/20 rounded-full border border-vynal-purple-secondary/30">
                  <Target className="h-6 w-6 text-vynal-accent-primary" />
                </div>
                <h2 className="text-2xl font-bold text-vynal-text-primary mb-4">Notre mission</h2>
                <p className="text-vynal-text-secondary mb-4">
                  Vynal Platform a pour mission de démocratiser l'accès au travail freelance au Sénégal en connectant des talents locaux avec des clients nationaux et internationaux.
                </p>
                <p className="text-vynal-text-secondary">
                  Nous nous engageons à créer un écosystème où l'excellence et la transparence sont les piliers d'une collaboration réussie entre freelances et clients.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="relative">
            <div className="absolute -inset-2 bg-gradient-to-r from-vynal-accent-secondary/20 to-vynal-accent-primary/20 rounded-2xl blur-xl opacity-70"></div>
            <Card className="h-full bg-vynal-purple-dark/90 border-vynal-purple-secondary/30 rounded-xl overflow-hidden shadow-lg shadow-vynal-accent-secondary/20 backdrop-blur-sm relative">
              <CardContent className="p-8">
                <div className="w-12 h-12 mb-6 flex items-center justify-center bg-vynal-purple-secondary/20 rounded-full border border-vynal-purple-secondary/30">
                  <Users className="h-6 w-6 text-vynal-accent-primary" />
                </div>
                <h2 className="text-2xl font-bold text-vynal-text-primary mb-4">Notre vision</h2>
                <p className="text-vynal-text-secondary mb-4">
                  Notre vision est de devenir la plateforme de référence pour le travail freelance en Afrique de l'Ouest, en contribuant activement au développement de l'économie numérique africaine.
                </p>
                <p className="text-vynal-text-secondary">
                  Nous imaginons un futur où chaque talent africain peut s'épanouir professionnellement, en travaillant sur des projets stimulants, tout en restant connecté à ses racines.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Notre histoire */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-center mb-12 text-vynal-text-primary">
            Notre parcours
          </h2>
          <div className="max-w-4xl mx-auto">
            <div className="relative">
              {/* Ligne de temps verticale */}
              <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-0.5 bg-vynal-purple-secondary/30"></div>
              
              <div className="space-y-12">
                {/* 2021 */}
                <div className="relative">
                  <div className="absolute left-1/2 transform -translate-x-1/2 -mt-2 w-8 h-8 rounded-full bg-vynal-accent-primary flex items-center justify-center border-4 border-vynal-purple-dark">
                    <span className="text-vynal-purple-dark text-xs font-bold">1</span>
                  </div>
                  
                  <div className="ml-auto mr-[52%] p-6 bg-vynal-purple-dark/90 border border-vynal-purple-secondary/30 rounded-xl shadow-lg shadow-vynal-accent-secondary/10 backdrop-blur-sm">
                    <h3 className="text-xl font-bold text-vynal-text-primary mb-2">2021 - L'idée</h3>
                    <p className="text-vynal-text-secondary">
                      Face aux défis rencontrés par les freelances sénégalais pour accéder à des opportunités de qualité, l'idée de Vynal Platform est née. Notre fondateur a imaginé une plateforme adaptée aux réalités africaines.
                    </p>
                  </div>
                </div>

                {/* 2022 */}
                <div className="relative">
                  <div className="absolute left-1/2 transform -translate-x-1/2 -mt-2 w-8 h-8 rounded-full bg-vynal-accent-primary flex items-center justify-center border-4 border-vynal-purple-dark">
                    <span className="text-vynal-purple-dark text-xs font-bold">2</span>
                  </div>
                  
                  <div className="mr-auto ml-[52%] p-6 bg-vynal-purple-dark/90 border border-vynal-purple-secondary/30 rounded-xl shadow-lg shadow-vynal-accent-secondary/10 backdrop-blur-sm">
                    <h3 className="text-xl font-bold text-vynal-text-primary mb-2">2022 - Développement</h3>
                    <p className="text-vynal-text-secondary">
                      Après des mois de recherche et de développement, la première version de Vynal Platform a vu le jour. Une équipe passionnée et multiculturelle s'est formée pour concrétiser ce projet ambitieux.
                    </p>
                  </div>
                </div>

                {/* 2023 */}
                <div className="relative">
                  <div className="absolute left-1/2 transform -translate-x-1/2 -mt-2 w-8 h-8 rounded-full bg-vynal-accent-primary flex items-center justify-center border-4 border-vynal-purple-dark">
                    <span className="text-vynal-purple-dark text-xs font-bold">3</span>
                  </div>
                  
                  <div className="ml-auto mr-[52%] p-6 bg-vynal-purple-dark/90 border border-vynal-purple-secondary/30 rounded-xl shadow-lg shadow-vynal-accent-secondary/10 backdrop-blur-sm">
                    <h3 className="text-xl font-bold text-vynal-text-primary mb-2">2023 - Lancement</h3>
                    <p className="text-vynal-text-secondary">
                      Le lancement officiel de Vynal Platform a marqué le début d'une nouvelle ère pour le freelancing en Afrique de l'Ouest. Nos premiers utilisateurs ont rapidement adopté la plateforme.
                    </p>
                  </div>
                </div>

                {/* 2024 */}
                <div className="relative">
                  <div className="absolute left-1/2 transform -translate-x-1/2 -mt-2 w-8 h-8 rounded-full bg-vynal-accent-primary flex items-center justify-center border-4 border-vynal-purple-dark">
                    <span className="text-vynal-purple-dark text-xs font-bold">4</span>
                  </div>
                  
                  <div className="mr-auto ml-[52%] p-6 bg-vynal-purple-dark/90 border border-vynal-purple-secondary/30 rounded-xl shadow-lg shadow-vynal-accent-secondary/10 backdrop-blur-sm">
                    <h3 className="text-xl font-bold text-vynal-text-primary mb-2">2024 - Croissance</h3>
                    <p className="text-vynal-text-secondary">
                      Aujourd'hui, Vynal Platform connaît une croissance exponentielle, avec des milliers de freelances et de clients qui collaborent chaque jour. Notre communauté s'agrandit et notre impact s'étend à travers le continent.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Nos valeurs */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-center mb-12 text-vynal-text-primary">
            Nos valeurs
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-vynal-purple-dark/90 border-vynal-purple-secondary/30 rounded-xl shadow-lg shadow-vynal-accent-secondary/20 backdrop-blur-sm h-full">
              <CardContent className="p-6">
                <div className="w-12 h-12 mb-6 flex items-center justify-center bg-vynal-purple-secondary/20 rounded-full border border-vynal-purple-secondary/30">
                  <Award className="h-6 w-6 text-vynal-accent-primary" />
                </div>
                <h3 className="text-xl font-semibold text-vynal-text-primary mb-2">Excellence</h3>
                <p className="text-vynal-text-secondary">
                  Nous promouvons l'excellence dans chaque interaction, chaque service et chaque échange sur notre plateforme. Nous croyons que le talent africain mérite d'être reconnu à sa juste valeur.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-vynal-purple-dark/90 border-vynal-purple-secondary/30 rounded-xl shadow-lg shadow-vynal-accent-secondary/20 backdrop-blur-sm h-full">
              <CardContent className="p-6">
                <div className="w-12 h-12 mb-6 flex items-center justify-center bg-vynal-purple-secondary/20 rounded-full border border-vynal-purple-secondary/30">
                  <Globe className="h-6 w-6 text-vynal-accent-primary" />
                </div>
                <h3 className="text-xl font-semibold text-vynal-text-primary mb-2">Inclusivité</h3>
                <p className="text-vynal-text-secondary">
                  Chez Vynal, nous célébrons la diversité des talents et des perspectives. Notre plateforme est conçue pour être accessible à tous, indépendamment de leur parcours ou de leur localisation.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-vynal-purple-dark/90 border-vynal-purple-secondary/30 rounded-xl shadow-lg shadow-vynal-accent-secondary/20 backdrop-blur-sm h-full">
              <CardContent className="p-6">
                <div className="w-12 h-12 mb-6 flex items-center justify-center bg-vynal-purple-secondary/20 rounded-full border border-vynal-purple-secondary/30">
                  <Clock className="h-6 w-6 text-vynal-accent-primary" />
                </div>
                <h3 className="text-xl font-semibold text-vynal-text-primary mb-2">Innovation</h3>
                <p className="text-vynal-text-secondary">
                  L'innovation est au cœur de notre approche. Nous recherchons constamment de nouvelles façons d'améliorer l'expérience utilisateur et de répondre aux besoins évolutifs de notre communauté.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Notre équipe */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-center mb-12 text-vynal-text-primary">
            L'équipe derrière Vynal
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Fondateur */}
            <div className="bg-vynal-purple-dark/90 border border-vynal-purple-secondary/30 rounded-xl overflow-hidden shadow-lg shadow-vynal-accent-secondary/20 backdrop-blur-sm">
              <div className="h-60 w-full relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-vynal-purple-dark/80 z-10"></div>
                <Image 
                  src="/assets/team/founder.jpg" 
                  alt="Fondateur" 
                  width={300} 
                  height={400}
                  className="w-full h-full object-cover" 
                />
              </div>
              <div className="p-4 text-center">
                <h3 className="text-xl font-semibold text-vynal-text-primary">Amadou Diallo</h3>
                <p className="text-sm text-vynal-accent-primary">Fondateur & CEO</p>
              </div>
            </div>

            {/* CTO */}
            <div className="bg-vynal-purple-dark/90 border border-vynal-purple-secondary/30 rounded-xl overflow-hidden shadow-lg shadow-vynal-accent-secondary/20 backdrop-blur-sm">
              <div className="h-60 w-full relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-vynal-purple-dark/80 z-10"></div>
                <Image 
                  src="/assets/team/cto.jpg" 
                  alt="CTO" 
                  width={300} 
                  height={400}
                  className="w-full h-full object-cover" 
                />
              </div>
              <div className="p-4 text-center">
                <h3 className="text-xl font-semibold text-vynal-text-primary">Marie Faye</h3>
                <p className="text-sm text-vynal-accent-primary">CTO</p>
              </div>
            </div>

            {/* CMO */}
            <div className="bg-vynal-purple-dark/90 border border-vynal-purple-secondary/30 rounded-xl overflow-hidden shadow-lg shadow-vynal-accent-secondary/20 backdrop-blur-sm">
              <div className="h-60 w-full relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-vynal-purple-dark/80 z-10"></div>
                <Image 
                  src="/assets/team/cmo.jpg" 
                  alt="CMO" 
                  width={300} 
                  height={400}
                  className="w-full h-full object-cover" 
                />
              </div>
              <div className="p-4 text-center">
                <h3 className="text-xl font-semibold text-vynal-text-primary">Ibrahima Sow</h3>
                <p className="text-sm text-vynal-accent-primary">CMO</p>
              </div>
            </div>

            {/* COO */}
            <div className="bg-vynal-purple-dark/90 border border-vynal-purple-secondary/30 rounded-xl overflow-hidden shadow-lg shadow-vynal-accent-secondary/20 backdrop-blur-sm">
              <div className="h-60 w-full relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-vynal-purple-dark/80 z-10"></div>
                <Image 
                  src="/assets/team/coo.jpg" 
                  alt="COO" 
                  width={300} 
                  height={400}
                  className="w-full h-full object-cover" 
                />
              </div>
              <div className="p-4 text-center">
                <h3 className="text-xl font-semibold text-vynal-text-primary">Fatou Diop</h3>
                <p className="text-sm text-vynal-accent-primary">COO</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="mb-20">
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-r from-vynal-accent-primary/20 to-vynal-accent-secondary/20 rounded-2xl blur-xl opacity-70"></div>
            <Card className="bg-vynal-purple-dark/90 border-vynal-purple-secondary/30 rounded-xl shadow-lg shadow-vynal-accent-secondary/20 backdrop-blur-sm relative">
              <CardContent className="p-8">
                <h2 className="text-3xl font-bold text-center mb-12 text-vynal-text-primary">
                  Vynal Platform en chiffres
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                  <div className="text-center">
                    <p className="text-4xl font-bold text-vynal-accent-primary mb-2">10 000+</p>
                    <p className="text-lg text-vynal-text-secondary">Freelances</p>
                  </div>
                  <div className="text-center">
                    <p className="text-4xl font-bold text-vynal-accent-primary mb-2">5 000+</p>
                    <p className="text-lg text-vynal-text-secondary">Clients</p>
                  </div>
                  <div className="text-center">
                    <p className="text-4xl font-bold text-vynal-accent-primary mb-2">15 000+</p>
                    <p className="text-lg text-vynal-text-secondary">Projets réalisés</p>
                  </div>
                  <div className="text-center">
                    <p className="text-4xl font-bold text-vynal-accent-primary mb-2">12</p>
                    <p className="text-lg text-vynal-text-secondary">Pays desservis</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-vynal-text-primary mb-6">
            Prêt à rejoindre l'aventure ?
          </h2>
          <p className="text-lg text-vynal-text-secondary max-w-2xl mx-auto mb-8">
            Que vous soyez un freelance talentueux ou un client à la recherche d'expertise, Vynal Platform vous accompagne dans votre réussite.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button className="bg-vynal-accent-primary hover:bg-vynal-accent-secondary text-vynal-purple-dark px-8 py-6 text-lg">
              S'inscrire comme freelance
            </Button>
            <Button className="bg-vynal-purple-secondary/30 hover:bg-vynal-purple-secondary/50 text-vynal-text-primary border border-vynal-purple-secondary/50 px-8 py-6 text-lg">
              Trouver un freelance
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 