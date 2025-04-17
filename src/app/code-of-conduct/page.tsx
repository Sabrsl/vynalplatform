import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Code de conduite | Vynal Platform",
  description: "Code de conduite de la plateforme Vynal",
};

export default function CodeOfConduct() {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-center mb-8">Code de conduite</h1>
      
      <div className="prose prose-lg mx-auto">
        <h2 className="text-xl font-semibold mt-8 mb-4">Introduction</h2>
        <p>
          Bienvenue sur Vynal Platform. Notre mission est de créer un environnement en ligne sûr, respectueux et productif 
          où les clients et les freelances peuvent collaborer efficacement. Ce code de conduite établit les normes de 
          comportement auxquelles nous nous attendons de la part de tous les utilisateurs de notre plateforme.
        </p>
        
        <h2 className="text-xl font-semibold mt-8 mb-4">Nos valeurs fondamentales</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>Respect mutuel</strong> : Traitez tous les utilisateurs avec respect et dignité, indépendamment de leur origine, identité ou opinions.</li>
          <li><strong>Intégrité professionnelle</strong> : Agissez avec honnêteté et transparence dans toutes vos interactions.</li>
          <li><strong>Excellence</strong> : Visez l'excellence dans votre travail et vos communications.</li>
          <li><strong>Inclusion</strong> : Valorisez la diversité et créez un environnement accueillant pour tous.</li>
        </ul>
        
        <h2 className="text-xl font-semibold mt-8 mb-4">Comportements attendus</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>Communiquer de manière professionnelle et respectueuse</li>
          <li>Fournir des descriptions précises et honnêtes de vos services (freelances)</li>
          <li>Définir clairement vos attentes et exigences (clients)</li>
          <li>Respecter les délais convenus et communiquer rapidement en cas de problème</li>
          <li>Fournir des commentaires constructifs et respectueux</li>
          <li>Respecter la propriété intellectuelle d'autrui</li>
          <li>Signaler les comportements inappropriés à l'équipe Vynal</li>
        </ul>
        
        <h2 className="text-xl font-semibold mt-8 mb-4">Comportements inacceptables</h2>
        <p>Les comportements suivants sont strictement interdits sur Vynal Platform :</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Harcèlement, discrimination ou intimidation sous toutes leurs formes</li>
          <li>Langage ou contenu offensant, abusif ou inapproprié</li>
          <li>Publication de contenu frauduleux, trompeur ou mensonger</li>
          <li>Utilisation de la plateforme pour des activités illégales</li>
          <li>Spam, sollicitation non désirée ou marketing agressif</li>
          <li>Usurpation d'identité ou fausse représentation</li>
          <li>Toute forme de manipulation du système d'évaluation</li>
          <li>Divulgation non autorisée d'informations confidentielles</li>
        </ul>
        
        <h2 className="text-xl font-semibold mt-8 mb-4">Résolution des conflits</h2>
        <p>
          En cas de désaccord ou de conflit avec un autre utilisateur, nous vous encourageons à :
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Communiquer ouvertement et respectueusement pour résoudre le problème</li>
          <li>Utiliser le système de messagerie intégré pour garder une trace des communications</li>
          <li>Si nécessaire, utiliser notre système de gestion des litiges</li>
          <li>Contacter notre service client si vous ne parvenez pas à résoudre le problème</li>
        </ul>
        
        <h2 className="text-xl font-semibold mt-8 mb-4">Conséquences des infractions</h2>
        <p>
          Les violations de ce code de conduite peuvent entraîner diverses conséquences, selon la gravité et la fréquence :
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Avertissement formel</li>
          <li>Suspension temporaire de certains privilèges</li>
          <li>Restriction d'accès à certaines fonctionnalités</li>
          <li>Suspension temporaire du compte</li>
          <li>Résiliation permanente du compte</li>
        </ul>
        
        <h2 className="text-xl font-semibold mt-8 mb-4">Signalement</h2>
        <p>
          Si vous êtes témoin d'un comportement qui enfreint ce code de conduite, veuillez le signaler immédiatement :
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li>En utilisant la fonction "Signaler" disponible sur la plateforme</li>
          <li>En contactant notre équipe Support à support@vynal.com</li>
          <li>Tous les signalements seront examinés rapidement et de manière confidentielle</li>
        </ul>
        
        <h2 className="text-xl font-semibold mt-8 mb-4">Modifications du code de conduite</h2>
        <p>
          Vynal Platform se réserve le droit de modifier ce code de conduite à tout moment. Les utilisateurs seront informés 
          des changements importants par e-mail et/ou notification sur la plateforme. L'utilisation continue de la plateforme 
          après modification du code de conduite constitue l'acceptation des nouvelles conditions.
        </p>
        
        <p className="mt-8">
          Dernière mise à jour : {new Date().toLocaleDateString()}
        </p>
      </div>
    </div>
  );
} 