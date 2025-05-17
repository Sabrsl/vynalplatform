import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Conditions d'utilisation | Vynal Platform",
  description: "Conditions d'utilisation de la plateforme Vynal",
};

// Ajouter une configuration de mise en cache pour cette page statique
export const dynamic = 'force-static';
export const revalidate = 2592000; // 30 jours en secondes

export default function TermsOfService() {
  return (
    <div className="max-w-4xl mx-auto py-6 md:py-12 px-3 md:px-8 bg-white/30 dark:bg-slate-900/30 rounded-lg shadow-sm backdrop-blur-sm border border-slate-200 dark:border-slate-700/30">
      <h1 className="text-2xl md:text-3xl font-bold text-center mb-6 md:mb-8 text-slate-800 dark:text-vynal-text-primary">Conditions d'utilisation</h1>
      
      <div className="prose prose-sm md:prose-base lg:prose-lg mx-auto">
        <p className="text-xs md:text-sm text-slate-600 dark:text-vynal-text-secondary mb-6 md:mb-8">
          Dernière mise à jour : {new Date().toLocaleDateString()}
        </p>
        
        <h2 className="text-lg md:text-xl font-semibold mt-6 md:mt-8 mb-3 md:mb-4 text-slate-800 dark:text-vynal-text-primary">1. Introduction</h2>
        <p className="text-sm md:text-base text-slate-600 dark:text-vynal-text-secondary">
          Bienvenue sur Vynal Platform. Ces Conditions d'utilisation ("Conditions") régissent votre accès et utilisation du site web, 
          des applications, des API et des autres services en ligne (collectivement, les "Services") fournis par Vynal Platform 
          ("Vynal", "nous", "notre" ou "nos").
        </p>
        <p className="text-sm md:text-base text-slate-600 dark:text-vynal-text-secondary">
          Veuillez lire attentivement ces Conditions. En accédant ou en utilisant nos Services, vous acceptez d'être lié par ces Conditions. 
          Si vous n'acceptez pas ces Conditions, vous ne devez pas accéder ou utiliser nos Services.
        </p>
        
        <h2 className="text-lg md:text-xl font-semibold mt-6 md:mt-8 mb-3 md:mb-4 text-slate-800 dark:text-vynal-text-primary">2. Définitions</h2>
        <ul className="list-disc pl-4 md:pl-5 space-y-1 md:space-y-2 text-sm md:text-base">
          <li className="text-slate-600 dark:text-vynal-text-secondary"><strong className="text-slate-700 dark:text-vynal-text-primary">"Client"</strong> désigne un utilisateur qui achète des services sur la plateforme.</li>
          <li className="text-slate-600 dark:text-vynal-text-secondary"><strong className="text-slate-700 dark:text-vynal-text-primary">"Freelance"</strong> désigne un utilisateur qui propose des services sur la plateforme.</li>
          <li className="text-slate-600 dark:text-vynal-text-secondary"><strong className="text-slate-700 dark:text-vynal-text-primary">"Contenu"</strong> désigne tout texte, graphique, image, musique, logiciel, audio, vidéo, information ou autre matériel.</li>
          <li className="text-slate-600 dark:text-vynal-text-secondary"><strong className="text-slate-700 dark:text-vynal-text-primary">"Commande"</strong> désigne un achat effectué par un Client pour les services d'un Freelance.</li>
          <li className="text-slate-600 dark:text-vynal-text-secondary"><strong className="text-slate-700 dark:text-vynal-text-primary">"Service"</strong> désigne tout service offert par un Freelance sur la plateforme.</li>
          <li className="text-slate-600 dark:text-vynal-text-secondary"><strong className="text-slate-700 dark:text-vynal-text-primary">"Utilisateur"</strong> désigne toute personne qui accède ou utilise nos Services, y compris les Clients et les Freelances.</li>
        </ul>
        
        <h2 className="text-lg md:text-xl font-semibold mt-6 md:mt-8 mb-3 md:mb-4 text-slate-800 dark:text-vynal-text-primary">3. Inscription et comptes</h2>
        <h3 className="text-base md:text-lg font-medium mt-5 md:mt-6 mb-2 md:mb-3 text-slate-800 dark:text-vynal-text-primary">3.1 Critères d'éligibilité</h3>
        <p className="text-sm md:text-base text-slate-600 dark:text-vynal-text-secondary">
          Pour utiliser nos Services, vous devez :
        </p>
        <ul className="list-disc pl-4 md:pl-5 space-y-1 md:space-y-2 text-sm md:text-base">
          <li className="text-slate-600 dark:text-vynal-text-secondary">Être âgé d'au moins 18 ans</li>
          <li className="text-slate-600 dark:text-vynal-text-secondary">Être légalement capable de conclure des contrats contraignants</li>
          <li className="text-slate-600 dark:text-vynal-text-secondary">Ne pas être une personne à qui il est interdit d'utiliser nos Services en vertu des lois de votre juridiction</li>
        </ul>
        
        <h3 className="text-base md:text-lg font-medium mt-5 md:mt-6 mb-2 md:mb-3 text-slate-800 dark:text-vynal-text-primary">3.2 Création de compte</h3>
        <p className="text-sm md:text-base text-slate-600 dark:text-vynal-text-secondary">
          Pour accéder à certaines fonctionnalités de nos Services, vous devez créer un compte. Lors de la création de votre compte, vous acceptez de fournir des informations précises, complètes et à jour. Vous êtes responsable du maintien de la confidentialité de vos identifiants de connexion et de toutes les activités qui se produisent sous votre compte.
        </p>
        
        <h3 className="text-base md:text-lg font-medium mt-5 md:mt-6 mb-2 md:mb-3 text-slate-800 dark:text-vynal-text-primary">3.3 Types de comptes</h3>
        <p className="text-sm md:text-base text-slate-600 dark:text-vynal-text-secondary">
          Vynal propose deux types de comptes principaux :
        </p>
        <ul className="list-disc pl-4 md:pl-5 space-y-1 md:space-y-2 text-sm md:text-base">
          <li className="text-slate-600 dark:text-vynal-text-secondary"><strong className="text-slate-700 dark:text-vynal-text-primary">Compte Client</strong> : Permet aux utilisateurs d'acheter des services proposés par les Freelances.</li>
          <li className="text-slate-600 dark:text-vynal-text-secondary"><strong className="text-slate-700 dark:text-vynal-text-primary">Compte Freelance</strong> : Permet aux utilisateurs de proposer et de vendre leurs services sur la plateforme.</li>
        </ul>
        <p className="text-sm md:text-base text-slate-600 dark:text-vynal-text-secondary">
          Vous pouvez détenir à la fois un compte Client et un compte Freelance, mais chaque compte est soumis aux conditions spécifiques applicables à ce type de compte.
        </p>
        
        <h2 className="text-lg md:text-xl font-semibold mt-6 md:mt-8 mb-3 md:mb-4 text-slate-800 dark:text-vynal-text-primary">4. Services de la plateforme</h2>
        <h3 className="text-base md:text-lg font-medium mt-5 md:mt-6 mb-2 md:mb-3 text-slate-800 dark:text-vynal-text-primary">4.1 Rôle de Vynal</h3>
        <p className="text-sm md:text-base text-slate-600 dark:text-vynal-text-secondary">
          Vynal fournit une plateforme qui permet aux Clients et aux Freelances d'entrer en contact et de réaliser des transactions. 
          Vynal n'est pas partie aux contrats entre Clients et Freelances et n'agit qu'en tant qu'intermédiaire commercial. 
          Nous ne garantissons pas la qualité, la sécurité ou la légalité des services offerts par les Freelances.
        </p>
        
        <h3 className="text-base md:text-lg font-medium mt-5 md:mt-6 mb-2 md:mb-3 text-slate-800 dark:text-vynal-text-primary">4.2 Commissions et frais</h3>
        <p className="text-sm md:text-base text-slate-600 dark:text-vynal-text-secondary">
          L'utilisation de notre plateforme implique des commissions et des frais de service. Les principaux frais comprennent:
        </p>
        <ul className="list-disc pl-4 md:pl-5 space-y-1 md:space-y-2 text-sm md:text-base">
          <li className="text-slate-600 dark:text-vynal-text-secondary"><strong className="text-slate-700 dark:text-vynal-text-primary">Frais de service pour les retraits</strong> : Un taux fixe de 20% est appliqué sur tous les retraits effectués par les freelances. Ces frais couvrent les coûts de transfert, de traitement administratif et les frais des services tiers.</li>
          <li className="text-slate-600 dark:text-vynal-text-secondary"><strong className="text-slate-700 dark:text-vynal-text-primary">Frais de transaction</strong> : Des frais peuvent s'appliquer aux paiements et transactions effectués sur la plateforme.</li>
          <li className="text-slate-600 dark:text-vynal-text-secondary"><strong className="text-slate-700 dark:text-vynal-text-primary">Frais supplémentaires</strong> : D'autres frais spécifiques peuvent s'appliquer à certains services premium ou fonctionnalités optionnelles.</li>
        </ul>
        <p className="text-sm md:text-base text-slate-600 dark:text-vynal-text-secondary">
          Les détails complets de ces commissions et frais sont disponibles sur notre page de tarification et dans nos <a href="/withdrawal-terms" className="text-vynal-accent-primary hover:underline transition-all duration-200">conditions de retrait</a>. Nous nous réservons le droit de modifier nos commissions et frais à tout moment, moyennant un préavis raisonnable.
        </p>
        
        <h3 className="text-base md:text-lg font-medium mt-5 md:mt-6 mb-2 md:mb-3 text-slate-800 dark:text-vynal-text-primary">4.3 Wallet et paiements</h3>
        <p className="text-sm md:text-base text-slate-600 dark:text-vynal-text-secondary">
          Vynal propose un système de wallet (portefeuille électronique) pour faciliter les transactions sur la plateforme.
          L'utilisation du wallet est soumise aux conditions suivantes:
        </p>
        <ul className="list-disc pl-4 md:pl-5 space-y-1 md:space-y-2 text-sm md:text-base">
          <li className="text-slate-600 dark:text-vynal-text-secondary"><strong className="text-slate-700 dark:text-vynal-text-primary">Retraits</strong> : Les freelances peuvent retirer leurs fonds en suivant notre procédure de retrait. Un montant minimum de 2000 FCFA est requis pour tout retrait. Des frais de service de 20% sont appliqués sur tous les retraits.</li>
          <li className="text-slate-600 dark:text-vynal-text-secondary"><strong className="text-slate-700 dark:text-vynal-text-primary">Délais de traitement</strong> : Les retraits sont traités dans un délai de 24h pour les méthodes de paiement mobile (Wave, Orange Money, Free Money) et 3-5 jours ouvrés pour les virements bancaires.</li>
          <li className="text-slate-600 dark:text-vynal-text-secondary"><strong className="text-slate-700 dark:text-vynal-text-primary">Conditions détaillées</strong> : L'ensemble des conditions de retrait est disponible sur notre page <a href="/withdrawal-terms" className="text-vynal-accent-primary hover:underline transition-all duration-200">Conditions de retrait</a>.</li>
        </ul>
        <p className="text-sm md:text-base text-slate-600 dark:text-vynal-text-secondary">
          Vynal se réserve le droit de modifier les frais, les montants minimums et les délais de traitement moyennant un préavis raisonnable.
        </p>
        
        <h3 className="text-base md:text-lg font-medium mt-5 md:mt-6 mb-2 md:mb-3 text-slate-800 dark:text-vynal-text-primary">4.4 Services de paiement tiers</h3>
        <p className="text-sm md:text-base text-slate-600 dark:text-vynal-text-secondary">
          Notre plateforme utilise PayPal et Stripe comme services de paiement tiers. En utilisant ces services sur notre site, vous acceptez également les conditions suivantes :
        </p>
        <ul className="list-disc pl-4 md:pl-5 space-y-1 md:space-y-2 text-sm md:text-base">
          <li className="text-slate-600 dark:text-vynal-text-secondary"><strong className="text-slate-700 dark:text-vynal-text-primary">Conditions des prestataires</strong> : Lorsque vous utilisez PayPal ou Stripe pour effectuer ou recevoir des paiements sur notre plateforme, vous êtes également soumis aux conditions d'utilisation et à la politique de confidentialité de ces services.</li>
          <li className="text-slate-600 dark:text-vynal-text-secondary"><strong className="text-slate-700 dark:text-vynal-text-primary">Connexion avec PayPal</strong> : Notre plateforme vous permet de vous connecter via votre compte PayPal. Cette fonctionnalité est fournie pour votre commodité et est soumise aux conditions de PayPal.</li>
          <li className="text-slate-600 dark:text-vynal-text-secondary"><strong className="text-slate-700 dark:text-vynal-text-primary">Partage d'informations</strong> : Lorsque vous vous connectez via PayPal, seules votre nom et votre adresse email sont partagées avec notre plateforme. Ces informations sont utilisées uniquement pour vous identifier et faciliter vos transactions.</li>
          <li className="text-slate-600 dark:text-vynal-text-secondary"><strong className="text-slate-700 dark:text-vynal-text-primary">Paiements par carte bancaire</strong> : Les paiements par carte bancaire sont entièrement gérés par Stripe. Toutes les informations de carte sont traitées directement par Stripe et ne sont jamais stockées sur nos serveurs. Nous ne recevons que les informations nécessaires pour confirmer la transaction.</li>
          <li className="text-slate-600 dark:text-vynal-text-secondary"><strong className="text-slate-700 dark:text-vynal-text-primary">Responsabilité</strong> : Vynal n'est pas responsable des erreurs, interruptions ou problèmes survenant lors de l'utilisation de PayPal ou Stripe. Toute transaction effectuée via ces services est soumise à leurs politiques et protections respectives.</li>
        </ul>
        <p className="text-sm md:text-base text-slate-600 dark:text-vynal-text-secondary">
          Pour plus d'informations sur les conditions d'utilisation de ces services, veuillez consulter :
        </p>
        <ul className="list-disc pl-4 md:pl-5 space-y-1 md:space-y-2 text-xs md:text-sm">
          <li className="text-slate-600 dark:text-vynal-text-secondary"><a href="https://www.paypal.com/fr/webapps/mpp/ua/useragreement-full" target="_blank" rel="noopener noreferrer" className="text-vynal-accent-primary hover:underline transition-all duration-200 hover:text-vynal-accent-secondary">Conditions d'utilisation de PayPal</a></li>
          <li className="text-slate-600 dark:text-vynal-text-secondary"><a href="https://stripe.com/fr/legal" target="_blank" rel="noopener noreferrer" className="text-vynal-accent-primary hover:underline transition-all duration-200 hover:text-vynal-accent-secondary">Conditions d'utilisation de Stripe</a></li>
          <li className="text-slate-600 dark:text-vynal-text-secondary"><a href="https://www.wave.com/fr/legal/terms" target="_blank" rel="noopener noreferrer" className="text-vynal-accent-primary hover:underline transition-all duration-200 hover:text-vynal-accent-secondary">Conditions d'utilisation de Wave</a></li>
          <li className="text-slate-600 dark:text-vynal-text-secondary"><a href="https://www.orange.sn/actualite/informations-legales" target="_blank" rel="noopener noreferrer" className="text-vynal-accent-primary hover:underline transition-all duration-200 hover:text-vynal-accent-secondary">Conditions d'utilisation d'Orange Money</a></li>
          <li className="text-slate-600 dark:text-vynal-text-secondary"><a href="https://www.yas.sn/wp-content/uploads/2024/11/CGU_CLIENT-BPA-1.pdf" target="_blank" rel="noopener noreferrer" className="text-vynal-accent-primary hover:underline transition-all duration-200 hover:text-vynal-accent-secondary">Conditions d'utilisation de Free Money</a></li>
        </ul>
        
        <h2 className="text-lg md:text-xl font-semibold mt-6 md:mt-8 mb-3 md:mb-4 text-slate-800 dark:text-vynal-text-primary">5. Conditions spécifiques aux Freelances</h2>
        <h3 className="text-base md:text-lg font-medium mt-5 md:mt-6 mb-2 md:mb-3 text-slate-800 dark:text-vynal-text-primary">5.1 Publication de services</h3>
        <p className="text-sm md:text-base text-slate-600 dark:text-vynal-text-secondary">
          En tant que Freelance, vous pouvez publier des services sur notre plateforme, sous réserve des conditions suivantes :
        </p>
        <ul className="list-disc pl-4 md:pl-5 space-y-1 md:space-y-2 text-sm md:text-base">
          <li className="text-slate-600 dark:text-vynal-text-secondary">Vous devez fournir des descriptions précises et complètes de vos services</li>
          <li className="text-slate-600 dark:text-vynal-text-secondary">Vous ne pouvez proposer que des services légaux et conformes à nos politiques</li>
          <li className="text-slate-600 dark:text-vynal-text-secondary">Vous devez avoir les compétences, l'expérience et les autorisations nécessaires pour fournir les services proposés</li>
          <li className="text-slate-600 dark:text-vynal-text-secondary">Vous êtes responsable de fixer vos propres prix et conditions, dans le respect de nos directives</li>
        </ul>
        
        <h3 className="text-base md:text-lg font-medium mt-5 md:mt-6 mb-2 md:mb-3 text-slate-800 dark:text-vynal-text-primary">5.2 Exécution des commandes</h3>
        <p className="text-sm md:text-base text-slate-600 dark:text-vynal-text-secondary">
          Lorsque vous acceptez une commande, vous vous engagez à fournir les services demandés conformément à la description, 
          aux délais et aux conditions convenus. Vous devez communiquer régulièrement avec le Client et l'informer de tout retard 
          ou problème susceptible d'affecter l'exécution de la commande.
        </p>
        
        <h3 className="text-base md:text-lg font-medium mt-5 md:mt-6 mb-2 md:mb-3 text-slate-800 dark:text-vynal-text-primary">5.3 Révisions et livrables</h3>
        <p className="text-sm md:text-base text-slate-600 dark:text-vynal-text-secondary">
          Sauf indication contraire dans la description de votre service, vous devez offrir un nombre raisonnable de révisions 
          pour permettre au Client d'obtenir un résultat satisfaisant. Les livrables finaux doivent être conformes à la description 
          du service et aux spécifications convenues avec le Client.
        </p>
        
        <h2 className="text-lg md:text-xl font-semibold mt-6 md:mt-8 mb-3 md:mb-4 text-slate-800 dark:text-vynal-text-primary">6. Conditions spécifiques aux Clients</h2>
        <h3 className="text-base md:text-lg font-medium mt-5 md:mt-6 mb-2 md:mb-3 text-slate-800 dark:text-vynal-text-primary">6.1 Achat de services</h3>
        <p className="text-sm md:text-base text-slate-600 dark:text-vynal-text-secondary">
          En tant que Client, vous pouvez acheter des services proposés par les Freelances sur notre plateforme. 
          En passant une commande, vous acceptez de :
        </p>
        <ul className="list-disc pl-4 md:pl-5 space-y-1 md:space-y-2 text-sm md:text-base">
          <li className="text-slate-600 dark:text-vynal-text-secondary">Fournir des informations précises et complètes sur vos besoins et attentes</li>
          <li className="text-slate-600 dark:text-vynal-text-secondary">Répondre rapidement aux demandes d'informations supplémentaires du Freelance</li>
          <li className="text-slate-600 dark:text-vynal-text-secondary">Examiner les livrables dans un délai raisonnable</li>
          <li className="text-slate-600 dark:text-vynal-text-secondary">Payer le prix convenu pour les services</li>
          <li className="text-slate-600 dark:text-vynal-text-secondary">Utiliser des méthodes de paiement légitimes et dont vous êtes le titulaire autorisé</li>
        </ul>
        
        <h3 className="text-base md:text-lg font-medium mt-5 md:mt-6 mb-2 md:mb-3 text-slate-800 dark:text-vynal-text-primary">6.2 Méthodes de paiement</h3>
        <p className="text-sm md:text-base text-slate-600 dark:text-vynal-text-secondary">
          Notre plateforme accepte plusieurs méthodes de paiement, notamment :
        </p>
        <ul className="list-disc pl-4 md:pl-5 space-y-1 md:space-y-2 text-sm md:text-base">
          <li className="text-slate-600 dark:text-vynal-text-secondary"><strong className="text-slate-700 dark:text-vynal-text-primary">PayPal</strong> : Vous pouvez vous connecter avec votre compte PayPal et effectuer des paiements sécurisés. Les paiements PayPal sont soumis aux conditions d'utilisation de PayPal.</li>
          <li className="text-slate-600 dark:text-vynal-text-secondary"><strong className="text-slate-700 dark:text-vynal-text-primary">Autres méthodes</strong> : Nous proposons également d'autres méthodes de paiement selon votre région. Les méthodes disponibles seront affichées lors du processus de paiement.</li>
        </ul>
        <p className="text-sm md:text-base text-slate-600 dark:text-vynal-text-secondary">
          En utilisant l'une de ces méthodes de paiement, vous confirmez que vous êtes légalement autorisé à utiliser la méthode de paiement choisie et que les informations fournies sont exactes et vous appartiennent.
        </p>
        
        <h3 className="text-base md:text-lg font-medium mt-5 md:mt-6 mb-2 md:mb-3 text-slate-800 dark:text-vynal-text-primary">6.3 Annulations et remboursements</h3>
        <p className="text-sm md:text-base text-slate-600 dark:text-vynal-text-secondary">
          Les annulations et les remboursements sont soumis à notre politique d'annulation et de remboursement, 
          qui peut varier en fonction du type de service et du moment de l'annulation. Veuillez consulter notre 
          politique d'annulation et de remboursement pour plus de détails.
        </p>
        
        <h2 className="text-lg md:text-xl font-semibold mt-6 md:mt-8 mb-3 md:mb-4 text-slate-800 dark:text-vynal-text-primary">7. Contenu</h2>
        <h3 className="text-base md:text-lg font-medium mt-5 md:mt-6 mb-2 md:mb-3 text-slate-800 dark:text-vynal-text-primary">7.1 Propriété du contenu</h3>
        <p className="text-sm md:text-base text-slate-600 dark:text-vynal-text-secondary">
          Vous conservez tous les droits sur le contenu que vous créez et publiez sur notre plateforme. Toutefois, 
          vous nous accordez une licence mondiale, non exclusive, sans redevance, transférable et pouvant faire l'objet 
          d'une sous-licence pour utiliser, reproduire, distribuer, préparer des œuvres dérivées, afficher et exécuter 
          votre contenu dans le cadre de nos Services et de nos opérations commerciales.
        </p>
        
        <h3 className="text-base md:text-lg font-medium mt-5 md:mt-6 mb-2 md:mb-3 text-slate-800 dark:text-vynal-text-primary">7.2 Contenu interdit</h3>
        <p className="text-sm md:text-base text-slate-600 dark:text-vynal-text-secondary">
          Vous ne pouvez pas publier, télécharger ou partager du contenu qui :
        </p>
        <ul className="list-disc pl-4 md:pl-5 space-y-1 md:space-y-2 text-sm md:text-base">
          <li className="text-slate-600 dark:text-vynal-text-secondary">Enfreint les droits de propriété intellectuelle d'autrui</li>
          <li className="text-slate-600 dark:text-vynal-text-secondary">Est illégal, nuisible, menaçant, abusif, harcelant, diffamatoire, vulgaire, obscène ou autrement répréhensible</li>
          <li className="text-slate-600 dark:text-vynal-text-secondary">Contient des virus, des logiciels malveillants ou tout autre code nuisible</li>
          <li className="text-slate-600 dark:text-vynal-text-secondary">Interfère avec le fonctionnement normal de nos Services</li>
          <li className="text-slate-600 dark:text-vynal-text-secondary">Usurpe l'identité d'une personne ou d'une entité, ou représente faussement votre affiliation avec une personne ou une entité</li>
        </ul>
        
        <h2 className="text-lg md:text-xl font-semibold mt-6 md:mt-8 mb-3 md:mb-4 text-slate-800 dark:text-vynal-text-primary">8. Propriété intellectuelle</h2>
        <h3 className="text-base md:text-lg font-medium mt-5 md:mt-6 mb-2 md:mb-3 text-slate-800 dark:text-vynal-text-primary">8.1 Propriété intellectuelle de Vynal</h3>
        <p className="text-sm md:text-base text-slate-600 dark:text-vynal-text-secondary">
          Tous les droits de propriété intellectuelle liés à nos Services, y compris les logos, les marques, les logiciels, 
          les interfaces et le contenu créé par Vynal, sont la propriété exclusive de Vynal ou de ses concédants de licence. 
          Sauf autorisation expresse, vous ne pouvez pas utiliser, reproduire, distribuer ou créer des œuvres dérivées de cette propriété intellectuelle.
        </p>
        
        <h3 className="text-base md:text-lg font-medium mt-5 md:mt-6 mb-2 md:mb-3 text-slate-800 dark:text-vynal-text-primary">8.2 Transfert de propriété intellectuelle</h3>
        <p className="text-sm md:text-base text-slate-600 dark:text-vynal-text-secondary">
          Sauf accord contraire entre le Client et le Freelance, une fois qu'une commande est marquée comme terminée et que 
          le paiement est effectué, le Freelance transfère au Client tous les droits de propriété intellectuelle sur les livrables 
          fournis dans le cadre de la commande, dans la mesure permise par la loi.
        </p>
        
        <h2 className="text-lg md:text-xl font-semibold mt-6 md:mt-8 mb-3 md:mb-4 text-slate-800 dark:text-vynal-text-primary">9. Confidentialité</h2>
        <p className="text-sm md:text-base text-slate-600 dark:text-vynal-text-secondary">
          Notre traitement de vos informations personnelles est régi par notre Politique de confidentialité, 
          qui est incorporée par référence à ces Conditions. En utilisant nos Services, vous consentez à la collecte, 
          à l'utilisation et au partage de vos informations comme décrit dans notre Politique de confidentialité.
        </p>
        
        <h2 className="text-lg md:text-xl font-semibold mt-6 md:mt-8 mb-3 md:mb-4 text-slate-800 dark:text-vynal-text-primary">10. Résiliation</h2>
        <h3 className="text-base md:text-lg font-medium mt-5 md:mt-6 mb-2 md:mb-3 text-slate-800 dark:text-vynal-text-primary">10.1 Résiliation par vous</h3>
        <p className="text-sm md:text-base text-slate-600 dark:text-vynal-text-secondary">
          Vous pouvez résilier votre compte à tout moment en suivant les instructions de résiliation disponibles dans 
          les paramètres de votre compte ou en contactant notre service client. La résiliation de votre compte n'affectera 
          pas les commandes en cours, qui continueront d'être régies par ces Conditions jusqu'à leur achèvement ou leur annulation.
        </p>
        
        <h3 className="text-base md:text-lg font-medium mt-5 md:mt-6 mb-2 md:mb-3 text-slate-800 dark:text-vynal-text-primary">10.2 Résiliation par Vynal</h3>
        <p className="text-sm md:text-base text-slate-600 dark:text-vynal-text-secondary">
          Nous pouvons suspendre ou résilier votre compte et votre accès à nos Services à tout moment, sans préavis, 
          pour toute raison, y compris, mais sans s'y limiter, si nous croyons raisonnablement que :
        </p>
        <ul className="list-disc pl-4 md:pl-5 space-y-1 md:space-y-2 text-sm md:text-base">
          <li className="text-slate-600 dark:text-vynal-text-secondary">Vous avez violé ces Conditions ou d'autres politiques</li>
          <li className="text-slate-600 dark:text-vynal-text-secondary">Vous créez un risque ou une exposition légale potentielle pour Vynal</li>
          <li className="text-slate-600 dark:text-vynal-text-secondary">Votre compte ou vos activités peuvent nuire à d'autres utilisateurs</li>
        </ul>
        
        <h2 className="text-lg md:text-xl font-semibold mt-6 md:mt-8 mb-3 md:mb-4 text-slate-800 dark:text-vynal-text-primary">11. Limitation de responsabilité</h2>
        <p className="text-sm md:text-base text-slate-600 dark:text-vynal-text-secondary">
          Dans toute la mesure permise par la loi applicable, Vynal et ses dirigeants, employés, agents, partenaires et 
          fournisseurs ne seront pas responsables des dommages indirects, accessoires, spéciaux, consécutifs ou punitifs, 
          y compris la perte de profits, de données, d'utilisation, de clientèle ou d'autres pertes intangibles, résultant de :
        </p>
        <ul className="list-disc pl-4 md:pl-5 space-y-1 md:space-y-2 text-sm md:text-base">
          <li className="text-slate-600 dark:text-vynal-text-secondary">Votre accès ou utilisation, ou incapacité à accéder ou à utiliser nos Services</li>
          <li className="text-slate-600 dark:text-vynal-text-secondary">Toute conduite ou contenu d'un tiers sur nos Services</li>
          <li className="text-slate-600 dark:text-vynal-text-secondary">Tout contenu obtenu à partir de nos Services</li>
          <li className="text-slate-600 dark:text-vynal-text-secondary">Accès, utilisation ou altération non autorisés de vos transmissions ou contenu</li>
        </ul>
        <p className="text-sm md:text-base text-slate-600 dark:text-vynal-text-secondary">
          La responsabilité totale de Vynal pour toute réclamation liée à ces Conditions ou à nos Services ne dépassera 
          pas le montant que vous avez payé à Vynal au cours des six derniers mois ou 100 €, selon le montant le plus élevé.
        </p>
        
        <h2 className="text-lg md:text-xl font-semibold mt-6 md:mt-8 mb-3 md:mb-4 text-slate-800 dark:text-vynal-text-primary">12. Indemnisation</h2>
        <p className="text-sm md:text-base text-slate-600 dark:text-vynal-text-secondary">
          Vous acceptez d'indemniser, de défendre et de dégager de toute responsabilité Vynal et ses dirigeants, administrateurs, 
          employés, agents et affiliés contre toute réclamation, responsabilité, dommage, perte et dépense, y compris les frais 
          juridiques raisonnables, découlant de ou liés à votre violation de ces Conditions, votre utilisation de nos Services, 
          ou votre violation des droits d'un tiers.
        </p>
        
        <h2 className="text-lg md:text-xl font-semibold mt-6 md:mt-8 mb-3 md:mb-4 text-slate-800 dark:text-vynal-text-primary">13. Modifications des Conditions</h2>
        <p className="text-sm md:text-base text-slate-600 dark:text-vynal-text-secondary">
          Nous pouvons modifier ces Conditions à tout moment en publiant les Conditions modifiées sur notre site web ou 
          en vous en informant directement. Les Conditions modifiées entreront en vigueur immédiatement pour les nouveaux 
          utilisateurs et 30 jours après leur publication pour les utilisateurs existants. Si vous continuez à utiliser nos 
          Services après l'entrée en vigueur des Conditions modifiées, vous acceptez d'être lié par celles-ci.
        </p>
        
        <h2 className="text-lg md:text-xl font-semibold mt-6 md:mt-8 mb-3 md:mb-4 text-slate-800 dark:text-vynal-text-primary">14. Dispositions générales</h2>
        <h3 className="text-base md:text-lg font-medium mt-5 md:mt-6 mb-2 md:mb-3 text-slate-800 dark:text-vynal-text-primary">14.1 Intégralité de l'accord</h3>
        <p className="text-sm md:text-base text-slate-600 dark:text-vynal-text-secondary">
          Ces Conditions, ainsi que notre Politique de confidentialité et toute autre politique ou directives publiées par Vynal, 
          constituent l'intégralité de l'accord entre vous et Vynal concernant nos Services.
        </p>
        
        <h3 className="text-base md:text-lg font-medium mt-5 md:mt-6 mb-2 md:mb-3 text-slate-800 dark:text-vynal-text-primary">14.2 Divisibilité</h3>
        <p className="text-sm md:text-base text-slate-600 dark:text-vynal-text-secondary">
          Si une disposition de ces Conditions est jugée illégale, nulle ou inapplicable, cette disposition sera limitée 
          ou éliminée dans la mesure minimale nécessaire, et les dispositions restantes resteront pleinement en vigueur.
        </p>
        
        <h3 className="text-base md:text-lg font-medium mt-5 md:mt-6 mb-2 md:mb-3 text-slate-800 dark:text-vynal-text-primary">14.3 Renonciation</h3>
        <p className="text-sm md:text-base text-slate-600 dark:text-vynal-text-secondary">
          Le fait que Vynal n'exerce pas ou ne fasse pas valoir un droit ou une disposition de ces Conditions ne constituera 
          pas une renonciation à ce droit ou à cette disposition.
        </p>
        
        <h3 className="text-base md:text-lg font-medium mt-5 md:mt-6 mb-2 md:mb-3 text-slate-800 dark:text-vynal-text-primary">14.4 Cession</h3>
        <p className="text-sm md:text-base text-slate-600 dark:text-vynal-text-secondary">
          Vous ne pouvez pas céder ou transférer ces Conditions, ou les droits et licences accordés en vertu de celles-ci, 
          sans le consentement écrit préalable de Vynal. Vynal peut céder ces Conditions sans restriction.
        </p>
        
        <h3 className="text-base md:text-lg font-medium mt-5 md:mt-6 mb-2 md:mb-3 text-slate-800 dark:text-vynal-text-primary">14.5 Loi applicable et juridiction</h3>
        <p className="text-sm md:text-base text-slate-600 dark:text-vynal-text-secondary">
          Ces Conditions sont régies par les lois du Sénégal, sans égard aux principes de conflit de lois. 
          Tout litige découlant de ou lié à ces Conditions ou à nos Services sera soumis à la juridiction exclusive 
          des tribunaux de Dakar, Sénégal.
        </p>
        
        <h2 className="text-lg md:text-xl font-semibold mt-6 md:mt-8 mb-3 md:mb-4 text-slate-800 dark:text-vynal-text-primary">15. Nous contacter</h2>
        <p className="text-sm md:text-base text-slate-600 dark:text-vynal-text-secondary">
          Si vous avez des questions concernant ces Conditions, veuillez nous contacter à :
        </p>
        <p className="mt-2 text-sm md:text-base text-slate-600 dark:text-vynal-text-secondary">
          <strong>Vynal Platform</strong><br />
          E-mail : support@vynalplatform.com<br />
          Adresse : Dakar, Sénégal
        </p>
        
        <div className="mt-8 p-4 bg-white/40 dark:bg-slate-800/40 rounded-lg border border-slate-200/50 dark:border-slate-700/20 transition-all duration-200">
          <p className="text-xs md:text-sm text-slate-600 dark:text-vynal-text-secondary">
            <strong>Documents complémentaires :</strong>
          </p>
          <ul className="list-disc pl-4 md:pl-5 mt-2 text-xs md:text-sm space-y-1">
            <li><a href="/privacy-policy" className="text-vynal-accent-primary hover:underline transition-all duration-200">Politique de confidentialité</a></li>
            <li><a href="/code-of-conduct" className="text-vynal-accent-primary hover:underline transition-all duration-200">Code de conduite</a></li>
            <li><a href="/withdrawal-terms" className="text-vynal-accent-primary hover:underline transition-all duration-200">Conditions de retrait</a></li>
          </ul>
        </div>
      </div>
    </div>
  );
} 