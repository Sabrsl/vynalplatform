/**
 * Constantes de l'application
 */

// Devise
export const CURRENCY = {
  code: 'XOF', // Franc CFA (BCEAO)
  symbol: 'FCFA',
  name: 'Franc CFA',
  locale: 'fr-FR',
  decimalPlaces: 0, // Pas de décimales pour le FCFA
}

// URLs de l'application
export const APP_URLS = {
  // URL de base utilisée pour les redirections
  baseUrl: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
  // URL de production (pour les redirections d'authentification)
  productionUrl: process.env.NEXT_PUBLIC_PRODUCTION_URL || 'https://nion-farr.vercel.app',
  // URL pour les redirections de callback d'authentification
  authCallbackUrl: '/auth/callback',
}

// Paramètres de l'application
export const APP_CONFIG = {
  siteName: 'NionFar.sn',
  tagline: 'La plateforme freelance #1 au Sénégal',
  contactEmail: 'contact@nionfar.sn',
  socialMedia: {
    facebook: 'https://facebook.com/nionfarsenegal',
    twitter: 'https://twitter.com/nionfarsenegal',
    instagram: 'https://instagram.com/nionfarsenegal',
  }
} 