/**
 * Configuration des tableaux de bord
 * 
 * Ce fichier centralise les configurations des tableaux de bord freelance et client,
 * permettant une séparation claire des fonctionnalités et routes tout en maintenant
 * une structure cohérente.
 */

import { CACHE_EXPIRY } from '@/lib/optimizations/cache';

// Types pour les configurations de dashboard
export type DashboardRoutes = Record<string, string>;
export type NavigationItem = { label: string, path: string, icon: string };
export type NavigationGroup = Record<string, NavigationItem[]>;
export type CacheConfig = {
  keyPrefix: string,
  expiry: {
    stats: number,
    activities: number
  }
};

export interface DashboardConfig {
  routes: DashboardRoutes;
  navigation: NavigationGroup;
  cache: CacheConfig;
}

// Configuration du tableau de bord freelance
export const freelanceDashboardConfig: DashboardConfig = {
  // Routes principales
  routes: {
    home: '/dashboard',
    orders: '/dashboard/orders',
    messages: '/dashboard/messages',
    disputes: '/dashboard/disputes',
    wallet: '/dashboard/wallet',
    services: '/dashboard/services',
    profile: '/dashboard/profile',
    settings: '/dashboard/settings',
    certifications: '/dashboard/certifications',
    stats: '/dashboard/stats',
  },
  
  // Catégories de navigation
  navigation: {
    main: [
      { label: 'Tableau de bord', path: '/dashboard', icon: 'Home' },
      { label: 'Commandes reçues', path: '/dashboard/orders', icon: 'ShoppingBag' },
      { label: 'Messages', path: '/dashboard/messages', icon: 'MessageSquare' },
      { label: 'Litiges', path: '/dashboard/disputes', icon: 'AlertTriangle' },
      { label: 'Paiements', path: '/dashboard/wallet', icon: 'CreditCard' },
    ],
    services: [
      { label: 'Mes services', path: '/dashboard/services', icon: 'FileText' },
      { label: 'Livrer un travail', path: '/dashboard/orders/delivery', icon: 'PackageOpen' },
      { label: 'Statistiques', path: '/dashboard/stats', icon: 'BarChart2' },
      { label: 'Certifications', path: '/dashboard/certifications', icon: 'Award' },
    ],
    settings: [
      { label: 'Mon profil', path: '/dashboard/profile', icon: 'User' },
      { label: 'Ressources', path: '/how-it-works', icon: 'BookOpen' },
      { label: 'Support', path: '/contact', icon: 'HelpCircle' },
      { label: 'Paramètres', path: '/dashboard/settings', icon: 'Settings' },
    ]
  },
  
  // Configuration du cache
  cache: {
    keyPrefix: 'freelance_dashboard_',
    expiry: {
      stats: CACHE_EXPIRY.DASHBOARD_DATA,
      activities: CACHE_EXPIRY.DASHBOARD_DATA
    }
  }
};

// Configuration du tableau de bord client
export const clientDashboardConfig: DashboardConfig = {
  // Routes principales
  routes: {
    home: '/client-dashboard',
    orders: '/client-dashboard/orders',
    orderDetails: '/client-dashboard/orders/:id',
    messages: '/client-dashboard/messages',
    disputes: '/client-dashboard/disputes',
    payments: '/client-dashboard/payments',
    profile: '/client-dashboard/profile',
    settings: '/client-dashboard/settings',
  },
  
  // Catégories de navigation
  navigation: {
    main: [
      { label: 'Tableau de bord', path: '/client-dashboard', icon: 'Home' },
      { label: 'Mes commandes', path: '/client-dashboard/orders', icon: 'ShoppingBag' },
      { label: 'Messages', path: '/client-dashboard/messages', icon: 'MessageSquare' },
      { label: 'Litiges', path: '/client-dashboard/disputes', icon: 'AlertTriangle' },
      { label: 'Paiements', path: '/client-dashboard/payments', icon: 'CreditCard' },
    ],
    actions: [
      { label: 'Trouver un service', path: '/services', icon: 'FileText' },
    ],
    settings: [
      { label: 'Mon profil', path: '/client-dashboard/profile', icon: 'User' },
      { label: 'Ressources', path: '/how-it-works', icon: 'BookOpen' },
      { label: 'Support', path: '/contact', icon: 'HelpCircle' },
      { label: 'Paramètres', path: '/client-dashboard/settings', icon: 'Settings' },
    ]
  },
  
  // Configuration du cache
  cache: {
    keyPrefix: 'client_dashboard_',
    expiry: {
      stats: CACHE_EXPIRY.DASHBOARD_DATA,
      activities: CACHE_EXPIRY.DASHBOARD_DATA
    }
  }
};

// Fonctions utilitaires pour la gestion des dashboards

/**
 * Retourne la configuration du dashboard en fonction du rôle utilisateur
 */
export function getDashboardConfig(isClient: boolean): DashboardConfig {
  return isClient ? clientDashboardConfig : freelanceDashboardConfig;
}

/**
 * Vérifie si un chemin appartient au dashboard freelance
 */
export function isFreelanceDashboardPath(path: string): boolean {
  return path.startsWith('/dashboard');
}

/**
 * Vérifie si un chemin appartient au dashboard client
 */
export function isClientDashboardPath(path: string): boolean {
  return path.startsWith('/client-dashboard');
}

/**
 * Vérifie si un chemin appartient au dashboard d'un type spécifique
 */
export function isDashboardPath(path: string, isClient: boolean): boolean {
  return isClient ? isClientDashboardPath(path) : isFreelanceDashboardPath(path);
}

/**
 * Génère l'URL de redirection appropriée en fonction du rôle utilisateur
 */
export function getRedirectUrl(isClient: boolean): string {
  return getDashboardHomeUrl(isClient);
}

/**
 * Génère l'URL correcte du dashboard en fonction du rôle utilisateur
 */
export function getDashboardHomeUrl(isClient: boolean): string {
  return isClient ? clientDashboardConfig.routes.home : freelanceDashboardConfig.routes.home;
} 