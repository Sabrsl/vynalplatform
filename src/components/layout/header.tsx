"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useUser } from "@/hooks/useUser";
import { Button } from "@/components/ui/button";
import SearchBar from "@/components/categories/SearchBar";
import { supabase } from "@/lib/supabase/client";
import MobileMenu from "@/components/MobileMenu";
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
  ChevronDown
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useTheme } from "next-themes";

export default function Header() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const { profile, isFreelance, isClient, isAdmin } = useUser();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchBarVisible, setSearchBarVisible] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const searchBarRef = useRef<HTMLDivElement>(null);
  const searchButtonRef = useRef<HTMLButtonElement>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [activePath, setActivePath] = useState(pathname || '');

  const isActive = (path: string) => {
    return pathname === path || pathname?.startsWith(`${path}/`);
  };

  // Détecter le défilement pour changer l'apparence du header
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fermer la barre de recherche si l'utilisateur clique en dehors
  useEffect(() => {
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
  }, [searchBarVisible]);

  // Mettre à jour activePath quand pathname change
  useEffect(() => {
    setActivePath(pathname || '');
  }, [pathname]);

  const navigation = [
    { name: "Accueil", href: "/", icon: Home },
    { name: "Explorer", href: "/services", icon: Briefcase },
  ];

  const authenticatedNavigation = [
    ...(isFreelance ? [
      { name: "Mes Services", href: "/dashboard/services", icon: Briefcase },
      { name: "Créer un Service", href: "/dashboard/services/new", icon: PlusCircle },
    ] : []),
    ...(isClient ? [
      { name: "Favoris", href: "/dashboard/favorites", icon: Heart },
    ] : []),
    { name: "Commandes", href: "/dashboard/orders", icon: Briefcase },
    { name: "Messages", href: "/dashboard/messages", icon: MessageSquare },
    { name: "Wallet", href: "/dashboard/wallet", icon: Wallet },
    { name: "Profil", href: "/dashboard/profile", icon: User },
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Rediriger vers la page services avec le paramètre de recherche
      window.location.href = `/services?search=${encodeURIComponent(searchQuery.trim())}`;
      setSearchBarVisible(false);
    }
  };

  const toggleSearchBar = () => {
    setSearchBarVisible(!searchBarVisible);
    // Donner le focus à l'input après l'avoir affiché
    if (!searchBarVisible) {
      setTimeout(() => {
        const searchInput = searchBarRef.current?.querySelector('input');
        if (searchInput) {
          searchInput.focus();
        }
      }, 100);
    }
  };

  // Fonction simplifiée de déconnexion
  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (isLoggingOut) return;
    
    setIsLoggingOut(true);
    
    try {
      // Déconnexion manuelle via Supabase
      await supabase.auth.signOut();
      
      // Nettoyage du local storage
      localStorage.removeItem('supabase.auth.token');
      
      // Attendre un court instant avant de rediriger
      setTimeout(() => {
        // Forcer un rechargement complet de la page
        window.location.href = '/';
      }, 300);
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
      setIsLoggingOut(false);
    }
  };

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
          <Link href="/" className="flex items-center group">
            <img 
              src="/assets/logo/logo_vynal_platform.webp" 
              alt="Vynal Platform Logo" 
              className="h-6 sm:h-7 md:h-8 w-auto dark:brightness-110 transition-all duration-300 group-hover:scale-105" 
            />
          </Link>

          {/* Search Bar - Desktop */}
          {pathname.includes('/services') && (
            <div className="hidden md:block w-[350px] max-w-md transition-all">
              <SearchBar 
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onSearch={handleSearch}
                className={`h-9 ${
                  isDark 
                    ? "border border-vynal-purple-secondary/30 bg-vynal-purple-dark/50 focus-within:bg-vynal-purple-dark/80 focus-within:border-vynal-accent-primary/60" 
                    : "border border-vynal-purple-200/50 bg-white/50 focus-within:bg-white/90 focus-within:border-vynal-purple-400/60"
                } rounded-full shadow-sm transition-all`}
                placeholder="Rechercher un service..."
                showFiltersButton={false}
              />
            </div>
          )}

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`text-sm font-medium transition-all duration-300 flex items-center ${
                  isActive(item.href)
                    ? isDark 
                      ? "text-vynal-accent-primary scale-105" 
                      : "text-vynal-purple-600 scale-105"
                    : isDark 
                      ? "text-vynal-text-primary hover:text-vynal-accent-primary hover:scale-105" 
                      : "text-vynal-purple-dark hover:text-vynal-purple-600 hover:scale-105"
                }`}
              >
                <item.icon className="w-3.5 h-3.5 mr-1.5" />
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Auth Buttons / User Menu */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <div className="flex items-center gap-3">
                <Link href="/dashboard">
                  <Button 
                    variant="outline" 
                    className={`flex items-center gap-2 text-sm group transition-all rounded-full ${
                      isDark 
                        ? "border-vynal-purple-secondary/40 text-vynal-text-primary hover:bg-vynal-purple-secondary/20 hover:border-vynal-accent-primary/50" 
                        : "border-vynal-purple-300/50 text-vynal-purple-dark hover:bg-vynal-purple-200/30 hover:border-vynal-purple-400/60"
                    }`}
                  >
                    <User className={`w-3.5 h-3.5 ${
                      isDark 
                        ? "group-hover:text-vynal-accent-primary" 
                        : "group-hover:text-vynal-purple-600"
                    } transition-colors`} />
                    <span>Dashboard</span>
                    <ChevronDown className={`w-3.5 h-3.5 ${
                      isDark 
                        ? "group-hover:text-vynal-accent-primary" 
                        : "group-hover:text-vynal-purple-600"
                    } transition-colors`} />
                  </Button>
                </Link>
                
                <Button 
                  variant="ghost" 
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className={`text-sm flex items-center gap-2 transition-all rounded-full ${
                    isDark 
                      ? "text-vynal-text-primary hover:bg-vynal-purple-secondary/20 hover:text-vynal-accent-primary" 
                      : "text-vynal-purple-dark hover:bg-vynal-purple-200/30 hover:text-vynal-purple-600"
                  }`}
                >
                  {isLoggingOut ? (
                    <>
                      <div className={`w-3.5 h-3.5 border-2 border-t-transparent rounded-full animate-spin mr-1 ${
                        isDark ? "border-vynal-text-secondary" : "border-vynal-purple-400"
                      }`}></div>
                      <span>Déconnexion...</span>
                    </>
                  ) : (
                    <>
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Déconnexion</span>
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <>
                <Link href="/auth/login">
                  <Button 
                    variant="ghost" 
                    className={`text-sm transition-all rounded-full ${
                      isDark 
                        ? "text-vynal-text-primary hover:bg-vynal-purple-secondary/20 hover:text-vynal-accent-primary" 
                        : "text-vynal-purple-dark hover:bg-vynal-purple-200/30 hover:text-vynal-purple-600"
                    }`}
                  >
                    Connexion
                  </Button>
                </Link>
                <Link href="/auth/signup">
                  <Button 
                    className="text-sm bg-gradient-button hover:opacity-90 text-white font-medium transition-all duration-300 hover:scale-105 rounded-full"
                  >
                    Inscription
                  </Button>
                </Link>
              </>
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
            
            {/* Mobile Menu Button with Profile Picture */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`relative h-9 w-9 rounded-full transition-all duration-300 overflow-hidden ${
                isDark 
                  ? mobileMenuOpen
                    ? "ring-2 ring-vynal-accent-primary ring-offset-1 ring-offset-vynal-purple-dark"
                    : "ring-1 ring-vynal-purple-secondary/40 hover:ring-vynal-accent-primary/60" 
                  : mobileMenuOpen
                    ? "ring-2 ring-vynal-purple-500 ring-offset-1"
                    : "ring-1 ring-vynal-purple-300/60 hover:ring-vynal-purple-500/60"
              }`}
              aria-expanded={mobileMenuOpen}
              aria-label="Toggle mobile menu"
            >
              {user ? (
                // Photo de profil si utilisateur connecté
                profile?.avatar_url ? (
                  <img 
                    src={profile.avatar_url} 
                    alt="Profile" 
                    className="h-full w-full object-cover"
                  />
                ) : (
                  // Avatar avec initiale si pas de photo mais connecté
                  <div className={`h-full w-full flex items-center justify-center ${
                    isDark 
                      ? "bg-vynal-purple-secondary text-vynal-accent-primary" 
                      : "bg-vynal-purple-100 text-vynal-purple-600"
                  }`}>
                    <span className="text-sm font-medium">
                      {profile?.full_name 
                        ? profile.full_name.charAt(0).toUpperCase() 
                        : profile?.username 
                          ? profile.username.charAt(0).toUpperCase()
                          : user.email?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )
              ) : (
                // Icône placeholder pour utilisateur non connecté
                <div className={`h-full w-full flex items-center justify-center ${
                  isDark 
                    ? "bg-vynal-purple-secondary/40 text-vynal-text-primary" 
                    : "bg-vynal-purple-100/80 text-vynal-purple-dark"
                }`}>
                  <User className="h-4.5 w-4.5" />
                </div>
              )}
              
              {/* Indicateur de menu ouvert */}
              {mobileMenuOpen && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                  <X className="h-3.5 w-3.5 text-white" />
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
      />
    </header>
  );
} 