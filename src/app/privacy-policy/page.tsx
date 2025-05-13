import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Politique de confidentialité | Vynal Platform",
  description: "Politique de confidentialité de la plateforme Vynal",
};

export default function PrivacyPolicy() {
  return (
    <div className="max-w-4xl mx-auto py-6 md:py-12 px-3 md:px-8 bg-white/30 dark:bg-slate-900/30 rounded-lg shadow-sm backdrop-blur-sm border border-slate-200 dark:border-slate-700/30">
      <h1 className="text-2xl md:text-3xl font-bold text-center mb-6 md:mb-8 text-slate-800 dark:text-vynal-text-primary">Politique de confidentialité</h1>
      
      <div className="prose prose-sm md:prose-base lg:prose-lg mx-auto">
        <p className="text-xs md:text-sm text-slate-600 dark:text-vynal-text-secondary mb-6 md:mb-8">
          Dernière mise à jour : {new Date().toLocaleDateString()}
        </p>
        
        <h2 className="text-lg md:text-xl font-semibold mt-6 md:mt-8 mb-3 md:mb-4 text-slate-800 dark:text-vynal-text-primary">Introduction</h2>
        <p className="text-sm md:text-base text-slate-600 dark:text-vynal-text-secondary">
          Chez Vynal Platform, nous accordons une importance capitale à la protection de votre vie privée et de vos données personnelles. 
          Cette politique de confidentialité explique comment nous collectons, utilisons, partageons et protégeons vos informations 
          lorsque vous utilisez notre plateforme, nos services, et notre site web (collectivement désignés comme les "Services").
        </p>
        <p className="text-sm md:text-base text-slate-600 dark:text-vynal-text-secondary">
          En utilisant nos Services, vous acceptez les pratiques décrites dans cette politique de confidentialité. 
          Si vous n'acceptez pas cette politique, veuillez ne pas utiliser nos Services.
        </p>
        
        <h2 className="text-lg md:text-xl font-semibold mt-6 md:mt-8 mb-3 md:mb-4 text-slate-800 dark:text-vynal-text-primary">Informations que nous collectons</h2>
        <p className="text-sm md:text-base text-slate-600 dark:text-vynal-text-secondary">Nous collectons les types d'informations suivants :</p>
        
        <h3 className="text-base md:text-lg font-medium mt-5 md:mt-6 mb-2 md:mb-3 text-slate-800 dark:text-vynal-text-primary">Informations que vous nous fournissez</h3>
        <ul className="list-disc pl-4 md:pl-5 space-y-1 md:space-y-2 text-sm md:text-base">
          <li className="text-slate-600 dark:text-vynal-text-secondary"><strong className="text-slate-700 dark:text-vynal-text-primary">Informations de compte</strong> : Lorsque vous créez un compte, nous collectons votre nom, adresse e-mail, mot de passe, numéro de téléphone, et votre rôle (client ou freelance).</li>
          <li className="text-slate-600 dark:text-vynal-text-secondary"><strong className="text-slate-700 dark:text-vynal-text-primary">Informations de profil</strong> : Pour les freelances, nous collectons des informations sur vos compétences, expérience, éducation, portfolio, et tarifs. Pour les clients, nous collectons des informations sur votre entreprise ou vos besoins en services.</li>
          <li className="text-slate-600 dark:text-vynal-text-secondary"><strong className="text-slate-700 dark:text-vynal-text-primary">Informations de paiement</strong> : Nous ne stockons aucune information de paiement sur nos serveurs. Pour les paiements via PayPal, nous recevons uniquement votre nom et votre adresse email lors de la connexion. Pour les paiements par carte bancaire via Stripe, toutes les informations sont gérées directement par Stripe. Pour les paiements par Wave, Orange Money et Free Money, toutes les informations sont gérées directement par ces services. Nous ne conservons que les informations nécessaires pour confirmer les transactions (statut, montant, date).</li>
          <li className="text-slate-600 dark:text-vynal-text-secondary"><strong className="text-slate-700 dark:text-vynal-text-primary">Authentification avec PayPal</strong> : Lorsque vous vous connectez via PayPal, nous recevons uniquement votre nom et votre adresse email de votre compte PayPal. Ces informations sont utilisées pour vous identifier sur notre plateforme et faciliter vos transactions.</li>
          <li className="text-slate-600 dark:text-vynal-text-secondary"><strong className="text-slate-700 dark:text-vynal-text-primary">Historique des transactions</strong> : Nous conservons un historique complet de vos transactions, y compris les paiements reçus, les retraits effectués, les dates, montants, frais appliqués, et méthodes de paiement utilisées.</li>
          <li className="text-slate-600 dark:text-vynal-text-secondary"><strong className="text-slate-700 dark:text-vynal-text-primary">Communications</strong> : Nous conservons les messages que vous échangez avec d'autres utilisateurs via notre système de messagerie, ainsi que vos communications avec notre service client.</li>
          <li className="text-slate-600 dark:text-vynal-text-secondary"><strong className="text-slate-700 dark:text-vynal-text-primary">Contenu généré</strong> : Nous collectons le contenu que vous créez, téléchargez ou partagez sur notre plateforme, comme les descriptions de services, les livrables, les commentaires et les évaluations.</li>
        </ul>
        
        <h3 className="text-base md:text-lg font-medium mt-5 md:mt-6 mb-2 md:mb-3 text-slate-800 dark:text-vynal-text-primary">Informations collectées automatiquement</h3>
        <ul className="list-disc pl-4 md:pl-5 space-y-1 md:space-y-2 text-sm md:text-base">
          <li className="text-slate-600 dark:text-vynal-text-secondary"><strong className="text-slate-700 dark:text-vynal-text-primary">Informations d'utilisation</strong> : Nous collectons des informations sur la façon dont vous utilisez nos Services, notamment les pages visitées, les fonctionnalités utilisées, les actions effectuées, et le temps passé sur la plateforme.</li>
          <li className="text-slate-600 dark:text-vynal-text-secondary"><strong className="text-slate-700 dark:text-vynal-text-primary">Informations sur l'appareil</strong> : Nous collectons des informations sur l'appareil que vous utilisez pour accéder à nos Services, y compris le modèle, le système d'exploitation, l'identifiant unique, et le navigateur.</li>
          <li className="text-slate-600 dark:text-vynal-text-secondary"><strong className="text-slate-700 dark:text-vynal-text-primary">Informations de localisation</strong> : Avec votre permission, nous pouvons collecter des informations sur votre localisation précise. Vous pouvez désactiver cette fonction dans les paramètres de votre appareil.</li>
          <li className="text-slate-600 dark:text-vynal-text-secondary"><strong className="text-slate-700 dark:text-vynal-text-primary">Cookies et technologies similaires</strong> : Nous utilisons des cookies et des technologies similaires pour collecter des informations sur votre navigation, vos préférences, et votre interaction avec nos Services.</li>
        </ul>
        
        <h3 className="text-base md:text-lg font-medium mt-5 md:mt-6 mb-2 md:mb-3 text-slate-800 dark:text-vynal-text-primary">Informations provenant d'autres sources</h3>
        <p className="text-sm md:text-base text-slate-600 dark:text-vynal-text-secondary">
          Nous pouvons obtenir des informations vous concernant à partir d'autres sources, notamment :
        </p>
        <ul className="list-disc pl-4 md:pl-5 space-y-1 md:space-y-2 text-sm md:text-base">
          <li className="text-slate-600 dark:text-vynal-text-secondary">Des services d'authentification tiers lorsque vous vous connectez via ces services (comme Google ou PayPal)</li>
          <li className="text-slate-600 dark:text-vynal-text-secondary">Des partenaires commerciaux, comme les services de paiement (PayPal, Wave, Orange Money, Free Money)</li>
          <li className="text-slate-600 dark:text-vynal-text-secondary">Des sources accessibles au public, comme les réseaux sociaux professionnels</li>
        </ul>
        
        <h2 className="text-lg md:text-xl font-semibold mt-6 md:mt-8 mb-3 md:mb-4 text-slate-800 dark:text-vynal-text-primary">Comment nous utilisons vos informations</h2>
        <p className="text-sm md:text-base text-slate-600 dark:text-vynal-text-secondary">Nous utilisons vos informations pour les finalités suivantes :</p>
        <ul className="list-disc pl-4 md:pl-5 space-y-1 md:space-y-2 text-sm md:text-base">
          <li className="text-slate-600 dark:text-vynal-text-secondary"><strong className="text-slate-700 dark:text-vynal-text-primary">Fournir nos Services</strong> : Pour créer et gérer votre compte, faciliter les transactions, traiter les paiements et les retraits, et vous permettre de communiquer avec d'autres utilisateurs.</li>
          <li className="text-slate-600 dark:text-vynal-text-secondary"><strong className="text-slate-700 dark:text-vynal-text-primary">Traitement des retraits</strong> : Pour vérifier votre identité, traiter vos demandes de retrait, appliquer les frais de service (20%), et transférer les fonds vers votre méthode de paiement choisie.</li>
          <li className="text-slate-600 dark:text-vynal-text-secondary"><strong className="text-slate-700 dark:text-vynal-text-primary">Personnaliser votre expérience</strong> : Pour vous recommander des services ou des freelances pertinents, personnaliser votre interface, et mémoriser vos préférences.</li>
          <li className="text-slate-600 dark:text-vynal-text-secondary"><strong className="text-slate-700 dark:text-vynal-text-primary">Améliorer nos Services</strong> : Pour analyser comment nos Services sont utilisés, identifier les tendances d'utilisation, résoudre les problèmes techniques, et développer de nouvelles fonctionnalités.</li>
          <li className="text-slate-600 dark:text-vynal-text-secondary"><strong className="text-slate-700 dark:text-vynal-text-primary">Communiquer avec vous</strong> : Pour vous envoyer des confirmations, des notifications, des mises à jour sur nos Services, et des informations sur les nouvelles fonctionnalités ou offres.</li>
          <li className="text-slate-600 dark:text-vynal-text-secondary"><strong className="text-slate-700 dark:text-vynal-text-primary">Marketing et publicité</strong> : Pour vous envoyer des communications marketing et afficher des publicités pertinentes, sous réserve de vos préférences de communication.</li>
          <li className="text-slate-600 dark:text-vynal-text-secondary"><strong className="text-slate-700 dark:text-vynal-text-primary">Sécurité et protection</strong> : Pour détecter, prévenir et traiter les activités frauduleuses, les abus, les violations de sécurité, et les problèmes techniques.</li>
          <li className="text-slate-600 dark:text-vynal-text-secondary"><strong className="text-slate-700 dark:text-vynal-text-primary">Obligations légales</strong> : Pour respecter les lois, réglementations, et procédures judiciaires applicables, y compris les réglementations financières et fiscales.</li>
        </ul>
        
        <h2 className="text-lg md:text-xl font-semibold mt-6 md:mt-8 mb-3 md:mb-4 text-slate-800 dark:text-vynal-text-primary">Comment nous partageons vos informations</h2>
        <p className="text-sm md:text-base text-slate-600 dark:text-vynal-text-secondary">Nous pouvons partager vos informations avec les catégories suivantes de destinataires :</p>
        <ul className="list-disc pl-4 md:pl-5 space-y-1 md:space-y-2 text-sm md:text-base">
          <li className="text-slate-600 dark:text-vynal-text-secondary"><strong className="text-slate-700 dark:text-vynal-text-primary">Autres utilisateurs</strong> : Certaines de vos informations sont partagées avec d'autres utilisateurs dans le cadre de l'utilisation normale de la plateforme, comme votre profil, vos évaluations, et vos communications.</li>
          <li className="text-slate-600 dark:text-vynal-text-secondary"><strong className="text-slate-700 dark:text-vynal-text-primary">Prestataires de services</strong> : Nous partageons des informations avec des prestataires de services tiers qui nous aident à fournir et améliorer nos Services, comme les services d'hébergement, de paiement, d'analyse, et de support client.</li>
          <li className="text-slate-600 dark:text-vynal-text-secondary"><strong className="text-slate-700 dark:text-vynal-text-primary">Partenaires commerciaux</strong> : Nous pouvons partager des informations avec nos partenaires commerciaux pour des offres conjointes, des promotions, ou d'autres collaborations.</li>
          <li className="text-slate-600 dark:text-vynal-text-secondary"><strong className="text-slate-700 dark:text-vynal-text-primary">Conformité légale</strong> : Nous pouvons divulguer des informations si nous estimons de bonne foi que cela est nécessaire pour se conformer à la loi, protéger nos droits ou la sécurité de nos utilisateurs, ou détecter et prévenir les fraudes.</li>
          <li className="text-slate-600 dark:text-vynal-text-secondary"><strong className="text-slate-700 dark:text-vynal-text-primary">Transactions d'entreprise</strong> : Si Vynal Platform est impliqué dans une fusion, acquisition, ou vente d'actifs, vos informations peuvent être transférées dans le cadre de cette transaction.</li>
          <li className="text-slate-600 dark:text-vynal-text-secondary"><strong className="text-slate-700 dark:text-vynal-text-primary">Prestataires de services de paiement</strong> : Nous partageons uniquement votre nom et votre adresse email avec PayPal pour faciliter les transactions sur notre plateforme. Ces informations sont nécessaires pour identifier votre compte et traiter vos paiements de manière sécurisée.</li>
        </ul>
        <p className="text-sm md:text-base text-slate-600 dark:text-vynal-text-secondary">
          Nous ne vendons pas vos informations personnelles à des tiers.
        </p>
        
        <h2 className="text-lg md:text-xl font-semibold mt-6 md:mt-8 mb-3 md:mb-4 text-slate-800 dark:text-vynal-text-primary">Vos droits et choix</h2>
        <p className="text-sm md:text-base text-slate-600 dark:text-vynal-text-secondary">Selon votre juridiction, vous pouvez avoir certains droits concernant vos données personnelles :</p>
        <ul className="list-disc pl-4 md:pl-5 space-y-1 md:space-y-2 text-sm md:text-base">
          <li className="text-slate-600 dark:text-vynal-text-secondary"><strong className="text-slate-700 dark:text-vynal-text-primary">Accès et portabilité</strong> : Vous pouvez demander une copie de vos données personnelles que nous détenons et les recevoir dans un format structuré.</li>
          <li className="text-slate-600 dark:text-vynal-text-secondary"><strong className="text-slate-700 dark:text-vynal-text-primary">Rectification</strong> : Vous pouvez mettre à jour ou corriger vos données personnelles via les paramètres de votre compte ou en nous contactant.</li>
          <li className="text-slate-600 dark:text-vynal-text-secondary"><strong className="text-slate-700 dark:text-vynal-text-primary">Suppression</strong> : Vous pouvez demander la suppression de vos données personnelles dans certaines circonstances.</li>
          <li className="text-slate-600 dark:text-vynal-text-secondary"><strong className="text-slate-700 dark:text-vynal-text-primary">Opposition et limitation</strong> : Vous pouvez vous opposer au traitement de vos données personnelles ou demander la limitation de ce traitement.</li>
          <li className="text-slate-600 dark:text-vynal-text-secondary"><strong className="text-slate-700 dark:text-vynal-text-primary">Consentement</strong> : Lorsque nous traitons vos données sur la base de votre consentement, vous pouvez retirer ce consentement à tout moment.</li>
          <li className="text-slate-600 dark:text-vynal-text-secondary"><strong className="text-slate-700 dark:text-vynal-text-primary">Paramètres de communication</strong> : Vous pouvez gérer vos préférences de communication marketing dans les paramètres de votre compte ou en vous désabonnant via les liens fournis dans nos e-mails.</li>
          <li className="text-slate-600 dark:text-vynal-text-secondary"><strong className="text-slate-700 dark:text-vynal-text-primary">Paramètres des cookies</strong> : Vous pouvez gérer vos préférences concernant les cookies via notre bandeau de cookies ou les paramètres de votre navigateur.</li>
        </ul>
        <p className="text-sm md:text-base text-slate-600 dark:text-vynal-text-secondary">
          Pour exercer ces droits, veuillez nous contacter à support@vynalplatform.com.
        </p>
        
        <h2 className="text-lg md:text-xl font-semibold mt-6 md:mt-8 mb-3 md:mb-4 text-slate-800 dark:text-vynal-text-primary">Sécurité des données</h2>
        <p className="text-sm md:text-base text-slate-600 dark:text-vynal-text-secondary">
          Nous mettons en œuvre des mesures de sécurité techniques, administratives et physiques appropriées pour protéger vos informations 
          contre la perte, le vol, l'utilisation abusive, l'accès non autorisé, la divulgation, l'altération et la destruction. 
          Ces mesures comprennent le chiffrement des données, les contrôles d'accès, les pare-feu, et les audits de sécurité réguliers.
        </p>
        <p className="text-sm md:text-base text-slate-600 dark:text-vynal-text-secondary">
          Cependant, aucun système de sécurité n'est impénétrable et nous ne pouvons garantir la sécurité absolue de vos informations. 
          Vous êtes responsable de maintenir la confidentialité de vos identifiants de connexion et de nous informer de toute utilisation 
          non autorisée de votre compte.
        </p>
        
        <h2 className="text-lg md:text-xl font-semibold mt-6 md:mt-8 mb-3 md:mb-4 text-slate-800 dark:text-vynal-text-primary">Conservation des données</h2>
        <p className="text-sm md:text-base text-slate-600 dark:text-vynal-text-secondary">
          Nous conservons vos informations aussi longtemps que nécessaire pour fournir nos Services, respecter nos obligations légales, 
          résoudre les litiges, et faire respecter nos accords. Les critères utilisés pour déterminer notre période de conservation 
          comprennent :
        </p>
        <ul className="list-disc pl-4 md:pl-5 space-y-1 md:space-y-2 text-sm md:text-base">
          <li className="text-slate-600 dark:text-vynal-text-secondary">La durée pendant laquelle vous avez un compte actif sur notre plateforme</li>
          <li className="text-slate-600 dark:text-vynal-text-secondary">Si vous avez des transactions ou commandes en cours</li>
          <li className="text-slate-600 dark:text-vynal-text-secondary">Nos obligations légales et réglementaires</li>
          <li className="text-slate-600 dark:text-vynal-text-secondary">Les périodes de prescription applicables pour les réclamations légales potentielles</li>
        </ul>
        <p className="text-sm md:text-base text-slate-600 dark:text-vynal-text-secondary">
          Pour les données de transactions financières, notamment les retraits et paiements, nous conservons ces informations pendant une durée minimale de 5 ans conformément aux réglementations financières et fiscales en vigueur au Sénégal. Ces informations incluent les détails des méthodes de paiement utilisées, les montants, les frais appliqués, et les dates des transactions.
        </p>
        
        <h2 className="text-lg md:text-xl font-semibold mt-6 md:mt-8 mb-3 md:mb-4 text-slate-800 dark:text-vynal-text-primary">Conformité réglementaire</h2>
        <p className="text-sm md:text-base text-slate-600 dark:text-vynal-text-secondary">
          Vynal Platform se conforme aux lois et réglementations applicables en matière de transactions financières, notamment :
        </p>
        <ul className="list-disc pl-4 md:pl-5 space-y-1 md:space-y-2 text-sm md:text-base">
          <li className="text-slate-600 dark:text-vynal-text-secondary">Les réglementations relatives à la lutte contre le blanchiment d'argent (LCB-FT)</li>
          <li className="text-slate-600 dark:text-vynal-text-secondary">Les obligations de vérification d'identité pour les transactions dépassant certains seuils</li>
          <li className="text-slate-600 dark:text-vynal-text-secondary">Les exigences de conservation des données financières</li>
          <li className="text-slate-600 dark:text-vynal-text-secondary">Les obligations fiscales et déclarations requises</li>
        </ul>
        <p className="text-sm md:text-base text-slate-600 dark:text-vynal-text-secondary">
          Conformément à ces réglementations, nous pouvons être amenés à demander des informations supplémentaires pour vérifier votre identité ou à signaler certaines transactions aux autorités compétentes lorsque cela est légalement requis.
        </p>
        
        <h2 className="text-lg md:text-xl font-semibold mt-6 md:mt-8 mb-3 md:mb-4 text-slate-800 dark:text-vynal-text-primary">Transferts internationaux</h2>
        <p className="text-sm md:text-base text-slate-600 dark:text-vynal-text-secondary">
          Vynal Platform opère à l'échelle mondiale, et vos informations peuvent être transférées et traitées dans des pays autres 
          que celui où vous résidez. Ces pays peuvent avoir des lois différentes sur la protection des données par rapport à votre pays. 
          Lorsque nous transférons vos informations, nous prenons des mesures pour assurer qu'elles bénéficient d'un niveau de protection 
          adéquat, conformément à cette politique de confidentialité et aux lois applicables.
        </p>
        
        <h2 className="text-lg md:text-xl font-semibold mt-6 md:mt-8 mb-3 md:mb-4 text-slate-800 dark:text-vynal-text-primary">Enfants</h2>
        <p className="text-sm md:text-base text-slate-600 dark:text-vynal-text-secondary">
          Nos Services ne s'adressent pas aux personnes de moins de 18 ans, et nous ne collectons pas sciemment des informations 
          personnelles de personnes de moins de 18 ans. Si nous apprenons que nous avons collecté des informations personnelles 
          d'une personne de moins de 18 ans, nous prendrons des mesures pour supprimer ces informations dès que possible.
        </p>
        
        <h2 className="text-lg md:text-xl font-semibold mt-6 md:mt-8 mb-3 md:mb-4 text-slate-800 dark:text-vynal-text-primary">Services de paiement tiers</h2>
        <p className="text-sm md:text-base text-slate-600 dark:text-vynal-text-secondary">
          Notre plateforme utilise plusieurs services de paiement tiers : PayPal, Stripe, Wave, Orange Money et Free Money. Lorsque vous effectuez un paiement via ces services ou que vous vous connectez avec votre compte PayPal, vous êtes soumis à leurs politiques de confidentialité et conditions d'utilisation respectives. Nous vous encourageons à consulter leurs politiques pour comprendre comment ils traitent vos informations personnelles.
        </p>
        <p className="text-sm md:text-base text-slate-600 dark:text-vynal-text-secondary">
          Lorsque vous utilisez PayPal sur notre plateforme :
        </p>
        <ul className="list-disc pl-4 md:pl-5 space-y-1 md:space-y-2 text-sm md:text-base">
          <li className="text-slate-600 dark:text-vynal-text-secondary">Nous recevons de PayPal uniquement votre nom et votre adresse email, qui sont nécessaires pour compléter la transaction et vérifier votre identité</li>
          <li className="text-slate-600 dark:text-vynal-text-secondary">PayPal peut collecter des informations supplémentaires sur votre appareil et vos habitudes de paiement pour prévenir la fraude</li>
          <li className="text-slate-600 dark:text-vynal-text-secondary">Nous n'avons pas accès à vos identifiants de connexion PayPal ni à l'intégralité de vos informations de paiement</li>
        </ul>
        <p className="text-sm md:text-base text-slate-600 dark:text-vynal-text-secondary">
          Lorsque vous utilisez Stripe pour les paiements par carte bancaire :
        </p>
        <ul className="list-disc pl-4 md:pl-5 space-y-1 md:space-y-2 text-sm md:text-base">
          <li className="text-slate-600 dark:text-vynal-text-secondary">Toutes les informations de carte bancaire sont traitées directement par Stripe et ne sont jamais stockées sur nos serveurs</li>
          <li className="text-slate-600 dark:text-vynal-text-secondary">Nous ne recevons que les informations nécessaires pour confirmer la transaction (statut, montant, date)</li>
          <li className="text-slate-600 dark:text-vynal-text-secondary">Stripe est certifié PCI DSS niveau 1, le niveau de sécurité le plus élevé pour le traitement des paiements par carte</li>
        </ul>
        <p className="text-sm md:text-base text-slate-600 dark:text-vynal-text-secondary">
          Lorsque vous utilisez Wave, Orange Money ou Free Money :
        </p>
        <ul className="list-disc pl-4 md:pl-5 space-y-1 md:space-y-2 text-sm md:text-base">
          <li className="text-slate-600 dark:text-vynal-text-secondary">Toutes les informations de paiement sont traitées directement par ces services et ne sont jamais stockées sur nos serveurs</li>
          <li className="text-slate-600 dark:text-vynal-text-secondary">Nous ne recevons que les informations nécessaires pour confirmer la transaction (statut, montant, date)</li>
          <li className="text-slate-600 dark:text-vynal-text-secondary">Ces services sont réglementés et sécurisés conformément aux normes en vigueur au Sénégal</li>
        </ul>
        <p className="text-sm md:text-base text-slate-600 dark:text-vynal-text-secondary">
          Pour plus d'informations sur la façon dont ces services traitent vos données, veuillez consulter :
        </p>
        <ul className="list-disc pl-4 md:pl-5 space-y-1 md:space-y-2 text-xs md:text-sm">
          <li className="text-slate-600 dark:text-vynal-text-secondary"><a href="https://www.paypal.com/fr/webapps/mpp/ua/privacy-full" target="_blank" rel="noopener noreferrer" className="text-vynal-accent-primary hover:underline transition-all duration-200 hover:text-vynal-accent-secondary">Politique de confidentialité de PayPal</a></li>
          <li className="text-slate-600 dark:text-vynal-text-secondary"><a href="https://stripe.com/fr/privacy" target="_blank" rel="noopener noreferrer" className="text-vynal-accent-primary hover:underline transition-all duration-200 hover:text-vynal-accent-secondary">Politique de confidentialité de Stripe</a></li>
          <li className="text-slate-600 dark:text-vynal-text-secondary"><a href="https://www.wave.com/fr/privacy/" target="_blank" rel="noopener noreferrer" className="text-vynal-accent-primary hover:underline transition-all duration-200 hover:text-vynal-accent-secondary">Politique de confidentialité de Wave</a></li>
          <li className="text-slate-600 dark:text-vynal-text-secondary"><a href="https://www.orange.sn/actualite/informations-legales" target="_blank" rel="noopener noreferrer" className="text-vynal-accent-primary hover:underline transition-all duration-200 hover:text-vynal-accent-secondary">Politique de confidentialité d'Orange Money</a></li>
          <li className="text-slate-600 dark:text-vynal-text-secondary"><a href="https://www.yas.sn/wp-content/uploads/2024/11/CGU_CLIENT-BPA-1.pdf" target="_blank" rel="noopener noreferrer" className="text-vynal-accent-primary hover:underline transition-all duration-200 hover:text-vynal-accent-secondary">Politique de confidentialité de Free Money</a></li>
        </ul>
        <h2 className="text-lg md:text-xl font-semibold mt-6 md:mt-8 mb-3 md:mb-4 text-slate-800 dark:text-vynal-text-primary">Modifications de cette politique</h2>
        <p className="text-sm md:text-base text-slate-600 dark:text-vynal-text-secondary">
          Nous pouvons modifier cette politique de confidentialité de temps à autre. Si nous apportons des modifications importantes, 
          nous vous en informerons par e-mail, par notification sur notre site web, ou par tout autre moyen approprié. Nous vous 
          encourageons à consulter régulièrement cette politique pour rester informé de nos pratiques en matière de confidentialité.
        </p>
        
        <h2 className="text-lg md:text-xl font-semibold mt-6 md:mt-8 mb-3 md:mb-4 text-slate-800 dark:text-vynal-text-primary">Nous contacter</h2>
        <p className="text-sm md:text-base text-slate-600 dark:text-vynal-text-secondary">
          Si vous avez des questions, des préoccupations ou des demandes concernant cette politique de confidentialité ou nos pratiques 
          en matière de données, veuillez nous contacter à :
        </p>
        <p className="mt-2 text-sm md:mt-4 text-slate-600 dark:text-vynal-text-secondary">
          <strong className="text-slate-700 dark:text-vynal-text-primary">Vynal Platform</strong><br />
          E-mail : support@vynalplatform.com<br />
          Adresse : Dakar, Sénégal
        </p>
        
        <p className="mt-6 md:mt-8 text-xs md:text-sm text-slate-600 dark:text-vynal-text-secondary">
          Si vous n'êtes pas satisfait de notre réponse, vous pouvez également contacter l'autorité de protection des données de votre pays.
        </p>
        
        <div className="mt-6 md:mt-8 p-3 md:p-4 bg-white/40 dark:bg-slate-800/40 rounded-lg border border-slate-200/50 dark:border-slate-700/20 transition-all duration-200">
          <p className="text-xs md:text-sm text-slate-600 dark:text-vynal-text-secondary">
            <strong className="text-slate-700 dark:text-vynal-text-primary">Documents complémentaires :</strong>
          </p>
          <ul className="list-disc pl-4 md:pl-5 mt-2 text-xs md:text-sm space-y-1">
            <li><a href="/terms-of-service" className="text-vynal-accent-primary hover:underline transition-all duration-200">Conditions d'utilisation</a></li>
            <li><a href="/code-of-conduct" className="text-vynal-accent-primary hover:underline transition-all duration-200">Code de conduite</a></li>
            <li><a href="/withdrawal-terms" className="text-vynal-accent-primary hover:underline transition-all duration-200">Conditions de retrait</a></li>
          </ul>
        </div>
      </div>
    </div>
  );
} 