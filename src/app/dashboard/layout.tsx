"use client";

import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  User, Settings, FileText, ShoppingBag, MessageSquare, Home, 
  Calendar, CreditCard, BarChart2, BookOpen, Award, HelpCircle,
  Menu, X, ChevronRight, LogOut, Bell, Search
} from "lucide-react";
import MobileMenu from "@/components/MobileMenu";

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
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <div className="absolute top-0 left-0 w-16 h-16 border-4 border-indigo-300 border-b-transparent rounded-full animate-pulse opacity-40"></div>
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
          ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-200/50"
          : "hover:bg-slate-100 text-slate-600 hover:text-indigo-600"
      }`}
    >
      <div className="flex items-center">
        <div className={`p-1.5 rounded-md ${
          isActive(href) 
            ? "bg-white/20 text-white" 
            : "bg-slate-100 text-indigo-600"
        }`}>
          <Icon className="h-3.5 w-3.5" />
        </div>
        <span className={`ml-2.5 text-xs font-medium ${
          isActive(href) ? "text-white" : "text-slate-700"
        }`}>{label}</span>
      </div>
      {isActive(href) && (
        <ChevronRight className="w-3 h-3 text-white" />
      )}
    </Link>
  );

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50/70">
      {/* Sidebar - Desktop */}
      <aside className="w-64 bg-white shadow-md shadow-slate-200/50 hidden md:flex md:flex-col z-30">
        <div className="h-16 flex items-center px-4 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <div className="bg-gradient-to-br from-indigo-600 to-violet-600 h-7 w-7 rounded-lg flex items-center justify-center shadow-md shadow-indigo-200/40">
              <span className="text-white font-bold text-sm">P</span>
            </div>
            <div>
              <h1 className="text-sm font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">ProDash</h1>
              <p className="text-[10px] text-slate-500">Espace {user?.user_metadata?.role === "freelance" ? "Freelance" : "Client"}</p>
            </div>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
          <div className="mb-4 mt-1 relative">
            <div className="relative">
              <input
                type="text"
                placeholder="Rechercher..."
                className="w-full bg-slate-50 border border-slate-100 rounded-lg py-2 pl-8 pr-3 text-xs outline-none focus:ring-1 focus:ring-indigo-300 transition-all"
              />
              <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            </div>
          </div>
          
          <nav className="space-y-5">
            {/* Éléments essentiels */}
            <div>
              <p className="px-2 text-[10px] font-bold text-slate-400 uppercase mb-1.5">Principal</p>
              
              <div>
                <NavItem href="/dashboard" icon={Home} label="Tableau de bord" />
                <NavItem 
                  href="/dashboard/orders" 
                  icon={ShoppingBag} 
                  label={user?.user_metadata?.role === "freelance" ? "Commandes reçues" : "Mes commandes"} 
                />
                <NavItem href="/dashboard/messages" icon={MessageSquare} label="Messages" />
                <NavItem href="/dashboard/payments" icon={CreditCard} label="Paiements" />
              </div>
            </div>
            
            {/* Section pour Freelance uniquement */}
            {user?.user_metadata?.role === "freelance" && (
              <div>
                <p className="px-2 text-[10px] font-bold text-slate-400 uppercase mb-1.5">Services</p>
                
                <div>
                  <NavItem href="/dashboard/services" icon={FileText} label="Mes services" />
                  <NavItem href="/dashboard/stats" icon={BarChart2} label="Statistiques" />
                  <NavItem href="/dashboard/certifications" icon={Award} label="Certifications" />
                </div>
              </div>
            )}
            
            {/* Section profil et configuration */}
            <div>
              <p className="px-2 text-[10px] font-bold text-slate-400 uppercase mb-1.5">Paramètres</p>
              
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
          <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 hover:shadow-sm transition-all">
            <div className="flex items-center">
              <div className="relative">
                <div className="w-7 h-7 rounded-md bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white font-medium shadow-sm">
                  {user?.user_metadata?.name ? user.user_metadata.name.charAt(0).toUpperCase() : "U"}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full border border-white"></div>
              </div>
              <div className="ml-2 flex-1">
                <p className="text-xs font-medium text-slate-800">{user?.user_metadata?.name || "Utilisateur"}</p>
                <p className="text-[10px] text-slate-500 truncate">{user?.email || ""}</p>
              </div>
              <button 
                onClick={() => signOut()} 
                className="p-1 rounded-md text-slate-400 hover:text-red-500 hover:bg-slate-100 transition-colors"
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
          <header className="bg-white h-16 flex items-center justify-between px-4 sticky top-0 z-20 border-b border-slate-100 shadow-sm hidden md:flex">
            <div className="hidden md:block">
              <h2 className="text-lg font-bold text-slate-800">
                {activePath === "/dashboard" && "Tableau de bord"}
                {activePath === "/dashboard/orders" && (user?.user_metadata?.role === "freelance" ? "Commandes reçues" : "Mes commandes")}
                {activePath === "/dashboard/messages" && "Messages"}
                {activePath === "/dashboard/payments" && "Paiements"}
                {activePath === "/dashboard/services" && "Mes services"}
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
                <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-indigo-500 rounded-full border border-white"></span>
              </button>
              <div className="h-6 w-px bg-slate-200"></div>
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-sm">
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
        <main className="p-4 md:p-6">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
            {children}
          </div>
          
          {/* Footer */}
          <footer className="py-3 px-1 text-center">
            <p className="text-[10px] text-slate-400"></p>
          </footer>
        </main>
      </div>
      
      {/* Styles personnalisés */}
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
      `}</style>
    </div>
  );
}