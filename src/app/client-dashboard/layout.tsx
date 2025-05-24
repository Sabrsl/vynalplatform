"use client";

import { useState, useEffect, useCallback, memo } from "react";
import { cn } from "@/lib/utils";
import {
  Home,
  MessageSquare,
  Settings,
  User,
  FileText,
  LogOut,
  Menu,
  ShoppingBag,
  AlertTriangle,
  CreditCard,
  HelpCircle,
  BookOpen,
  Loader
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import MobileMenu from "@/components/MobileMenu";
import { useUserNotifications } from "@/hooks/useUserNotifications";
import NotificationBadge from "@/components/ui/notification-badge";
import { NavigationLoadingState } from "@/app/providers";
import { ClientDashboardPageSkeleton } from "@/components/skeletons/ClientDashboardPageSkeleton";
import { useUser } from "@/hooks/useUser";
import { supabase } from "@/lib/supabase/client";
import { 
  invalidateClientOrders, 
  invalidateClientStats, 
  invalidateAllClientCache 
} from "@/lib/optimizations/client-cache";
import Image from "next/image";

interface NavItemProps {
  href: string;
  icon: React.ComponentType<any>;
  label: string;
  badgeCount?: number;
  onClick: (e: React.MouseEvent<HTMLAnchorElement>, href: string) => void;
}

const NavItem = memo(({ href, icon: Icon, label, badgeCount, onClick }: NavItemProps) => {
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

// Logo mémorisé
const Logo = memo(() => (
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
        />
      </div>
      <div className="transition-opacity duration-200 overflow-hidden">
        <p className="text-[6px] sm:text-[7px] text-slate-500 dark:text-vynal-text-secondary font-medium">
          Espace Client
        </p>
      </div>
    </div>
  </div>
));

Logo.displayName = 'Logo';

// Layout optimisé pour le tableau de bord client
export default function ClientDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const { profile, isClient, isFreelance, loading: profileLoading } = useUser();
  const [isInitialized, setIsInitialized] = useState(false);
  const pathname = usePathname();
  const { activePath, isNavigating, setActivePath } = NavigationLoadingState;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Notifications non lues
  const { totalUnreadCount } = useUserNotifications(user?.id);

  // Gestionnaire unifié pour la navigation
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

  // Vérification d'authentification
  useEffect(() => {
    if (loading || profileLoading) return;
    
    // Rediriger vers la connexion si non authentifié
    if (!user) {
      router.push("/auth/login");
      return;
    }
    
    // Initialiser l'état une fois l'utilisateur chargé
    if (!isInitialized) {
      setIsInitialized(true);
    }
  }, [user, loading, profileLoading, router, isInitialized]);

  useEffect(() => {
    setActivePath(pathname || "/client-dashboard");
  }, [pathname, setActivePath]);

  // Écouter les changements de base de données qui affectent nos caches
  useEffect(() => {
    if (!user?.id || typeof window === 'undefined') return;
    
    console.log("[ClientDashboard] Mise en place des écouteurs de BDD pour la mise à jour du cache");
    
    // Abonnement aux changements dans les commandes de l'utilisateur
    const ordersSubscription = supabase
      .channel('client-orders-changes')
      .on('postgres_changes', {
        event: '*', // Tout type d'événement
        schema: 'public',
        table: 'orders',
        filter: `client_id=eq.${user.id}`
      }, () => {
        console.log("[ClientDashboard] Changement détecté dans les commandes, invalidation du cache");
        invalidateClientOrders(user.id);
      })
      .subscribe();
      
    // Abonnement aux changements dans les messages non lus
    const messagesSubscription = supabase
      .channel('client-messages-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'messages',
        filter: `recipient_id=eq.${user.id}`
      }, () => {
        console.log("[ClientDashboard] Changement détecté dans les messages, invalidation du cache des statistiques");
        invalidateClientStats(user.id);
      })
      .subscribe();
      
    // Abonnement aux changements dans les profils
    const profilesSubscription = supabase
      .channel('client-profiles-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'profiles',
        filter: `id=eq.${user.id}`
      }, () => {
        console.log("[ClientDashboard] Changement détecté dans le profil, invalidation des caches associés");
        invalidateAllClientCache(user.id);
      })
      .subscribe();
      
    // Nettoyer les abonnements lors du démontage
    return () => {
      ordersSubscription.unsubscribe();
      messagesSubscription.unsubscribe();
      profilesSubscription.unsubscribe();
    };
  }, [user?.id]);

  // Afficher un loader pendant le chargement
  if (loading || profileLoading || !isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-vynal-purple-dark">
        <div className="flex flex-col items-center gap-4">
          <div className="bg-gradient-to-br from-vynal-accent-primary to-vynal-accent-secondary h-8 w-8 rounded-lg flex items-center justify-center shadow-md">
            <span className="text-white font-bold text-sm">C</span>
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
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50/70 dark:bg-vynal-purple-dark/30">
      {/* Sidebar - Desktop with hover effect */}
      <aside className="group w-10 sm:w-12 hover:w-48 sm:hover:w-56 transition-all duration-300 ease-in-out bg-white shadow-md shadow-slate-200/50 hidden md:flex md:flex-col z-30 dark:bg-vynal-purple-dark dark:shadow-vynal-purple-secondary/10">
        <Logo />
        
        <div className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2 custom-scrollbar no-scrollbar">
          <nav className="space-y-5">
            {/* Éléments essentiels */}
            <NavGroup title="Principal">
              <NavItem href="/client-dashboard" icon={Home} label="Tableau de bord" onClick={handleNavClick} />
              <NavItem href="/client-dashboard/orders" icon={ShoppingBag} label="Mes commandes" onClick={handleNavClick} />
              <NavItem 
                href="/client-dashboard/messages" 
                icon={MessageSquare} 
                label="Messages" 
                badgeCount={totalUnreadCount}
                onClick={handleNavClick}
              />
              <NavItem href="/client-dashboard/disputes" icon={AlertTriangle} label="Litiges" onClick={handleNavClick} />
              <NavItem href="/client-dashboard/payments" icon={CreditCard} label="Paiements" onClick={handleNavClick} />
            </NavGroup>
            
            {/* Section Actions Client */}
            <NavGroup title="Actions">
              <NavItem href="/services" icon={FileText} label="Trouver un service" onClick={handleNavClick} />
            </NavGroup>
            
            {/* Section profil et configuration */}
            <NavGroup title="Paramètres">
              <NavItem href="/client-dashboard/profile" icon={User} label="Mon profil" onClick={handleNavClick} />
              <NavItem href="/how-it-works" icon={BookOpen} label="Ressources" onClick={handleNavClick} />
              <NavItem href="/contact" icon={HelpCircle} label="Support" onClick={handleNavClick} />
              <NavItem href="/client-dashboard/settings" icon={Settings} label="Paramètres" onClick={handleNavClick} />
            </NavGroup>
          </nav>
        </div>

        {/* User Profile Section */}
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
                onClick={() => signOut()} 
                className="p-1 rounded-md text-slate-400 hover:text-red-500 hover:bg-slate-100 transition-colors dark:text-vynal-text-secondary dark:hover:text-vynal-status-error dark:hover:bg-vynal-purple-secondary/20"
              >
                <LogOut className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex-1 min-w-0">
        {children}
      </div>
    </div>
  );
} 