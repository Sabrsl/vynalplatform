import { HowItWorksContent } from '@/types/chatbot';

/**
 * Service pour extraire et analyser le contenu de la page "Comment ça marche"
 * afin de l'utiliser dans le chatbot d'accueil
 */

export const extractHowItWorksContent = async (): Promise<HowItWorksContent> => {
  try {
    // Récupérer le contenu de la page "Comment ça marche"
    const response = await fetch('/how-it-works');
    const html = await response.text();
    
    // Créer un DOM temporaire pour analyser le HTML
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // Structure pour stocker le contenu extrait
    const content: HowItWorksContent = {
      introduction: "",
      clientProcess: {
        title: "Vous êtes client",
        steps: []
      },
      freelanceProcess: {
        title: "Vous êtes freelance",
        steps: []
      },
      faq: [],
      security: {
        title: "Sécurité et confiance",
        features: []
      },
      paymentProcess: {
        title: "Processus de paiement",
        description: ""
      }
    };
    
    // Extraire l'introduction
    const introElement = doc.querySelector('.text-vynal-text-secondary.leading-relaxed');
    if (introElement) {
      content.introduction = introElement.textContent?.trim() || "";
    }
    
    // Extraire le processus client
    const clientSection = Array.from(doc.querySelectorAll('h3')).find(el => 
      el.textContent?.includes('client')
    )?.closest('div')?.parentElement;
    
    if (clientSection) {
      const clientSteps = clientSection.querySelectorAll('.grid.grid-cols-1.md\\:grid-cols-\\[60px_1fr\\] > .card');
      
      clientSteps.forEach(step => {
        const title = step.querySelector('.card-title')?.textContent?.trim() || "";
        const description = step.querySelector('.card-description')?.textContent?.trim() || "";
        
        if (title && description) {
          content.clientProcess.steps.push({ title, description });
        }
      });
    }
    
    // Extraire le processus freelance
    const freelanceSection = Array.from(doc.querySelectorAll('h3')).find(el => 
      el.textContent?.includes('freelance')
    )?.closest('div')?.parentElement;
    
    if (freelanceSection) {
      const freelanceSteps = freelanceSection.querySelectorAll('.grid.grid-cols-1.md\\:grid-cols-\\[60px_1fr\\] > .card');
      
      freelanceSteps.forEach(step => {
        const title = step.querySelector('.card-title')?.textContent?.trim() || "";
        const description = step.querySelector('.card-description')?.textContent?.trim() || "";
        
        if (title && description) {
          content.freelanceProcess.steps.push({ title, description });
        }
      });
    }
    
    // Extraire les FAQs
    const faqSection = doc.querySelector('.accordion');
    if (faqSection) {
      const faqItems = faqSection.querySelectorAll('.accordion-item');
      
      faqItems.forEach(item => {
        const question = item.querySelector('.accordion-trigger')?.textContent?.trim() || "";
        const answer = item.querySelector('.accordion-content')?.textContent?.trim() || "";
        
        if (question && answer) {
          content.faq.push({ question, answer });
        }
      });
    }
    
    // Extraire les informations de sécurité
    const securitySection = Array.from(doc.querySelectorAll('h2')).find(el => 
      el.textContent?.includes('Sécurité')
    )?.closest('div');
    
    if (securitySection) {
      const securityFeatures = securitySection.querySelectorAll('li');
      
      securityFeatures.forEach(feature => {
        const featureText = feature.textContent?.trim() || "";
        if (featureText) {
          content.security.features.push(featureText);
        }
      });
    }
    
    // Extraire les informations de paiement
    const paymentSection = Array.from(doc.querySelectorAll('h2')).find(el => 
      el.textContent?.includes('Paiement')
    )?.closest('div');
    
    if (paymentSection) {
      const paymentDescription = paymentSection.querySelector('p')?.textContent?.trim() || "";
      if (paymentDescription) {
        content.paymentProcess.description = paymentDescription;
      }
    }
    
    return content;
    
  } catch (error) {
    console.error("Erreur lors de l'extraction du contenu 'Comment ça marche':", error);
    
    // Retourner un contenu par défaut en cas d'erreur
    return {
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
        }
      ],
      security: {
        title: "Sécurité et confiance",
        features: [
          "Système de paiement sécurisé (escrow)",
          "Vérification d'identité pour tous les utilisateurs",
          "Processus de résolution des litiges transparent",
          "Protection des données personnelles"
        ]
      },
      paymentProcess: {
        title: "Processus de paiement",
        description: "Notre système de paiement sécurisé garantit que les fonds sont bloqués jusqu'à la validation du travail. Les freelances peuvent retirer leurs gains via différentes méthodes adaptées au contexte africain, incluant les transferts bancaires, les portefeuilles électroniques et les services de transfert d'argent."
      }
    };
  }
}; 