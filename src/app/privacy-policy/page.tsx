import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Politique de confidentialité | Vynal Platform",
  description: "Politique de confidentialité de la plateforme Vynal",
};

export default function PrivacyPolicy() {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-center mb-8">Politique de confidentialité</h1>
      
      <div className="prose prose-lg mx-auto">
        <p className="text-sm text-gray-500 mb-8">
          Dernière mise à jour : {new Date().toLocaleDateString()}
        </p>
        
        <h2 className="text-xl font-semibold mt-8 mb-4">Introduction</h2>
        <p>
          Chez Vynal Platform, nous accordons une importance capitale à la protection de votre vie privée et de vos données personnelles. 
          Cette politique de confidentialité explique comment nous collectons, utilisons, partageons et protégeons vos informations 
          lorsque vous utilisez notre plateforme, nos services, et notre site web (collectivement désignés comme les "Services").
        </p>
        <p>
          En utilisant nos Services, vous acceptez les pratiques décrites dans cette politique de confidentialité. 
          Si vous n'acceptez pas cette politique, veuillez ne pas utiliser nos Services.
        </p>
        
        <h2 className="text-xl font-semibold mt-8 mb-4">Informations que nous collectons</h2>
        <p>Nous collectons les types d'informations suivants :</p>
        
        <h3 className="text-lg font-medium mt-6 mb-3">Informations que vous nous fournissez</h3>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>Informations de compte</strong> : Lorsque vous créez un compte, nous collectons votre nom, adresse e-mail, mot de passe, numéro de téléphone, et votre rôle (client ou freelance).</li>
          <li><strong>Informations de profil</strong> : Pour les freelances, nous collectons des informations sur vos compétences, expérience, éducation, portfolio, et tarifs. Pour les clients, nous collectons des informations sur votre entreprise ou vos besoins en services.</li>
          <li><strong>Informations de paiement</strong> : Nous collectons vos informations de paiement lorsque vous effectuez une transaction sur notre plateforme. Ces informations peuvent inclure votre nom, numéro de carte, date d'expiration, code CVV, adresse de facturation, coordonnées bancaires pour les virements, et informations des portefeuilles mobiles (Wave, Orange Money, Free Money) pour les retraits.</li>
          <li><strong>Historique des transactions</strong> : Nous conservons un historique complet de vos transactions, y compris les paiements reçus, les retraits effectués, les dates, montants, frais appliqués, et méthodes de paiement utilisées.</li>
          <li><strong>Communications</strong> : Nous conservons les messages que vous échangez avec d'autres utilisateurs via notre système de messagerie, ainsi que vos communications avec notre service client.</li>
          <li><strong>Contenu généré</strong> : Nous collectons le contenu que vous créez, téléchargez ou partagez sur notre plateforme, comme les descriptions de services, les livrables, les commentaires et les évaluations.</li>
        </ul>
        
        <h3 className="text-lg font-medium mt-6 mb-3">Informations collectées automatiquement</h3>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>Informations d'utilisation</strong> : Nous collectons des informations sur la façon dont vous utilisez nos Services, notamment les pages visitées, les fonctionnalités utilisées, les actions effectuées, et le temps passé sur la plateforme.</li>
          <li><strong>Informations sur l'appareil</strong> : Nous collectons des informations sur l'appareil que vous utilisez pour accéder à nos Services, y compris le modèle, le système d'exploitation, l'identifiant unique, et le navigateur.</li>
          <li><strong>Informations de localisation</strong> : Avec votre permission, nous pouvons collecter des informations sur votre localisation précise. Vous pouvez désactiver cette fonction dans les paramètres de votre appareil.</li>
          <li><strong>Cookies et technologies similaires</strong> : Nous utilisons des cookies et des technologies similaires pour collecter des informations sur votre navigation, vos préférences, et votre interaction avec nos Services.</li>
        </ul>
        
        <h3 className="text-lg font-medium mt-6 mb-3">Informations provenant d'autres sources</h3>
        <p>
          Nous pouvons obtenir des informations vous concernant à partir d'autres sources, notamment :
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Des services d'authentification tiers lorsque vous vous connectez via ces services (comme Google)</li>
          <li>Des partenaires commerciaux, comme les services de paiement</li>
          <li>Des sources accessibles au public, comme les réseaux sociaux professionnels</li>
        </ul>
        
        <h2 className="text-xl font-semibold mt-8 mb-4">Comment nous utilisons vos informations</h2>
        <p>Nous utilisons vos informations pour les finalités suivantes :</p>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>Fournir nos Services</strong> : Pour créer et gérer votre compte, faciliter les transactions, traiter les paiements et les retraits, et vous permettre de communiquer avec d'autres utilisateurs.</li>
          <li><strong>Traitement des retraits</strong> : Pour vérifier votre identité, traiter vos demandes de retrait, appliquer les frais de service (20%), et transférer les fonds vers votre méthode de paiement choisie.</li>
          <li><strong>Personnaliser votre expérience</strong> : Pour vous recommander des services ou des freelances pertinents, personnaliser votre interface, et mémoriser vos préférences.</li>
          <li><strong>Améliorer nos Services</strong> : Pour analyser comment nos Services sont utilisés, identifier les tendances d'utilisation, résoudre les problèmes techniques, et développer de nouvelles fonctionnalités.</li>
          <li><strong>Communiquer avec vous</strong> : Pour vous envoyer des confirmations, des notifications, des mises à jour sur nos Services, et des informations sur les nouvelles fonctionnalités ou offres.</li>
          <li><strong>Marketing et publicité</strong> : Pour vous envoyer des communications marketing et afficher des publicités pertinentes, sous réserve de vos préférences de communication.</li>
          <li><strong>Sécurité et protection</strong> : Pour détecter, prévenir et traiter les activités frauduleuses, les abus, les violations de sécurité, et les problèmes techniques.</li>
          <li><strong>Obligations légales</strong> : Pour respecter les lois, réglementations, et procédures judiciaires applicables, y compris les réglementations financières et fiscales.</li>
        </ul>
        
        <h2 className="text-xl font-semibold mt-8 mb-4">Comment nous partageons vos informations</h2>
        <p>Nous pouvons partager vos informations avec les catégories suivantes de destinataires :</p>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>Autres utilisateurs</strong> : Certaines de vos informations sont partagées avec d'autres utilisateurs dans le cadre de l'utilisation normale de la plateforme, comme votre profil, vos évaluations, et vos communications.</li>
          <li><strong>Prestataires de services</strong> : Nous partageons des informations avec des prestataires de services tiers qui nous aident à fournir et améliorer nos Services, comme les services d'hébergement, de paiement, d'analyse, et de support client.</li>
          <li><strong>Partenaires commerciaux</strong> : Nous pouvons partager des informations avec nos partenaires commerciaux pour des offres conjointes, des promotions, ou d'autres collaborations.</li>
          <li><strong>Conformité légale</strong> : Nous pouvons divulguer des informations si nous estimons de bonne foi que cela est nécessaire pour se conformer à la loi, protéger nos droits ou la sécurité de nos utilisateurs, ou détecter et prévenir les fraudes.</li>
          <li><strong>Transactions d'entreprise</strong> : Si Vynal Platform est impliqué dans une fusion, acquisition, ou vente d'actifs, vos informations peuvent être transférées dans le cadre de cette transaction.</li>
        </ul>
        <p>
          Nous ne vendons pas vos informations personnelles à des tiers.
        </p>
        
        <h2 className="text-xl font-semibold mt-8 mb-4">Vos droits et choix</h2>
        <p>Selon votre juridiction, vous pouvez avoir certains droits concernant vos données personnelles :</p>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>Accès et portabilité</strong> : Vous pouvez demander une copie de vos données personnelles que nous détenons et les recevoir dans un format structuré.</li>
          <li><strong>Rectification</strong> : Vous pouvez mettre à jour ou corriger vos données personnelles via les paramètres de votre compte ou en nous contactant.</li>
          <li><strong>Suppression</strong> : Vous pouvez demander la suppression de vos données personnelles dans certaines circonstances.</li>
          <li><strong>Opposition et limitation</strong> : Vous pouvez vous opposer au traitement de vos données personnelles ou demander la limitation de ce traitement.</li>
          <li><strong>Consentement</strong> : Lorsque nous traitons vos données sur la base de votre consentement, vous pouvez retirer ce consentement à tout moment.</li>
          <li><strong>Paramètres de communication</strong> : Vous pouvez gérer vos préférences de communication marketing dans les paramètres de votre compte ou en vous désabonnant via les liens fournis dans nos e-mails.</li>
          <li><strong>Paramètres des cookies</strong> : Vous pouvez gérer vos préférences concernant les cookies via notre bandeau de cookies ou les paramètres de votre navigateur.</li>
        </ul>
        <p>
          Pour exercer ces droits, veuillez nous contacter à support@vynalplatform.com.
        </p>
        
        <h2 className="text-xl font-semibold mt-8 mb-4">Sécurité des données</h2>
        <p>
          Nous mettons en œuvre des mesures de sécurité techniques, administratives et physiques appropriées pour protéger vos informations 
          contre la perte, le vol, l'utilisation abusive, l'accès non autorisé, la divulgation, l'altération et la destruction. 
          Ces mesures comprennent le chiffrement des données, les contrôles d'accès, les pare-feu, et les audits de sécurité réguliers.
        </p>
        <p>
          Cependant, aucun système de sécurité n'est impénétrable et nous ne pouvons garantir la sécurité absolue de vos informations. 
          Vous êtes responsable de maintenir la confidentialité de vos identifiants de connexion et de nous informer de toute utilisation 
          non autorisée de votre compte.
        </p>
        
        <h2 className="text-xl font-semibold mt-8 mb-4">Conservation des données</h2>
        <p>
          Nous conservons vos informations aussi longtemps que nécessaire pour fournir nos Services, respecter nos obligations légales, 
          résoudre les litiges, et faire respecter nos accords. Les critères utilisés pour déterminer notre période de conservation 
          comprennent :
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li>La durée pendant laquelle vous avez un compte actif sur notre plateforme</li>
          <li>Si vous avez des transactions ou commandes en cours</li>
          <li>Nos obligations légales et réglementaires</li>
          <li>Les périodes de prescription applicables pour les réclamations légales potentielles</li>
        </ul>
        <p>
          Pour les données de transactions financières, notamment les retraits et paiements, nous conservons ces informations pendant une durée minimale de 5 ans conformément aux réglementations financières et fiscales en vigueur au Sénégal. Ces informations incluent les détails des méthodes de paiement utilisées, les montants, les frais appliqués, et les dates des transactions.
        </p>
        
        <h2 className="text-xl font-semibold mt-8 mb-4">Conformité réglementaire</h2>
        <p>
          Vynal Platform se conforme aux lois et réglementations applicables en matière de transactions financières, notamment :
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Les réglementations relatives à la lutte contre le blanchiment d'argent (LCB-FT)</li>
          <li>Les obligations de vérification d'identité pour les transactions dépassant certains seuils</li>
          <li>Les exigences de conservation des données financières</li>
          <li>Les obligations fiscales et déclarations requises</li>
        </ul>
        <p>
          Conformément à ces réglementations, nous pouvons être amenés à demander des informations supplémentaires pour vérifier votre identité ou à signaler certaines transactions aux autorités compétentes lorsque cela est légalement requis.
        </p>
        
        <h2 className="text-xl font-semibold mt-8 mb-4">Transferts internationaux</h2>
        <p>
          Vynal Platform opère à l'échelle mondiale, et vos informations peuvent être transférées et traitées dans des pays autres 
          que celui où vous résidez. Ces pays peuvent avoir des lois différentes sur la protection des données par rapport à votre pays. 
          Lorsque nous transférons vos informations, nous prenons des mesures pour assurer qu'elles bénéficient d'un niveau de protection 
          adéquat, conformément à cette politique de confidentialité et aux lois applicables.
        </p>
        
        <h2 className="text-xl font-semibold mt-8 mb-4">Enfants</h2>
        <p>
          Nos Services ne s'adressent pas aux personnes de moins de 18 ans, et nous ne collectons pas sciemment des informations 
          personnelles de personnes de moins de 18 ans. Si nous apprenons que nous avons collecté des informations personnelles 
          d'une personne de moins de 18 ans, nous prendrons des mesures pour supprimer ces informations dès que possible.
        </p>
        
        <h2 className="text-xl font-semibold mt-8 mb-4">Modifications de cette politique</h2>
        <p>
          Nous pouvons modifier cette politique de confidentialité de temps à autre. Si nous apportons des modifications importantes, 
          nous vous en informerons par e-mail, par notification sur notre site web, ou par tout autre moyen approprié. Nous vous 
          encourageons à consulter régulièrement cette politique pour rester informé de nos pratiques en matière de confidentialité.
        </p>
        
        <h2 className="text-xl font-semibold mt-8 mb-4">Nous contacter</h2>
        <p>
          Si vous avez des questions, des préoccupations ou des demandes concernant cette politique de confidentialité ou nos pratiques 
          en matière de données, veuillez nous contacter à :
        </p>
        <p className="mt-2">
          <strong>Vynal Platform</strong><br />
          E-mail : support@vynalplatform.com<br />
          Adresse : Dakar, Sénégal
        </p>
        
        <p className="mt-8 text-sm">
          Si vous n'êtes pas satisfait de notre réponse, vous pouvez également contacter l'autorité de protection des données de votre pays.
        </p>
        
        <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-sm">
            <strong>Documents complémentaires :</strong>
          </p>
          <ul className="list-disc pl-5 mt-2 text-sm space-y-1">
            <li><a href="/terms-of-service" className="text-indigo-600 hover:underline">Conditions d'utilisation</a></li>
            <li><a href="/withdrawal-terms" className="text-indigo-600 hover:underline">Conditions de retrait</a></li>
          </ul>
        </div>
      </div>
    </div>
  );
} 