import React from 'react';
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
  Heart
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

const NavItem: React.FC<NavItemProps> = ({ 
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
};

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
  const isDark = theme === 'dark';
  const router = useRouter();
  
  // Notifications non lues
  const { totalUnreadCount } = useUserNotifications(user?.id);
  
  const isActive = (path: string) => activePath === path;
  
  const handleSignOut = () => {
    signOut();
    onClose();
  };
  
  // Fonction pour naviguer vers la page d'accueil via le logo
  const navigateToHome = (e: React.MouseEvent) => {
    e.preventDefault();
    onClose();
    router.push('/');
  };
  
  // Empêcher le scroll du body quand le menu est ouvert
  React.useEffect(() => {
    if (isOpen) {
      // Sauvegarder la position de scroll
      const scrollY = window.scrollY;
      
      // Fixer le body pour éviter le décalage
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.top = `-${scrollY}px`;
    } else {
      // Restaurer la position
      const scrollY = parseInt(document.body.style.top || '0') * -1;
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.top = '';
      window.scrollTo(0, scrollY);
    }
    
    return () => {
      // Nettoyer en cas de démontage
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.top = '';
    };
  }, [isOpen]);
  
  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="left" className={`w-[280px] p-0 ${isDark ? 'bg-vynal-purple-dark border-vynal-purple-secondary/20' : 'bg-white'}`}>
        <div className="flex flex-col h-full">
          {/* En-tête */}
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
                <p className="text-[9px] text-vynal-purple-secondary dark:text-vynal-text-secondary">Espace Freelance</p>
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
          
          {/* Navigation */}
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
                    onClick={() => {
                      setActivePath("/dashboard");
                      onClose();
                    }}
                    isNavigating={isNavigating}
                  />
                  <NavItem 
                    href="/dashboard/orders" 
                    icon={ShoppingBag} 
                    label="Commandes reçues" 
                    isActive={isActive("/dashboard/orders")}
                    onClick={() => {
                      setActivePath("/dashboard/orders");
                      onClose();
                    }}
                    isNavigating={isNavigating}
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
                    isNavigating={isNavigating}
                    badgeCount={totalUnreadCount}
                  />
                  <NavItem 
                    href="/dashboard/disputes" 
                    icon={AlertTriangle} 
                    label="Litiges" 
                    isActive={isActive("/dashboard/disputes")}
                    onClick={() => {
                      setActivePath("/dashboard/disputes");
                      onClose();
                    }}
                    isNavigating={isNavigating}
                  />
                  <NavItem 
                    href="/dashboard/wallet" 
                    icon={CreditCard} 
                    label="Paiements" 
                    isActive={isActive("/dashboard/wallet")}
                    onClick={() => {
                      setActivePath("/dashboard/wallet");
                      onClose();
                    }}
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
                    onClick={() => {
                      setActivePath("/dashboard/services");
                      onClose();
                    }}
                    isNavigating={isNavigating}
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
                    isNavigating={isNavigating}
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
                    isNavigating={isNavigating}
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
                    onClick={() => {
                      setActivePath("/dashboard/profile");
                      onClose();
                    }}
                    isNavigating={isNavigating}
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
                    isNavigating={isNavigating}
                  />
                </div>
              </div>
            </div>
          </ScrollArea>
          
          {/* Actions bas de page */}
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
        </div>
      </SheetContent>
    </Sheet>
  );
} 