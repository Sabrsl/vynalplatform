// Composant de menu mobile mis à jour pour la production - Force le déploiement
import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  User, Settings, FileText, ShoppingBag, MessageSquare, Home, 
  Calendar, CreditCard, BarChart2, BookOpen, Award, HelpCircle,
  X, ChevronRight, LogOut, Search, Wallet, RefreshCw, PackageOpen
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "next-themes";

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
        ? "bg-gradient-to-r from-purple-600 to-violet-700 text-white shadow-md dark:shadow-purple-900/40 shadow-purple-200/50"
        : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400"
    }`}
  >
    <div className="flex items-center">
      <div className={`p-1.5 rounded-md ${
        isActive 
          ? "bg-white/20 text-white" 
          : "bg-slate-100 dark:bg-slate-800 text-purple-600 dark:text-purple-400"
      }`}>
        <Icon className="h-3.5 w-3.5" />
      </div>
      <span className={`ml-2.5 text-xs font-medium ${
        isActive ? "text-white" : "text-slate-700 dark:text-slate-200"
      }`}>{label}</span>
    </div>
    {isActive && (
      <ChevronRight className="w-3 h-3 text-white" />
    )}
  </Link>
);

export default function MobileMenu({ isOpen, onClose, user, activePath, setActivePath }: MobileMenuProps) {
  const { theme } = useTheme();
  
  if (!isOpen) return null;

  const isActive = (path: string) => activePath === path;
  
  // Import de la fonction de déconnexion
  const { signOut } = useAuth();

  return (
    <>
      <div 
        className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-200"
        onClick={onClose}
      ></div>
      <aside className="fixed inset-y-0 left-0 max-w-[280px] w-full bg-white dark:bg-gray-900 z-50 flex flex-col">
        <div className="flex items-center justify-between h-16 px-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center space-x-2">
            <div className="bg-gradient-to-br from-purple-600 to-violet-700 h-7 w-7 rounded-lg flex items-center justify-center shadow-md shadow-purple-200/40 dark:shadow-purple-900/30">
              <span className="text-white font-bold text-sm">VY</span>
            </div>
            <h1 className="text-base font-bold bg-gradient-to-r from-purple-600 to-violet-700 bg-clip-text text-transparent">VY</h1>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Fermer le menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          <nav className="space-y-4">
            {/* Éléments essentiels */}
            <div>
              <p className="px-2 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase mb-2">Principal</p>
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
                {user?.user_metadata?.role === "freelance" ? (
                  <NavItem 
                    href="/dashboard/wallet" 
                    icon={Wallet} 
                    label="Mon portefeuille" 
                    isActive={isActive("/dashboard/wallet")}
                    onClick={() => {
                      setActivePath("/dashboard/wallet");
                      onClose();
                    }}
                  />
                ) : (
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
                )}
              </div>
            </div>
            
            {/* Section pour Freelance uniquement */}
            {user?.user_metadata?.role === "freelance" && (
              <div>
                <p className="px-2 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase mb-2">Services</p>
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
                    href="/dashboard/orders/delivery" 
                    icon={PackageOpen} 
                    label="Livrer un travail" 
                    isActive={isActive("/dashboard/orders/delivery")}
                    onClick={() => {
                      setActivePath("/dashboard/orders/delivery");
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
            
            {/* Section client uniquement */}
            {user?.user_metadata?.role !== "freelance" && (
              <div>
                <p className="px-2 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase mb-2">Actions</p>
                <div>
                  <NavItem 
                    href="/services" 
                    icon={FileText} 
                    label="Trouver un service" 
                    isActive={isActive("/services")}
                    onClick={() => {
                      setActivePath("/services");
                      onClose();
                    }}
                  />
                </div>
              </div>
            )}
            
            {/* Section profil et configuration */}
            <div>
              <p className="px-2 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase mb-2">Paramètres</p>
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
                  href="/how-it-works" 
                  icon={BookOpen} 
                  label="Ressources" 
                  isActive={isActive("/how-it-works")}
                  onClick={() => {
                    setActivePath("/how-it-works");
                    onClose();
                  }}
                />
                <NavItem 
                  href="/contact" 
                  icon={HelpCircle} 
                  label="Support" 
                  isActive={isActive("/contact")}
                  onClick={() => {
                    setActivePath("/contact");
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
        <div className="p-4 border-t border-slate-100 dark:border-slate-800">
          <div className="bg-slate-50 dark:bg-slate-800 p-2.5 rounded-lg border border-slate-100 dark:border-slate-700 hover:shadow-sm transition-all">
            <div className="flex items-center">
              <div className="relative">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-violet-700 flex items-center justify-center text-white font-medium shadow-sm">
                  {user?.user_metadata?.name ? user.user_metadata.name.charAt(0).toUpperCase() : ""}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full border border-white dark:border-slate-800"></div>
              </div>
              <div className="ml-2.5 flex-1">
                <p className="text-xs font-medium text-slate-800 dark:text-slate-200">{user?.user_metadata?.name || "Utilisateur"}</p>
                <p className="text-[10px] text-slate-500 truncate">{user?.email || ""}</p>
              </div>
              <button 
                onClick={() => signOut()} 
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
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