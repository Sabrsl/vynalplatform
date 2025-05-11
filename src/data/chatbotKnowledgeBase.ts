// Types et interfaces pour la base de connaissances
export interface KnowledgeCategory {
    id: string;
    name: string;
    description: string;
    parentCategory?: string;
    priority?: number;
  }
  
  export interface KnowledgeEntry {
    id: string;
    keywords: string[];
    requiredKeywords?: string[];
    response: string;
    category: string;
    priority?: number;
    lastUpdated?: Date;
    usageCount?: number;
    feedback?: {
      positive: number;
      negative: number;
    };
  }
  
  export interface SearchResult {
    entry: KnowledgeEntry;
    score: number;
    matchedKeywords: string[];
    confidence: 'high' | 'medium' | 'low';
  }
  
  export interface AnalysisResult {
    successRate: number;
    frequentUnmatchedKeywords: string[];
    popularCategories: string[];
    recommendations: string[];
    categoryDistribution: {[key: string]: number};
  }
  
  // Interfaces pour la gestion du contexte conversationnel
  export interface ConversationContext {
    lastCategory?: string;
    lastTopic?: string;
    userInfo?: {
      isFreelance?: boolean;
      isClient?: boolean;
      hasAccount?: boolean;
      interests?: string[];
    };
    conversationFlow: {
      messageId: string;
      query: string;
      response: string;
      category: string;
      timestamp: Date;
    }[];
  }
  
  // Catégories de connaissances
  export const knowledgeCategories: KnowledgeCategory[] = [
    { id: 'greeting', name: 'Salutations', description: 'Interactions de base et formules de politesse' },
    { id: 'general', name: 'Informations générales', description: 'Présentation et fonctionnement de la plateforme' },
    { id: 'account', name: 'Gestion du compte', description: 'Création et gestion du compte utilisateur' },
    { id: 'services', name: 'Services', description: 'Création et gestion des services' },
    { id: 'payment', name: 'Paiements', description: 'Gestion des paiements et finances' },
    { id: 'support', name: 'Support', description: 'Aide et assistance' },
    { id: 'security', name: 'Sécurité et confidentialité', description: 'Protection des données et transactions sécurisées' },
    { id: 'freelance', name: 'Guide freelance', description: 'Informations pour les prestataires de services' },
    { id: 'client', name: 'Guide client', description: 'Informations pour les acheteurs de services' },
    { id: 'platform_features', name: 'Fonctionnalités', description: 'Fonctionnalités spécifiques de la plateforme' },
    { id: 'billing', name: 'Facturation et taxes', description: 'Informations sur la facturation et aspects fiscaux' },
    { id: 'reputation', name: 'Évaluations et réputation', description: 'Système d\'avis et classement des utilisateurs' },
    { id: 'cancellation', name: 'Annulations et remboursements', description: 'Politiques d\'annulation et remboursement' },
    { id: 'education', name: 'Ressources d\'apprentissage', description: 'Tutoriels, guides et formation' },
    { id: 'scheduling', name: 'Gestion des délais', description: 'Planning, disponibilité et échéances' },
    { id: 'accessibility', name: 'Accessibilité', description: 'Accès mobile et paramètres d\'inclusion' },
    { id: 'integrations', name: 'API et intégrations', description: 'Connexions avec d\'autres services et systèmes' },
    { id: 'enterprise', name: 'Solutions entreprise', description: 'Services dédiés aux entreprises' },
    { id: 'best_practices', name: 'Bonnes pratiques', description: 'Conseils pour réussir sur la plateforme' },
    { id: 'localization', name: 'Spécificités régionales', description: 'Adaptations locales et disponibilité géographique' },
    { id: 'advanced_features', name: 'Fonctionnalités avancées', description: 'Options et outils avancés' },
    { id: 'legal', name: 'Aspects juridiques', description: 'Contrats, conditions et aspects légaux' },
    { id: 'dashboard', name: 'Tableau de bord', description: 'Utilisation et fonctionnalités du tableau de bord' },
    { id: 'communication', name: 'Communication', description: 'Messagerie et outils de communication' },
    { id: 'process', name: 'Processus de travail', description: 'Étapes et organisation des projets' },
    { id: 'onboarding', name: 'Démarrage', description: 'Premières étapes et intégration' },
    { id: 'project', name: 'Gestion de projet', description: 'Gestion des projets et des commandes' }
  ];
  
  // Base de connaissances structurée pour le chatbot
  export const knowledgeBase: KnowledgeEntry[] = [
    // Salutations et interactions de base
    {
      id: 'greeting_1',
      keywords: ['bonjour', 'salut', 'hello', 'coucou', 'hey', 'bonjout', 'bonsoir', 'bjr', 'yo', 'cc', 'slt', 'salu', '?', '???', '????', 'bonjoure', 'bonjoure', 'bonj', 'bonjr', 'bonsoire', 'bonsoir', 'bsr', 'bsjr', 'slt', 'salu', 'salut', 'salut', 'salut', 'salut', 'salut', 'bj', 're', 'bne journée', 'bne soirée'],
      requiredKeywords: [],
      response: "Bonjour ! Je suis l'assistant Vynal Platform. Comment puis-je vous aider aujourd'hui ? Je peux vous renseigner sur :\n\n• Le fonctionnement de la plateforme\n• La création et gestion de votre compte\n• Les services et commandes\n• Les paiements et retraits\n• Le support et résolution de problèmes\n\nN'hésitez pas à me poser votre question !",
      category: 'greeting',
      priority: 1
    },
    {
      id: 'greeting_2',
      keywords: ['ça va', 'cava', 'comment vas-tu', 'comment allez-vous', 'comment ça va', 'comment cava', 'cv', 'ca va', 'cva ?', 'cv?', 'ça va?', 'cava?', 'comment ca av ?', 'comment ca av', 'ca av', 'cav', 'cmnt ca va', 'cmnt va', 'cmnt va ?', 'ca roule', 'ca roule ?', 'ça roule', 'ca va bien', 'tu vas bien'],
      requiredKeywords: [],
      response: "Je vais très bien, merci ! Je suis là pour vous aider à naviguer sur Vynal Platform. Que puis-je faire pour vous aujourd'hui ?",
      category: 'greeting',
      priority: 2
    },
    {
      id: 'greeting_3',
      keywords: ['merci', 'merci beaucoup', 'parfait', 'super', 'génial', 'meci', 'thanks', 'thx', 'parfait merci', 'mrc', 'mr', 'bcp', '10ko'],
      requiredKeywords: [],
      response: "Je vous en prie ! N'hésitez pas si vous avez d'autres questions. Je suis là pour vous aider à tirer le meilleur parti de Vynal Platform.",
      category: 'greeting',
      priority: 2
    },
    {
      id: 'greeting_4',
      keywords: ['au revoir', 'à bientôt', 'bye', 'adieu', 'bonne journée', 'bonne soirée', 'salut', 'ciao', 'tchao', 'a+', 'a plus', 'a plus tard', 'a+ tard'],
      requiredKeywords: [],
      response: "Au revoir ! N'hésitez pas à revenir si vous avez d'autres questions. Je reste disponible 24h/24 pour vous accompagner sur Vynal Platform.",
      category: 'greeting',
      priority: 2
    },
  
    // Informations générales sur la plateforme
    {
      id: 'general_1',
      keywords: ['c\'est quoi', 'qu\'est-ce que', 'définition', 'plateforme', 'vynal', 'présentation', 'à propos', 'about', 'platforme', 'plateform', 'platfom', 'platefome', 'plateforme', 'platforme', 'plateform', 'platfom', 'platefome'],
      requiredKeywords: [],
      response: "Vynal Platform est une marketplace innovante qui met en relation les talents freelances avec des clients à la recherche de services de qualité. Notre écosystème sécurisé, transparent et adapté au contexte africain permet de transformer la façon dont les projets sont réalisés en Afrique.\n\nLes points forts de Vynal Platform :\n1. Une communauté de talents vérifiés et qualifiés\n2. Un système de paiement sécurisé (escrow)\n3. Des outils de communication et de gestion de projet intégrés\n4. Une interface intuitive adaptée aux réalités africaines\n5. Un support client réactif et multilingue\n\nNous contribuons activement au développement de l'économie numérique africaine en facilitant l'accès à des opportunités professionnelles pour les freelances et des services de qualité pour les entreprises locales.",
      category: 'general'
    },
    {
      id: 'general_2',
      keywords: ['comment ça marche', 'fonctionnement', 'principe', 'processus', 'démarrage', 'utiliser', 'utilisation'],
      requiredKeywords: [],
      response: "Vynal Platform fonctionne de manière simple et efficace :\n\nPour les clients :\n1. Publiez un projet détaillé ou recherchez un freelance spécifique dans notre catalogue\n2. Recevez des propositions ou contactez directement les freelances qui vous intéressent\n3. Discutez des détails et établissez un accord clair (prix, délais, livrables)\n4. Effectuez le paiement sécurisé sur la plateforme (conservé en escrow)\n5. Suivez l'avancement du projet via votre tableau de bord\n6. Validez la livraison pour débloquer le paiement au freelance\n7. Évaluez le service reçu pour contribuer à la qualité de la communauté\n\nPour les freelances :\n1. Créez votre profil professionnel détaillé avec portfolio\n2. Proposez vos services spécifiques ou répondez aux projets publiés\n3. Discutez des détails avec les clients potentiels\n4. Acceptez les missions qui correspondent à vos compétences et disponibilités\n5. Livrez un travail de qualité dans les délais convenus\n6. Recevez votre paiement une fois le travail validé\n7. Construisez votre réputation via les évaluations clients\n\nNotre système de paiement sécurisé (escrow) garantit la protection des deux parties. Souhaitez-vous plus de détails sur un aspect particulier ?",
      category: 'general'
    },
  
    // Gestion du compte
    {
      id: 'account_1',
      keywords: ['compte', 'comptes', 'profil', 'profils', 'inscription', 'inscriptions', 's\'inscrire', 'inscrire', 'créer compte', 'créer un compte', 'nouveau compte', 'nouveau profil', 'compt', 'compts', 'profl', 'profls', 'inscr', 'inscrs', 'sinscr', 'sinscrs', 'creer', 'creer compt', 'creer un compt', 'nv compt', 'nv profl'],
      requiredKeywords: [],
      response: "Pour créer votre compte sur Vynal Platform :\n\n1. Inscription simple :\n   • Cliquez sur 'S\'inscrire'\n   • Remplissez vos informations\n   • Vérifiez votre email\n   • Complétez votre profil\n\n2. Types de comptes :\n   • Client : pour commander des services\n   • Freelance : pour proposer vos services\n   • Les deux : pour faire les deux !\n\n3. Vérification :\n   • Email obligatoire\n   • Téléphone recommandé\n   • Documents d'identité pour les freelances\n\nL'inscription est gratuite et prend moins de 5 minutes !",
      category: 'account'
    },
    {
      id: 'account_2',
      keywords: ['connexion', 'connexions', 'se connecter', 'connecter', 'login', 'log in', 'sign in', 'se connecter', 'connecter', 'connex', 'connexs', 'sconnect', 'sconnectr', 'log', 'login', 'signin', 's\'identifier', 'sidentifier', 'identifier', 'sid', 'sidnt', 'sidntfr'],
      requiredKeywords: [],
      response: "Pour vous connecter à votre compte :\n\n1. Accès :\n   • Cliquez sur 'Se connecter'\n   • Entrez votre email/mot de passe\n   • Ou utilisez les réseaux sociaux\n\n2. Sécurité :\n   • Mot de passe fort recommandé\n   • Authentification à deux facteurs disponible\n   • Déconnexion automatique après inactivité\n\n3. En cas d'oubli :\n   • Réinitialisation par email\n   • Support disponible 24/7\n\nBesoin d'aide pour vous connecter ?",
      category: 'account'
    },
    
    // Services et commandes
    {
      id: 'services_1',
      keywords: ['service', 'services', 'prestation', 'prestations', 'offre', 'offres', 'proposition', 'propositions', 'tarif', 'tarifs', 'prix', 'prix', 'coût', 'coûts', 'budget', 'budgets', 'facturation', 'facturations', 'payer', 'paiement', 'paiements', 'montant', 'montants', 'gratuit', 'gratuits', 'srv', 'srvce', 'srvces', 'presta', 'prestas', 'offr', 'offrs', 'prop', 'props', 'tar', 'tarf', 'prx', 'cout', 'cout', 'bgt', 'bgts', 'fact', 'facts', 'pay', 'payt', 'payts', 'mtt', 'mtts', 'grat', 'grats'],
      requiredKeywords: [],
      response: "Les services sur Vynal Platform sont variés et adaptés à vos besoins :\n\n• Création de contenu\n• Développement web\n• Design graphique\n• Marketing digital\n• Traduction\n• Et bien plus encore !\n\nLes tarifs varient selon :\n• Le type de service\n• L'expérience du freelance\n• La complexité du projet\n• Les délais demandés\n\nL'inscription et la consultation sont gratuites. Les frais ne s'appliquent qu'aux transactions réussies.",
      category: 'services'
    },
    {
      id: 'services_2',
      keywords: ['délai', 'délais', 'temps', 'durée', 'durations', 'quand', 'date', 'dates', 'rapidement', 'urgent', 'urgence', 'deadline', 'deadlines', 'échéance', 'échéances', 'calendrier', 'calendriers', 'planning', 'plannings', 'delai', 'delais', 'temp', 'duree', 'durees', 'quand', 'dat', 'dates', 'rapid', 'urg', 'urgs', 'dead', 'deadl', 'deadls', 'echeance', 'echeances', 'cal', 'cals', 'plan', 'plans'],
      requiredKeywords: [],
      response: "Les délais de livraison sur Vynal Platform :\n\n1. Types de projets :\n   • Petits projets : 1-3 jours\n   • Projets moyens : 1-2 semaines\n   • Projets complexes : 2-4 semaines\n\n2. Facteurs influençant les délais :\n   • Complexité du projet\n   • Disponibilité du freelance\n   • Révisions demandées\n   • Urgence de la demande\n\n3. Gestion des délais :\n   • Discussion préalable\n   • Planning détaillé\n   • Suivi régulier\n   • Alertes automatiques\n\nVoulez-vous des précisions sur les délais pour un type de projet spécifique ?",
      category: 'services'
    },
    
    // Paiements et finances
    {
      id: 'payment_1',
      keywords: ['paiement', 'paiements', 'payer', 'payé', 'payée', 'payés', 'payées', 'facture', 'factures', 'facturation', 'facturations', 'tarif', 'tarifs', 'prix', 'prix', 'coût', 'coûts', 'budget', 'budgets', 'montant', 'montants', 'payt', 'payts', 'pay', 'paye', 'payee', 'payes', 'payees', 'fact', 'facts', 'factu', 'factus', 'tar', 'tarf', 'prx', 'cout', 'cout', 'bgt', 'bgts', 'mtt', 'mtts', 'comment payer', 'je veux payer', 'faire un paiement', 'effectuer un paiement', 'moyens de paiement', 'méthodes de paiement'],
      requiredKeywords: [],
      response: "Pour effectuer un paiement sur Vynal Platform :\n\n1. Méthodes de paiement disponibles :\n   • Cartes bancaires (Visa, Mastercard)\n   • PayPal\n   • Solutions de paiement mobile africaines\n\n2. Processus sécurisé :\n   • Le paiement est retenu en garantie\n   • L'argent n'est versé au freelance qu'après validation\n   • Vous êtes protégé en cas de problème\n\n3. Frais de plateforme :\n   • Commission de 10% sur les transactions\n   • Pas de frais cachés\n   • Factures détaillées\n\nAvez-vous une question spécifique sur l'une de ces méthodes de paiement ?",
      category: 'payment',
      priority: 2
    },
    {
      id: 'payment_2',
      keywords: ['remboursement', 'remboursements', 'remboursé', 'remboursée', 'remboursés', 'remboursées', 'annulation', 'annulations', 'annulé', 'annulée', 'annulés', 'annulées', 'refund', 'refunds', 'cancel', 'cancels', 'cancelled', 'cancelled', 'cancelled', 'cancelled', 'remb', 'rembs', 'rembse', 'rembsee', 'rembses', 'rembsees', 'annul', 'annuls', 'annule', 'annulee', 'annules', 'annulees', 'ref', 'refs', 'cancel', 'cancels'],
      requiredKeywords: [],
      response: "Notre politique de remboursement est claire et équitable :\n\n1. Conditions de remboursement :\n   • Non-respect des délais\n   • Qualité insatisfaisante\n   • Non-conformité aux spécifications\n   • Annulation avant début du projet\n\n2. Processus :\n   • Contactez le support\n   • Expliquez la situation\n   • Fournissez les preuves\n   • Notre équipe examine votre demande\n\n3. Délais :\n   • Remboursement sous 5-7 jours ouvrés\n   • Notification par email\n   • Confirmation de transaction\n\nVoulez-vous plus de détails sur notre politique de remboursement ?",
      category: 'payment'
    },
    {
      id: 'payment_3',
      keywords: ['carte bancaire', 'carte bleue', 'visa', 'mastercard', 'cb', 'carte de crédit', 'carte de débit', 'paiement par carte', 'paiement cb'],
      requiredKeywords: [],
      response: "Pour payer par carte bancaire sur Vynal Platform :\n\n1. Processus :\n   • Sélectionnez 'Paiement par carte'\n   • Entrez vos informations de carte\n   • Confirmez le montant\n   • Validez la transaction\n\n2. Sécurité :\n   • Paiement 3D Secure\n   • Chiffrement SSL\n   • Pas de stockage des données\n\n3. Frais :\n   • Pas de frais supplémentaires\n   • Commission plateforme incluse\n\nVotre paiement est sécurisé et instantané !",
      category: 'payment',
      priority: 2
    },
    {
      id: 'payment_4',
      keywords: ['paypal', 'pay pal', 'paiement paypal', 'payer paypal'],
      requiredKeywords: [],
      response: "Pour payer avec PayPal sur Vynal Platform :\n\n1. Avantages :\n   • Paiement rapide et sécurisé\n   • Pas besoin de carte bancaire\n   • Protection acheteur incluse\n\n2. Processus :\n   • Sélectionnez 'Payer avec PayPal'\n   • Connectez-vous à votre compte\n   • Confirmez le paiement\n\n3. Sécurité :\n   • Protection PayPal\n   • Pas de frais cachés\n   • Transaction sécurisée\n\nVoulez-vous plus d'informations sur PayPal ?",
      category: 'payment',
      priority: 2
    },
    {
      id: 'payment_5',
      keywords: ['mobile money', 'mobile money', 'orange money', 'mtn mobile money', 'moov money', 'wave', 'wave money', 'paiement mobile', 'paiement par mobile'],
      requiredKeywords: [],
      response: "Pour payer avec Mobile Money sur Vynal Platform :\n\n1. Solutions disponibles :\n   • Orange Money\n   • MTN Mobile Money\n   • Moov Money\n   • Wave\n\n2. Processus :\n   • Sélectionnez votre opérateur\n   • Entrez votre numéro\n   • Confirmez le paiement\n   • Validez le code reçu\n\n3. Avantages :\n   • Paiement instantané\n   • Pas de frais supplémentaires\n   • Sécurisé et fiable\n\nQuelle solution Mobile Money utilisez-vous ?",
      category: 'payment',
      priority: 2
    },
    
    // Support et assistance
    {
      id: 'support_1',
      keywords: ['aide', 'aides', 'support', 'supports', 'assistance', 'assistances', 'help', 'helps', 'soutien', 'soutiens', 'aide moi', 'aidez moi', 'aidez-moi', 'aide-moi', 'help me', 'aide stp', 'aide svp', 'aide s\'il te plait', 'aide s\'il vous plait', 'aide s\'il te plaît', 'aide s\'il vous plaît', 'aid', 'aids', 'supp', 'supps', 'assist', 'assists', 'help', 'helps', 'sout', 'souts', 'aid moi', 'aid stp', 'aid svp', 'aid stp', 'aid svp'],
      requiredKeywords: [],
      response: "Notre équipe de support est là pour vous aider :\n\n1. Contact :\n   • Chat en direct 24/7\n   • Email : support@vynal.com\n   • Téléphone : +XX XXX XXX XXX\n\n2. Centre d'aide :\n   • Guides et tutoriels\n   • FAQ détaillée\n   • Vidéos explicatives\n\n3. Réponse rapide :\n   • Sous 24h par email\n   • Immédiat en chat\n   • Priorité aux urgences\n\nComment puis-je vous aider aujourd'hui ?",
      category: 'support'
    },
    {
      id: 'support_2',
      keywords: ['problème', 'problèmes', 'bug', 'bugs', 'erreur', 'erreurs', 'ne marche pas', 'ça ne fonctionne pas', 'impossible', 'bloqué', 'bloquée', 'bloqués', 'bloquées', 'planté', 'plantée', 'plantés', 'plantées', 'crash', 'crashes', 'dysfonctionnement', 'dysfonctionnements', 'pb', 'pbs', 'bug', 'bugs', 'err', 'errs', 'marche pas', 'fonctionne pas', 'imposs', 'bloq', 'bloqs', 'plant', 'plants', 'crash', 'crashes', 'dysf', 'dysfs'],
      requiredKeywords: [],
      response: "En cas de problème technique :\n\n1. Décrivez le problème :\n   • À quelle étape ça se produit\n   • Message d'erreur exact\n   • Actions effectuées\n\n2. Solutions rapides :\n   • Rafraîchir la page\n   • Vider le cache\n   • Se déconnecter/connecter\n\n3. Support technique :\n   • Capture d'écran\n   • Logs d'erreur\n   • Version du navigateur\n\nNotre équipe technique intervient rapidement !",
      category: 'support'
    },
    {
      id: 'support_3',
      keywords: ['urgence', 'urgent', 'problème urgent', 'aide urgente', 'sos', 'urgence', 'urgent', 'problème urgent', 'aide urgente', 'sos'],
      requiredKeywords: [],
      response: "Pour une assistance urgente sur Vynal Platform :\n\n1. Support prioritaire :\n   • Chat en direct 24/7\n   • Email : urgent@vynal.com\n   • Téléphone : +XX XXX XXX XXX\n\n2. Types d'urgences :\n   • Problème de paiement\n   • Litige actif\n   • Compte bloqué\n   • Problème technique critique\n\n3. Réponse garantie :\n   • Sous 1h en chat\n   • Sous 4h par email\n   • Intervention immédiate si nécessaire\n\nDécrivez votre urgence pour une prise en charge rapide.",
      category: 'support',
      priority: 3
    },
    {
      id: 'litige_1',
      keywords: ['litige', 'litiges', 'conflit', 'conflits', 'problème', 'problèmes', 'dispute', 'disputes', 'réclamation', 'réclamations', 'plainte', 'plaintes', 'ouvrir litige', 'créer litige', 'déposer litige', 'signaler problème', 'signaler litige', 'litige client', 'litige freelance', 'litige vendeur', 'litige acheteur'],
      requiredKeywords: [],
      response: "Pour ouvrir un litige sur Vynal Platform :\n\n1. Conditions d'ouverture :\n   • Non-respect des délais\n   • Travail non conforme\n   • Problème de qualité\n   • Non-respect des spécifications\n\n2. Processus :\n   • Accédez à la commande concernée\n   • Cliquez sur 'Ouvrir un litige'\n   • Décrivez le problème en détail\n   • Joignez les preuves (captures d'écran, messages)\n   • Précisez votre demande (remboursement, correction)\n\n3. Suivi :\n   • Notre équipe examine sous 24h\n   • Communication via la plateforme\n   • Médiation si nécessaire\n   • Résolution dans les 7 jours\n\n4. Protection :\n   • Paiement bloqué en garantie\n   • Équipe de médiation neutre\n   • Historique complet conservé\n\nVoulez-vous que je vous guide dans l'ouverture de votre litige ?",
      category: 'support',
      priority: 3
    },
    {
      id: 'litige_2',
      keywords: ['résoudre litige', 'solution litige', 'médiation', 'médiateur', 'arbitrage', 'arbitre', 'résolution litige', 'clôturer litige', 'fermer litige', 'terminer litige', 'conclure litige'],
      requiredKeywords: [],
      response: "Pour résoudre un litige sur Vynal Platform :\n\n1. Solutions possibles :\n   • Correction du travail\n   • Remboursement partiel\n   • Remboursement total\n   • Nouveau freelance\n\n2. Processus de médiation :\n   • Analyse des preuves\n   • Entretien avec les parties\n   • Proposition de solution\n   • Accord des deux parties\n\n3. Délais :\n   • Réponse sous 24h\n   • Résolution sous 7 jours\n   • Possibilité d'extension\n\n4. Garanties :\n   • Équipe neutre\n   • Confidentialité\n   • Protection des deux parties\n\nQuelle solution souhaitez-vous explorer ?",
      category: 'support',
      priority: 2
    },
    
    // Sécurité
    {
      id: 'security_1',
      keywords: ['sécurité', 'sécurisé', 'sécuriser', 'protéger', 'protection', 'confidentiel', 'confidentialité', 'privé', 'privée', 'privés', 'privées', 'données', 'donnée', 'données personnelles', 'donnée personnelle', 'rgpd', 'securite', 'securise', 'securiser', 'proteger', 'protection', 'confidentiel', 'confidentialite', 'prive', 'privee', 'prives', 'privees', 'donnees', 'donnee', 'donnees perso', 'donnee perso', 'secur', 'securis', 'protect', 'confid', 'confidnt', 'prive', 'donn', 'donns', 'rgpd', 'rgp', 'rgpde'],
      requiredKeywords: [],
      response: "La sécurité est notre priorité sur Vynal Platform :\n\n1. Protection des données :\n   • Chiffrement de bout en bout\n   • Conformité RGPD\n   • Stockage sécurisé\n\n2. Sécurité des comptes :\n   • Authentification à deux facteurs\n   • Détection des connexions suspectes\n   • Alertes de sécurité\n\n3. Transactions :\n   • Paiements sécurisés\n   • Protection contre les fraudes\n   • Système d'escrow\n\nVos données sont en sécurité avec nous !",
      category: 'security'
    },
    {
      id: 'confidentialite_1',
      keywords: ['politique confidentialité', 'confidentialité', 'protection données', 'données personnelles', 'vie privée', 'privacy policy'],
      requiredKeywords: [],
      response: "Notre politique de confidentialité couvre :\n\n1. Collecte des données :\n   • Informations de compte\n   • Données de profil\n   • Informations de paiement\n   • Historique des transactions\n   • Communications\n   • Contenu généré\n\n2. Utilisation des données :\n   • Fourniture des services\n   • Traitement des retraits\n   • Personnalisation\n   • Amélioration des services\n   • Communication\n   • Marketing\n   • Sécurité\n\n3. Protection :\n   • Chiffrement\n   • Contrôles d'accès\n   • Pare-feu\n   • Audits réguliers\n\nPour plus de détails, consultez notre /privacy-policy.\n\nVoulez-vous plus de détails sur un aspect particulier ?",
      category: 'security',
      priority: 1
    },
    {
      id: 'confidentialite_2',
      keywords: ['partage données', 'données partagées', 'transfert données', 'données tiers', 'partenaires'],
      requiredKeywords: [],
      response: "Le partage de vos données :\n\n1. Avec qui :\n   • Autres utilisateurs (profil, évaluations)\n   • Prestataires de services\n   • Partenaires commerciaux\n   • Autorités légales si requis\n\n2. Garanties :\n   • Pas de vente de données\n   • Accords de confidentialité\n   • Sécurité renforcée\n   • Contrôle strict\n\n3. Vos droits :\n   • Accès à vos données\n   • Rectification\n   • Suppression\n   • Opposition\n   • Portabilité\n\nPour plus d'informations, consultez :\n• /privacy-policy\n• /terms-of-service\n• /code-of-conduct\n\nBesoin de plus d'informations ?",
      category: 'security',
      priority: 2
    },
    {
      id: 'confidentialite_3',
      keywords: ['conservation données', 'durée conservation', 'suppression données', 'archivage', 'rétention'],
      requiredKeywords: [],
      response: "La conservation de vos données :\n\n1. Durée :\n   • Pendant l'utilisation active\n   • Selon obligations légales\n   • 5 ans minimum pour données financières\n\n2. Critères :\n   • Compte actif\n   • Transactions en cours\n   • Obligations légales\n   • Périodes de prescription\n\n3. Suppression :\n   • Sur demande\n   • Après inactivité\n   • Conformité RGPD\n\nPour plus de détails sur notre /privacy-policy.\n\nAvez-vous des questions sur la durée de conservation ?",
      category: 'security',
      priority: 2
    },
    {
      id: 'confidentialite_4',
      keywords: ['droits données', 'droits RGPD', 'protection vie privée', 'contrôle données', 'gestion données'],
      requiredKeywords: [],
      response: "Vos droits concernant vos données :\n\n1. Droits principaux :\n   • Accès et portabilité\n   • Rectification\n   • Suppression\n   • Opposition\n   • Limitation\n\n2. Exercice des droits :\n   • Via paramètres compte\n   • Contact support\n   • Délai de réponse : 30 jours\n\n3. Protection :\n   • Vérification identité\n   • Gratuité\n   • Confidentialité\n\nPour exercer vos droits ou en savoir plus :\n• /privacy-policy\n• /terms-of-service\n• /code-of-conduct\n\nBesoin d'aide pour exercer vos droits ?",
      category: 'security',
      priority: 1
    },
    
    // Freelance
    {
      id: 'freelance_1',
      keywords: ['freelance', 'prestataire', 'expert', 'professionnel', 'talent', 'spécialiste', 'consultant', 'indépendant', 'créateur', 'artisan', 'freelance', 'prestataire', 'expert', 'professionnel', 'talent', 'specialiste', 'consultant', 'independant', 'createur', 'artisan'],
      requiredKeywords: [],
      response: "En tant que freelance sur Vynal Platform :\n\n• Créez un profil professionnel attractif\n• Proposez vos services ou répondez aux projets\n• Fixez vos tarifs et délais\n• Gérez vos projets et clients\n• Développez votre réputation\n\nRejoignez notre communauté de talents africains !",
      category: 'freelance'
    },
    
    // Client
    {
      id: 'client_1',
      keywords: ['client', 'acheteur', 'entreprise', 'projet', 'commande', 'besoin', 'demande', 'mission', 'travail', 'service'],
      requiredKeywords: [],
      response: "En tant que client sur Vynal Platform :\n\n• Publiez vos projets ou recherchez des services\n• Comparez les offres et profils\n• Communiquez avec les freelances\n• Suivez l'avancement de vos projets\n• Évaluez les prestations\n\nTrouvez le talent parfait pour votre projet !",
      category: 'client'
    },
    
    // Communication
    {
      id: 'communication_1',
      keywords: ['message', 'messages', 'messagerie', 'messageries', 'chat', 'chats', 'discussion', 'discussions', 'conversation', 'conversations', 'communiquer', 'communication', 'contacter', 'contact', 'msg', 'msgs', 'msgrie', 'msgries', 'chat', 'chats', 'discuss', 'discusss', 'conv', 'convs', 'commun', 'communs', 'contact', 'contacts', 'message', 'messages', 'messagerie', 'messageries', 'chat', 'chats', 'discussion', 'discussions', 'conversation', 'conversations', 'communiquer', 'communication', 'contacter', 'contact'],
      requiredKeywords: [],
      response: "La messagerie sur Vynal Platform :\n\n1. Fonctionnalités :\n   • Chat en temps réel\n   • Partage de fichiers\n   • Notifications\n\n2. Utilisation :\n   • Accès depuis le projet\n   • Historique complet\n   • Recherche de messages\n\n3. Sécurité :\n   • Messages chiffrés\n   • Traçabilité\n   • Protection des données\n\nBesoin d'aide pour la messagerie ?",
      category: 'communication'
    },
    
    // Contextuel
    {
      id: 'context_1',
      keywords: ['et après', 'ensuite', 'puis', 'la suite', 'prochaine étape', 'et puis', 'et ensuite', 'que faire ensuite', 'et maintenant', 'autre chose', 'quoi d\'autre'],
      requiredKeywords: [],
      response: "Pour poursuivre votre progression sur Vynal Platform, l'étape suivante dépend de votre objectif actuel. Pourriez-vous me préciser ce que vous souhaitez accomplir ? Je pourrai alors vous guider vers les prochaines actions pertinentes.",
      category: 'general',
      priority: 2
    },
    {
      id: 'context_2',
      keywords: ['pourquoi', 'pour quelle raison', 'pour quoi', 'à quoi ça sert', 'à quoi sert', 'quel intérêt', 'quelle utilité', 'expliquer pourquoi', 'expliquez pourquoi'],
      requiredKeywords: [],
      response: "C'est une excellente question. Les raisons principales sont :\n\n• La sécurité des transactions pour toutes les parties\n• La garantie de qualité et de conformité\n• La protection contre les fraudes et litiges\n• L'amélioration continue de l'expérience utilisateur\n\nSouhaitez-vous des détails supplémentaires sur l'un de ces aspects ?",
      category: 'general',
      priority: 1
    },
    {
      id: 'context_3',
      keywords: ['je comprends pas', 'pas compris', 'je ne comprends pas', 'pas clair', 'confusion', 'confus', 'perdu', 'explique mieux', 'plus simple', 'je suis perdu', 'jsp', 'je sais pas', 'j\'sais pas', 'chep', 'jsai', 'chai', 'je comprends pas', 'je comprends pas', 'je comprends pas', 'je comprends pas', 'je comprends pas', 'je comprends pas'],
      requiredKeywords: [],
      response: "Je vous prie de m'excuser pour le manque de clarté. Essayons de simplifier :\n\n1. Vynal Platform est une marketplace qui connecte freelances et clients\n2. Les clients publient des projets ou recherchent des services\n3. Les freelances proposent leurs services ou répondent aux projets\n4. Le paiement est sécurisé (système d'escrow)\n5. Le travail est livré, validé, puis le paiement est débloqué\n\nQuelle partie vous semble encore confuse ? Je serai heureux de clarifier davantage.",
      category: 'general',
      priority: 2
    },
    {
      id: 'freelance_2',
      keywords: ['je veux un freelance', 'chercher freelance', 'trouver freelance', 'recruter', 'embaucher', 'engager', 'freelance'],
      requiredKeywords: [],
      response: "Pour trouver le freelance idéal sur Vynal Platform :\n\n1. Explorez notre catalogue de freelances :\n   • Parcourez les profils par catégorie\n   • Utilisez les filtres (compétences, expérience, tarifs)\n   • Consultez les portfolios et avis clients\n\n2. Publiez votre projet :\n   • Décrivez précisément vos besoins\n   • Fixez un budget et des délais réalistes\n   • Recevez des propositions de freelances qualifiés\n\n3. Sélectionnez le meilleur candidat :\n   • Comparez les offres et expériences\n   • Vérifiez les évaluations et retours clients\n   • Discutez des détails du projet\n\nNotre système de paiement sécurisé (escrow) vous protège à chaque étape. Souhaitez-vous plus de détails sur un aspect particulier ?",
      category: 'freelance'
    },
    {
      id: 'freelance_3',
      keywords: ['comment avoir des clients', 'trouver clients', 'obtenir clients', 'attirer clients', 'plus de clients', 'développer clientèle', 'infos pour avoir des clients', 'clients', 'avoir des clients', 'trouver des clients', 'chercher des clients', 'comment obtenir plus de clients', 'comment vendre plus', 'vendre plus', 'plus de ventes', 'augmenter ventes', 'plus de commandes', 'augmenter clients', 'attirer plus de clients', 'obtenir plus de clients', 'comment augmenter clients'],
      requiredKeywords: [],
      response: "Pour développer votre clientèle sur Vynal Platform :\n\n1. Optimisez votre profil :\n   • Créez un profil professionnel détaillé\n   • Ajoutez un portfolio attractif\n   • Mettez en avant vos compétences clés\n   • Incluez des témoignages clients\n\n2. Proposez des services attractifs :\n   • Créez des offres claires et détaillées\n   • Fixez des tarifs compétitifs\n   • Proposez des délais réalistes\n   • Ajoutez des extras valorisants\n\n3. Stratégies de visibilité :\n   • Répondez rapidement aux demandes\n   • Maintenez un taux de satisfaction élevé\n   • Demandez des avis à vos clients\n   • Mettez régulièrement à jour votre profil\n\n4. Bonnes pratiques :\n   • Communiquez professionnellement\n   • Respectez toujours les délais\n   • Proposez des révisions gratuites\n   • Soyez transparent sur vos tarifs\n\nVoulez-vous des conseils plus spécifiques sur l'un de ces aspects ?",
      category: 'freelance'
    },
    {
      id: 'follow_up_1',
      keywords: ['et toi', 'et vous', 'ton avis', 'votre avis', 'penses-tu', 'pensez-vous', 'que penses-tu', 'que pensez-vous', 'selon toi', 'selon vous'],
      requiredKeywords: [],
      response: "En tant qu'assistant de Vynal Platform, mon objectif est de vous fournir des informations précises et objectives. Je vous encourage à explorer la plateforme par vous-même pour former votre propre opinion, ou à lire les témoignages des utilisateurs pour connaître leurs expériences. Si vous avez des questions spécifiques sur des fonctionnalités ou des processus, je serai ravi d'y répondre.",
      category: 'general',
      priority: 1
    },
    {
      id: 'follow_up_2',
      keywords: ['plus d\'info', 'plus d\'infos', 'plus d\'information', 'plus d\'informations', 'détail', 'détails', 'approfondir', 'élaborer', 'expliquer', 'développer'],
      requiredKeywords: [],
      response: "Je serais ravi de vous donner plus de détails. Pour vous fournir des informations pertinentes, pourriez-vous préciser quel aspect vous intéresse particulièrement ? Par exemple :\n\n• Le processus d'inscription\n• La création de services\n• Le système de paiement\n• La protection contre les litiges\n• Les fonctionnalités de communication\n\nN'hésitez pas à me préciser votre domaine d'intérêt, et je vous fournirai des informations approfondies.",
      category: 'general',
      priority: 2
    },
    {
      id: 'services_3',
      keywords: ['développement web', 'site web', 'application web', 'web app', 'site internet', 'création site', 'créer site', 'développeur web', 'programmeur web'],
      requiredKeywords: [],
      response: "Pour vos projets de développement web sur Vynal Platform :\n\n1. Services disponibles :\n   • Sites vitrines\n   • E-commerce\n   • Applications web\n   • Sites WordPress\n   • Intégration API\n\n2. Compétences recherchées :\n   • Front-end (React, Vue, Angular)\n   • Back-end (Node.js, PHP, Python)\n   • Base de données\n   • UI/UX Design\n\n3. Processus :\n   • Définition des besoins\n   • Devis personnalisé\n   • Développement\n   • Tests et validation\n\nSouhaitez-vous lancer un projet web ?",
      category: 'services',
      priority: 2
    },
    {
      id: 'services_4',
      keywords: ['design', 'graphisme', 'logo', 'identité visuelle', 'charte graphique', 'maquette', 'ui design', 'ux design', 'designer', 'graphiste'],
      requiredKeywords: [],
      response: "Pour vos besoins en design sur Vynal Platform :\n\n1. Services proposés :\n   • Création de logo\n   • Identité visuelle\n   • Charte graphique\n   • UI/UX Design\n   • Maquettes web\n\n2. Formats livrés :\n   • Fichiers sources (AI, PSD)\n   • Formats web (PNG, SVG)\n   • Versions print (PDF)\n   • Guide d'utilisation\n\n3. Processus :\n   • Brief créatif\n   • Propositions\n   • Révisions\n   • Livraison finale\n\nQuel type de design recherchez-vous ?",
      category: 'services',
      priority: 2
    },
    {
      id: 'annulation_1',
      keywords: ['annuler', 'annulation', 'annuler commande', 'annuler projet', 'annuler service', 'annuler mission', 'annuler travail', 'annuler prestation', 'annuler achat', 'annuler vente', 'annuler transaction', 'annuler paiement', 'annuler facture', 'annuler devis', 'annuler proposition', 'annuler offre', 'annuler demande', 'annuler réservation', 'annuler engagement'],
      requiredKeywords: [],
      response: "Pour annuler une commande sur Vynal Platform :\n\n1. Conditions d'annulation :\n   • Avant le début du projet : annulation gratuite\n   • Pendant le projet : selon l'avancement\n   • Après livraison : via litige si nécessaire\n\n2. Processus d'annulation :\n   • Accédez à la commande concernée\n   • Cliquez sur 'Annuler la commande'\n   • Sélectionnez le motif d'annulation\n   • Confirmez l'annulation\n\n3. Conséquences :\n   • Remboursement selon la politique\n   • Notification au freelance\n   • Mise à jour du statut\n\n4. Délais :\n   • Annulation immédiate\n   • Remboursement sous 5-7 jours\n   • Notification par email\n\nVoulez-vous que je vous guide dans l'annulation de votre commande ?",
      category: 'cancellation',
      priority: 3
    },
    {
      id: 'annulation_2',
      keywords: ['remboursement annulation', 'rembourser annulation', 'remboursé annulation', 'remboursement annulé', 'rembourser annulé', 'remboursé annulé', 'argent annulation', 'argent annulé', 'paiement annulation', 'paiement annulé', 'facture annulation', 'facture annulée'],
      requiredKeywords: [],
      response: "Politique de remboursement pour les annulations :\n\n1. Avant début du projet :\n   • Remboursement à 100%\n   • Sans frais\n   • Sous 5-7 jours ouvrés\n\n2. Pendant le projet :\n   • Remboursement partiel selon l'avancement\n   • Frais de service calculés au prorata\n   • Négociation possible avec le freelance\n\n3. Processus de remboursement :\n   • Vérification de l'état du projet\n   • Calcul du montant à rembourser\n   • Traitement par notre équipe\n   • Notification par email\n\n4. Méthodes de remboursement :\n   • Même moyen que le paiement initial\n   • Versement sur le compte Vynal\n   • Virement bancaire\n\nAvez-vous besoin de plus de détails sur le remboursement ?",
      category: 'cancellation',
      priority: 2
    },
    {
      id: 'annulation_3',
      keywords: ['annuler freelance', 'annuler vendeur', 'annuler prestataire', 'annuler expert', 'annuler professionnel', 'annuler talent', 'annuler spécialiste', 'annuler consultant', 'annuler indépendant', 'annuler créateur'],
      requiredKeywords: [],
      response: "Pour annuler une collaboration avec un freelance :\n\n1. Avant de commencer :\n   • Annulation gratuite\n   • Pas d'impact sur votre compte\n   • Possibilité de choisir un autre freelance\n\n2. Pendant le projet :\n   • Discussion avec le freelance\n   • Évaluation de l'avancement\n   • Calcul du remboursement\n   • Transfert vers un autre freelance si nécessaire\n\n3. Protection :\n   • Paiement sécurisé en attente\n   • Médiation disponible\n   • Historique conservé\n\n4. Bonnes pratiques :\n   • Communication claire\n   • Respect des délais\n   • Documentation des échanges\n\nSouhaitez-vous annuler une collaboration en cours ?",
      category: 'cancellation',
      priority: 2
    },
    {
      id: 'projet_1',
      keywords: ['gérer projet', 'suivre projet', 'avancement projet', 'état projet', 'statut projet', 'progression projet', 'suivi projet', 'monitorer projet', 'superviser projet', 'contrôler projet', 'piloter projet', 'diriger projet', 'coordonner projet', 'organiser projet', 'planifier projet'],
      requiredKeywords: [],
      response: "Pour gérer efficacement votre projet sur Vynal Platform :\n\n1. Tableau de bord projet :\n   • Vue d'ensemble de l'avancement\n   • Jalons et deadlines\n   • Communications avec le freelance\n   • Livrables et révisions\n\n2. Outils de suivi :\n   • Calendrier interactif\n   • Liste des tâches\n   • Historique des modifications\n   • Notifications en temps réel\n\n3. Communication :\n   • Messagerie intégrée\n   • Partage de fichiers\n   • Commentaires sur les livrables\n   • Réunions virtuelles\n\n4. Livraison :\n   • Validation des étapes\n   • Révisions et corrections\n   • Finalisation du projet\n   • Évaluation du freelance\n\nVoulez-vous des détails sur un aspect particulier de la gestion de projet ?",
      category: 'project',
      priority: 2
    },
    {
      id: 'freelance_4',
      keywords: ['profil freelance', 'profil vendeur', 'profil prestataire', 'profil expert', 'profil professionnel', 'profil talent', 'profil spécialiste', 'profil consultant', 'profil indépendant', 'profil créateur', 'optimiser profil', 'améliorer profil', 'compléter profil', 'mettre à jour profil', 'modifier profil'],
      requiredKeywords: [],
      response: "Pour optimiser votre profil freelance sur Vynal Platform :\n\n1. Informations essentielles :\n   • Photo professionnelle\n   • Titre accrocheur\n   • Description détaillée\n   • Compétences clés\n   • Expérience pertinente\n\n2. Portfolio :\n   • Projets précédents\n   • Réalisations marquantes\n   • Témoignages clients\n   • Certifications\n\n3. Tarification :\n   • Tarifs par service\n   • Packages attractifs\n   • Options de réduction\n   • Politique de révision\n\n4. Visibilité :\n   • Mots-clés pertinents\n   • Catégories précises\n   • Disponibilité à jour\n   • Taux de réponse rapide\n\nSouhaitez-vous des conseils pour améliorer votre profil ?",
      category: 'freelance',
      priority: 2
    },
    {
      id: 'avance_1',
      keywords: ['fonctionnalités avancées', 'outils avancés', 'options avancées', 'paramètres avancés', 'fonctionnalités pro', 'outils pro', 'options pro', 'paramètres pro', 'fonctionnalités premium', 'outils premium', 'options premium', 'paramètres premium'],
      requiredKeywords: [],
      response: "Les fonctionnalités avancées de Vynal Platform :\n\n1. Gestion de projet :\n   • Tableau Kanban\n   • Gestion des ressources\n   • Suivi du temps\n   • Rapports détaillés\n\n2. Communication :\n   • Appels vidéo intégrés\n   • Partage d'écran\n   • Collaboration en temps réel\n   • Traduction automatique\n\n3. Facturation :\n   • Factures automatisées\n   • Suivi des paiements\n   • Rapports financiers\n   • Gestion des taxes\n\n4. Analytics :\n   • Statistiques de performance\n   • Analyse de marché\n   • Insights clients\n   • Prévisions de revenus\n\nVoulez-vous en savoir plus sur une fonctionnalité spécifique ?",
      category: 'advanced_features',
      priority: 2
    },
    {
      id: 'client_2',
      keywords: ['trouver freelance', 'rechercher freelance', 'chercher freelance', 'découvrir freelance', 'explorer freelance', 'parcourir freelance', 'filtrer freelance', 'trier freelance', 'sélectionner freelance', 'choisir freelance', 'embaucher freelance', 'recruter freelance', 'engager freelance'],
      requiredKeywords: [],
      response: "Pour trouver le freelance idéal sur Vynal Platform :\n\n1. Recherche avancée :\n   • Filtres par compétences\n   • Filtres par expérience\n   • Filtres par tarifs\n   • Filtres par disponibilité\n\n2. Évaluation :\n   • Notes et avis clients\n   • Portfolio de projets\n   • Taux de réussite\n   • Temps de réponse\n\n3. Communication :\n   • Message direct\n   • Appel vidéo\n   • Partage de documents\n   • Négociation des termes\n\n4. Sélection :\n   • Comparaison des profils\n   • Vérification des références\n   • Test de compétences\n   • Accord sur les modalités\n\nQuel type de freelance recherchez-vous ?",
      category: 'client',
      priority: 2
    },
    {
      id: 'securite_2',
      keywords: ['protection données', 'sécurité données', 'confidentialité données', 'privacy', 'données personnelles', 'informations personnelles', 'vie privée', 'protection vie privée', 'sécurité vie privée', 'confidentialité vie privée'],
      requiredKeywords: [],
      response: "La protection de vos données sur Vynal Platform :\n\n1. Mesures de sécurité :\n   • Chiffrement de bout en bout\n   • Authentification à deux facteurs\n   • Surveillance 24/7\n   • Sauvegardes régulières\n\n2. Données protégées :\n   • Informations personnelles\n   • Documents professionnels\n   • Communications privées\n   • Historique des transactions\n\n3. Conformité :\n   • RGPD\n   • Normes internationales\n   • Audits réguliers\n   • Politique de confidentialité\n\n4. Contrôle :\n   • Gestion des autorisations\n   • Export des données\n   • Suppression des données\n   • Historique des accès\n\nAvez-vous des questions sur la protection de vos données ?",
      category: 'security',
      priority: 2
    },
    {
      id: 'conditions_1',
      keywords: ['conditions utilisation', 'conditions d\'utilisation', 'règles', 'règlement', 'charte', 'politique', 'conditions générales', 'cgv', 'cgvu', 'terms', 'terms of use', 'terms of service', 'tos'],
      requiredKeywords: [],
      response: "Les règles de Vynal Platform :\n\n• 18 ans minimum pour votre sécurité\n• Un compte unique pour une meilleure expérience\n• Vos informations à jour pour vous accompagner au mieux\n• Paiements sécurisés sur la plateforme\n• Un environnement respectueux pour tous\n• Des services 100% légaux\n• Une communication fluide via la plateforme\n\nPour plus d'informations :\n• /terms-of-service\n• /privacy-policy\n• /code-of-conduct\n\nPuis-je vous éclairer sur un point en particulier ?",
      category: 'legal',
      priority: 1
    },
    {
      id: 'conditions_2',
      keywords: ['interdit', 'interdits', 'interdiction', 'interdictions', 'pas autorisé', 'non autorisé', 'interdit de', 'ne pas', 'ne jamais', 'défendu', 'défendus', 'défense', 'défenses', 'prohibé', 'prohibés', 'prohibition', 'prohibitions'],
      requiredKeywords: [],
      response: "Pour le bien-être de tous, nous veillons à maintenir un environnement sain sur Vynal Platform :\n\n• Respect mutuel et bienveillance\n• Services conformes à la loi\n• Transactions sécurisées sur la plateforme\n• Protection de vos données personnelles\n• Authenticité des profils\n• Transparence dans nos échanges\n\nPour plus de détails :\n• /terms-of-service\n• /code-of-conduct\n\nNous vous remercions de votre compréhension. Avez-vous des questions ?",
      category: 'legal',
      priority: 2
    },
    {
      id: 'conditions_3',
      keywords: ['sanction', 'sanctions', 'punition', 'punitions', 'avertissement', 'avertissements', 'suspension', 'suspensions', 'bannissement', 'bannissements', 'exclusion', 'exclusions', 'blocage', 'blocages', 'restriction', 'restrictions'],
      requiredKeywords: [],
      response: "Nous privilégions toujours le dialogue, mais en cas de non-respect des règles :\n\n• Un avertissement amical\n• Une suspension temporaire si nécessaire\n• Une restriction d'accès en cas de récidive\n• Un bannissement en dernier recours\n\nNous vous informons toujours et vous laissons vous expliquer avant toute décision.\n\nPour plus de détails :\n• /terms-of-service\n• /code-of-conduct\n\nSouhaitez-vous plus de détails sur notre approche ?",
      category: 'legal',
      priority: 2
    },
    {
      id: 'retrait_1',
      keywords: ['retrait', 'retraits', 'retirer', 'retirer argent', 'retirer fonds', 'retirer gains', 'retirer paiement', 'retirer commission', 'retirer solde', 'retirer montant', 'retirer somme', 'retirer revenus', 'retirer bénéfices', 'retirer profits', 'retirer rémunération', 'retirer salaire', 'retirer honoraires', 'retirer facturation', 'retirer paiement'],
      requiredKeywords: [],
      response: "Pour retirer vos fonds sur Vynal Platform :\n\n1. Conditions générales :\n   • Montant minimum : 2000 FCFA\n   • Frais de service : 20% sur tous les retraits\n   • Délai de traitement : 24h pour mobile money, 3-5 jours pour virements bancaires\n\n2. Processus :\n   • Accédez à votre portefeuille\n   • Cliquez sur 'Retirer des fonds'\n   • Choisissez votre méthode de retrait\n   • Confirmez le montant\n\n3. Méthodes disponibles :\n   • Orange Money\n   • Wave\n   • Virements bancaires\n\nVoulez-vous plus de détails sur une méthode spécifique ?",
      category: 'payment',
      priority: 2
    },
    {
      id: 'retrait_2',
      keywords: ['délai retrait', 'temps retrait', 'durée retrait', 'quand retrait', 'retrait quand', 'retrait délai', 'retrait temps', 'retrait durée', 'retrait combien temps', 'retrait combien de temps', 'retrait attendre', 'retrait attente', 'retrait patienter', 'retrait patience', 'retrait immédiat', 'retrait instantané', 'retrait rapide', 'retrait lent', 'retrait long', 'retrait court'],
      requiredKeywords: [],
      response: "Les délais de retrait sur Vynal Platform :\n\n1. Délais standard :\n   • Paiements mobiles (Orange Money, Wave) : 24h\n   • Virements bancaires : 3-5 jours ouvrés\n\n2. Facteurs influençant les délais :\n   • Méthode de paiement choisie\n   • Montant du retrait\n   • Vérifications de sécurité\n   • Disponibilité des services\n\n3. Conseils :\n   • Vérifiez vos informations de paiement\n   • Évitez les retraits en fin de semaine\n   • Privilégiez les méthodes mobiles pour plus de rapidité\n\nAvez-vous besoin d'aide pour accélérer votre retrait ?",
      category: 'payment',
      priority: 2
    },
    {
      id: 'retrait_3',
      keywords: ['frais retrait', 'commission retrait', 'coût retrait', 'prix retrait', 'tarif retrait', 'montant retrait', 'somme retrait', 'argent retrait', 'retrait frais', 'retrait commission', 'retrait coût', 'retrait prix', 'retrait tarif', 'retrait montant', 'retrait somme', 'retrait argent', 'retrait combien', 'retrait combien ça coûte', 'retrait combien ça vaut', 'retrait combien ça fait'],
      requiredKeywords: [],
      response: "Les frais de retrait sur Vynal Platform :\n\n1. Structure des frais :\n   • Taux fixe : 20% sur tous les retraits\n   • Inclut : frais de transfert, traitement et services tiers\n\n2. Calcul du montant net :\n   • Montant net = Montant brut - (Montant brut × 20%)\n   • Exemple : 10 000 FCFA → 8 000 FCFA net\n\n3. Points importants :\n   • Frais transparents\n   • Pas de frais cachés\n   • Facture détaillée fournie\n\nVoulez-vous que je calcule les frais pour un montant spécifique ?",
      category: 'payment',
      priority: 2
    },
    {
      id: 'retrait_4',
      keywords: ['problème retrait', 'erreur retrait', 'retrait bloqué', 'retrait refusé', 'retrait échoué', 'retrait impossible', 'retrait pas possible', 'retrait ne marche pas', 'retrait ne fonctionne pas', 'retrait bug', 'retrait buggé', 'retrait planté', 'retrait en attente', 'retrait en cours', 'retrait en traitement', 'retrait en validation', 'retrait en vérification', 'retrait en analyse', 'retrait en contrôle', 'retrait en examen'],
      requiredKeywords: [],
      response: "En cas de problème avec votre retrait :\n\n1. Vérifications à faire :\n   • Solde suffisant (minimum 2000 FCFA)\n   • Informations de paiement à jour\n   • Compte vérifié et actif\n   • Pas de litige en cours\n\n2. Solutions possibles :\n   • Vérifiez le statut dans l'historique\n   • Contactez le support avec l'ID de transaction\n   • Vérifiez vos emails pour les notifications\n\n3. Support disponible :\n   • Email : support@vynalplatform.com\n   • Chat en direct (heures d'ouverture)\n   • Formulaire de contact\n\nPuis-je vous aider à résoudre votre problème ?",
      category: 'payment',
      priority: 3
    },
    {
      id: 'droits_utilisateur_1',
      keywords: ['droits utilisateur', 'droits client', 'droits freelance', 'engagements', 'obligations', 'conditions utilisateur'],
      requiredKeywords: [],
      response: "Vos droits et obligations sur Vynal Platform :\n\nNous nous engageons à vous offrir :\n• Un accès complet à nos services\n• Une protection optimale de vos données\n• Un support réactif à votre écoute\n• Des remboursements selon nos conditions\n\nEn retour, nous vous remercions de :\n• Respecter nos /terms-of-service\n• Régler les frais de service\n• Communiquer avec transparence\n• Préserver la confidentialité\n\nPour plus d'informations :\n• /privacy-policy\n• /code-of-conduct\n\nPuis-je vous apporter des précisions ?",
      category: 'legal',
      priority: 1
    }
  ];
  
  // État initial du contexte
  export const createNewContext = (): ConversationContext => ({
    conversationFlow: []
  });