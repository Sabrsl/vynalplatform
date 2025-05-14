/**
 * Constantes liées aux devises et taux de change utilisés dans l'application
 */

export const CURRENCY = {
  /**
   * La devise principale de l'application est le Franc CFA (XOF)
   * Tous les prix en base de données sont stockés en FCFA
   */
  primary: 'XOF',
  
  /**
   * Symbole du Franc CFA
   */
  primarySymbol: '₣',
  
  /**
   * Locale par défaut pour le formatage des montants
   * 'fr-FR' est utilisé pour le formatage des montants en zone FCFA
   */
  locale: 'fr-FR',
  
  /**
   * Taux de conversion des devises principales vers le FCFA (XOF)
   * Ces taux sont statiques et devraient être mis à jour régulièrement
   * Pour les applications réelles, utilisez une API comme Open Exchange Rates
   */
  rates: {
    // Taux fixes pour la zone CFA
    XOF: 1, // 1 FCFA = 1 FCFA (base)
    XAF: 1, // 1 FCFA ≈ 1 FCFA (CFA d'Afrique Centrale)
    
    // Zone Euro (taux fixe avec le FCFA)
    EUR: 0.0015, // 1 FCFA ≈ 0.0015 EUR (taux fixe)
    
    // Autres devises majeures (taux approximatifs à titre d'exemple)
    USD: 0.0017, // 1 FCFA ≈ 0.0017 USD
    GBP: 0.0013, // 1 FCFA ≈ 0.0013 GBP
    CHF: 0.0015, // 1 FCFA ≈ 0.0015 CHF
    CAD: 0.0023, // 1 FCFA ≈ 0.0023 CAD
    
    // Devises africaines
    MAD: 0.016,  // 1 FCFA ≈ 0.016 MAD (Dirham marocain)
    DZD: 0.23,   // 1 FCFA ≈ 0.23 DZD (Dinar algérien)
    TND: 0.0053, // 1 FCFA ≈ 0.0053 TND (Dinar tunisien)
    EGP: 0.088,  // 1 FCFA ≈ 0.088 EGP (Livre égyptienne)
    NGN: 2.78,   // 1 FCFA ≈ 2.78 NGN (Naira nigérian)
    RWF: 2.49,   // 1 FCFA ≈ 2.49 RWF (Franc rwandais)
    GHS: 0.026,  // 1 FCFA ≈ 0.026 GHS (Cedi ghanéen)
    KES: 0.22,   // 1 FCFA ≈ 0.22 KES (Shilling kényan)
    ZAR: 0.031,  // 1 FCFA ≈ 0.031 ZAR (Rand sud-africain)
    
    // Autres devises mondiales
    JPY: 0.26,   // 1 FCFA ≈ 0.26 JPY (Yen japonais)
    CNY: 0.012,  // 1 FCFA ≈ 0.012 CNY (Yuan chinois)
    INR: 0.14,   // 1 FCFA ≈ 0.14 INR (Roupie indienne)
    AUD: 0.0025, // 1 FCFA ≈ 0.0025 AUD (Dollar australien)
    BRL: 0.0095, // 1 FCFA ≈ 0.0095 BRL (Real brésilien)
  },
  
  /**
   * Informations détaillées sur les devises supportées
   */
  info: {
    XOF: { name: 'Franc CFA UEMOA', symbol: '₣', decimals: 0 },
    XAF: { name: 'Franc CFA CEMAC', symbol: '₣', decimals: 0 },
    EUR: { name: 'Euro', symbol: '€', decimals: 2 },
    USD: { name: 'Dollar américain', symbol: '$', decimals: 2 },
    GBP: { name: 'Livre sterling', symbol: '£', decimals: 2 },
    MAD: { name: 'Dirham marocain', symbol: 'DH', decimals: 2 },
    NGN: { name: 'Naira nigérian', symbol: '₦', decimals: 2 },
    DZD: { name: 'Dinar algérien', symbol: 'DA', decimals: 2 },
    TND: { name: 'Dinar tunisien', symbol: 'DT', decimals: 3 },
    EGP: { name: 'Livre égyptienne', symbol: 'ج.م', decimals: 2 },
    // Autres devises...
  },
  
  /**
   * Pays utilisant le Franc CFA de l'UEMOA (XOF)
   */
  xofCountries: ['SN', 'BJ', 'BF', 'CI', 'GW', 'ML', 'NE', 'TG'],
  
  /**
   * Pays utilisant le Franc CFA de la CEMAC (XAF)
   */
  xafCountries: ['CM', 'CF', 'TD', 'CG', 'GA', 'GQ'],
  
  /**
   * Pays de la zone Euro
   */
  euroCountries: ['FR', 'DE', 'IT', 'ES', 'PT', 'BE', 'LU', 'NL', 'AT', 'FI', 'IE', 'GR', 'EE', 'LV', 'LT', 'SI', 'SK', 'CY', 'MT'],
};

/**
 * Table de correspondance des pays vers devises (ISO 3166-1 alpha-2 vers code de devise)
 */
export const COUNTRY_TO_CURRENCY: Record<string, string> = {
  // Zone Franc CFA UEMOA (XOF)
  'SN': 'XOF', // Sénégal
  'BJ': 'XOF', // Bénin
  'BF': 'XOF', // Burkina Faso
  'CI': 'XOF', // Côte d'Ivoire
  'GW': 'XOF', // Guinée-Bissau
  'ML': 'XOF', // Mali
  'NE': 'XOF', // Niger
  'TG': 'XOF', // Togo
  
  // Zone Franc CFA CEMAC (XAF)
  'CM': 'XAF', // Cameroun
  'CF': 'XAF', // République centrafricaine
  'TD': 'XAF', // Tchad
  'CG': 'XAF', // République du Congo
  'GA': 'XAF', // Gabon
  'GQ': 'XAF', // Guinée équatoriale
  
  // Zone Euro
  'FR': 'EUR', // France
  'DE': 'EUR', // Allemagne
  'IT': 'EUR', // Italie
  'ES': 'EUR', // Espagne
  'PT': 'EUR', // Portugal
  'BE': 'EUR', // Belgique
  
  // Autres pays africains
  'MA': 'MAD', // Maroc
  'DZ': 'DZD', // Algérie
  'TN': 'TND', // Tunisie
  'EG': 'EGP', // Égypte
  'NG': 'NGN', // Nigeria
  'GH': 'GHS', // Ghana
  'KE': 'KES', // Kenya
  'ZA': 'ZAR', // Afrique du Sud
  'RW': 'RWF', // Rwanda
  
  // Autres pays majeurs
  'US': 'USD', // États-Unis
  'GB': 'GBP', // Royaume-Uni
  'CA': 'CAD', // Canada
  'JP': 'JPY', // Japon
  'CN': 'CNY', // Chine
  'IN': 'INR', // Inde
  'AU': 'AUD', // Australie
  'BR': 'BRL', // Brésil
  'CH': 'CHF', // Suisse
  
  // Par défaut: XOF
  'default': 'XOF',
};

/**
 * Fonction pour obtenir la devise à partir du code pays ISO
 */
export function getCurrencyFromCountry(countryCode: string): string {
  return COUNTRY_TO_CURRENCY[countryCode] || COUNTRY_TO_CURRENCY.default;
}