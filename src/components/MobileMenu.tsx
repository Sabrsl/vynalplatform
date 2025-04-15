// Composant de menu mobile mis à jour pour la production - Force le déploiement
import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  User, Settings, FileText, ShoppingBag, MessageSquare, Home, 
  Calendar, CreditCard, BarChart2, BookOpen, Award, HelpCircle,
  X, ChevronRight, LogOut, Search
} from "lucide-react";

interface NavItemProps {
  href: string;
  icon: React.ElementType;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  activePath: string;
  setActivePath: (path: string) => void;
}

const NavItem = ({ href, icon: Icon, label, isActive, onClick }: NavItemProps) => (
  <Link
    href={href}
    onClick={onClick}
    className={`flex items-center justify-between px-3 py-2.5 rounded-lg my-0.5 transition-all duration-200 ${
      isActive
        ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-200/50"
        : "hover:bg-slate-100 text-slate-600 hover:text-indigo-600"
    }`}
  >
    <div className="flex items-center">
      <div className={`p-1.5 rounded-md ${
        isActive 
          ? "bg-white/20 text-white" 
          : "bg-slate-100 text-indigo-600"
      }`}>
        <Icon className="h-3.5 w-3.5" />
      </div>
      <span className={`ml-2.5 text-xs font-medium ${
        isActive ? "text-white" : "text-slate-700"
      }`}>{label}</span>
    </div>
    {isActive && (
      <ChevronRight className="w-3 h-3 text-white" />
    )}
  </Link>
);

export default function MobileMenu({ isOpen, onClose, user, activePath, setActivePath }: MobileMenuProps) {
  if (!isOpen) return null;

  const isActive = (path: string) => activePath === path;

  return (
    <>
      <div 
        className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-200"
        onClick={onClose}
      ></div>
      <aside className="fixed inset-y-0 left-0 max-w-[280px] w-full bg-white z-50 flex flex-col">
        <div className="flex items-center justify-between h-16 px-4 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <div className="bg-gradient-to-br from-indigo-600 to-violet-600 h-7 w-7 rounded-lg flex items-center justify-center shadow-md shadow-indigo-200/40">
              <span className="text-white font-bold text-sm">P</span>
            </div>
            <h1 className="text-base font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">ProDash</h1>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
            aria-label="Fermer le menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          <div className="mb-4 relative">
            <div className="relative">
              <input
                type="text"
                placeholder="Rechercher..."
                className="w-full bg-slate-50 border border-slate-100 rounded-lg py-2 pl-8 pr-3 text-xs outline-none focus:ring-1 focus:ring-indigo-300 transition-all"
              />
              <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            </div>
          </div>
          
          <nav className="space-y-4">
            {/* Éléments essentiels */}
            <div>
              <p className="px-2 text-xs font-semibold text-slate-400 uppercase mb-2">Principal</p>
              <div>
                <NavItem 
                  href="/dashboard" 
                  icon={Home} 
                  label="Tableau de bord" 
                  isActive={isActive("/dashboard")}
                  onClick={() => {
                    setActivePath("/dashboard");
                    onClose();
                  }}
                />
                <NavItem 
                  href="/dashboard/orders" 
                  icon={ShoppingBag} 
                  label={user?.user_metadata?.role === "freelance" ? "Commandes reçues" : "Mes commandes"} 
                  isActive={isActive("/dashboard/orders")}
                  onClick={() => {
                    setActivePath("/dashboard/orders");
                    onClose();
                  }}
                />
                <NavItem 
                  href="/dashboard/messages" 
                  icon={MessageSquare} 
                  label="Messages" 
                  isActive={isActive("/dashboard/messages")}
                  onClick={() => {
                    setActivePath("/dashboard/messages");
                    onClose();
                  }}
                />
                <NavItem 
                  href="/dashboard/payments" 
                  icon={CreditCard} 
                  label="Paiements" 
                  isActive={isActive("/dashboard/payments")}
                  onClick={() => {
                    setActivePath("/dashboard/payments");
                    onClose();
                  }}
                />
              </div>
            </div>
            
            {/* Section pour Freelance uniquement */}
            {user?.user_metadata?.role === "freelance" && (
              <div>
                <p className="px-2 text-xs font-semibold text-slate-400 uppercase mb-2">Services</p>
                <div>
                  <NavItem 
                    href="/dashboard/services" 
                    icon={FileText} 
                    label="Mes services" 
                    isActive={isActive("/dashboard/services")}
                    onClick={() => {
                      setActivePath("/dashboard/services");
                      onClose();
                    }}
                  />
                  <NavItem 
                    href="/dashboard/stats" 
                    icon={BarChart2} 
                    label="Statistiques" 
                    isActive={isActive("/dashboard/stats")}
                    onClick={() => {
                      setActivePath("/dashboard/stats");
                      onClose();
                    }}
                  />
                  <NavItem 
                    href="/dashboard/certifications" 
                    icon={Award} 
                    label="Certifications" 
                    isActive={isActive("/dashboard/certifications")}
                    onClick={() => {
                      setActivePath("/dashboard/certifications");
                      onClose();
                    }}
                  />
                </div>
              </div>
            )}
            
            {/* Section profil et configuration */}
            <div>
              <p className="px-2 text-xs font-semibold text-slate-400 uppercase mb-2">Paramètres</p>
              <div>
                <NavItem 
                  href="/dashboard/profile" 
                  icon={User} 
                  label="Mon profil" 
                  isActive={isActive("/dashboard/profile")}
                  onClick={() => {
                    setActivePath("/dashboard/profile");
                    onClose();
                  }}
                />
                <NavItem 
                  href="/dashboard/resources" 
                  icon={BookOpen} 
                  label="Ressources" 
                  isActive={isActive("/dashboard/resources")}
                  onClick={() => {
                    setActivePath("/dashboard/resources");
                    onClose();
                  }}
                />
                <NavItem 
                  href="/dashboard/support" 
                  icon={HelpCircle} 
                  label="Support" 
                  isActive={isActive("/dashboard/support")}
                  onClick={() => {
                    setActivePath("/dashboard/support");
                    onClose();
                  }}
                />
                <NavItem 
                  href="/dashboard/settings" 
                  icon={Settings} 
                  label="Paramètres" 
                  isActive={isActive("/dashboard/settings")}
                  onClick={() => {
                    setActivePath("/dashboard/settings");
                    onClose();
                  }}
                />
              </div>
            </div>
          </nav>
        </div>
        
        {/* User Profile Section in Mobile Menu */}
        <div className="p-4 border-t border-slate-100">
          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 hover:shadow-sm transition-all">
            <div className="flex items-center">
              <div className="relative">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white font-medium shadow-sm">
                  {user?.user_metadata?.name ? user.user_metadata.name.charAt(0).toUpperCase() : "U"}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full border border-white"></div>
              </div>
              <div className="ml-2.5 flex-1">
                <p className="text-xs font-medium text-slate-800">{user?.user_metadata?.name || "Utilisateur"}</p>
                <p className="text-[10px] text-slate-500 truncate">{user?.email || ""}</p>
              </div>
              <button className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-slate-100 transition-colors">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>
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
    </>
  );
} 