/**
 * Validators pour les descriptions de services
 * - Impose des limites min/max pour chaque section
 * - Protège contre les injections XSS
 * - Détecte le contenu inapproprié
 */

// Limites par section
export const SECTION_LIMITS = {
  intro: { min: 50, max: 5000 },
  service: { min: 1000, max: 10000 },
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
export type InappropriateCategory = 'spam' | 'drugs' | 'adult' | 'gambling' | 'malware' | 'hateSpeech' | 'scam' | 'illegal' | 'violence';

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
}

/**
 * Sanitize le contenu pour éviter les injections XSS
 */
export function sanitizeContent(content: string): string {
  if (!content) return '';
  
  // Supprimer les balises HTML potentiellement dangereuses
  let sanitized = content.replace(/<(script|iframe|object|embed|form|style)[^>]*>[\s\S]*?<\/\1>/gi, '');
  
  // Échapper les caractères spéciaux pour éviter les injections
  sanitized = sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
    
  // Supprimer les événements JavaScript dans les attributs
  sanitized = sanitized.replace(/\s+on\w+\s*=\s*("[^"]*"|'[^']*')/gi, '');
  
  // Supprimer les URIs dangereux
  sanitized = sanitized.replace(/\s+(href|src|data|action)\s*=\s*("javascript:[^"]*"|'javascript:[^']*')/gi, '');
  
  return sanitized;
}

// Dictionnaire de mots interdits par catégorie
const INAPPROPRIATE_CONTENT_DICTIONARY: Record<InappropriateCategory, string[]> = {
  spam: ['buy now', 'make money fast', 'earn extra cash', 'best prices', 'free gift', 'click here', 'limited time offer'],
  drugs: ['viagra', 'cialis', 'xanax', 'valium', 'cannabis', 'marijuana', 'pharmacy', 'painkillers', 'pills'],
  adult: ['porn', 'xxx', 'adult content', 'sexy', 'sex videos', 'nsfw', 'hot singles', 'escort'],
  gambling: ['casino', 'bet', 'gambling', 'poker', 'slots', 'betting', 'lottery', 'jackpot', 'roulette'],
  malware: ['hack', 'crack', 'keygen', 'warez', 'torrent', 'nulled', 'patch', 'serial key', 'activation key'],
  hateSpeech: ['racist', 'nazi', 'homophobic', 'slur', 'discrimination', 'hate', 'offensive'],
  scam: ['wire transfer', 'western union', 'nigerian prince', 'fake', 'counterfeit', 'scam', 'fraud'],
  illegal: ['illegal', 'counterfeit', 'fake id', 'stolen', 'pirated', 'copyright material', 'black market'],
  violence: ['kill', 'murder', 'weapon', 'gun', 'violence', 'terrorist', 'bomb', 'attack']
};

// Modèles d'obfuscation courants
const OBFUSCATION_PATTERNS: [RegExp, string][] = [
  [/v[i1!|]agr[a@4]|v\.i\.a\.g\.r\.a/gi, 'viagra'],
  [/c[i1!|]al[i1!|]s|c\.i\.a\.l\.i\.s/gi, 'cialis'],
  [/p[o0]rn[o0]?|p\.o\.r\.n/gi, 'porn'],
  [/c[a@4]s[i1!|]n[o0]/gi, 'casino'],
  [/fr[e3][e3]|fr\.e\.e/gi, 'free'],
  [/ch[e3][a@4]p|ch\.e\.a\.p/gi, 'cheap'],
  [/m[o0]n[e3]y|m\.o\.n\.e\.y/gi, 'money'],
  [/b[e3][t+]/gi, 'bet'],
  [/h[a@4]ck[s$]?|h\.a\.c\.k/gi, 'hack']
];

/**
 * Détecter le contenu inapproprié avec analyse avancée
 */
export function detectInappropriateContent(content: string): InappropriateContentResult {
  if (!content || !content.trim()) {
    return {
      isInappropriate: false,
      categories: [],
      matches: [],
      score: 0,
      obfuscationDetected: false
    };
  }
  
  const result: InappropriateContentResult = {
    isInappropriate: false,
    categories: [],
    matches: [],
    score: 0,
    obfuscationDetected: false
  };
  
  // Normaliser le contenu pour la vérification
  let normalizedContent = content.toLowerCase();
  
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
  
  // Vérifier les catégories de contenu inapproprié
  const categories = Object.keys(INAPPROPRIATE_CONTENT_DICTIONARY) as InappropriateCategory[];
  let totalMatches = 0;
  
  for (const category of categories) {
    const keywords = INAPPROPRIATE_CONTENT_DICTIONARY[category];
    const categoryMatches: string[] = [];
    
    for (const keyword of keywords) {
      if (normalizedContent.includes(keyword)) {
        categoryMatches.push(keyword);
        if (!result.matches.includes(keyword)) {
          result.matches.push(keyword);
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
    const categoryWeight = 0.4;  // Poids des catégories
    const matchesWeight = 0.4;   // Poids des correspondances
    const obfuscationWeight = 0.2; // Poids de l'obfuscation
    
    const categoryScore = Math.min(1, result.categories.length / 3) * categoryWeight;
    const matchesScore = Math.min(1, totalMatches / 5) * matchesWeight;
    const obfuscationScore = result.obfuscationDetected ? obfuscationWeight : 0;
    
    result.score = parseFloat((categoryScore + matchesScore + obfuscationScore).toFixed(2));
    result.isInappropriate = result.score > 0.2; // Seuil de détection
  }
  
  return result;
}

/**
 * Vérifier si une section répond aux exigences minimales
 */
export function validateSectionLength(section: DescriptionSection, content: string): ValidationResult {
  const { min, max } = SECTION_LIMITS[section];
  const length = content.trim().length;
  
  // Section vide mais qui n'est pas "intro" (intro peut être vide)
  if (length === 0 && section !== 'intro') {
    return {
      isValid: false,
      error: `La section ${formatSectionName(section)} est obligatoire`
    };
  }
  
  // Si la section est remplie mais trop courte
  if (length > 0 && length < min) {
    return {
      isValid: false,
      error: `La section ${formatSectionName(section)} doit contenir au moins ${min} caractères (actuellement ${length})`
    };
  }
  
  // Si la section est trop longue
  if (length > max) {
    return {
      isValid: false,
      error: `La section ${formatSectionName(section)} ne doit pas dépasser ${max} caractères (actuellement ${length})`
    };
  }
  
  // Vérifier le contenu inapproprié
  const contentResult = detectInappropriateContent(content);
  if (contentResult.isInappropriate) {
    let message = `La section ${formatSectionName(section)} contient du contenu inapproprié`;
    
    // Ajouter des détails si disponibles
    if (contentResult.categories.length > 0) {
      message += ` (catégories: ${contentResult.categories.join(', ')})`;
    }
    
    return {
      isValid: false,
      error: message
    };
  }
  
  return { isValid: true, error: null };
}

/**
 * Valider toutes les sections du service
 */
export function validateAllSections(fields: DescriptionFields): ValidationResult {
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
    case 'intro': return 'Introduction';
    case 'service': return 'Description du service';
    case 'deliverables': return 'Ce que vous obtiendrez';
    case 'requirements': return 'Ce dont j\'ai besoin de vous';
    case 'timing': return 'Délais et révisions';
    case 'exclusions': return 'Ce qui n\'est pas inclus';
    default: return section;
  }
} 