import React, { useCallback, useEffect, useMemo, memo } from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { User } from '@supabase/supabase-js';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';
import { UserAvatar } from '@/components/user/UserAvatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useUserNotifications } from '@/hooks/useUserNotifications';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { useLogout } from '@/hooks/useLogout';
import { NavigationLoadingState } from '@/app/providers';

import { 
  X,
  Home, 
  MessageSquare, 
  ShoppingBag, 
  AlertTriangle, 
  CreditCard, 
  FileText, 
  BarChart2, 
  Award, 
  PackageOpen,
  Settings,
  LogOut,
  User as UserIcon,
  UserPlus,
  FileSpreadsheet,
  MessageCircle,
  Bell,
  Heart,
  Briefcase,
  HelpCircle
} from 'lucide-react';

interface NavItemProps {
  href: string;
  icon: React.ElementType;
  label: string;
  isActive: boolean;
  onClick: () => void;
  isNavigating: boolean;
  badgeCount?: number;
}

// Optimisation avec memo pour éviter les re-rendus inutiles
const NavItem = memo<NavItemProps>(({ 
  href, 
  icon: Icon, 
  label, 
  isActive, 
  onClick,
  isNavigating,
  badgeCount
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  return (
    <Link 
      href={href}
      className={`
        flex items-center px-2 py-2 rounded-md mb-1
        ${isActive 
          ? `bg-vynal-accent-primary/10 text-vynal-accent-primary font-medium` 
          : `hover:bg-slate-100 text-slate-700 dark:text-vynal-text-secondary dark:hover:bg-vynal-purple-secondary/10`
        }
        ${isNavigating ? 'opacity-70 pointer-events-none' : ''}
      `}
      onClick={onClick}
    >
      <div className="mr-2 flex items-center justify-center w-5">
        <Icon className={`
          ${isActive 
            ? 'text-vynal-accent-primary' 
            : 'text-slate-500 dark:text-vynal-text-secondary/70'
          } 
          h-4 w-4
          ${isNavigating ? 'animate-pulse' : ''}
        `} />
      </div>
      <span className="text-xs">{label}</span>
      
      {badgeCount !== undefined && badgeCount > 0 && (
        <Badge className="ml-auto bg-vynal-accent-secondary/90 text-white text-[0.65rem] px-1.5 min-w-[1.25rem]">
          {badgeCount > 99 ? '99+' : badgeCount}
        </Badge>
      )}
    </Link>
  );
});

NavItem.displayName = 'NavItem';

// Composant pour l'en-tête du menu
const MobileMenuHeader = memo(({ 
  user, 
  onClose, 
  navigateToHome 
}: { 
  user: User | null; 
  onClose: () => void; 
  navigateToHome: (e: React.MouseEvent) => void;
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  return (
    <div className="p-3 flex items-center justify-between border-b dark:border-vynal-purple-secondary/20">
      <div className="flex items-center space-x-2">
        <span 
          className="bg-gradient-to-br from-vynal-accent-primary to-vynal-accent-secondary h-7 w-7 rounded-lg flex items-center justify-center shadow-md shadow-vynal-accent-primary/20 cursor-pointer hover:scale-105 transition-transform"
          onClick={navigateToHome}
        >
          <span className="text-white font-bold text-xs">VY</span>
        </span>
        <div 
          className="cursor-pointer"
          onClick={navigateToHome}
        >
          <h1 className="text-xs font-bold text-vynal-purple-light dark:text-vynal-text-primary">Vynal Platform</h1>
          {user && (
            <p className="text-[9px] text-vynal-purple-secondary dark:text-vynal-text-secondary">Espace Freelance</p>
          )}
        </div>
      </div>
      <Button 
        variant="ghost" 
        size="icon"
        onClick={onClose}
        className="text-slate-500 hover:text-slate-700 dark:text-vynal-text-secondary dark:hover:text-vynal-text-primary"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
});

MobileMenuHeader.displayName = 'MobileMenuHeader';

// Composant pour le contenu des utilisateurs authentifiés
const AuthenticatedMenuContent = memo(({ 
  totalUnreadCount, 
  isActive, 
  navItemCallbacks, 
  isNavigating, 
  handleSignOut 
}: { 
  totalUnreadCount: number; 
  isActive: (path: string) => boolean; 
  navItemCallbacks: Record<string, () => void>; 
  isNavigating: boolean;
  handleSignOut: () => void;
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  return (
    <>
      <ScrollArea className="flex-1">
        <div className="p-3">
          {/* Principal */}
          <div>
            <p className={`px-2 text-[10px] font-semibold uppercase mb-1 ${
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
                onClick={navItemCallbacks.dashboard}
                isNavigating={isNavigating}
              />
              <NavItem 
                href="/dashboard/orders" 
                icon={ShoppingBag} 
                label="Commandes reçues" 
                isActive={isActive("/dashboard/orders")}
                onClick={navItemCallbacks.orders}
                isNavigating={isNavigating}
              />
              <NavItem 
                href="/dashboard/messages" 
                icon={MessageSquare} 
                label="Messages" 
                isActive={isActive("/dashboard/messages")}
                onClick={navItemCallbacks.messages}
                isNavigating={isNavigating}
                badgeCount={totalUnreadCount}
              />
              <NavItem 
                href="/dashboard/disputes" 
                icon={AlertTriangle} 
                label="Litiges" 
                isActive={isActive("/dashboard/disputes")}
                onClick={navItemCallbacks.disputes}
                isNavigating={isNavigating}
              />
              <NavItem 
                href="/dashboard/wallet" 
                icon={CreditCard} 
                label="Paiements" 
                isActive={isActive("/dashboard/wallet")}
                onClick={navItemCallbacks.wallet}
                isNavigating={isNavigating}
              />
            </div>
          </div>
          
          {/* Section services */}
          <div>
            <p className={`px-2 text-[10px] font-semibold uppercase mb-1 mt-4 ${
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
                onClick={navItemCallbacks.services}
                isNavigating={isNavigating}
              />
              <NavItem 
                href="/dashboard/stats" 
                icon={BarChart2} 
                label="Statistiques" 
                isActive={isActive("/dashboard/stats")}
                onClick={navItemCallbacks.stats}
                isNavigating={isNavigating}
              />
              <NavItem 
                href="/dashboard/certifications" 
                icon={Award} 
                label="Certifications" 
                isActive={isActive("/dashboard/certifications")}
                onClick={navItemCallbacks.certifications}
                isNavigating={isNavigating}
              />
            </div>
          </div>
          
          {/* Section profil et configuration */}
          <div>
            <p className={`px-2 text-[10px] font-semibold uppercase mb-1 mt-4 ${
              isDark ? "text-vynal-text-secondary" : "text-vynal-purple-400"
            }`}>
              Profil
            </p>
            <div>
              <NavItem 
                href="/dashboard/profile" 
                icon={UserIcon} 
                label="Mon profil" 
                isActive={isActive("/dashboard/profile")}
                onClick={navItemCallbacks.profile}
                isNavigating={isNavigating}
              />
              <NavItem 
                href="/dashboard/settings" 
                icon={Settings} 
                label="Paramètres" 
                isActive={isActive("/dashboard/settings")}
                onClick={navItemCallbacks.settings}
                isNavigating={isNavigating}
              />
            </div>
          </div>
        </div>
      </ScrollArea>
      
      {/* Actions bas de page pour utilisateur connecté */}
      <div className="border-t p-3 dark:border-vynal-purple-secondary/20">
        <Button 
          variant="ghost" 
          className="w-full justify-start py-2 text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-900/10"
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4 mr-2" />
          <span className="text-xs">Déconnexion</span>
        </Button>
      </div>
    </>
  );
});

AuthenticatedMenuContent.displayName = 'AuthenticatedMenuContent';

// Composant pour le contenu des utilisateurs non authentifiés
const UnauthenticatedMenuContent = memo(({ 
  navigateAndClose 
}: { 
  navigateAndClose: (path: string) => void;
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  return (
    <div className="flex flex-col flex-1">
      {/* Bannière d'accueil avec dégradé subtil */}
      <div className={`py-6 px-4 bg-gradient-to-br ${
        isDark 
          ? "from-vynal-purple-secondary/10 to-vynal-purple-dark" 
          : "from-vynal-purple-50 to-white"
      }`}>
        <div className="text-center space-y-2">
          <div className="mx-auto w-10 h-10 rounded-full bg-gradient-to-br from-vynal-accent-primary to-vynal-accent-secondary flex items-center justify-center shadow-md shadow-vynal-accent-primary/10">
            <UserIcon className="h-4 w-4 text-white" />
          </div>
          <h3 className={`text-base font-medium ${isDark ? "text-vynal-text-primary" : "text-vynal-purple-dark"}`}>
            Bienvenue sur Vynal
          </h3>
          <p className="text-[11px] leading-tight text-vynal-text-secondary max-w-[180px] mx-auto">
            Connectez-vous pour accéder à votre espace et gérer vos projets
          </p>
        </div>
      </div>
      
      {/* Boutons d'action */}
      <div className="p-5 space-y-3">
        <Button 
          variant="default" 
          className="w-full py-2 h-auto text-sm relative overflow-hidden bg-gradient-to-r from-vynal-accent-primary to-vynal-accent-secondary hover:from-vynal-accent-primary/95 hover:to-vynal-accent-secondary/95 shadow hover:shadow-md transition-all"
          onClick={() => navigateAndClose('/auth/login')}
        >
          <div className="absolute inset-0 bg-white/5 rounded-full w-full h-full transform scale-0 hover:scale-100 transition-transform duration-300"></div>
          <UserIcon className="h-3.5 w-3.5 mr-2 opacity-80" />
          <span>Se connecter</span>
        </Button>
        
        <Button 
          variant="outline" 
          className="w-full py-2 h-auto text-sm border-vynal-purple-secondary/20 hover:border-vynal-accent-primary/40 hover:bg-vynal-purple-secondary/5 transition-colors"
          onClick={() => navigateAndClose('/auth/signup')}
        >
          <UserPlus className="h-3.5 w-3.5 mr-2 opacity-80" />
          <span>S'inscrire</span>
        </Button>
      </div>
      
      {/* Section découverte */}
      <div className="mt-6 px-4">
        <div className="text-center">
          <p className="text-[11px] font-medium text-vynal-text-secondary/80 mb-3">Explorer notre marketplace</p>
          <div className="grid grid-cols-2 gap-3">
            <Button 
              variant="ghost" 
              className="flex flex-col items-center py-3 px-2 text-xs group hover:bg-vynal-purple-secondary/5 transition-colors rounded-lg h-auto"
              onClick={() => navigateAndClose('/how-it-works')}
            >
              <div className="mb-1 h-7 w-7 rounded-full bg-vynal-purple-secondary/10 flex items-center justify-center group-hover:bg-vynal-purple-secondary/20 transition-colors">
                <HelpCircle className="h-3 w-3 text-vynal-accent-primary" />
              </div>
              <span className="text-[9px]">En savoir plus</span>
            </Button>
            
            <Button 
              variant="ghost" 
              className="flex flex-col items-center py-3 px-2 text-xs group hover:bg-vynal-purple-secondary/5 transition-colors rounded-lg h-auto"
              onClick={() => navigateAndClose('/services')}
            >
              <div className="mb-1 h-7 w-7 rounded-full bg-vynal-purple-secondary/10 flex items-center justify-center group-hover:bg-vynal-purple-secondary/20 transition-colors">
                <Briefcase className="h-3 w-3 text-vynal-accent-primary" />
              </div>
              <span className="text-[9px]">Services</span>
            </Button>
          </div>
        </div>
      </div>
      
      {/* Pied de page */}
      <div className="mt-auto border-t dark:border-vynal-purple-secondary/10 py-4 px-4">
        <div className="flex items-center justify-between">
          <div className="flex space-x-2">
            <Button 
              variant="ghost" 
              size="sm"
              className="h-8 w-8 p-0 rounded-full flex items-center justify-center text-vynal-text-secondary/70 hover:text-vynal-accent-primary"
              onClick={() => navigateAndClose('/about')}
            >
              <MessageCircle className="h-3.5 w-3.5" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              className="h-8 w-8 p-0 rounded-full flex items-center justify-center text-vynal-text-secondary/70 hover:text-vynal-accent-primary"
              onClick={() => navigateAndClose('/contact')}
            >
              <HelpCircle className="h-3.5 w-3.5" />
            </Button>
          </div>
          <span className="text-[8px] text-vynal-text-secondary/60">VynaPlatform © {new Date().getFullYear()}</span>
        </div>
      </div>
    </div>
  );
});

UnauthenticatedMenuContent.displayName = 'UnauthenticatedMenuContent';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  activePath: string;
  setActivePath: (path: string) => void;
  isNavigating: boolean;
}

export default function MobileMenu({ isOpen, onClose, user, activePath, setActivePath, isNavigating }: MobileMenuProps) {
  const { theme } = useTheme();
  const { signOut } = useAuth();
  const { logout } = useLogout();
  const isDark = theme === 'dark';
  const router = useRouter();
  
  // Notifications non lues - optimisé avec useMemo pour éviter les recalculs
  const { totalUnreadCount } = useUserNotifications(user?.id);
  
  // Fonction mémorisée pour vérifier si un chemin est actif
  const isActive = useCallback((path: string) => activePath === path, [activePath]);
  
  // Mémorisez les gestionnaires d'événements pour éviter les recréations
  const handleSignOut = useCallback(() => {
    // Indiquer que la navigation commence
    NavigationLoadingState.setIsNavigating(true);
    
    // Fermer le menu mobile
    onClose();
    
    // Utiliser le hook logout optimisé qui gère la redirection
    logout();
  }, [logout, onClose]);
  
  // Naviguer et fermer le menu
  const navigateAndClose = useCallback((path: string) => {
    onClose();
    router.push(path);
  }, [onClose, router]);

  // Fonction pour naviguer vers la page d'accueil via le logo
  const navigateToHome = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    onClose();
    router.push('/');
  }, [onClose, router]);
  
  // Empêcher le scroll du body quand le menu est ouvert
  useEffect(() => {
    if (!isOpen) return;
    
    // Sauvegarder la position de scroll
    const scrollY = window.scrollY;
    
    // Fixer le body pour éviter le décalage
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.top = `-${scrollY}px`;
    
    // Nettoyer lors de la fermeture ou du démontage
    return () => {
      // Restaurer la position
      const recoveredScrollY = parseInt(document.body.style.top || '0') * -1;
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.top = '';
      window.scrollTo(0, recoveredScrollY);
    };
  }, [isOpen]);

  // Mémoriser les callbacks de clic pour chaque item du menu
  const navItemCallbacks = useMemo(() => {
    return {
      dashboard: () => { setActivePath("/dashboard"); onClose(); },
      orders: () => { setActivePath("/dashboard/orders"); onClose(); },
      messages: () => { setActivePath("/dashboard/messages"); onClose(); },
      disputes: () => { setActivePath("/dashboard/disputes"); onClose(); },
      wallet: () => { setActivePath("/dashboard/wallet"); onClose(); },
      services: () => { setActivePath("/dashboard/services"); onClose(); },
      stats: () => { setActivePath("/dashboard/stats"); onClose(); },
      certifications: () => { setActivePath("/dashboard/certifications"); onClose(); },
      profile: () => { setActivePath("/dashboard/profile"); onClose(); },
      settings: () => { setActivePath("/dashboard/settings"); onClose(); }
    };
  }, [setActivePath, onClose]);
  
  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="left" className={`w-[280px] p-0 ${isDark ? 'bg-vynal-purple-dark border-vynal-purple-secondary/20' : 'bg-white'}`}>
        <div className="flex flex-col h-full">
          {/* En-tête - Extrait en composant */}
          <MobileMenuHeader 
            user={user} 
            onClose={onClose} 
            navigateToHome={navigateToHome} 
          />
          
          {/* Contenu différent selon l'état d'authentification - Composants distincts */}
          {user ? (
            <AuthenticatedMenuContent 
              totalUnreadCount={totalUnreadCount}
              isActive={isActive}
              navItemCallbacks={navItemCallbacks}
              isNavigating={isNavigating}
              handleSignOut={handleSignOut}
            />
          ) : (
            <UnauthenticatedMenuContent 
              navigateAndClose={navigateAndClose} 
            />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
} 