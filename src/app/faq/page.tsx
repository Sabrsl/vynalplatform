"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, Search } from "lucide-react";
import { FAQAccordion, type FAQItem } from "@/components/faq/faq-accordion";

// Les données FAQ pour chaque section
const accountItems: FAQItem[] = [
  {
    question: "Comment créer un compte sur Vynal Platform ?",
    answer: "Pour créer un compte, cliquez sur le bouton 'Inscription' en haut à droite de la page d'accueil. Vous pourrez choisir de vous inscrire en tant que client ou freelance. Remplissez le formulaire avec vos informations personnelles, validez votre adresse email via le lien envoyé, puis complétez votre profil."
  },
  {
    question: "Puis-je avoir à la fois un compte client et un compte freelance ?",
    answer: "Oui, vous pouvez utiliser le même compte pour les deux rôles. Une fois connecté, vous pouvez basculer entre les profils client et freelance depuis votre tableau de bord en cliquant sur l'option 'Changer de rôle'."
  },
  {
    question: "Comment modifier mes informations personnelles ?",
    answer: "Connectez-vous à votre compte, accédez à votre tableau de bord, puis cliquez sur 'Profil' ou 'Paramètres du compte'. Vous pourrez y modifier vos informations personnelles, votre photo de profil et vos préférences de notification."
  },
  {
    question: "Comment supprimer mon compte ?",
    answer: "Pour supprimer votre compte, accédez à 'Paramètres du compte' depuis votre tableau de bord, puis faites défiler jusqu'à la section 'Supprimer mon compte'. Notez que cette action est irréversible et que tous vos données seront supprimées, à l'exception des informations légalement requises."
  },
  {
    question: "J'ai oublié mon mot de passe, que faire ?",
    answer: "Sur la page de connexion, cliquez sur 'Mot de passe oublié ?'. Saisissez l'adresse email associée à votre compte et suivez les instructions reçues par email pour réinitialiser votre mot de passe."
  }
];

const paymentItems: FAQItem[] = [
  {
    question: "Quels modes de paiement sont acceptés sur Vynal Platform ?",
    answer: "Vynal Platform accepte les paiements par carte bancaire (Visa, Mastercard), Orange Money, Wave, ainsi que les virements bancaires pour certains services. Les options de paiement disponibles seront affichées lors de votre commande."
  },
  {
    question: "Comment fonctionnent les paiements sur Vynal Platform ?",
    answer: "Nous utilisons un système de paiement sécurisé avec dépôt en séquestre (escrow). Lorsque vous passez une commande, le montant est prélevé mais conservé en séquestre. Le paiement n'est libéré au freelance qu'après que vous ayez approuvé la livraison du travail."
  },
  {
    question: "Quelles sont les commissions prélevées ?",
    answer: "Vynal Platform prélève une commission de 10% sur chaque transaction. Cette commission est automatiquement calculée et indiquée clairement lors du paiement."
  },
  {
    question: "Comment obtenir une facture pour mes achats ?",
    answer: "Les factures sont automatiquement générées pour chaque transaction et accessibles depuis votre tableau de bord dans la section 'Historique des commandes' ou 'Factures'. Vous pouvez les télécharger au format PDF."
  },
  {
    question: "Comment les freelances reçoivent-ils leurs paiements ?",
    answer: "Les freelances peuvent retirer leurs gains depuis leur portefeuille Vynal vers leur compte bancaire, Orange Money, Wave ou autres moyens de paiement locaux. Les retraits sont traités dans un délai de 1 à 3 jours ouvrables."
  },
  {
    question: "Que se passe-t-il en cas de litige concernant un paiement ?",
    answer: "En cas de litige, notre équipe de médiation intervient pour trouver une solution équitable. Si aucun accord n'est trouvé, nous examinerons les éléments fournis par les deux parties avant de prendre une décision concernant le déblocage ou le remboursement des fonds."
  }
];

