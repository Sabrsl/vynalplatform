"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, CheckCircle2, Download, ExternalLink, Star, Info } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import FreelancePricingCalculator from "@/components/calculators/FreelancePricingCalculator";

export default function FreelanceGuidePage() {
  return (
    <div className="min-h-screen bg-vynal-purple-dark">
      {/* En-tête décoratif */}
      <div className="absolute top-0 left-0 right-0 h-60 md:h-72 bg-gradient-to-b from-vynal-purple-dark to-vynal-purple-darkest -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/img/grid-pattern.svg')] bg-center opacity-10"></div>
        <div className="absolute -top-20 -right-20 w-60 md:w-96 h-60 md:h-96 bg-vynal-accent-secondary/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-20 -left-20 w-60 md:w-96 h-60 md:h-96 bg-vynal-accent-primary/20 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-4 py-8 md:py-12 relative">
        {/* Bouton Retour */}
        <div className="mb-6">
          <Link href="/resources">
            <Button variant="ghost" className="text-vynal-text-secondary hover:text-vynal-accent-primary p-0">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour aux ressources
            </Button>
          </Link>
        </div>

        {/* Hero Section */}
        <div className="mb-12 md:mb-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-vynal-text-primary mb-4 leading-tight">
                Guide complet pour démarrer en tant que <span className="bg-clip-text text-transparent bg-gradient-to-r from-vynal-accent-primary to-vynal-accent-secondary">freelance</span>
              </h1>
              <p className="text-lg text-vynal-text-secondary mb-6">
                Tout ce que vous devez savoir pour lancer votre carrière de freelance avec succès sur Vynal Platform, des stratégies éprouvées aux astuces pratiques.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button className="bg-vynal-accent-primary hover:bg-vynal-accent-secondary text-vynal-purple-dark">
                  <Download className="mr-2 h-4 w-4" /> Télécharger ce guide (PDF)
                </Button>
                <Button variant="outline" className="border-vynal-purple-secondary/50 text-vynal-text-primary hover:bg-vynal-purple-secondary/20">
                  <Link href="/dashboard/services/new">Créer mon premier service</Link>
                </Button>
              </div>
            </div>
            <div className="hidden md:block relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-vynal-accent-primary/20 to-vynal-accent-secondary/20 rounded-xl -z-10"></div>
              <Image
                src="/img/resources/freelance-success.jpg"
                alt="Devenir freelance avec succès"
                width={600}
                height={400}
                className="rounded-xl shadow-lg shadow-vynal-purple-darkest/30 w-full h-auto"
                priority
              />
            </div>
          </div>
        </div>

        {/* Introduction */}
        <div className="mb-16">
          <h2 className="text-2xl md:text-3xl font-bold text-vynal-text-primary mb-6">Pourquoi devenir freelance sur Vynal Platform?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-vynal-purple-secondary/10 border-vynal-purple-secondary/20 rounded-xl overflow-hidden h-full">
              <CardContent className="p-6">
                <div className="h-12 w-12 rounded-lg bg-gradient-to-r from-vynal-accent-primary to-vynal-accent-secondary flex items-center justify-center mb-4">
                  <CheckCircle2 className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-vynal-text-primary mb-2">Flexibilité maximale</h3>
                <p className="text-vynal-text-secondary">Travaillez quand et où vous le souhaitez, selon vos conditions et vos tarifs. Prenez le contrôle total de votre emploi du temps.</p>
              </CardContent>
            </Card>
            <Card className="bg-vynal-purple-secondary/10 border-vynal-purple-secondary/20 rounded-xl overflow-hidden h-full">
              <CardContent className="p-6">
                <div className="h-12 w-12 rounded-lg bg-gradient-to-r from-vynal-accent-primary to-vynal-accent-secondary flex items-center justify-center mb-4">
                  <CheckCircle2 className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-vynal-text-primary mb-2">Marché en pleine expansion</h3>
                <p className="text-vynal-text-secondary">Profitez d'un marché en croissance constante avec une demande forte pour les services numériques, particulièrement en Afrique et dans la diaspora.</p>
              </CardContent>
            </Card>
            <Card className="bg-vynal-purple-secondary/10 border-vynal-purple-secondary/20 rounded-xl overflow-hidden h-full">
              <CardContent className="p-6">
                <div className="h-12 w-12 rounded-lg bg-gradient-to-r from-vynal-accent-primary to-vynal-accent-secondary flex items-center justify-center mb-4">
                  <CheckCircle2 className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-vynal-text-primary mb-2">Système sécurisé</h3>
                <p className="text-vynal-text-secondary">Travaillez l'esprit tranquille grâce à notre système de paiement sécurisé et notre médiation en cas de litige avec un client.</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Table des matières */}
        <div className="mb-12 p-6 bg-vynal-purple-secondary/10 rounded-xl border border-vynal-purple-secondary/20">
          <h2 className="text-xl font-bold text-vynal-text-primary mb-4">Dans ce guide, vous découvrirez</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex items-start gap-2">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-vynal-accent-primary/20 flex items-center justify-center text-vynal-accent-primary text-sm font-medium">1</div>
              <p className="text-vynal-text-secondary">Comment définir votre offre et votre expertise</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-vynal-accent-primary/20 flex items-center justify-center text-vynal-accent-primary text-sm font-medium">2</div>
              <p className="text-vynal-text-secondary">Les secrets d'un profil convaincant</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-vynal-accent-primary/20 flex items-center justify-center text-vynal-accent-primary text-sm font-medium">3</div>
              <p className="text-vynal-text-secondary">Comment établir des tarifs compétitifs</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-vynal-accent-primary/20 flex items-center justify-center text-vynal-accent-primary text-sm font-medium">4</div>
              <p className="text-vynal-text-secondary">Les clés d'un portfolio attractif</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-vynal-accent-primary/20 flex items-center justify-center text-vynal-accent-primary text-sm font-medium">5</div>
              <p className="text-vynal-text-secondary">Techniques pour optimiser votre visibilité</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-vynal-accent-primary/20 flex items-center justify-center text-vynal-accent-primary text-sm font-medium">6</div>
              <p className="text-vynal-text-secondary">Stratégies de communication efficaces</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-vynal-accent-primary/20 flex items-center justify-center text-vynal-accent-primary text-sm font-medium">7</div>
              <p className="text-vynal-text-secondary">Comment livrer un travail de qualité</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-vynal-accent-primary/20 flex items-center justify-center text-vynal-accent-primary text-sm font-medium">8</div>
              <p className="text-vynal-text-secondary">Les meilleures pratiques pour fidéliser vos clients</p>
            </div>
            <div className="flex items-start gap-2 mt-2 col-span-1 md:col-span-2">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-vynal-accent-secondary/30 flex items-center justify-center text-vynal-accent-secondary text-sm font-medium">
                <span className="text-vynal-accent-secondary">★</span>
              </div>
              <p className="text-vynal-text-secondary">
                <a href="#calculateur" className="text-vynal-accent-secondary hover:underline">
                  Outil exclusif : Calculateur interactif de tarifs freelance
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Conseils pour réussir */}
        <div className="mb-16">
          <h2 className="text-2xl md:text-3xl font-bold text-vynal-text-primary mb-8" id="conseils">Stratégies essentielles pour réussir</h2>
          
          <div className="space-y-8">
            {/* Conseil 1 */}
            <div className="p-6 bg-vynal-purple-secondary/5 hover:bg-vynal-purple-secondary/10 rounded-xl border border-vynal-purple-secondary/20 transition-colors">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="md:w-1/3">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-vynal-accent-primary/20 flex items-center justify-center text-vynal-accent-primary font-bold">
                      1
                    </div>
                    <h3 className="text-xl font-bold text-vynal-text-primary">Définir votre offre et votre expertise</h3>
                  </div>
                </div>
                <div className="md:w-2/3">
                  <p className="text-vynal-text-secondary mb-4">
                    La clé du succès en freelance réside dans votre capacité à identifier vos compétences distinctives et à les transformer en services que les clients valorisent. Commencez par dresser la liste de toutes vos compétences, puis concentrez-vous sur celles que vous maîtrisez le mieux et qui sont demandées sur le marché.
                  </p>
                  <div className="mt-4 p-4 bg-vynal-accent-primary/10 rounded-lg">
                    <h4 className="text-lg font-semibold text-vynal-text-primary mb-2">Actions concrètes:</h4>
                    <ul className="list-disc list-inside space-y-2 text-vynal-text-secondary">
                      <li>Analysez les 5 services les plus demandés dans votre domaine sur Vynal Platform</li>
                      <li>Identifiez 2-3 compétences où vous excellez particulièrement</li>
                      <li>Trouvez un angle unique qui vous distingue des autres freelances</li>
                      <li>Rédigez une proposition de valeur claire en une phrase</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Conseil 2 */}
            <div className="p-6 bg-vynal-purple-secondary/5 hover:bg-vynal-purple-secondary/10 rounded-xl border border-vynal-purple-secondary/20 transition-colors">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="md:w-1/3">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-vynal-accent-primary/20 flex items-center justify-center text-vynal-accent-primary font-bold">
                      2
                    </div>
                    <h3 className="text-xl font-bold text-vynal-text-primary">Créer un profil qui convertit</h3>
                  </div>
                </div>
                <div className="md:w-2/3">
                  <p className="text-vynal-text-secondary mb-4">
                    Votre profil est votre vitrine personnelle. Il doit inspirer confiance dès le premier coup d'œil et convaincre les clients potentiels que vous êtes la personne idéale pour leur projet. Chaque élément de votre profil doit être soigneusement optimisé pour maximiser votre taux de conversion.
                  </p>
                  <div className="mt-4 p-4 bg-vynal-accent-primary/10 rounded-lg">
                    <h4 className="text-lg font-semibold text-vynal-text-primary mb-2">Les éléments d'un profil parfait:</h4>
                    <ul className="list-disc list-inside space-y-2 text-vynal-text-secondary">
                      <li>Photo professionnelle de haute qualité (augmente les chances de 35%)</li>
                      <li>Titre accrocheur qui inclut votre spécialité et votre proposition de valeur</li>
                      <li>Bio concise qui met en avant vos réalisations et votre expérience</li>
                      <li>Sélection pertinente de compétences avec niveau d'expertise</li>
                      <li>Portfolio soigneusement sélectionné montrant vos meilleurs travaux</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Conseil 3 */}
            <div className="p-6 bg-vynal-purple-secondary/5 hover:bg-vynal-purple-secondary/10 rounded-xl border border-vynal-purple-secondary/20 transition-colors">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="md:w-1/3">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-vynal-accent-primary/20 flex items-center justify-center text-vynal-accent-primary font-bold">
                      3
                    </div>
                    <h3 className="text-xl font-bold text-vynal-text-primary">Établir une stratégie de tarification</h3>
                  </div>
                </div>
                <div className="md:w-2/3">
                  <p className="text-vynal-text-secondary mb-4">
                    La tarification est un art qui combine connaissance du marché, valorisation de vos compétences et psychologie. Des prix trop bas dévaluent votre travail, tandis que des tarifs trop élevés peuvent vous exclure du marché. L'objectif est de trouver le juste équilibre qui reflète votre valeur.
                  </p>
                  <div className="mt-4 p-4 bg-vynal-accent-primary/10 rounded-lg">
                    <h4 className="text-lg font-semibold text-vynal-text-primary mb-2">Notre formule pour des tarifs optimaux:</h4>
                    <p className="text-vynal-text-secondary mb-3">
                      Tarif horaire = (Dépenses mensuelles × 2) ÷ (Heures travaillées par mois × 0.7)
                    </p>
                    <p className="text-vynal-text-secondary">
                      Cette formule prend en compte vos besoins financiers, avec une marge pour l'épargne et les imprévus, tout en tenant compte du fait que vous ne facturerez pas 100% de votre temps (recherche de clients, administration, etc.).
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Conseil 4 */}
            <div className="p-6 bg-vynal-purple-secondary/5 hover:bg-vynal-purple-secondary/10 rounded-xl border border-vynal-purple-secondary/20 transition-colors">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="md:w-1/3">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-vynal-accent-primary/20 flex items-center justify-center text-vynal-accent-primary font-bold">
                      4
                    </div>
                    <h3 className="text-xl font-bold text-vynal-text-primary">Optimiser votre visibilité</h3>
                  </div>
                </div>
                <div className="md:w-2/3">
                  <p className="text-vynal-text-secondary mb-4">
                    Sur Vynal Platform, être visible dans les résultats de recherche est crucial pour attirer des clients. L'algorithme prend en compte plusieurs facteurs pour déterminer votre positionnement, et comprendre ces mécanismes vous donne un avantage considérable.
                  </p>
                  <div className="mt-4 p-4 bg-vynal-accent-primary/10 rounded-lg">
                    <h4 className="text-lg font-semibold text-vynal-text-primary mb-2">Techniques d'optimisation:</h4>
                    <ul className="list-disc list-inside space-y-2 text-vynal-text-secondary">
                      <li>Utilisez des mots-clés pertinents dans votre titre et votre description</li>
                      <li>Maintenez un taux de réponse rapide aux messages (idéalement moins de 2 heures)</li>
                      <li>Publiez régulièrement de nouveaux services pour apparaître dans les nouveautés</li>
                      <li>Sollicitez activement des avis après chaque projet réussi</li>
                      <li>Participez aux événements et aux forums de la communauté</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Conseil 5 */}
            <div className="p-6 bg-vynal-purple-secondary/5 hover:bg-vynal-purple-secondary/10 rounded-xl border border-vynal-purple-secondary/20 transition-colors">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="md:w-1/3">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-vynal-accent-primary/20 flex items-center justify-center text-vynal-accent-primary font-bold">
                      5
                    </div>
                    <h3 className="text-xl font-bold text-vynal-text-primary">Les clés d'un portfolio attractif</h3>
                  </div>
                </div>
                <div className="md:w-2/3">
                  <p className="text-vynal-text-secondary mb-4">
                    Votre portfolio est la vitrine de votre talent et de votre expertise. Il doit illustrer efficacement ce que vous pouvez apporter à vos clients potentiels en présentant vos meilleurs travaux de manière professionnelle et attrayante.
                  </p>
                  <div className="mt-4 p-4 bg-vynal-accent-primary/10 rounded-lg">
                    <h4 className="text-lg font-semibold text-vynal-text-primary mb-2">Éléments d'un portfolio convaincant:</h4>
                    <ul className="list-disc list-inside space-y-2 text-vynal-text-secondary">
                      <li>Sélectionnez uniquement vos 5-7 meilleurs projets (la qualité prime sur la quantité)</li>
                      <li>Pour chaque projet, incluez un titre accrocheur, une description claire du défi, votre approche et les résultats obtenus</li>
                      <li>Utilisez des visuels de haute qualité qui mettent en valeur votre travail</li>
                      <li>Organisez vos projets par catégorie pour faciliter la navigation</li>
                      <li>Incluez des témoignages clients spécifiques à chaque projet si possible</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Conseil 6 */}
            <div className="p-6 bg-vynal-purple-secondary/5 hover:bg-vynal-purple-secondary/10 rounded-xl border border-vynal-purple-secondary/20 transition-colors">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="md:w-1/3">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-vynal-accent-primary/20 flex items-center justify-center text-vynal-accent-primary font-bold">
                      6
                    </div>
                    <h3 className="text-xl font-bold text-vynal-text-primary">Stratégies de communication efficaces</h3>
                  </div>
                </div>
                <div className="md:w-2/3">
                  <p className="text-vynal-text-secondary mb-4">
                    La communication est un pilier fondamental de la réussite en freelance. Savoir communiquer efficacement avec vos clients vous aide à établir des relations solides, à éviter les malentendus et à garantir la satisfaction à long terme.
                  </p>
                  <div className="mt-4 p-4 bg-vynal-accent-primary/10 rounded-lg">
                    <h4 className="text-lg font-semibold text-vynal-text-primary mb-2">Principes de communication efficace:</h4>
                    <ul className="list-disc list-inside space-y-2 text-vynal-text-secondary">
                      <li>Répondez rapidement aux messages (idéalement dans les 2 heures pendant les heures de travail)</li>
                      <li>Établissez clairement les attentes dès le début du projet (délais, livrables, nombre de révisions, etc.)</li>
                      <li>Documentez toutes les décisions importantes par écrit pour éviter les confusions</li>
                      <li>Fournissez des mises à jour régulières sur l'avancement du projet</li>
                      <li>Utilisez un ton professionnel, amical et adapté à votre client</li>
                      <li>En cas de problème ou de retard, communiquez-le immédiatement avec une solution proposée</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Conseil 7 */}
            <div className="p-6 bg-vynal-purple-secondary/5 hover:bg-vynal-purple-secondary/10 rounded-xl border border-vynal-purple-secondary/20 transition-colors">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="md:w-1/3">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-vynal-accent-primary/20 flex items-center justify-center text-vynal-accent-primary font-bold">
                      7
                    </div>
                    <h3 className="text-xl font-bold text-vynal-text-primary">Comment livrer un travail de qualité</h3>
                  </div>
                </div>
                <div className="md:w-2/3">
                  <p className="text-vynal-text-secondary mb-4">
                    La qualité de votre travail est ce qui vous distinguera véritablement sur le long terme. Elle détermine non seulement la satisfaction de vos clients actuels, mais aussi la probabilité qu'ils vous recommandent et reviennent vers vous pour de futurs projets.
                  </p>
                  <div className="mt-4 p-4 bg-vynal-accent-primary/10 rounded-lg">
                    <h4 className="text-lg font-semibold text-vynal-text-primary mb-2">Méthode pour garantir l'excellence:</h4>
                    <ul className="list-disc list-inside space-y-2 text-vynal-text-secondary">
                      <li>Établissez un processus de travail structuré avec des étapes claires</li>
                      <li>Intégrez des points de contrôle qualité à chaque étape clé du projet</li>
                      <li>Prévoyez toujours un temps de révision finale avant la livraison</li>
                      <li>Utilisez une checklist de qualité personnalisée pour votre domaine d'expertise</li>
                      <li>Sollicitez des retours intermédiaires du client pour vous assurer que vous êtes sur la bonne voie</li>
                      <li>Accompagnez chaque livraison d'un document explicatif pour faciliter la compréhension</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Conseil 8 */}
            <div className="p-6 bg-vynal-purple-secondary/5 hover:bg-vynal-purple-secondary/10 rounded-xl border border-vynal-purple-secondary/20 transition-colors">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="md:w-1/3">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-vynal-accent-primary/20 flex items-center justify-center text-vynal-accent-primary font-bold">
                      8
                    </div>
                    <h3 className="text-xl font-bold text-vynal-text-primary">Les meilleures pratiques pour fidéliser vos clients</h3>
                  </div>
                </div>
                <div className="md:w-2/3">
                  <p className="text-vynal-text-secondary mb-4">
                    Fidéliser vos clients est bien plus rentable que d'en acquérir de nouveaux. Un client satisfait qui revient régulièrement représente une source de revenus stable et prévisible, tout en réduisant votre effort de prospection.
                  </p>
                  <div className="mt-4 p-4 bg-vynal-accent-primary/10 rounded-lg">
                    <h4 className="text-lg font-semibold text-vynal-text-primary mb-2">Stratégies de fidélisation éprouvées:</h4>
                    <ul className="list-disc list-inside space-y-2 text-vynal-text-secondary">
                      <li>Dépassez systématiquement les attentes de vos clients (livrez plus que promis)</li>
                      <li>Proposez des offres de suivi ou de maintenance après la fin du projet principal</li>
                      <li>Mettez en place un programme de remise pour les clients fidèles (5-10% sur leur prochain achat)</li>
                      <li>Restez en contact régulièrement même après la fin du projet (newsletter, messages personnalisés)</li>
                      <li>Sollicitez des avis et des témoignages après chaque collaboration réussie</li>
                      <li>Anticipez les besoins futurs de vos clients et proposez-leur des solutions proactives</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Calculateur de tarifs */}
        <div id="calculateur" className="mb-16">
          <h2 className="text-2xl md:text-3xl font-bold text-vynal-text-primary mb-8">
            Calculateur de tarifs freelance
          </h2>
          <p className="text-vynal-text-secondary mb-6">
            Utilisez notre outil interactif pour déterminer vos tarifs optimaux en fonction de votre expérience, votre secteur d'activité et votre localisation. Cette estimation vous aidera à vous positionner correctement sur le marché.
          </p>
          
          <FreelancePricingCalculator defaultCurrency="XOF" />
          
          <div className="mt-8 p-4 bg-vynal-purple-secondary/10 rounded-lg border border-vynal-purple-secondary/20 text-vynal-text-secondary">
            <p className="flex items-start gap-2">
              <Info className="h-5 w-5 text-vynal-accent-primary flex-shrink-0 mt-0.5" />
              N'hésitez pas à ajuster vos tarifs en fonction de la complexité des projets. Pour les missions très spécifiques ou urgentes, vous pouvez appliquer une majoration jusqu'à 50%.
            </p>
          </div>
        </div>

        {/* CTA - Appel à l'action */}
        <div className="mb-16">
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-r from-vynal-accent-primary/20 to-vynal-accent-secondary/20 rounded-2xl blur-xl opacity-70"></div>
            <Card className="bg-vynal-purple-dark/90 border-vynal-purple-secondary/30 rounded-xl overflow-hidden shadow-lg shadow-vynal-accent-secondary/20 backdrop-blur-sm relative">
              <CardContent className="p-8 md:p-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                  <div>
                    <h2 className="text-2xl md:text-3xl font-bold text-vynal-text-primary mb-4">
                      Prêt à lancer votre carrière de freelance?
                    </h2>
                    <p className="text-vynal-text-secondary mb-6">
                      Inscrivez-vous dès maintenant et publiez votre premier service sur Vynal Platform. Notre communauté de clients vous attend!
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4">
                      <Button className="bg-vynal-accent-primary hover:bg-vynal-accent-secondary text-vynal-purple-dark">
                        <Link href="/auth/signup">Créer un compte gratuit</Link>
                      </Button>
                      <Button variant="outline" className="border-vynal-purple-secondary/50 text-vynal-text-primary hover:bg-vynal-purple-secondary/20">
                        <Link href="/dashboard/services/new">Publier mon premier service</Link>
                      </Button>
                    </div>
                  </div>
                  <div className="hidden md:flex justify-end">
                    <Image
                      src="/img/resources/freelance-start.jpg"
                      alt="Démarrez votre carrière freelance"
                      width={300}
                      height={300}
                      className="rounded-xl shadow-lg shadow-vynal-purple-darkest/30"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Retour aux ressources */}
        <div className="text-center">
          <Link href="/resources">
            <Button variant="outline" className="border-vynal-purple-secondary/50 text-vynal-text-primary hover:bg-vynal-purple-secondary/20">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour au centre de ressources
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
