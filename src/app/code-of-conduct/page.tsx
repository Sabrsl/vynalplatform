import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Code de conduite | Vynal Platform",
  description: "Code de conduite de la plateforme Vynal",
};

// Ajouter une configuration de mise en cache pour cette page statique
export const dynamic = 'force-static';
export const revalidate = 2592000; // 30 jours en secondes

export default function CodeOfConduct() {
  return (
    <div className="max-w-4xl mx-auto py-6 md:py-12 px-3 md:px-8 bg-white/30 dark:bg-slate-900/30 rounded-lg shadow-sm backdrop-blur-sm border border-slate-200 dark:border-slate-700/30">
      <h1 className="text-2xl md:text-3xl font-bold text-center mb-6 md:mb-8 text-slate-800 dark:text-vynal-text-primary">Code de conduite</h1>
      
      <div className="prose prose-sm md:prose-base lg:prose-lg mx-auto">
        <h2 className="text-lg md:text-xl font-semibold mt-6 md:mt-8 mb-3 md:mb-4 text-slate-800 dark:text-vynal-text-primary">Introduction</h2>
        <p className="text-sm md:text-base text-slate-600 dark:text-vynal-text-secondary">
          Bienvenue sur Vynal Platform. Notre mission est de créer un environnement en ligne sûr, respectueux et productif 
          où les clients et les freelances peuvent collaborer efficacement. Ce code de conduite établit les normes de 
          comportement auxquelles nous nous attendons de la part de tous les utilisateurs de notre plateforme.
        </p>
        
        <h2 className="text-lg md:text-xl font-semibold mt-6 md:mt-8 mb-3 md:mb-4 text-slate-800 dark:text-vynal-text-primary">Nos valeurs fondamentales</h2>
        <ul className="list-disc pl-4 md:pl-5 space-y-1 md:space-y-2 text-sm md:text-base">
          <li className="text-slate-600 dark:text-vynal-text-secondary"><strong className="text-slate-700 dark:text-vynal-text-primary">Respect mutuel</strong> : Traitez tous les utilisateurs avec respect et dignité, indépendamment de leur origine, identité ou opinions.</li>
          <li className="text-slate-600 dark:text-vynal-text-secondary"><strong className="text-slate-700 dark:text-vynal-text-primary">Intégrité professionnelle</strong> : Agissez avec honnêteté et transparence dans toutes vos interactions.</li>
          <li className="text-slate-600 dark:text-vynal-text-secondary"><strong className="text-slate-700 dark:text-vynal-text-primary">Excellence</strong> : Visez l'excellence dans votre travail et vos communications.</li>
          <li className="text-slate-600 dark:text-vynal-text-secondary"><strong className="text-slate-700 dark:text-vynal-text-primary">Inclusion</strong> : Valorisez la diversité et créez un environnement accueillant pour tous.</li>
        </ul>
        
        <h2 className="text-lg md:text-xl font-semibold mt-6 md:mt-8 mb-3 md:mb-4 text-slate-800 dark:text-vynal-text-primary">Comportements attendus</h2>
        <ul className="list-disc pl-4 md:pl-5 space-y-1 md:space-y-2 text-sm md:text-base">
          <li className="text-slate-600 dark:text-vynal-text-secondary">Communiquer de manière professionnelle et respectueuse</li>
          <li className="text-slate-600 dark:text-vynal-text-secondary">Fournir des descriptions précises et honnêtes de vos services (freelances)</li>
          <li className="text-slate-600 dark:text-vynal-text-secondary">Définir clairement vos attentes et exigences (clients)</li>
          <li className="text-slate-600 dark:text-vynal-text-secondary">Respecter les délais convenus et communiquer rapidement en cas de problème</li>
          <li className="text-slate-600 dark:text-vynal-text-secondary">Fournir des commentaires constructifs et respectueux</li>
          <li className="text-slate-600 dark:text-vynal-text-secondary">Respecter la propriété intellectuelle d'autrui</li>
          <li className="text-slate-600 dark:text-vynal-text-secondary">Signaler les comportements inappropriés à l'équipe Vynal</li>
        </ul>
        
        <h2 className="text-lg md:text-xl font-semibold mt-6 md:mt-8 mb-3 md:mb-4 text-slate-800 dark:text-vynal-text-primary">Comportements inacceptables</h2>
        <p className="text-sm md:text-base text-slate-600 dark:text-vynal-text-secondary">Les comportements suivants sont strictement interdits sur Vynal Platform :</p>
        <ul className="list-disc pl-4 md:pl-5 space-y-1 md:space-y-2 text-sm md:text-base">
          <li className="text-slate-600 dark:text-vynal-text-secondary">Harcèlement, discrimination ou intimidation sous toutes leurs formes</li>
          <li className="text-slate-600 dark:text-vynal-text-secondary">Langage ou contenu offensant, abusif ou inapproprié</li>
          <li className="text-slate-600 dark:text-vynal-text-secondary">Publication de contenu frauduleux, trompeur ou mensonger</li>
          <li className="text-slate-600 dark:text-vynal-text-secondary">Utilisation de la plateforme pour des activités illégales</li>
          <li className="text-slate-600 dark:text-vynal-text-secondary">Spam, sollicitation non désirée ou marketing agressif</li>
          <li className="text-slate-600 dark:text-vynal-text-secondary">Usurpation d'identité ou fausse représentation</li>
          <li className="text-slate-600 dark:text-vynal-text-secondary">Toute forme de manipulation du système d'évaluation</li>
          <li className="text-slate-600 dark:text-vynal-text-secondary">Divulgation non autorisée d'informations confidentielles</li>
        </ul>
        
        <h2 className="text-lg md:text-xl font-semibold mt-6 md:mt-8 mb-3 md:mb-4 text-slate-800 dark:text-vynal-text-primary">Résolution des conflits</h2>
        <p className="text-sm md:text-base text-slate-600 dark:text-vynal-text-secondary">
          En cas de désaccord ou de conflit avec un autre utilisateur, nous vous encourageons à :
        </p>
        <ul className="list-disc pl-4 md:pl-5 space-y-1 md:space-y-2 text-sm md:text-base">
          <li className="text-slate-600 dark:text-vynal-text-secondary">Communiquer ouvertement et respectueusement pour résoudre le problème</li>
          <li className="text-slate-600 dark:text-vynal-text-secondary">Utiliser le système de messagerie intégré pour garder une trace des communications</li>
          <li className="text-slate-600 dark:text-vynal-text-secondary">Si nécessaire, utiliser notre système de gestion des litiges</li>
          <li className="text-slate-600 dark:text-vynal-text-secondary">Contacter notre service client si vous ne parvenez pas à résoudre le problème</li>
        </ul>
        
        <h2 className="text-lg md:text-xl font-semibold mt-6 md:mt-8 mb-3 md:mb-4 text-slate-800 dark:text-vynal-text-primary">Conséquences des infractions</h2>
        <p className="text-sm md:text-base text-slate-600 dark:text-vynal-text-secondary">
          Les violations de ce code de conduite peuvent entraîner diverses conséquences, selon la gravité et la fréquence :
        </p>
        <ul className="list-disc pl-4 md:pl-5 space-y-1 md:space-y-2 text-sm md:text-base">
          <li className="text-slate-600 dark:text-vynal-text-secondary">Avertissement formel</li>
          <li className="text-slate-600 dark:text-vynal-text-secondary">Suspension temporaire de certains privilèges</li>
          <li className="text-slate-600 dark:text-vynal-text-secondary">Restriction d'accès à certaines fonctionnalités</li>
          <li className="text-slate-600 dark:text-vynal-text-secondary">Suspension temporaire du compte</li>
          <li className="text-slate-600 dark:text-vynal-text-secondary">Résiliation permanente du compte</li>
        </ul>
        
        <h2 className="text-lg md:text-xl font-semibold mt-6 md:mt-8 mb-3 md:mb-4 text-slate-800 dark:text-vynal-text-primary">Signalement</h2>
        <p className="text-sm md:text-base text-slate-600 dark:text-vynal-text-secondary">
          Si vous êtes témoin d'un comportement qui enfreint ce code de conduite, veuillez le signaler immédiatement :
        </p>
        <ul className="list-disc pl-4 md:pl-5 space-y-1 md:space-y-2 text-sm md:text-base">
          <li className="text-slate-600 dark:text-vynal-text-secondary">En utilisant la fonction "Signaler" disponible sur la plateforme</li>
          <li className="text-slate-600 dark:text-vynal-text-secondary">En contactant notre équipe Support à support@vynalplatform.com</li>
          <li className="text-slate-600 dark:text-vynal-text-secondary">Tous les signalements seront examinés rapidement et de manière confidentielle</li>
        </ul>
        
        <h2 className="text-lg md:text-xl font-semibold mt-6 md:mt-8 mb-3 md:mb-4 text-slate-800 dark:text-vynal-text-primary">Modifications du code de conduite</h2>
        <p className="text-sm md:text-base text-slate-600 dark:text-vynal-text-secondary">
          Vynal Platform se réserve le droit de modifier ce code de conduite à tout moment. Les utilisateurs seront informés 
          des changements importants par e-mail et/ou notification sur la plateforme. L'utilisation continue de la plateforme 
          après modification du code de conduite constitue l'acceptation des nouvelles conditions.
        </p>
        
        <div className="mt-6 md:mt-8 p-3 md:p-4 bg-white/40 dark:bg-slate-800/40 rounded-lg border border-slate-200/50 dark:border-slate-700/20 transition-all duration-200">
          <p className="text-xs md:text-sm text-slate-600 dark:text-vynal-text-secondary">
            <strong className="text-slate-700 dark:text-vynal-text-primary">Documents complémentaires :</strong>
          </p>
          <ul className="list-disc pl-4 md:pl-5 mt-2 text-xs md:text-sm space-y-1">
            <li><a href="/terms-of-service" className="text-vynal-accent-primary hover:underline transition-all duration-200">Conditions d'utilisation</a></li>
            <li><a href="/privacy-policy" className="text-vynal-accent-primary hover:underline transition-all duration-200">Politique de confidentialité</a></li>
            <li><a href="/withdrawal-terms" className="text-vynal-accent-primary hover:underline transition-all duration-200">Conditions de retrait</a></li>
          </ul>
        </div>
        
        <p className="mt-6 md:mt-8 text-xs md:text-sm text-slate-600 dark:text-vynal-text-secondary">
          Dernière mise à jour : {new Date().toLocaleDateString()}
        </p>
      </div>
    </div>
  );
} 