const orderItems: FAQItem[] = [
  {
    question: "Comment passer une commande auprès d'un freelance ?",
    answer: "Après avoir sélectionné un service, cliquez sur 'Commander'. Vous serez guidé à travers un processus en plusieurs étapes où vous préciserez vos besoins, les délais et les détails du projet. Une fois ces informations fournies et le paiement effectué, votre commande sera transmise au freelance."
  },
  {
    question: "Comment suivre l'avancement de ma commande ?",
    answer: "Accédez à votre tableau de bord, puis à la section 'Mes commandes'. Vous y trouverez toutes vos commandes en cours avec leur statut actuel (en attente, en cours, en révision, livrée, etc.) et pourrez communiquer directement avec le freelance."
  },
  {
    question: "Puis-je modifier ma commande après l'avoir passée ?",
    answer: "Des modifications mineures peuvent être demandées directement au freelance via la messagerie. Pour des changements importants affectant le périmètre du projet, il est recommandé de discuter avec le freelance qui pourra, selon le cas, accepter les modifications ou proposer un ajustement de prix."
  },
  {
    question: "Que faire si je ne suis pas satisfait du travail livré ?",
    answer: "Si le travail livré ne correspond pas à vos attentes, vous pouvez demander des révisions dans les limites prévues par l'offre du freelance. Si le problème persiste, contactez notre service client pour une médiation. Sous certaines conditions, un remboursement partiel ou total peut être envisagé."
  },
  {
    question: "Combien de révisions puis-je demander ?",
    answer: "Le nombre de révisions dépend de l'offre choisie et du freelance. Ce nombre est clairement indiqué dans la description du service. Des révisions supplémentaires peuvent être négociées directement avec le freelance, généralement moyennant un coût additionnel."
  },
  {
    question: "Comment annuler une commande ?",
    answer: "Pour annuler une commande, accédez à la page de détails de celle-ci et cliquez sur 'Annuler la commande'. Les conditions d'annulation et de remboursement varient selon l'état d'avancement du projet et sont détaillées dans nos conditions d'utilisation."
  }
];

const freelanceItems: FAQItem[] = [
  {
    question: "Comment devenir freelance sur Vynal Platform ?",
    answer: "Inscrivez-vous ou connectez-vous à votre compte, puis sélectionnez l'option 'Devenir freelance' dans votre tableau de bord. Complétez votre profil professionnel avec vos compétences, expériences et portfolio. Votre profil sera ensuite examiné par notre équipe avant d'être approuvé."
  },
  {
    question: "Comment créer une offre de service attractive ?",
    answer: "Une bonne offre de service doit être claire, précise et mettre en avant votre expertise. Incluez une description détaillée de ce que vous proposez, les délais, le nombre de révisions, et ajoutez des exemples de travaux antérieurs. Utilisez des mots-clés pertinents pour améliorer la visibilité de votre offre."
  },
  {
    question: "Comment fixer ses tarifs ?",
    answer: "Vos tarifs doivent refléter votre niveau d'expertise, la complexité des services proposés et le temps nécessaire à leur réalisation. Étudiez les prix pratiqués par d'autres freelances dans votre domaine et positionnez-vous en fonction de votre expérience et de la valeur ajoutée que vous apportez."
  },
  {
    question: "Comment recevoir ses paiements ?",
    answer: "Après validation du travail par le client, vos gains sont crédités sur votre portefeuille Vynal. Vous pouvez ensuite les retirer vers votre compte bancaire, Orange Money, Wave ou d'autres moyens de paiement locaux en accédant à la section 'Finances' de votre tableau de bord."
  },
  {
    question: "Comment augmenter sa visibilité sur la plateforme ?",
    answer: "Pour améliorer votre visibilité, complétez intégralement votre profil, ajoutez un portfolio de qualité, répondez rapidement aux demandes des clients, et collectez des avis positifs. Proposez des services dans des niches en demande et utilisez des mots-clés pertinents dans vos descriptions."
  },
  {
    question: "Que faire en cas de désaccord avec un client ?",
    answer: "En cas de désaccord, essayez d'abord de résoudre le problème directement avec le client via la messagerie. Si nécessaire, contactez notre service de médiation qui examinera la situation et proposera une solution. Documentez toujours vos échanges et gardez une communication professionnelle."
  }
];

