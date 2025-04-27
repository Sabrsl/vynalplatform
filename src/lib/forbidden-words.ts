/**
 * Liste des mots interdits dans les conversations entre utilisateurs
 * Cette liste est utilisée pour filtrer les messages avant leur envoi
 * Si un message contient un mot de cette liste, il sera bloqué ou censuré selon le contexte
 */

// Structure pour définir des mots interdits avec leur niveau de gravité et contexte
interface ForbiddenWordEntry {
  word: string;
  severity: 'high' | 'medium' | 'low'; // Niveau de gravité
  aliases?: string[]; // Variantes et contournements possibles
  contextExceptions?: string[]; // Expressions où le mot peut être accepté
  regex?: boolean; // Si true, 'word' est traité comme une expression régulière
  action?: 'block' | 'warn' | 'censor' | 'notify_mod'; // Action à prendre quand le mot est détecté
}

// Liste détaillée des mots interdits avec contexte
export const forbiddenWordsConfig: ForbiddenWordEntry[] = [
  // Insultes et langage offensant - Haute sévérité
  { 
    word: "connard", 
    severity: "high", 
    aliases: ["con+ard", "conard", "connnar", "connnnard"],
    action: "block"
  },
  { 
    word: "connasse", 
    severity: "high", 
    aliases: ["con+asse", "conasse", "connnnasse"],
    action: "block"
  },
  {
    word: "salope",
    severity: "high",
    aliases: ["sal0pe", "s@lope", "sal*pe", "salop", "sallope"],
    action: "block"
  },
  {
    word: "pute",
    severity: "high",
    aliases: ["p*te", "p.u.t.e", "p u t e", "p/u/t/e", "pût"],
    action: "block"
  },
  {
    word: "enculé",
    severity: "high",
    aliases: ["encu1é", "encule", "enku1é", "enku1e", "encul", "enc*"],
    action: "block"
  },
  {
    word: "fdp",
    severity: "high",
    aliases: ["f.d.p", "f d p", "fils de p"],
    action: "block"
  },
  {
    word: "fils de pute",
    severity: "high",
    aliases: ["fils de p*", "fils 2 pute", "filho da puta"]
  },
  { 
    word: "pd", 
    severity: "high", 
    contextExceptions: ["pédiatre", "pédiatrie"] 
  },
  { 
    word: "tapette", 
    severity: "high" 
  },
  { 
    word: "tdc", 
    severity: "high" 
  },
  { 
    word: "ta gueule", 
    severity: "high", 
    aliases: ["tg", "ta gu*ule", "tagueule"] 
  },
  { 
    word: "ta mère", 
    severity: "high", 
    aliases: ["tamere", "t@ mère", "t@ mere"] 
  },
  { 
    word: "ntm", 
    severity: "high", 
    aliases: ["n.t.m", "n t m"] 
  },
  { 
    word: "nique", 
    severity: "high", 
    aliases: ["nik", "nick", "n1que", "n1k"] 
  },
  
  // Grossier - Sévérité moyenne
  { 
    word: "putain", 
    severity: "medium", 
    aliases: ["put1", "put@in", "p*tain"],
    action: "censor"
  },
  { 
    word: "merde", 
    severity: "medium", 
    aliases: ["m*rde", "m3rde", "mèrde"],
    action: "censor"
  },
  { 
    word: "bordel", 
    severity: "medium",
    action: "censor"
  },

  // Discours haineux - Haute sévérité
  { 
    word: "négro", 
    severity: "high", 
    aliases: ["negro", "nègr0", "negr0"],
    action: "block"
  },
  { 
    word: "nègre", 
    severity: "high", 
    aliases: ["negre", "nèg", "neg"],
    action: "block"
  },
  { 
    word: "bougnoule", 
    severity: "high", 
    aliases: ["bougn*le", "bougn0ule"] 
  },
  { 
    word: "youpin", 
    severity: "high" 
  },
  { 
    word: "bicot", 
    severity: "high" 
  },
  { 
    word: "arabe", 
    severity: "medium", 
    contextExceptions: ["je suis arabe", "origine arabe", "culture arabe", "langue arabe", "pays arabe"] 
  },
  { 
    word: "feuj", 
    severity: "high" 
  },
  { 
    word: "race", 
    severity: "low", 
    contextExceptions: ["race de chien", "race de chat", "race animale", "la race humaine"],
    action: "warn"
  },
  { 
    word: "racaille", 
    severity: "high" 
  },
  { 
    word: "sale juif", 
    severity: "high", 
    aliases: ["sale j*if"] 
  },
  { 
    word: "sale arabe", 
    severity: "high", 
    aliases: ["sale ar*be"] 
  },
  { 
    word: "sale noir", 
    severity: "high" 
  },
  { 
    word: "sale blanc", 
    severity: "high" 
  },
  { 
    word: "bâtard", 
    severity: "high", 
    aliases: ["batard", "bat@rd", "b@tard", "b*tard"] 
  },
  { 
    word: "terroriste", 
    severity: "high", 
    contextExceptions: ["lutte anti-terroriste", "contre le terrorisme"] 
  },

  // Menaces - Moyenne à haute sévérité
  { 
    word: "tuer", 
    severity: "high", 
    contextExceptions: ["se tuer à la tâche", "tuer le temps"] 
  },
  { 
    word: "frapper", 
    severity: "medium", 
    contextExceptions: ["frapper à la porte", "frapper fort"] 
  },
  { 
    word: "détruire", 
    severity: "medium", 
    contextExceptions: ["détruire les obstacles", "détruire les barrières"] 
  },
  { 
    word: "massacre", 
    severity: "medium", 
    contextExceptions: ["massacre des prix"] 
  },
  { 
    word: "vengeance", 
    severity: "medium" 
  },
  { 
    word: "suicider", 
    severity: "medium" 
  },
  { 
    word: "mort", 
    severity: "low", 
    contextExceptions: ["deadline", "date butoir", "date limite", "échéance"] 
  },
  { 
    word: "crever", 
    severity: "medium", 
    contextExceptions: ["crever un pneu", "crever l'abcès", "crever de faim"] 
  },

  // Discrimination - Haute sévérité
  { 
    word: "handicapé", 
    severity: "low", 
    contextExceptions: ["personne handicapée", "accessibilité handicapé", "situation de handicap"] 
  },
  { 
    word: "gogol", 
    severity: "high", 
    aliases: ["gogo1", "g0g0l"] 
  },
  { 
    word: "mongol", 
    severity: "high", 
    contextExceptions: ["pays mongol", "culture mongole", "mongol", "mongolie"] 
  },
  { 
    word: "attardé", 
    severity: "high", 
    aliases: ["@ttardé", "att@rdé", "attard"] 
  },
  { 
    word: "débile", 
    severity: "high", 
    aliases: ["deb1le", "déb1le", "deb11e"] 
  },
  { 
    word: "autism", 
    severity: "low", 
    contextExceptions: ["autisme", "autistique", "spectre autistique", "trouble du spectre de l'autisme"] 
  },
  { 
    word: "retardé", 
    severity: "medium", 
    contextExceptions: ["projet retardé", "livraison retardée", "paiement retardé"] 
  },
  { 
    word: "trisomique", 
    severity: "high", 
    contextExceptions: ["trisomie 21", "personne trisomique"] 
  },

  // Vocabulaire sexuel inapproprié - Moyenne à haute sévérité
  { 
    word: "bite", 
    severity: "high", 
    aliases: ["b1te", "b*te", "biite"] 
  },
  { 
    word: "couilles", 
    severity: "high", 
    aliases: ["couy", "couill", "couye"] 
  },
  { 
    word: "nichons", 
    severity: "high", 
    aliases: ["n1chons", "nichon"] 
  },
  { 
    word: "cul", 
    severity: "medium", 
    aliases: ["kul", "q", "cüll"],
    contextExceptions: ["cul-de-sac", "cul de sac"] 
  },
  { 
    word: "chatte", 
    severity: "high", 
    contextExceptions: ["chat", "chaton"], 
    aliases: ["ch@tte", "ch*tte"] 
  },
  { 
    word: "baiser", 
    severity: "high", 
    contextExceptions: ["baiser sur la joue", "faire la bise"],
    aliases: ["bz", "bais"] 
  },
  { 
    word: "niquer", 
    severity: "high", 
    aliases: ["niker", "n1quer", "n1ker"] 
  },
  { 
    word: "suce", 
    severity: "high", 
    aliases: ["suc", "suc3", "s*ce"] 
  },
  { 
    word: "sucer", 
    severity: "high", 
    aliases: ["suc3r", "s*cer"] 
  },
  { 
    word: "porno", 
    severity: "high", 
    aliases: ["p0rno", "porn0", "p*rno"] 
  },
  { 
    word: "sexe", 
    severity: "medium", 
    contextExceptions: ["sexe masculin", "sexe féminin", "genre"], 
    aliases: ["s3xe", "s*xe"] 
  },

  // Contact externe - Sévérité moyenne à haute
  { 
    word: "gmail", 
    severity: "high", 
    aliases: ["g mail", "g-mail", "g.mail", "gm@il"],
    action: "notify_mod"
  },
  { 
    word: "yahoo", 
    severity: "high", 
    aliases: ["yah00", "y@hoo", "yah o o"],
    action: "notify_mod"
  },
  { 
    word: "hotmail", 
    severity: "high", 
    aliases: ["h0tmail", "h*tmail", "hot mail"],
    action: "notify_mod"
  },
  { 
    word: "outlook", 
    severity: "high", 
    aliases: ["0utlook", "*utlook", "out look"] 
  },
  { 
    word: "email", 
    severity: "high", 
    aliases: ["e-mail", "e mail", "mail", "courriel", "em@il"] 
  },
  // Expression régulière pour détecter les adresses email
  { 
    word: "\\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}\\b", 
    severity: "high", 
    regex: true,
    action: "notify_mod"
  },
  { 
    word: "tel:", 
    severity: "high" 
  },
  { 
    word: "téléphone", 
    severity: "medium", 
    aliases: ["telephone", "tel", "fon", "phone", "portable", "mobile"] 
  },
  // Expression régulière pour détecter les numéros de téléphone français
  { 
    word: "\\b0[1-9][ .-]?([0-9]{2}[ .-]?){4}\\b", 
    severity: "high", 
    regex: true 
  },
  { 
    word: "appelle moi", 
    severity: "high", 
    aliases: ["appelle-moi", "appelez moi", "appelez-moi"] 
  },
  { 
    word: "whatsapp", 
    severity: "high", 
    aliases: ["what's app", "what app", "wapp", "whats app"] 
  },
  { 
    word: "instagram", 
    severity: "high", 
    aliases: ["insta", "ig", "i.g.", "i.g"] 
  },
  { 
    word: "facebook", 
    severity: "high", 
    aliases: ["fb", "face book", "fcbk", "f.b."] 
  },
  { 
    word: "twitter", 
    severity: "high", 
    aliases: ["tweet", "twt", "tuiter"] 
  },
  { 
    word: "skype", 
    severity: "high", 
    aliases: ["skipe", "skp"] 
  },
  { 
    word: "telegram", 
    severity: "high", 
    aliases: ["tg app", "telegr", "telgr"] 
  },
  { 
    word: "paypal", 
    severity: "high", 
    aliases: ["pay pal", "p@ypal", "p@y p@l"] 
  },
  { 
    word: "virement", 
    severity: "high", 
    aliases: ["viremnt", "virmnt"] 
  },
  { 
    word: "iban", 
    severity: "high", 
    aliases: ["i.b.a.n", "i b a n", "ib@n"] 
  },
  { 
    word: "espèces", 
    severity: "high", 
    aliases: ["especes", "cash", "liquide"] 
  },
  { 
    word: "crypto", 
    severity: "high", 
    aliases: ["crypt0", "cryptomonnaie", "crypto monnaie"] 
  },
  { 
    word: "bitcoin", 
    severity: "high", 
    aliases: ["btc", "b.t.c", "bitc0in"] 
  },
  { 
    word: "ethereum", 
    severity: "high", 
    aliases: ["eth", "e.t.h", "ether"] 
  },
  { 
    word: "contacte moi en dehors", 
    severity: "high" 
  },
  { 
    word: "contactez moi en dehors", 
    severity: "high" 
  },
  { 
    word: "hors plateforme", 
    severity: "high" 
  },
  { 
    word: "en dehors de vynal", 
    severity: "high" 
  },
  { 
    word: "hors de vynal", 
    severity: "high" 
  },
];

