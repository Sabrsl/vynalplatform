import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Search, 
  Users, 
  CheckCircle, 
  CreditCard, 
  MessageSquare, 
  Star, 
  Clock, 
  ShieldCheck, 
  ArrowRight,
  CheckCircle2,
  Award,
  BarChart,
  Briefcase,
  Zap,
  GraduationCap,
  GitBranch,
  MessagesSquare,
  Handshake,
  Wallet,
  LockKeyhole,
  AlertCircle,
  Badge,
  BadgeCheck,
  UserCircle
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import StatisticsCounter from "@/components/statistics-counter";

export const metadata: Metadata = {
  title: "Comment ça marche | Vynal Platform",
  description: "Découvrez en détail le fonctionnement de Vynal Platform, la marketplace innovante qui connecte les freelances et clients en Afrique avec un système sécurisé et transparent",
};

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-vynal-purple-dark">
      {/* En-tête décoratif avec animation subtile */}
      <div className="absolute top-0 left-0 right-0 h-80 bg-gradient-to-b from-vynal-purple-dark to-vynal-purple-darkest -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/img/grid-pattern.svg')] bg-center opacity-10"></div>
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-vynal-accent-secondary/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-vynal-accent-primary/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: "1s"}}></div>
      </div>

      <div className="container mx-auto px-4 py-12 relative">
        {/* Section Hero */}
        <div className="mb-16 text-center max-w-4xl mx-auto">
          <div className="inline-block px-4 py-2 rounded-full bg-vynal-accent-primary/10 text-vynal-accent-primary font-medium text-sm mb-4 animate-fade-in">
            La plateforme qui révolutionne le freelancing en Afrique
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-vynal-text-primary mb-8 leading-tight">
            Comment fonctionne <span className="text-vynal-accent-primary">Vynal Platform</span>
          </h1>
          <div className="bg-vynal-purple-secondary/20 backdrop-blur-sm p-6 rounded-xl border border-vynal-purple-secondary/30 mb-8">
            <p className="text-lg text-vynal-text-secondary leading-relaxed">
              Vynal Platform est une marketplace innovante qui met en relation les talents freelances avec des clients à la recherche de services de qualité. Notre écosystème sécurisé, transparent et adapté au contexte africain permet de transformer la façon dont les projets sont réalisés en Afrique.
            </p>
          </div>
          
          {/* Statistiques clés */}
          <div className="mt-10">
            <StatisticsCounter />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              <div className="group relative overflow-hidden bg-gradient-to-br from-vynal-purple-dark/80 to-vynal-purple-dark/60 backdrop-blur-sm rounded-2xl p-6 border border-vynal-purple-secondary/20 shadow-lg transition-all duration-500 hover:shadow-xl hover:shadow-vynal-accent-primary/10 hover:border-vynal-purple-secondary/40">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-vynal-accent-primary/0 via-vynal-accent-primary to-vynal-accent-primary/0 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-700"></div>
                <div className="flex flex-col items-center text-center">
                  <div className="mb-3 w-12 h-12 rounded-full bg-vynal-accent-primary/10 flex items-center justify-center">
                    <Users className="h-6 w-6 text-vynal-accent-primary" />
                  </div>
                  <div className="text-3xl font-bold text-vynal-accent-primary flex items-baseline">
                    <span className="counter-value" data-target="500">0</span>
                    <span className="text-2xl">+</span>
                  </div>
                  <div className="text-vynal-text-secondary mt-1 text-sm md:text-base font-medium">Freelances vérifiés</div>
                </div>
              </div>
              
              <div className="group relative overflow-hidden bg-gradient-to-br from-vynal-purple-dark/80 to-vynal-purple-dark/60 backdrop-blur-sm rounded-2xl p-6 border border-vynal-purple-secondary/20 shadow-lg transition-all duration-500 hover:shadow-xl hover:shadow-vynal-accent-primary/10 hover:border-vynal-purple-secondary/40">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-vynal-accent-primary/0 via-vynal-accent-primary to-vynal-accent-primary/0 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-700"></div>
                <div className="flex flex-col items-center text-center">
                  <div className="mb-3 w-12 h-12 rounded-full bg-vynal-accent-primary/10 flex items-center justify-center">
                    <CheckCircle2 className="h-6 w-6 text-vynal-accent-primary" />
                  </div>
                  <div className="text-3xl font-bold text-vynal-accent-primary flex items-baseline">
                    <span className="counter-value" data-target="1200">0</span>
                    <span className="text-2xl">+</span>
                  </div>
                  <div className="text-vynal-text-secondary mt-1 text-sm md:text-base font-medium">Projets réalisés</div>
                </div>
              </div>
              
              <div className="group relative overflow-hidden bg-gradient-to-br from-vynal-purple-dark/80 to-vynal-purple-dark/60 backdrop-blur-sm rounded-2xl p-6 border border-vynal-purple-secondary/20 shadow-lg transition-all duration-500 hover:shadow-xl hover:shadow-vynal-accent-primary/10 hover:border-vynal-purple-secondary/40">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-vynal-accent-primary/0 via-vynal-accent-primary to-vynal-accent-primary/0 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-700"></div>
                <div className="flex flex-col items-center text-center">
                  <div className="mb-3 w-12 h-12 rounded-full bg-vynal-accent-primary/10 flex items-center justify-center">
                    <Star className="h-6 w-6 text-vynal-accent-primary" />
                  </div>
                  <div className="text-3xl font-bold text-vynal-accent-primary flex items-baseline">
                    <span className="counter-value" data-target="98">0</span>
                    <span className="text-2xl">%</span>
                  </div>
                  <div className="text-vynal-text-secondary mt-1 text-sm md:text-base font-medium">Taux de satisfaction</div>
                </div>
              </div>
              
              <div className="group relative overflow-hidden bg-gradient-to-br from-vynal-purple-dark/80 to-vynal-purple-dark/60 backdrop-blur-sm rounded-2xl p-6 border border-vynal-purple-secondary/20 shadow-lg transition-all duration-500 hover:shadow-xl hover:shadow-vynal-accent-primary/10 hover:border-vynal-purple-secondary/40">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-vynal-accent-primary/0 via-vynal-accent-primary to-vynal-accent-primary/0 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-700"></div>
                <div className="flex flex-col items-center text-center">
                  <div className="mb-3 w-12 h-12 rounded-full bg-vynal-accent-primary/10 flex items-center justify-center">
                    <Clock className="h-6 w-6 text-vynal-accent-primary" />
                  </div>
                  <div className="text-3xl font-bold text-vynal-accent-primary flex items-baseline">
                    <span className="counter-value" data-target="24">0</span>
                    <span className="text-2xl">/7</span>
                  </div>
                  <div className="text-vynal-text-secondary mt-1 text-sm md:text-base font-medium">Support disponible</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Vidéo explicative */}
        <div className="mb-24 max-w-5xl mx-auto">
          <div className="relative overflow-hidden rounded-2xl shadow-2xl shadow-vynal-accent-primary/10 aspect-video">
            <div className="absolute inset-0 bg-gradient-to-br from-vynal-accent-primary/10 to-vynal-accent-secondary/10 rounded-2xl"></div>
            <Image 
              src="/assets/images/explainer-thumbnail.jpg" 
              alt="Vidéo explicative Vynal Platform" 
              fill
              className="object-cover transition-transform hover:scale-105 duration-700"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-20 h-20 rounded-full bg-vynal-accent-primary flex items-center justify-center shadow-lg cursor-pointer transition-transform hover:scale-110 duration-300">
                <div className="w-0 h-0 border-t-[10px] border-t-transparent border-b-[10px] border-b-transparent border-l-[18px] border-l-vynal-purple-dark ml-2"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Processus */}
        <div className="mb-24">
          <div className="text-center mb-16">
            <div className="inline-block px-4 py-2 rounded-full bg-vynal-accent-secondary/10 text-vynal-accent-secondary font-medium text-sm mb-4">
              Parcours utilisateur
            </div>
            <h2 className="text-3xl font-bold text-vynal-text-primary mb-4">
              Comment fonctionne Vynal Platform ?
            </h2>
            <p className="text-lg text-vynal-text-secondary max-w-3xl mx-auto">
              Une plateforme intuitive conçue pour simplifier la collaboration entre clients et freelances
            </p>
          </div>

          {/* Parcours client */}
          <div className="max-w-5xl mx-auto mb-24">
            <div className="flex flex-col md:flex-row items-center gap-4 mb-10 p-4 bg-gradient-to-r from-vynal-accent-primary/10 to-transparent rounded-xl border-l-4 border-vynal-accent-primary">
              <div className="w-16 h-16 rounded-full bg-vynal-accent-primary/20 flex items-center justify-center">
                <Users className="h-8 w-8 text-vynal-accent-primary" />
              </div>
              <h3 className="text-2xl md:text-3xl font-bold text-vynal-text-primary">
                <span className="text-vynal-accent-primary">Vous êtes</span> client
              </h3>
            </div>
            
            <div className="relative">
              <div className="absolute left-24 top-28 bottom-28 w-1 bg-gradient-to-b from-vynal-accent-primary to-vynal-accent-secondary hidden md:block"></div>
              
              <div className="grid grid-cols-1 md:grid-cols-[60px_1fr] gap-4 mb-16">
                <div className="flex justify-center">
                  <div className="w-12 h-12 rounded-full bg-vynal-accent-primary flex items-center justify-center text-vynal-purple-dark font-bold text-lg z-10">1</div>
                </div>
                <Card className="border-vynal-border/30 shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardContent className="p-8">
                    <div className="flex flex-col md:flex-row gap-6 items-start">
                      <div className="w-16 h-16 flex-shrink-0 flex items-center justify-center bg-vynal-accent-primary/10 rounded-full">
                        <Search className="h-8 w-8 text-vynal-accent-primary" />
                      </div>
                      <div>
                        <CardTitle className="mb-4 text-xl">Publiez un projet ou recherchez un freelance</CardTitle>
                        <CardDescription className="text-base text-vynal-text-secondary">
                          Décrivez votre besoin en détail et recevez des propositions personnalisées des meilleurs freelances. Vous pouvez également parcourir notre catalogue de talents et filtrer selon vos critères spécifiques pour trouver le profil idéal.
                        </CardDescription>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-[60px_1fr] gap-4 mb-16">
                <div className="flex justify-center">
                  <div className="w-12 h-12 rounded-full bg-vynal-accent-primary flex items-center justify-center text-vynal-purple-dark font-bold text-lg z-10">2</div>
                </div>
                <Card className="border-vynal-border/30 shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardContent className="p-8">
                    <div className="flex flex-col md:flex-row gap-6 items-start">
                      <div className="w-16 h-16 flex-shrink-0 flex items-center justify-center bg-vynal-accent-primary/10 rounded-full">
                        <MessagesSquare className="h-8 w-8 text-vynal-accent-primary" />
                      </div>
                      <div>
                        <CardTitle className="mb-4 text-xl">Échangez et finalisez les détails</CardTitle>
                        <CardDescription className="text-base text-vynal-text-secondary">
                          Utilisez notre messagerie sécurisée pour discuter des spécificités de votre projet, clarifier vos attentes, établir un calendrier précis et convenir des conditions de collaboration. Cette étape est cruciale pour assurer une compréhension mutuelle des objectifs.
                        </CardDescription>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-[60px_1fr] gap-4">
                <div className="flex justify-center">
                  <div className="w-12 h-12 rounded-full bg-vynal-accent-primary flex items-center justify-center text-vynal-purple-dark font-bold text-lg z-10">3</div>
                </div>
                <Card className="border-vynal-border/30 shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardContent className="p-8">
                    <div className="flex flex-col md:flex-row gap-6 items-start">
                      <div className="w-16 h-16 flex-shrink-0 flex items-center justify-center bg-vynal-accent-primary/10 rounded-full">
                        <BadgeCheck className="h-8 w-8 text-vynal-accent-primary" />
                      </div>
                      <div>
                        <CardTitle className="mb-4 text-xl">Suivez l'avancement et validez</CardTitle>
                        <CardDescription className="text-base text-vynal-text-secondary">
                          Supervisez le projet via notre tableau de bord intuitif et validez les livrables. Vous gardez un contrôle total sur votre projet et le paiement n'est débloqué que lorsque vous êtes pleinement satisfait du résultat, vous offrant une tranquillité d'esprit totale.
                        </CardDescription>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          {/* Parcours freelance */}
          <div className="max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row items-center gap-4 mb-10 p-4 bg-gradient-to-r from-vynal-accent-secondary/10 to-transparent rounded-xl border-l-4 border-vynal-accent-secondary">
              <div className="w-16 h-16 rounded-full bg-vynal-accent-secondary/20 flex items-center justify-center">
                <Briefcase className="h-8 w-8 text-vynal-accent-secondary" />
              </div>
              <h3 className="text-2xl md:text-3xl font-bold text-vynal-text-primary">
                <span className="text-vynal-accent-secondary">Vous êtes</span> freelance
              </h3>
            </div>
            
            <div className="relative">
              <div className="absolute left-24 top-28 bottom-28 w-1 bg-gradient-to-b from-vynal-accent-secondary to-vynal-accent-primary hidden md:block"></div>
              
              <div className="grid grid-cols-1 md:grid-cols-[60px_1fr] gap-4 mb-16">
                <div className="flex justify-center">
                  <div className="w-12 h-12 rounded-full bg-vynal-accent-secondary flex items-center justify-center text-vynal-purple-dark font-bold text-lg z-10">1</div>
                </div>
                <Card className="border-vynal-border/30 shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardContent className="p-8">
                    <div className="flex flex-col md:flex-row gap-6 items-start">
                      <div className="w-16 h-16 flex-shrink-0 flex items-center justify-center bg-vynal-accent-secondary/10 rounded-full">
                        <UserCircle className="h-8 w-8 text-vynal-accent-secondary" />
                      </div>
                      <div>
                        <CardTitle className="mb-4 text-xl">Créez un profil complet et attractif</CardTitle>
                        <CardDescription className="text-base text-vynal-text-secondary">
                          Mettez en avant vos compétences, votre expérience et vos réalisations avec un portfolio soigné. Ajoutez des exemples de projets antérieurs et obtenez des certifications Vynal pour augmenter significativement vos chances d'être sélectionné par les clients.
                        </CardDescription>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-[60px_1fr] gap-4 mb-16">
                <div className="flex justify-center">
                  <div className="w-12 h-12 rounded-full bg-vynal-accent-secondary flex items-center justify-center text-vynal-purple-dark font-bold text-lg z-10">2</div>
                </div>
                <Card className="border-vynal-border/30 shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardContent className="p-8">
                    <div className="flex flex-col md:flex-row gap-6 items-start">
                      <div className="w-16 h-16 flex-shrink-0 flex items-center justify-center bg-vynal-accent-secondary/10 rounded-full">
                        <Handshake className="h-8 w-8 text-vynal-accent-secondary" />
                      </div>
                      <div>
                        <CardTitle className="mb-4 text-xl">Répondez aux offres ou proposez vos services</CardTitle>
                        <CardDescription className="text-base text-vynal-text-secondary">
                          Parcourez les projets disponibles et soumettez des propositions personnalisées qui vous démarquent. Vous pouvez également contacter directement des clients potentiels avec des offres de services sur mesure qui répondent précisément à leurs besoins spécifiques.
                        </CardDescription>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-[60px_1fr] gap-4">
                <div className="flex justify-center">
                  <div className="w-12 h-12 rounded-full bg-vynal-accent-secondary flex items-center justify-center text-vynal-purple-dark font-bold text-lg z-10">3</div>
                </div>
                <Card className="border-vynal-border/30 shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardContent className="p-8">
                    <div className="flex flex-col md:flex-row gap-6 items-start">
                      <div className="w-16 h-16 flex-shrink-0 flex items-center justify-center bg-vynal-accent-secondary/10 rounded-full">
                        <Wallet className="h-8 w-8 text-vynal-accent-secondary" />
                      </div>
                      <div>
                        <CardTitle className="mb-4 text-xl">Livrez et recevez votre paiement</CardTitle>
                        <CardDescription className="text-base text-vynal-text-secondary">
                          Après validation par le client, recevez votre paiement en toute sécurité via notre système d'escrow. Construisez votre réputation grâce aux évaluations positives et augmentez progressivement vos tarifs en fonction de votre expertise reconnue sur la plateforme.
                        </CardDescription>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
          
          {/* Système de paiement sécurisé */}
          <div className="mt-16 max-w-4xl mx-auto">
            <Card className="border-vynal-border/30 bg-gradient-to-br from-vynal-purple-dark to-vynal-background shadow-lg backdrop-blur-sm overflow-hidden">
              <CardContent className="p-8">
                <div className="flex flex-col md:flex-row gap-8 items-center">
                  <div className="w-20 h-20 flex-shrink-0 flex items-center justify-center bg-vynal-background/30 rounded-full border border-vynal-border/30">
                    <LockKeyhole className="h-10 w-10 text-vynal-accent-primary" />
                  </div>
                  <div className="flex-grow">
                    <h3 className="text-xl font-semibold text-vynal-text-primary mb-3">Système de paiement sécurisé</h3>
                    <p className="text-vynal-text-secondary mb-4">
                      Notre système de paiement sécurisé protège à la fois les clients et les freelances. Les fonds sont conservés en garantie jusqu'à la validation des livrables, assurant ainsi une transaction en toute confiance.
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <Badge className="bg-vynal-accent-primary/10 text-vynal-accent-primary hover:bg-vynal-accent-primary/20">
                        <ShieldCheck className="h-3.5 w-3.5 mr-1" />
                        Paiement sécurisé
                      </Badge>
                      <Badge className="bg-vynal-accent-primary/10 text-vynal-accent-primary hover:bg-vynal-accent-primary/20">
                        <Clock className="h-3.5 w-3.5 mr-1" />
                        Garantie de satisfaction
                      </Badge>
                      <Badge className="bg-vynal-accent-primary/10 text-vynal-accent-primary hover:bg-vynal-accent-primary/20">
                        <AlertCircle className="h-3.5 w-3.5 mr-1" />
                        Résolution des litiges
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Avantages */}
        <div className="mb-24">
          <div className="text-center mb-16">
            <div className="inline-block px-4 py-2 rounded-full bg-vynal-accent-primary/10 text-vynal-accent-primary font-medium text-sm mb-4">
              Pourquoi choisir Vynal
            </div>
            <h2 className="text-3xl font-bold text-vynal-text-primary mb-4">
              Les avantages exclusifs de notre plateforme
            </h2>
            <p className="text-lg text-vynal-text-secondary max-w-3xl mx-auto">
              Vynal Platform offre un écosystème complet pensé pour optimiser la collaboration entre freelances et clients.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Avantage 1 */}
            <div className="group">
              <Card className="bg-vynal-purple-dark/90 border-vynal-purple-secondary/30 rounded-xl shadow-lg shadow-vynal-accent-secondary/20 backdrop-blur-sm h-full transition-all duration-300 group-hover:translate-y-[-8px] group-hover:shadow-xl group-hover:shadow-vynal-accent-primary/20 overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-vynal-accent-primary to-vynal-accent-secondary"></div>
                <CardContent className="p-8">
                  <div className="w-16 h-16 mb-6 flex items-center justify-center bg-vynal-purple-secondary/20 rounded-full border border-vynal-purple-secondary/30 transition-all duration-300 group-hover:bg-vynal-accent-primary/10 group-hover:border-vynal-accent-primary/30">
                    <ShieldCheck className="h-8 w-8 text-vynal-accent-primary" />
                  </div>
                  <h3 className="text-xl font-semibold text-vynal-text-primary mb-4">Sécurité et confiance</h3>
                  <p className="text-vynal-text-secondary mb-6">
                    Nous offrons un environnement sécurisé où la confiance est notre priorité absolue. Chaque transaction et interaction est protégée.
                  </p>
                  <ul className="space-y-2 text-vynal-text-secondary">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-vynal-accent-primary flex-shrink-0" />
                      <span>Vérification d'identité des freelances</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-vynal-accent-primary flex-shrink-0" />
                      <span>Système d'évaluation transparent</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-vynal-accent-primary flex-shrink-0" />
                      <span>Protection anti-fraude avancée</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
  
            {/* Avantage 2 */}
            <div className="group">
              <Card className="bg-vynal-purple-dark/90 border-vynal-purple-secondary/30 rounded-xl shadow-lg shadow-vynal-accent-secondary/20 backdrop-blur-sm h-full transition-all duration-300 group-hover:translate-y-[-8px] group-hover:shadow-xl group-hover:shadow-vynal-accent-primary/20 overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-vynal-accent-primary to-vynal-accent-secondary"></div>
                <CardContent className="p-8">
                  <div className="w-16 h-16 mb-6 flex items-center justify-center bg-vynal-purple-secondary/20 rounded-full border border-vynal-purple-secondary/30 transition-all duration-300 group-hover:bg-vynal-accent-primary/10 group-hover:border-vynal-accent-primary/30">
                    <Zap className="h-8 w-8 text-vynal-accent-primary" />
                  </div>
                  <h3 className="text-xl font-semibold text-vynal-text-primary mb-4">Efficacité optimale</h3>
                  <p className="text-vynal-text-secondary mb-6">
                    Notre plateforme rationalise tout le processus de collaboration, vous permettant de vous concentrer sur ce qui compte vraiment.
                  </p>
                  <ul className="space-y-2 text-vynal-text-secondary">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-vynal-accent-primary flex-shrink-0" />
                      <span>Recherche intelligente de talents</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-vynal-accent-primary flex-shrink-0" />
                      <span>Gestion de projet intégrée</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-vynal-accent-primary flex-shrink-0" />
                      <span>Facturation et comptabilité automatisées</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
  
            {/* Avantage 3 */}
            <div className="group">
              <Card className="bg-vynal-purple-dark/90 border-vynal-purple-secondary/30 rounded-xl shadow-lg shadow-vynal-accent-secondary/20 backdrop-blur-sm h-full transition-all duration-300 group-hover:translate-y-[-8px] group-hover:shadow-xl group-hover:shadow-vynal-accent-primary/20 overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-vynal-accent-primary to-vynal-accent-secondary"></div>
                <CardContent className="p-8">
                  <div className="w-16 h-16 mb-6 flex items-center justify-center bg-vynal-purple-secondary/20 rounded-full border border-vynal-purple-secondary/30 transition-all duration-300 group-hover:bg-vynal-accent-primary/10 group-hover:border-vynal-accent-primary/30">
                    <MessageSquare className="h-8 w-8 text-vynal-accent-primary" />
                  </div>
                  <h3 className="text-xl font-semibold text-vynal-text-primary mb-4">Communication sans friction</h3>
                  <p className="text-vynal-text-secondary mb-6">
                    Des outils de communication puissants qui facilitent la compréhension et la réussite de vos projets.
                  </p>
                  <ul className="space-y-2 text-vynal-text-secondary">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-vynal-accent-primary flex-shrink-0" />
                      <span>Messagerie temps réel intégrée</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-vynal-accent-primary flex-shrink-0" />
                      <span>Partage de fichiers sécurisé</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-vynal-accent-primary flex-shrink-0" />
                      <span>Historique complet des échanges</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* Avantage 4 - Impact local */}
            <div className="group md:col-span-3">
              <Card className="bg-vynal-purple-dark/90 border-vynal-purple-secondary/30 rounded-xl shadow-lg shadow-vynal-accent-secondary/20 backdrop-blur-sm transition-all duration-300 group-hover:shadow-xl group-hover:shadow-vynal-accent-primary/20 overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-vynal-accent-primary to-vynal-accent-secondary"></div>
                <CardContent className="p-8">
                  <div className="flex flex-col md:flex-row gap-8 items-center">
                    <div className="w-16 h-16 flex-shrink-0 flex items-center justify-center bg-vynal-purple-secondary/20 rounded-full border border-vynal-purple-secondary/30 transition-all duration-300 group-hover:bg-vynal-accent-primary/10 group-hover:border-vynal-accent-primary/30">
                      <Award className="h-8 w-8 text-vynal-accent-primary" />
                    </div>
                    <div className="flex-grow">
                      <h3 className="text-xl font-semibold text-vynal-text-primary mb-2">Impact sur l'économie africaine</h3>
                      <p className="text-vynal-text-secondary">
                        Vynal Platform s'engage à promouvoir les talents africains, tout en créant un écosystème où les compétences locales peuvent rayonner à l'échelle internationale. Nous contribuons activement au développement de l'économie numérique africaine en facilitant l'accès à des opportunités professionnelles pour les freelances et des services de qualité pour les entreprises locales.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Questions fréquentes */}
        <div className="mb-24">
          <div className="text-center mb-16">
            <div className="inline-block px-4 py-2 rounded-full bg-vynal-accent-primary/10 text-vynal-accent-primary font-medium text-sm mb-4">
              Vos interrogations
            </div>
            <h2 className="text-3xl font-bold text-vynal-text-primary mb-4">
              Questions fréquemment posées
            </h2>
            <p className="text-lg text-vynal-text-secondary max-w-3xl mx-auto">
              Retrouvez les réponses aux questions les plus courantes sur le fonctionnement de Vynal Platform.
            </p>
          </div>
          
          <div className="max-w-4xl mx-auto space-y-6">
            <Card className="bg-vynal-purple-dark/90 border-vynal-purple-secondary/30 rounded-xl shadow-lg shadow-vynal-accent-secondary/20 backdrop-blur-sm overflow-hidden group transition-all duration-300 hover:shadow-xl hover:shadow-vynal-accent-primary/20">
              <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-vynal-accent-primary to-vynal-accent-secondary"></div>
              <CardContent className="p-6 pl-8">
                <h3 className="text-xl font-semibold text-vynal-text-primary mb-3 group-hover:text-vynal-accent-primary transition-colors duration-300">Comment sont gérés les paiements sur la plateforme ?</h3>
                <p className="text-vynal-text-secondary">
                  Vynal utilise un système de paiement sécurisé où les fonds sont conservés en séquestre jusqu'à la validation du travail. Le client effectue le paiement au moment de la commande, mais celui-ci reste bloqué dans un compte sécurisé. C'est seulement après validation complète du travail livré que les fonds sont libérés vers le compte du freelance. Les freelances peuvent ensuite retirer leurs gains vers leur compte bancaire ou via des services comme Orange Money ou Wave, avec des frais de transaction minimes.
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-vynal-purple-dark/90 border-vynal-purple-secondary/30 rounded-xl shadow-lg shadow-vynal-accent-secondary/20 backdrop-blur-sm overflow-hidden group transition-all duration-300 hover:shadow-xl hover:shadow-vynal-accent-primary/20">
              <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-vynal-accent-primary to-vynal-accent-secondary"></div>
              <CardContent className="p-6 pl-8">
                <h3 className="text-xl font-semibold text-vynal-text-primary mb-3 group-hover:text-vynal-accent-primary transition-colors duration-300">Que faire en cas de litige avec un freelance ou un client ?</h3>
                <p className="text-vynal-text-secondary">
                  En cas de désaccord, notre processus de résolution se déroule en plusieurs étapes. D'abord, nous encourageons la communication directe entre les parties pour tenter de résoudre le problème. Si cela ne suffit pas, notre équipe de médiation intervient pour analyser la situation et proposer une solution équitable. Dans les cas plus complexes, notre comité d'arbitrage prend une décision finale après examen approfondi des éléments fournis par les deux parties. Notre objectif est de résoudre 90% des litiges en moins de 72 heures.
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-vynal-purple-dark/90 border-vynal-purple-secondary/30 rounded-xl shadow-lg shadow-vynal-accent-secondary/20 backdrop-blur-sm overflow-hidden group transition-all duration-300 hover:shadow-xl hover:shadow-vynal-accent-primary/20">
              <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-vynal-accent-primary to-vynal-accent-secondary"></div>
              <CardContent className="p-6 pl-8">
                <h3 className="text-xl font-semibold text-vynal-text-primary mb-3 group-hover:text-vynal-accent-primary transition-colors duration-300">Quelles sont les commissions prélevées par Vynal Platform ?</h3>
                <p className="text-vynal-text-secondary">
                  Vynal prélève une commission de 10% sur le montant total des transactions, ce qui est parmi les plus compétitives du marché. Pour les freelances qui atteignent certains paliers de chiffre d'affaires mensuel, ce taux peut descendre jusqu'à 7%. Cette commission nous permet de maintenir l'infrastructure technique, garantir la sécurité des paiements, financer notre système de médiation et assurer un support client réactif. L'inscription et la création de profil restent totalement gratuites pour tous les utilisateurs.
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-vynal-purple-dark/90 border-vynal-purple-secondary/30 rounded-xl shadow-lg shadow-vynal-accent-secondary/20 backdrop-blur-sm overflow-hidden group transition-all duration-300 hover:shadow-xl hover:shadow-vynal-accent-primary/20">
              <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-vynal-accent-primary to-vynal-accent-secondary"></div>
              <CardContent className="p-6 pl-8">
                <h3 className="text-xl font-semibold text-vynal-text-primary mb-3 group-hover:text-vynal-accent-primary transition-colors duration-300">Comment s'assurer de la qualité d'un freelance avant de passer commande ?</h3>
                <p className="text-vynal-text-secondary">
                  Pour évaluer la fiabilité d'un freelance, plusieurs éléments sont à votre disposition : consultez d'abord son profil complet avec ses compétences vérifiées et son portfolio de réalisations. Examinez ensuite ses évaluations et avis détaillés laissés par d'autres clients, avec un système de notation sur plusieurs critères (qualité, communication, respect des délais). Vous pouvez également consulter son taux de satisfaction et son badge de vérification. N'hésitez pas à lui poser des questions précises sur son expérience via notre messagerie et à demander un petit échantillon de travail ou un appel de découverte avant de vous engager.
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-vynal-purple-dark/90 border-vynal-purple-secondary/30 rounded-xl shadow-lg shadow-vynal-accent-secondary/20 backdrop-blur-sm overflow-hidden group transition-all duration-300 hover:shadow-xl hover:shadow-vynal-accent-primary/20">
              <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-vynal-accent-primary to-vynal-accent-secondary"></div>
              <CardContent className="p-6 pl-8">
                <h3 className="text-xl font-semibold text-vynal-text-primary mb-3 group-hover:text-vynal-accent-primary transition-colors duration-300">Quels types de services peut-on trouver sur Vynal Platform ?</h3>
                <p className="text-vynal-text-secondary">
                  Vynal Platform couvre une large gamme de services numériques et créatifs, regroupés en catégories principales : développement web et mobile, design graphique, rédaction et traduction, marketing digital, montage vidéo et audio, conseil et stratégie, assistance administrative, formation et coaching. Chaque catégorie est subdivisée en sous-catégories spécifiques pour vous permettre de trouver exactement le service dont vous avez besoin, avec des freelances spécialisés dans chaque domaine.
                </p>
              </CardContent>
            </Card>
            
            <div className="text-center mt-12">
              <div className="inline-block p-0.5 rounded-full bg-gradient-to-r from-vynal-accent-primary to-vynal-accent-secondary shadow-lg shadow-vynal-accent-primary/20">
                <Link href="/faq">
                  <Button className="bg-vynal-purple-dark hover:bg-vynal-purple-secondary/40 text-vynal-text-primary px-8 py-3 rounded-full">
                    Voir toutes les questions <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="py-20 relative">
          <div className="absolute inset-0 bg-gradient-to-br from-vynal-accent-primary/5 to-vynal-accent-secondary/5 rounded-3xl blur-3xl opacity-40"></div>
          
          <div className="relative text-center max-w-5xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-vynal-text-primary mb-6 leading-tight">
              Prêt à rejoindre l'écosystème <span className="text-vynal-accent-primary">Vynal Platform</span> ?
            </h2>
            <p className="text-lg text-vynal-text-secondary max-w-3xl mx-auto mb-10">
              Que vous soyez freelance ou client, lancez-vous dès aujourd'hui et découvrez une nouvelle façon de collaborer sur des projets qui comptent.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16">
              <div className="group">
                <div className="absolute inset-0 bg-gradient-to-r from-vynal-accent-primary to-vynal-accent-secondary rounded-full blur-lg opacity-0 group-hover:opacity-70 transition-opacity duration-300"></div>
                <Button className="bg-vynal-accent-primary hover:bg-vynal-accent-secondary text-vynal-purple-dark px-8 py-6 text-lg rounded-full shadow-lg shadow-vynal-accent-primary/20 font-medium relative">
                  <Users className="mr-2 h-5 w-5" />
                  S'inscrire gratuitement
                </Button>
              </div>
              
              <Button className="bg-transparent hover:bg-vynal-purple-secondary/20 text-vynal-text-primary border border-vynal-purple-secondary/50 px-8 py-6 text-lg rounded-full">
                <Search className="mr-2 h-5 w-5" />
                Explorer les services
              </Button>
            </div>
            
            {/* Témoignages */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-vynal-purple-dark/40 border-vynal-purple-secondary/20 rounded-xl shadow-lg backdrop-blur-sm overflow-hidden group hover:border-vynal-accent-primary/30 transition-all duration-300">
                <CardContent className="p-6 relative">
                  <div className="absolute top-2 right-2 text-vynal-accent-primary opacity-30 group-hover:opacity-100 transition-opacity duration-300">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M10 7H6C4.89543 7 4 7.89543 4 9V18C4 19.1046 4.89543 20 6 20H15C16.1046 20 17 19.1046 17 18V14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M16 4L20 8M20 4L16 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M15 10V4H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div className="mb-4">
                    <div>
                      <p className="font-medium text-vynal-text-primary">Aminata D.</p>
                      <p className="text-sm text-vynal-text-secondary">Graphiste freelance</p>
                    </div>
                  </div>
                  <p className="text-vynal-text-secondary italic">
                    "Vynal m'a permis de développer mon activité de design et d'accéder à des clients internationaux tout en restant en Afrique. La sécurité des paiements est un vrai plus !"
                  </p>
                  <div className="flex mt-3 justify-center">
                    <Star className="h-4 w-4 text-vynal-accent-primary mx-0.5" fill="currentColor" />
                    <Star className="h-4 w-4 text-vynal-accent-primary mx-0.5" fill="currentColor" />
                    <Star className="h-4 w-4 text-vynal-accent-primary mx-0.5" fill="currentColor" />
                    <Star className="h-4 w-4 text-vynal-accent-primary mx-0.5" fill="currentColor" />
                    <Star className="h-4 w-4 text-vynal-accent-primary mx-0.5" fill="currentColor" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-vynal-purple-dark/40 border-vynal-purple-secondary/20 rounded-xl shadow-lg backdrop-blur-sm overflow-hidden group hover:border-vynal-accent-primary/30 transition-all duration-300">
                <CardContent className="p-6 relative">
                  <div className="absolute top-2 right-2 text-vynal-accent-primary opacity-30 group-hover:opacity-100 transition-opacity duration-300">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M10 7H6C4.89543 7 4 7.89543 4 9V18C4 19.1046 4.89543 20 6 20H15C16.1046 20 17 19.1046 17 18V14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M16 4L20 8M20 4L16 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M15 10V4H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div className="mb-4">
                    <div>
                      <p className="font-medium text-vynal-text-primary">Moussa T.</p>
                      <p className="text-sm text-vynal-text-secondary">Développeur web</p>
                    </div>
                  </div>
                  <p className="text-vynal-text-secondary italic">
                    "J'ai commencé comme développeur junior et aujourd'hui je gère une équipe de freelances sur Vynal. La plateforme a vraiment transformé ma carrière professionnelle."
                  </p>
                  <div className="flex mt-3 justify-center">
                    <Star className="h-4 w-4 text-vynal-accent-primary mx-0.5" fill="currentColor" />
                    <Star className="h-4 w-4 text-vynal-accent-primary mx-0.5" fill="currentColor" />
                    <Star className="h-4 w-4 text-vynal-accent-primary mx-0.5" fill="currentColor" />
                    <Star className="h-4 w-4 text-vynal-accent-primary mx-0.5" fill="currentColor" />
                    <Star className="h-4 w-4 text-vynal-accent-primary mx-0.5" fill="currentColor" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-vynal-purple-dark/40 border-vynal-purple-secondary/20 rounded-xl shadow-lg backdrop-blur-sm overflow-hidden group hover:border-vynal-accent-primary/30 transition-all duration-300">
                <CardContent className="p-6 relative">
                  <div className="absolute top-2 right-2 text-vynal-accent-primary opacity-30 group-hover:opacity-100 transition-opacity duration-300">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M10 7H6C4.89543 7 4 7.89543 4 9V18C4 19.1046 4.89543 20 6 20H15C16.1046 20 17 19.1046 17 18V14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M16 4L20 8M20 4L16 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M15 10V4H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div className="mb-4">
                    <div>
                      <p className="font-medium text-vynal-text-primary">Fatou S.</p>
                      <p className="text-sm text-vynal-text-secondary">Entrepreneuse</p>
                    </div>
                  </div>
                  <p className="text-vynal-text-secondary italic">
                    "En tant que startup, Vynal nous a permis de trouver rapidement des talents locaux qualifiés pour tous nos projets digitaux, avec un excellent rapport qualité-prix."
                  </p>
                  <div className="flex mt-3 justify-center">
                    <Star className="h-4 w-4 text-vynal-accent-primary mx-0.5" fill="currentColor" />
                    <Star className="h-4 w-4 text-vynal-accent-primary mx-0.5" fill="currentColor" />
                    <Star className="h-4 w-4 text-vynal-accent-primary mx-0.5" fill="currentColor" />
                    <Star className="h-4 w-4 text-vynal-accent-primary mx-0.5" fill="currentColor" />
                    <Star className="h-4 w-4 text-vynal-accent-primary mx-0.5" fill="currentColor" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 