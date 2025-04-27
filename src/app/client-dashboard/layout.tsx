"use client";

import { useState, useEffect } from "react";
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

interface NavItemProps {
  href: string;
  icon: React.ComponentType<any>;
  label: string;
  badgeCount?: number;
}

function NavItem({ href, icon: Icon, label, badgeCount }: NavItemProps) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname?.startsWith(`${href}/`);
  const { setActivePath, setIsNavigating } = NavigationLoadingState;
  const router = useRouter();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    setIsNavigating(true);
    setActivePath(href);
    router.push(href);
  };
  
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
      <div className="w-6 h-6 flex items-center justify-center">
        <Icon className={cn(
          "h-5 w-5",
          isActive ? "text-vynal-accent-primary" : "text-slate-400 group-hover/navitem:text-slate-700 dark:text-vynal-text-secondary dark:group-hover/navitem:text-vynal-text-primary"
        )} />
      </div>
      <span className="ml-2 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200 hidden group-hover:block">
        {label}
      </span>
      
      {badgeCount !== undefined && badgeCount > 0 && (
        <NotificationBadge count={badgeCount} className="absolute right-1 top-1" />
      )}
    </Link>
  );
}

export default function ClientDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading: authLoading, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { activePath, isNavigating, setActivePath } = NavigationLoadingState;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Chargement global
  const loading = authLoading;

  // Notifications non lues
  const { totalUnreadCount } = useUserNotifications(user?.id);

  // Vérifier l'authentification
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    setActivePath(pathname || "/client-dashboard");
  }, [pathname, setActivePath]);

  // Si toujours en chargement, afficher un indicateur
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

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
              <p className="text-[10px] text-slate-500 dark:text-vynal-text-secondary">Espace Client</p>
            </div>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2 custom-scrollbar">
          <nav className="space-y-5">
            {/* Éléments essentiels */}
            <div>
              <p className="px-2 text-[10px] font-bold text-slate-400 uppercase mb-1.5 dark:text-vynal-text-secondary opacity-0 group-hover:opacity-100 transition-opacity duration-200 hidden group-hover:block">Principal</p>
              
              <div>
                <NavItem href="/client-dashboard" icon={Home} label="Tableau de bord" />
                <NavItem href="/client-dashboard/orders" icon={ShoppingBag} label="Mes commandes" />
                <NavItem 
                  href="/client-dashboard/messages" 
                  icon={MessageSquare} 
                  label="Messages" 
                  badgeCount={totalUnreadCount}
                />
                <NavItem href="/client-dashboard/disputes" icon={AlertTriangle} label="Litiges" />
                <NavItem href="/client-dashboard/payments" icon={CreditCard} label="Paiements" />
              </div>
            </div>
            
            {/* Section Actions Client */}
            <div>
              <p className="px-2 text-[10px] font-bold text-slate-400 uppercase mb-1.5 dark:text-vynal-text-secondary opacity-0 group-hover:opacity-100 transition-opacity duration-200 hidden group-hover:block">Actions</p>
              
              <div>
                <NavItem href="/services" icon={FileText} label="Trouver un service" />
              </div>
            </div>
            
            {/* Section profil et configuration */}
            <div>
              <p className="px-2 text-[10px] font-bold text-slate-400 uppercase mb-1.5 dark:text-vynal-text-secondary opacity-0 group-hover:opacity-100 transition-opacity duration-200 hidden group-hover:block">Paramètres</p>
              
              <div>
                <NavItem href="/client-dashboard/profile" icon={User} label="Mon profil" />
                <NavItem href="/how-it-works" icon={BookOpen} label="Ressources" />
                <NavItem href="/contact" icon={HelpCircle} label="Support" />
                <NavItem href="/client-dashboard/settings" icon={Settings} label="Paramètres" />
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

      {/* Main content area */}
      <div className="flex-1 min-w-0">
        {children}
      </div>
    </div>
  );
} 