// Pour compatibilité avec le code existant
export const forbiddenWords: string[] = forbiddenWordsConfig.map(entry => entry.word);

/**
 * Vérifie si un message contient des mots interdits
 * avec prise en compte des variantes et du contexte
 */
export interface ForbiddenWordsResult {
  hasForbiddenWords: boolean;
  foundWords: string[];
  severity: 'high' | 'medium' | 'low' | 'none';
  possibleQuoteOrReport: boolean;
  recommendedAction?: 'block' | 'warn' | 'censor' | 'notify_mod';
}

/**
 * Vérifie si un message contient des mots interdits avec analyse avancée
 */
export function containsForbiddenWords(message: string): ForbiddenWordsResult {
  try {
    if (!message) {
      return { 
        hasForbiddenWords: false, 
        foundWords: [],
        severity: 'none',
        possibleQuoteOrReport: false
      };
    }

    const messageLower = message.toLowerCase();
    let normalizedMessage = '';
    let possibleQuoteOrReport = false;
    
    try {
      normalizedMessage = normalizeText(message);
    } catch (normalizeError) {
      console.error("Erreur lors de la normalisation du message:", normalizeError);
      normalizedMessage = messageLower; // Fallback simple
    }
    
    try {
      possibleQuoteOrReport = isQuoteOrReport(message);
    } catch (quoteError) {
      console.error("Erreur lors de la détection de citation:", quoteError);
      possibleQuoteOrReport = false; // Par défaut, ne pas considérer comme citation
    }
    
    let foundWords: string[] = [];
    let highestSeverity: 'high' | 'medium' | 'low' | 'none' = 'none';
    let recommendedAction: 'block' | 'warn' | 'censor' | 'notify_mod' | undefined = undefined;
    let actionsMap: { [key: string]: 'block' | 'warn' | 'censor' | 'notify_mod' } = {};
    
    // Compteur d'erreurs pour éviter de bloquer le message si trop d'erreurs
    let errorCount = 0;
    const errorThreshold = 5;
    
    // Vérifier chaque entrée de la liste de mots interdits
    for (const entry of forbiddenWordsConfig) {
      try {
        let found = false;
        
        // Vérifier le mot principal
        if (matchesPattern(messageLower, entry.word, entry.regex)) {
          found = true;
        }
        
        // Si non trouvé, vérifier les alias/variantes
        if (!found && entry.aliases && entry.aliases.length > 0) {
          for (const alias of entry.aliases) {
            try {
              if (matchesPattern(messageLower, alias)) {
                found = true;
                break;
              }
            } catch (e) {
              console.error(`Erreur lors de la vérification de l'alias: ${alias}`, e);
              errorCount++;
            }
          }
        }
        
        // Si toujours pas trouvé mais que la normalisation est activée, vérifier directement 
        // dans le texte normalisé pour attraper les variantes orthographiques
        if (!found && !entry.regex) {
          try {
            const normalizedWord = normalizeText(entry.word);
            if (normalizedWord && normalizedMessage.includes(normalizedWord)) {
              found = true;
            }
          } catch (e) {
            console.error(`Erreur lors de la vérification normalisée pour: ${entry.word}`, e);
            errorCount++;
          }
        }
        
        // Si trouvé, vérifier les exceptions de contexte
        if (found && entry.contextExceptions && entry.contextExceptions.length > 0) {
          try {
            if (isInAllowedContext(messageLower, entry.word, entry.contextExceptions)) {
              found = false; // Ne pas considérer comme interdit si dans un contexte autorisé
            }
          } catch (e) {
            console.error(`Erreur lors de la vérification du contexte pour: ${entry.word}`, e);
            errorCount++;
            // En cas d'erreur de contexte, être permissif
            found = false;
          }
        }
        
        // Si c'est une citation/signalement et que le mot est de faible importance, l'ignorer
        if (found && possibleQuoteOrReport && entry.severity === 'low') {
          found = false;
        }
        
        if (found) {
          foundWords.push(entry.word);
          
          // Enregistrer l'action recommandée pour ce mot
          if (entry.action) {
            actionsMap[entry.word] = entry.action;
          } else {
            // Si aucune action n'est spécifiée, utiliser une action par défaut basée sur la gravité
            switch (entry.severity) {
              case 'high':
                actionsMap[entry.word] = 'block';
                break;
              case 'medium':
                actionsMap[entry.word] = 'censor';
                break;
              case 'low':
                actionsMap[entry.word] = 'warn';
                break;
            }
          }
          
          // Mettre à jour la sévérité la plus élevée trouvée
          if (entry.severity === 'high' && highestSeverity !== 'high') {
            highestSeverity = 'high';
          } else if (entry.severity === 'medium' && highestSeverity !== 'high') {
            highestSeverity = 'medium';
          } else if (entry.severity === 'low' && highestSeverity !== 'high' && highestSeverity !== 'medium') {
            highestSeverity = 'low';
          }
        }
      } catch (error) {
        console.error(`Erreur lors de l'analyse du mot interdit: ${entry.word}`, error);
        errorCount++;
      }
      
      // Si trop d'erreurs, ne pas bloquer le message par sécurité
      if (errorCount >= errorThreshold) {
        console.warn(`Trop d'erreurs (${errorCount}) lors de la vérification des mots interdits, message autorisé par sécurité`);
        return {
          hasForbiddenWords: false,
          foundWords: [],
          severity: 'none',
          possibleQuoteOrReport
        };
      }
    }
    
    // Déterminer l'action recommandée globale basée sur tous les mots trouvés
    if (foundWords.length > 0) {
      // Priorité des actions : block > notify_mod > warn > censor
      if (Object.values(actionsMap).includes('block')) {
        recommendedAction = 'block';
      } else if (Object.values(actionsMap).includes('notify_mod')) {
        recommendedAction = 'notify_mod';
      } else if (Object.values(actionsMap).includes('warn')) {
        recommendedAction = 'warn';
      } else if (Object.values(actionsMap).includes('censor')) {
        recommendedAction = 'censor';
      }
    }

    return {
      hasForbiddenWords: foundWords.length > 0,
      foundWords,
      severity: highestSeverity,
      possibleQuoteOrReport,
      recommendedAction
    };
  } catch (generalError) {
    console.error("Erreur générale lors de la vérification des mots interdits:", generalError);
    // En cas d'erreur générale, laisser passer le message
    return {
      hasForbiddenWords: false,
      foundWords: [],
      severity: 'none',
      possibleQuoteOrReport: false
    };
  }
}