const technicalItems: FAQItem[] = [
  {
    question: "J'ai un problème technique, comment obtenir de l'aide ?",
    answer: "Pour tout problème technique, vous pouvez contacter notre support en cliquant sur 'Aide' en bas de page ou en envoyant un email à support@vynalplatform.com. Décrivez précisément votre problème et, si possible, joignez des captures d'écran pour faciliter la résolution."
  },
  {
    question: "L'application mobile est-elle disponible ?",
    answer: "Oui, l'application mobile Vynal Platform est disponible pour iOS et Android. Vous pouvez la télécharger depuis l'App Store ou Google Play Store. Elle offre toutes les fonctionnalités principales de la version web avec l'avantage de la mobilité."
  },
  {
    question: "Comment résoudre les problèmes de paiement ?",
    answer: "Si vous rencontrez des difficultés lors du paiement, vérifiez que vos informations bancaires sont correctes et que votre carte n'est pas expirée. Assurez-vous également que votre banque n'a pas bloqué la transaction. En cas de problème persistant, contactez notre support avec les détails de la transaction."
  },
  {
    question: "La plateforme est-elle accessible dans tous les pays ?",
    answer: "Vynal Platform est principalement conçue pour le marché africain, avec une attention particulière au Sénégal et aux pays d'Afrique de l'Ouest. Cependant, elle est accessible mondialement, bien que certaines fonctionnalités, notamment les méthodes de paiement, puissent varier selon les régions."
  },
  {
    question: "Comment signaler un comportement inapproprié ?",
    answer: "Si vous constatez un comportement inapproprié ou frauduleux d'un utilisateur, utilisez l'option 'Signaler' disponible sur les profils et les messages. Vous pouvez également contacter directement notre équipe de modération via le formulaire de contact en précisant la nature du problème."
  }
];

