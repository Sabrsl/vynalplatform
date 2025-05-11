import nlp from 'compromise';
import type { KnowledgeEntry } from '@/data/chatbotKnowledgeBase';

// Type pour le résultat du matching
export type MatchResult = {
  response: string;
  confidence: number;
  category: string;
} | null;

/**
 * Algorithme de matching amélioré pour trouver la réponse la plus pertinente
 * @param input Message de l'utilisateur
 * @param base Base de connaissances
 * @param context Contexte de la conversation (catégories précédentes)
 * @returns La meilleure correspondance ou null
 */
export function findBestAnswer(input: string, base: KnowledgeEntry[], context: string[] = []): MatchResult {
  const normalizedInput = input.toLowerCase();
  const doc = nlp(normalizedInput);
  
  // Extraire les entités, sujets et intentions
  const topics = doc.topics().out('array') as string[];
  const verbs = doc.verbs().out('array') as string[];
  const nouns = doc.nouns().out('array') as string[];
  
  let bestMatch: KnowledgeEntry | null = null;
  let highestScore = 0;
  
  for (const entry of base) {
    // Score de base
    let score = 0;
    
    // Vérifier d'abord les mots-clés requis
    const hasAllRequired = entry.requiredKeywords ? 
      entry.requiredKeywords.every(k => normalizedInput.includes(k)) : 
      true;
    
    if (!hasAllRequired) continue;
    
    // Augmenter le score pour chaque mot-clé trouvé
    for (const keyword of entry.keywords) {
      if (normalizedInput.includes(keyword)) {
        score += 10;
      }
    }
    
    // Bonus pour les correspondances exactes de sujets
    topics.forEach(topic => {
      if (entry.keywords.includes(topic.toLowerCase())) {
        score += 5;
      }
    });
    
    // Bonus pour le contexte de conversation
    if (context.includes(entry.category)) {
      score += 15;
    }
    
    // Si le score est meilleur, mettre à jour le meilleur match
    if (score > highestScore) {
      highestScore = score;
      bestMatch = entry;
    }
  }
  
  // Retourner la meilleure correspondance si elle dépasse un seuil
  if (bestMatch && highestScore > 15) {
    return {
      response: bestMatch.response,
      confidence: highestScore,
      category: bestMatch.category
    };
  }
  
  return null;
}

/**
 * Analyse le contexte de la conversation et retourne les catégories identifiées
 * @param message Message de l'utilisateur
 * @returns Liste des catégories identifiées
 */
export function analyzeConversationContext(message: string): string[] {
  const normalizedMessage = message.toLowerCase().trim();
  const doc = nlp(normalizedMessage);
  
  // Extraire les sujets, verbes et entités
  const topics = doc.topics().out('array') as string[];
  const nouns = doc.nouns().out('array') as string[];
  const verbs = doc.verbs().out('array') as string[];
  
  // Catégoriser la question en fonction des mots-clés extraits
  const allWords = [...topics, ...nouns, ...verbs].map(w => w.toLowerCase());
  
  // Catégories de sujets possibles
  const categories: Record<string, string[]> = {
    payment: ['paiement', 'prix', 'coût', 'tarif', 'commission', 'frais', 'argent'],
    security: ['sécurité', 'confiance', 'protection', 'garantie', 'fiable', 'sûr'],
    process: ['étape', 'processus', 'fonctionnement', 'comment', 'marche', 'délai'],
    onboarding: ['début', 'commencer', 'inscription', 'rejoindre', 'créer', 'profile'],
    support: ['support', 'aide', 'assistance', 'contact', 'besoin', 'question'],
    quality: ['qualité', 'bon', 'niveau', 'compétence', 'expérience', 'expert']
  };
  
  // Identifier les catégories pertinentes
  const identifiedCategories = Object.entries(categories)
    .filter(([_, keywords]) => 
      keywords.some(keyword => allWords.includes(keyword) || normalizedMessage.includes(keyword))
    )
    .map(([category]) => category);
  
  return identifiedCategories;
}

/**
 * Détermine le type d'utilisateur (client ou freelance) en fonction de son message
 * @param message Message de l'utilisateur
 * @returns Type d'utilisateur identifié ou 'undetermined'
 */