/**
 * Masque les mots interdits dans un message avec analyse de contexte
 */
export function censorMessage(message: string): string {
  if (!message) return message;

  let censoredMessage = message;
  const isReporting = isQuoteOrReport(message);
  const normalizedMessage = normalizeText(message);
  
  for (const entry of forbiddenWordsConfig) {
    try {
      // Ne pas censurer les mots de faible importance dans les signalements
      if (isReporting && entry.severity === 'low') continue;
      
      // Ne pas censurer les mots dans un contexte autorisé
      if (entry.contextExceptions && entry.contextExceptions.length > 0) {
        if (isInAllowedContext(message, entry.word, entry.contextExceptions)) {
          continue;
        }
      }
      
      // Censurer le mot principal
      if (!entry.regex) {
        try {
          // Construire des expressions régulières pour capturer les variantes
          // y compris avec des caractères spéciaux insérés
          const escapedWord = entry.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          
          // Regex flexible qui peut attraper certaines variantes avec caractères insérés
          const flexRegex = new RegExp(`\\b${escapedWord.split('').join('[^a-zA-Z0-9]?')}[es]?\\b`, 'gi');
          
          // Regex standard pour les mots exacts
          const standardRegex = new RegExp(`\\b${escapedWord}\\b|\\b${escapedWord}[es]?\\b|\\b${escapedWord}[s]?\\b`, 'gi');
          
          // Appliquer les deux regex
          censoredMessage = censoredMessage.replace(standardRegex, match => '*'.repeat(match.length));
          censoredMessage = censoredMessage.replace(flexRegex, match => '*'.repeat(match.length));
          
          // Vérifier si la censure basée sur la normalisation est nécessaire
          const normalizedWord = normalizeText(entry.word);
          if (normalizedMessage.includes(normalizedWord)) {
            // Rechercher l'emplacement du mot normalisé dans le message normalisé
            let startIndex = normalizedMessage.indexOf(normalizedWord);
            while (startIndex !== -1) {
              // Calculer la longueur approximative du mot original
              const endIndex = startIndex + normalizedWord.length;
              const originalWordLength = Math.min(
                // Trouver le prochain espace après la position actuelle
                message.indexOf(' ', startIndex) !== -1 ? 
                  message.indexOf(' ', startIndex) - startIndex : 
                  message.length - startIndex,
                // Ou limiter à une longueur raisonnable basée sur le mot normalisé
                normalizedWord.length * 1.5
              );
              
              if (originalWordLength > 0) {
                // Remplacer le mot original par des astérisques
                const before = censoredMessage.substring(0, startIndex);
                const after = censoredMessage.substring(startIndex + originalWordLength);
                censoredMessage = before + '*'.repeat(originalWordLength) + after;
              }
              
              // Chercher la prochaine occurrence
              startIndex = normalizedMessage.indexOf(normalizedWord, startIndex + normalizedWord.length);
            }
          }
        } catch (e) {
          console.error(`Expression régulière invalide pour le mot: ${entry.word}`, e);
        }
      } else {
        // Traitement spécial pour les regex (emails, téléphones, etc.)
        try {
          const regex = new RegExp(entry.word, 'gi');
          censoredMessage = censoredMessage.replace(regex, match => '*'.repeat(match.length));
        } catch (e) {
          console.error(`Expression régulière invalide: ${entry.word}`, e);
        }
      }
      
      // Censurer également les alias/variantes
      if (entry.aliases) {
        for (const alias of entry.aliases) {
          try {
            const escapedAlias = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const aliasRegex = new RegExp(`\\b${escapedAlias}\\b|\\b${escapedAlias}[es]?\\b|\\b${escapedAlias}[s]?\\b`, 'gi');
            censoredMessage = censoredMessage.replace(aliasRegex, match => '*'.repeat(match.length));
          } catch (e) {
            console.error(`Expression régulière invalide pour l'alias: ${alias}`, e);
          }
        }
      }
    } catch (error) {
      // Capturer toute erreur inattendue lors du traitement d'une entrée
      console.error(`Erreur lors du traitement de l'entrée de mot interdit: ${entry.word}`, error);
    }
  }
  
  return censoredMessage;
}

