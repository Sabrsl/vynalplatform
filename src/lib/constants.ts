/**
 * Constantes de l'application
 */

// Devise
export const CURRENCY = {
  code: "XOF", // Franc CFA (BCEAO)
  symbol: "FCFA",
  name: "Franc CFA",
  locale: "fr-FR",
  decimalPlaces: 0, // Pas de décimales pour le FCFA
};

// URLs de l'application
export const APP_URLS = {
  // URL de base utilisée pour les redirections
  baseUrl:
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://vynalplatform.com",
  // URL de production (pour les redirections d'authentification)
  productionUrl:
    process.env.NEXT_PUBLIC_PRODUCTION_URL || "https://vynalplatform.com",
  // URL pour les redirections de callback d'authentification
  authCallbackUrl: "/auth/callback",
};

// Paramètres de l'application
export const APP_CONFIG = {
  siteName: "Vynal Platform",
  tagline: "La plateforme freelance #1 au Sénégal",
  contactEmail: "support@vynalplatform.com",
  socialMedia: {
    facebook: "https://facebook.com/vynalplatform",
    twitter: "https://twitter.com/vynalplatform",
    instagram: "https://instagram.com/vynalplatform",
  },
};
