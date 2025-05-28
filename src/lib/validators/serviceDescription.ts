/**
 * Validators pour les descriptions de services
 * - Impose des limites min/max pour chaque section
 * - Protège contre les injections XSS
 * - Détecte le contenu inapproprié
 */

// Limites par section
export const SECTION_LIMITS = {
  intro: { min: 50, max: 5000 },
  service: { min: 300, max: 10000 },
  deliverables: { min: 50, max: 5000 },
  requirements: { min: 50, max: 5000 },
  timing: { min: 50, max: 5000 },
  exclusions: { min: 50, max: 5000 },
};

// Types pour les sections de description
export type DescriptionSection = keyof typeof SECTION_LIMITS;
export type DescriptionFields = {
  [key in DescriptionSection]: string;
};

// Catégories de contenu inapproprié
export type InappropriateCategory =
  | "spam"
  | "drugs"
  | "adult"
  | "gambling"
  | "malware"
  | "hateSpeech"
  | "scam"
  | "illegal"
  | "violence";

// Résultat de détection de contenu inapproprié
export interface InappropriateContentResult {
  isInappropriate: boolean;
  categories: InappropriateCategory[];
  matches: string[];
  score: number;
  obfuscationDetected: boolean;
}

// Validation d'erreur
export interface ValidationResult {
  isValid: boolean;
  error: string | null;
  highlightedMatches?: string[]; // Mots problématiques à mettre en évidence
}

/**
 * Sanitize le contenu pour éviter les injections XSS
 */