/**
 * Normalise un texte en remplaçant les accents, ponctuations, caractères spéciaux et en convertissant
 * les caractères visuellement similaires (ex: @ → a, 1 → i, 3 → e)
 */
function normalizeText(text: string): string {
  if (!text) return '';
  
  try {
    // Convertir en minuscule
    let normalized = text.toLowerCase();
    
    // Remplacer les caractères visuellement similaires
    const charMap: Record<string, string> = {
      '@': 'a',
      '4': 'a',
      '&': 'a',
      '8': 'b',
      '(': 'c',
      '<': 'c',
      '0': 'o',
      '1': 'i',
      '!': 'i',
      '|': 'i',
      '3': 'e',
      '$': 's',
      '5': 's',
      '+': 't',
      '7': 't',
      '2': 'z',
      '9': 'g',
      '6': 'g',
      '#': 'h',
      '%': 'x',
      '*': 'x',
      '°': 'o',
      'ø': 'o',
      'ß': 'b'
    };
    
    // Appliquer les remplacements de caractères (méthode sécurisée)
    for (const [char, replacement] of Object.entries(charMap)) {
      try {
        // Utiliser split/join au lieu de regex pour éviter les problèmes avec les caractères spéciaux
        normalized = normalized.split(char).join(replacement);
      } catch (charError) {
        console.error(`Erreur lors du remplacement du caractère '${char}':`, charError);
        // Continue avec les autres remplacements
      }
    }
    
    try {
      // Retirer les accents (normalisation Unicode)
      normalized = normalized.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    } catch (accentError) {
      console.error('Erreur lors de la suppression des accents:', accentError);
      // Continuer avec le texte sans retirer les accents
    }
    
    try {
      // Retirer la ponctuation et autres caractères spéciaux
      normalized = normalized.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, ' ');
    } catch (punctError) {
      console.error('Erreur lors de la suppression de la ponctuation:', punctError);
      // Continuer avec le texte sans retirer la ponctuation
    }
    
    try {
      // Supprimer les espaces multiples
      normalized = normalized.replace(/\s+/g, ' ').trim();
    } catch (spaceError) {
      console.error('Erreur lors de la normalisation des espaces:', spaceError);
      // Continuer avec le texte sans normaliser les espaces
    }
    
    return normalized;
  } catch (error) {
    console.error('Erreur générale lors de la normalisation du texte:', error);
    // En cas d'erreur, retourner une version simplifiée
    try {
      return text.toLowerCase().trim();
    } catch {
      return text; // Retourner le texte original si tout échoue
    }
  }
}

