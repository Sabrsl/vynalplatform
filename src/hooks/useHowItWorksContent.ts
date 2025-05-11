import { useState, useEffect } from 'react';
import { HowItWorksContent, UseHowItWorksContentReturn } from '@/types/chatbot';

/**
 * Hook personnalisé pour charger le contenu "Comment ça marche" depuis l'API
 * Avec gestion de l'état de chargement, des erreurs et du rafraîchissement
 */
export function useHowItWorksContent(): UseHowItWorksContentReturn {
  const [content, setContent] = useState<HowItWorksContent | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  
  // Fonction pour charger ou rafraîchir le contenu
  const fetchContent = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Dans un environnement réel, remplacez ceci par un appel API
      // Exemple: const response = await fetch('/api/how-it-works');
      
      // Simuler un délai d'API
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Données de démonstration (à remplacer par la réponse API réelle)
      const demoContent: HowItWorksContent = {
        introduction: "Vynal Platform est une marketplace innovante qui met en relation les talents freelances avec des clients à la recherche de services de qualité. Notre écosystème sécurisé, transparent et adapté au contexte africain permet de transformer la façon dont les projets sont réalisés en Afrique.",
        clientProcess: {
          title: "Vous êtes client",
          steps: [
            {
              title: "Publiez un projet ou recherchez un freelance",
              description: "Décrivez votre besoin en détail et recevez des propositions personnalisées des meilleurs freelances. Vous pouvez également parcourir notre catalogue de talents et filtrer selon vos critères spécifiques pour trouver le profil idéal."
            },
            {
              title: "Échangez et finalisez les détails",
              description: "Utilisez notre messagerie sécurisée pour discuter des spécificités de votre projet, clarifier vos attentes, établir un calendrier précis et convenir des conditions de collaboration. Cette étape est cruciale pour assurer une compréhension mutuelle des objectifs."
            },
            {
              title: "Suivez l'avancement et validez",
              description: "Supervisez le projet via notre tableau de bord intuitif et validez les livrables. Vous gardez un contrôle total sur votre projet et le paiement n'est débloqué que lorsque vous êtes pleinement satisfait du résultat, vous offrant une tranquillité d'esprit totale."
            }
          ]
        },
        freelanceProcess: {
          title: "Vous êtes freelance",
          steps: [
            {
              title: "Créez votre profil professionnel",
              description: "Mettez en valeur vos compétences, votre parcours et votre portfolio pour attirer des clients potentiels. Un profil complet et vérifié augmente significativement vos chances d'obtenir des projets intéressants."
            },
            {
              title: "Proposez vos services ou répondez aux projets",
              description: "Créez des offres détaillées pour vos services ou soumettez des propositions personnalisées aux projets publiés par les clients. Expliquez clairement votre approche, vos délais et vos tarifs."
            },
            {
              title: "Livrez un travail de qualité",
              description: "Communiquez régulièrement avec le client, respectez les délais et fournissez un travail qui dépasse les attentes. Une fois le projet terminé et validé par le client, recevez votre paiement directement sur votre compte Vynal."
            }
          ]
        },
        faq: [
          {
            question: "Comment fonctionne le système de paiement sécurisé ?",
            answer: "Notre système de paiement sécurisé (escrow) protège à la fois les clients et les freelances. Le client dépose les fonds sur Vynal Platform, mais l'argent n'est versé au freelance qu'une fois le travail livré et validé, garantissant ainsi la sécurité des transactions."
          },
          {
            question: "Quels sont les frais appliqués sur la plateforme ?",
            answer: "Vynal Platform prélève une commission raisonnable uniquement sur les projets réalisés avec succès. Les clients ne paient que le montant convenu pour le service, tandis que les freelances reçoivent leur paiement moins les frais de service qui contribuent à maintenir et améliorer la plateforme."
          },
          {
            question: "Comment sont sélectionnés les freelances ?",
            answer: "Tous les freelances passent par un processus de vérification qui inclut la validation de leur identité, de leurs compétences et de leur expérience professionnelle. Nous maintenons des standards élevés pour garantir que seuls les talents qualifiés sont présents sur notre plateforme."
          },
          {
            question: "Quels types de projets puis-je trouver sur Vynal Platform ?",
            answer: "Vynal Platform couvre un large éventail de services numériques et traditionnels adaptés au marché africain, incluant le développement web et mobile, le design graphique, le marketing digital, la rédaction, la traduction, la comptabilité, le conseil juridique, l'agriculture, et bien d'autres domaines. Chaque service est proposé par des professionnels vérifiés avec une tarification transparente."
          },
          {
            question: "Comment gérer les délais sur un projet ?",
            answer: "Lors de la finalisation d'une commande, clients et freelances conviennent ensemble d'un calendrier de livraison. Notre système permet de suivre les jalons, d'envoyer des rappels automatiques, et d'ajuster les délais si nécessaire avec l'accord des deux parties. En cas de retard imprévu, notre système de médiation peut intervenir pour trouver une solution équitable."
          }
        ],
        security: {
          title: "Sécurité et confiance",
          features: [
            "Système de paiement sécurisé (escrow)",
            "Vérification d'identité pour tous les utilisateurs",
            "Processus de résolution des litiges transparent",
            "Protection des données personnelles",
            "Chiffrement des communications et des transactions",
            "Évaluations et avis vérifiés"
          ]
        },
        paymentProcess: {
          title: "Processus de paiement",
          description: "Notre système de paiement sécurisé garantit que les fonds sont bloqués jusqu'à la validation du travail. Les freelances peuvent retirer leurs gains via différentes méthodes adaptées au contexte africain, incluant les transferts bancaires, les portefeuilles électroniques et les services de transfert d'argent. Les transactions sont protégées et les fonds ne sont libérés qu'après validation complète du travail par le client."
        }
      };
      
      setContent(demoContent);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Une erreur inconnue est survenue'));
    } finally {
      setLoading(false);
    }
  };
  
  // Charger le contenu au montage du composant
  useEffect(() => {
    fetchContent();
  }, []);
  
  // Exposer les données et fonctions
  return {
    content,
    loading,
    error,
    refresh: fetchContent
  };
}