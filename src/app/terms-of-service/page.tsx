import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Conditions d'utilisation | Vynal Platform",
  description: "Conditions d'utilisation de la plateforme Vynal",
};

export default function TermsOfService() {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-center mb-8">Conditions d'utilisation</h1>
      
      <div className="prose prose-lg mx-auto">
        <p className="text-sm text-gray-500 mb-8">
          Dernière mise à jour : {new Date().toLocaleDateString()}
        </p>
        
        <h2 className="text-xl font-semibold mt-8 mb-4">1. Introduction</h2>
        <p>
          Bienvenue sur Vynal Platform. Ces Conditions d'utilisation ("Conditions") régissent votre accès et utilisation du site web, 
          des applications, des API et des autres services en ligne (collectivement, les "Services") fournis par Vynal Platform 
          ("Vynal", "nous", "notre" ou "nos").
        </p>
        <p>
          Veuillez lire attentivement ces Conditions. En accédant ou en utilisant nos Services, vous acceptez d'être lié par ces Conditions. 
          Si vous n'acceptez pas ces Conditions, vous ne devez pas accéder ou utiliser nos Services.
        </p>
        
        <h2 className="text-xl font-semibold mt-8 mb-4">2. Définitions</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>"Client"</strong> désigne un utilisateur qui achète des services sur la plateforme.</li>
          <li><strong>"Freelance"</strong> désigne un utilisateur qui propose des services sur la plateforme.</li>
          <li><strong>"Contenu"</strong> désigne tout texte, graphique, image, musique, logiciel, audio, vidéo, information ou autre matériel.</li>
          <li><strong>"Commande"</strong> désigne un achat effectué par un Client pour les services d'un Freelance.</li>
          <li><strong>"Service"</strong> désigne tout service offert par un Freelance sur la plateforme.</li>
          <li><strong>"Utilisateur"</strong> désigne toute personne qui accède ou utilise nos Services, y compris les Clients et les Freelances.</li>
        </ul>
        
        <h2 className="text-xl font-semibold mt-8 mb-4">3. Inscription et comptes</h2>
        <h3 className="text-lg font-medium mt-6 mb-3">3.1 Critères d'éligibilité</h3>
        <p>
          Pour utiliser nos Services, vous devez :
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Être âgé d'au moins 18 ans</li>
          <li>Être légalement capable de conclure des contrats contraignants</li>
          <li>Ne pas être une personne à qui il est interdit d'utiliser nos Services en vertu des lois de votre juridiction</li>
        </ul>
        
        <h3 className="text-lg font-medium mt-6 mb-3">3.2 Création de compte</h3>
        <p>
          Pour accéder à certaines fonctionnalités de nos Services, vous devez créer un compte. Lors de la création de votre compte, vous acceptez de fournir des informations précises, complètes et à jour. Vous êtes responsable du maintien de la confidentialité de vos identifiants de connexion et de toutes les activités qui se produisent sous votre compte.
        </p>
        
        <h3 className="text-lg font-medium mt-6 mb-3">3.3 Types de comptes</h3>
        <p>
          Vynal propose deux types de comptes principaux :
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>Compte Client</strong> : Permet aux utilisateurs d'acheter des services proposés par les Freelances.</li>
          <li><strong>Compte Freelance</strong> : Permet aux utilisateurs de proposer et de vendre leurs services sur la plateforme.</li>
        </ul>
        <p>
          Vous pouvez détenir à la fois un compte Client et un compte Freelance, mais chaque compte est soumis aux conditions spécifiques applicables à ce type de compte.
        </p>
        
        <h2 className="text-xl font-semibold mt-8 mb-4">4. Services de la plateforme</h2>
        <h3 className="text-lg font-medium mt-6 mb-3">4.1 Rôle de Vynal</h3>
        <p>
          Vynal fournit une plateforme qui permet aux Clients et aux Freelances d'entrer en contact et de réaliser des transactions. 
          Vynal n'est pas partie aux contrats entre Clients et Freelances et n'agit qu'en tant qu'intermédiaire commercial. 
          Nous ne garantissons pas la qualité, la sécurité ou la légalité des services offerts par les Freelances.
        </p>
        
        <h3 className="text-lg font-medium mt-6 mb-3">4.2 Commissions et frais</h3>
        <p>
          L'utilisation de notre plateforme peut entraîner des commissions et des frais de service. Les détails de ces commissions 
          et frais sont disponibles sur notre page de tarification. Nous nous réservons le droit de modifier nos commissions et frais 
          à tout moment, moyennant un préavis raisonnable.
        </p>
        
        <h3 className="text-lg font-medium mt-6 mb-3">4.3 Wallet et paiements</h3>
        <p>
          Vynal propose un système de wallet (portefeuille électronique) pour faciliter les transactions sur la plateforme. 
          L'utilisation du wallet est soumise à des conditions supplémentaires qui vous seront présentées lors de l'activation de cette fonctionnalité.
        </p>
        
        <h2 className="text-xl font-semibold mt-8 mb-4">5. Conditions spécifiques aux Freelances</h2>
        <h3 className="text-lg font-medium mt-6 mb-3">5.1 Publication de services</h3>
        <p>
          En tant que Freelance, vous pouvez publier des services sur notre plateforme, sous réserve des conditions suivantes :
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Vous devez fournir des descriptions précises et complètes de vos services</li>
          <li>Vous ne pouvez proposer que des services légaux et conformes à nos politiques</li>
          <li>Vous devez avoir les compétences, l'expérience et les autorisations nécessaires pour fournir les services proposés</li>
          <li>Vous êtes responsable de fixer vos propres prix et conditions, dans le respect de nos directives</li>
        </ul>
        
        <h3 className="text-lg font-medium mt-6 mb-3">5.2 Exécution des commandes</h3>
        <p>
          Lorsque vous acceptez une commande, vous vous engagez à fournir les services demandés conformément à la description, 
          aux délais et aux conditions convenus. Vous devez communiquer régulièrement avec le Client et l'informer de tout retard 
          ou problème susceptible d'affecter l'exécution de la commande.
        </p>
        
        <h3 className="text-lg font-medium mt-6 mb-3">5.3 Révisions et livrables</h3>
        <p>
          Sauf indication contraire dans la description de votre service, vous devez offrir un nombre raisonnable de révisions 
          pour permettre au Client d'obtenir un résultat satisfaisant. Les livrables finaux doivent être conformes à la description 
          du service et aux spécifications convenues avec le Client.
        </p>
        
        <h2 className="text-xl font-semibold mt-8 mb-4">6. Conditions spécifiques aux Clients</h2>
        <h3 className="text-lg font-medium mt-6 mb-3">6.1 Achat de services</h3>
        <p>
          En tant que Client, vous pouvez acheter des services proposés par les Freelances sur notre plateforme. 
          En passant une commande, vous acceptez de :
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Fournir des informations précises et complètes sur vos besoins et attentes</li>
          <li>Répondre rapidement aux demandes d'informations supplémentaires du Freelance</li>
          <li>Examiner les livrables dans un délai raisonnable</li>
          <li>Payer le prix convenu pour les services</li>
        </ul>
        
        <h3 className="text-lg font-medium mt-6 mb-3">6.2 Annulations et remboursements</h3>
        <p>
          Les annulations et les remboursements sont soumis à notre politique d'annulation et de remboursement, 
          qui peut varier en fonction du type de service et du moment de l'annulation. Veuillez consulter notre 
          politique d'annulation et de remboursement pour plus de détails.
        </p>
        
        <h2 className="text-xl font-semibold mt-8 mb-4">7. Contenu</h2>
        <h3 className="text-lg font-medium mt-6 mb-3">7.1 Propriété du contenu</h3>
        <p>
          Vous conservez tous les droits sur le contenu que vous créez et publiez sur notre plateforme. Toutefois, 
          vous nous accordez une licence mondiale, non exclusive, sans redevance, transférable et pouvant faire l'objet 
          d'une sous-licence pour utiliser, reproduire, distribuer, préparer des œuvres dérivées, afficher et exécuter 
          votre contenu dans le cadre de nos Services et de nos opérations commerciales.
        </p>
        
        <h3 className="text-lg font-medium mt-6 mb-3">7.2 Contenu interdit</h3>
        <p>
          Vous ne pouvez pas publier, télécharger ou partager du contenu qui :
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Enfreint les droits de propriété intellectuelle d'autrui</li>
          <li>Est illégal, nuisible, menaçant, abusif, harcelant, diffamatoire, vulgaire, obscène ou autrement répréhensible</li>
          <li>Contient des virus, des logiciels malveillants ou tout autre code nuisible</li>
          <li>Interfère avec le fonctionnement normal de nos Services</li>
          <li>Usurpe l'identité d'une personne ou d'une entité, ou représente faussement votre affiliation avec une personne ou une entité</li>
        </ul>
        
        <h2 className="text-xl font-semibold mt-8 mb-4">8. Propriété intellectuelle</h2>
        <h3 className="text-lg font-medium mt-6 mb-3">8.1 Propriété intellectuelle de Vynal</h3>
        <p>
          Tous les droits de propriété intellectuelle liés à nos Services, y compris les logos, les marques, les logiciels, 
          les interfaces et le contenu créé par Vynal, sont la propriété exclusive de Vynal ou de ses concédants de licence. 
          Sauf autorisation expresse, vous ne pouvez pas utiliser, reproduire, distribuer ou créer des œuvres dérivées de cette propriété intellectuelle.
        </p>
        
        <h3 className="text-lg font-medium mt-6 mb-3">8.2 Transfert de propriété intellectuelle</h3>
        <p>
          Sauf accord contraire entre le Client et le Freelance, une fois qu'une commande est marquée comme terminée et que 
          le paiement est effectué, le Freelance transfère au Client tous les droits de propriété intellectuelle sur les livrables 
          fournis dans le cadre de la commande, dans la mesure permise par la loi.
        </p>
        
        <h2 className="text-xl font-semibold mt-8 mb-4">9. Confidentialité</h2>
        <p>
          Notre traitement de vos informations personnelles est régi par notre Politique de confidentialité, 
          qui est incorporée par référence à ces Conditions. En utilisant nos Services, vous consentez à la collecte, 
          à l'utilisation et au partage de vos informations comme décrit dans notre Politique de confidentialité.
        </p>
        
        <h2 className="text-xl font-semibold mt-8 mb-4">10. Résiliation</h2>
        <h3 className="text-lg font-medium mt-6 mb-3">10.1 Résiliation par vous</h3>
        <p>
          Vous pouvez résilier votre compte à tout moment en suivant les instructions de résiliation disponibles dans 
          les paramètres de votre compte ou en contactant notre service client. La résiliation de votre compte n'affectera 
          pas les commandes en cours, qui continueront d'être régies par ces Conditions jusqu'à leur achèvement ou leur annulation.
        </p>
        
        <h3 className="text-lg font-medium mt-6 mb-3">10.2 Résiliation par Vynal</h3>
        <p>
          Nous pouvons suspendre ou résilier votre compte et votre accès à nos Services à tout moment, sans préavis, 
          pour toute raison, y compris, mais sans s'y limiter, si nous croyons raisonnablement que :
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Vous avez violé ces Conditions ou d'autres politiques</li>
          <li>Vous créez un risque ou une exposition légale potentielle pour Vynal</li>
          <li>Votre compte ou vos activités peuvent nuire à d'autres utilisateurs</li>
        </ul>
        
        <h2 className="text-xl font-semibold mt-8 mb-4">11. Limitation de responsabilité</h2>
        <p>
          Dans toute la mesure permise par la loi applicable, Vynal et ses dirigeants, employés, agents, partenaires et 
          fournisseurs ne seront pas responsables des dommages indirects, accessoires, spéciaux, consécutifs ou punitifs, 
          y compris la perte de profits, de données, d'utilisation, de clientèle ou d'autres pertes intangibles, résultant de :
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Votre accès ou utilisation, ou incapacité à accéder ou à utiliser nos Services</li>
          <li>Toute conduite ou contenu d'un tiers sur nos Services</li>
          <li>Tout contenu obtenu à partir de nos Services</li>
          <li>Accès, utilisation ou altération non autorisés de vos transmissions ou contenu</li>
        </ul>
        <p>
          La responsabilité totale de Vynal pour toute réclamation liée à ces Conditions ou à nos Services ne dépassera 
          pas le montant que vous avez payé à Vynal au cours des six derniers mois ou 100 €, selon le montant le plus élevé.
        </p>
        
        <h2 className="text-xl font-semibold mt-8 mb-4">12. Indemnisation</h2>
        <p>
          Vous acceptez d'indemniser, de défendre et de dégager de toute responsabilité Vynal et ses dirigeants, administrateurs, 
          employés, agents et affiliés contre toute réclamation, responsabilité, dommage, perte et dépense, y compris les frais 
          juridiques raisonnables, découlant de ou liés à votre violation de ces Conditions, votre utilisation de nos Services, 
          ou votre violation des droits d'un tiers.
        </p>
        
        <h2 className="text-xl font-semibold mt-8 mb-4">13. Modifications des Conditions</h2>
        <p>
          Nous pouvons modifier ces Conditions à tout moment en publiant les Conditions modifiées sur notre site web ou 
          en vous en informant directement. Les Conditions modifiées entreront en vigueur immédiatement pour les nouveaux 
          utilisateurs et 30 jours après leur publication pour les utilisateurs existants. Si vous continuez à utiliser nos 
          Services après l'entrée en vigueur des Conditions modifiées, vous acceptez d'être lié par celles-ci.
        </p>
        
        <h2 className="text-xl font-semibold mt-8 mb-4">14. Dispositions générales</h2>
        <h3 className="text-lg font-medium mt-6 mb-3">14.1 Intégralité de l'accord</h3>
        <p>
          Ces Conditions, ainsi que notre Politique de confidentialité et toute autre politique ou directives publiées par Vynal, 
          constituent l'intégralité de l'accord entre vous et Vynal concernant nos Services.
        </p>
        
        <h3 className="text-lg font-medium mt-6 mb-3">14.2 Divisibilité</h3>
        <p>
          Si une disposition de ces Conditions est jugée illégale, nulle ou inapplicable, cette disposition sera limitée 
          ou éliminée dans la mesure minimale nécessaire, et les dispositions restantes resteront pleinement en vigueur.
        </p>
        
        <h3 className="text-lg font-medium mt-6 mb-3">14.3 Renonciation</h3>
        <p>
          Le fait que Vynal n'exerce pas ou ne fasse pas valoir un droit ou une disposition de ces Conditions ne constituera 
          pas une renonciation à ce droit ou à cette disposition.
        </p>
        
        <h3 className="text-lg font-medium mt-6 mb-3">14.4 Cession</h3>
        <p>
          Vous ne pouvez pas céder ou transférer ces Conditions, ou les droits et licences accordés en vertu de celles-ci, 
          sans le consentement écrit préalable de Vynal. Vynal peut céder ces Conditions sans restriction.
        </p>
        
        <h3 className="text-lg font-medium mt-6 mb-3">14.5 Loi applicable et juridiction</h3>
        <p>
          Ces Conditions sont régies par les lois de [Pays], sans égard aux principes de conflit de lois. 
          Tout litige découlant de ou lié à ces Conditions ou à nos Services sera soumis à la juridiction exclusive 
          des tribunaux de [Ville, Pays].
        </p>
        
        <h2 className="text-xl font-semibold mt-8 mb-4">15. Nous contacter</h2>
        <p>
          Si vous avez des questions concernant ces Conditions, veuillez nous contacter à :
        </p>
        <p className="mt-2">
          <strong>Vynal Platform</strong><br />
          E-mail : terms@vynal.com<br />
          Adresse : [Adresse postale de l'entreprise]
        </p>
      </div>
    </div>
  );
} 