/**
 * Vérifie si un texte correspond à un modèle (mot ou regex)
 * en tenant compte de la normalisation
 */
function matchesPattern(text: string, pattern: string, isRegex: boolean = false): boolean {
  try {
    // Si le texte ou le pattern est vide, retourner false immédiatement
    if (!text || !pattern) return false;
    
    // Normaliser le texte d'entrée
    const normalizedText = normalizeText(text);
    
    if (isRegex) {
      try {
        const regex = new RegExp(pattern, 'i');
        return regex.test(text) || regex.test(normalizedText); // Vérifier le texte original et normalisé
      } catch (e) {
        console.error(`Expression régulière invalide: ${pattern}`, e);
        // Fallback: utiliser une recherche simple
        return text.toLowerCase().includes(pattern.toLowerCase()) || 
               normalizedText.includes(normalizeText(pattern));
      }
    }
    
    // Normaliser également le pattern pour une meilleure correspondance
    const normalizedPattern = normalizeText(pattern);
    
    // Vérification comme mot entier pour éviter les faux positifs
    try {
      // Approche alternative plus sûre pour créer des regex
      // Vérifier d'abord comme mot entier
      const textWords = ` ${normalizedText} `.split(' ');
      const patternWords = normalizedPattern.split(' ');
      
      // Vérifier chaque mot du pattern
      for (const patternWord of patternWords) {
        if (patternWord && textWords.some(word => 
            word === patternWord || 
            word === `${patternWord}s` || 
            word === `${patternWord}es`)) {
          return true;
        }
      }
      
      // Si la vérification par mots échoue, essayer avec regex avec gestion d'erreur
      // Échapper les caractères spéciaux regex dans le pattern
      const escapedPattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const escapedNormPattern = normalizedPattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      
      try {
        const regex = new RegExp(`\\b${escapedPattern}\\b|\\b${escapedPattern}[es]?\\b|\\b${escapedPattern}[s]?\\b`, 'i');
        if (regex.test(text)) return true;
      } catch (regexError) {
        console.error(`Erreur regex avec pattern original: ${pattern}`, regexError);
        // Continuer avec l'autre regex
      }
      
      try {
        const regexNorm = new RegExp(`\\b${escapedNormPattern}\\b|\\b${escapedNormPattern}[es]?\\b|\\b${escapedNormPattern}[s]?\\b`, 'i');
        if (regexNorm.test(normalizedText)) return true;
      } catch (regexNormError) {
        console.error(`Erreur regex avec pattern normalisé: ${normalizedPattern}`, regexNormError);
      }
      
      // Dernier recours : recherche simple d'inclusion
      return normalizedText.includes(normalizedPattern);
      
    } catch (e) {
      console.error(`Erreur lors de la création de l'expression régulière pour: ${pattern}`, e);
      // Fallback: vérification simple si le pattern est présent
      return text.toLowerCase().includes(pattern.toLowerCase()) || 
             normalizedText.includes(normalizedPattern);
    }
  } catch (generalError) {
    console.error(`Erreur générale dans matchesPattern pour: ${pattern}`, generalError);
    // Dernière tentative très basique
    try {
      return text.toLowerCase().includes(pattern.toLowerCase());
    } catch {
      return false; // En cas d'échec total, ne pas bloquer le message
    }
  }
}

