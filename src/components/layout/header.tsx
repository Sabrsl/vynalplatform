"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback, memo } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useUser } from "@/hooks/useUser";
import { Button } from "@/components/ui/button";
import SearchBar from "@/components/categories/SearchBar";
import { supabase } from "@/lib/supabase/client";
import MobileMenu from "@/components/MobileMenu";
import { OrderNotificationIndicator } from "@/components/notifications/OrderNotificationIndicator";
import { NavigationLoadingState } from "@/app/providers";
import { 
  User, 
  LogOut, 
  Menu, 
  X, 
  Home, 
  Briefcase, 
  Heart, 
  MessageSquare, 
  PlusCircle,
  Search,
  Wallet,
  ChevronDown,
  Loader,
  Keyboard
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useTheme } from "next-themes";
import { DropdownMenu, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import Image from "next/image";

// Données de navigation mémorisées en dehors du composant
const BASE_NAVIGATION = [
  { name: "Accueil", href: "/", icon: Home },
  { name: "Explorer", href: "/services", icon: Briefcase },
];

// Créer des types pour bien définir les données
type NavigationItem = {
  name: string;
  href: string;
  icon: React.ComponentType<any>;
};

type UserStatus = {
  isAuthenticated: boolean;
  authLoading: boolean;
  profileLoading: boolean;
  avatarUrl: string | null;
  username: string | null;
  isFreelance: boolean;
  isClient: boolean;
  isAdmin: boolean;
};

// Composant optimisé pour les boutons de navigation
const NavButton = memo(({ 
  item, 
  isActive, 
  isNavigating, 
  activePath, 
  onClick 
}: { 
  item: NavigationItem, 
  isActive: (path: string) => boolean,
  isNavigating: boolean,
  activePath: string,
  onClick: (href: string) => void
}) => {
  return (
    <Button
      variant="ghost"
      size="sm"
      className={`text-sm flex items-center gap-2 ${
        isActive(item.href)
        ? "text-vynal-purple-600 dark:text-vynal-accent-primary" 
        : "text-vynal-purple-dark dark:text-vynal-text-primary"
      } rounded-lg hover:bg-vynal-purple-100/60 hover:text-vynal-purple-600 dark:hover:bg-vynal-purple-secondary/20 dark:hover:text-vynal-accent-primary`}
      onClick={() => onClick(item.href)}
      disabled={isNavigating}
    >
      {isNavigating ? (
        <Loader className="h-3.5 w-3.5" strokeWidth={2.5} />
      ) : (
        <item.icon className="h-3.5 w-3.5" strokeWidth={2.5} />
      )}
      {item.name}
    </Button>
  );
});

NavButton.displayName = 'NavButton';

// Composant principal du Header
function Header() {
  // États
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchBarVisible, setSearchBarVisible] = useState<boolean>(false);
  const [isScrolled, setIsScrolled] = useState<boolean>(false);
  const [isLoggingOut, setIsLoggingOut] = useState<boolean>(false);
  const [activePath, setActivePath] = useState<string>('');
  const [isNavigating, setIsNavigating] = useState<boolean>(false);
  const [isMounted, setIsMounted] = useState<boolean>(false);
  
  // Références
  const searchBarRef = useRef<HTMLDivElement>(null);
  const searchButtonRef = useRef<HTMLButtonElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  
  // Hooks Next.js
  const router = useRouter();
  const pathname = usePathname();
  const { theme } = useTheme();
  
  // Hooks personnalisés
  const auth = useAuth();
  const userProfile = useUser();
  
  // Effet d'initialisation
  useEffect(() => {
    setIsMounted(true);
    if (pathname) {
      setActivePath(pathname);
    }
  }, [pathname]);
  
  // Suivi du défilement pour les effets visuels
  useEffect(() => {
    if (!isMounted) return;
    
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isMounted]);
  
  // Gestion des états de navigation
  useEffect(() => {
    if (!isMounted) return;
    
    const handleNavigationStateChange = (event: Event) => {
      const customEvent = event as CustomEvent;
      setIsNavigating(customEvent.detail?.isNavigating || false);
    };
    
    window.addEventListener('vynal:navigation-state-changed', handleNavigationStateChange);
    
    return () => {
      window.removeEventListener('vynal:navigation-state-changed', handleNavigationStateChange);
    };
  }, [isMounted]);
  
  // Détection des clics à l'extérieur de la barre de recherche
  useEffect(() => {
    if (!isMounted || !searchBarVisible) return;
    
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchBarRef.current &&
        !searchBarRef.current.contains(event.target as Node) &&
        searchButtonRef.current &&
        !searchButtonRef.current.contains(event.target as Node)
      ) {
        setSearchBarVisible(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [searchBarVisible, isMounted]);
  
  // Raccourcis clavier
  useEffect(() => {
    if (!isMounted) return;
    
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ctrl+K ou Cmd+K pour la recherche
      if ((e.ctrlKey || e.metaKey) && e.key === 'k' && pathname?.includes('/services')) {
        e.preventDefault();
        setSearchBarVisible(true);
        setTimeout(() => {
          const searchInput = searchBarRef.current?.querySelector('input');
          if (searchInput) {
            searchInput.focus();
          }
        }, 100);
      }
      
      // Échap pour fermer la barre de recherche
      if (e.key === 'Escape' && searchBarVisible) {
        setSearchBarVisible(false);
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isMounted, searchBarVisible, pathname]);
  
  // Gestionnaires optimisés
  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      NavigationLoadingState.setIsNavigating(true);
      router.push(`/services?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchBarVisible(false);
    }
  }, [searchQuery, router]);
  
  const toggleSearchBar = useCallback(() => {
    setSearchBarVisible(prev => {
      const newState = !prev;
      if (newState) {
        setTimeout(() => {
          const searchInput = searchBarRef.current?.querySelector('input');
          if (searchInput) {
            searchInput.focus();
          }
        }, 100);
      }
      return newState;
    });
  }, []);
  
  const handleNavigation = useCallback((href: string) => {
    if (href === pathname || isNavigating) {
      return;
    }
    
    NavigationLoadingState.setIsNavigating(true);
    setActivePath(href);
    router.push(href);
  }, [pathname, isNavigating, router]);
  
  const handleLogout = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (isLoggingOut) return;
    
    setIsLoggingOut(true);
    
    try {
      await auth.signOut();
      
      // Nettoyage des tokens locaux
      localStorage.removeItem('supabase.auth.token');
      localStorage.removeItem('sb-refresh-token');
      localStorage.removeItem('sb-access-token');
      
      await supabase.auth.signOut();
      
      // Redirection après un court délai
      setTimeout(() => {
        window.location.href = '/';
      }, 500);
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
      setIsLoggingOut(false);
      
      // Redirection de secours en cas d'erreur
      setTimeout(() => {
        window.location.href = '/';
      }, 1000);
    }
  }, [auth, isLoggingOut]);
  
  // Fonctions utilitaires mémorisées
  const isActive = useCallback((path: string) => {
    return pathname === path || pathname?.startsWith(`${path}/`);
  }, [pathname]);
  
  // Définir la navigation en fonction du rôle de l'utilisateur
  const authenticatedNavigation = useMemo(() => [
    ...(userProfile.profile?.role === 'freelance' ? [
      { name: "Mes Services", href: "/dashboard/services", icon: Briefcase },
      { name: "Créer un Service", href: "/dashboard/services/new", icon: PlusCircle },
    ] : []),
    ...(userProfile.profile?.role === 'client' ? [
      { name: "Favoris", href: "/dashboard/favorites", icon: Heart },
    ] : []),
    { name: "Commandes", href: "/dashboard/orders", icon: Briefcase },
    { name: "Messages", href: "/dashboard/messages", icon: MessageSquare },
    { name: "Wallet", href: "/dashboard/wallet", icon: Wallet },
    { name: "Profil", href: "/dashboard/profile", icon: User },
  ], [
    userProfile.profile?.role
  ]);
  
  // Si l'app n'est pas montée, afficher un placeholder simple
  if (!isMounted) {
    return <header className="h-16 sticky top-0 z-50" />;
  }
  
  // Variables dérivées
  const isDark = theme === 'dark';
  const isAuthenticated = auth.isAuthenticated;
  const user = auth.user;
  const profile = userProfile.profile;
  const isInDashboard = pathname?.startsWith('/dashboard');
  
  // Préparation des données
  const userStatus: UserStatus = {
    isAuthenticated,
    authLoading: auth.loading,
    profileLoading: userProfile.loading,
    avatarUrl: profile?.avatar_url || null,
    username: profile?.username || user?.email?.split('@')[0] || null,
    isFreelance: profile?.role === 'freelance',
    isClient: profile?.role === 'client',
    isAdmin: profile?.role === 'admin'
  };
  
  // Rendu principal avec des animations et optimisations
  return (
    <header 
      ref={headerRef}
      className={`sticky top-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? isDark 
            ? "bg-vynal-purple-dark/90 backdrop-blur-md shadow-lg" 
            : "bg-white/90 backdrop-blur-md shadow-lg"
          : isDark 
            ? "bg-gradient-vynal border-b border-vynal-purple-secondary/20" 
            : "bg-gradient-to-b from-vynal-purple-100 to-white/90 border-b border-vynal-purple-200/30"
      }`}
    >
      {/* Éléments décoratifs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute -top-24 -right-24 w-60 h-60 ${
          isDark ? "bg-vynal-accent-secondary/10" : "bg-vynal-purple-300/20"
        } rounded-full blur-3xl opacity-50`}></div>
        <div className={`absolute -bottom-24 -left-24 w-60 h-60 ${
          isDark ? "bg-vynal-accent-primary/10" : "bg-vynal-purple-400/15"
        } rounded-full blur-3xl opacity-50`}></div>
        
        <div className={`absolute inset-0 bg-[url('/img/grid-pattern.svg')] bg-center ${
          isDark ? "opacity-5" : "opacity-10"
        }`}></div>
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="flex justify-between items-center h-16">
          {/* Logo avec animation */}
          <div
            className="flex items-center group cursor-pointer"
            onClick={(e) => {
              e.preventDefault();
              router.push('/');
            }}
          >
            <Image 
              src="/assets/logo/logo_vynal_platform.webp" 
              alt="Vynal Platform Logo" 
              className="h-1.5 sm:h-2 md:h-3 w-auto dark:brightness-110 transition-all duration-300" 
              width={60}
              height={12}
              style={{ height: 'auto' }}
              priority
            />
          </div>

          {/* Search Bar - Desktop */}
          {pathname?.includes('/services') && (
            <div className="hidden md:block w-[350px] max-w-md transition-all">
              <SearchBar 
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onSearch={handleSearch}
                className="shadow-sm h-9 border-0 dark:bg-vynal-purple-dark/50 dark:border-vynal-purple-secondary/30"
                placeholder="Rechercher un service..."
                autoFocus={false}
              />
            </div>
          )}

          {/* Navigation - Desktop */}
          <nav className="hidden md:flex items-center space-x-1">
            {BASE_NAVIGATION.map((item) => (
              <NavButton
                key={item.name}
                item={item}
                isActive={isActive}
                isNavigating={isNavigating}
                activePath={activePath}
                onClick={handleNavigation}
              />
            ))}
          </nav>

          {/* Auth Buttons / User Menu */}
          <AnimatePresence mode="wait">
            {!userStatus.isAuthenticated && !userStatus.authLoading ? (
              // Options pour utilisateur non connecté
              <motion.div 
                className="flex items-center gap-2"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
              >
                <Link href="/auth/signup" passHref>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-sm text-vynal-purple-dark dark:text-vynal-text-primary hover:text-vynal-purple-dark rounded-lg hover:bg-vynal-purple-100/60 dark:hover:bg-vynal-purple-secondary/20 dark:hover:text-vynal-text-primary hidden sm:flex"
                    onClick={() => NavigationLoadingState.setIsNavigating(true)}
                  >
                    S'inscrire
                  </Button>
                </Link>
                <Link href="/auth/login" passHref>
                  <Button 
                    variant="default" 
                    size="sm" 
                    className="text-sm flex rounded-lg bg-gradient-to-r from-vynal-accent-primary to-vynal-accent-secondary text-white hover:from-vynal-accent-primary/90 hover:to-vynal-accent-secondary/90 shadow-sm hover:shadow-md transition-all"
                    onClick={() => NavigationLoadingState.setIsNavigating(true)}
                  >
                    Se connecter
                  </Button>
                </Link>
              </motion.div>
            ) : userStatus.authLoading || userStatus.profileLoading ? (
              // État de chargement
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Button variant="ghost" size="icon" className="opacity-50 cursor-wait">
                  <Loader className="h-5 w-5 animate-spin text-vynal-purple-secondary dark:text-vynal-text-secondary" strokeWidth={2.5} />
                </Button>
              </motion.div>
            ) : (
              // Utilisateur connecté
              <motion.div 
                className="flex items-center gap-1 sm:gap-2"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
              >
                {/* Notifications uniquement pour les freelances */}
                {userStatus.isFreelance && (
                  <OrderNotificationIndicator />
                )}
                
                {/* Bouton du tableau de bord */}
                <Button
                  variant="ghost"
                  size="sm"
                  className={`hidden sm:flex text-sm items-center gap-2 rounded-lg ${
                    activePath.includes('/dashboard') 
                      ? "text-vynal-purple-600 dark:text-vynal-accent-primary" 
                      : "text-vynal-purple-dark dark:text-vynal-text-primary"
                  } hover:bg-vynal-purple-100/60 hover:text-vynal-purple-600 dark:hover:bg-vynal-purple-secondary/20 dark:hover:text-vynal-accent-primary`}
                  onClick={() => handleNavigation('/dashboard')}
                >
                  {isNavigating && activePath === '/dashboard' ? (
                    <Loader className="h-3.5 w-3.5 animate-spin" strokeWidth={2.5} />
                  ) : (
                    <Home className="h-3.5 w-3.5" strokeWidth={2.5} />
                  )}
                  Tableau de bord
                </Button>

                {/* Avatar utilisateur - CACHÉ SUR MOBILE */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <motion.button
                      className={`relative h-9 w-9 rounded-full overflow-hidden hidden sm:flex items-center justify-center ${
                        isDark 
                          ? "ring-1 ring-vynal-purple-secondary/40 hover:ring-vynal-accent-primary/60" 
                          : "ring-1 ring-vynal-purple-300/60 hover:ring-vynal-purple-500/60"
                      }`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {userStatus.avatarUrl ? (
                        <Image 
                          src={userStatus.avatarUrl} 
                          alt="Profile" 
                          width={36}
                          height={36}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className={`h-full w-full flex items-center justify-center ${
                          isDark 
                            ? "bg-vynal-purple-secondary text-vynal-accent-primary" 
                            : "bg-vynal-purple-100 text-vynal-purple-600"
                        }`}>
                          <span className="text-sm font-medium">
                            {userStatus.username?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </motion.button>
                  </DropdownMenuTrigger>
                  {/* Dropdown menu content would go here */}
                </DropdownMenu>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Mobile Menu Button and Search Icon */}
          <div className="md:hidden flex items-center gap-3">
            {pathname?.includes('/services') && (
              <button
                ref={searchButtonRef}
                onClick={toggleSearchBar}
                className={`p-1.5 rounded-full transition-all ${
                  isDark 
                    ? "text-vynal-text-secondary hover:text-vynal-accent-primary hover:bg-vynal-purple-secondary/20" 
                    : "text-vynal-purple-500 hover:text-vynal-purple-600 hover:bg-vynal-purple-200/30"
                }`}
                aria-label="Rechercher"
              >
                <Search className="h-4 w-4" strokeWidth={2.5} />
              </button>
            )}
            
            {/* Mobile Menu Button with Profile Picture */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`relative h-9 w-9 rounded-full transition-all duration-300 overflow-hidden ${
                isDark 
                  ? mobileMenuOpen
                    ? "ring-2 ring-vynal-accent-primary ring-offset-1 ring-offset-vynal-purple-dark"
                    : "ring-1 ring-vynal-purple-secondary/40 hover:ring-vynal-accent-primary/60" 
                  : mobileMenuOpen 
                    ? "ring-2 ring-vynal-purple-600 ring-offset-1"
                    : "ring-1 ring-vynal-purple-300/60 hover:ring-vynal-purple-500/60"
              }`}
              aria-label="Menu"
            >
              {/* Si authentifié et profile chargé, afficher l'avatar de l'utilisateur */}
              {isAuthenticated && !userStatus.profileLoading ? (
                userStatus.avatarUrl ? (
                  <Image 
                    src={userStatus.avatarUrl} 
                    alt="Profile" 
                    width={36}
                    height={36}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className={`h-full w-full flex items-center justify-center ${
                    isDark 
                      ? "bg-vynal-purple-secondary text-vynal-accent-primary" 
                      : "bg-vynal-purple-100 text-vynal-purple-600"
                  }`}>
                    <span className="text-sm font-medium">
                      {userStatus.username?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )
              ) : (
                // Si non authentifié ou chargement du profil, montrer l'icône de menu
                <div className={`h-full w-full flex items-center justify-center ${
                  isDark 
                    ? "bg-vynal-purple-secondary/30" 
                    : "bg-vynal-purple-100/80"
                }`}>
                  {mobileMenuOpen ? (
                    <X className={`h-4 w-4 ${
                      isDark ? "text-vynal-accent-primary" : "text-vynal-purple-600"
                    }`} strokeWidth={2.5} />
                  ) : (
                    <Menu className={`h-4 w-4 ${
                      isDark ? "text-vynal-text-primary" : "text-vynal-purple-600"
                    }`} strokeWidth={2.5} />
                  )}
                </div>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Search Bar - Mobile */}
      <AnimatePresence>
        {pathname?.includes('/services') && searchBarVisible && (
          <motion.div 
            ref={searchBarRef}
            className={`px-4 py-3 md:hidden ${
              isDark 
                ? "border-t border-vynal-purple-secondary/20" 
                : "border-t border-vynal-purple-200/30"
            }`}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <div className="relative">
              <SearchBar 
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onSearch={handleSearch}
                className={`h-9 rounded-full shadow-sm ${
                  isDark 
                    ? "border border-vynal-purple-secondary/30 bg-vynal-purple-dark/50 focus-within:bg-vynal-purple-dark/80" 
                    : "border border-vynal-purple-200/50 bg-white/70 focus-within:bg-white/90"
                }`}
                placeholder="Rechercher un service..."
                showFiltersButton={false}
                autoFocus={true}
              />
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1 text-[10px] text-gray-400 px-1.5 py-0.5 bg-gray-100/50 dark:bg-vynal-purple-secondary/20 rounded">
                <Keyboard className="h-3 w-3" />
                <span>ESC</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Menu */}
      <MobileMenu 
        isOpen={mobileMenuOpen} 
        onClose={() => setMobileMenuOpen(false)} 
        user={user} 
        activePath={activePath}
        setActivePath={setActivePath}
        isNavigating={isNavigating}
      />
    </header>
  );
}

export default memo(Header);