export function sanitizeContent(content: string): string {
  if (!content) return "";

  // Supprimer les balises HTML potentiellement dangereuses et tous les scripts inclus
  let sanitized = content;
  let previousContent;

  // Appliquer plusieurs passes pour éliminer les balises HTML dangereuses
  do {
    previousContent = sanitized;
    sanitized = sanitized.replace(
      /<(script|iframe|object|embed|form|style)[^>]*>[\s\S]*?<\/\1>/gi,
      "",
    );
  } while (sanitized !== previousContent);

  // Appliquer plusieurs passes pour éliminer les balises HTML imbriquées
  do {
    previousContent = sanitized;
    // Supprimer toutes les balises HTML
    sanitized = sanitized.replace(/<[^>]*>/g, "");
  } while (sanitized !== previousContent);

  // Supprimer les balises potentiellement incomplètes
  sanitized = sanitized.replace(/<[^>]*$/g, "");

  // Échapper les caractères spéciaux pour éviter les injections
  // Important: ordre spécifique pour éviter les problèmes d'échappement double
  sanitized = sanitized
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

  // Supprimer les événements JavaScript dans les attributs (mesure de sécurité supplémentaire)
  // Appliquer plusieurs passes pour éliminer les attributs imbriqués
  do {
    previousContent = sanitized;
    sanitized = sanitized.replace(/\s+on\w+\s*=\s*("[^"]*"|'[^']*')/gi, "");
  } while (sanitized !== previousContent);

  // Supprimer les URIs dangereux (javascript:, data:, vbscript:, file:)
  do {
    previousContent = sanitized;
    sanitized = sanitized.replace(
      /((href|src|data|action)\s*=\s*)(["'])(.*?)\3/gi,
      (match, prefix, attr, quote, url) => {
        if (/javascript:|data:|vbscript:|file:/i.test(url)) {
          return `${prefix}${quote}invalid:removed${quote}`;
        }
        return match;
      },
    );
  } while (sanitized !== previousContent);

  // Protection supplémentaire contre les attaques XSS
  do {
    previousContent = sanitized;
    sanitized = sanitized.replace(
      /javascript:|data:|vbscript:|file:/gi,
      "invalid:",
    );
  } while (sanitized !== previousContent);

  return sanitized;
}

// Dictionnaire de mots interdits par catégorie
const INAPPROPRIATE_CONTENT_DICTIONARY: Record<
  InappropriateCategory,
  string[]
> = {
  spam: [
    "buy now",
    "make money fast",
    "earn extra cash",
    "best prices",
    "free gift",
    "click here",
    "limited time offer",
    "gmailcom",
    "hotmailcom",
    "yahoocom",
    "@gmail",
    "@hotmail",
    "@yahoo",
  ],
  drugs: [
    "cocaine",
    "heroin",
    "weed dealer",
    "mdma",
    "ecstasy",
    "meth",
    "methamphetamine",
    "illegal drugs",
    "drug dealer",
    "narcotic",
    "illicit drugs",
    "recreational drugs",
    "psychedelics for sale",
    "lsd tabs",
    "buy cannabis",
    "buy marijuana",
    "buy viagra",
    "buy cialis",
    "buy xanax",
    "buy valium",
    "buy pills",
  ],
  adult: [
    "porn",
    "xxx",
    "adult content",
    "sexy",
    "sex videos",
    "nsfw",
    "hot singles",
    "escort",
    "sexe",
    "sex",
    "xxx",
    "adulte",
    "contenu pour adulte",
    "pornographie",
    "porno",
    "call girl",
    "escorte",
    "services sexuels",
    "services adultes",
  ],
  gambling: [
    "casino",
    "bet",
    "gambling",
    "poker",
    "slots",
    "betting",
    "lottery",
    "jackpot",
    "roulette",
  ],
  malware: [
    "hack",
    "crack",
    "keygen",
    "warez",
    "torrent",
    "nulled",
    "patch",
    "serial key",
    "activation key",
  ],
  hateSpeech: [
    "racist",
    "nazi",
    "homophobic",
    "slur",
    "discrimination",
    "hate",
    "offensive",
  ],
  scam: [
    "wire transfer",
    "western union",
    "nigerian prince",
    "fake",
    "counterfeit",
    "scam",
    "fraud",
  ],
  illegal: [
    "illegal",
    "counterfeit",
    "fake id",
    "stolen",
    "pirated",
    "copyright material",
    "black market",
  ],
  violence: [
    "kill",
    "murder",
    "weapon",
    "gun",
    "violence",
    "terrorist",
    "bomb",
    "attack",
  ],
};

// Modèles d'obfuscation courants
const OBFUSCATION_PATTERNS: [RegExp, string][] = [
  [/v[i1!|]agr[a@4]|v\.i\.a\.g\.r\.a/gi, "viagra"],
  [/c[i1!|]al[i1!|]s|c\.i\.a\.l\.i\.s/gi, "cialis"],
  [/p[o0]rn[o0]?|p\.o\.r\.n/gi, "porn"],
  [/c[a@4]s[i1!|]n[o0]/gi, "casino"],
  [/fr[e3][e3]|fr\.e\.e/gi, "free"],
  [/ch[e3][a@4]p|ch\.e\.a\.p/gi, "cheap"],
  [/m[o0]n[e3]y|m\.o\.n\.e\.y/gi, "money"],
  [/b[e3][t+]/gi, "bet"],
  [/h[a@4]ck[s$]?|h\.a\.c\.k/gi, "hack"],
  [/s[e3]x[e3]?|s\.e\.x/gi, "sex"],
  [/x{2,3}|x+\s*x+\s*x*/gi, "xxx"],
  [/[eé][s$][c¢][o0]r[t7][e3]?/gi, "escort"],
];

// Patterns spécifiques à détecter (comme numéros de téléphone, emails, etc.)
const SPECIFIC_PATTERNS: [RegExp, string][] = [
  [/\b\d{9,12}\b/g, "numéro de téléphone"],
  [/\b\d{3,5}[\s-]?\d{3,5}[\s-]?\d{3,5}\b/g, "numéro de téléphone formaté"],
  [/\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/g, "email"],
  [/\b\d{5,}\b/g, "identifiant numérique suspect"],
  [
    /\b(?:je\s+vends|je\s+propose|j['']offre)\s+(?:du|de\s+la|des)?\s+(?:sexe|sex|porno|adulte)/gi,
    "offre sexuelle",
  ],
  [/\bcontacte[zr]?\s+moi\b.*?\b\d{5,}\b/gi, "contact suspect"],
];

// Liste des termes légitimes qui pourraient être des faux positifs
const LEGITIMATE_TERMS = [
  // Termes médicaux et pharmaceutiques
  "pharmacien",
  "pharmacienne",
  "pharmacie",
  "pharmacy",
  "pharmaceutical",
  "pharmaceutique",
  "médecin",
  "docteur",
  "doctor",
  "medical",
  "médical",
  "médicament",
  "medication",
  "health",
  "santé",
  "healthcare",
  "soins de santé",
  "hospital",
  "hôpital",
  "clinic",
  "clinique",
  "traitement",
  "treatment",
  "therapy",
  "thérapie",
  "prescription",
  "ordonnance",
  "cannabis médical",
  "medical cannabis",
  "cannabis thérapeutique",

  // Termes professionnels
  "consultation",
  "conseiller",
  "conseil",
  "expert",
  "expertise",
  "professionnel",
  "spécialiste",
  "specialist",
  "analyse",
  "analysis",
  "diagnostic",
  "évaluation",
  "service",
  "prestation",
  "accompagnement",
  "assistance",
  "support",
  "aide",
  "formation",
  "training",
  "cours",
  "coaching",
  "mentoring",
  "workshop",
  "atelier",

  // Domaines spécialisés
  "marketing",
  "communication",
  "digital",
  "numérique",
  "web",
  "internet",
  "online",
  "design",
  "graphique",
  "graphic",
  "art",
  "artistique",
  "creative",
  "créatif",
  "business",
  "entreprise",
  "commerce",
  "commercial",
  "vente",
  "sales",
  "négociation",
  "finance",
  "comptabilité",
  "accounting",
  "gestion",
  "management",
  "stratégie",
  "strategy",
  "juridique",
  "legal",
  "droit",
  "law",
  "avocat",
  "notaire",
  "conseiller juridique",
  "technique",
  "technical",
  "technologie",
  "technology",
  "informatique",
  "IT",
  "développement",
  "éducation",
  "education",
  "enseignement",
  "pédagogie",
  "apprentissage",
  "learning",

  // Secteurs d'activité
  "immobilier",
  "real estate",
  "property",
  "construction",
  "architecture",
  "bâtiment",
  "tourisme",
  "tourism",
  "voyage",
  "travel",
  "hospitality",
  "hôtellerie",
  "restauration",
  "agriculture",
  "farming",
  "environnement",
  "environment",
  "écologie",
  "ecology",
  "durable",
  "artisanat",
  "craft",
  "handmade",
  "fait main",
  "production",
  "fabrication",
  "manufacturing",
  "beauté",
  "beauty",
  "cosmétique",
  "cosmetics",
  "bien-être",
  "wellness",
  "spa",
  "soins",
  "mode",
  "fashion",
  "vêtement",
  "clothing",
  "textile",
  "accessoire",
  "accessories",
  "sport",
  "fitness",
  "coaching sportif",
  "performance",
  "training",
  "entraînement",
];

// Paires de contexte positif (mot ambigü + contexte légitime qui le rend acceptable)
const POSITIVE_CONTEXT_PAIRS: [string, string[]][] = [
  [
    "pills",
    [
      "vitamin",
      "supplement",
      "nutrition",
      "dietary",
      "médicament",
      "traitement",
    ],
  ],
  [
    "pharmacy",
    ["services", "conseil", "health", "santé", "medicine", "médicament"],
  ],
  [
    "pills",
    [
      "vitamin",
      "supplement",
      "nutrition",
      "dietary",
      "médicament",
      "traitement",
    ],
  ],
  [
    "cannabis",
    ["medical", "médical", "therapeutic", "thérapeutique", "CBD", "légal"],
  ],
  [
    "marijuana",
    [
      "medical",
      "médical",
      "therapeutic",
      "thérapeutique",
      "légalisation",
      "CBD",
    ],
  ],
  [
    "drugs",
    [
      "prescription",
      "ordonnance",
      "medical",
      "médical",
      "treatment",
      "traitement",
    ],
  ],
  [
    "bet",
    ["market", "investment", "strategy", "stratégie", "analysis", "analyse"],
  ],
  [
    "gambling",
    ["theory", "analysis", "économie", "economy", "stratégie", "strategy"],
  ],
  [
    "adult",
    [
      "education",
      "learning",
      "formation",
      "cours",
      "professional",
      "professionnel",
    ],
  ],
  [
    "hack",
    ["growth", "life", "productivity", "astuce", "conseil", "tip", "technique"],
  ],
  // Nouveaux contextes positifs pour SEO/SEA/Marketing
  [
    "sex",
    [
      "equality",
      "égalité",
      "demographics",
      "démographie",
      "gender",
      "genre",
      "statistics",
      "statistiques",
    ],
  ],
  [
    "adult",
    [
      "demographics",
      "démographie",
      "target",
      "cible",
      "market",
      "marché",
      "segment",
    ],
  ],
  [
    "sexy",
    [
      "design",
      "attractive",
      "attrayant",
      "marketing",
      "branding",
      "image de marque",
    ],
  ],
  [
    "xxx",
    [
      "variable",
      "placeholder",
      "remplacement",
      "exemple",
      "example",
      "coding",
      "code",
    ],
  ],
  [
    "escort",
    [
      "service",
      "accompagnement",
      "VIP",
      "business",
      "enterprise",
      "entreprise",
      "professional",
      "professionnel",
    ],
  ],
];

// Phrases et combinaisons explicitement interdites, quel que soit le contexte
const EXPLICITLY_FORBIDDEN_PHRASES = [
  "je vends de la sexe",
  "je vends du sexe",
  "je propose du sexe",
  "j'offre du sexe",
  "services sexuels",
  "prestation sexuelle",
  "service sexuel",
  "call girl",
  "escorte girl",
  "escort girl",
  "escort service",
  "service d'escorte",
  "adult services",
  "services pour adultes",
  "contacter moi au",
  "contactez-moi au",
  "message moi au",
  // Nouvelles phrases
  "je vends de la",
  "je vends du",
  "contactez moi",
  "contact moi",
  "mon numero",
  "mes reseaux",
  "mes réseaux",
  "liens vers reseaux",
  "liens vers réseaux",
];

// Mots-clés de haute suspicion qui nécessitent une analyse approfondie
const HIGH_SUSPICION_KEYWORDS = [
  "drogue",
  "drugs",
  "cannabis",
  "weed",
  "cocaine",
  "cocaïne",
  "ecstasy",
  "mdma",
  "sexe",
  "sex",
  "escort",
  "escorte",
  "xxx",
  "adult",
  "adulte",
  "contactez",
  "contacter",
  "contact",
  "numero",
  "numéro",
  "téléphone",
  "telephone",
  "gmail",
  "hotmail",
  "yahoo",
  "email",
  "mail",
  "@",
  "whatsapp",
  "telegram",
  "signal",
  "facebook",
  "instagram",
  "twitter",
  "tiktok",
  "vends",
  "vente",
  "achat",
  "acheter",
  "payer",
  "payment",
  "argent",
  "cash",
  "porn",
  "porno",
  "pornographie",
];

// Patterns pour détecter les tentatives de fragmentation et d'obfuscation
const ADVANCED_OBFUSCATION_PATTERNS: [RegExp, string][] = [
  [
    /je\s+v[e3]nds\s+(?:d[eu]\s+l[a@]|du|d[e3]s)?\s*(?:[a-z]{1,3})?\s*$/i,
    "offre fragmentée",
  ],
  [
    /c[o0]nt[a@]ct[e3][zr]?\s+m[o0][i1]?\s*(?:[a-z]{1,3})?\s*$/i,
    "invitation contact fragmentée",
  ],
  [
    /\b(?:num[ée]ro|t[ée]l[ée]phone|t[ée]l)\s*(?:[a-z]{1,3})?\s*$/i,
    "référence numéro fragmentée",
  ],
  [/\b[a-zA-Z]+\s*:\s*\d{5,}/i, "format code:numéro"],
  [/\b\d{5,}\s*:\s*[a-zA-Z]+/i, "format numéro:code"],
  [
    /\b(?:[a-zA-Z0-9_.+-]+)(?:\s+[aà@]\s+|@|\[at\]|\(at\))(?:[a-zA-Z0-9-]+)(?:\s*\.\s*|\[dot\]|\(dot\))(?:[a-zA-Z]{2,})\b/i,
    "email obfusqué",
  ],
  [
    /\b(?:\+\d{1,3})?(?:\s*\(?\d{1,4}\)?[-.\s]?){2,5}\d{2,6}\b/i,
    "numéro formaté complexe",
  ],
];

// Tokens suspects proches (fenêtre de 5 mots max)
function detectSuspiciousTokenProximity(content: string): string[] {
  const matches: string[] = [];
  const words = content.toLowerCase().split(/\s+/);

  // Vérifier chaque paire de mots suspicieux dans une fenêtre de 5 mots
  for (let i = 0; i < words.length; i++) {
    for (let j = i + 1; j < Math.min(i + 6, words.length); j++) {
      const word1 = words[i];
      const word2 = words[j];

      // Rechercher les combinaisons suspectes
      if (
        // Combinaisons de vente + substance
        (word1.match(/\b(vends|vente|offre|propose)\b/i) &&
          HIGH_SUSPICION_KEYWORDS.includes(word2)) ||
        (word2.match(/\b(vends|vente|offre|propose)\b/i) &&
          HIGH_SUSPICION_KEYWORDS.includes(word1)) ||
        // Combinaisons de contact + méthode
        (word1.match(/\b(contact|contactez|message|appel|appeler)\b/i) &&
          (word2.match(
            /\b(gmail|hotmail|yahoo|mail|whatsapp|telegram|signal)\b/i,
          ) ||
            word2.match(/\b\d{5,}\b/))) ||
        (word2.match(/\b(contact|contactez|message|appel|appeler)\b/i) &&
          (word1.match(
            /\b(gmail|hotmail|yahoo|mail|whatsapp|telegram|signal)\b/i,
          ) ||
            word1.match(/\b\d{5,}\b/)))
      ) {
        const combination = `${word1} ... ${word2}`;
        if (!matches.includes(combination)) {
          matches.push(combination);
        }
      }
    }
  }

  return matches;
}

// Analyse des chiffres et des séquences numériques suspectes
function analyzeNumericSequences(content: string): boolean {
  const numericRegex = /\d+/g;
  const matches = content.match(numericRegex);

  if (!matches) return false;

  // Compter le nombre total de chiffres dans le contenu
  const totalDigits = matches.reduce((total, match) => total + match.length, 0);

  // Détecter plusieurs séquences numériques longues (potentiellement des numéros de téléphone)
  const longNumericSequences = matches.filter((match) => match.length >= 5);

  // Détecter les formats de numéros de téléphone partiellement masqués
  const partiallyMaskedNumbers = content.match(
    /\d{2,3}[.\-\s]?\*{2,}[.\-\s]?\d{2,3}/g,
  );

  // Détecter les séquences numériques séparées par des caractères spéciaux (ex: 123-456-789)
  const formattedNumbers = content.match(
    /\d{2,4}[.\-\s]\d{2,4}[.\-\s]\d{2,4}/g,
  );

  // Considérer comme suspect si:
  // - Plus de 15 chiffres au total dans le contenu (trop de numéros)
  // - Plus de 2 séquences numériques longues (plusieurs numéros potentiels)
  // - Présence de numéros partiellement masqués ou de formats typiques de numéros de téléphone
  return (
    totalDigits > 15 ||
    longNumericSequences.length >= 2 ||
    partiallyMaskedNumbers !== null ||
    formattedNumbers !== null
  );
}

// Détection de tentatives de fragmentation avancée
function detectAdvancedFragmentation(content: string): boolean {
  // Rechercher des mots-clés interdits avec espaces ou caractères entre chaque lettre
  const fragmentedKeywords = [
    "s\\s*e\\s*x",
    "p\\s*o\\s*r\\s*n",
    "e\\s*s\\s*c\\s*o\\s*r\\s*t",
    "d\\s*r\\s*u\\s*g\\s*s",
    "c\\s*o\\s*n\\s*t\\s*a\\s*c\\s*t",
  ];

  for (const keyword of fragmentedKeywords) {
    const regex = new RegExp(keyword, "i");
    if (regex.test(content)) {
      return true;
    }
  }

  // Mots suspects séparés par des caractères spéciaux ou des chiffres
  const suspiciousPatterns = [
    /v[0-9._-]*e[0-9._-]*n[0-9._-]*d[0-9._-]*s/i,
    /s[0-9._-]*e[0-9._-]*x[0-9._-]*e/i,
    /d[0-9._-]*r[0-9._-]*o[0-9._-]*g[0-9._-]*u[0-9._-]*e/i,
    /c[0-9._-]*o[0-9._-]*n[0-9._-]*t[0-9._-]*a[0-9._-]*c[0-9._-]*t/i,
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(content)) {
      return true;
    }
  }

  return false;
}

// Analyse de la structure globale du texte pour détecter des modèles suspects
function analyzeTextStructure(content: string): {
  isSuspicious: boolean;
  reasons: string[];
} {
  const result = {
    isSuspicious: false,
    reasons: [] as string[],
  };

  // Préparation du texte
  const lines = content.split("\n").filter((line) => line.trim().length > 0);
  const words = content.toLowerCase().split(/\s+/);

  // 1. Beaucoup de lignes très courtes (format liste/contacts)
  const shortLines = lines.filter((line) => line.trim().length < 20);
  if (lines.length >= 3 && shortLines.length / lines.length > 0.5) {
    result.isSuspicious = true;
    result.reasons.push("structure en liste suspecte");
  }

  // 2. Répétition excessive de mots suspects
  const wordFrequency: Record<string, number> = {};
  for (const word of words) {
    if (HIGH_SUSPICION_KEYWORDS.includes(word)) {
      wordFrequency[word] = (wordFrequency[word] || 0) + 1;
    }
  }

  // Vérifier si un mot suspect est répété de manière excessive
  for (const [word, count] of Object.entries(wordFrequency)) {
    if (count >= 3) {
      result.isSuspicious = true;
      result.reasons.push(
        `répétition excessive du mot "${word}" (${count} fois)`,
      );
    }
  }

  // 3. Texte marketing au début suivi de contenu suspect à la fin
  if (lines.length >= 4) {
    // Vérifier si les premières lignes semblent légitimes et les dernières suspectes
    const firstHalf = lines
      .slice(0, Math.floor(lines.length / 2))
      .join(" ")
      .toLowerCase();
    const secondHalf = lines
      .slice(Math.floor(lines.length / 2))
      .join(" ")
      .toLowerCase();

    const legitTermsFirstHalf = LEGITIMATE_TERMS.filter((term) =>
      firstHalf.includes(term.toLowerCase()),
    ).length;
    const suspiciousTermsFirstHalf = HIGH_SUSPICION_KEYWORDS.filter((term) =>
      firstHalf.includes(term.toLowerCase()),
    ).length;

    const legitTermsSecondHalf = LEGITIMATE_TERMS.filter((term) =>
      secondHalf.includes(term.toLowerCase()),
    ).length;
    const suspiciousTermsSecondHalf = HIGH_SUSPICION_KEYWORDS.filter((term) =>
      secondHalf.includes(term.toLowerCase()),
    ).length;

    // Pattern typique: début légitime, fin suspecte
    if (
      legitTermsFirstHalf > suspiciousTermsFirstHalf &&
      suspiciousTermsSecondHalf > legitTermsSecondHalf
    ) {
      result.isSuspicious = true;
      result.reasons.push("début légitime suivi de contenu suspect");
    }
  }

  // 4. Détection de séparateurs ou caractères spéciaux utilisés pour diviser le texte
  const suspiciousSeparators = content.match(
    /[.]{3,}|[-]{3,}|[_]{3,}|[*]{3,}|[\/]{3,}/g,
  );
  if (suspiciousSeparators && suspiciousSeparators.length > 0) {
    result.isSuspicious = true;
    result.reasons.push("utilisation de séparateurs suspects");
  }

  // 5. Recherche de mots-clés suspects en majuscules (indication d'importance)
  const uppercaseWords = content.match(/\b[A-Z]{2,}\b/g);
  if (uppercaseWords) {
    const suspiciousUppercase = uppercaseWords.filter((word) =>
      HIGH_SUSPICION_KEYWORDS.includes(word.toLowerCase()),
    );
    if (suspiciousUppercase.length > 0) {
      result.isSuspicious = true;
      result.reasons.push("mots-clés suspects en majuscules");
    }
  }

  return result;
}

/**
 * Détecter le contenu inapproprié avec analyse avancée
 */
export function detectInappropriateContent(
  content: string,
): InappropriateContentResult {
  if (!content || !content.trim()) {
    return {
      isInappropriate: false,
      categories: [],
      matches: [],
      score: 0,
      obfuscationDetected: false,
    };
  }

  const result: InappropriateContentResult = {
    isInappropriate: false,
    categories: [],
    matches: [],
    score: 0,
    obfuscationDetected: false,
  };

  // Normaliser le contenu pour la vérification
  let normalizedContent = content.toLowerCase();

  // Analyse de la structure globale du texte
  const structuralAnalysis = analyzeTextStructure(content);
  if (structuralAnalysis.isSuspicious) {
    result.score += 0.25;
    for (const reason of structuralAnalysis.reasons) {
      result.matches.push(reason);
    }
    result.isInappropriate = result.score > 0.3;
  }

  // Analyse avancée des séquences numériques
  if (analyzeNumericSequences(content)) {
    result.matches.push("séquences numériques suspectes");
    result.score += 0.25;
    if (!result.categories.includes("spam")) {
      result.categories.push("spam");
    }
  }

  // Détection de fragmentation avancée
  if (detectAdvancedFragmentation(content)) {
    result.matches.push("texte délibérément fragmenté");
    result.obfuscationDetected = true;
    result.score += 0.35;
  }

  // Compter les mots-clés à haute suspicion
  const highSuspicionCount = HIGH_SUSPICION_KEYWORDS.filter((keyword) =>
    normalizedContent.includes(keyword.toLowerCase()),
  ).length;

  // Si plusieurs mots à haute suspicion sont trouvés ensemble, c'est très suspect
  if (highSuspicionCount >= 3) {
    result.score = 0.7;
    result.isInappropriate = true;
    result.matches.push(`${highSuspicionCount} mots-clés suspects détectés`);

    // Détecter les combinaisons de tokens suspects proches
    const suspiciousProximities = detectSuspiciousTokenProximity(content);
    if (suspiciousProximities.length > 0) {
      result.score = 0.85;
      for (const proximity of suspiciousProximities) {
        result.matches.push(`Combinaison suspecte: ${proximity}`);
      }
      if (!result.categories.includes("spam")) {
        result.categories.push("spam");
      }
    }
  }

  // Vérifier d'abord les phrases explicitement interdites
  for (const phrase of EXPLICITLY_FORBIDDEN_PHRASES) {
    if (normalizedContent.includes(phrase.toLowerCase())) {
      // Si une phrase interdite est trouvée, c'est directement inapproprié
      if (!result.matches.includes(phrase)) {
        result.matches.push(phrase);
      }
      if (!result.categories.includes("adult")) {
        result.categories.push("adult");
      }
      // Score très élevé pour les phrases explicitement interdites
      result.score = 0.9;
      result.isInappropriate = true;
      return result; // Sortie immédiate, pas besoin d'analyses supplémentaires
    }
  }

  // Vérifier si le contenu contient des termes légitimes avant de procéder à l'analyse complète
  // Calculer un score de légitimité basé sur le nombre de termes professionnels trouvés
  const legitimateMatches = LEGITIMATE_TERMS.filter((term) =>
    normalizedContent.includes(term.toLowerCase()),
  );

  // Si plusieurs termes légitimes sont trouvés, la probabilité d'un contexte professionnel augmente
  const legitimateMatchCount = legitimateMatches.length;
  let legitimateContextModifier = 0;

  if (legitimateMatchCount > 0) {
    // Plus on trouve de termes légitimes, plus on réduit la sensibilité
    // Échelle progressive: 0.1 pour 1 terme, jusqu'à 0.4 pour 4+ termes
    legitimateContextModifier = Math.min(0.4, legitimateMatchCount * 0.1);
  }

  // Vérifier les patterns spécifiques (numéros de téléphone, emails, etc.)
  let phoneNumberDetected = false;
  let emailDetected = false;
  let suspiciousIdDetected = false;

  for (const [pattern, description] of SPECIFIC_PATTERNS) {
    const matches = normalizedContent.match(pattern);
    if (matches) {
      // Considérer ces patterns comme hautement suspects
      result.obfuscationDetected = true;

      for (const _ of matches) {
        if (!result.matches.includes(description)) {
          result.matches.push(description);

          // Suivre les types spécifiques détectés
          if (description.includes("téléphone")) {
            phoneNumberDetected = true;
          } else if (description === "email") {
            emailDetected = true;
          } else if (description.includes("numérique")) {
            suspiciousIdDetected = true;
          }
        }
      }
    }
  }

  // Renforcement pour l'analyse de contenu sexuel explicite
  // Recherche directe de certains mots même dans un contexte légitime apparent
  const explicitContent =
    /\b(?:sex|xxx|porno|porn|sexe|escort|escorte)\b/gi.test(content);
  const suspiciousMarketingTerms =
    /\b(?:SEO|SEA|marketing|référencement|visibilité|trafic)\b/gi.test(content);

  // Combinaison suspecte: termes explicites + marketing + coordonnées
  if (
    explicitContent &&
    suspiciousMarketingTerms &&
    (phoneNumberDetected || emailDetected)
  ) {
    if (!result.categories.includes("adult")) {
      result.categories.push("adult");
    }
    result.matches.push(
      "combinaison suspecte (contenu explicite avec coordonnées)",
    );
    result.score = Math.max(result.score, 0.8);
    result.isInappropriate = true;
  }

  // Vérifier l'obfuscation
  const deobfuscatedContent = new Map<string, string>();

  for (const [pattern, replacement] of OBFUSCATION_PATTERNS) {
    const match = normalizedContent.match(pattern);
    if (match) {
      result.obfuscationDetected = true;

      // Stocker les correspondances d'obfuscation
      for (const m of match) {
        deobfuscatedContent.set(m, replacement);
        // Remplacer dans le contenu normalisé pour les vérifications suivantes
        normalizedContent = normalizedContent.replace(m, replacement);
      }
    }
  }

  // Détection des patterns avancés d'obfuscation
  for (const [pattern, description] of ADVANCED_OBFUSCATION_PATTERNS) {
    const matches = normalizedContent.match(pattern);
    if (matches) {
      result.obfuscationDetected = true;

      for (const _ of matches) {
        if (!result.matches.includes(description)) {
          result.matches.push(description);
        }
      }

      // Ajouter directement du score pour les patterns avancés
      result.score += 0.3;
      if (!result.categories.includes("spam")) {
        result.categories.push("spam");
      }
    }
  }

  // Vérifier les catégories de contenu inapproprié
  const categories = Object.keys(
    INAPPROPRIATE_CONTENT_DICTIONARY,
  ) as InappropriateCategory[];
  let totalMatches = 0;
  const ignoredMatches: string[] = []; // Mots ignorés car dans un contexte positif

  // Si du contenu explicite est détecté, augmenter la sensibilité
  if (explicitContent) {
    legitimateContextModifier = Math.max(0, legitimateContextModifier - 0.2);

    // Si un numéro de téléphone ou email est présent, c'est encore plus suspect
    if (phoneNumberDetected || emailDetected) {
      legitimateContextModifier = 0; // Annuler complètement la tolérance
    }
  }

  for (const category of categories) {
    const keywords = INAPPROPRIATE_CONTENT_DICTIONARY[category];
    const categoryMatches: string[] = [];

    for (const keyword of keywords) {
      // Traitement spécial pour la catégorie "adult" et "spam" - plus stricte
      if (category === "adult" || category === "spam") {
        const regex = new RegExp(`\\b${keyword}\\b|${keyword}`, "i");
        if (regex.test(normalizedContent)) {
          // Pour le contenu adulte, moins de tolérance au contexte légitime
          const contextPair = POSITIVE_CONTEXT_PAIRS.find(
            ([term]) =>
              term.toLowerCase() === keyword.toLowerCase() ||
              keyword.toLowerCase().includes(term.toLowerCase()),
          );

          let shouldIgnore = false;

          if (contextPair) {
            // Pour le contenu adulte, on vérifie avec plus de sévérité
            const hasPositiveContext = contextPair[1].some((contextTerm) =>
              normalizedContent.includes(contextTerm.toLowerCase()),
            );

            // Pour le contenu adulte, on exige plus de termes légitimes
            shouldIgnore =
              hasPositiveContext && category !== "adult"
                ? true
                : hasPositiveContext && legitimateMatchCount > 3;

            if (shouldIgnore) {
              ignoredMatches.push(keyword);
              continue;
            }
          }

          categoryMatches.push(keyword);
          if (!result.matches.includes(keyword)) {
            result.matches.push(keyword);
          }
        }
      } else if (category === "drugs") {
        // Vérifier si le mot est présent comme un mot entier ou dans une expression
        const regex = new RegExp(`\\b${keyword}\\b|${keyword}`, "i");
        if (regex.test(normalizedContent)) {
          // Vérifier si le mot est dans un contexte positif
          const contextPair = POSITIVE_CONTEXT_PAIRS.find(
            ([term]) =>
              term.toLowerCase() === keyword.toLowerCase() ||
              keyword.toLowerCase().includes(term.toLowerCase()),
          );

          if (contextPair) {
            // Vérifier si un des contextes positifs est présent
            const hasPositiveContext = contextPair[1].some((contextTerm) =>
              normalizedContent.includes(contextTerm.toLowerCase()),
            );

            if (hasPositiveContext) {
              // Ignorer ce mot car il est dans un contexte positif
              ignoredMatches.push(keyword);
              continue;
            }
          }

          categoryMatches.push(keyword);
          if (!result.matches.includes(keyword)) {
            result.matches.push(keyword);
          }
        } else if (normalizedContent.includes(keyword)) {
          // Pour les autres catégories, vérifier également le contexte positif
          const contextPair = POSITIVE_CONTEXT_PAIRS.find(
            ([term]) =>
              term.toLowerCase() === keyword.toLowerCase() ||
              keyword.toLowerCase().includes(term.toLowerCase()),
          );

          if (contextPair) {
            const hasPositiveContext = contextPair[1].some((contextTerm) =>
              normalizedContent.includes(contextTerm.toLowerCase()),
            );

            if (hasPositiveContext) {
              ignoredMatches.push(keyword);
              continue;
            }
          }

          categoryMatches.push(keyword);
          if (!result.matches.includes(keyword)) {
            result.matches.push(keyword);
          }
        }
      }
    }

    if (categoryMatches.length > 0) {
      result.categories.push(category);
      totalMatches += categoryMatches.length;
    }
  }

  // Ajouter les mots détectés par désobfuscation
  deobfuscatedContent.forEach((replacement, original) => {
    if (!result.matches.includes(replacement)) {
      result.matches.push(replacement);
    }
  });

  // Calculer le score de sévérité (entre 0 et 1)
  // On prend en compte le nombre de catégories, le nombre de correspondances et l'obfuscation
  if (result.categories.length > 0 || result.obfuscationDetected) {
    // Formule de calcul du score
    const categoryWeight = 0.4; // Poids des catégories
    const matchesWeight = 0.4; // Poids des correspondances
    const obfuscationWeight = 0.2; // Poids de l'obfuscation

    const categoryScore =
      Math.min(1, result.categories.length / 3) * categoryWeight;
    const matchesScore = Math.min(1, totalMatches / 5) * matchesWeight;
    const obfuscationScore = result.obfuscationDetected ? obfuscationWeight : 0;

    // Calculer le score de base
    let baseScore = categoryScore + matchesScore + obfuscationScore;

    // Appliquer le modificateur de contexte légitime
    if (legitimateContextModifier > 0) {
      baseScore = Math.max(0, baseScore - legitimateContextModifier);
    }

    // Ajuster le score en fonction du nombre de mots ignorés dans un contexte positif
    if (ignoredMatches.length > 0) {
      // Réduire le score proportionnellement au nombre de termes ambigus dans un contexte positif
      const ignoredMatchesModifier = Math.min(0.3, ignoredMatches.length * 0.1);
      baseScore = Math.max(0, baseScore - ignoredMatchesModifier);
    }

    // Analyse de densité : être plus permissif avec les textes longs contenant peu de mots inappropriés
    const contentLength = content.trim().length;
    if (contentLength > 500) {
      // Calculer la densité des mots inappropriés (nombre de matches / longueur du texte)
      const densityFactor = totalMatches / (contentLength / 100); // Matches par 100 caractères

      if (densityFactor < 0.2) {
        // Très faible densité
        // Réduire le score pour les textes longs avec peu de mots potentiellement inappropriés
        const densityModifier = 0.2;
        baseScore = Math.max(0, baseScore - densityModifier);
      }
    }

    // Détection de cas spécifiques - motifs hautement suspects
    if (
      normalizedContent.match(
        /\b(je\s+vends|j['']offre|acheter|buy)\s+.{0,10}\b(sex|porn|adult|escort)/i,
      )
    ) {
      // Augmenter fortement le score pour ces combinaisons spécifiques
      baseScore += 0.4;
    }

    // Détection de numéros de téléphone avec contenu explicite
    if (result.matches.includes("numéro de téléphone") && explicitContent) {
      baseScore += 0.3;
    }

    // Arrondir à 2 décimales
    result.score = parseFloat(baseScore.toFixed(2));
    result.isInappropriate = result.score > 0.3; // Seuil de détection augmenté de 0.2 à 0.3
  }

  // Appliquer un plafond maximum pour le score
  if (result.score > 1.0) {
    result.score = 1.0;
  }

  return result;
}

/**
 * Vérifier si une section répond aux exigences minimales
 */
export function validateSectionLength(
  section: DescriptionSection,
  content: string,
): ValidationResult {
  const { min, max } = SECTION_LIMITS[section];
  const length = content.trim().length;

  // Section vide
  if (length === 0) {
    return {
      isValid: false,
      error: `La section ${formatSectionName(section)} est obligatoire`,
    };
  }

  // Si la section est remplie mais trop courte
  if (length > 0 && length < min) {
    return {
      isValid: false,
      error: `La section ${formatSectionName(section)} doit contenir au moins ${min} caractères (actuellement ${length})`,
    };
  }

  // Si la section est trop longue
  if (length > max) {
    return {
      isValid: false,
      error: `La section ${formatSectionName(section)} ne doit pas dépasser ${max} caractères (actuellement ${length})`,
    };
  }

  // Vérifier le contenu inapproprié
  const contentResult = detectInappropriateContent(content);

  // Application d'un seuil plus permissif pour la section Introduction
  const isInappropriate =
    section === "intro"
      ? contentResult.score > 0.5 // Seuil plus élevé pour l'introduction
      : contentResult.isInappropriate;

  if (isInappropriate) {
    let message = `La section ${formatSectionName(section)} contient du contenu inapproprié`;

    // Ajouter des détails si disponibles
    if (contentResult.categories.length > 0) {
      message += ` (catégories: ${contentResult.categories.join(", ")})`;
    }

    // Si des correspondances ont été trouvées, les ajouter au message
    if (contentResult.matches.length > 0) {
      message += `. Mots détectés: "${contentResult.matches.join('", "')}"`;
    }

    return {
      isValid: false,
      error: message,
      highlightedMatches: contentResult.matches, // Ajouter les mots problématiques
    };
  }

  return { isValid: true, error: null };
}

/**
 * Valider toutes les sections du service
 */
export function validateAllSections(
  fields: DescriptionFields,
): ValidationResult {
  for (const section of Object.keys(SECTION_LIMITS) as DescriptionSection[]) {
    const result = validateSectionLength(section, fields[section]);
    if (!result.isValid) {
      return result;
    }
  }

  return { isValid: true, error: null };
}

/**
 * Construire la description complète à partir des sections
 */
export function buildFullDescription(fields: DescriptionFields): string {
  // Sanitize chaque section
  const sanitizedFields = Object.entries(fields).reduce((acc, [key, value]) => {
    acc[key as DescriptionSection] = sanitizeContent(value);
    return acc;
  }, {} as DescriptionFields);

  // Construire le texte complet
  return `Introduction : 
${sanitizedFields.intro}

📝 Description du service : 
${sanitizedFields.service}

🎯 Ce que vous obtiendrez : 
${sanitizedFields.deliverables}

🛠️ Ce dont j'ai besoin de vous : 
${sanitizedFields.requirements}

⏱️ Délais et révisions : 
${sanitizedFields.timing}

❌ Ce qui n'est pas inclus : 
${sanitizedFields.exclusions}`;
}

/**
 * Formater le nom de la section pour l'affichage dans les messages d'erreur
 */
function formatSectionName(section: DescriptionSection): string {
  switch (section) {
    case "intro":
      return "Introduction";
    case "service":
      return "Description du service";
    case "deliverables":
      return "Ce que vous obtiendrez";
    case "requirements":
      return "Ce dont j'ai besoin de vous";
    case "timing":
      return "Délais et révisions";
    case "exclusions":
      return "Ce qui n'est pas inclus";
    default:
      return section;
  }
}

/**
 * Interface pour les positions des correspondances dans le texte
 */
export interface MatchPosition {
  match: string;
  positions: number[];
}

/**
 * Trouver les positions exactes des mots inappropriés dans le texte
 */
export function findMatchPositions(
  content: string,
  matches: string[],
): MatchPosition[] {
  if (!content || !matches || matches.length === 0) {
    return [];
  }

  const results: MatchPosition[] = [];
  const lowerContent = content.toLowerCase();

  for (const match of matches) {
    const lowerMatch = match.toLowerCase();
    const positions: number[] = [];
    let pos = lowerContent.indexOf(lowerMatch);

    // Trouver toutes les occurrences du mot
    while (pos !== -1) {
      positions.push(pos);
      pos = lowerContent.indexOf(lowerMatch, pos + 1);
    }

    if (positions.length > 0) {
      results.push({
        match,
        positions,
      });
    }
  }

  return results;
}
