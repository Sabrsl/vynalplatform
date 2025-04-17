import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Protection des données | Vynal Platform",
  description: "Informations sur la protection des données et le RGPD sur la plateforme Vynal",
};

export default function DataProtection() {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-center mb-8">Protection des données</h1>
      
      <div className="prose prose-lg mx-auto">
        <p className="text-sm text-gray-500 mb-8">
          Dernière mise à jour : {new Date().toLocaleDateString()}
        </p>
        
        <h2 className="text-xl font-semibold mt-8 mb-4">Introduction</h2>
        <p>
          Chez Vynal Platform, nous sommes pleinement engagés à protéger vos données personnelles et à respecter votre vie privée.
          Ce document de protection des données explique en détail comment nous nous conformons au Règlement Général sur la 
          Protection des Données (RGPD) et aux autres lois applicables en matière de protection des données.
        </p>
        
        <h2 className="text-xl font-semibold mt-8 mb-4">Responsable du traitement</h2>
        <p>
          Vynal Platform est le responsable du traitement de vos données personnelles collectées via notre plateforme.
          Nos coordonnées complètes sont :
        </p>
        <p className="mt-2">
          <strong>Vynal Platform</strong><br />
          Adresse : [Adresse postale de l'entreprise]<br />
          E-mail : dpo@vynal.com<br />
          Téléphone : [Numéro de téléphone]
        </p>
        
        <h2 className="text-xl font-semibold mt-8 mb-4">Délégué à la protection des données (DPO)</h2>
        <p>
          Nous avons nommé un Délégué à la Protection des Données (DPO) que vous pouvez contacter pour toute question 
          relative au traitement de vos données personnelles ou à l'exercice de vos droits en vertu du RGPD :
        </p>
        <p className="mt-2">
          <strong>Délégué à la Protection des Données</strong><br />
          E-mail : dpo@vynal.com<br />
          Adresse : [Adresse postale du DPO, si différente]
        </p>
        
        <h2 className="text-xl font-semibold mt-8 mb-4">Principes de protection des données</h2>
        <p>Nous nous engageons à traiter vos données personnelles conformément aux principes suivants :</p>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>Licéité, loyauté et transparence</strong> : Nous traitons vos données de manière licite, loyale et transparente.</li>
          <li><strong>Limitation des finalités</strong> : Nous collectons vos données pour des finalités déterminées, explicites et légitimes.</li>
          <li><strong>Minimisation des données</strong> : Nous limitons la collecte de données à ce qui est nécessaire pour les finalités poursuivies.</li>
          <li><strong>Exactitude</strong> : Nous prenons des mesures raisonnables pour que vos données soient exactes et tenues à jour.</li>
          <li><strong>Limitation de la conservation</strong> : Nous conservons vos données pendant une durée limitée et appropriée.</li>
          <li><strong>Intégrité et confidentialité</strong> : Nous mettons en place des mesures techniques et organisationnelles pour protéger vos données.</li>
          <li><strong>Responsabilité</strong> : Nous sommes en mesure de démontrer notre conformité à ces principes.</li>
        </ul>
        
        <h2 className="text-xl font-semibold mt-8 mb-4">Base juridique du traitement</h2>
        <p>
          Nous traitons vos données personnelles sur la base des fondements juridiques suivants :
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>Exécution d'un contrat</strong> : Le traitement est nécessaire à l'exécution du contrat auquel vous êtes partie ou à l'exécution de mesures précontractuelles prises à votre demande.</li>
          <li><strong>Obligation légale</strong> : Le traitement est nécessaire au respect d'une obligation légale à laquelle nous sommes soumis.</li>
          <li><strong>Intérêts légitimes</strong> : Le traitement est nécessaire aux fins des intérêts légitimes poursuivis par nous ou par un tiers, à moins que ne prévalent vos intérêts ou libertés et droits fondamentaux.</li>
          <li><strong>Consentement</strong> : Vous avez consenti au traitement de vos données personnelles pour une ou plusieurs finalités spécifiques.</li>
        </ul>
        
        <h2 className="text-xl font-semibold mt-8 mb-4">Catégories de données traitées</h2>
        <p>
          Nous traitons les catégories suivantes de données personnelles :
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>Données d'identification</strong> : Nom, prénom, adresse e-mail, numéro de téléphone, adresse postale, etc.</li>
          <li><strong>Données de compte</strong> : Identifiant, mot de passe (crypté), préférences de compte, etc.</li>
          <li><strong>Données professionnelles</strong> : CV, compétences, expérience, éducation, portfolio (pour les freelances).</li>
          <li><strong>Données financières</strong> : Informations de paiement, historique des transactions, coordonnées bancaires, etc.</li>
          <li><strong>Données de communication</strong> : Messages échangés via notre système de messagerie, communications avec notre service client.</li>
          <li><strong>Données d'utilisation</strong> : Informations sur la façon dont vous utilisez notre plateforme, préférences, etc.</li>
          <li><strong>Données techniques</strong> : Adresse IP, type et version du navigateur, système d'exploitation, etc.</li>
        </ul>
        
        <h2 className="text-xl font-semibold mt-8 mb-4">Finalités du traitement</h2>
        <p>
          Nous traitons vos données personnelles pour les finalités suivantes :
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Créer et gérer votre compte utilisateur</li>
          <li>Faciliter la mise en relation entre clients et freelances</li>
          <li>Traiter les paiements et gérer les transactions</li>
          <li>Fournir un support client et répondre à vos demandes</li>
          <li>Améliorer et personnaliser nos services</li>
          <li>Assurer la sécurité de notre plateforme et prévenir la fraude</li>
          <li>Résoudre les litiges et faire respecter nos conditions d'utilisation</li>
          <li>Respecter nos obligations légales et réglementaires</li>
          <li>Vous envoyer des communications marketing (avec votre consentement)</li>
        </ul>
        
        <h2 className="text-xl font-semibold mt-8 mb-4">Destinataires des données</h2>
        <p>
          Vos données personnelles peuvent être partagées avec les destinataires suivants :
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>Autres utilisateurs</strong> : Certaines de vos données sont partagées avec d'autres utilisateurs dans le cadre de l'utilisation normale de la plateforme.</li>
          <li><strong>Sous-traitants</strong> : Prestataires de services qui traitent des données pour notre compte (hébergement, paiement, analyse, etc.).</li>
          <li><strong>Partenaires commerciaux</strong> : Dans le cadre de collaborations spécifiques et avec votre consentement lorsque cela est requis.</li>
          <li><strong>Autorités publiques</strong> : Lorsque la divulgation est requise par la loi ou dans le cadre d'une procédure judiciaire.</li>
        </ul>
        <p>
          Tous nos sous-traitants et partenaires sont tenus de respecter la confidentialité et la sécurité de vos données 
          conformément au RGPD et aux contrats que nous avons conclus avec eux.
        </p>
        
        <h2 className="text-xl font-semibold mt-8 mb-4">Transferts internationaux de données</h2>
        <p>
          Certaines de vos données personnelles peuvent être transférées vers des pays situés en dehors de l'Espace Économique 
          Européen (EEE). Dans ce cas, nous prenons les mesures appropriées pour garantir que vos données bénéficient d'un 
          niveau de protection adéquat, notamment :
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Transfert vers des pays reconnus par la Commission européenne comme offrant un niveau de protection adéquat</li>
          <li>Utilisation des clauses contractuelles types approuvées par la Commission européenne</li>
          <li>Mise en œuvre de garanties appropriées conformément au RGPD</li>
        </ul>
        <p>
          Vous pouvez obtenir une copie de ces garanties en contactant notre Délégué à la Protection des Données.
        </p>
        
        <h2 className="text-xl font-semibold mt-8 mb-4">Durée de conservation des données</h2>
        <p>
          Nous conservons vos données personnelles aussi longtemps que nécessaire pour atteindre les finalités pour lesquelles 
          elles ont été collectées, sauf si une période de conservation plus longue est requise ou autorisée par la loi.
        </p>
        <p>
          Les critères utilisés pour déterminer nos durées de conservation comprennent :
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li>La période pendant laquelle vous avez un compte actif sur notre plateforme</li>
          <li>Les obligations légales auxquelles nous sommes soumis (obligations fiscales, comptables, etc.)</li>
          <li>Les délais de prescription applicables en cas de litiges potentiels</li>
          <li>Les recommandations des autorités de protection des données</li>
        </ul>
        
        <h2 className="text-xl font-semibold mt-8 mb-4">Vos droits en matière de protection des données</h2>
        <p>
          Conformément au RGPD, vous disposez des droits suivants concernant vos données personnelles :
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>Droit d'accès</strong> : Vous avez le droit d'obtenir la confirmation que vos données sont traitées et d'accéder à ces données.</li>
          <li><strong>Droit de rectification</strong> : Vous avez le droit de faire rectifier vos données inexactes ou incomplètes.</li>
          <li><strong>Droit à l'effacement</strong> : Vous avez le droit de demander l'effacement de vos données dans certaines circonstances.</li>
          <li><strong>Droit à la limitation du traitement</strong> : Vous avez le droit de demander la limitation du traitement de vos données dans certaines circonstances.</li>
          <li><strong>Droit à la portabilité</strong> : Vous avez le droit de recevoir vos données dans un format structuré et de les transmettre à un autre responsable du traitement.</li>
          <li><strong>Droit d'opposition</strong> : Vous avez le droit de vous opposer au traitement de vos données dans certaines circonstances, notamment pour le marketing direct.</li>
          <li><strong>Droit de retirer votre consentement</strong> : Vous avez le droit de retirer votre consentement à tout moment lorsque le traitement est basé sur votre consentement.</li>
          <li><strong>Droit de ne pas faire l'objet d'une décision automatisée</strong> : Vous avez le droit de ne pas faire l'objet d'une décision fondée exclusivement sur un traitement automatisé, y compris le profilage, produisant des effets juridiques vous concernant ou vous affectant de manière significative.</li>
        </ul>
        <p>
          Pour exercer ces droits, veuillez contacter notre Délégué à la Protection des Données à l'adresse e-mail indiquée ci-dessus.
        </p>
        
        <h2 className="text-xl font-semibold mt-8 mb-4">Droit d'introduire une réclamation</h2>
        <p>
          Si vous estimez que le traitement de vos données personnelles constitue une violation du RGPD, vous avez le droit 
          d'introduire une réclamation auprès d'une autorité de contrôle, en particulier dans l'État membre de votre résidence 
          habituelle, de votre lieu de travail ou du lieu où la violation aurait été commise.
        </p>
        <p>
          Pour la France, l'autorité de contrôle est la Commission Nationale de l'Informatique et des Libertés (CNIL) :
        </p>
        <p className="mt-2">
          <strong>CNIL</strong><br />
          3 Place de Fontenoy<br />
          TSA 80715<br />
          75334 PARIS CEDEX 07<br />
          Tél : 01 53 73 22 22<br />
          Site web : <a href="https://www.cnil.fr" className="text-blue-600 hover:underline">www.cnil.fr</a>
        </p>
        
        <h2 className="text-xl font-semibold mt-8 mb-4">Sécurité des données</h2>
        <p>
          Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour assurer un niveau de sécurité 
          adapté au risque, notamment :
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Le chiffrement des données sensibles</li>
          <li>Des moyens permettant de garantir la confidentialité, l'intégrité, la disponibilité et la résilience des systèmes</li>
          <li>Des procédures pour tester, analyser et évaluer régulièrement l'efficacité des mesures de sécurité</li>
          <li>Des mesures pour restaurer rapidement la disponibilité des données en cas d'incident</li>
          <li>Une formation régulière du personnel sur les questions de protection des données</li>
        </ul>
        
        <h2 className="text-xl font-semibold mt-8 mb-4">Analyse d'impact relative à la protection des données (AIPD)</h2>
        <p>
          Lorsqu'un type de traitement est susceptible d'engendrer un risque élevé pour vos droits et libertés, 
          nous effectuons une analyse d'impact relative à la protection des données avant de commencer le traitement.
        </p>
        
        <h2 className="text-xl font-semibold mt-8 mb-4">Violation de données</h2>
        <p>
          En cas de violation de données à caractère personnel, nous notifierons l'autorité de contrôle compétente 
          dans les 72 heures après en avoir pris connaissance, à moins que la violation ne présente pas de risque pour 
          vos droits et libertés.
        </p>
        <p>
          Si la violation est susceptible d'engendrer un risque élevé pour vos droits et libertés, nous vous en informerons 
          également dans les meilleurs délais, sauf si des mesures appropriées ont été prises pour protéger vos données.
        </p>
        
        <h2 className="text-xl font-semibold mt-8 mb-4">Modifications de cette notice</h2>
        <p>
          Nous pouvons modifier cette notice de protection des données de temps à autre pour refléter les changements 
          dans nos pratiques ou pour d'autres raisons opérationnelles, légales ou réglementaires. Nous vous encourageons 
          à consulter régulièrement cette notice pour rester informé de la façon dont nous protégeons vos données.
        </p>
        <p>
          En cas de modifications importantes, nous vous en informerons par e-mail ou par une notification sur notre plateforme.
        </p>
        
        <p className="mt-8 text-sm">
          Dernière mise à jour : {new Date().toLocaleDateString()}
        </p>
      </div>
    </div>
  );
} 