export function determineUserType(message: string): 'client' | 'freelance' | 'undetermined' {
  const lowercaseMsg = message.toLowerCase().trim();
  const doc = nlp(lowercaseMsg);
  
  // Utiliser compromise pour une meilleure détection
  const topics = doc.topics().out('array').map((t: string) => t.toLowerCase());
  const nouns = doc.nouns().out('array').map((n: string) => n.toLowerCase());
  
  // Vérifier des patterns spécifiques
  if (topics.includes('client') || nouns.includes('client') || 
      lowercaseMsg === 'client' || 
      lowercaseMsg === 'je suis client' || 
      lowercaseMsg === 'en tant que client' ||
      (lowercaseMsg.includes('besoin') && lowercaseMsg.includes('service')) ||
      lowercaseMsg.includes('cherche un freelance')) {
    return 'client';
  }
  
  if (topics.includes('freelance') || nouns.includes('freelance') ||
      lowercaseMsg === 'freelance' || 
      lowercaseMsg === 'je suis freelance' || 
      lowercaseMsg === 'en tant que freelance' ||
      (lowercaseMsg.includes('offrir') && lowercaseMsg.includes('service')) ||
      lowercaseMsg.includes('proposer mes services')) {
    return 'freelance';
  }
  
  // Si ce n'est pas une réponse directe, analyse plus poussée
  const clientKeywords = ['client', 'projet', 'entreprise', 'besoin', 'acheter', 'service', 'commande', 'achat', 'recherche'];
  const freelanceKeywords = ['freelance', 'travailler', 'compétence', 'offrir', 'service', 'vendre', 'talent', 'missions', 'prestation'];
  
  let clientScore = 0;
  let freelanceScore = 0;
  
  clientKeywords.forEach(keyword => {
    if (lowercaseMsg.includes(keyword.toLowerCase())) clientScore++;
  });
  
  freelanceKeywords.forEach(keyword => {
    if (lowercaseMsg.includes(keyword.toLowerCase())) freelanceScore++;
  });
  
  if (clientScore > freelanceScore) return 'client';
  if (freelanceScore > clientScore) return 'freelance';
  return 'undetermined';
}

/**
 * Vérifie si le message correspond à une entrée de FAQ
 * @param message Message de l'utilisateur
 * @param faqQuestion Question de la FAQ
 * @returns Score de correspondance
 */
export function matchFaqQuestion(message: string, faqQuestion: string): number {
  const userMsg = message.toLowerCase();
  const questionLower = faqQuestion.toLowerCase();
  
  const userDoc = nlp(userMsg);
  const questionDoc = nlp(questionLower);
  
  const userTopics = userDoc.topics().out('array').map((t: string) => t.toLowerCase());
  const userNouns = userDoc.nouns().out('array').map((n: string) => n.toLowerCase());
  
  const questionTopics = questionDoc.topics().out('array').map((t: string) => t.toLowerCase());
  const questionNouns = questionDoc.nouns().out('array').map((n: string) => n.toLowerCase());
  
  // Compter les correspondances
  const topicMatches = questionTopics.filter((t: string) => userTopics.includes(t)).length;
  const nounMatches = questionNouns.filter((n: string) => userNouns.includes(n)).length;
  
  return topicMatches + nounMatches;
}

/**
 * Analyse une requête spécifique pour détecter des intentions particulières
 * @param message Message de l'utilisateur
 * @returns L'intention détectée et sa confiance
 */
