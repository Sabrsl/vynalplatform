/**
 * Constantes pour les routes de l'application
 * Cela permet d'éviter les erreurs de typo et facilite la maintenance
 */

// Routes pour le tableau de bord freelance
export const FREELANCE_ROUTES = {
  DASHBOARD: "/dashboard",
  ORDERS: "/dashboard/orders",
  MESSAGES: "/dashboard/messages",
  DISPUTES: "/dashboard/disputes",
  WALLET: "/dashboard/wallet",
  SERVICES: "/dashboard/services",
  STATS: "/dashboard/stats",
  CERTIFICATIONS: "/dashboard/certifications",
  PROFILE: "/dashboard/profile",
  SETTINGS: "/dashboard/settings",
  HELP: "/dashboard/help",
  WITHDRAW: "/dashboard/wallet/withdraw"
};

// Routes pour le tableau de bord client
export const CLIENT_ROUTES = {
  DASHBOARD: "/client-dashboard",
  ORDERS: "/client-dashboard/orders",
  MESSAGES: "/client-dashboard/messages",
  DISPUTES: "/client-dashboard/disputes",
  PAYMENTS: "/client-dashboard/payments",
  PROFILE: "/client-dashboard/profile",
  SETTINGS: "/client-dashboard/settings"
};

// Routes d'authentification
export const AUTH_ROUTES = {
  LOGIN: "/auth/login",
  REGISTER: "/auth/signup",
  FORGOT_PASSWORD: "/auth/forgot-password",
  RESET_PASSWORD: "/auth/reset-password",
  VERIFY_EMAIL: "/auth/verify-email"
};

// Routes publiques
export const PUBLIC_ROUTES = {
  HOME: "/",
  SERVICES: "/services",
  FREELANCERS: "/freelancers",
  ABOUT: "/about",
  CONTACT: "/contact",
  HOW_IT_WORKS: "/how-it-works",
  FAQ: "/faq",
  PRIVACY_POLICY: "/privacy-policy",
  TERMS_OF_SERVICE: "/terms-of-service",
  CODE_OF_CONDUCT: "/code-of-conduct"
}; 