/**
 * Vérifie si un mot est utilisé dans un contexte autorisé
 */
function isInAllowedContext(text: string, word: string, exceptions: string[] = []): boolean {
  if (!exceptions || exceptions.length === 0) return false;
  
  return exceptions.some(context => text.toLowerCase().includes(context.toLowerCase()));
}

/**
 * Détecte si le message est probablement une citation ou un signalement
 * pour éviter l'effet boomerang
 */
function isQuoteOrReport(text: string): boolean {
  if (!text) return false;
  
  try {
    const reportPatterns = [
      /il[\/\s\.]m[\'e]a\s+dit/i, 
      /elle[\/\s\.]m[\'e]a\s+dit/i,
      /m[\'e]a\s+traité/i,
      /m[\'e]a\s+insulté/i,
      /m[\'e]a\s+envoyé/i,
      /a\s+écrit/i,
      /a\s+dit\s+que/i,
      /selon\s+(lui|elle)/i,
      /d[\'e]après\s+(lui|elle)/i,
      /je\s+cite/i,
      /propos\s+de/i,
      /signaler\s+[a-z]+/i,
      /je\s+signale/i,
      /message\s+inapproprié/i
    ];
    
    // Recherche de guillemets qui indiquent souvent une citation
    let hasQuotes = false;
    try {
      hasQuotes = /"[^"]*"/.test(text) || /'[^']*'/.test(text) || /«[^»]*»/.test(text);
    } catch (e) {
      console.error("Erreur lors de la recherche de guillemets:", e);
      // Utiliser une approche alternative plus simple
      hasQuotes = text.includes('"') || text.includes("'") || text.includes('«');
    }
    
    if (hasQuotes) return true;
    
    // Tester chaque pattern avec gestion d'erreur
    for (const pattern of reportPatterns) {
      try {
        if (pattern.test(text)) {
          return true;
        }
      } catch (e) {
        console.error(`Erreur avec le pattern de détection de citation: ${pattern}`, e);
      }
    }

    return false;
  } catch (error) {
    console.error("Erreur lors de la détection de citation ou signalement:", error);
    return false; // En cas d'erreur, ne pas considérer comme citation
  }
}