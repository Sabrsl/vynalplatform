"use client";

import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  User, Settings, FileText, ShoppingBag, MessageSquare, Home, 
  Calendar, CreditCard, BarChart2, BookOpen, Award, HelpCircle,
  Menu, X, ChevronRight, LogOut, Bell, Search, Wallet, RefreshCw, PackageOpen
} from "lucide-react";
import MobileMenu from "@/components/MobileMenu";
import { cn } from "@/lib/utils";

interface NavItemProps {
  href: string;
  icon: React.ElementType;
  label: string;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activePath, setActivePath] = useState("");
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setActivePath(window.location.pathname);
      
      // Gestion des changements de route pour maintenir activePath à jour
      const handleRouteChange = () => {
        setActivePath(window.location.pathname);
      };
      
      window.addEventListener('popstate', handleRouteChange);
      return () => window.removeEventListener('popstate', handleRouteChange);
    }
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login");
    }
  }, [user, loading, router]);

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

  const isActive = (path: string) => activePath === path;

  const NavItem = ({ href, icon: Icon, label }: NavItemProps) => (
    <Link
      href={href}
      onClick={() => {
        setActivePath(href);
        setMobileMenuOpen(false);
      }}
      className={`flex items-center justify-between px-3 py-2.5 rounded-lg my-0.5 transition-all duration-200 ${
        isActive(href)
          ? "bg-gradient-to-r from-purple-600 to-violet-700 text-white dark:from-vynal-accent-primary dark:to-vynal-accent-secondary dark:text-vynal-text-primary shadow-md"
          : "hover:bg-slate-100 text-slate-600 hover:text-purple-600 dark:hover:bg-vynal-purple-secondary/20 dark:text-vynal-text-secondary dark:hover:text-vynal-accent-primary"
      }`}
    >
      <div className="flex items-center">
        <div className={`p-1.5 rounded-md ${
          isActive(href) 
            ? "bg-white/20 text-white dark:bg-vynal-purple-dark/30 dark:text-vynal-text-primary" 
            : "bg-slate-100 text-purple-600 dark:bg-vynal-purple-dark/20 dark:text-vynal-accent-primary"
        }`}>
          <Icon className="h-3.5 w-3.5" />
        </div>
        <span className={`ml-2.5 text-xs font-medium ${
          isActive(href) ? "text-white dark:text-vynal-text-primary" : "text-slate-700 dark:text-vynal-text-secondary"
        }`}>{label}</span>
      </div>
      {isActive(href) && (
        <ChevronRight className="w-3 h-3 text-white dark:text-vynal-text-primary" />
      )}
    </Link>
  );

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50/70 dark:bg-vynal-purple-dark/30">
      {/* Sidebar - Desktop */}
      <aside className="w-64 bg-white shadow-md shadow-slate-200/50 hidden md:flex md:flex-col z-30 dark:bg-vynal-purple-dark dark:shadow-vynal-purple-secondary/10">
        <div className="h-16 flex items-center px-4 border-b border-slate-100 dark:border-vynal-purple-secondary/20">
          <div className="flex items-center space-x-2">
            <div className="bg-gradient-to-br from-purple-600 to-violet-700 h-7 w-7 rounded-lg flex items-center justify-center shadow-md shadow-purple-200/40 dark:from-vynal-accent-primary dark:to-vynal-accent-secondary dark:shadow-vynal-accent-primary/20">
              <span className="text-white font-bold text-sm dark:text-vynal-text-primary">P</span>
            </div>
            <div>
              <h1 className="text-sm font-bold bg-gradient-to-r from-purple-600 to-violet-700 bg-clip-text text-transparent dark:from-vynal-accent-primary dark:to-vynal-accent-secondary">ProDash</h1>
              <p className="text-[10px] text-slate-500 dark:text-vynal-text-secondary">Espace {user?.user_metadata?.role === "freelance" ? "Freelance" : "Client"}</p>
            </div>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
          <div className="mb-4 mt-1 relative">
            <div className="relative">
              <input
                type="text"
                placeholder="Rechercher..."
                className="w-full bg-slate-50 border border-slate-100 rounded-lg py-2 pl-8 pr-3 text-xs outline-none focus:ring-1 focus:ring-purple-300 transition-all dark:bg-vynal-purple-dark/50 dark:border-vynal-purple-secondary/30 dark:focus:ring-vynal-accent-primary dark:text-vynal-text-primary dark:placeholder:text-vynal-text-secondary/70"
              />
              <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-slate-400 dark:text-vynal-text-secondary" />
            </div>
          </div>
          
          <nav className="space-y-5">
            {/* Éléments essentiels */}
            <div>
              <p className="px-2 text-[10px] font-bold text-slate-400 uppercase mb-1.5 dark:text-vynal-text-secondary">Principal</p>
              
              <div>
                <NavItem href="/dashboard" icon={Home} label="Tableau de bord" />
                <NavItem 
                  href="/dashboard/orders" 
                  icon={ShoppingBag} 
                  label={user?.user_metadata?.role === "freelance" ? "Commandes reçues" : "Mes commandes"} 
                />
                <NavItem href="/dashboard/messages" icon={MessageSquare} label="Messages" />
                {user?.user_metadata?.role === "freelance" ? (
                  <NavItem href="/dashboard/wallet" icon={Wallet} label="Mon portefeuille" />
                ) : (
                  <NavItem href="/dashboard/payments" icon={CreditCard} label="Paiements" />
                )}
              </div>
            </div>
            
            {/* Section pour Freelance uniquement */}
            {user?.user_metadata?.role === "freelance" && (
              <div>
                <p className="px-2 text-[10px] font-bold text-slate-400 uppercase mb-1.5 dark:text-vynal-text-secondary">Services</p>
                
                <div>
                  <NavItem href="/dashboard/services" icon={FileText} label="Mes services" />
                  <NavItem href="/dashboard/orders/delivery" icon={PackageOpen} label="Livrer un travail" />
                  <NavItem href="/dashboard/stats" icon={BarChart2} label="Statistiques" />
                  <NavItem href="/dashboard/certifications" icon={Award} label="Certifications" />
                </div>
              </div>
            )}
            
            {/* Section client uniquement */}
            {user?.user_metadata?.role !== "freelance" && (
              <div>
                <p className="px-2 text-[10px] font-bold text-slate-400 uppercase mb-1.5 dark:text-vynal-text-secondary">Actions</p>
                
                <div>
                  <NavItem href="/dashboard/services/browse" icon={FileText} label="Trouver un service" />
                  <NavItem href="/dashboard/orders/revision" icon={RefreshCw} label="Demander une révision" />
                </div>
              </div>
            )}
            
            {/* Section profil et configuration */}
            <div>
              <p className="px-2 text-[10px] font-bold text-slate-400 uppercase mb-1.5 dark:text-vynal-text-secondary">Paramètres</p>
              
              <div>
                <NavItem href="/dashboard/profile" icon={User} label="Mon profil" />
                <NavItem href="/dashboard/resources" icon={BookOpen} label="Ressources" />
                <NavItem href="/dashboard/support" icon={HelpCircle} label="Support" />
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
                  {user?.user_metadata?.name ? user.user_metadata.name.charAt(0).toUpperCase() : "U"}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-vynal-purple-500 rounded-full border border-white dark:bg-vynal-status-success dark:border-vynal-purple-dark"></div>
              </div>
              <div className="ml-2 flex-1">
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
        {/* Top Header - Visible uniquement sur desktop pour les non-freelances */}
        {user?.user_metadata?.role !== "freelance" && (
          <header className="bg-white h-16 flex items-center justify-between px-4 sticky top-0 z-20 border-b border-slate-100 shadow-sm hidden md:flex dark:bg-vynal-purple-dark dark:border-vynal-purple-secondary/20 dark:shadow-vynal-purple-secondary/10">
            <div className="hidden md:block">
              <h2 className="text-lg font-bold text-slate-800 dark:text-vynal-text-primary">
                {activePath === "/dashboard" && "Tableau de bord"}
                {activePath === "/dashboard/orders" && (user?.user_metadata?.role === "freelance" ? "Commandes reçues" : "Mes commandes")}
                {activePath === "/dashboard/messages" && "Messages"}
                {activePath === "/dashboard/payments" && "Paiements"}
                {activePath === "/dashboard/wallet" && "Mon portefeuille"}
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
              <button className="relative p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors">
                <MessageSquare className="h-4 w-4" />
                <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-red-500 rounded-full border border-white"></span>
              </button>
              <button className="relative p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors">
                <Bell className="h-4 w-4" />
                <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-vynal-purple-500 rounded-full border border-white"></span>
              </button>
              <div className="h-6 w-px bg-slate-200"></div>
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-violet-700 flex items-center justify-center text-white shadow-sm">
                  {user?.user_metadata?.name ? user.user_metadata.name.charAt(0).toUpperCase() : "U"}
                </div>
              </div>
            </div>
          </header>
        )}

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
        />

        {/* Page Content */}
        <main>
          <div
            className={cn(
              'scrollbar-custom h-screen w-full overflow-y-auto bg-background pb-20',
              mobileMenuOpen ? 'pt-[60px]' : 'pt-16 md:pl-60'
            )}
          >
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}