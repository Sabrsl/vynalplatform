import React, { useCallback, useEffect, useMemo, memo, useState } from 'react';
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
import { useUser } from '@/hooks/useUser';
import { PUBLIC_ROUTES, AUTH_ROUTES, CLIENT_ROUTES, FREELANCE_ROUTES } from '@/config/routes';
import Image from 'next/image';
import { Loader } from "@/components/ui/loader";

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
  HelpCircle,
  Plus,
  Moon,
  Sun,
  Book,
  Users,
  LayoutDashboard
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
  const { profile } = useUser();
  const isDark = theme === 'dark';
  
  // Détermine le rôle de manière fiable
  const userRole = useMemo(() => {
    if (user?.user_metadata?.role) {
      return user.user_metadata.role;
    }
    if (profile?.role) {
      return profile.role;
    }
    return null;
  }, [user?.user_metadata?.role, profile?.role]);
  
  const isClient = userRole === 'client';
  
  return (
    <div className="p-3 flex items-center justify-between border-b dark:border-vynal-purple-secondary/20">
      <div className="flex items-center space-x-2">
        <span 
          className="bg-gradient-to-br from-vynal-accent-primary to-vynal-accent-secondary h-7 w-7 rounded-lg flex items-center justify-center shadow-md shadow-vynal-accent-primary/20 cursor-pointer hover:scale-105 transition-transform"
          onClick={navigateToHome}
        >
          <Image 
            src="/assets/logo/logo_vynal_platform_simple.svg" 
            alt="Vynal Platform Logo" 
            className="h-5 w-auto dark:brightness-110 transition-all duration-300" 
            width={20}
            height={20}
            priority
          />
        </span>
        <div 
          className="cursor-pointer"
          onClick={navigateToHome}
        >
          <h1 className="text-xs font-bold text-vynal-purple-light dark:text-vynal-text-primary">Vynal Platform</h1>
          {user && (
            <p className="text-[9px] text-vynal-purple-secondary dark:text-vynal-text-secondary">
              {isClient ? "Espace Client" : "Espace Freelance"}
            </p>
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

// Fonction utilitaire pour déterminer le rôle de manière fiable
const determineUserRole = (user: User | null, profile: any): string | null => {
  // Vérifier d'abord les métadonnées (plus rapide)
  if (user?.user_metadata?.role) {
    return user.user_metadata.role;
  }
  
  // Ensuite vérifier le profil (plus fiable)
  if (profile?.role) {
    return profile.role;
  }
  
  return null;
};

// Composant de chargement pour les états intermédiaires
const LoadingMenuContent = memo(() => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  return (
    <div className="flex flex-col items-center justify-center flex-1 p-6">
      <Loader size="md" variant="secondary" className="mb-4" aria-hidden="true" />
      <p className={`text-xs ${isDark ? 'text-vynal-text-secondary' : 'text-vynal-purple-dark/70'}`}>
        Chargement de votre espace...
      </p>
    </div>
  );
});

LoadingMenuContent.displayName = 'LoadingMenuContent';

interface NavItemConfig {
  href: string;
  icon: React.ElementType;
  label: string;
  badge?: number;
  callback: string;
}

// Composant pour le contenu des utilisateurs authentifiés
const AuthenticatedMenuContent = memo(({ 
  totalUnreadCount, 
  isActive, 
  navItemCallbacks, 
  isNavigating, 
  handleSignOut,
  setActivePath,
  onClose,
  router,
  userRole,
  activePath
}: { 
  totalUnreadCount: number; 
  isActive: (path: string) => boolean; 
  navItemCallbacks: Record<string, () => void>; 
  isNavigating: boolean;
  handleSignOut: () => void;
  setActivePath: (path: string) => void;
  onClose: () => void;
  router: any;
  userRole: string | null;
  activePath: string;
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  // Déterminer le rôle de manière plus fiable
  const isClient = userRole === 'client';
  const isFreelance = userRole === 'freelance';
  
  // Utiliser le bon préfixe de dashboard en fonction du rôle
  const dashboardPrefix = isClient 
    ? CLIENT_ROUTES.DASHBOARD 
    : isFreelance 
      ? FREELANCE_ROUTES.DASHBOARD 
      : '/'; // Rediriger vers l'accueil si le rôle n'est pas déterminé
  
  // Centralisons la configuration des items de menu selon le rôle
  const menuConfig = useMemo(() => {
    // Structure commune des menus par section
    const menus = {
      principal: [
        {
          href: PUBLIC_ROUTES.HOME,
          icon: Home,
          label: "Accueil",
          callback: "home"
        },
        {
          href: dashboardPrefix,
          icon: Home,
          label: "Tableau de bord",
          callback: "dashboard"
        },
        {
          href: isClient ? CLIENT_ROUTES.ORDERS : FREELANCE_ROUTES.ORDERS,
          icon: ShoppingBag,
          label: "Commandes",
          callback: "orders"
        },
        {
          href: isClient ? CLIENT_ROUTES.MESSAGES : FREELANCE_ROUTES.MESSAGES,
          icon: MessageSquare,
          label: "Messages",
          badge: totalUnreadCount,
          callback: "messages"
        },
        {
          href: isClient ? CLIENT_ROUTES.DISPUTES : FREELANCE_ROUTES.DISPUTES,
          icon: AlertTriangle,
          label: "Litiges",
          callback: "disputes"
        },
        {
          href: isClient ? CLIENT_ROUTES.PAYMENTS : FREELANCE_ROUTES.WALLET,
          icon: CreditCard,
          label: isClient ? "Paiements" : "Wallet",
          callback: "wallet"
        }
      ],
      // Services - uniquement pour les freelances
      services: isFreelance ? [
        {
          href: FREELANCE_ROUTES.SERVICES,
          icon: FileText,
          label: "Mes services",
          callback: "services"
        }
      ] : [],
      // Actions - uniquement pour les clients
      actions: isClient ? [
        {
          href: "/services",
          icon: FileText,
          label: "Trouver un service",
          callback: "findService"
        },
        {
          href: `${CLIENT_ROUTES.DASHBOARD}/favorites`,
          icon: Heart,
          label: "Favoris",
          callback: "favorites"
        }
      ] : [],
      // Profil - pour tous les utilisateurs
      profil: [
        {
          href: isClient ? CLIENT_ROUTES.PROFILE : FREELANCE_ROUTES.PROFILE,
          icon: UserIcon,
          label: "Mon profil",
          callback: "profile"
        },
        {
          href: isClient ? CLIENT_ROUTES.SETTINGS : FREELANCE_ROUTES.SETTINGS,
          icon: Settings,
          label: "Paramètres",
          callback: "settings"
        },
        {
          href: "/contact",
          icon: HelpCircle,
          label: "Aide",
          callback: "help"
        }
      ]
    };
    
    return menus;
  }, [dashboardPrefix, isClient, isFreelance, totalUnreadCount]);
  
  // Fonction pour rendre une section de menu
  const renderMenuSection = useCallback((title: string, items: NavItemConfig[]) => {
    if (items.length === 0) return null;
    
    return (
      <div>
        <p className={`px-2 text-[10px] font-semibold uppercase mb-1 ${title !== 'principal' ? 'mt-4' : ''} ${
          isDark ? "text-vynal-text-secondary" : "text-vynal-purple-400"
        }`}>
          {title === 'principal' ? 'Principal' : 
           title === 'services' ? 'Services' : 
           title === 'actions' ? 'Actions' : 'Profil'}
        </p>
        <div>
          {items.map((item, i) => (
            <NavItem 
              key={`${title}-item-${i}`}
              href={item.href} 
              icon={item.icon} 
              label={item.label} 
              isActive={isActive(item.href)}
              onClick={navItemCallbacks[item.callback] || (() => {})} // Fallback pour éviter les erreurs
              isNavigating={isNavigating}
              badgeCount={item.badge}
            />
          ))}
        </div>
      </div>
    );
  }, [isActive, navItemCallbacks, isNavigating, isDark]);
  
  // Avertissement pour le mauvais dashboard
  const isInWrongDashboard = (isClient && activePath.startsWith('/dashboard')) || 
                            (isFreelance && activePath.startsWith('/client-dashboard'));
  
  return (
    <>
      {isInWrongDashboard && (
        <div className="px-4 py-2 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800/20">
          <div className="flex items-center">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-500 mr-2" />
            <p className="text-[10px] text-amber-800 dark:text-amber-400">
              Vous êtes dans le mauvais tableau de bord. Accédez à{' '}
              <button 
                className="font-medium underline"
                onClick={() => {
                  onClose();
                  router.push(dashboardPrefix);
                }}
              >
                votre espace
              </button>
            </p>
          </div>
        </div>
      )}
      
      <ScrollArea className="flex-1">
        <div className="p-3">
          {renderMenuSection('principal', menuConfig.principal)}
          {renderMenuSection('services', menuConfig.services)}
          {renderMenuSection('actions', menuConfig.actions)}
          {renderMenuSection('profil', menuConfig.profil)}
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
          <h3 className="text-base font-medium text-slate-800 dark:text-vynal-text-primary">
            Bienvenue sur Vynal
          </h3>
          <p className="text-[11px] leading-tight text-slate-600 dark:text-vynal-text-secondary max-w-[180px] mx-auto">
            Connectez-vous pour accéder à votre espace et gérer vos projets
          </p>
        </div>
      </div>
      
      {/* Boutons d'action */}
      <div className="p-5 space-y-3">
        <Button 
          variant="default" 
          className="w-full py-2 h-auto text-sm relative overflow-hidden bg-gradient-to-r from-vynal-accent-primary to-vynal-accent-secondary hover:from-vynal-accent-primary/95 hover:to-vynal-accent-secondary/95 shadow hover:shadow-md transition-all text-slate-800 dark:text-white"
          onClick={() => navigateAndClose(AUTH_ROUTES.LOGIN)}
        >
          <div className="absolute inset-0 bg-white/5 rounded-full w-full h-full transform scale-0 hover:scale-100 transition-transform duration-300"></div>
          <UserIcon className="h-3.5 w-3.5 mr-2" />
          <span>Se connecter</span>
        </Button>
        
        <Button 
          variant="outline" 
          className="w-full py-2 h-auto text-sm border-slate-200 dark:border-vynal-purple-secondary/20 hover:border-vynal-accent-primary/40 hover:bg-slate-50 dark:hover:bg-vynal-purple-secondary/5 transition-colors text-slate-700 dark:text-vynal-text-secondary"
          onClick={() => navigateAndClose(AUTH_ROUTES.REGISTER)}
        >
          <UserPlus className="h-3.5 w-3.5 mr-2 text-slate-700 dark:text-vynal-text-secondary" />
          <span>S'inscrire</span>
        </Button>
      </div>
      
      {/* Section découverte */}
      <div className="mt-6 px-4">
        <div className="text-center">
          <p className="text-[11px] font-medium text-slate-600 dark:text-vynal-text-secondary/80 mb-3">Explorer notre marketplace</p>
          <div className="grid grid-cols-2 gap-3">
            <Button 
              variant="ghost" 
              className="flex flex-col items-center py-3 px-2 text-xs group hover:bg-vynal-purple-secondary/5 transition-colors rounded-lg h-auto"
              onClick={() => navigateAndClose(PUBLIC_ROUTES.HOW_IT_WORKS)}
            >
              <div className="mb-1 h-7 w-7 rounded-full bg-vynal-purple-secondary/10 flex items-center justify-center group-hover:bg-vynal-purple-secondary/20 transition-colors">
                <HelpCircle className="h-3 w-3 text-vynal-accent-primary" />
              </div>
              <span className="text-[9px]">En savoir plus</span>
            </Button>
            
            <Button 
              variant="ghost" 
              className="flex flex-col items-center py-3 px-2 text-xs group hover:bg-vynal-purple-secondary/5 transition-colors rounded-lg h-auto"
              onClick={() => navigateAndClose(PUBLIC_ROUTES.SERVICES)}
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
              className="h-8 w-8 p-0 rounded-full flex items-center justify-center text-slate-600 dark:text-vynal-text-secondary/70 hover:text-vynal-accent-primary"
              onClick={() => navigateAndClose(PUBLIC_ROUTES.ABOUT)}
            >
              <MessageCircle className="h-3.5 w-3.5" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              className="h-8 w-8 p-0 rounded-full flex items-center justify-center text-slate-600 dark:text-vynal-text-secondary/70 hover:text-vynal-accent-primary"
              onClick={() => navigateAndClose(PUBLIC_ROUTES.CONTACT)}
            >
              <HelpCircle className="h-3.5 w-3.5" />
            </Button>
          </div>
          <span className="text-[8px] text-slate-500 dark:text-vynal-text-secondary/60">VynaPlatform © {new Date().getFullYear()}</span>
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
  const auth = useAuth();
  const { logout } = useLogout();
  const userProfile = useUser();
  const isDark = theme === 'dark';
  const router = useRouter();
  
  // État pour suivre si le rôle est vérifié
  const [roleVerified, setRoleVerified] = useState(false);
  
  // Déterminer le rôle de manière fiable
  const userRole = useMemo(() => {
    return determineUserRole(user, userProfile.profile);
  }, [user, userProfile.profile]);
  
  // Synchroniser les rôles si nécessaire
  useEffect(() => {
    if (user?.id && userProfile.profile && !userProfile.loading && !auth.loading) {
      const metadataRole = user.user_metadata?.role;
      const profileRole = userProfile.profile.role;
      
      // Vérifier s'il y a des incohérences
      if ((metadataRole && !profileRole) || (!metadataRole && profileRole) || 
          (metadataRole && profileRole && metadataRole !== profileRole)) {
        // Utiliser la fonction de synchronisation des rôles
        if (auth.syncUserRole) {
          auth.syncUserRole(user.id, metadataRole, profileRole)
            .then(() => {
              // Marquer que la vérification est terminée
              setRoleVerified(true);
            });
        } else {
          // Fallback si syncUserRole n'est pas disponible
          console.warn("La fonction syncUserRole n'est pas disponible dans le hook useAuth");
          setRoleVerified(true);
        }
      } else {
        // Pas d'incohérence, marquer comme vérifié
        setRoleVerified(true);
      }
    }
  }, [user?.id, user?.user_metadata?.role, userProfile.profile, userProfile.loading, auth]);
  
  // Notifications non lues
  const { totalUnreadCount } = useUserNotifications(user?.id);
  
  // Fonction pour vérifier si un chemin est actif
  const isActive = useCallback((path: string) => activePath === path, [activePath]);
  
  // Fonction pour la déconnexion
  const handleSignOut = useCallback(() => {
    NavigationLoadingState.setIsNavigating(true);
    onClose();
    
    // Utiliser la fonction de déconnexion centralisée avec gestion d'erreur
    import('@/lib/auth').then(m => m.signOut())
      .catch(error => {
        console.error("Erreur lors de la déconnexion depuis le menu mobile:", error);
        // Redirection de secours en cas d'erreur
        setTimeout(() => {
          window.location.href = '/?nocache=' + Date.now();
        }, 500);
      });
  }, [onClose]);
  
  // Naviguer et fermer le menu
  const navigateAndClose = useCallback((path: string) => {
    onClose();
    router.push(path);
  }, [onClose, router]);

  // Fonction pour naviguer vers la page d'accueil via le logo
  const navigateToHome = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    onClose();
    router.push(PUBLIC_ROUTES.HOME);
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
    const callbacks: Record<string, () => void> = {
      home: () => {
        setActivePath(PUBLIC_ROUTES.HOME);
        onClose();
        router.push(PUBLIC_ROUTES.HOME);
      },
      dashboard: () => { 
        const dashPath = userRole === 'client' ? CLIENT_ROUTES.DASHBOARD : FREELANCE_ROUTES.DASHBOARD;
        setActivePath(dashPath); 
        onClose(); 
        router.push(dashPath); 
      },
      orders: () => { 
        const ordersRoute = userRole === 'client' ? CLIENT_ROUTES.ORDERS : FREELANCE_ROUTES.ORDERS;
        setActivePath(ordersRoute); 
        onClose(); 
        router.push(ordersRoute); 
      },
      messages: () => { 
        // Rediriger vers la page principale des messages (liste des conversations)
        const messagesRoute = userRole === 'client' ? CLIENT_ROUTES.MESSAGES : FREELANCE_ROUTES.MESSAGES;
        
        // S'assurer qu'on ne redirige pas vers une conversation spécifique
        // mais vers la liste principale des conversations
        const baseMessagesRoute = messagesRoute.split('/').slice(0, 3).join('/');
        
        setActivePath(baseMessagesRoute); 
        onClose(); 
        router.push(baseMessagesRoute); 
      },
      disputes: () => { 
        const disputesRoute = userRole === 'client' ? CLIENT_ROUTES.DISPUTES : FREELANCE_ROUTES.DISPUTES;
        setActivePath(disputesRoute); 
        onClose(); 
        router.push(disputesRoute); 
      },
      wallet: () => { 
        const walletRoute = userRole === 'client' ? CLIENT_ROUTES.PAYMENTS : FREELANCE_ROUTES.WALLET;
        setActivePath(walletRoute); 
        onClose(); 
        router.push(walletRoute); 
      },
      profile: () => { 
        const profileRoute = userRole === 'client' ? CLIENT_ROUTES.PROFILE : FREELANCE_ROUTES.PROFILE;
        setActivePath(profileRoute); 
        onClose(); 
        router.push(profileRoute); 
      },
      settings: () => { 
        const settingsRoute = userRole === 'client' ? CLIENT_ROUTES.SETTINGS : FREELANCE_ROUTES.SETTINGS;
        setActivePath(settingsRoute); 
        onClose(); 
        router.push(settingsRoute); 
      },
      findService: () => {
        setActivePath("/services");
        onClose();
        router.push("/services");
      },
      favorites: () => {
        setActivePath(`${CLIENT_ROUTES.DASHBOARD}/favorites`);
        onClose();
        router.push(`${CLIENT_ROUTES.DASHBOARD}/favorites`);
      },
      help: () => {
        setActivePath("/contact");
        onClose();
        router.push("/contact");
      }
    };
    
    // Ajouter les callbacks spécifiques aux freelances si l'utilisateur est un freelance
    if (userRole === 'freelance') {
      callbacks.services = () => { 
        setActivePath(FREELANCE_ROUTES.SERVICES); 
        onClose(); 
        router.push(FREELANCE_ROUTES.SERVICES); 
      };
    }
    
    return callbacks;
  }, [setActivePath, onClose, router, userRole]);
  
  // Déterminer l'état du menu à afficher
  const isLoading = auth.loading || userProfile.loading || (user && !roleVerified);
  
  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="left" className={`w-[280px] p-0 ${isDark ? 'bg-vynal-purple-dark border-vynal-purple-secondary/20' : 'bg-white'}`}>
        <div className="flex flex-col h-full">
          {/* En-tête */}
          <MobileMenuHeader 
            user={user} 
            onClose={onClose} 
            navigateToHome={navigateToHome} 
          />
          
          {/* Contenu différent selon l'état */}
          {isLoading ? (
            <LoadingMenuContent />
          ) : user ? (
            <AuthenticatedMenuContent 
              totalUnreadCount={totalUnreadCount}
              isActive={isActive}
              navItemCallbacks={navItemCallbacks}
              isNavigating={isNavigating}
              handleSignOut={handleSignOut}
              setActivePath={setActivePath}
              onClose={onClose}
              router={router}
              userRole={userRole}
              activePath={activePath}
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