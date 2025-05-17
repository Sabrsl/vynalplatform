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
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";

export const metadata: Metadata = {
  title: "Comment ça marche | Vynal Platform",
  description: "Découvrez en détail le fonctionnement de Vynal Platform, la marketplace innovante qui connecte les freelances et clients en Afrique avec un système sécurisé et transparent",
};

// Ajouter une configuration de mise en cache pour cette page statique
export const dynamic = 'force-static';
export const revalidate = 2592000; // 30 jours en secondes

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-white/30 dark:bg-vynal-purple-dark">
      {/* En-tête décoratif avec animation subtile */}
      <div className="absolute top-0 left-0 right-0 h-48 md:h-80 bg-gradient-to-b from-white/30 to-white/25 dark:from-vynal-purple-dark dark:to-vynal-purple-dark/90 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/img/grid-pattern.svg')] bg-center opacity-10"></div>
        <div className="absolute -top-16 -right-16 md:-top-24 md:-right-24 w-48 md:w-96 h-48 md:h-96 bg-vynal-accent-secondary/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-16 -left-16 md:-bottom-24 md:-left-24 w-48 md:w-96 h-48 md:h-96 bg-vynal-accent-primary/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: "1s"}}></div>
      </div>

      <div className="container mx-auto px-3 md:px-6 py-16 md:py-32 relative">
        {/* Section Hero */}
        <div className="mb-24 md:mb-40 text-center max-w-4xl mx-auto">
          <div className="inline-block px-2 md:px-4 py-1 md:py-2 rounded-full bg-vynal-accent-primary/10 text-vynal-accent-primary font-medium text-[10px] md:text-sm mb-2 md:mb-4 animate-fade-in">
            La plateforme qui révolutionne le freelancing en Afrique
          </div>
          <h1 className="text-xl md:text-4xl lg:text-5xl font-bold text-slate-800 dark:text-vynal-text-primary mb-4 md:mb-8 leading-tight">
            Comment fonctionne <span className="text-vynal-accent-primary">Vynal Platform</span>
          </h1>
          <div className="bg-white/25 dark:bg-slate-900/20 backdrop-blur-sm p-3 md:p-6 rounded-lg md:rounded-xl border border-slate-200/30 dark:border-slate-700/30 mb-4 md:mb-8">
            <p className="text-xs md:text-base lg:text-lg text-slate-600 dark:text-vynal-text-secondary leading-relaxed">
              Vynal Platform est une marketplace innovante qui met en relation les talents freelances avec des clients à la recherche de services de qualité. Notre écosystème sécurisé, transparent et adapté au contexte africain permet de transformer la façon dont les projets sont réalisés en Afrique.
            </p>
          </div>
          
          {/* Statistiques clés */}
          <div className="mt-6 md:mt-10">
            <StatisticsCounter />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-6">
              <div className="group relative overflow-hidden bg-gradient-to-br from-white/30 to-white/25 dark:from-slate-900/30 dark:to-slate-900/20 backdrop-blur-sm rounded-lg md:rounded-2xl p-2 md:p-6 border border-slate-200/20 dark:border-slate-700/20 shadow-lg transition-all duration-500 hover:shadow-xl hover:shadow-vynal-accent-primary/10 hover:border-slate-200/40 dark:hover:border-slate-700/40">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-vynal-accent-primary/0 via-vynal-accent-primary to-vynal-accent-primary/0 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-700"></div>
                <div className="flex flex-col items-center text-center">
                  <div className="mb-1 md:mb-3 w-8 h-8 md:w-12 md:h-12 rounded-full bg-vynal-accent-primary/10 flex items-center justify-center">
                    <Users className="h-4 w-4 md:h-6 md:w-6 text-vynal-accent-primary" />
                  </div>
                  <div className="text-lg md:text-3xl font-bold text-vynal-accent-primary flex items-baseline">
                    <span className="counter-value" data-target="500">0</span>
                    <span className="text-sm md:text-2xl">+</span>
                  </div>
                  <div className="text-slate-600 dark:text-vynal-text-secondary mt-1 text-[10px] md:text-sm lg:text-base font-medium">Freelances vérifiés</div>
                </div>
              </div>
              
              <div className="group relative overflow-hidden bg-gradient-to-br from-white/30 to-white/25 dark:from-slate-900/30 dark:to-slate-900/20 backdrop-blur-sm rounded-lg md:rounded-2xl p-2 md:p-6 border border-slate-200/20 dark:border-slate-700/20 shadow-lg transition-all duration-500 hover:shadow-xl hover:shadow-vynal-accent-primary/10 hover:border-slate-200/40 dark:hover:border-slate-700/40">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-vynal-accent-primary/0 via-vynal-accent-primary to-vynal-accent-primary/0 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-700"></div>
                <div className="flex flex-col items-center text-center">
                  <div className="mb-1 md:mb-3 w-8 h-8 md:w-12 md:h-12 rounded-full bg-vynal-accent-primary/10 flex items-center justify-center">
                    <CheckCircle2 className="h-4 w-4 md:h-6 md:w-6 text-vynal-accent-primary" />
                  </div>
                  <div className="text-lg md:text-3xl font-bold text-vynal-accent-primary flex items-baseline">
                    <span className="counter-value" data-target="1200">0</span>
                    <span className="text-sm md:text-2xl">+</span>
                  </div>
                  <div className="text-slate-600 dark:text-vynal-text-secondary mt-1 text-[10px] md:text-sm lg:text-base font-medium">Projets réalisés</div>
                </div>
              </div>
              
              <div className="group relative overflow-hidden bg-gradient-to-br from-white/30 to-white/25 dark:from-slate-900/30 dark:to-slate-900/20 backdrop-blur-sm rounded-lg md:rounded-2xl p-2 md:p-6 border border-slate-200/20 dark:border-slate-700/20 shadow-lg transition-all duration-500 hover:shadow-xl hover:shadow-vynal-accent-primary/10 hover:border-slate-200/40 dark:hover:border-slate-700/40">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-vynal-accent-primary/0 via-vynal-accent-primary to-vynal-accent-primary/0 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-700"></div>
                <div className="flex flex-col items-center text-center">
                  <div className="mb-1 md:mb-3 w-8 h-8 md:w-12 md:h-12 rounded-full bg-vynal-accent-primary/10 flex items-center justify-center">
                    <Star className="h-4 w-4 md:h-6 md:w-6 text-vynal-accent-primary" />
                  </div>
                  <div className="text-lg md:text-3xl font-bold text-vynal-accent-primary flex items-baseline">
                    <span className="counter-value" data-target="98">0</span>
                    <span className="text-sm md:text-2xl">%</span>
                  </div>
                  <div className="text-slate-600 dark:text-vynal-text-secondary mt-1 text-[10px] md:text-sm lg:text-base font-medium">Taux de satisfaction</div>
                </div>
              </div>
              
              <div className="group relative overflow-hidden bg-gradient-to-br from-white/30 to-white/25 dark:from-slate-900/30 dark:to-slate-900/20 backdrop-blur-sm rounded-lg md:rounded-2xl p-2 md:p-6 border border-slate-200/20 dark:border-slate-700/20 shadow-lg transition-all duration-500 hover:shadow-xl hover:shadow-vynal-accent-primary/10 hover:border-slate-200/40 dark:hover:border-slate-700/40">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-vynal-accent-primary/0 via-vynal-accent-primary to-vynal-accent-primary/0 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-700"></div>
                <div className="flex flex-col items-center text-center">
                  <div className="mb-1 md:mb-3 w-8 h-8 md:w-12 md:h-12 rounded-full bg-vynal-accent-primary/10 flex items-center justify-center">
                    <Clock className="h-4 w-4 md:h-6 md:w-6 text-vynal-accent-primary" />
                  </div>
                  <div className="text-lg md:text-3xl font-bold text-vynal-accent-primary flex items-baseline">
                    <span className="counter-value" data-target="24">0</span>
                    <span className="text-sm md:text-2xl">/7</span>
                  </div>
                  <div className="text-slate-600 dark:text-vynal-text-secondary mt-1 text-[10px] md:text-sm lg:text-base font-medium">Support disponible</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Vidéo explicative */}
        <div className="mb-24 md:mb-40 max-w-5xl mx-auto">
          <div className="relative overflow-hidden rounded-xl md:rounded-2xl shadow-xl md:shadow-2xl shadow-vynal-accent-primary/10 aspect-video">
            <div className="absolute inset-0 bg-gradient-to-br from-vynal-accent-primary/10 to-vynal-accent-secondary/10 rounded-xl md:rounded-2xl"></div>
            <Image 
              src="/assets/images/explainer-thumbnail.jpg" 
              alt="Vidéo explicative Vynal Platform" 
              fill
              className="object-cover transition-transform hover:scale-105 duration-700"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-vynal-accent-primary flex items-center justify-center shadow-lg cursor-pointer transition-transform hover:scale-110 duration-300">
                <div className="w-0 h-0 border-t-[8px] md:border-t-[10px] border-t-transparent border-b-[8px] md:border-b-[10px] border-b-transparent border-l-[14px] md:border-l-[18px] border-l-vynal-purple-dark ml-1 md:ml-2"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Processus */}
        <div className="mb-24 md:mb-40">
          <div className="text-center mb-12 md:mb-24">
            <div className="inline-block px-2 md:px-4 py-1 md:py-2 rounded-full bg-vynal-accent-secondary/10 text-vynal-accent-secondary font-medium text-[10px] md:text-sm mb-2 md:mb-4">
              Parcours utilisateur
            </div>
            <h2 className="text-lg md:text-2xl lg:text-3xl font-bold text-vynal-text-primary mb-2 md:mb-4">
              Comment fonctionne <span className="text-vynal-accent-primary">Vynal Platform</span> ?
            </h2>
            <p className="text-xs md:text-base lg:text-lg text-vynal-text-secondary max-w-3xl mx-auto">
              Une plateforme intuitive conçue pour simplifier la collaboration entre clients et freelances
            </p>
          </div>

          {/* Parcours client */}
          <div className="max-w-5xl mx-auto mb-24 md:mb-40">
            <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4 mb-4 md:mb-10 p-2 md:p-4 bg-gradient-to-r from-vynal-accent-primary/10 to-transparent rounded-lg md:rounded-xl border-l-4 border-vynal-accent-primary">
              <div className="w-10 h-10 md:w-16 md:h-16 rounded-full bg-vynal-accent-primary/20 flex items-center justify-center">
                <Users className="h-5 w-5 md:h-8 md:w-8 text-vynal-accent-primary" />
              </div>
              <h3 className="text-base md:text-2xl lg:text-3xl font-bold text-slate-800 dark:text-vynal-text-primary">
                <span className="text-vynal-accent-primary">Vous êtes</span> <span className="text-slate-800 dark:text-vynal-text-primary">client</span>
              </h3>
            </div>
            
            <div className="relative">
              <div className="absolute left-[20px] md:left-24 top-28 bottom-28 w-1 bg-gradient-to-b from-vynal-accent-primary to-vynal-accent-secondary hidden md:block"></div>
              
              <div className="grid grid-cols-1 md:grid-cols-[60px_1fr] gap-3 md:gap-4 mb-6 md:mb-16">
                <div className="hidden md:flex justify-center">
                  <div className="w-8 h-8 md:w-12 md:h-12 rounded-full bg-vynal-accent-primary flex items-center justify-center text-white font-bold text-sm md:text-lg z-10">1</div>
                </div>
                <Card className="bg-white/25 dark:bg-slate-900/20 border-slate-200/20 dark:border-slate-700/20 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardContent className="p-3 md:p-6 lg:p-8">
                    <div className="flex flex-col md:flex-row gap-3 md:gap-6 items-start">
                      <div className="flex md:hidden items-center gap-2 mb-2">
                        <div className="w-6 h-6 rounded-full bg-vynal-accent-primary flex items-center justify-center text-white font-bold text-xs z-10">1</div>
                      </div>
                      <div className="w-10 h-10 md:w-16 md:h-16 flex-shrink-0 flex items-center justify-center bg-vynal-accent-primary/10 rounded-full">
                        <Search className="h-5 w-5 md:h-8 md:w-8 text-vynal-accent-primary" />
                      </div>
                      <div>
                        <CardTitle className="mb-2 md:mb-4 text-sm md:text-xl text-slate-800 dark:text-vynal-text-primary">Publiez un projet ou recherchez un freelance</CardTitle>
                        <CardDescription className="text-xs md:text-base text-slate-600 dark:text-vynal-text-secondary">
                          Décrivez votre besoin en détail et recevez des propositions personnalisées des meilleurs freelances. Vous pouvez également parcourir notre catalogue de talents et filtrer selon vos critères spécifiques pour trouver le profil idéal.
                        </CardDescription>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-[60px_1fr] gap-4 mb-10 md:mb-16">
                <div className="hidden md:flex justify-center">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-vynal-accent-primary flex items-center justify-center text-white font-bold text-base md:text-lg z-10">2</div>
                </div>
                <Card className="bg-white/25 dark:bg-slate-900/20 border-slate-200/20 dark:border-slate-700/20 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardContent className="p-4 md:p-6 lg:p-8">
                    <div className="flex flex-col md:flex-row gap-4 md:gap-6 items-start">
                      <div className="flex md:hidden items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-full bg-vynal-accent-primary flex items-center justify-center text-white font-bold text-sm z-10">2</div>
                      </div>
                      <div className="w-12 h-12 md:w-16 md:h-16 flex-shrink-0 flex items-center justify-center bg-vynal-accent-primary/10 rounded-full">
                        <MessagesSquare className="h-6 w-6 md:h-8 md:w-8 text-vynal-accent-primary" />
                      </div>
                      <div>
                        <CardTitle className="mb-2 md:mb-4 text-base md:text-xl text-slate-800 dark:text-vynal-text-primary">Échangez et finalisez les détails</CardTitle>
                        <CardDescription className="text-sm md:text-base text-slate-600 dark:text-vynal-text-secondary">
                          Utilisez notre messagerie sécurisée pour discuter des spécificités de votre projet, clarifier vos attentes, établir un calendrier précis et convenir des conditions de collaboration. Cette étape est cruciale pour assurer une compréhension mutuelle des objectifs.
                        </CardDescription>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-[60px_1fr] gap-4">
                <div className="hidden md:flex justify-center">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-vynal-accent-primary flex items-center justify-center text-white font-bold text-base md:text-lg z-10">3</div>
                </div>
                <Card className="bg-white/25 dark:bg-slate-900/20 border-slate-200/20 dark:border-slate-700/20 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardContent className="p-4 md:p-6 lg:p-8">
                    <div className="flex flex-col md:flex-row gap-4 md:gap-6 items-start">
                      <div className="flex md:hidden items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-full bg-vynal-accent-primary flex items-center justify-center text-white font-bold text-sm z-10">3</div>
                      </div>
                      <div className="w-12 h-12 md:w-16 md:h-16 flex-shrink-0 flex items-center justify-center bg-vynal-accent-primary/10 rounded-full">
                        <BadgeCheck className="h-6 w-6 md:h-8 md:w-8 text-vynal-accent-primary" />
                      </div>
                      <div>
                        <CardTitle className="mb-2 md:mb-4 text-base md:text-xl text-slate-800 dark:text-vynal-text-primary">Suivez l'avancement et validez</CardTitle>
                        <CardDescription className="text-sm md:text-base text-slate-600 dark:text-vynal-text-secondary">
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
          <div className="max-w-5xl mx-auto mb-24 md:mb-40">
            <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4 mb-4 md:mb-10 p-2 md:p-4 bg-gradient-to-r from-vynal-accent-secondary/10 to-transparent rounded-lg md:rounded-xl border-l-4 border-vynal-accent-secondary">
              <div className="w-10 h-10 md:w-16 md:h-16 rounded-full bg-vynal-accent-secondary/20 flex items-center justify-center">
                <Briefcase className="h-5 w-5 md:h-8 md:w-8 text-vynal-accent-secondary" />
              </div>
              <h3 className="text-base md:text-2xl lg:text-3xl font-bold text-slate-800 dark:text-vynal-text-primary">
                <span className="text-vynal-accent-secondary">Vous êtes</span> <span className="text-slate-800 dark:text-vynal-text-primary">freelance</span>
              </h3>
            </div>
            
            <div className="relative">
              <div className="absolute left-24 top-28 bottom-28 w-1 bg-gradient-to-b from-vynal-accent-secondary to-vynal-accent-primary hidden md:block"></div>
              
              <div className="grid grid-cols-1 md:grid-cols-[60px_1fr] gap-3 md:gap-4 mb-6 md:mb-16">
                <div className="flex justify-center">
                  <div className="w-8 h-8 md:w-12 md:h-12 rounded-full bg-vynal-accent-secondary flex items-center justify-center text-white font-bold text-sm md:text-lg z-10">1</div>
                </div>
                <Card className="bg-white/25 dark:bg-slate-900/20 border-slate-200/20 dark:border-slate-700/20 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardContent className="p-3 md:p-8">
                    <div className="flex flex-col md:flex-row gap-3 md:gap-6 items-start">
                      <div className="w-10 h-10 md:w-16 md:h-16 flex-shrink-0 flex items-center justify-center bg-vynal-accent-secondary/10 rounded-full">
                        <UserCircle className="h-5 w-5 md:h-8 md:w-8 text-vynal-accent-secondary" />
                      </div>
                      <div>
                        <CardTitle className="mb-2 md:mb-4 text-sm md:text-xl text-slate-800 dark:text-vynal-text-primary">Créez un profil complet et attractif</CardTitle>
                        <CardDescription className="text-xs md:text-base text-slate-600 dark:text-vynal-text-secondary">
                          Mettez en avant vos compétences, votre expérience et vos réalisations avec un portfolio soigné. Ajoutez des exemples de projets antérieurs et obtenez des certifications Vynal pour augmenter significativement vos chances d'être sélectionné par les clients.
                        </CardDescription>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-[60px_1fr] gap-3 md:gap-4 mb-6 md:mb-16">
                <div className="flex justify-center">
                  <div className="w-8 h-8 md:w-12 md:h-12 rounded-full bg-vynal-accent-secondary flex items-center justify-center text-white font-bold text-sm md:text-lg z-10">2</div>
                </div>
                <Card className="bg-white/25 dark:bg-slate-900/20 border-slate-200/20 dark:border-slate-700/20 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardContent className="p-3 md:p-8">
                    <div className="flex flex-col md:flex-row gap-3 md:gap-6 items-start">
                      <div className="w-10 h-10 md:w-16 md:h-16 flex-shrink-0 flex items-center justify-center bg-vynal-accent-secondary/10 rounded-full">
                        <Handshake className="h-5 w-5 md:h-8 md:w-8 text-vynal-accent-secondary" />
                      </div>
                      <div>
                        <CardTitle className="mb-2 md:mb-4 text-sm md:text-xl text-slate-800 dark:text-vynal-text-primary">Répondez aux offres ou proposez vos services</CardTitle>
                        <CardDescription className="text-xs md:text-base text-slate-600 dark:text-vynal-text-secondary">
                          Parcourez les projets disponibles et soumettez des propositions personnalisées qui vous démarquent. Vous pouvez également contacter directement des clients potentiels avec des offres de services sur mesure qui répondent précisément à leurs besoins spécifiques.
                        </CardDescription>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-[60px_1fr] gap-3 md:gap-4">
                <div className="flex justify-center">
                  <div className="w-8 h-8 md:w-12 md:h-12 rounded-full bg-vynal-accent-secondary flex items-center justify-center text-white font-bold text-sm md:text-lg z-10">3</div>
                </div>
                <Card className="bg-white/25 dark:bg-slate-900/20 border-slate-200/20 dark:border-slate-700/20 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardContent className="p-3 md:p-8">
                    <div className="flex flex-col md:flex-row gap-3 md:gap-6 items-start">
                      <div className="w-10 h-10 md:w-16 md:h-16 flex-shrink-0 flex items-center justify-center bg-vynal-accent-secondary/10 rounded-full">
                        <Wallet className="h-5 w-5 md:h-8 md:w-8 text-vynal-accent-secondary" />
                      </div>
                      <div>
                        <CardTitle className="mb-2 md:mb-4 text-sm md:text-xl text-slate-800 dark:text-vynal-text-primary">Livrez et recevez votre paiement</CardTitle>
                        <CardDescription className="text-xs md:text-base text-slate-600 dark:text-vynal-text-secondary">
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
          <div className="mt-24 md:mt-40 max-w-4xl mx-auto">
            <Card className="bg-white/25 dark:bg-slate-900/20 border-slate-200/20 dark:border-slate-700/20 rounded-xl shadow-lg backdrop-blur-sm overflow-hidden">
              <CardContent className="p-4 md:p-8">
                <div className="flex flex-col md:flex-row gap-4 md:gap-8 items-center">
                  <div className="w-12 h-12 md:w-20 md:h-20 flex-shrink-0 flex items-center justify-center bg-vynal-accent-primary/10 rounded-full border border-vynal-accent-primary/20">
                    <LockKeyhole className="h-6 w-6 md:h-10 md:w-10 text-vynal-accent-primary" />
                  </div>
                  <div className="flex-grow">
                    <h3 className="text-base md:text-xl font-semibold text-slate-800 dark:text-vynal-text-primary mb-2 md:mb-3">Système de paiement sécurisé</h3>
                    <p className="text-xs md:text-base text-slate-600 dark:text-vynal-text-secondary mb-3 md:mb-4">
                      Notre système de paiement sécurisé protège à la fois les clients et les freelances. Les fonds sont conservés en garantie jusqu'à la validation des livrables, assurant ainsi une transaction en toute confiance.
                    </p>
                    <div className="flex flex-wrap gap-2 md:gap-3">
                      <Badge className="bg-vynal-accent-primary/10 text-vynal-accent-primary hover:bg-vynal-accent-primary/20 text-[10px] md:text-xs">
                        <ShieldCheck className="h-3 w-3 md:h-3.5 md:w-3.5 mr-1" />
                        Paiement sécurisé
                      </Badge>
                      <Badge className="bg-vynal-accent-primary/10 text-vynal-accent-primary hover:bg-vynal-accent-primary/20 text-[10px] md:text-xs">
                        <Clock className="h-3 w-3 md:h-3.5 md:w-3.5 mr-1" />
                        Garantie de satisfaction
                      </Badge>
                      <Badge className="bg-vynal-accent-primary/10 text-vynal-accent-primary hover:bg-vynal-accent-primary/20 text-[10px] md:text-xs">
                        <AlertCircle className="h-3 w-3 md:h-3.5 md:w-3.5 mr-1" />
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
        <div className="mb-24 md:mb-40">
          <div className="text-center mb-12 md:mb-24">
            <div className="inline-block px-2 md:px-4 py-1 md:py-2 rounded-full bg-vynal-accent-primary/10 text-vynal-accent-primary font-medium text-[10px] md:text-sm mb-2 md:mb-4">
              Pourquoi choisir Vynal
            </div>
            <h2 className="text-lg md:text-3xl font-bold text-slate-800 dark:text-vynal-text-primary mb-3 md:mb-4">
              Les avantages exclusifs de notre plateforme
            </h2>
            <p className="text-xs md:text-lg text-slate-600 dark:text-vynal-text-secondary max-w-3xl mx-auto">
              Vynal Platform offre un écosystème complet pensé pour optimiser la collaboration entre freelances et clients.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
            {/* Avantage 1 */}
            <div className="group">
              <Card className="bg-white/25 dark:bg-slate-900/20 border-slate-200/20 dark:border-slate-700/20 rounded-xl shadow-lg backdrop-blur-sm h-full transition-all duration-300 group-hover:translate-y-[-8px] group-hover:shadow-xl group-hover:shadow-vynal-accent-primary/20 overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-vynal-accent-primary to-vynal-accent-secondary"></div>
                <CardContent className="p-4 md:p-8">
                  <div className="w-10 h-10 md:w-16 md:h-16 mb-3 md:mb-6 flex items-center justify-center bg-vynal-accent-primary/10 rounded-full border border-vynal-accent-primary/20 transition-all duration-300 group-hover:bg-vynal-accent-primary/20">
                    <ShieldCheck className="h-5 w-5 md:h-8 md:w-8 text-vynal-accent-primary" />
                  </div>
                  <h3 className="text-sm md:text-xl font-semibold text-slate-800 dark:text-vynal-text-primary mb-2 md:mb-4">Sécurité et confiance</h3>
                  <p className="text-xs md:text-base text-slate-600 dark:text-vynal-text-secondary mb-3 md:mb-6">
                    Nous offrons un environnement sécurisé où la confiance est notre priorité absolue. Chaque transaction et interaction est protégée.
                  </p>
                  <ul className="space-y-2 text-slate-600 dark:text-vynal-text-secondary">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-3 w-3 md:h-4 md:w-4 text-vynal-accent-primary flex-shrink-0" />
                      <span className="text-xs md:text-base">Vérification d'identité des freelances</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-3 w-3 md:h-4 md:w-4 text-vynal-accent-primary flex-shrink-0" />
                      <span className="text-xs md:text-base">Système d'évaluation transparent</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-3 w-3 md:h-4 md:w-4 text-vynal-accent-primary flex-shrink-0" />
                      <span className="text-xs md:text-base">Protection anti-fraude avancée</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* Avantage 2 */}
            <div className="group">
              <Card className="bg-white/25 dark:bg-slate-900/20 border-slate-200/20 dark:border-slate-700/20 rounded-xl shadow-lg backdrop-blur-sm h-full transition-all duration-300 group-hover:translate-y-[-8px] group-hover:shadow-xl group-hover:shadow-vynal-accent-primary/20 overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-vynal-accent-primary to-vynal-accent-secondary"></div>
                <CardContent className="p-4 md:p-8">
                  <div className="w-10 h-10 md:w-16 md:h-16 mb-3 md:mb-6 flex items-center justify-center bg-vynal-accent-primary/10 rounded-full border border-vynal-accent-primary/20 transition-all duration-300 group-hover:bg-vynal-accent-primary/20">
                    <Zap className="h-5 w-5 md:h-8 md:w-8 text-vynal-accent-primary" />
                  </div>
                  <h3 className="text-sm md:text-xl font-semibold text-slate-800 dark:text-vynal-text-primary mb-2 md:mb-4">Efficacité optimale</h3>
                  <p className="text-xs md:text-base text-slate-600 dark:text-vynal-text-secondary mb-3 md:mb-6">
                    Notre plateforme rationalise tout le processus de collaboration, vous permettant de vous concentrer sur ce qui compte vraiment.
                  </p>
                  <ul className="space-y-2 text-slate-600 dark:text-vynal-text-secondary">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-3 w-3 md:h-4 md:w-4 text-vynal-accent-primary flex-shrink-0" />
                      <span className="text-xs md:text-base">Recherche intelligente de talents</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-3 w-3 md:h-4 md:w-4 text-vynal-accent-primary flex-shrink-0" />
                      <span className="text-xs md:text-base">Gestion de projet intégrée</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-3 w-3 md:h-4 md:w-4 text-vynal-accent-primary flex-shrink-0" />
                      <span className="text-xs md:text-base">Facturation et comptabilité automatisées</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* Avantage 3 */}
            <div className="group">
              <Card className="bg-white/25 dark:bg-slate-900/20 border-slate-200/20 dark:border-slate-700/20 rounded-xl shadow-lg backdrop-blur-sm h-full transition-all duration-300 group-hover:translate-y-[-8px] group-hover:shadow-xl group-hover:shadow-vynal-accent-primary/20 overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-vynal-accent-primary to-vynal-accent-secondary"></div>
                <CardContent className="p-4 md:p-8">
                  <div className="w-10 h-10 md:w-16 md:h-16 mb-3 md:mb-6 flex items-center justify-center bg-vynal-accent-primary/10 rounded-full border border-vynal-accent-primary/20 transition-all duration-300 group-hover:bg-vynal-accent-primary/20">
                    <MessageSquare className="h-5 w-5 md:h-8 md:w-8 text-vynal-accent-primary" />
                  </div>
                  <h3 className="text-sm md:text-xl font-semibold text-slate-800 dark:text-vynal-text-primary mb-2 md:mb-4">Communication sans friction</h3>
                  <p className="text-xs md:text-base text-slate-600 dark:text-vynal-text-secondary mb-3 md:mb-6">
                    Des outils de communication puissants qui facilitent la compréhension et la réussite de vos projets.
                  </p>
                  <ul className="space-y-2 text-slate-600 dark:text-vynal-text-secondary">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-3 w-3 md:h-4 md:w-4 text-vynal-accent-primary flex-shrink-0" />
                      <span className="text-xs md:text-base">Messagerie temps réel intégrée</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-3 w-3 md:h-4 md:w-4 text-vynal-accent-primary flex-shrink-0" />
                      <span className="text-xs md:text-base">Partage de fichiers sécurisé</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-3 w-3 md:h-4 md:w-4 text-vynal-accent-primary flex-shrink-0" />
                      <span className="text-xs md:text-base">Historique complet des échanges</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* Avantage 4 - Impact local */}
            <div className="group md:col-span-3">
              <Card className="bg-white/25 dark:bg-slate-900/20 border-slate-200/20 dark:border-slate-700/20 rounded-xl shadow-lg backdrop-blur-sm transition-all duration-300 group-hover:shadow-xl group-hover:shadow-vynal-accent-primary/20 overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-vynal-accent-primary to-vynal-accent-secondary"></div>
                <CardContent className="p-4 md:p-8">
                  <div className="flex flex-col md:flex-row gap-4 md:gap-8 items-center">
                    <div className="w-10 h-10 md:w-16 md:h-16 flex-shrink-0 flex items-center justify-center bg-vynal-accent-primary/10 rounded-full border border-vynal-accent-primary/20 transition-all duration-300 group-hover:bg-vynal-accent-primary/20">
                      <Award className="h-5 w-5 md:h-8 md:w-8 text-vynal-accent-primary" />
                    </div>
                    <div className="flex-grow">
                      <h3 className="text-sm md:text-xl font-semibold text-slate-800 dark:text-vynal-text-primary mb-2 md:mb-3">Impact sur l'économie africaine</h3>
                      <p className="text-xs md:text-base text-slate-600 dark:text-vynal-text-secondary">
                        Vynal Platform s'engage à promouvoir les talents africains, tout en créant un écosystème où les compétences locales peuvent rayonner à l'échelle internationale. Nous contribuons activement au développement de l'économie numérique africaine en facilitant l'accès à des opportunités professionnelles pour les freelances et des services de qualité pour les entreprises locales.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="mb-24 md:mb-40">
          <div className="text-center mb-12 md:mb-24">
            <div className="inline-block px-2 md:px-4 py-1 md:py-2 rounded-full bg-vynal-accent-primary/10 text-vynal-accent-primary font-medium text-[10px] md:text-sm mb-2 md:mb-4">
              Questions fréquentes
            </div>
            <h2 className="text-lg md:text-3xl font-bold text-slate-800 dark:text-vynal-text-primary mb-3 md:mb-4">
              Tout ce que vous devez savoir
            </h2>
            <p className="text-xs md:text-lg text-slate-600 dark:text-vynal-text-secondary max-w-3xl mx-auto">
              Des réponses claires à vos questions les plus fréquentes sur notre plateforme.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <Accordion type="single" collapsible className="w-full space-y-4">
              <AccordionItem value="item-1" className="border-slate-200/20 dark:border-slate-700/20">
                <AccordionTrigger className="text-sm md:text-base font-medium text-slate-800 dark:text-vynal-text-primary hover:text-vynal-accent-primary dark:hover:text-vynal-accent-primary">
                  Comment fonctionne le système de paiement ?
                </AccordionTrigger>
                <AccordionContent className="text-xs md:text-base text-slate-600 dark:text-vynal-text-secondary">
                  Notre système de paiement sécurisé permet de gérer les transactions en toute confiance. Les fonds sont conservés en garantie jusqu'à la validation du projet, assurant ainsi la sécurité des deux parties.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2" className="border-slate-200/20 dark:border-slate-700/20">
                <AccordionTrigger className="text-sm md:text-base font-medium text-slate-800 dark:text-vynal-text-primary hover:text-vynal-accent-primary dark:hover:text-vynal-accent-primary">
                  Comment choisir le bon freelance ?
                </AccordionTrigger>
                <AccordionContent className="text-xs md:text-base text-slate-600 dark:text-vynal-text-secondary">
                  Notre plateforme propose un système de notation et d'évaluation détaillé. Vous pouvez consulter les portfolios, les avis clients et les compétences spécifiques de chaque freelance pour faire votre choix en toute confiance.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-3" className="border-slate-200/20 dark:border-slate-700/20">
                <AccordionTrigger className="text-sm md:text-base font-medium text-slate-800 dark:text-vynal-text-primary hover:text-vynal-accent-primary dark:hover:text-vynal-accent-primary">
                  Quels types de projets puis-je publier ?
                </AccordionTrigger>
                <AccordionContent className="text-xs md:text-base text-slate-600 dark:text-vynal-text-secondary">
                  Vynal Platform accueille une large gamme de projets : développement web, design graphique, marketing digital, rédaction de contenu, et bien plus encore. Notre communauté de freelances couvre de nombreux domaines d'expertise.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-4" className="border-slate-200/20 dark:border-slate-700/20">
                <AccordionTrigger className="text-sm md:text-base font-medium text-slate-800 dark:text-vynal-text-primary hover:text-vynal-accent-primary dark:hover:text-vynal-accent-primary">
                  Comment sont gérés les litiges ?
                </AccordionTrigger>
                <AccordionContent className="text-xs md:text-base text-slate-600 dark:text-vynal-text-secondary">
                  En cas de litige, notre équipe de support intervient pour faciliter la résolution. Nous examinons les preuves et les communications pour prendre une décision équitable, en protégeant les intérêts des deux parties.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-5" className="border-slate-200/20 dark:border-slate-700/20">
                <AccordionTrigger className="text-sm md:text-base font-medium text-slate-800 dark:text-vynal-text-primary hover:text-vynal-accent-primary dark:hover:text-vynal-accent-primary">
                  Quels sont les frais de la plateforme ?
                </AccordionTrigger>
                <AccordionContent className="text-xs md:text-base text-slate-600 dark:text-vynal-text-secondary">
                  Nous appliquons une commission transparente sur chaque transaction réussie. Les frais varient selon le type de projet et le montant, avec des tarifs compétitifs adaptés au marché africain.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-6" className="border-slate-200/20 dark:border-slate-700/20">
                <AccordionTrigger className="text-sm md:text-base font-medium text-slate-800 dark:text-vynal-text-primary hover:text-vynal-accent-primary dark:hover:text-vynal-accent-primary">
                  Comment commencer à utiliser la plateforme ?
                </AccordionTrigger>
                <AccordionContent className="text-xs md:text-base text-slate-600 dark:text-vynal-text-secondary">
                  Créez simplement votre compte, complétez votre profil et commencez à publier vos projets ou à postuler aux offres. Notre interface intuitive vous guide à chaque étape du processus.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>

        {/* Questions fréquentes */}
        <div className="mb-24 md:mb-40">
          <div className="text-center mb-12 md:mb-24">
            <div className="inline-block px-2 md:px-4 py-1 md:py-2 rounded-full bg-vynal-accent-primary/10 text-vynal-accent-primary font-medium text-[10px] md:text-sm mb-2 md:mb-4">
              Vos interrogations
            </div>
            <h2 className="text-xl md:text-3xl font-bold text-vynal-text-primary mb-3 md:mb-4">
              Questions fréquemment posées
            </h2>
            <p className="text-xs md:text-lg text-vynal-text-secondary max-w-3xl mx-auto">
              Retrouvez les réponses aux questions les plus courantes sur le fonctionnement de Vynal Platform.
            </p>
          </div>
          
          <div className="max-w-4xl mx-auto space-y-4 md:space-y-6">
            <Card className="bg-white/25 dark:bg-slate-900/20 border-slate-200/20 dark:border-slate-700/20 rounded-xl shadow-lg backdrop-blur-sm overflow-hidden group transition-all duration-300 hover:shadow-xl hover:shadow-vynal-accent-primary/20">
              <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-vynal-accent-primary to-vynal-accent-secondary"></div>
              <CardContent className="p-4 md:p-6 pl-6 md:pl-8">
                <h3 className="text-base md:text-xl font-semibold text-slate-800 dark:text-vynal-text-primary mb-2 md:mb-3 group-hover:text-vynal-accent-primary transition-colors duration-300">Comment sont gérés les paiements sur la plateforme ?</h3>
                <p className="text-xs md:text-base text-slate-600 dark:text-vynal-text-secondary">
                  Vynal utilise un système de paiement sécurisé où les fonds sont conservés en séquestre jusqu'à la validation du travail. Le client effectue le paiement au moment de la commande, mais celui-ci reste bloqué dans un compte sécurisé. C'est seulement après validation complète du travail livré que les fonds sont libérés vers le compte du freelance.
                </p>
              </CardContent>
            </Card>
            
            {/* CTA */}
            <div className="relative py-16 md:py-24">
              <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-white/25 dark:from-slate-900/30 dark:to-slate-900/20 backdrop-blur-sm rounded-xl border border-slate-200/20 dark:border-slate-700/20"></div>
              <div className="relative container mx-auto px-4 md:px-6">
                <div className="text-center">
                  <div className="inline-block px-2 md:px-4 py-1 md:py-2 rounded-full bg-vynal-accent-primary/10 text-vynal-accent-primary font-medium text-[10px] md:text-sm mb-2 md:mb-4">
                    Rejoignez-nous
                  </div>
                  <h2 className="text-lg md:text-3xl font-bold text-slate-800 dark:text-vynal-text-primary mb-3 md:mb-4">
                    Prêt à rejoindre la communauté Vynal ?
                  </h2>
                  <p className="text-xs md:text-lg text-slate-600 dark:text-vynal-text-secondary max-w-3xl mx-auto mb-6 md:mb-8">
                    Rejoignez des milliers de freelances et clients qui font déjà confiance à notre plateforme.
                  </p>
                  <div className="flex flex-col md:flex-row gap-4 justify-center">
                    <Button className="bg-vynal-accent-primary hover:bg-vynal-accent-primary/90 text-white px-6 md:px-8 py-2 md:py-3 rounded-lg text-sm md:text-base font-medium transition-all duration-200">
                      S'inscrire gratuitement
                    </Button>
                    <Button variant="outline" className="border-slate-200/20 dark:border-slate-700/20 bg-white/40 dark:bg-slate-800/40 hover:bg-white/50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-vynal-text-primary px-6 md:px-8 py-2 md:py-3 rounded-lg text-sm md:text-base font-medium transition-all duration-200">
                      Explorer les services
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Témoignages */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
              <Card className="bg-white/25 dark:bg-slate-900/20 border-slate-200/20 dark:border-slate-700/20 rounded-xl shadow-lg backdrop-blur-sm overflow-hidden group hover:border-vynal-accent-primary/30 transition-all duration-300">
                <CardContent className="p-4 md:p-6 relative">
                  <div className="absolute top-2 right-2 text-vynal-accent-primary opacity-30 group-hover:opacity-100 transition-opacity duration-300">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M10 7H6C4.89543 7 4 7.89543 4 9V18C4 19.1046 4.89543 20 6 20H15C16.1046 20 17 19.1046 17 18V14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M16 4L20 8M20 4L16 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M15 10V4H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div className="mb-3 md:mb-4">
                    <div>
                      <p className="font-medium text-sm md:text-base text-slate-800 dark:text-vynal-text-primary">Aminata D.</p>
                      <p className="text-[10px] md:text-sm text-slate-600 dark:text-vynal-text-secondary">Graphiste freelance</p>
                    </div>
                  </div>
                  <p className="text-xs md:text-base text-slate-600 dark:text-vynal-text-secondary italic">
                    "Vynal m'a permis de développer mon activité de design et d'accéder à des clients internationaux tout en restant en Afrique. La sécurité des paiements est un vrai plus !"
                  </p>
                  <div className="flex mt-2 md:mt-3 justify-center">
                    <Star className="h-3 w-3 md:h-4 md:w-4 text-vynal-accent-primary mx-0.5" fill="currentColor" />
                    <Star className="h-3 w-3 md:h-4 md:w-4 text-vynal-accent-primary mx-0.5" fill="currentColor" />
                    <Star className="h-3 w-3 md:h-4 md:w-4 text-vynal-accent-primary mx-0.5" fill="currentColor" />
                    <Star className="h-3 w-3 md:h-4 md:w-4 text-vynal-accent-primary mx-0.5" fill="currentColor" />
                    <Star className="h-3 w-3 md:h-4 md:w-4 text-vynal-accent-primary mx-0.5" fill="currentColor" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-white/25 dark:bg-slate-900/20 border-slate-200/20 dark:border-slate-700/20 rounded-xl shadow-lg backdrop-blur-sm overflow-hidden group hover:border-vynal-accent-primary/30 transition-all duration-300">
                <CardContent className="p-4 md:p-6 relative">
                  <div className="absolute top-2 right-2 text-vynal-accent-primary opacity-30 group-hover:opacity-100 transition-opacity duration-300">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M10 7H6C4.89543 7 4 7.89543 4 9V18C4 19.1046 4.89543 20 6 20H15C16.1046 20 17 19.1046 17 18V14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M16 4L20 8M20 4L16 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M15 10V4H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div className="mb-3 md:mb-4">
                    <div>
                      <p className="font-medium text-sm md:text-base text-slate-800 dark:text-vynal-text-primary">Moussa T.</p>
                      <p className="text-[10px] md:text-sm text-slate-600 dark:text-vynal-text-secondary">Développeur web</p>
                    </div>
                  </div>
                  <p className="text-xs md:text-base text-slate-600 dark:text-vynal-text-secondary italic">
                    "J'ai commencé comme développeur junior et aujourd'hui je gère une équipe de freelances sur Vynal. La plateforme a vraiment transformé ma carrière professionnelle."
                  </p>
                  <div className="flex mt-2 md:mt-3 justify-center">
                    <Star className="h-3 w-3 md:h-4 md:w-4 text-vynal-accent-primary mx-0.5" fill="currentColor" />
                    <Star className="h-3 w-3 md:h-4 md:w-4 text-vynal-accent-primary mx-0.5" fill="currentColor" />
                    <Star className="h-3 w-3 md:h-4 md:w-4 text-vynal-accent-primary mx-0.5" fill="currentColor" />
                    <Star className="h-3 w-3 md:h-4 md:w-4 text-vynal-accent-primary mx-0.5" fill="currentColor" />
                    <Star className="h-3 w-3 md:h-4 md:w-4 text-vynal-accent-primary mx-0.5" fill="currentColor" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-white/25 dark:bg-slate-900/20 border-slate-200/20 dark:border-slate-700/20 rounded-xl shadow-lg backdrop-blur-sm overflow-hidden group hover:border-vynal-accent-primary/30 transition-all duration-300">
                <CardContent className="p-4 md:p-6 relative">
                  <div className="absolute top-2 right-2 text-vynal-accent-primary opacity-30 group-hover:opacity-100 transition-opacity duration-300">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M10 7H6C4.89543 7 4 7.89543 4 9V18C4 19.1046 4.89543 20 6 20H15C16.1046 20 17 19.1046 17 18V14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M16 4L20 8M20 4L16 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M15 10V4H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div className="mb-3 md:mb-4">
                    <div>
                      <p className="font-medium text-sm md:text-base text-slate-800 dark:text-vynal-text-primary">Fatou S.</p>
                      <p className="text-[10px] md:text-sm text-slate-600 dark:text-vynal-text-secondary">Entrepreneuse</p>
                    </div>
                  </div>
                  <p className="text-xs md:text-base text-slate-600 dark:text-vynal-text-secondary italic">
                    "En tant que startup, Vynal nous a permis de trouver rapidement des talents locaux qualifiés pour tous nos projets digitaux, avec un excellent rapport qualité-prix."
                  </p>
                  <div className="flex mt-2 md:mt-3 justify-center">
                    <Star className="h-3 w-3 md:h-4 md:w-4 text-vynal-accent-primary mx-0.5" fill="currentColor" />
                    <Star className="h-3 w-3 md:h-4 md:w-4 text-vynal-accent-primary mx-0.5" fill="currentColor" />
                    <Star className="h-3 w-3 md:h-4 md:w-4 text-vynal-accent-primary mx-0.5" fill="currentColor" />
                    <Star className="h-3 w-3 md:h-4 md:w-4 text-vynal-accent-primary mx-0.5" fill="currentColor" />
                    <Star className="h-3 w-3 md:h-4 md:w-4 text-vynal-accent-primary mx-0.5" fill="currentColor" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Lien vers FAQ */}
            <div className="text-center mt-8 md:mt-12">
              <div className="inline-block p-0.5 rounded-full bg-gradient-to-r from-vynal-accent-primary to-vynal-accent-secondary shadow-lg shadow-vynal-accent-primary/20">
                <Link href="/faq">
                  <Button className="bg-vynal-purple-dark hover:bg-vynal-purple-secondary/40 text-white dark:text-vynal-text-primary px-6 md:px-8 py-2 md:py-3 text-sm md:text-base rounded-full">
                    Voir toutes les questions <ArrowRight className="ml-2 h-3 w-3 md:h-4 md:w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 