// Page FAQ principale
export default function FAQPage() {
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
        <div className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-vynal-text-primary mb-6">
            Questions fréquemment posées
          </h1>
          <p className="mt-4 text-lg text-vynal-text-secondary max-w-3xl mx-auto">
            Consultez notre FAQ pour trouver des réponses à vos questions sur l'utilisation de Vynal Platform.
          </p>
        </div>

        {/* Recherche */}
        <div className="max-w-2xl mx-auto mb-16">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-vynal-text-secondary" />
            </div>
            <input
              type="text"
              className="block w-full pl-12 pr-4 py-3 bg-vynal-purple-secondary/10 border border-vynal-purple-secondary/30 rounded-xl text-vynal-text-primary placeholder-vynal-text-secondary/50 focus:ring-vynal-accent-primary focus:border-vynal-accent-primary"
              placeholder="Rechercher une question..."
            />
          </div>
        </div>

        {/* Catégories */}
        <div className="mb-16">
          <div className="flex flex-wrap justify-center gap-3">
            <button className="px-6 py-2 bg-vynal-accent-primary text-vynal-purple-dark font-medium rounded-full text-sm">
              Toutes les questions
            </button>
            <button className="px-6 py-2 bg-vynal-purple-secondary/20 text-vynal-text-primary font-medium rounded-full text-sm hover:bg-vynal-purple-secondary/30 transition-colors">
              Inscription et compte
            </button>
            <button className="px-6 py-2 bg-vynal-purple-secondary/20 text-vynal-text-primary font-medium rounded-full text-sm hover:bg-vynal-purple-secondary/30 transition-colors">
              Paiements
            </button>
            <button className="px-6 py-2 bg-vynal-purple-secondary/20 text-vynal-text-primary font-medium rounded-full text-sm hover:bg-vynal-purple-secondary/30 transition-colors">
              Commandes
            </button>
            <button className="px-6 py-2 bg-vynal-purple-secondary/20 text-vynal-text-primary font-medium rounded-full text-sm hover:bg-vynal-purple-secondary/30 transition-colors">
              Freelances
            </button>
            <button className="px-6 py-2 bg-vynal-purple-secondary/20 text-vynal-text-primary font-medium rounded-full text-sm hover:bg-vynal-purple-secondary/30 transition-colors">
              Problèmes techniques
            </button>
          </div>
        </div>

        {/* FAQ Sections */}
        <div className="max-w-4xl mx-auto">
          {/* Section Inscription et Compte */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-vynal-text-primary mb-6 pb-2 border-b border-vynal-purple-secondary/30">
              Inscription et compte
            </h2>

            <Card className="bg-vynal-purple-dark/90 border-vynal-purple-secondary/30 rounded-xl overflow-hidden shadow-lg shadow-vynal-accent-secondary/20 backdrop-blur-sm">
              <CardContent className="p-0">
                <FAQAccordion items={accountItems} />
              </CardContent>
            </Card>
          </div>

          {/* Section Paiements */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-vynal-text-primary mb-6 pb-2 border-b border-vynal-purple-secondary/30">
              Paiements et facturation
            </h2>

            <Card className="bg-vynal-purple-dark/90 border-vynal-purple-secondary/30 rounded-xl overflow-hidden shadow-lg shadow-vynal-accent-secondary/20 backdrop-blur-sm">
              <CardContent className="p-0">
                <FAQAccordion items={paymentItems} />
              </CardContent>
            </Card>
          </div>

          {/* Section Commandes */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-vynal-text-primary mb-6 pb-2 border-b border-vynal-purple-secondary/30">
              Commandes et livraisons
            </h2>

            <Card className="bg-vynal-purple-dark/90 border-vynal-purple-secondary/30 rounded-xl overflow-hidden shadow-lg shadow-vynal-accent-secondary/20 backdrop-blur-sm">
              <CardContent className="p-0">
                <FAQAccordion items={orderItems} />
              </CardContent>
            </Card>
          </div>

          {/* Section Freelances */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-vynal-text-primary mb-6 pb-2 border-b border-vynal-purple-secondary/30">
              Pour les freelances
            </h2>

            <Card className="bg-vynal-purple-dark/90 border-vynal-purple-secondary/30 rounded-xl overflow-hidden shadow-lg shadow-vynal-accent-secondary/20 backdrop-blur-sm">
              <CardContent className="p-0">
                <FAQAccordion items={freelanceItems} />
              </CardContent>
            </Card>
          </div>

          {/* Section Problèmes techniques */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-vynal-text-primary mb-6 pb-2 border-b border-vynal-purple-secondary/30">
              Problèmes techniques et support
            </h2>

            <Card className="bg-vynal-purple-dark/90 border-vynal-purple-secondary/30 rounded-xl overflow-hidden shadow-lg shadow-vynal-accent-secondary/20 backdrop-blur-sm">
              <CardContent className="p-0">
                <FAQAccordion items={technicalItems} />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Contact Support */}
        <div className="mt-20 max-w-3xl mx-auto">
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-r from-vynal-accent-primary/20 to-vynal-accent-secondary/20 rounded-2xl blur-xl opacity-70"></div>
            <Card className="bg-vynal-purple-dark/90 border-vynal-purple-secondary/30 rounded-xl overflow-hidden shadow-lg shadow-vynal-accent-secondary/20 backdrop-blur-sm relative">
              <CardContent className="p-8 text-center">
                <h2 className="text-2xl font-bold text-vynal-text-primary mb-4">
                  Vous n'avez pas trouvé la réponse à votre question ?
                </h2>
                <p className="text-vynal-text-secondary mb-6 max-w-xl mx-auto">
                  Notre équipe de support est disponible pour vous aider. N'hésitez pas à nous contacter directement.
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                  <Button className="bg-vynal-accent-primary hover:bg-vynal-accent-secondary text-vynal-purple-dark">
                    <MessageSquare className="mr-2 h-4 w-4" /> Contacter le support
                  </Button>
                  <Link href="/contact">
                    <Button variant="outline" className="border-vynal-purple-secondary/50 text-vynal-text-primary hover:bg-vynal-purple-secondary/20">
                      Voir la page contact
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