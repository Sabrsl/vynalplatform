"use client";

import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { 
  User, Settings, FileText, ShoppingBag, MessageSquare, Home, 
  Calendar, CreditCard, BarChart2, BookOpen, Award, HelpCircle,
  Menu, X, ChevronRight, LogOut, Bell, Search, Wallet, RefreshCw, PackageOpen, AlertTriangle, Users, ShieldCheck, Loader
} from "lucide-react";
import MobileMenu from "@/components/MobileMenu";
import { cn } from "@/lib/utils";
import useTotalUnreadMessages from "@/hooks/useTotalUnreadMessages";
import NotificationBadge from "@/components/ui/notification-badge";
import { NavigationLoadingState } from "@/app/providers";

interface NavItemProps {
  href: string;
  icon: React.ElementType;
  label: string;
  badgeCount?: number;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activePath, setActivePath] = useState("");
  const { totalUnreadCount } = useTotalUnreadMessages();
  const [isNavigating, setIsNavigating] = useState(false);
  const previousPathnameRef = useRef<string | null>(null);
  
  // Détecter les changements de route pour la navigation
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setActivePath(pathname || '');
      previousPathnameRef.current = pathname;
      
      // Gestion des changements de route pour maintenir activePath à jour
      const handleRouteChange = () => {
        setActivePath(window.location.pathname);
      };
      
      window.addEventListener('popstate', handleRouteChange);
      return () => window.removeEventListener('popstate', handleRouteChange);
    }
  }, [pathname]);

  // Écouter les changements d'état de navigation
  useEffect(() => {
    const handleNavigationStateChange = (event: Event) => {
      const customEvent = event as CustomEvent;
      setIsNavigating(customEvent.detail?.isNavigating || false);
    };
    
    window.addEventListener('vynal:navigation-state-changed', handleNavigationStateChange);
    
    return () => {
      window.removeEventListener('vynal:navigation-state-changed', handleNavigationStateChange);
    };
  }, []);

  // Forcer l'invalidation du cache lors des changements de route
  useEffect(() => {
    if (previousPathnameRef.current && previousPathnameRef.current !== pathname) {
      // Émission de l'événement d'invalidation du cache
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('vynal:cache-invalidated', {
          detail: { 
            fromPath: previousPathnameRef.current,
            toPath: pathname
          }
        }));
      }
      
      // Mettre à jour la référence
      previousPathnameRef.current = pathname;
    }
  }, [pathname]);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login");
    }
  }, [user, loading, router]);

  // Mettre à jour l'état activePath quand le pathname change
  useEffect(() => {
    if (pathname) {
      setActivePath(pathname);
    }
  }, [pathname]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 dark:from-vynal-purple-dark dark:to-vynal-purple-darkest">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent dark:border-vynal-accent-primary dark:border-t-transparent rounded-full animate-spin"></div>
          <div className="absolute top-0 left-0 w-16 h-16 border-4 border-indigo-300 border-b-transparent dark:border-vynal-accent-secondary/40 dark:border-b-transparent rounded-full animate-pulse opacity-40"></div>
        </div>
      </div>
    );
  }

  const isActive = (path: string) => {
    // Vérifier si le chemin correspond exactement ou s'il s'agit d'un sous-chemin
    if (path === '/dashboard' && pathname === '/dashboard') {
      return true;
    }
    
    // Pour les autres routes, vérifier si le pathname commence par le path
    // mais s'assurer que c'est un sous-chemin complet (pour éviter les correspondances partielles)
    if (path !== '/dashboard' && pathname && pathname.startsWith(path)) {
      // Si le pathname est exactement égal au path ou suivi par un slash
      return pathname === path || pathname.startsWith(`${path}/`);
    }
    
    return false;
  };

  // Navigation avec indicateur de chargement et gestion du cache
  const handleNavigation = (href: string) => {
    // Prévenir les navigations redondantes ou pendant un chargement
    if (href === activePath || isNavigating) {
      return;
    }
    
    try {
      // Vérifier que la route est valide (basique)
      if (!href || typeof href !== 'string' || href.trim() === '') {
        console.error("URL de navigation invalide:", href);
        return;
      }
      
      // Définir l'état de navigation avant la navigation réelle
      NavigationLoadingState.setIsNavigating(true);
      
      // Stocker l'ancien chemin avant la navigation
      const oldPath = activePath;
      
      // Mettre à jour le chemin actif immédiatement pour l'UI
      setActivePath(href);
      
      // Ajouter un délai pour éviter les cascades de navigation
      const navigationTimeout = setTimeout(() => {
        // Utiliser try/catch pour capturer les erreurs de navigation
        try {
          // Déclencher la navigation de manière sécurisée
          router.push(href);
          
          // Émettre un événement pour invalider le cache si nécessaire
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('vynal:cache-invalidated', {
              detail: { 
                fromPath: oldPath,
                toPath: href
              }
            }));
          }
        } catch (navErr) {
          console.error("Erreur lors de la navigation:", navErr);
          // Réinitialiser l'état en cas d'erreur
          NavigationLoadingState.setIsNavigating(false);
          setActivePath(oldPath);
        }
        
        // Sécurité: force la fin de l'état de navigation après un certain temps
        const safetyTimeout = setTimeout(() => {
          if (NavigationLoadingState.isNavigating) {
            NavigationLoadingState.setIsNavigating(false);
          }
        }, 5000); // 5 secondes max pour la navigation
        
        // Nettoyer le timeout de sécurité si le composant est démonté
        return () => clearTimeout(safetyTimeout);
      }, 100); // Court délai pour permettre aux états de se mettre à jour
      
      // Nettoyer le timeout de navigation si le composant est démonté
      return () => clearTimeout(navigationTimeout);
    } catch (err) {
      console.error("Erreur de préparation de navigation:", err);
      NavigationLoadingState.setIsNavigating(false);
    }
  };

  const NavItem = ({ href, icon: Icon, label, badgeCount }: NavItemProps) => (
    <div
      onClick={() => handleNavigation(href)}
      className={`flex items-center justify-between my-0.5 transition-all duration-200 rounded-lg cursor-pointer ${
        isActive(href)
          ? "bg-gradient-to-r from-purple-600 to-violet-700 text-white dark:from-vynal-accent-primary dark:to-vynal-accent-secondary dark:text-vynal-text-primary shadow-md group-hover:px-3 group-hover:py-2.5"
          : "hover:bg-slate-100 text-slate-600 hover:text-purple-600 dark:hover:bg-vynal-purple-secondary/20 dark:text-vynal-text-secondary dark:hover:text-vynal-accent-primary group-hover:px-3 group-hover:py-2.5"
      } ${!isActive(href) ? "px-2 py-2.5" : "px-2 py-2.5"}`}
    >
      <div className="flex items-center">
        <div className={`p-1.5 rounded-md relative ${
          isActive(href) 
            ? "bg-white/20 text-white dark:bg-vynal-purple-dark/30 dark:text-vynal-text-primary" 
            : "bg-slate-100 text-purple-600 dark:bg-vynal-purple-dark/20 dark:text-vynal-accent-primary"
        }`}>
          {isNavigating && isActive(href) ? (
            <Loader className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Icon className="h-3.5 w-3.5" />
          )}
          {badgeCount !== undefined && badgeCount > 0 && <NotificationBadge count={badgeCount} className="h-4 w-4 min-w-4 text-[10px]" />}
        </div>
        <span className={`ml-2.5 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap ${
          isActive(href) ? "text-white dark:text-vynal-text-primary" : "text-slate-700 dark:text-vynal-text-secondary"
        }`}>{label}</span>
      </div>
      {isActive(href) && (
        <ChevronRight className="w-3 h-3 text-white dark:text-vynal-text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
      )}
    </div>
  );

  // Version sécurisée du NavItem spécifiquement pour le dashboard
  // Elle empêche les clics répétés qui causent les cascades d'erreurs
  const SafeDashboardNavItem = ({ icon: Icon, label }: Omit<NavItemProps, 'href'>) => {
    const href = '/dashboard';
    const [isClicked, setIsClicked] = useState(false);
    
    const handleDashboardClick = () => {
      // Si déjà sur le dashboard ou en cours de navigation, ne rien faire
      if (isActive(href) || isNavigating || isClicked) {
        return;
      }
      
      // Bloquer les clics multiples
      setIsClicked(true);
      
      // Mettre à jour l'état de navigation avec plus de prudence
      try {
        // Indiquer la navigation active
        setActivePath(href);
        
        // Définir l'état de navigation global avec un délai de sécurité
        NavigationLoadingState.setIsNavigating(true, activePath, href);
        
        // Naviguer vers le dashboard après un court délai
        setTimeout(() => {
          try {
            router.push(href);
            
            // Émettre un événement pour invalider le cache après la navigation
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('vynal:cache-invalidated', {
                detail: { 
                  fromPath: activePath,
                  toPath: href
                }
              }));
            }
          } catch (error: unknown) {
            console.error("Erreur lors de la navigation vers le dashboard:", error);
            NavigationLoadingState.setIsNavigating(false);
          }
        }, 100);
        
        // Réinitialiser l'état de clic après un délai
        setTimeout(() => {
          setIsClicked(false);
        }, 2000);
        
        // Sécurité: forcer la fin de l'état de navigation après un délai maximal
        setTimeout(() => {
          if (NavigationLoadingState.isNavigating) {
            NavigationLoadingState.setIsNavigating(false);
          }
        }, 5000);
      } catch (error: unknown) {
        console.error("Erreur de navigation vers le dashboard:", error);
        setIsClicked(false);
        NavigationLoadingState.setIsNavigating(false);
      }
    };
    
    return (
      <div
        onClick={handleDashboardClick}
        className={`flex items-center justify-between my-0.5 transition-all duration-200 rounded-lg cursor-pointer ${
          isActive(href)
            ? "bg-gradient-to-r from-purple-600 to-violet-700 text-white dark:from-vynal-accent-primary dark:to-vynal-accent-secondary dark:text-vynal-text-primary shadow-md group-hover:px-3 group-hover:py-2.5"
            : "hover:bg-slate-100 text-slate-600 hover:text-purple-600 dark:hover:bg-vynal-purple-secondary/20 dark:text-vynal-text-secondary dark:hover:text-vynal-accent-primary group-hover:px-3 group-hover:py-2.5"
        } ${!isActive(href) ? "px-2 py-2.5" : "px-2 py-2.5"}`}
      >
        <div className="flex items-center">
          <div className={`p-1.5 rounded-md relative ${
            isActive(href) 
              ? "bg-white/20 text-white dark:bg-vynal-purple-dark/30 dark:text-vynal-text-primary" 
              : "bg-slate-100 text-purple-600 dark:bg-vynal-purple-dark/20 dark:text-vynal-accent-primary"
          }`}>
            {(isNavigating && isActive(href)) || isClicked ? (
              <Loader className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Icon className="h-3.5 w-3.5" />
            )}
          </div>
          <span className={`ml-2.5 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap ${
            isActive(href) ? "text-white dark:text-vynal-text-primary" : "text-slate-700 dark:text-vynal-text-secondary"
          }`}>{label}</span>
        </div>
        {isActive(href) && (
          <ChevronRight className="w-3 h-3 text-white dark:text-vynal-text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
        )}
      </div>
    );
  };

  // Simplifier la détection du rôle pour éviter les calculs redondants
  const getUserRole = () => {
    if (!user) return "non connecté";
    
    // Vérifier directement dans user_metadata (plus rapide)
    if (user.user_metadata?.role) {
      return user.user_metadata.role;
    }
    
    // Valeur par défaut
    return "client";
  };

  const userRole = getUserRole();
  const isFreelance = userRole === "freelance";

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50/70 dark:bg-vynal-purple-dark/30">
      {/* Sidebar - Desktop with hover effect */}
      <aside className="group w-14 hover:w-64 transition-all duration-300 ease-in-out bg-white shadow-md shadow-slate-200/50 hidden md:flex md:flex-col z-30 dark:bg-vynal-purple-dark dark:shadow-vynal-purple-secondary/10">
        <div className="h-16 flex items-center px-4 border-b border-slate-100 dark:border-vynal-purple-secondary/20">
          <div className="flex items-center space-x-2">
            <div className="bg-gradient-to-br from-purple-600 to-violet-700 h-7 w-7 rounded-lg flex items-center justify-center shadow-md shadow-purple-200/40 dark:from-vynal-accent-primary dark:to-vynal-accent-secondary dark:shadow-vynal-accent-primary/20">
              <span className="text-white font-bold text-sm dark:text-vynal-text-primary">VY</span>
            </div>
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 overflow-hidden">
              <h1 className="text-sm font-bold bg-gradient-to-r from-purple-600 to-violet-700 bg-clip-text text-transparent dark:from-vynal-accent-primary dark:to-vynal-accent-secondary">VY</h1>
              <p className="text-[10px] text-slate-500 dark:text-vynal-text-secondary">Espace {isFreelance ? "Freelance" : "Client"}</p>
            </div>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2 custom-scrollbar">
          <nav className="space-y-5">
            {/* Éléments essentiels */}
            <div>
              <p className="px-2 text-[10px] font-bold text-slate-400 uppercase mb-1.5 dark:text-vynal-text-secondary opacity-0 group-hover:opacity-100 transition-opacity duration-200 hidden group-hover:block">Principal</p>
              
              <div>
                <SafeDashboardNavItem icon={Home} label="Tableau de bord" />
                <NavItem 
                  href="/dashboard/orders" 
                  icon={ShoppingBag} 
                  label={isFreelance ? "Commandes reçues" : "Mes commandes"} 
                />
                <NavItem 
                  href="/dashboard/messages" 
                  icon={MessageSquare} 
                  label="Messages" 
                  badgeCount={totalUnreadCount}
                />
                <NavItem href="/dashboard/disputes" icon={AlertTriangle} label="Litiges" />
                {isFreelance ? (
                  <NavItem href="/dashboard/wallet" icon={CreditCard} label="Paiements" />
                ) : (
                  <NavItem href="/dashboard/payments" icon={CreditCard} label="Paiements" />
                )}
              </div>
            </div>
            
            {/* Section pour Freelance uniquement */}
            {isFreelance && (
              <div>
                <p className="px-2 text-[10px] font-bold text-slate-400 uppercase mb-1.5 dark:text-vynal-text-secondary opacity-0 group-hover:opacity-100 transition-opacity duration-200 hidden group-hover:block">Services</p>
                
                <div>
                  <NavItem href="/dashboard/services" icon={FileText} label="Mes services" />
                  <NavItem href="/dashboard/orders/delivery" icon={PackageOpen} label="Livrer un travail" />
                  <NavItem href="/dashboard/stats" icon={BarChart2} label="Statistiques" />
                  <NavItem href="/dashboard/certifications" icon={Award} label="Certifications" />
                </div>
              </div>
            )}
            
            {/* Section client uniquement */}
            {!isFreelance && (
              <div>
                <p className="px-2 text-[10px] font-bold text-slate-400 uppercase mb-1.5 dark:text-vynal-text-secondary opacity-0 group-hover:opacity-100 transition-opacity duration-200 hidden group-hover:block">Actions</p>
                
                <div>
                  <NavItem href="/services" icon={FileText} label="Trouver un service" />
                </div>
              </div>
            )}
            
            {/* Section profil et configuration */}
            <div>
              <p className="px-2 text-[10px] font-bold text-slate-400 uppercase mb-1.5 dark:text-vynal-text-secondary opacity-0 group-hover:opacity-100 transition-opacity duration-200 hidden group-hover:block">Paramètres</p>
              
              <div>
                <NavItem href="/dashboard/profile" icon={User} label="Mon profil" />
                <NavItem href="/how-it-works" icon={BookOpen} label="Ressources" />
                <NavItem href="/contact" icon={HelpCircle} label="Support" />
                <NavItem href="/dashboard/settings" icon={Settings} label="Paramètres" />
              </div>
            </div>
          </nav>
        </div>

        {/* User Profile Section */}
        <div className="p-3">
          <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 hover:shadow-sm transition-all dark:bg-vynal-purple-dark/50 dark:border-vynal-purple-secondary/30">
            <div className="flex items-center">
              <div className="relative">
                <div className="w-7 h-7 rounded-md bg-gradient-to-br from-purple-600 to-violet-700 flex items-center justify-center text-white font-medium shadow-sm dark:from-vynal-accent-primary dark:to-vynal-accent-secondary dark:text-vynal-text-primary">
                  {user?.user_metadata?.name ? user.user_metadata.name.charAt(0).toUpperCase() : ""}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-vynal-purple-500 rounded-full border border-white dark:bg-vynal-status-success dark:border-vynal-purple-dark"></div>
              </div>
              <div className="ml-2 flex-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 overflow-hidden">
                <p className="text-xs font-medium text-slate-800 dark:text-vynal-text-primary">{user?.user_metadata?.name || "Utilisateur"}</p>
                <p className="text-[10px] text-slate-500 truncate dark:text-vynal-text-secondary">{user?.email || ""}</p>
              </div>
              <button 
                onClick={() => signOut()} 
                className="p-1 rounded-md text-slate-400 hover:text-red-500 hover:bg-slate-100 transition-colors dark:text-vynal-text-secondary dark:hover:text-vynal-status-error dark:hover:bg-vynal-purple-secondary/20"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </aside>
      
      {/* Main content */}
      <div className="w-full flex-1">
        {/* Top Header - now visible for all users, with different content based on role */}
        <header className="bg-white h-16 flex items-center justify-between px-4 sticky top-0 z-20 border-b border-slate-100 shadow-sm hidden md:flex dark:bg-vynal-purple-dark dark:border-vynal-purple-secondary/20 dark:shadow-vynal-purple-secondary/10">
          <div className="hidden md:block">
            <h2 className="text-lg font-bold text-vynal-purple-light dark:text-vynal-text-primary flex items-center">
              {isNavigating && (
                <Loader className="h-4 w-4 mr-2 animate-spin text-vynal-accent-primary" />
              )}
              {activePath === "/dashboard" && "Tableau de bord"}
              {activePath === "/dashboard/orders" && (isFreelance ? "Commandes reçues" : "Mes commandes")}
              {activePath === "/dashboard/messages" && "Messages"}
              {activePath === "/dashboard/disputes" && "Litiges"}
              {activePath === "/dashboard/payments" && !isFreelance && "Paiements"}
              {activePath === "/dashboard/wallet" && isFreelance && "Paiements"}
              {activePath === "/dashboard/wallet/withdraw" && "Retirer des fonds"}
              {activePath === "/dashboard/services" && "Mes services"}
              {activePath === "/dashboard/orders/new" && "Commander un service"}
              {activePath === "/dashboard/orders/payment" && "Paiement"}
              {activePath === "/dashboard/orders/delivery" && "Livrer un travail"}
              {activePath === "/dashboard/orders/revision" && "Demander une révision"}
              {activePath === "/dashboard/stats" && "Statistiques"}
              {activePath === "/dashboard/certifications" && "Certifications"}
              {activePath === "/dashboard/profile" && "Mon profil"}
              {activePath === "/dashboard/resources" && "Ressources"}
              {activePath === "/dashboard/support" && "Support"}
              {activePath === "/dashboard/settings" && "Paramètres"}
            </h2>
          </div>
          
          <div className="flex items-center space-x-3">
          </div>
        </header>

        {/* Bouton menu mobile pour tous les utilisateurs */}
        <div className="fixed top-3 left-3 z-40 md:hidden">
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg bg-white text-slate-500 hover:bg-slate-100 transition-colors shadow-md"
            aria-label="Menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>

        {/* Menu Mobile - Utilisation du composant séparé */}
        <MobileMenu 
          isOpen={mobileMenuOpen} 
          onClose={() => setMobileMenuOpen(false)} 
          user={user}
          activePath={activePath}
          setActivePath={setActivePath}
          isNavigating={isNavigating}
        />

        {/* Page Content */}
        <main>
          <div
            className={cn(
              'min-h-screen w-full overflow-y-auto overflow-x-hidden border-none outline-none shadow-none bg-background',
              mobileMenuOpen ? 'pt-[60px]' : 'pt-16 md:pt-0 md:pl-0'
            )}
          >
            {children}
          </div>
        </main>
      </div>
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(148, 163, 184, 0.2);
          border-radius: 20px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: rgba(148, 163, 184, 0.4);
        }
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: rgba(148, 163, 184, 0.2) transparent;
        }
        
        /* Prévenir tout débordement horizontal dans la barre latérale */
        aside.group .overflow-hidden,
        aside.group nav,
        aside.group nav > div,
        aside.group nav > div > div {
          max-width: 100%;
          white-space: nowrap;
          text-overflow: ellipsis;
        }
      `}</style>
    </div>
  );
}