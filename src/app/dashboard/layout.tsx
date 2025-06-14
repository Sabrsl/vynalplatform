"use client";

import { useState, useEffect, useCallback, memo, useMemo } from "react";
import { cn } from "@/lib/utils";
import {
  Home,
  MessageSquare,
  Settings,
  User,
  FileText,
  LogOut,
  ShoppingBag,
  PackageOpen,
  BarChart2,
  Award,
  HelpCircle,
  AlertTriangle,
  CreditCard,
  BookOpen,
  Loader,
  Menu
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useUserNotifications } from "@/hooks/useUserNotifications";
import NotificationBadge from "@/components/ui/notification-badge";
import { NavigationLoadingState } from "@/app/providers";
import { useUser } from "@/hooks/useUser";
import { FREELANCE_ROUTES, AUTH_ROUTES, CLIENT_ROUTES } from "@/config/routes";
import { listenToFreelanceCacheInvalidation } from "@/lib/optimizations/freelance-cache";
import Image from "next/image";
import { useTheme } from "next-themes";
import { useLogout } from "@/hooks/useLogout";
//@ts-ignore
import { useUnreadNotifications } from "@/hooks/useUnreadNotifications";

// Mémoriser les icônes par path pour éviter les re-créations
const NAV_ICONS = {
  [FREELANCE_ROUTES.DASHBOARD]: Home,
  [FREELANCE_ROUTES.ORDERS]: ShoppingBag,
  [FREELANCE_ROUTES.MESSAGES]: MessageSquare,
  [FREELANCE_ROUTES.DISPUTES]: AlertTriangle,
  [FREELANCE_ROUTES.WALLET]: CreditCard,
  [FREELANCE_ROUTES.SERVICES]: FileText,
  [FREELANCE_ROUTES.STATS]: BarChart2,
  [FREELANCE_ROUTES.CERTIFICATIONS]: Award,
  [FREELANCE_ROUTES.PROFILE]: User,
  [FREELANCE_ROUTES.SETTINGS]: Settings,
  [FREELANCE_ROUTES.HELP]: HelpCircle
};

// Composant memoïsé pour les éléments de navigation
const NavItem = memo(({ href, icon: Icon, label, badgeCount, onClick }: {
  href: string;
  icon: React.ComponentType<any>;
  label: string;
  badgeCount?: number;
  onClick: (e: React.MouseEvent<HTMLAnchorElement>, href: string) => void;
}) => {
  const pathname = usePathname();
  const isActive = pathname === href || pathname?.startsWith(`${href}/`);
  
  const handleClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    onClick(e, href);
  }, [onClick, href]);
  
  return (
    <Link 
      href={href}
      onClick={handleClick}
      className={cn(
        "flex items-center px-3 py-2 mb-1 rounded-md transition-colors relative group/navitem",
        isActive
          ? "text-vynal-purple-light bg-gradient-to-r from-vynal-purple-500/10 to-vynal-purple-600/5 dark:text-vynal-accent-primary dark:bg-gradient-to-r dark:from-vynal-purple-secondary/20 dark:to-vynal-purple-secondary/10"
          : "text-slate-600 hover:bg-slate-100 dark:text-vynal-text-secondary dark:hover:bg-vynal-purple-secondary/10 dark:hover:text-vynal-text-primary"
      )}
    >
      <div className="w-4 h-4 flex items-center justify-center">
        <Icon className={cn(
          "h-3.5 w-3.5 sm:h-4 sm:w-4",
          isActive ? "text-vynal-accent-primary" : "text-slate-400 group-hover/navitem:text-slate-700 dark:text-vynal-text-secondary dark:group-hover/navitem:text-vynal-text-primary"
        )} />
      </div>
      <span className="ml-2 text-[9px] sm:text-[10px] font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200 hidden group-hover:block">
        {label}
      </span>
      
      {badgeCount !== undefined && badgeCount > 0 && (
        <NotificationBadge count={badgeCount} className="absolute right-1 top-1" />
      )}
    </Link>
  );
});

NavItem.displayName = 'NavItem';

// Groupes de navigation memoïsés
const NavGroup = memo(({ title, children }: { title: string, children: React.ReactNode }) => (
  <div>
    <p className="px-2 text-[6px] sm:text-[7px] font-bold text-slate-400 uppercase mb-1 dark:text-vynal-text-secondary opacity-0 group-hover:opacity-100 transition-opacity duration-200 hidden group-hover:block">
      {title}
    </p>
    <div>{children}</div>
  </div>
));

NavGroup.displayName = 'NavGroup';

