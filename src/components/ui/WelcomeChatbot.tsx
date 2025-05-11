import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, User, Bot, Loader2, ChevronUp, ChevronDown } from 'lucide-react';
import { Card } from './card';
import { Button } from './button';
import { Dialog, DialogContent } from './dialog';
import { Avatar } from './avatar';
import { Textarea } from './textarea';
import { useHowItWorksContent } from '@/hooks/useHowItWorksContent';
import { HowItWorksContent } from '@/types/chatbot';
import nlp from 'compromise';
import {
  analyzeConversationContext,
  matchFaqQuestion,
  detectSpecificIntent,
  expandIntentDetection,
  type MatchResult 
} from '@/utils/chatbotUtils';
import { useAuth } from '@/hooks/useAuth';
// import { useUser } from '@/hooks/useUser';
import { knowledgeBase, type KnowledgeEntry } from '@/data/chatbotKnowledgeBase';
// import { useSession } from 'next-auth/react';
// import { ChatBubble } from '@/components/ui';
import Link from 'next/link';

type Message = {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
};

// Fonction utilitaire pour générer un ID unique
const generateId = () => Math.random().toString(36).substring(2, 11);

// Contenu par défaut en cas d'erreur ou de chargement
const defaultHowItWorksContent: HowItWorksContent = {
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

export function WelcomeChatbot() {
  const { content, loading, error } = useHowItWorksContent();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: generateId(),
      content: "Bonjour ! Je suis Eddine, l'assistant virtuel de Vynal Platform. Comment puis-je vous aider aujourd'hui ?",
      role: 'assistant',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [userType, setUserType] = useState<'client' | 'freelance' | 'undetermined'>('undetermined');
  const [conversationContext, setConversationContext] = useState<string[]>([]);
  const [lastQueries, setLastQueries] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Utiliser les hooks d'authentification pour détecter automatiquement le rôle de l'utilisateur
  const { user } = useAuth();
  // const { isFreelance, isClient } = useUser();
  const isFreelance = false; // Valeur statique temporaire
  const isClient = false; // Valeur statique temporaire
  
  // Détecter automatiquement le rôle de l'utilisateur connecté
  useEffect(() => {
    if (user) {
      if (isFreelance) {
        setUserType('freelance');
      } else if (isClient) {
        setUserType('client');
      }
    }
  }, [user, isFreelance, isClient]);
  
  // Utiliser le contenu chargé ou le contenu par défaut si une erreur se produit
  const howItWorksContent = content || defaultHowItWorksContent;

  // Fonction pour déterminer le type d'utilisateur basé sur le message
  const determineUserType = (message: string): 'client' | 'freelance' | 'undetermined' => {
    const lowercaseMsg = message.toLowerCase();
    
    // Mots-clés indiquant un freelance
    const freelanceKeywords = [
      'je suis freelance', 'en tant que freelance', 'comme freelance',
      'je suis prestataire', 'je travaille comme', 'mes services', 
      'mes compétences', 'mon portfolio', 'mes clients', 'mes projets',
      'je cherche des clients', 'trouver des clients', 'plus de clients',
      'vendre mes services', 'proposer mes services'
    ];
    
    // Mots-clés indiquant un client
    const clientKeywords = [
      'je suis client', 'en tant que client', 'comme client',
      'je cherche un freelance', 'trouver un freelance', 'besoin d\'un service',
      'commander un service', 'acheter un service', 'projet à réaliser',
      'besoin de quelqu\'un', 'cherche un professionnel', 'recruter',
      'faire faire', 'faire réaliser'
    ];
    
    // Vérifier si le message contient des mots-clés de freelance
    if (freelanceKeywords.some(keyword => lowercaseMsg.includes(keyword))) {
      return 'freelance';
    }
    
    // Vérifier si le message contient des mots-clés de client
    if (clientKeywords.some(keyword => lowercaseMsg.includes(keyword))) {
      return 'client';
    }
    
    // Si aucune correspondance claire, retourner indéterminé
    return 'undetermined';
  };

  // Générer une réponse personnalisée en fonction du contexte
  const generateContextualResponse = (baseResponse: string, context: string[]): string => {
    // Si nous avons un contexte spécifique, ajouter des informations complémentaires
    let enhancedResponse = baseResponse;
    
    // Regrouper les contextes similaires
    const uniqueContext = [...new Set(context)];
    
    // Ajouter des informations complémentaires en fonction du contexte
    if (uniqueContext.includes('payment') && !baseResponse.includes('paiement')) {
      enhancedResponse += `\n\nÀ propos du paiement : ${howItWorksContent.paymentProcess.description}`;
    }
    
    if (uniqueContext.includes('security') && !baseResponse.includes('sécurité')) {
      enhancedResponse += `\n\nConcernant la sécurité : Vynal Platform garantit ${howItWorksContent.security.features[0]} et ${howItWorksContent.security.features[1]}.`;
    }
    
    if (uniqueContext.includes('support') && !baseResponse.includes('support')) {
      enhancedResponse += "\n\nNotre équipe de support est disponible 24/7 pour répondre à toutes vos questions et vous accompagner tout au long de votre parcours sur la plateforme.";
    }
    
    return enhancedResponse;
  };

  // Générer la réponse du chatbot basée sur le contenu "Comment ça marche" et l'analyse NLP
  const generateResponse = (userMessage: string): string => {
    // Si le message est vide, demander une question
    if (!userMessage.trim()) {
      return "Bonjour ! Je suis Eddine. Comment puis-je vous aider concernant Vynal Platform ?";
    }
    
    const lowercaseMsg = userMessage.toLowerCase().trim();
    
    // Rechercher dans la base de connaissances
    const matchingEntries = knowledgeBase.filter((entry: KnowledgeEntry) => {
      // Vérifier les mots-clés requis
      if (entry.requiredKeywords && entry.requiredKeywords.length > 0) {
        if (!entry.requiredKeywords.every((keyword: string) => lowercaseMsg.includes(keyword))) {
          return false;
        }
      }
      
      // Vérifier les mots-clés
      return entry.keywords.some((keyword: string) => lowercaseMsg.includes(keyword));
    });
    
    // Trier les entrées par priorité
    matchingEntries.sort((a: KnowledgeEntry, b: KnowledgeEntry) => (b.priority || 0) - (a.priority || 0));
    
    // Si nous avons des correspondances dans la base de connaissances
    if (matchingEntries.length > 0) {
      return matchingEntries[0].response;
    }
    
    // Questions sur l'identité
    if (/^(qui es-tu|tu es qui|c'est qui|comment tu t'appelles|ton nom|tu t'appelles comment|qui est eddine|c'est qui eddine)/i.test(lowercaseMsg)) {
      return "Je suis Eddine, l'assistant virtuel de Vynal Platform. Je suis là pour vous aider avec toutes vos questions concernant notre plateforme de services freelance en Afrique.";
    }
    
    // Questions sur Vynal
    if (/^(c'est quoi vynal|qu'est-ce que vynal|vynal c'est quoi|vynal platform c'est quoi|explique vynal)/i.test(lowercaseMsg)) {
      return "Vynal Platform est une marketplace africaine qui met en relation des freelances talentueux avec des clients. Notre plateforme permet de :\n\n• Trouver des services professionnels de qualité\n• Proposer vos services en tant que freelance\n• Sécuriser vos transactions\n• Gérer vos projets facilement\n\nQue souhaitez-vous savoir plus précisément ?";
    }
    
    // Questions sur la vente et les clients
    if (/^(je veux des clients|comment avoir des clients|trouver des clients|attirer des clients|plus de clients)/i.test(lowercaseMsg)) {
      return "Pour attirer plus de clients sur Vynal Platform, voici mes conseils :\n\n• Optimisez votre profil avec une photo professionnelle\n• Mettez en valeur vos compétences et votre expérience\n• Créez un portfolio attractif\n• Proposez des prix compétitifs\n• Répondez rapidement aux demandes\n• Demandez des avis après chaque projet\n\nVoulez-vous que je vous guide dans l'optimisation de votre profil ?";
    }
    
    // Questions sur la vente de services
    if (/^(je ne peux pas vendre|comment vendre|comment faire pour vendre|comment mieux vendre)/i.test(lowercaseMsg)) {
      return "Pour mieux vendre vos services sur Vynal Platform :\n\n• Créez des offres détaillées et attractives\n• Mettez en avant vos points forts\n• Proposez des tarifs adaptés au marché\n• Soyez réactif aux demandes\n• Communiquez clairement avec les clients\n• Livrez un travail de qualité\n\nSouhaitez-vous des conseils plus spécifiques sur l'un de ces points ?";
    }
    
    // Questions sur l'aide
    if (/^(j'ai besoin d'aide|je veux de l'aide|aide moi|help|sos)/i.test(lowercaseMsg)) {
      return "Je suis là pour vous aider ! Pourriez-vous me préciser sur quel aspect de Vynal Platform vous avez besoin d'aide ?\n\n• Création de compte\n• Gestion de profil\n• Recherche de services\n• Vente de services\n• Paiements\n• Support technique\n\nPlus vous me donnerez de détails, mieux je pourrai vous aider.";
    }
    
    // Questions sur les paiements
    if (/^(comment payer|comment faire un paiement|moyens de paiement|méthodes de paiement|payer|paiement)/i.test(lowercaseMsg)) {
      return "Sur Vynal Platform, vous pouvez payer de plusieurs façons :\n\n• Cartes bancaires (Visa, Mastercard)\n• PayPal\n• Solutions de paiement mobile africaines\n\nLe processus est sécurisé :\n• Le paiement est retenu en garantie\n• L'argent n'est versé au freelance qu'après validation\n• Vous êtes protégé en cas de problème\n\nAvez-vous une question spécifique sur l'une de ces méthodes de paiement ?";
    }
    
    // Réponses aux salutations basiques
    if (/^(bonjour|salut|hello|hi|hey|coucou|bjr|re|cc|slt|yo)(\s|\?|$)/i.test(lowercaseMsg)) {
      return "Bonjour ! Je suis Eddine, l'assistant virtuel de Vynal Platform. Comment puis-je vous aider ?";
    }
    
    if (/^(merci|thanks|thx|mrc)/i.test(lowercaseMsg)) {
      return "Je vous en prie ! N'hésitez pas si vous avez d'autres questions.";
    }
    
    if (/^(au revoir|bye|à bientôt|ciao|adieu)/i.test(lowercaseMsg)) {
      return "Au revoir ! À bientôt sur Vynal Platform.";
    }
    
    // Vérifier si l'utilisateur est contrarié ou signale un problème avec le chatbot
    if (lowercaseMsg.includes('pas intelligent') || 
        lowercaseMsg.includes('ne comprend') || 
        lowercaseMsg.includes('bug') || 
        lowercaseMsg.includes('ne marche pas') ||
        lowercaseMsg.includes('pas bien') ||
        lowercaseMsg.includes('tu ne compends pas') ||
        lowercaseMsg.includes('pfff') ||
        lowercaseMsg.includes('ppffff') ||
        lowercaseMsg.includes('grave') ||
        lowercaseMsg.includes('fgrave') ||
        lowercaseMsg.includes('omg')) {
      return "Je vous prie de m'excuser pour cette confusion. Pourriez-vous reformuler votre question de façon plus précise concernant Vynal Platform afin que je puisse mieux vous aider ?";
    }
    
    // Si le message contient "problème" ou "soucis"
    if (lowercaseMsg.includes('probleme') || 
        lowercaseMsg.includes('problème') || 
        lowercaseMsg.includes('souci') || 
        lowercaseMsg.includes('soucis')) {
      return "Je suis désolé d'apprendre que vous rencontrez des difficultés. Pourriez-vous me préciser quel type de problème vous rencontrez avec Vynal Platform afin que je puisse vous aider au mieux ?";
    }
    
    // Mise à jour du type d'utilisateur si pas encore déterminé et pas d'utilisateur connecté
    if (userType === 'undetermined' && !user) {
      const detectedType = determineUserType(userMessage);
      if (detectedType !== 'undetermined') {
        setUserType(detectedType);
      }
    }
    
    // Utilisation de la détection d'intention avancée
    const expandedIntent = expandIntentDetection(userMessage);
    
    // Traitement basé sur l'intention principale détectée
    if (expandedIntent.confidence > 0.6) {
      switch (expandedIntent.mainIntent) {
        case 'service_inquiry':
          return "Vynal Platform propose une large gamme de services professionnels fournis par des freelances qualifiés. Vous pouvez trouver des services dans les domaines du design, du développement web, de la rédaction, du marketing digital et bien plus encore. Avez-vous un domaine particulier qui vous intéresse ?";
          
        case 'process_question':
          return "Le processus sur Vynal Platform est simple : parcourez les services disponibles, contactez le freelance pour discuter de vos besoins, définissez les modalités du projet (délai, budget, livrables), effectuez le paiement sécurisé, et recevez votre travail. La plateforme sécurise votre paiement jusqu'à ce que vous soyez satisfait. Y a-t-il une étape sur laquelle vous aimeriez plus de détails ?";
          
        case 'pricing_inquiry':
          return "Les prix sur Vynal Platform varient selon les services et les freelances. Chaque prestataire fixe ses propres tarifs. Vynal prélève une commission de 5% à 10% selon le volume de transactions. Les paiements sont sécurisés et vous ne payez que lorsque vous êtes satisfait du travail livré. Avez-vous une question spécifique concernant les tarifs ?";
          
        case 'complaint':
          return "Je suis désolé d'apprendre que vous rencontrez des difficultés. Pour résoudre votre problème efficacement, pourriez-vous me donner plus de détails sur ce qui ne fonctionne pas correctement ? Notre équipe de support est également disponible via support@vynalplatform.com pour toute assistance technique.";
          
        case 'security_concerns':
          return "La sécurité est notre priorité absolue. Vynal Platform utilise un système de paiement sécurisé avec protection acheteur, un processus de vérification des freelances, un chiffrement SSL pour toutes les données, et un système d'évaluation transparent. Vos informations personnelles et transactions sont protégées selon les normes bancaires les plus strictes. Avez-vous une préoccupation particulière concernant la sécurité ?";
          
        case 'feedback':
          return "Merci pour votre retour ! Nous prenons très au sérieux les commentaires de nos utilisateurs pour améliorer constamment Vynal Platform. Si vous avez des suggestions spécifiques, n'hésitez pas à les partager. Vous pouvez également laisser un avis plus détaillé via notre formulaire de feedback accessible depuis votre compte.";
      }
    }
    
    // Vérifier si une intention spécifique est détectée avec l'ancienne méthode (pour compatibilité)
    const specificIntent = detectSpecificIntent(userMessage);
    if (specificIntent && specificIntent.confidence > 0.6) {
      switch (specificIntent.intent) {
        case 'commande_info':
          return "Pour suivre votre commande sur Vynal Platform, connectez-vous à votre compte et accédez à la section 'Mes commandes'. Vous y trouverez l'état d'avancement, les communications avec le freelance et les délais prévus. Si vous avez des questions spécifiques sur une commande, vous pouvez contacter directement le prestataire via la messagerie intégrée.";
          
        case 'paiement_info':
          return "Vynal Platform propose plusieurs méthodes de paiement sécurisées comme les cartes bancaires, PayPal, et certaines solutions de paiement mobile africaines. Les paiements sont retenus en garantie jusqu'à ce que vous approuviez le travail livré. Les freelances sont généralement payés dans les 48h après validation. Les frais de commission varient de 5% à 10% selon le volume de transactions.";
          
        case 'profil_edit':
          return "Pour modifier votre profil sur Vynal Platform, connectez-vous à votre compte, cliquez sur votre photo de profil en haut à droite, puis sélectionnez 'Mon profil' ou 'Paramètres'. Vous pourrez y modifier vos informations personnelles, votre photo, votre description, vos compétences et vos réalisations. N'oubliez pas de sauvegarder vos modifications avant de quitter la page.";
          
        case 'aide_technique':
          return "Je suis désolé que vous rencontriez des difficultés techniques. Pour résoudre au mieux votre problème, pourriez-vous me préciser ce qui ne fonctionne pas ? Vous pouvez également contacter notre support technique à support@vynalplatform.com. Notre équipe est disponible du lundi au vendredi de 9h à 18h et s'efforcera de vous répondre dans les 24 heures.";
          
        case 'vente_clients':
          return "Pour attirer plus de clients sur Vynal Platform, optimisez votre profil avec une photo professionnelle et une description détaillée, mettez en valeur vos compétences clés et votre portfolio, proposez des prix compétitifs au début, répondez rapidement aux demandes, et demandez des avis après chaque projet. La régularité et la qualité de votre travail amélioreront votre visibilité dans les recherches de la plateforme.";
          
        case 'creation_compte':
          return "Pour créer un compte sur Vynal Platform, cliquez sur 'S'inscrire' en haut à droite de la page d'accueil. Vous pouvez vous inscrire avec votre email ou via Google/Facebook. Complétez ensuite votre profil en indiquant si vous êtes freelance ou client, ajoutez vos informations personnelles, une photo et une description. L'inscription est gratuite et prend moins de 5 minutes.";
      }
    }
    
    // Si intentions multiples détectées avec confiances similaires
    if ((expandedIntent as any).isCompositeIntent && expandedIntent.secondaryIntents.length > 0) {
      return `Votre question semble porter sur plusieurs aspects. Concernant ${expandedIntent.mainIntent.replace('_', ' ')}, ${getResponseForIntent(expandedIntent.mainIntent)}. 
      
Vous semblez également vous intéresser à ${expandedIntent.secondaryIntents[0].intent.replace('_', ' ')}. ${getResponseForIntent(expandedIntent.secondaryIntents[0].intent)}
      
Y a-t-il un aspect particulier sur lequel vous souhaitez plus d'informations ?`;
    }
    
    // Réponse par défaut si aucune intention précise n'est détectée
    return "Je suis Eddine, l'assistant de Vynal Platform. Pour mieux vous aider, pourriez-vous me préciser votre question ? Je peux vous renseigner sur :\n\n• Le fonctionnement de la plateforme\n• La création de compte\n• La vente de services\n• L'achat de services\n• Les paiements\n• Le support";
  };
  
  // Fonction utilitaire pour obtenir une réponse pour une intention donnée
  const getResponseForIntent = (intent: string): string => {
    switch (intent) {
      case 'service_inquiry':
        return "nous proposons une variété de services professionnels dans les domaines du digital, du design, de la rédaction et plus encore";
      case 'process_question':
        return "notre processus est simple et sécurisé avec sélection du freelance, paiement sécurisé et livraison garantie";
      case 'pricing_inquiry':
        return "les prix varient selon les services et les freelances, avec une commission de 5% à 10% prélevée par la plateforme";
      case 'complaint':
        return "nous prenons très au sérieux tous les problèmes rencontrés et notre équipe support est à votre disposition pour les résoudre";
      case 'security_concerns':
        return "nous utilisons des protocoles de sécurité avancés pour protéger vos données et transactions";
      case 'feedback':
        return "vos retours sont essentiels pour nous aider à améliorer constamment nos services";
      default:
        return "n'hésitez pas à me poser des questions plus précises pour que je puisse mieux vous aider";
    }
  };

  // Fonction pour gérer l'envoi de message
  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;
    
    // Ajouter le message de l'utilisateur
    const userMessage: Message = {
      id: generateId(),
      content: inputMessage,
      role: 'user',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);
    
    // Simuler le délai de réponse du chatbot (plus court pour les réponses simples)
    const responseTime = inputMessage.length < 20 ? 600 : 1000;
    
    setTimeout(() => {
      const botResponse: Message = {
        id: generateId(),
        content: generateResponse(userMessage.content),
        role: 'assistant',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    }, responseTime);
  };

  // Effet pour faire défiler vers le bas à chaque nouveau message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Message d'accueil au premier affichage, adapté au rôle de l'utilisateur connecté
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      let welcomeContent = "";
      
      if (loading) {
        welcomeContent = "Bonjour ! Je suis Eddine, je charge les informations sur la plateforme. Je serai prêt dans un instant...";
      } else if (user) {
        // Message d'accueil personnalisé pour l'utilisateur connecté
        if (isClient) {
          welcomeContent = `Bonjour ! Je suis Eddine, l'assistant Vynal Platform. Comment puis-je vous aider aujourd'hui ? Je peux vous renseigner sur le fonctionnement de la plateforme, le processus de commande, ou répondre à toute autre question concernant votre expérience en tant que client.`;
        } else if (isFreelance) {
          welcomeContent = `Bonjour ! Je suis Eddine, l'assistant Vynal Platform. Comment puis-je vous aider aujourd'hui ? Je peux vous renseigner sur la gestion de votre profil, la réception de commandes, ou répondre à toute autre question concernant votre expérience en tant que freelance.`;
        } else {
          welcomeContent = `Bonjour ! Je suis Eddine, l'assistant Vynal Platform. Comment puis-je vous aider aujourd'hui ? Je peux vous renseigner sur le fonctionnement de notre plateforme, nos services, ou répondre à vos questions.`;
        }
      } else {
        // Message d'accueil pour visiteur non connecté
        welcomeContent = `Bonjour ! Je suis Eddine, l'assistant Vynal Platform. Je peux vous présenter le fonctionnement de notre plateforme ou répondre à vos questions spécifiques. Que souhaitez-vous savoir ?`;
      }
      
      const welcomeMessage: Message = {
        id: generateId(),
        content: welcomeContent,
        role: 'assistant',
        timestamp: new Date()
      };
      
      setMessages([welcomeMessage]);
    }
  }, [isOpen, messages.length, loading, user, isClient, isFreelance]);

  // Gérer l'envoi de message avec la touche Entrée
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Convertir le texte avec des sauts de ligne en JSX avec des <br />
  const formatMessage = (text: string) => {
    return text.split('\n').map((line, index) => {
      // Détecter les liens dans le format /chemin
      const linkRegex = /(\/[a-z-]+)/g;
      const parts = [];
      let lastIndex = 0;
      let match;

      while ((match = linkRegex.exec(line)) !== null) {
        // Ajouter le texte avant le lien
        if (match.index > lastIndex) {
          parts.push(line.slice(lastIndex, match.index));
        }
        // Ajouter le lien avec le composant Link
        const path = match[1];
        let frenchText = '';
        switch (path) {
          case '/privacy-policy':
            frenchText = 'politique de confidentialité';
            break;
          case '/terms-of-service':
            frenchText = 'conditions d\'utilisation';
            break;
          case '/code-of-conduct':
            frenchText = 'code de conduite';
            break;
          default:
            frenchText = path.split('/').pop()?.replace(/-/g, ' ') || '';
        }
        parts.push(
          <Link 
            key={`link-${index}-${match.index}`}
            href={path}
            className="text-vynal-accent-primary hover:text-vynal-accent-secondary underline"
          >
            {frenchText}
          </Link>
        );
        lastIndex = match.index + match[0].length;
      }

      // Ajouter le reste du texte
      if (lastIndex < line.length) {
        parts.push(line.slice(lastIndex));
      }

      return (
        <React.Fragment key={index}>
          {parts.length > 0 ? parts : line}
          {index < text.split('\n').length - 1 && <br />}
        </React.Fragment>
      );
    });
  };

  return (
    <>
      {/* Bouton flottant du chatbot (toujours visible) */}
      <div 
        className={`fixed bottom-6 right-6 z-50 ${isOpen ? 'hidden' : 'flex'}`}
      >
        <button
          onClick={() => setIsOpen(true)}
          className="bg-vynal-accent-primary hover:bg-vynal-accent-secondary text-white p-3 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110"
          aria-label="Ouvrir le chat d'assistance"
        >
          <MessageSquare className="h-6 w-6" />
        </button>
      </div>

      {/* Fenêtre du chatbot */}
      {isOpen && (
        <div 
          className={`fixed z-50 ${isMinimized ? 'bottom-6 right-6 w-auto' : 'bottom-4 right-4 sm:bottom-6 sm:right-6 w-[90vw] sm:w-[350px] md:w-[400px]'}`}
        >
          <Card className="shadow-xl border-vynal-accent-primary/20 overflow-hidden transition-all duration-300">
            {/* En-tête du chatbot */}
            <div className="bg-vynal-accent-primary p-3 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                <h3 className="font-medium text-sm">Assistant Vynal Platform</h3>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="hover:bg-white/20 p-1 rounded transition-colors"
                  aria-label={isMinimized ? "Agrandir" : "Minimiser"}
                >
                  {isMinimized ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    setIsMinimized(false);
                  }}
                  className="hover:bg-white/20 p-1 rounded transition-colors"
                  aria-label="Fermer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Corps du chatbot - disparaît quand minimisé */}
            {!isMinimized && (
              <>
                {/* Zone des messages */}
                <div className="h-[350px] max-h-[60vh] overflow-y-auto p-3 bg-slate-50 dark:bg-slate-900">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`mb-4 flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          message.role === 'user'
                            ? 'bg-vynal-accent-primary text-white'
                            : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-vynal-text-primary border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          {message.role === 'assistant' && (
                            <Avatar className="h-6 w-6 border-2 border-vynal-accent-primary/20">
                              <Bot className="h-4 w-4 text-vynal-accent-primary" />
                            </Avatar>
                          )}
                          <div className="text-xs sm:text-sm">{formatMessage(message.content)}</div>
                          {message.role === 'user' && (
                            <Avatar className="h-6 w-6 border-2 border-white/20">
                              <User className="h-4 w-4" />
                            </Avatar>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {isTyping && (
                    <div className="flex justify-start mb-4">
                      <div className="bg-white dark:bg-slate-800 text-slate-800 dark:text-vynal-text-primary rounded-lg p-3 max-w-[80%] border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6 border-2 border-vynal-accent-primary/20">
                            <Bot className="h-4 w-4 text-vynal-accent-primary" />
                          </Avatar>
                          <Loader2 className="h-4 w-4 animate-spin text-vynal-accent-primary" />
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Zone de saisie */}
                <div className="p-2 sm:p-3 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex items-end gap-2">
                  <Textarea
                    placeholder="Posez votre question..."
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="resize-none min-h-[40px] max-h-[120px] text-xs sm:text-sm"
                  />
                  <Button
                    size="sm"
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim() || isTyping}
                    className="shrink-0"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </>
            )}
          </Card>
        </div>
      )}
    </>
  );
}