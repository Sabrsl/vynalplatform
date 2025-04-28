"use client";

import { useState, useEffect, useRef, useMemo } from "react";
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
  Loader
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useTheme } from "next-themes";
import { DropdownMenu, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import Image from "next/image";

export default function Header() {
  // 1. Déclarer tous les états en haut
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchBarVisible, setSearchBarVisible] = useState<boolean>(false);
  const [isScrolled, setIsScrolled] = useState<boolean>(false);
  const [isLoggingOut, setIsLoggingOut] = useState<boolean>(false);
  const [activePath, setActivePath] = useState<string>('');
  const [isNavigating, setIsNavigating] = useState<boolean>(false);
  const [isMounted, setIsMounted] = useState<boolean>(false);
  
  // 2. Toutes les références
  const searchBarRef = useRef<HTMLDivElement>(null);
  const searchButtonRef = useRef<HTMLButtonElement>(null);
  
  // 3. Tous les hooks Next.js
  const router = useRouter();
  const pathname = usePathname();
  const { theme } = useTheme();
  
  // 4. Tous les hooks personnalisés (toujours appelés, mais les données peuvent être ignorées jusqu'au montage)
  const auth = useAuth();
  const userProfile = useUser();
  
  // 5. Tous les useEffect
  useEffect(() => {
    setIsMounted(true);
    if (pathname) {
      setActivePath(pathname);
    }
  }, [pathname]);
  
  useEffect(() => {
    if (!isMounted) return;
    
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isMounted]);
  
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
  
  useEffect(() => {
    if (!isMounted) return;
    
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchBarVisible &&
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
  
  // 6. Fonctions de gestionnaires d'événements
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      NavigationLoadingState.setIsNavigating(true);
      router.push(`/services?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchBarVisible(false);
    }
  };
  
  const toggleSearchBar = () => {
    setSearchBarVisible(!searchBarVisible);
    if (!searchBarVisible) {
      setTimeout(() => {
        const searchInput = searchBarRef.current?.querySelector('input');
        if (searchInput) {
          searchInput.focus();
        }
      }, 100);
    }
  };
  
  const handleNavigation = (href: string) => {
    if (href === pathname || isNavigating) {
      return;
    }
    
    NavigationLoadingState.setIsNavigating(true);
    setActivePath(href);
    
    router.push(href);
  };
  
  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (isLoggingOut) return;
    
    setIsLoggingOut(true);
    
    try {
      await auth.signOut();
      
      localStorage.removeItem('supabase.auth.token');
      localStorage.removeItem('sb-refresh-token');
      localStorage.removeItem('sb-access-token');
      
      await supabase.auth.signOut();
      
      setTimeout(() => {
        window.location.href = '/';
      }, 500);
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
      setIsLoggingOut(false);
      
      setTimeout(() => {
        window.location.href = '/';
      }, 1000);
    }
  };
  
  // 7. Fonctions utilitaires
  const isActive = (path: string) => {
    return pathname === path || pathname?.startsWith(`${path}/`);
  };
  
  // 8. Données dérivées calculées à partir des props
  const isInDashboard = pathname?.startsWith('/dashboard');
  
  // Si l'app n'est pas montée, afficher un placeholder simple
  if (!isMounted) {
    return <header className="h-16 sticky top-0 z-50" />;
  }
  
  // Variables dérivées qui ne sont utilisées qu'après montage
  const isDark = theme === 'dark';
  const isAuthenticated = auth.isAuthenticated;
  const user = auth.user;
  const profile = userProfile.profile;
  
  // Préparation des données pour l'interface
  const userStatus = {
    isAuthenticated,
    authLoading: auth.loading,
    profileLoading: userProfile.loading,
    avatarUrl: profile?.avatar_url || null,
    username: profile?.username || user?.email?.split('@')[0] || null,
    isFreelance: profile?.role === 'freelance',
    isClient: profile?.role === 'client',
    isAdmin: profile?.role === 'admin'
  };
  
  const navigation = [
    { name: "Accueil", href: "/", icon: Home },
    { name: "Explorer", href: "/services", icon: Briefcase },
  ];
  
  const authenticatedNavigation = [
    ...(userStatus.isAuthenticated && userStatus.isFreelance ? [
      { name: "Mes Services", href: "/dashboard/services", icon: Briefcase },
      { name: "Créer un Service", href: "/dashboard/services/new", icon: PlusCircle },
    ] : []),
    ...(userStatus.isAuthenticated && userStatus.isClient ? [
      { name: "Favoris", href: "/dashboard/favorites", icon: Heart },
    ] : []),
    { name: "Commandes", href: "/dashboard/orders", icon: Briefcase },
    { name: "Messages", href: "/dashboard/messages", icon: MessageSquare },
    { name: "Wallet", href: "/dashboard/wallet", icon: Wallet },
    { name: "Profil", href: "/dashboard/profile", icon: User },
  ];
  
  // Rendu principal
  return (
    <header 
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
      {/* Éléments décoratifs en arrière-plan */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute -top-24 -right-24 w-60 h-60 ${
          isDark ? "bg-vynal-accent-secondary/10" : "bg-vynal-purple-300/20"
        } rounded-full blur-3xl opacity-50`}></div>
        <div className={`absolute -bottom-24 -left-24 w-60 h-60 ${
          isDark ? "bg-vynal-accent-primary/10" : "bg-vynal-purple-400/15"
        } rounded-full blur-3xl opacity-50`}></div>
        
        {/* Grille décorative en arrière-plan */}
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
              // Utiliser le routeur Next.js pour une navigation plus propre
              router.push('/');
            }}
          >
            <Image 
              src="/assets/logo/logo_vynal_platform.webp" 
              alt="Vynal Platform Logo" 
              className="h-6 sm:h-7 md:h-8 w-auto dark:brightness-110 transition-all duration-300 group-hover:scale-105" 
              width={32}
              height={32}
            />
          </div>

          {/* Search Bar - Desktop */}
          {pathname.includes('/services') && (
            <div className="hidden md:block w-[350px] max-w-md transition-all">
              <SearchBar 
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onSearch={handleSearch}
                className="shadow-sm h-9 border-0 dark:bg-vynal-purple-dark/50 dark:border-vynal-purple-secondary/30"
                placeholder="Rechercher un service..."
              />
            </div>
          )}

          {/* Navigation - Desktop */}
          <nav className="hidden md:flex items-center space-x-1">
            {navigation.map((item) => (
              <Button
                key={item.name}
                variant="ghost"
                size="sm"
                className={`text-sm flex items-center gap-2 ${
                  isActive(item.href) 
                  ? "text-vynal-purple-600 dark:text-vynal-accent-primary" 
                  : "text-vynal-purple-dark dark:text-vynal-text-primary"
                } rounded-lg hover:bg-vynal-purple-100/60 hover:text-vynal-purple-600 dark:hover:bg-vynal-purple-secondary/20 dark:hover:text-vynal-accent-primary`}
                onClick={() => handleNavigation(item.href)}
                disabled={isNavigating}
              >
                {isNavigating && activePath === item.href ? (
                  <Loader className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <item.icon className="h-3.5 w-3.5" />
                )}
                {item.name}
              </Button>
            ))}
          </nav>

          {/* Auth Buttons / User Menu */}
          <div className="flex items-center gap-2">
            {!userStatus.isAuthenticated && !userStatus.authLoading ? (
              // Options pour utilisateur non connecté
              <>
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
                    className="text-sm flex rounded-lg bg-gradient-to-r from-vynal-accent-primary to-vynal-accent-secondary text-white hover:from-vynal-accent-primary/90 hover:to-vynal-accent-secondary/90"
                    onClick={() => NavigationLoadingState.setIsNavigating(true)}
                  >
                    Se connecter
                  </Button>
                </Link>
              </>
            ) : userStatus.authLoading || userStatus.profileLoading ? (
              // État de chargement
              <Button variant="ghost" size="icon" className="opacity-50 cursor-wait">
                <Loader className="h-5 w-5 animate-spin text-vynal-purple-secondary dark:text-vynal-text-secondary" />
              </Button>
            ) : (
              // Utilisateur connecté
              <div className="flex items-center gap-1 sm:gap-2">
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
                    <Loader className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Home className="h-3.5 w-3.5" />
                  )}
                  Tableau de bord
                </Button>

                {/* Avatar utilisateur - CACHÉ SUR MOBILE */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`relative h-9 w-9 rounded-full overflow-hidden hidden sm:flex ${
                        isDark 
                          ? "ring-1 ring-vynal-purple-secondary/40 hover:ring-vynal-accent-primary/60" 
                          : "ring-1 ring-vynal-purple-300/60 hover:ring-vynal-purple-500/60"
                      }`}
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
                    </Button>
                  </DropdownMenuTrigger>
                  {/* Reste du menu déroulant... */}
                </DropdownMenu>
              </div>
            )}
          </div>

          {/* Mobile Menu Button and Search Icon */}
          <div className="md:hidden flex items-center gap-3">
            {pathname.includes('/services') && (
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
                <Search className="h-4 w-4" />
              </button>
            )}
            
            {/* Mobile Menu Button with Profile Picture - GARDER UNIQUEMENT CE MENU */}
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
                    }`} />
                  ) : (
                    <Menu className={`h-4 w-4 ${
                      isDark ? "text-vynal-text-primary" : "text-vynal-purple-600"
                    }`} />
                  )}
                </div>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Search Bar - Mobile */}
      <AnimatePresence>
        {pathname.includes('/services') && searchBarVisible && (
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
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Menu - Utiliser le composant MobileMenu */}
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