// Navigation principale memoïsée
const MainNavigation = memo(({ totalUnreadCount, handleNavClick, signOut }: { 
  totalUnreadCount: number,
  handleNavClick: (e: React.MouseEvent<HTMLAnchorElement>, href: string) => void,
  signOut: () => void
}) => (
  <nav className="space-y-5">
    {/* Éléments essentiels */}
    <NavGroup title="Principal">
      <NavItem href={FREELANCE_ROUTES.DASHBOARD} icon={NAV_ICONS[FREELANCE_ROUTES.DASHBOARD]} label="Tableau de bord" onClick={handleNavClick} />
      <NavItem href={FREELANCE_ROUTES.ORDERS} icon={NAV_ICONS[FREELANCE_ROUTES.ORDERS]} label="Commandes reçues" onClick={handleNavClick} />
      <NavItem href={FREELANCE_ROUTES.MESSAGES} icon={NAV_ICONS[FREELANCE_ROUTES.MESSAGES]} label="Messages" badgeCount={totalUnreadCount} onClick={handleNavClick} />
      <NavItem href={FREELANCE_ROUTES.DISPUTES} icon={NAV_ICONS[FREELANCE_ROUTES.DISPUTES]} label="Litiges" onClick={handleNavClick} />
      <NavItem href={FREELANCE_ROUTES.WALLET} icon={NAV_ICONS[FREELANCE_ROUTES.WALLET]} label="Paiements" onClick={handleNavClick} />
    </NavGroup>
    
    {/* Section pour Freelance uniquement */}
    <NavGroup title="Services">
      <NavItem href={FREELANCE_ROUTES.SERVICES} icon={NAV_ICONS[FREELANCE_ROUTES.SERVICES]} label="Mes services" onClick={handleNavClick} />
      {/* Temporairement désactivé
      <NavItem href={FREELANCE_ROUTES.STATS} icon={NAV_ICONS[FREELANCE_ROUTES.STATS]} label="Statistiques" onClick={handleNavClick} />
      <NavItem href={FREELANCE_ROUTES.CERTIFICATIONS} icon={NAV_ICONS[FREELANCE_ROUTES.CERTIFICATIONS]} label="Certifications" onClick={handleNavClick} />
      */}
    </NavGroup>
    
    {/* Section profil et configuration */}
    <NavGroup title="Paramètres">
      <NavItem href={FREELANCE_ROUTES.PROFILE} icon={NAV_ICONS[FREELANCE_ROUTES.PROFILE]} label="Mon profil" onClick={handleNavClick} />
      <NavItem href={FREELANCE_ROUTES.SETTINGS} icon={NAV_ICONS[FREELANCE_ROUTES.SETTINGS]} label="Paramètres" onClick={handleNavClick} />
    </NavGroup>
    
    {/* Aide et ressources */}
    <NavGroup title="Ressources">
      <NavItem href={FREELANCE_ROUTES.HELP} icon={NAV_ICONS[FREELANCE_ROUTES.HELP]} label="Aide" onClick={handleNavClick} />
    </NavGroup>
    
    {/* Bouton de déconnexion */}
    <div className="mt-6">
      <button
        onClick={signOut}
        className="flex items-center px-3 py-2 mb-1 rounded-md transition-colors text-red-500 hover:bg-slate-100 dark:text-red-400 dark:hover:bg-vynal-purple-secondary/10 w-full"
      >
        <div className="w-4 h-4 flex items-center justify-center">
          <LogOut className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-500 dark:text-red-400" />
        </div>
        <span className="ml-2 text-[9px] sm:text-[10px] font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200 hidden group-hover:block">
          Déconnexion
        </span>
      </button>
    </div>
  </nav>
));

MainNavigation.displayName = 'MainNavigation';

// Profil utilisateur memoïsé
const UserProfile = memo(({ user, signOut }: { 
  user: any; 
  signOut: () => void 
}) => (
  <div className="p-3">
    <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 hover:shadow-sm transition-all dark:bg-vynal-purple-dark/50 dark:border-vynal-purple-secondary/30">
      <div className="flex items-center">
        <div className="relative">
          <div className="w-5 h-5 rounded-md bg-gradient-to-br from-purple-600 to-violet-700 flex items-center justify-center text-white font-medium shadow-sm dark:from-vynal-accent-primary dark:to-vynal-accent-secondary dark:text-vynal-text-primary">
            {user?.user_metadata?.name ? user.user_metadata.name.charAt(0).toUpperCase() : ""}
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 w-1 h-1 bg-vynal-purple-500 rounded-full border border-white dark:bg-vynal-status-success dark:border-vynal-purple-dark"></div>
        </div>
        <div className="ml-2 flex-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 overflow-hidden">
          <p className="text-[8px] sm:text-[9px] font-medium text-slate-800 dark:text-vynal-text-primary">{user?.user_metadata?.name || "Utilisateur"}</p>
          <p className="text-[6px] sm:text-[7px] text-slate-500 truncate dark:text-vynal-text-secondary">{user?.email || ""}</p>
        </div>
        <button 
          onClick={signOut} 
          className="p-1 rounded-md text-slate-400 hover:text-red-500 hover:bg-slate-100 transition-colors dark:text-vynal-text-secondary dark:hover:text-vynal-status-error dark:hover:bg-vynal-purple-secondary/20"
        >
          <LogOut className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
        </button>
      </div>
    </div>
  </div>
));

UserProfile.displayName = 'UserProfile';

