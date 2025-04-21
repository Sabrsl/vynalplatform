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
import { AnimatePresence, motion } from "framer-motion";
import NotificationBadge from "@/components/ui/notification-badge";
import useTotalUnreadMessages from "@/hooks/useTotalUnreadMessages";
import { User as UserType } from "@supabase/supabase-js";
import { useUser } from "@/hooks/useUser";

interface NavItemProps {
  href: string;
  icon: React.ElementType;
  label: string;
  isActive: boolean;
  onClick: () => void;
  badgeCount?: number;
}

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserType | null;
  activePath: string;
  setActivePath: (path: string) => void;
}

const NavItem = ({ href, icon: Icon, label, isActive, onClick, badgeCount }: NavItemProps) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center justify-between px-3 py-2.5 rounded-lg my-0.5 transition-all duration-200 ${
        isActive
          ? "bg-gradient-to-r from-vynal-purple-500 to-vynal-accent-primary text-white shadow-md dark:shadow-vynal-purple-900/40 shadow-vynal-purple-200/50"
          : `hover:bg-vynal-purple-100/50 dark:hover:bg-vynal-purple-dark/50 
             text-vynal-purple-dark dark:text-vynal-text-primary 
             hover:text-vynal-purple-600 dark:hover:text-vynal-accent-primary`
      }`}
    >
      <div className="flex items-center">
        <div className={`p-1.5 rounded-md relative ${
          isActive
            ? "bg-white/20 text-white" 
            : isDark
              ? "bg-vynal-purple-secondary/20 text-vynal-accent-primary"
              : "bg-vynal-purple-100 text-vynal-purple-600"
        }`}>
          <Icon className="h-3.5 w-3.5" />
          {badgeCount !== undefined && badgeCount > 0 && (
            <NotificationBadge count={badgeCount} className="h-4 w-4 min-w-4 text-[10px]" />
          )}
        </div>
        <span className={`ml-2.5 text-xs font-medium ${
          isActive 
            ? "text-white" 
            : isDark
              ? "text-vynal-text-primary"
              : "text-vynal-purple-dark"
        }`}>{label}</span>
      </div>
      {isActive && (
        <ChevronRight className="w-3 h-3 text-white" />
      )}
    </Link>
  );
};

export default function MobileMenu({ isOpen, onClose, user, activePath, setActivePath }: MobileMenuProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { totalUnreadCount } = useTotalUnreadMessages();
  const { isFreelance } = useUser();
  
  // Import de la fonction de déconnexion
  const { signOut } = useAuth();
  
  const isActive = (path: string) => activePath === path;

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <>
          <motion.div 
            className="fixed inset-0 z-40 bg-vynal-purple-dark/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
          />
          <motion.aside 
            className={`fixed inset-y-0 left-0 max-w-[280px] w-full z-50 flex flex-col
              ${isDark 
                ? "bg-gradient-vynal border-r border-vynal-purple-secondary/20" 
                : "bg-gradient-to-br from-white to-vynal-purple-50 border-r border-vynal-purple-200/30"
              }
            `}
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ 
              type: "spring", 
              stiffness: 350, 
              damping: 30,
              mass: 0.8,
              restDelta: 0.001
            }}
          >
            {/* Éléments décoratifs */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <motion.div 
                className={`absolute -top-24 -right-24 w-60 h-60 rounded-full blur-3xl opacity-0 ${
                  isDark ? "bg-vynal-accent-secondary/10" : "bg-vynal-purple-300/20"
                }`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 0.5, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ delay: 0.1, duration: 0.5 }}
              />
              <motion.div 
                className={`absolute -bottom-24 -left-24 w-60 h-60 rounded-full blur-3xl opacity-0 ${
                  isDark ? "bg-vynal-accent-primary/10" : "bg-vynal-purple-400/15"
                }`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 0.5, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ delay: 0.2, duration: 0.5 }}
              />
              
              {/* Grille décorative en arrière-plan */}
              <motion.div 
                className={`absolute inset-0 bg-[url('/img/grid-pattern.svg')] bg-center ${
                  isDark ? "opacity-0" : "opacity-0"
                }`}
                initial={{ opacity: 0 }}
                animate={{ opacity: isDark ? 0.05 : 0.1 }}
                exit={{ opacity: 0 }}
                transition={{ delay: 0.1, duration: 0.4 }}
              />
            </div>
            
            <div className={`flex items-center justify-between h-16 px-4 relative z-10 border-b ${
              isDark ? "border-vynal-purple-secondary/20" : "border-vynal-purple-200/30"
            }`}>
              <div className="flex items-center gap-3">
                <div className="flex flex-row items-center gap-2.5">
                  <div className="bg-gradient-to-br from-vynal-purple-500 to-vynal-accent-primary h-8 w-8 rounded-lg shadow-md shadow-vynal-purple-200/40 dark:shadow-vynal-purple-900/30">
                  </div>
                  <h1 className="text-base font-bold text-vynal-accent-primary">VY</h1>
                </div>
                
                {user && (
                  <div className={`px-2 py-0.5 rounded-sm text-[9px] font-medium tracking-wide ${
                    isFreelance
                      ? isDark
                        ? "bg-amber-500/20 text-amber-300"
                        : "bg-amber-100 text-amber-700"
                      : isDark
                        ? "bg-blue-500/20 text-blue-300"
                        : "bg-blue-100 text-blue-700"
                  }`}>
                    {isFreelance ? "Freelance" : "Client"}
                  </div>
                )}
              </div>
              <button 
                onClick={onClose}
                className={`p-1.5 rounded-lg transition-all ${
                  isDark 
                    ? "text-vynal-text-secondary hover:bg-vynal-purple-secondary/20 hover:text-vynal-accent-primary" 
                    : "text-vynal-purple-400 hover:bg-vynal-purple-100/70 hover:text-vynal-purple-600"
                }`}
                aria-label="Fermer le menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 relative z-10 scrollbar-none" 
              style={{ 
                scrollbarWidth: 'none', 
                msOverflowStyle: 'none' 
              }}
            >
              {/* Masquer la barre de défilement WebKit */}
              <style jsx>{`
                div::-webkit-scrollbar {
                  display: none;
                  width: 0;
                  height: 0;
                }
              `}</style>
              
              {user ? (
                // Contenu pour utilisateur connecté
                <nav className="space-y-4">
                  {/* Éléments essentiels */}
                  <div>
                    <p className={`px-2 text-xs font-semibold uppercase mb-2 ${
                      isDark ? "text-vynal-text-secondary" : "text-vynal-purple-400"
                    }`}>
                      Principal
                    </p>
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
                        label={isFreelance ? "Commandes reçues" : "Mes commandes"} 
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
                        badgeCount={totalUnreadCount}
                      />
                      {isFreelance ? (
                        <NavItem 
                          href="/dashboard/wallet" 
                          icon={CreditCard} 
                          label="Paiements" 
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
                  {isFreelance && (
                    <div>
                      <p className={`px-2 text-xs font-semibold uppercase mb-2 ${
                        isDark ? "text-vynal-text-secondary" : "text-vynal-purple-400"
                      }`}>
                        Services
                      </p>
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
                  {!isFreelance && (
                    <div>
                      <p className={`px-2 text-xs font-semibold uppercase mb-2 ${
                        isDark ? "text-vynal-text-secondary" : "text-vynal-purple-400"
                      }`}>
                        Actions
                      </p>
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
                  <div className="mt-2">
                    <div className={`flex items-center gap-2 px-2 py-1.5 mb-3 rounded-md ${
                      isDark 
                        ? "bg-vynal-purple-secondary/20" 
                        : "bg-vynal-purple-100/50"
                    }`}>
                      <Settings className={`h-3.5 w-3.5 ${
                        isDark ? "text-vynal-accent-primary" : "text-vynal-purple-600"
                      }`} />
                      <p className={`text-xs font-semibold ${
                        isDark ? "text-vynal-text-primary" : "text-vynal-purple-600"
                      }`}>
                        Paramètres
                      </p>
                    </div>
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
                  
                  {/* Bouton de déconnexion */}
                  <div className="mt-6 pt-6 border-t dark:border-vynal-purple-secondary/20 border-vynal-purple-200/30">
                    <button 
                      onClick={() => {
                        signOut();
                        onClose();
                      }}
                      className={`flex items-center w-full px-3 py-2 rounded-lg transition-all 
                        ${isDark 
                          ? "text-vynal-text-primary hover:bg-vynal-purple-secondary/20 hover:text-vynal-accent-primary" 
                          : "text-vynal-purple-dark hover:bg-vynal-purple-100/50 hover:text-vynal-purple-600"
                        }`}
                    >
                      <div className={`p-1.5 rounded-md ${
                        isDark
                          ? "bg-vynal-purple-secondary/20 text-vynal-accent-primary"
                          : "bg-vynal-purple-100 text-vynal-purple-600"
                      }`}>
                        <LogOut className="h-3.5 w-3.5" />
                      </div>
                      <span className="ml-2.5 text-xs font-medium">Déconnexion</span>
                    </button>
                  </div>
                </nav>
              ) : (
                // Contenu pour utilisateur non connecté - uniquement connexion/inscription
                <div className="flex flex-col gap-4 items-center justify-center h-full">
                  <div className="text-center mb-4">
                    <h3 className={`text-base font-semibold mb-1 ${
                      isDark ? "text-vynal-text-primary" : "text-vynal-purple-dark"
                    }`}>
                      Bienvenue sur Vynal
                    </h3>
                    <p className={`text-xs ${
                      isDark ? "text-vynal-text-secondary" : "text-vynal-purple-500"
                    }`}>
                      Connectez-vous pour accéder à toutes les fonctionnalités
                    </p>
                  </div>
                  
                  <Link 
                    href="/auth/login" 
                    className="w-full"
                    onClick={onClose}
                  >
                    <button className={`w-full py-2.5 px-4 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                      isDark 
                        ? "bg-vynal-purple-secondary/20 text-vynal-text-primary hover:bg-vynal-purple-secondary/30 hover:text-vynal-accent-primary" 
                        : "bg-vynal-purple-100/80 text-vynal-purple-dark hover:bg-vynal-purple-200/80 hover:text-vynal-purple-600"
                    }`}>
                      <User className="w-4 h-4" />
                      Connexion
                    </button>
                  </Link>
                  
                  <Link 
                    href="/auth/signup" 
                    className="w-full"
                    onClick={onClose}
                  >
                    <button className="w-full py-2.5 px-4 rounded-lg bg-gradient-to-r from-vynal-purple-500 to-vynal-accent-primary text-white text-sm font-medium flex items-center justify-center gap-2 transition-all hover:opacity-90">
                      Inscription
                    </button>
                  </Link>
                  
                  <div className="mt-6 border-t w-full pt-6 dark:border-vynal-purple-secondary/20 border-vynal-purple-200/30">
                    <Link 
                      href="/how-it-works" 
                      className="w-full"
                      onClick={onClose}
                    >
                      <button className={`w-full py-2 px-4 rounded-lg text-xs flex items-center justify-center transition-all ${
                        isDark 
                          ? "text-vynal-text-secondary hover:text-vynal-accent-primary" 
                          : "text-vynal-purple-400 hover:text-vynal-purple-600"
                      }`}>
                        <BookOpen className="w-3.5 h-3.5 mr-2" />
                        Comment ça marche
                      </button>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
} 