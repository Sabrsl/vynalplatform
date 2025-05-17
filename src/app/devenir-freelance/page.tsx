import { Metadata } from "next";
import PageLayout from "@/components/ui/PageLayout";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { 
  Users, Clock, CreditCard, Zap, CheckCircle, 
  Lightbulb, Shield, ArrowRight 
} from "lucide-react";
import { AUTH_ROUTES } from "@/config/routes";

export const metadata: Metadata = {
  title: "Devenir Freelance | Vynal Platform",
  description: "Proposez gratuitement vos talents à de nouveaux clients sur Vynal Platform. Inscription simple, gestion facile et paiements sécurisés.",
};

// Ajouter une configuration de mise en cache pour cette page statique
export const dynamic = 'force-static';
export const revalidate = 2592000; // 30 jours en secondes

export default function DevenirFreelancePage() {
  return (
    <PageLayout 
      fullGradient={false}
      withPadding={true}
      title="Devenir Freelance sur Vynal Platform"
      wrapperClassName="bg-white dark:bg-vynal-purple-dark/10"
    >
      {/* Hero Section */}
      <section className="py-10 md:py-14 lg:py-16 mb-16">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-4 bg-gradient-to-r from-vynal-accent-primary to-vynal-accent-secondary bg-clip-text text-transparent">
            Proposez gratuitement vos talents à de nouveaux clients !
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-slate-600 dark:text-vynal-text-secondary mb-6 max-w-2xl mx-auto">
            Rejoignez Vynal Platform et développez votre activité sans frais d'inscription.
          </p>
          <div className="flex justify-center">
            <Button asChild size="lg" className="bg-vynal-accent-primary hover:bg-vynal-accent-secondary text-sm sm:text-base">
              <Link href={`${AUTH_ROUTES.REGISTER}?role=freelance`}>
                Commencer à vendre
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Comment ça marche Section */}
      <section className="py-10 md:py-14 bg-white dark:bg-vynal-purple-dark/10 mb-16">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-center mb-8 text-slate-800 dark:text-vynal-text-primary">
            Comment ça marche ?
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            {/* Étape 1 */}
            <div className="bg-white/25 dark:bg-slate-900/30 p-4 sm:p-5 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-slate-200 dark:border-slate-700/30">
              <div className="flex items-start mb-3">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-vynal-accent-primary flex items-center justify-center text-white font-bold text-sm sm:text-base mr-3 shrink-0">1</div>
                <h3 className="font-semibold text-sm sm:text-base md:text-lg text-slate-800 dark:text-vynal-text-primary pt-1">Remplissez votre profil et créez votre service</h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-vynal-text-secondary ml-11">
                Présentez-vous, puis présentez vos compétences. Votre service est votre devis, validé par notre équipe.
              </p>
            </div>
            
            {/* Étape 2 */}
            <div className="bg-white/25 dark:bg-slate-900/30 p-4 sm:p-5 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-slate-200 dark:border-slate-700/30">
              <div className="flex items-start mb-3">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-vynal-accent-primary flex items-center justify-center text-white font-bold text-sm sm:text-base mr-3 shrink-0">2</div>
                <h3 className="font-semibold text-sm sm:text-base md:text-lg text-slate-800 dark:text-vynal-text-primary pt-1">Vendez, faites des clients heureux</h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-vynal-text-secondary ml-11">
                Vous recevez une notification à chaque nouvelle commande. Mettez en application votre expertise.
              </p>
            </div>
            
            {/* Étape 3 */}
            <div className="bg-white/25 dark:bg-slate-900/30 p-4 sm:p-5 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-slate-200 dark:border-slate-700/30">
              <div className="flex items-start mb-3">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-vynal-accent-primary flex items-center justify-center text-white font-bold text-sm sm:text-base mr-3 shrink-0">3</div>
                <h3 className="font-semibold text-sm sm:text-base md:text-lg text-slate-800 dark:text-vynal-text-primary pt-1">Soyez payé !</h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-vynal-text-secondary ml-11">
                Une fois votre commande terminée, votre facture est automatiquement éditée et le montant immédiatement disponible.
              </p>
            </div>
          </div>
          
          <div className="mt-6 text-center">
            <p className="text-xs max-w-xs sm:text-sm sm:max-w-3xl text-slate-600 dark:text-vynal-text-secondary italic mx-auto leading-tight">
              <strong>Vynal Platform est conçu pour vous protéger</strong> tout au long d'une commande. Nous sécurisons vos paiements et vos informations restent confidentielles.
            </p>
          </div>
        </div>
      </section>

      {/* Avantages Section en grid responsive */}
      <section id="avantages" className="py-10 md:py-14 bg-white dark:bg-vynal-purple-dark/10 rounded-2xl mb-16">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-center mb-8 text-slate-800 dark:text-vynal-text-primary">
            Les avantages <span className="text-vynal-accent-primary">Vynal</span>
          </h2>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 md:gap-5">
            {/* Card 1 */}
            <div className="bg-white/20 dark:bg-slate-800/25 p-3 sm:p-4 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-slate-200/50 dark:border-slate-700/15">
              <div className="flex items-center mb-2">
                <div className="p-1.5 sm:p-2 rounded-lg bg-vynal-accent-primary/10 mr-2 sm:mr-3">
                  <Users className="h-4 w-4 sm:h-5 sm:w-5 text-vynal-accent-primary" />
                </div>
                <h3 className="font-semibold text-xs sm:text-sm md:text-base text-slate-800 dark:text-vynal-text-primary">Clients qualifiés</h3>
              </div>
              <p className="text-xs text-slate-600 dark:text-vynal-text-secondary">
                Une clientèle sérieuse qui valorise votre expertise.
              </p>
            </div>
            
            {/* Card 2 */}
            <div className="bg-white/20 dark:bg-slate-800/25 p-3 sm:p-4 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-slate-200/50 dark:border-slate-700/15">
              <div className="flex items-center mb-2">
                <div className="p-1.5 sm:p-2 rounded-lg bg-vynal-accent-primary/10 mr-2 sm:mr-3">
                  <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-vynal-accent-primary" />
                </div>
                <h3 className="font-semibold text-xs sm:text-sm md:text-base text-slate-800 dark:text-vynal-text-primary">Gestion simplifiée</h3>
              </div>
              <p className="text-xs text-slate-600 dark:text-vynal-text-secondary">
                Facturation automatique et contrats générés.
              </p>
            </div>
            
            {/* Card 3 */}
            <div className="bg-white/20 dark:bg-slate-800/25 p-3 sm:p-4 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-slate-200/50 dark:border-slate-700/15">
              <div className="flex items-center mb-2">
                <div className="p-1.5 sm:p-2 rounded-lg bg-vynal-accent-primary/10 mr-2 sm:mr-3">
                  <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 text-vynal-accent-primary" />
                </div>
                <h3 className="font-semibold text-xs sm:text-sm md:text-base text-slate-800 dark:text-vynal-text-primary">Paiements sécurisés</h3>
              </div>
              <p className="text-xs text-slate-600 dark:text-vynal-text-secondary">
                Fini les impayés ! Paiements garantis.
              </p>
            </div>
            
            {/* Card 4 */}
            <div className="bg-white/20 dark:bg-slate-800/25 p-3 sm:p-4 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-slate-200/50 dark:border-slate-700/15">
              <div className="flex items-center mb-2">
                <div className="p-1.5 sm:p-2 rounded-lg bg-vynal-accent-primary/10 mr-2 sm:mr-3">
                  <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-vynal-accent-primary" />
                </div>
                <h3 className="font-semibold text-xs sm:text-sm md:text-base text-slate-800 dark:text-vynal-text-primary">Visibilité optimale</h3>
              </div>
              <p className="text-xs text-slate-600 dark:text-vynal-text-secondary">
                Profil mis en avant auprès des clients.
              </p>
            </div>
            
            {/* Card 5 */}
            <div className="bg-white/20 dark:bg-slate-800/25 p-3 sm:p-4 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-slate-200/50 dark:border-slate-700/15">
              <div className="flex items-center mb-2">
                <div className="p-1.5 sm:p-2 rounded-lg bg-vynal-accent-primary/10 mr-2 sm:mr-3">
                  <Lightbulb className="h-4 w-4 sm:h-5 sm:w-5 text-vynal-accent-primary" />
                </div>
                <h3 className="font-semibold text-xs sm:text-sm md:text-base text-slate-800 dark:text-vynal-text-primary">0% de commission</h3>
              </div>
              <p className="text-xs text-slate-600 dark:text-vynal-text-secondary">
                Pendant 1 mois pour les nouveaux.
              </p>
            </div>
            
            {/* Card 6 */}
            <div className="bg-white/20 dark:bg-slate-800/25 p-3 sm:p-4 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-slate-200/50 dark:border-slate-700/15">
              <div className="flex items-center mb-2">
                <div className="p-1.5 sm:p-2 rounded-lg bg-vynal-accent-primary/10 mr-2 sm:mr-3">
                  <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-vynal-accent-primary" />
                </div>
                <h3 className="font-semibold text-xs sm:text-sm md:text-base text-slate-800 dark:text-vynal-text-primary">Support dédié</h3>
              </div>
              <p className="text-xs text-slate-600 dark:text-vynal-text-secondary">
                Équipe réactive pour vous accompagner.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Témoignages Section minimaliste */}
      <section className="py-10 md:py-14 bg-white dark:bg-vynal-purple-dark/10 mb-16">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-center mb-6 text-slate-800 dark:text-vynal-text-primary">
            Ils ont rejoint Vynal
          </h2>
          
          <div className="p-4 sm:p-5 bg-white/25 dark:bg-slate-900/30 rounded-2xl border border-slate-200 dark:border-slate-700/30 shadow-sm">
            <p className="italic text-slate-600 dark:text-vynal-text-secondary mb-4 text-xs sm:text-sm">
              "Depuis mon inscription sur Vynal, j'ai doublé mon nombre de clients en 2 mois. La plateforme s'occupe de toute la paperasse, et je reçois mes paiements en temps et en heure."
            </p>
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-vynal-accent-primary/20 flex items-center justify-center">
                <span className="text-vynal-accent-primary font-semibold text-xs">SR</span>
              </div>
              <div className="ml-3">
                <p className="font-semibold text-slate-800 dark:text-vynal-text-primary text-xs sm:text-sm">Sophie Sall</p>
                <p className="text-xs text-slate-500 dark:text-vynal-text-secondary">Développeuse web</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Comparaison section en version moderne */}
      <section className="py-10 md:py-14 bg-white dark:bg-vynal-purple-dark/10 mb-16">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-center mb-8 text-slate-800 dark:text-vynal-text-primary">
            Comparatif
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {/* Platformes traditionnelles */}
            <div className="bg-white/25 dark:bg-slate-900/30 p-4 sm:p-5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700/30">
              <h3 className="font-semibold text-sm sm:text-base mb-4 text-slate-800 dark:text-vynal-text-primary pb-2 border-b">Plateformes traditionnelles</h3>
              <ul className="space-y-2 sm:space-y-3">
                <li className="flex items-start">
                  <span className="text-red-500 mr-2">✗</span>
                  <span className="text-slate-600 dark:text-vynal-text-secondary text-xs sm:text-sm">Commission élevée (25-30%)</span>
                </li>
                <li className="flex items-start">
                  <span className="text-red-500 mr-2">✗</span>
                  <span className="text-slate-600 dark:text-vynal-text-secondary text-xs sm:text-sm">Guerre des prix à la baisse</span>
                </li>
                <li className="flex items-start">
                  <span className="text-red-500 mr-2">✗</span>
                  <span className="text-slate-600 dark:text-vynal-text-secondary text-xs sm:text-sm">Gestion administrative complexe</span>
                </li>
                <li className="flex items-start">
                  <span className="text-red-500 mr-2">✗</span>
                  <span className="text-slate-600 dark:text-vynal-text-secondary text-xs sm:text-sm">Risque d'impayés</span>
                </li>
              </ul>
            </div>
            
            {/* Vynal Platform */}
            <div className="bg-gradient-to-br from-vynal-accent-primary to-vynal-accent-secondary p-4 sm:p-5 rounded-xl shadow-md">
              <h3 className="font-semibold text-sm sm:text-base mb-4 text-white pb-2 border-b border-white/30">Vynal Platform</h3>
              <ul className="space-y-2 sm:space-y-3">
                <li className="flex items-start">
                  <span className="text-white mr-2">✓</span>
                  <span className="text-white text-xs sm:text-sm">0% commission pendant 1 mois et 1% avec Vynal Pro</span>
                </li>
                <li className="flex items-start">
                  <span className="text-white mr-2">✓</span>
                  <span className="text-white text-xs sm:text-sm">Tarifs valorisés à votre expertise</span>
                </li>
                <li className="flex items-start">
                  <span className="text-white mr-2">✓</span>
                  <span className="text-white text-xs sm:text-sm">Gestion administrative automatisée</span>
                </li>
                <li className="flex items-start">
                  <span className="text-white mr-2">✓</span>
                  <span className="text-white text-xs sm:text-sm">Paiements garantis et sécurisés</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Bloc sécurité */}
      <section className="py-6 md:py-8 bg-white dark:bg-vynal-purple-dark/10 mb-16">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <div className="bg-white/25 dark:bg-slate-900/30 rounded-xl border border-slate-200 dark:border-slate-700/30 shadow-sm p-4 sm:p-6">
            <h3 className="text-sm sm:text-base font-semibold mb-2 text-slate-800 dark:text-vynal-text-primary">Sécurité et confidentialité garanties</h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-vynal-text-secondary">
              Sur Vynal Platform, vos échanges et paiements sont sécurisés. Nous garantissons la confidentialité de vos transactions.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-10 md:py-14">
        <div className="max-w-4xl mx-auto text-center px-4">
          <div className="bg-gradient-to-r from-vynal-accent-primary to-vynal-accent-secondary p-4 sm:p-6 md:p-8 rounded-xl shadow-lg">
            <h3 className="text-sm sm:text-base md:text-lg font-bold text-white mb-4">Proposez gratuitement vos talents à de nouveaux clients !</h3>
            <ul className="text-left max-w-md mx-auto mb-6">
              {[
                "Inscription gratuite en moins de 5 minutes",
                "Aucun frais caché ni abonnement",
                "Première commande possible sous 48h",
                "Paiements garantis et sécurisés"
              ].map((item, i) => (
                <li key={i} className="flex items-center mb-2 sm:mb-3 text-white text-xs sm:text-sm">
                  <CheckCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <Button asChild size="lg" className="bg-white text-vynal-accent-primary hover:bg-slate-100 hover:text-vynal-accent-secondary text-xs sm:text-sm">
              <Link href={`${AUTH_ROUTES.REGISTER}?role=freelance`}>
                Je suis partant
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </PageLayout>
  );
}