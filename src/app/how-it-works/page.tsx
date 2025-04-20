import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
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
  CheckCircle2
} from "lucide-react";

export const metadata: Metadata = {
  title: "Comment ça marche | Vynal Platform",
  description: "Découvrez comment fonctionne Vynal Platform, la plateforme de mise en relation entre freelances et clients au Sénégal",
};

export default function HowItWorksPage() {
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
            Comment ça marche
          </h1>
          <p className="mt-4 text-lg text-vynal-text-secondary max-w-3xl mx-auto">
            Vynal Platform simplifie la collaboration entre freelances et clients grâce à un processus transparent et sécurisé.
          </p>
        </div>

        {/* Pour les clients */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <div className="inline-block px-4 py-2 rounded-full bg-vynal-accent-primary/10 text-vynal-accent-primary font-medium text-sm mb-4">
              Pour les clients
            </div>
            <h2 className="text-3xl font-bold text-vynal-text-primary">
              Comment trouver et engager un freelance
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Étape 1 */}
            <div className="relative">
              <div className="absolute -top-4 -left-4 w-12 h-12 rounded-full bg-vynal-accent-primary flex items-center justify-center text-vynal-purple-dark font-bold text-xl">
                1
              </div>
              <Card className="bg-vynal-purple-dark/90 border-vynal-purple-secondary/30 rounded-xl shadow-lg shadow-vynal-accent-secondary/20 backdrop-blur-sm h-full">
                <CardContent className="p-6 pt-10">
                  <div className="w-16 h-16 mb-6 mx-auto flex items-center justify-center bg-vynal-purple-secondary/20 rounded-full border border-vynal-purple-secondary/30">
                    <Search className="h-8 w-8 text-vynal-accent-primary" />
                  </div>
                  <h3 className="text-xl font-semibold text-vynal-text-primary mb-4 text-center">Parcourez les services</h3>
                  <p className="text-vynal-text-secondary">
                    Explorez notre catalogue de services proposés par des freelances talentueux, filtrez par catégorie, budget et notation pour trouver le prestataire idéal pour votre projet.
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Étape 2 */}
            <div className="relative">
              <div className="absolute -top-4 -left-4 w-12 h-12 rounded-full bg-vynal-accent-primary flex items-center justify-center text-vynal-purple-dark font-bold text-xl">
                2
              </div>
              <Card className="bg-vynal-purple-dark/90 border-vynal-purple-secondary/30 rounded-xl shadow-lg shadow-vynal-accent-secondary/20 backdrop-blur-sm h-full">
                <CardContent className="p-6 pt-10">
                  <div className="w-16 h-16 mb-6 mx-auto flex items-center justify-center bg-vynal-purple-secondary/20 rounded-full border border-vynal-purple-secondary/30">
                    <MessageSquare className="h-8 w-8 text-vynal-accent-primary" />
                  </div>
                  <h3 className="text-xl font-semibold text-vynal-text-primary mb-4 text-center">Discutez et commandez</h3>
                  <p className="text-vynal-text-secondary">
                    Contactez le freelance pour discuter des détails de votre projet, définir le cahier des charges et passez commande directement sur la plateforme via notre système sécurisé.
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Étape 3 */}
            <div className="relative">
              <div className="absolute -top-4 -left-4 w-12 h-12 rounded-full bg-vynal-accent-primary flex items-center justify-center text-vynal-purple-dark font-bold text-xl">
                3
              </div>
              <Card className="bg-vynal-purple-dark/90 border-vynal-purple-secondary/30 rounded-xl shadow-lg shadow-vynal-accent-secondary/20 backdrop-blur-sm h-full">
                <CardContent className="p-6 pt-10">
                  <div className="w-16 h-16 mb-6 mx-auto flex items-center justify-center bg-vynal-purple-secondary/20 rounded-full border border-vynal-purple-secondary/30">
                    <CheckCircle className="h-8 w-8 text-vynal-accent-primary" />
                  </div>
                  <h3 className="text-xl font-semibold text-vynal-text-primary mb-4 text-center">Validez le travail</h3>
                  <p className="text-vynal-text-secondary">
                    Recevez le travail finalisé, demandez des révisions si nécessaire et validez la livraison une fois satisfait. Le paiement est libéré uniquement après votre approbation.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="mt-10 text-center">
            <Button className="bg-vynal-accent-primary hover:bg-vynal-accent-secondary text-vynal-purple-dark px-6 py-3">
              S'inscrire comme client
            </Button>
          </div>
        </div>

        {/* Pour les freelances */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <div className="inline-block px-4 py-2 rounded-full bg-vynal-accent-primary/10 text-vynal-accent-primary font-medium text-sm mb-4">
              Pour les freelances
            </div>
            <h2 className="text-3xl font-bold text-vynal-text-primary">
              Comment proposer vos services et gagner de l'argent
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Étape 1 */}
            <div className="relative">
              <div className="absolute -top-4 -left-4 w-12 h-12 rounded-full bg-vynal-accent-primary flex items-center justify-center text-vynal-purple-dark font-bold text-xl">
                1
              </div>
              <Card className="bg-vynal-purple-dark/90 border-vynal-purple-secondary/30 rounded-xl shadow-lg shadow-vynal-accent-secondary/20 backdrop-blur-sm h-full">
                <CardContent className="p-6 pt-10">
                  <div className="w-16 h-16 mb-6 mx-auto flex items-center justify-center bg-vynal-purple-secondary/20 rounded-full border border-vynal-purple-secondary/30">
                    <Users className="h-8 w-8 text-vynal-accent-primary" />
                  </div>
                  <h3 className="text-xl font-semibold text-vynal-text-primary mb-4 text-center">Créez votre profil</h3>
                  <p className="text-vynal-text-secondary">
                    Inscrivez-vous en tant que freelance, créez un profil professionnel mettant en valeur vos compétences, expériences et portfolio pour attirer l'attention des clients potentiels.
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Étape 2 */}
            <div className="relative">
              <div className="absolute -top-4 -left-4 w-12 h-12 rounded-full bg-vynal-accent-primary flex items-center justify-center text-vynal-purple-dark font-bold text-xl">
                2
              </div>
              <Card className="bg-vynal-purple-dark/90 border-vynal-purple-secondary/30 rounded-xl shadow-lg shadow-vynal-accent-secondary/20 backdrop-blur-sm h-full">
                <CardContent className="p-6 pt-10">
                  <div className="w-16 h-16 mb-6 mx-auto flex items-center justify-center bg-vynal-purple-secondary/20 rounded-full border border-vynal-purple-secondary/30">
                    <Star className="h-8 w-8 text-vynal-accent-primary" />
                  </div>
                  <h3 className="text-xl font-semibold text-vynal-text-primary mb-4 text-center">Proposez vos services</h3>
                  <p className="text-vynal-text-secondary">
                    Créez des offres de services détaillées en précisant vos tarifs, délais et ce que vous proposez. Plus vos descriptions sont précises, plus vous attirerez des clients qualifiés.
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Étape 3 */}
            <div className="relative">
              <div className="absolute -top-4 -left-4 w-12 h-12 rounded-full bg-vynal-accent-primary flex items-center justify-center text-vynal-purple-dark font-bold text-xl">
                3
              </div>
              <Card className="bg-vynal-purple-dark/90 border-vynal-purple-secondary/30 rounded-xl shadow-lg shadow-vynal-accent-secondary/20 backdrop-blur-sm h-full">
                <CardContent className="p-6 pt-10">
                  <div className="w-16 h-16 mb-6 mx-auto flex items-center justify-center bg-vynal-purple-secondary/20 rounded-full border border-vynal-purple-secondary/30">
                    <CreditCard className="h-8 w-8 text-vynal-accent-primary" />
                  </div>
                  <h3 className="text-xl font-semibold text-vynal-text-primary mb-4 text-center">Recevez vos paiements</h3>
                  <p className="text-vynal-text-secondary">
                    Livrez un travail de qualité, recevez vos paiements de manière sécurisée sur votre portefeuille Vynal et retirez vos fonds via nos méthodes de paiement locales adaptées au Sénégal.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="mt-10 text-center">
            <Button className="bg-vynal-accent-primary hover:bg-vynal-accent-secondary text-vynal-purple-dark px-6 py-3">
              S'inscrire comme freelance
            </Button>
          </div>
        </div>

        {/* Système de paiement */}
        <div className="mb-20">
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-r from-vynal-accent-primary/20 to-vynal-accent-secondary/20 rounded-2xl blur-xl opacity-70"></div>
            <Card className="bg-vynal-purple-dark/90 border-vynal-purple-secondary/30 rounded-xl overflow-hidden shadow-lg shadow-vynal-accent-secondary/20 backdrop-blur-sm relative">
              <CardContent className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                  <div>
                    <h2 className="text-3xl font-bold text-vynal-text-primary mb-6">
                      Un système de paiement sécurisé
                    </h2>
                    <p className="text-vynal-text-secondary mb-6">
                      Nous utilisons un système d'escrow (séquestre) pour protéger à la fois les clients et les freelances. Le client paie à l'avance, mais les fonds ne sont libérés au freelance qu'après validation du travail.
                    </p>
                    
                    <ul className="space-y-3">
                      <li className="flex items-start gap-3">
                        <CheckCircle2 className="h-6 w-6 text-vynal-accent-primary flex-shrink-0 mt-0.5" />
                        <span className="text-vynal-text-secondary">Paiements sécurisés via notre système de portefeuille intégré</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle2 className="h-6 w-6 text-vynal-accent-primary flex-shrink-0 mt-0.5" />
                        <span className="text-vynal-text-secondary">Protection contre la fraude et les litiges</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle2 className="h-6 w-6 text-vynal-accent-primary flex-shrink-0 mt-0.5" />
                        <span className="text-vynal-text-secondary">Méthodes de paiement locales adaptées au contexte africain</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle2 className="h-6 w-6 text-vynal-accent-primary flex-shrink-0 mt-0.5" />
                        <span className="text-vynal-text-secondary">Transactions transparentes avec historique complet</span>
                      </li>
                    </ul>
                  </div>
                  
                  <div className="relative h-96 rounded-xl overflow-hidden">
                    <Image
                      src="/assets/images/payment-system.jpg"
                      alt="Système de paiement sécurisé"
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Avantages */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-center mb-12 text-vynal-text-primary">
            Les avantages de Vynal Platform
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Avantage 1 */}
            <Card className="bg-vynal-purple-dark/90 border-vynal-purple-secondary/30 rounded-xl shadow-lg shadow-vynal-accent-secondary/20 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center bg-vynal-purple-secondary/20 rounded-full border border-vynal-purple-secondary/30">
                    <ShieldCheck className="h-6 w-6 text-vynal-accent-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-vynal-text-primary mb-2">Sécurité et confiance</h3>
                    <p className="text-vynal-text-secondary">
                      Tous les freelances sont vérifiés et les transactions sont sécurisées. Notre système de notation et d'avis garantit la transparence et la qualité des services.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Avantage 2 */}
            <Card className="bg-vynal-purple-dark/90 border-vynal-purple-secondary/30 rounded-xl shadow-lg shadow-vynal-accent-secondary/20 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center bg-vynal-purple-secondary/20 rounded-full border border-vynal-purple-secondary/30">
                    <Clock className="h-6 w-6 text-vynal-accent-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-vynal-text-primary mb-2">Gain de temps et d'efficacité</h3>
                    <p className="text-vynal-text-secondary">
                      Notre plateforme centralise tout le processus, de la recherche de talents à la facturation, vous permettant de vous concentrer sur ce qui compte vraiment : votre projet.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Avantage 3 */}
            <Card className="bg-vynal-purple-dark/90 border-vynal-purple-secondary/30 rounded-xl shadow-lg shadow-vynal-accent-secondary/20 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center bg-vynal-purple-secondary/20 rounded-full border border-vynal-purple-secondary/30">
                    <MessageSquare className="h-6 w-6 text-vynal-accent-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-vynal-text-primary mb-2">Communication fluide</h3>
                    <p className="text-vynal-text-secondary">
                      Notre système de messagerie intégré facilite les échanges entre clients et freelances, tout en gardant une trace de toutes les conversations pour référence future.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Avantage 4 */}
            <Card className="bg-vynal-purple-dark/90 border-vynal-purple-secondary/30 rounded-xl shadow-lg shadow-vynal-accent-secondary/20 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center bg-vynal-purple-secondary/20 rounded-full border border-vynal-purple-secondary/30">
                    <Users className="h-6 w-6 text-vynal-accent-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-vynal-text-primary mb-2">Communauté locale</h3>
                    <p className="text-vynal-text-secondary">
                      Vynal Platform met en avant les talents africains et favorise l'économie locale, tout en permettant une visibilité internationale pour les freelances.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Questions fréquentes */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-center mb-12 text-vynal-text-primary">
            Questions fréquentes
          </h2>
          
          <div className="max-w-3xl mx-auto space-y-6">
            <Card className="bg-vynal-purple-dark/90 border-vynal-purple-secondary/30 rounded-xl shadow-lg shadow-vynal-accent-secondary/20 backdrop-blur-sm">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold text-vynal-text-primary mb-2">Comment sont gérés les paiements ?</h3>
                <p className="text-vynal-text-secondary">
                  Vynal utilise un système de paiement sécurisé où les fonds sont conservés en séquestre jusqu'à la validation du travail. Les freelances peuvent ensuite retirer leurs gains vers leur compte bancaire ou via des services comme Orange Money ou Wave.
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-vynal-purple-dark/90 border-vynal-purple-secondary/30 rounded-xl shadow-lg shadow-vynal-accent-secondary/20 backdrop-blur-sm">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold text-vynal-text-primary mb-2">Que faire en cas de litige ?</h3>
                <p className="text-vynal-text-secondary">
                  En cas de désaccord, notre équipe de médiation intervient pour trouver une solution équitable. Notre processus de résolution des litiges en plusieurs étapes permet de résoudre la plupart des problèmes rapidement et efficacement.
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-vynal-purple-dark/90 border-vynal-purple-secondary/30 rounded-xl shadow-lg shadow-vynal-accent-secondary/20 backdrop-blur-sm">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold text-vynal-text-primary mb-2">Quelles sont les commissions prélevées ?</h3>
                <p className="text-vynal-text-secondary">
                  Vynal prélève une commission de 10% sur les transactions. Cette commission nous permet de maintenir et d'améliorer la plateforme, d'assurer la sécurité des paiements et de fournir un support client de qualité.
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-vynal-purple-dark/90 border-vynal-purple-secondary/30 rounded-xl shadow-lg shadow-vynal-accent-secondary/20 backdrop-blur-sm">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold text-vynal-text-primary mb-2">Comment s'assurer de la qualité d'un freelance ?</h3>
                <p className="text-vynal-text-secondary">
                  Consultez les évaluations et avis laissés par d'autres clients, examinez le portfolio du freelance et n'hésitez pas à lui poser des questions précises sur son expérience avant de passer commande. Vous pouvez également demander un échantillon de travail.
                </p>
              </CardContent>
            </Card>
            
            <div className="text-center mt-10">
              <Link href="/faq">
                <Button variant="outline" className="border-vynal-purple-secondary/50 text-vynal-text-primary hover:bg-vynal-purple-secondary/20">
                  Voir toutes les questions fréquentes <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-vynal-text-primary mb-6">
            Prêt à commencer ?
          </h2>
          <p className="text-lg text-vynal-text-secondary max-w-2xl mx-auto mb-8">
            Rejoignez Vynal Platform dès aujourd'hui et découvrez une nouvelle façon de collaborer.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button className="bg-vynal-accent-primary hover:bg-vynal-accent-secondary text-vynal-purple-dark px-8 py-6 text-lg">
              S'inscrire gratuitement
            </Button>
            <Button className="bg-transparent hover:bg-vynal-purple-secondary/20 text-vynal-text-primary border border-vynal-purple-secondary/50 px-8 py-6 text-lg">
              Explorer les services
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 