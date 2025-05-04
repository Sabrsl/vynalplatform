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
  BookOpen
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useUserNotifications } from "@/hooks/useUserNotifications";
import NotificationBadge from "@/components/ui/notification-badge";
import { NavigationLoadingState } from "@/app/providers";

// Mémoriser les icônes par path pour éviter les re-créations
const NAV_ICONS = {
  "/dashboard": Home,
  "/dashboard/orders": ShoppingBag,
  "/dashboard/messages": MessageSquare,
  "/dashboard/disputes": AlertTriangle,
  "/dashboard/wallet": CreditCard,
  "/dashboard/services": FileText,
  "/dashboard/stats": BarChart2,
  "/dashboard/certifications": Award,
  "/dashboard/profile": User,
  "/dashboard/settings": Settings,
  "/dashboard/help": HelpCircle
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
      <NavItem href="/dashboard" icon={NAV_ICONS["/dashboard"]} label="Tableau de bord" onClick={handleNavClick} />
      <NavItem href="/dashboard/orders" icon={NAV_ICONS["/dashboard/orders"]} label="Commandes reçues" onClick={handleNavClick} />
      <NavItem href="/dashboard/messages" icon={NAV_ICONS["/dashboard/messages"]} label="Messages" badgeCount={totalUnreadCount} onClick={handleNavClick} />
      <NavItem href="/dashboard/disputes" icon={NAV_ICONS["/dashboard/disputes"]} label="Litiges" onClick={handleNavClick} />
      <NavItem href="/dashboard/wallet" icon={NAV_ICONS["/dashboard/wallet"]} label="Paiements" onClick={handleNavClick} />
    </NavGroup>
    
    {/* Section pour Freelance uniquement */}
    <NavGroup title="Services">
      <NavItem href="/dashboard/services" icon={NAV_ICONS["/dashboard/services"]} label="Mes services" onClick={handleNavClick} />
      <NavItem href="/dashboard/stats" icon={NAV_ICONS["/dashboard/stats"]} label="Statistiques" onClick={handleNavClick} />
      <NavItem href="/dashboard/certifications" icon={NAV_ICONS["/dashboard/certifications"]} label="Certifications" onClick={handleNavClick} />
    </NavGroup>
    
    {/* Section profil et configuration */}
    <NavGroup title="Paramètres">
      <NavItem href="/dashboard/profile" icon={NAV_ICONS["/dashboard/profile"]} label="Mon profil" onClick={handleNavClick} />
      <NavItem href="/dashboard/settings" icon={NAV_ICONS["/dashboard/settings"]} label="Paramètres" onClick={handleNavClick} />
    </NavGroup>
    
    {/* Aide et ressources */}
    <NavGroup title="Ressources">
      <NavItem href="/dashboard/help" icon={NAV_ICONS["/dashboard/help"]} label="Aide" onClick={handleNavClick} />
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
const Logo = memo(() => (
  <div className="h-16 flex items-center px-4 border-b border-slate-100 dark:border-vynal-purple-secondary/20">
    <div className="flex items-center space-x-2">
      <div className="bg-gradient-to-br from-purple-600 to-violet-700 h-5 w-5 rounded-lg flex items-center justify-center shadow-md shadow-purple-200/40 dark:from-vynal-accent-primary dark:to-vynal-accent-secondary dark:shadow-vynal-accent-primary/20">
        <span className="text-white font-bold text-[10px] dark:text-vynal-text-primary">VY</span>
      </div>
      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 overflow-hidden">
        <h1 className="text-[10px] sm:text-xs font-bold bg-gradient-to-r from-purple-600 to-violet-700 bg-clip-text text-transparent dark:from-vynal-accent-primary dark:to-vynal-accent-secondary">VY</h1>
        <p className="text-[6px] sm:text-[7px] text-slate-500 dark:text-vynal-text-secondary">Espace Freelance</p>
      </div>
    </div>
  </div>
));

Logo.displayName = 'Logo';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  
  // Notifications non lues - optimisé
  const { totalUnreadCount, refresh: refreshNotifications } = useUserNotifications(user?.id);

  // Gestionnaire unifié pour la navigation
  const handleNavClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    NavigationLoadingState.setIsNavigating(true);
    NavigationLoadingState.setActivePath(href);
    
    // Naviguer sans réinitialiser immédiatement le scroll
    router.push(href, { scroll: false });
    
    // Utiliser un court délai pour réinitialiser la position après navigation
    requestAnimationFrame(() => {
      window.scrollTo(0, 0);
    });
  }, [router]);

  // Détection de visibilité d'onglet pour rafraîchir les notifications
  useEffect(() => {
    // Ne rien faire si l'utilisateur n'est pas connecté
    if (!user?.id) return;
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshNotifications();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user?.id, refreshNotifications]);

  // Redirection si non connecté - optimisé
  useEffect(() => {
    if (loading) return;
    
    if (!user) {
      router.push("/auth/login");
    }
  }, [loading, user, router]);

  // Mettre à jour le chemin actif dans l'état global - une seule fois au chargement
  useEffect(() => {
    NavigationLoadingState.setActivePath(pathname || "/dashboard");
  }, [pathname]);

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50/70 dark:bg-vynal-purple-dark/30">
      {/* Sidebar - Desktop avec effet de survol - Cachée sur mobile */}
      <aside className="group w-10 sm:w-12 hover:w-48 sm:hover:w-56 transition-all duration-300 ease-in-out bg-white shadow-md shadow-slate-200/50 hidden md:flex md:flex-col z-30 dark:bg-vynal-purple-dark dark:shadow-vynal-purple-secondary/10">
        <Logo />
        
        <div className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2 custom-scrollbar no-scrollbar">
          <MainNavigation 
            totalUnreadCount={totalUnreadCount}
            handleNavClick={handleNavClick}
            signOut={signOut}
          />
        </div>
        
        <UserProfile user={user} signOut={signOut} />
      </aside>
      
      {/* Contenu principal */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
        {/* Suppression complète du header mobile */}
        {/* Contenu de la page */}
        <div className="p-4">
          {children}
        </div>
      </main>
    </div>
  );
}