export function detectSpecificIntent(message: string): {intent: string; confidence: number} | null {
  const lowercaseMsg = message.toLowerCase().trim();
  const doc = nlp(lowercaseMsg);
  
  // Structure pour les intentions spécifiques avec expressions régulières
  const intentPatterns: Record<string, {keywords: string[]; regexs: RegExp[]; requiredWords?: string[]}> = {
    'commande_info': {
      keywords: ['commande', 'commander', 'achat', 'projet', 'mission', 'statut', 'suivi', 'livraison', 'commande', 'projet', 'service'],
      regexs: [
        /ma (commande|mission|projet|service)/i,
        /où (en est|est) ma (commande|mission|projet|service)/i,
        /(statut|suivi|état) (de ma|d'une|du|de mon) (commande|mission|projet|service)/i,
        /(quand|comment) (sera|est|va être) (livrée?|terminée?|finie?)/i
      ]
    },
    'paiement_info': {
      keywords: ['paiement', 'payer', 'argent', 'recevoir', 'virement', 'solde', 'délai', 'quand', 'budget', 'prix', 'coût', 'facture'],
      regexs: [
        /(quand|comment) (serais-je|vais-je être|suis-je|puis-je être) payé/i,
        /(où|comment|quand) (est|sont|sera|seront) (mon|mes) paiement/i,
        /(combien|quel est le|quels sont les) (coût|prix|tarif|montant|frais)/i,
        /(mode de|méthode de|comment) paiement/i
      ]
    },
    'profil_edit': {
      keywords: ['profil', 'modifier', 'changer', 'mettre à jour', 'éditer', 'portfolio', 'informations', 'compte', 'image', 'photo'],
      regexs: [
        /(comment|puis-je|je veux|je souhaite) (modifier|changer|mettre à jour|éditer) (mon|le) profil/i,
        /(changer|modifier|mettre à jour|éditer) (photo|image|avatar|description|présentation|portfolio)/i,
        /(comment|où) (ajouter|supprimer|modifier) (des|les|mes) (informations|compétences|réalisations)/i
      ]
    },
    'aide_technique': {
      keywords: ['problème', 'aide', 'erreur', 'bug', 'fonctionne pas', 'technique', 'support', 'aidez', 'aider', 'besoin'],
      regexs: [
        /(j'ai|il y a|il y'a) (un|des) problème/i,
        /(ça ne|ne|pas) (marche|fonctionne) pas/i,
        /(besoin|demande) d'aide/i,
        /(comment|puis-je|qui peut) (résoudre|régler|fixer|réparer) (ce|un|mon|le) problème/i,
        /(erreur|bug|plantage|blocage)/i
      ]
    },
    'vente_clients': {
      keywords: ['vendre', 'client', 'plus', 'avoir', 'trouver', 'augmenter', 'améliorer', 'obtenir', 'ventes', 'revenus'],
      regexs: [
        /(comment|puis-je|pour) (avoir|trouver|obtenir|attirer) (plus de|des) clients/i,
        /(comment|puis-je|pour) (vendre|améliorer|augmenter) (plus|mes ventes|mon chiffre)/i,
        /(améliorer|augmenter) (mes|les) revenus/i,
        /(comment|puis-je) (développer|améliorer) (ma clientèle|mon business|mon activité)/i
      ]
    },
    'creation_compte': {
      keywords: ['créer', 'inscription', 'nouveau', 'compte', 'profil', 'commencer', 'démarrer', 'enregistrer'],
      regexs: [
        /(comment|puis-je|je veux) (créer|ouvrir|faire) (un|mon) (compte|profil)/i,
        /(s'inscrire|inscription|enregistrement)/i,
        /(comment|par où) (commencer|débuter|démarrer)/i
      ]
    }
  };
  
  // Vérifier les expressions régulières
  for (const [intent, config] of Object.entries(intentPatterns)) {
    for (const regex of config.regexs) {
      if (regex.test(lowercaseMsg)) {
        return {
          intent: intent,
          confidence: 0.9 // Haute confiance pour les correspondances regex
        };
      }
    }
  }
  
  // Vérifier les mots-clés extraits par compromise
  const terms = doc.terms().out('array') as string[];
  const nouns = doc.nouns().out('array') as string[];
  const verbs = doc.verbs().out('array') as string[];
  
  // Vérifier le pattern de question (qui, quoi, quand, comment, etc.)
  const isQuestion = lowercaseMsg.includes('?') || 
                     lowercaseMsg.startsWith('comment') || 
                     lowercaseMsg.startsWith('pourquoi') || 
                     lowercaseMsg.startsWith('qui') || 
                     lowercaseMsg.startsWith('quand') || 
                     lowercaseMsg.startsWith('où') || 
                     lowercaseMsg.startsWith('quoi');
  
  let bestIntent = null;
  let highestScore = 0;
  
  // Analyser chaque intention possible
  for (const [intent, config] of Object.entries(intentPatterns)) {
    let score = 0;
    const { keywords, requiredWords } = config;
    
    // Vérifier si les mots requis sont présents
    if (requiredWords) {
      const allRequired = requiredWords.some(word => 
        lowercaseMsg.includes(word) || terms.some(t => t.toLowerCase().includes(word))
      );
      
      if (!allRequired) continue;
    }
    
    // Calculer le score basé sur les correspondances de mots-clés
    for (const keyword of keywords) {
      // Correspondance exacte
      if (lowercaseMsg.includes(keyword)) {
        score += 5;
        continue;
      }
      
      // Correspondance de mots
      for (const term of terms) {
        if (term.toLowerCase() === keyword) {
          score += 4;
        }
        // Correspondance partielle
        else if (term.toLowerCase().includes(keyword) || keyword.includes(term.toLowerCase())) {
          score += 2;
        }
        // Similarité phonétique (si disponible)
        else if (typeof calculateSimilarity === 'function' && calculateSimilarity(term.toLowerCase(), keyword) > 0.7) {
          score += 3;
        }
      }
    }
    
    // Bonus pour les verbes d'action pertinents
    verbs.forEach(verb => {
      const verbLower = verb.toLowerCase();
      if (['veux', 'souhaite', 'besoin', 'demande', 'cherche', 'dois', 'aider', 'aide', 'faut'].includes(verbLower)) {
        score += 3;
      }
    });
    
    // Bonus pour les questions
    if (isQuestion) {
      score += 5;
    }
    
    if (score > highestScore) {
      highestScore = score;
      bestIntent = intent;
    }
  }
  
  // Retourner l'intention si le score est suffisant
  if (bestIntent && highestScore >= 7) {
    return {
      intent: bestIntent,
      confidence: Math.min(highestScore / 20, 0.9) // Normaliser entre 0 et 0.9
    };
  }
  
  return null;
}

// Fonction utilitaire pour calculer la similarité entre deux chaînes
// À utiliser si la fonction n'est pas disponible dans le contexte actuel
function calculateSimilarity(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;
  
  // Si l'une des chaînes est vide, la similarité est 0
  if (len1 === 0 || len2 === 0) return 0;
  
  // Simplification phonétique pour le français
  const simplifyPhonetic = (s: string): string => {
    return s.toLowerCase()
      .replace(/[éèêë]/g, 'e')
      .replace(/[àâä]/g, 'a')
      .replace(/[ùûü]/g, 'u')
      .replace(/[ôö]/g, 'o')
      .replace(/[îï]/g, 'i')
      .replace(/ç/g, 's')
      .replace(/ph/g, 'f')
      .replace(/qu/g, 'k')
      .replace(/[^a-z0-9]/g, ''); // Garder seulement les lettres et chiffres
  };
  
  const s1 = simplifyPhonetic(str1);
  const s2 = simplifyPhonetic(str2);
  
  // Si les formes phonétiques sont identiques, c'est un match parfait
  if (s1 === s2 && s1.length > 0) {
    return 1;
  }
  
  // Compter les caractères communs
  let commonChars = 0;
  const str1Chars = new Set(s1.split(''));
  for (const char of s2) {
    if (str1Chars.has(char)) {
      commonChars++;
      str1Chars.delete(char);
    }
  }
  
  // Retourner la similarité
  return (2 * commonChars) / (s1.length + s2.length);
}

/**
 * Détecte les intentions profondes dans une requête utilisateur
 * Cette fonction enrichit les capacités de détection d'intention en analysant
 * les variantes sémantiques et les formulations alternatives
 * 
 * @param message Le message de l'utilisateur à analyser
 * @returns Un objet contenant les intentions détectées avec leur score de confiance
 */
export function expandIntentDetection(message: string): { 
  mainIntent: string; 
  confidence: number;
  secondaryIntents: Array<{intent: string; confidence: number}>;
} {
  // Normalisation et préparation des données
  const normalizedMsg = message.toLowerCase().trim();
  const doc = nlp(normalizedMsg);
  
  // Extraire les différentes composantes linguistiques
  const terms = doc.terms().out('array') as string[];
  const nouns = doc.nouns().out('array') as string[];
  const verbs = doc.verbs().out('array') as string[];
  const topics = doc.topics().out('array') as string[];
  const adjectives = doc.adjectives().out('array') as string[];
  
  // Détection primaire avec la fonction existante
  const specificIntent = detectSpecificIntent(message);
  
  // Préparation du résultat
  const result = {
    mainIntent: specificIntent?.intent || 'unknown',
    confidence: specificIntent?.confidence || 0.1,
    secondaryIntents: [] as Array<{intent: string; confidence: number}>
  };
  
  // Groupes d'intentions avec leurs caractéristiques linguistiques
  const intentGroups = {
    'service_inquiry': {
      nouns: ['service', 'prestation', 'offre', 'catalogue', 'option', 'choix', 'proposition', 'solution', 'expertise', 'compétence'],
      verbs: ['proposer', 'offrir', 'rechercher', 'chercher', 'vouloir', 'souhaiter', 'avoir besoin', 'besoin', 'demander', 'consulter'],
      topics: ['service', 'prestation', 'proposition', 'travail', 'projet', 'expertise', 'compétence', 'solution'],
      adjectives: ['disponible', 'possible', 'intéressant', 'nouveau', 'spécial', 'particulier', 'adapté', 'pertinent', 'convenable'],
      phrases: [
        'que proposez-vous', 'quels services', 'que faites-vous', 'comment fonctionne',
        'j\'ai besoin de', 'je recherche', 'pouvez-vous faire', 'est-il possible d\'avoir',
        'quelles sont vos prestations', 'que pouvez-vous faire', 'quelles solutions proposez-vous',
        'quelles sont vos compétences', 'que savez-vous faire', 'quelles sont vos expertises'
      ]
    },
    'process_question': {
      nouns: ['processus', 'étape', 'démarche', 'procédure', 'fonctionnement', 'méthode', 'façon', 'manière', 'approche', 'déroulement'],
      verbs: ['fonctionner', 'marcher', 'procéder', 'faire', 'dérouler', 'passer', 'avancer', 'progresser', 'commencer', 'terminer'],
      topics: ['processus', 'fonctionnement', 'méthode', 'façon', 'manière', 'procédure', 'démarche', 'approche'],
      adjectives: ['simple', 'complexe', 'facile', 'difficile', 'long', 'rapide', 'efficace', 'pratique', 'concret', 'clair'],
      phrases: [
        'comment ça marche', 'comment fonctionne', 'quelles sont les étapes',
        'quel est le processus', 'comment se déroule', 'comment faire pour',
        'par où commencer', 'quelle est la procédure', 'comment procéder',
        'quelle est la démarche', 'comment avancer', 'quelle est la méthode'
      ]
    },
    'pricing_inquiry': {
      nouns: ['prix', 'tarif', 'coût', 'commission', 'montant', 'frais', 'pourcentage', 'budget', 'investissement', 'facturation'],
      verbs: ['coûter', 'payer', 'débourser', 'facturer', 'valoir', 'revenir à', 'investir', 'budgéter', 'financer', 'rémunérer'],
      topics: ['prix', 'argent', 'paiement', 'tarification', 'commission', 'budget', 'coût', 'investissement'],
      adjectives: ['cher', 'abordable', 'coûteux', 'élevé', 'bas', 'raisonnable', 'compétitif', 'accessible', 'modéré', 'juste'],
      phrases: [
        'combien coûte', 'quel est le prix', 'quels sont les tarifs', 'est-ce que c\'est cher',
        'y a-t-il des frais', 'montant des commissions', 'prix de',
        'quel est le budget nécessaire', 'quel est l\'investissement', 'combien dois-je prévoir',
        'quels sont les frais', 'comment sont calculés les prix', 'quelle est la tarification'
      ]
    },
    'complaint': {
      nouns: ['problème', 'souci', 'difficulté', 'erreur', 'bug', 'défaut', 'dysfonctionnement'],
      verbs: ['planter', 'buguer', 'échouer', 'rater', 'bloquer', 'coincer', 'arrêter'],
      topics: ['problème', 'erreur', 'panne', 'bug', 'plainte'],
      adjectives: ['cassé', 'défectueux', 'mauvais', 'incorrect', 'faux', 'erroné'],
      phrases: [
        'ne fonctionne pas', 'ne marche pas', 'j\'ai un problème avec', 'ça bug',
        'c\'est cassé', 'erreur de', 'ça plante', 'impossible de'
      ]
    },
    'security_concerns': {
      nouns: ['sécurité', 'protection', 'confiance', 'fiabilité', 'risque', 'danger', 'menace'],
      verbs: ['sécuriser', 'protéger', 'garantir', 'assurer', 'menacer', 'risquer'],
      topics: ['sécurité', 'confiance', 'protection', 'risque', 'confidentialité'],
      adjectives: ['sécurisé', 'fiable', 'sûr', 'dangereux', 'risqué', 'confidentiel'],
      phrases: [
        'est-ce sécurisé', 'puis-je faire confiance', 'comment protéger', 'risque de',
        'données personnelles', 'information confidentielle', 'garantie de'
      ]
    },
    'feedback': {
      nouns: ['avis', 'opinion', 'retour', 'commentaire', 'expérience', 'satisfaction'],
      verbs: ['penser', 'croire', 'considérer', 'estimer', 'apprécier', 'aimer', 'détester'],
      topics: ['avis', 'opinion', 'évaluation', 'critique', 'satisfaction'],
      adjectives: ['bon', 'mauvais', 'excellent', 'terrible', 'satisfaisant', 'décevant'],
      phrases: [
        'que pensez-vous de', 'j\'aime bien', 'je n\'aime pas', 'mon expérience a été',
        'c\'est très bien', 'c\'est nul', 'je suis satisfait', 'je suis déçu'
      ]
    }
  };
  
  // Calculer les scores pour chaque groupe d'intentions
  const intentScores: Record<string, number> = {};
  
  for (const [intent, features] of Object.entries(intentGroups)) {
    let score = 0;
    
    // Vérifier les correspondances de noms
    for (const noun of nouns) {
      if (features.nouns.includes(noun.toLowerCase())) {
        score += 3;
      }
    }
    
    // Vérifier les correspondances de verbes
    for (const verb of verbs) {
      if (features.verbs.includes(verb.toLowerCase())) {
        score += 3;
      }
    }
    
    // Vérifier les correspondances de thèmes
    for (const topic of topics) {
      if (features.topics.includes(topic.toLowerCase())) {
        score += 4;
      }
    }
    
    // Vérifier les correspondances d'adjectifs
    for (const adj of adjectives) {
      if (features.adjectives.includes(adj.toLowerCase())) {
        score += 2;
      }
    }
    
    // Vérifier les phrases clés
    for (const phrase of features.phrases) {
      if (normalizedMsg.includes(phrase)) {
        score += 5;
      }
    }
    
    // Enregistrer le score s'il est significatif
    if (score > 3) {
      intentScores[intent] = score;
    }
  }
  
  // Trier les intentions par score
  const sortedIntents = Object.entries(intentScores)
    .sort((a, b) => b[1] - a[1])
    .map(([intent, score]) => ({
      intent,
      confidence: Math.min(score / 20, 0.9) // Normaliser entre 0 et 0.9
    }));
  
  // Mettre à jour l'intention principale si une intention plus forte est détectée
  if (sortedIntents.length > 0 && sortedIntents[0].confidence > result.confidence) {
    result.mainIntent = sortedIntents[0].intent;
    result.confidence = sortedIntents[0].confidence;
    // Ajouter les intentions secondaires (sans la principale)
    result.secondaryIntents = sortedIntents.slice(1);
  } else if (sortedIntents.length > 0) {
    // Ajouter toutes les intentions comme secondaires si elles ne remplacent pas la principale
    result.secondaryIntents = sortedIntents;
  }
  
  // Analyse contextuelle supplémentaire
  if (normalizedMsg.includes('?')) {
    result.confidence = Math.min(result.confidence + 0.1, 0.9); // Bonus pour les questions explicites
  }
  
  // Détecter les intentions composées (par exemple, une plainte avec une question de prix)
  if (result.secondaryIntents.length > 0) {
    // Si la différence de confiance est faible, c'est probablement une intention composée
    const confidenceDiff = result.confidence - result.secondaryIntents[0].confidence;
    if (confidenceDiff < 0.2) {
      // Ajouter une propriété pour indiquer que c'est probablement une intention composée
      (result as any).isCompositeIntent = true;
    }
  }
  
  return result;
}

interface ConversationExchange {
  query: string;
  response: string;
  category: string;
  timestamp: Date;
}

interface ConversationContext {
  lastCategory: string;
  conversationFlow: ConversationExchange[];
  userInfo: {
    isFreelance?: boolean;
    isClient?: boolean;
    interests?: string[];
  };
}

function generateContextualResponse(
  query: string, 
  context: ConversationContext
): { response: string; category: string; confidence: string } | null {
  // Si pas d'historique, impossible de générer une réponse contextuelle
  if (!context.conversationFlow.length) return null;

  const normalizedQuery = query.toLowerCase().trim();
  const lastExchange = context.conversationFlow[context.conversationFlow.length - 1];
  const previousExchanges = context.conversationFlow.slice(-3); // Garder les 3 derniers échanges

  // Modèles de suivi de conversation améliorés
  const followUpPatterns = [
    /^(et|mais|donc|alors|ensuite|puis|après)(\s|$)/i,
    /^(oui|non|peut-être|effectivement|absolument|pas du tout|exactement)(\s|$)/i,
    /^(d\'accord|ok|bien|parfait|super|génial|excellent)(\s|$)/i,
    /^(je comprends|je vois|je sais|je pense|je crois)(\s|$)/i
  ];

  const isFollowUp = followUpPatterns.some(pattern => pattern.test(normalizedQuery));

  // Détection de référence au contexte précédent
  const hasContextReference = previousExchanges.some((exchange: ConversationExchange) => {
    const exchangeWords = exchange.query.toLowerCase().split(/\s+/);
    return exchangeWords.some((word: string) => normalizedQuery.includes(word));
  });

  if (isFollowUp || hasContextReference) {
    // Analyse du sentiment de la réponse
    const isPositive = /^(oui|ok|d'accord|bien|parfait|super|génial|excellent)/i.test(normalizedQuery);
    const isNegative = /^(non|pas|jamais|impossible|difficile)/i.test(normalizedQuery);

    // Générer une réponse contextuelle adaptée
    let response = "";
    if (isPositive) {
      response = `Je suis ravi que cela vous convienne ! Pour continuer sur le sujet ${lastExchange.category}, `;
    } else if (isNegative) {
      response = `Je comprends votre préoccupation. Concernant ${lastExchange.category}, `;
    } else {
      response = `Pour continuer sur le sujet ${lastExchange.category}, `;
    }

    // Ajouter des informations complémentaires basées sur le contexte
    if (lastExchange.category === 'service_inquiry') {
      response += "je peux vous donner plus de détails sur nos services spécifiques. Que souhaitez-vous savoir en particulier ?";
    } else if (lastExchange.category === 'process_question') {
      response += "je peux vous expliquer plus en détail les étapes suivantes. Avez-vous des questions sur une étape particulière ?";
    } else if (lastExchange.category === 'pricing_inquiry') {
      response += "je peux vous fournir plus d'informations sur nos tarifs et conditions. Y a-t-il un aspect particulier qui vous intéresse ?";
    } else {
      response += "que souhaitez-vous savoir de plus ?";
    }

    return {
      response,
      category: lastExchange.category,
      confidence: 'high'
    };
  }

  // Détection de satisfaction améliorée
  const satisfactionPatterns = {
    positive: ['merci', 'super', 'parfait', 'excellent', 'génial', 'top', 'cool', 'bien', 'ok', 'd\'accord'],
    negative: ['pas content', 'déçu', 'insatisfait', 'problème', 'difficile', 'compliqué', 'cher', 'trop']
  };

  const isPositiveFeedback = satisfactionPatterns.positive.some(word => normalizedQuery.includes(word));
  const isNegativeFeedback = satisfactionPatterns.negative.some(word => normalizedQuery.includes(word));

  if (isPositiveFeedback) {
    return {
      response: "Je suis ravi d'avoir pu vous aider ! Y a-t-il autre chose à propos de Vynal Platform sur laquelle je pourrais vous renseigner ?",
      category: 'feedback',
      confidence: 'high'
    };
  }

  if (isNegativeFeedback) {
    return {
      response: "Je suis désolé que notre réponse ne vous ait pas entièrement satisfait. Pourriez-vous me préciser ce qui ne vous convient pas ? Je ferai de mon mieux pour vous aider.",
      category: 'feedback',
      confidence: 'high'
    };
  }

  return null;
} 