// Logo mémorisé
const Logo = memo(() => {
  const { isFreelance } = useUser();
  
  return (
    <div className="h-16 flex items-center px-4 border-b border-slate-100 dark:border-vynal-purple-secondary/20">
      <div className="flex items-center space-x-2">
        <div className="bg-gradient-to-br from-vynal-accent-primary to-vynal-accent-secondary h-5 w-5 rounded-lg flex items-center justify-center shadow-md shadow-vynal-accent-primary/20">
          <Image 
            src="/assets/logo/logo_vynal_platform_simple.svg" 
            alt="Vynal Platform Logo" 
            className="h-4 w-auto brightness-110 transition-all duration-300" 
            width={16}
            height={16}
            priority
            decoding="async"
          />
        </div>
        <div className="transition-opacity duration-200 overflow-hidden">
          <p className="text-[6px] sm:text-[7px] text-slate-500 dark:text-vynal-text-secondary font-medium">
            {isFreelance ? "Espace Freelance" : "Espace Client"}
          </p>
        </div>
      </div>
    </div>
  );
});

Logo.displayName = 'Logo';

// Composant principal optimisé
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { theme } = useTheme();
  const { logout } = useLogout();
  const [totalUnreadCount] = useUnreadNotifications();
  const { profile, isFreelance, loading: profileLoading } = useUser();
  const [isInitialized, setIsInitialized] = useState(false);
  const { activePath, isNavigating, setActivePath } = NavigationLoadingState;
  
  // Utiliser la fonction de déconnexion du hook useLogout qui appelle déjà la fonction centralisée
  const handleSignOut = useCallback(() => {
    logout();
  }, [logout]);

  // Gestionnaire unifié pour la navigation - Similaire à celui du client
  const handleNavClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    NavigationLoadingState.setIsNavigating(true);
    NavigationLoadingState.setActivePath(href);
    
    // Naviguer sans réinitialiser immédiatement le scroll
    router.push(href, { scroll: false });
    
    // Utiliser requestAnimationFrame pour réinitialiser la position après navigation
    requestAnimationFrame(() => {
      window.scrollTo(0, 0);
    });
  }, [router]);

  // Vérification d'authentification et de rôle - Similaire à celle du client
  useEffect(() => {
    if (authLoading || profileLoading) return;
    
    // Rediriger vers la connexion si non authentifié
    if (!user) {
      router.push("/auth/login");
      return;
    }
    
    // Rediriger vers le dashboard client si l'utilisateur est client
    if (profile && profile.role === 'client') {
      router.push(CLIENT_ROUTES.DASHBOARD);
      return;
    }
    
    // Initialiser l'état une fois l'utilisateur chargé et le rôle vérifié
    if (!isInitialized) {
      setIsInitialized(true);
    }
  }, [user, authLoading, profileLoading, router, isInitialized, profile]);

  useEffect(() => {
    setActivePath(pathname || "/dashboard");
  }, [pathname, setActivePath]);
  
  // Écouteur des invalidations de cache
  useEffect(() => {
    if (!user?.id) return;
    
    // Créer un handler pour les événements d'invalidation de cache
    const handleCacheInvalidation = () => {
      // Force rafraîchissement lors de l'invalidation
      window.dispatchEvent(new CustomEvent('vynal:navigation-end'));
    };
    
    const unsubscribe = listenToFreelanceCacheInvalidation(handleCacheInvalidation);
    return () => unsubscribe();
  }, [user?.id]);

  // Afficher un loader pendant le chargement
  if (authLoading || profileLoading || !isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-vynal-purple-dark">
        <div className="flex flex-col items-center gap-4">
          <div className="bg-gradient-to-br from-vynal-accent-primary to-vynal-accent-secondary h-8 w-8 rounded-lg flex items-center justify-center shadow-md">
            <span className="text-white font-bold text-sm">F</span>
          </div>
          <Loader className="h-8 w-8 animate-spin text-vynal-accent-primary" />
          <p className="text-sm text-vynal-purple-secondary dark:text-vynal-text-secondary">
            Chargement du tableau de bord...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-white dark:bg-vynal-purple-dark">
      {/* Sidebar responsive avec effet de hover sur desktop */}
      <aside className="group w-14 sm:w-16 hover:w-48 sm:hover:w-56 transition-all duration-300 ease-in-out bg-white shadow-md shadow-slate-200/50 hidden lg:flex lg:flex-col z-30 dark:bg-vynal-purple-dark dark:shadow-vynal-purple-secondary/10">
        <Logo />
        <div className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2 custom-scrollbar no-scrollbar">
          <MainNavigation 
            totalUnreadCount={totalUnreadCount} 
            handleNavClick={handleNavClick} 
            signOut={handleSignOut}
          />
        </div>
        <UserProfile user={user} signOut={handleSignOut} />
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Content */}
        <main className="flex-1 overflow-auto bg-slate-50/70 dark:bg-vynal-purple-dark/30 p-4">
          {children}
        </main>
      </div>
    </div>
  );
}