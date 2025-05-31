"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
  memo,
  forwardRef,
} from "react";
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
  Keyboard,
  Moon,
  Sun,
  AlertTriangle,
  Badge,
  FileText,
  Users,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useTheme } from "next-themes";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuGroup,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import Image from "next/image";
import { debounce } from "lodash";
import { FREELANCE_ROUTES, CLIENT_ROUTES, AUTH_ROUTES } from "@/config/routes";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";
import useCurrency from "@/hooks/useCurrency";
import { triggerCurrencyChangeEvent } from "@/lib/utils/currency-updater";
import { toast } from "react-hot-toast";
import { QuickTooltip } from "@/components/ui/tooltip";
import requestCoordinator from "@/lib/optimizations/requestCoordinator";

// Données de navigation mémorisées en dehors du composant
const BASE_NAVIGATION = [
  { name: "Accueil", href: "/", icon: Home },
  { name: "Explorer", href: "/services", icon: Briefcase },
  { name: "Talents", href: "/talents", icon: Users },
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
const NavButton = memo(
  ({
    item,
    isActive,
    isNavigating,
    activePath,
    onClick,
  }: {
    item: NavigationItem;
    isActive: (path: string) => boolean;
    isNavigating: boolean;
    activePath: string;
    onClick: (href: string) => void;
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
        aria-label={`Naviguer vers ${item.name}`}
        aria-current={isActive(item.href) ? "page" : undefined}
      >
        {isNavigating ? (
          <Loader className="h-3.5 w-3.5" strokeWidth={2.5} />
        ) : (
          <item.icon className="h-3.5 w-3.5" strokeWidth={2.5} />
        )}
        {item.name}
      </Button>
    );
  },
);

NavButton.displayName = "NavButton";

// Composant pour le logo mémorisé
const Logo = memo(({ router }: { router: any }) => {
  const handleLogoClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      router.push("/");
    },
    [router],
  );

  return (
    <div
      className="flex items-center group cursor-pointer"
      onClick={handleLogoClick}
    >
      <Image
        src="/assets/logo/logo_vynal_platform.svg"
        alt="Vynal Platform Logo"
        className="h-20 md:h-24 w-auto dark:brightness-110 transition-all duration-300"
        width={360}
        height={96}
        priority
      />
    </div>
  );
});

Logo.displayName = "Logo";

// Composant pour la barre de recherche mémorisé
const SearchBarContainer = memo(
  ({
    pathname,
    searchQuery,
    setSearchQuery,
    handleSearch,
    handleSearchChange,
    isDark,
  }: {
    pathname: string | null;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    handleSearch: (e: React.FormEvent) => void;
    handleSearchChange: (query: string) => void;
    isDark: boolean;
  }) => {
    if (!pathname?.includes("/services")) return null;

    return (
      <div className="hidden md:block w-[350px] max-w-md transition-all">
        <SearchBar
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          onSearch={handleSearch}
          className="shadow-sm h-9 border-0 dark:bg-vynal-purple-dark/50 dark:border-vynal-purple-secondary/30"
          placeholder="Rechercher un service..."
          autoFocus={false}
        />
      </div>
    );
  },
);

SearchBarContainer.displayName = "SearchBarContainer";

// Composant pour les éléments de navigation mémorisé
const Navigation = memo(
  ({
    items,
    isActive,
    isNavigating,
    activePath,
    handleNavigation,
  }: {
    items: NavigationItem[];
    isActive: (path: string) => boolean;
    isNavigating: boolean;
    activePath: string;
    handleNavigation: (href: string) => void;
  }) => {
    return (
      <nav className="hidden md:flex items-center space-x-1">
        {items.map((item) => (
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
    );
  },
);

Navigation.displayName = "Navigation";

// Composant pour le menu utilisateur non authentifié mémorisé
const UnauthenticatedMenu = memo(({ router }: { router: any }) => {
  const handleClick = useCallback(
    () => NavigationLoadingState.setIsNavigating(true),
    [],
  );

  return (
    <motion.div
      className="flex items-center gap-2"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2 }}
    >
      <Link href={AUTH_ROUTES.REGISTER} passHref>
        <Button
          variant="ghost"
          size="sm"
          className="text-sm text-vynal-purple-dark dark:text-vynal-text-primary hover:text-vynal-purple-dark rounded-lg hover:bg-vynal-purple-100/60 dark:hover:bg-vynal-purple-secondary/20 dark:hover:text-vynal-text-primary hidden sm:flex"
          onClick={handleClick}
        >
          S'inscrire
        </Button>
      </Link>
      <Link href={AUTH_ROUTES.LOGIN} passHref>
        <Button
          variant="default"
          size="sm"
          className="text-sm hidden sm:flex rounded-lg bg-gradient-to-r from-vynal-accent-primary to-vynal-accent-secondary text-white hover:from-vynal-accent-primary/90 hover:to-vynal-accent-secondary/90 shadow-sm hover:shadow-md transition-all"
          onClick={handleClick}
        >
          Se connecter
        </Button>
      </Link>
    </motion.div>
  );
});

UnauthenticatedMenu.displayName = "UnauthenticatedMenu";

// Composant pour le bouton tableau de bord mémorisé
const DashboardButton = memo(
  ({
    activePath,
    isNavigating,
    handleNavigation,
  }: {
    activePath: string;
    isNavigating: boolean;
    handleNavigation: (href: string) => void;
  }) => {
    const { profile } = useUser();
    const isClient = profile?.role === "client";
    const isFreelance = profile?.role === "freelance";

    // Déterminer le bon chemin en fonction du rôle
    const buttonPath = isClient
      ? CLIENT_ROUTES.ORDERS
      : isFreelance
        ? FREELANCE_ROUTES.SERVICES
        : FREELANCE_ROUTES.DASHBOARD; // Par défaut, rediriger vers le dashboard freelance

    // Vérifier si le chemin actuel correspond au bon type de dashboard
    const isInWrongDashboard =
      (isClient && activePath.startsWith("/dashboard")) ||
      (isFreelance && activePath.startsWith("/client-dashboard"));

    return (
      <Button
        variant="ghost"
        size="sm"
        className={`hidden sm:flex text-sm items-center gap-2 rounded-lg ${
          activePath.includes("/dashboard") ||
          activePath.includes("/client-dashboard") ||
          (isClient && activePath.includes("/orders")) ||
          (isFreelance && activePath.includes("/services"))
            ? isInWrongDashboard
              ? "text-amber-500 dark:text-amber-400" // Indique que l'utilisateur est dans le mauvais dashboard
              : "text-vynal-purple-600 dark:text-vynal-accent-primary"
            : "text-vynal-purple-dark dark:text-vynal-text-primary"
        } hover:bg-vynal-purple-100/60 hover:text-vynal-purple-600 dark:hover:bg-vynal-purple-secondary/20 dark:hover:text-vynal-accent-primary`}
        onClick={() => handleNavigation(buttonPath)}
      >
        {isNavigating &&
        (activePath === "/dashboard" ||
          activePath === "/client-dashboard" ||
          (isClient && activePath.includes("/orders")) ||
          (isFreelance && activePath.includes("/services"))) ? (
          <Loader className="h-3.5 w-3.5 animate-spin" strokeWidth={2.5} />
        ) : isInWrongDashboard ? (
          <AlertTriangle
            className="h-3.5 w-3.5 text-amber-500 dark:text-amber-400"
            strokeWidth={2.5}
          />
        ) : isClient ? (
          <Briefcase className="h-3.5 w-3.5" strokeWidth={2.5} />
        ) : isFreelance ? (
          <FileText className="h-3.5 w-3.5" strokeWidth={2.5} />
        ) : (
          <Home className="h-3.5 w-3.5" strokeWidth={2.5} />
        )}
        {isInWrongDashboard
          ? "Accéder au bon tableau"
          : isClient
            ? "Commandes"
            : isFreelance
              ? "Services"
              : "Tableau de bord"}
      </Button>
    );
  },
);

DashboardButton.displayName = "DashboardButton";

// Bouton avatar utilisateur mémorisé
const UserAvatar = forwardRef<
  HTMLButtonElement,
  {
    avatarUrl: string | null;
    username: string | null;
    isDark: boolean;
    onClick?: (e: React.MouseEvent) => void;
  }
>(({ avatarUrl, username, isDark, onClick }, ref) => {
  return (
    <motion.button
      ref={ref}
      className={`relative h-9 w-9 rounded-full overflow-hidden hidden sm:flex items-center justify-center ${
        isDark
          ? "ring-1 ring-vynal-purple-secondary/40 hover:ring-vynal-accent-primary/60"
          : "ring-1 ring-vynal-purple-300/60 hover:ring-vynal-purple-500/60"
      }`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
    >
      {avatarUrl ? (
        <Image
          src={avatarUrl}
          alt="Profile"
          width={36}
          height={36}
          className="h-full w-full object-cover"
        />
      ) : (
        <div
          className={`h-full w-full flex items-center justify-center ${
            isDark
              ? "bg-vynal-purple-secondary text-vynal-accent-primary"
              : "bg-vynal-purple-100 text-vynal-purple-600"
          }`}
        >
          <span className="text-sm font-medium">
            {username?.charAt(0).toUpperCase()}
          </span>
        </div>
      )}
    </motion.button>
  );
});

UserAvatar.displayName = "UserAvatar";

// Composant pour le menu mobile mémorisé
const MobileMenuButton = memo(
  ({
    mobileMenuOpen,
    setMobileMenuOpen,
    isAuthenticated,
    profileLoading,
    avatarUrl,
    username,
    isDark,
  }: {
    mobileMenuOpen: boolean;
    setMobileMenuOpen: (open: boolean) => void;
    isAuthenticated: boolean;
    profileLoading: boolean;
    avatarUrl: string | null;
    username: string | null;
    isDark: boolean;
  }) => {
    const toggleMenu = useCallback(() => {
      setMobileMenuOpen(!mobileMenuOpen);
    }, [mobileMenuOpen, setMobileMenuOpen]);

    // État local pour suivre le compteur de tentatives
    const [loadAttempts, setLoadAttempts] = useState(0);

    // Effet pour gérer les tentatives de chargement répétées
    useEffect(() => {
      let timeoutId: NodeJS.Timeout | null = null;

      // Si l'utilisateur est authentifié et le profil est toujours en chargement après un certain temps,
      // on incrémente le compteur de tentatives
      if (isAuthenticated && profileLoading) {
        timeoutId = setTimeout(() => {
          setLoadAttempts((prev) => prev + 1);
        }, 3000); // 3 secondes d'attente
      }

      return () => {
        if (timeoutId) clearTimeout(timeoutId);
      };
    }, [isAuthenticated, profileLoading]);

    // Après plusieurs tentatives de chargement, on force l'affichage même si le profil est en chargement
    const shouldShowUserAvatar =
      isAuthenticated && (!profileLoading || loadAttempts > 1);

    return (
      <button
        onClick={toggleMenu}
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
        {/* Si authentifié et profile chargé ou tentatives répétées, afficher l'avatar de l'utilisateur */}
        {shouldShowUserAvatar ? (
          avatarUrl ? (
            <Image
              src={avatarUrl}
              alt="Profile"
              width={36}
              height={36}
              className="h-full w-full object-cover"
            />
          ) : (
            <div
              className={`h-full w-full flex items-center justify-center ${
                isDark
                  ? "bg-vynal-purple-secondary text-vynal-accent-primary"
                  : "bg-vynal-purple-100 text-vynal-purple-600"
              }`}
            >
              <span className="text-sm font-medium">
                {username?.charAt(0).toUpperCase()}
              </span>
            </div>
          )
        ) : (
          // Si non authentifié ou chargement du profil, montrer l'icône de menu
          <div
            className={`h-full w-full flex items-center justify-center ${
              isDark ? "bg-vynal-purple-secondary/30" : "bg-vynal-purple-100/80"
            }`}
          >
            {mobileMenuOpen ? (
              <X
                className={`h-4 w-4 ${
                  isDark ? "text-vynal-accent-primary" : "text-vynal-purple-600"
                }`}
                strokeWidth={2.5}
              />
            ) : (
              <Menu
                className={`h-4 w-4 ${
                  isDark ? "text-vynal-text-primary" : "text-vynal-purple-600"
                }`}
                strokeWidth={2.5}
              />
            )}
          </div>
        )}
      </button>
    );
  },
);

MobileMenuButton.displayName = "MobileMenuButton";

// Composant pour la barre de recherche mobile mémorisé
const MobileSearchBar = memo(
  ({
    pathname,
    searchBarVisible,
    searchBarRef,
    searchQuery,
    setSearchQuery,
    handleSearch,
    handleSearchChange,
    isDark,
  }: {
    pathname: string | null;
    searchBarVisible: boolean;
    searchBarRef: React.RefObject<HTMLDivElement>;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    handleSearch: (e: React.FormEvent) => void;
    handleSearchChange: (query: string) => void;
    isDark: boolean;
  }) => {
    if (!pathname?.includes("/services") || !searchBarVisible) return null;

    return (
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
            onSearchChange={handleSearchChange}
            onSearch={handleSearch}
            className={`h-9 rounded-full shadow-sm ${
              isDark
                ? "border border-vynal-purple-secondary/30 bg-vynal-purple-dark/50 focus-within:bg-vynal-purple-dark/80"
                : "border border-vynal-purple-200/50 bg-white/70 focus-within:bg-white/90"
            }`}
            placeholder="Rechercher un service..."
            showFiltersButton={false}
            autoFocus={true}
            isMobile={true}
          />
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1 text-[10px] text-gray-400 px-1.5 py-0.5 bg-gray-100/50 dark:bg-vynal-purple-secondary/20 rounded">
            <Keyboard className="h-3 w-3" />
            <span>ESC</span>
          </div>
        </div>
      </motion.div>
    );
  },
);

MobileSearchBar.displayName = "MobileSearchBar";

// Nouveau composant pour les notifications de messages
const MessageNotificationIndicator = memo(() => {
  const { user } = useAuth();
  const { isClient, isFreelance } = useUser();
  const { unreadCounts, refresh } = useUnreadMessages(user?.id);
  const router = useRouter();
  const [count, setCount] = useState<number>(0);
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastRefreshTimeRef = useRef<number>(0);
  const didInitialFetchRef = useRef<boolean>(false);
  const userIdRef = useRef<string | undefined>(undefined);

  // Temps minimum très augmenté entre deux rafraîchissements (30 secondes au lieu de 5)
  const MIN_REFRESH_INTERVAL = 30000;

  // Stabiliser l'ID utilisateur pour éviter les changements de dépendance
  useEffect(() => {
    userIdRef.current = user?.id;
  }, [user?.id]);

  // Mettre à jour le compteur local quand les données changent
  useEffect(() => {
    if (unreadCounts?.total !== undefined && unreadCounts.total !== count) {
      setCount(unreadCounts.total);
      didInitialFetchRef.current = true;
    }
  }, [unreadCounts, count]);

  // Fonction débounce pour rafraîchir avec contrôle ultra strict
  const debouncedRefresh = useCallback(() => {
    // Si un rafraîchissement est déjà planifié, ne rien faire de plus
    if (refreshTimeoutRef.current) return;

    const now = Date.now();
    const timeSinceLastRefresh = now - lastRefreshTimeRef.current;

    // Si le dernier rafraîchissement était trop récent, programmer un nouveau après le délai
    if (timeSinceLastRefresh < MIN_REFRESH_INTERVAL) {
      refreshTimeoutRef.current = setTimeout(() => {
        refreshTimeoutRef.current = null;
        lastRefreshTimeRef.current = Date.now();
        try {
          // Utiliser requestCoordinator pour coordonner les rafraîchissements
          requestCoordinator.scheduleRequest(
            `header_notification_refresh_${user?.id}`,
            async () => {
              refresh();
            },
            "low", // Priorité basse pour les rafraîchissements automatiques
          );
        } catch (error) {
          console.error("Erreur lors du rafraîchissement:", error);
        }
      }, MIN_REFRESH_INTERVAL - timeSinceLastRefresh);
    } else {
      // Sinon, rafraîchir immédiatement avec coordination
      lastRefreshTimeRef.current = now;
      try {
        requestCoordinator.scheduleRequest(
          `header_notification_refresh_${user?.id}`,
          async () => {
            refresh();
          },
          "medium", // Priorité moyenne pour les rafraîchissements manuels
        );
      } catch (error) {
        console.error("Erreur lors du rafraîchissement immédiat:", error);
      }
    }
  }, [refresh, user?.id]);

  // Gestionnaire d'événement stabilisé et moins agressif
  const handleMessageUpdate = useCallback(
    (event: Event) => {
      try {
        const customEvent = event as CustomEvent;

        // Mettre à jour directement le compteur si les données sont disponibles
        if (customEvent.detail?.counts?.total !== undefined) {
          const newTotal = customEvent.detail.counts.total;
          if (newTotal !== count) {
            setCount(newTotal);
            didInitialFetchRef.current = true;
          }
        } else {
          // Uniquement rafraîchir si nécessaire et avec un délai plus long
          const timeSinceLastRefresh = Date.now() - lastRefreshTimeRef.current;
          if (timeSinceLastRefresh > MIN_REFRESH_INTERVAL) {
            debouncedRefresh();
          }
        }
      } catch (error) {
        console.error("Erreur dans handleMessageUpdate:", error);
      }
    },
    [count, debouncedRefresh],
  );

  // Gestionnaire de changement de visibilité ultra restrictif
  const handleVisibilityChange = useCallback(() => {
    try {
      if (document.visibilityState === "visible") {
        // S'il s'est écoulé au moins 2 minutes depuis le dernier rafraîchissement (au lieu de 30s)
        const now = Date.now();
        if (now - lastRefreshTimeRef.current > 2 * 60 * 1000) {
          debouncedRefresh();
        }
      }
    } catch (error) {
      console.error("Erreur dans handleVisibilityChange:", error);
    }
  }, [debouncedRefresh]);

  // Écouter les événements de mise à jour des messages, avec débounce ultra strict
  useEffect(() => {
    const currentUserId = userIdRef.current;
    if (!currentUserId) return;

    // S'abonner aux événements de mise à jour des messages
    window.addEventListener("vynal:messages-read", handleMessageUpdate);
    window.addEventListener("vynal:messages-update", handleMessageUpdate);
    window.addEventListener(
      "vynal:ui-notifications-update",
      handleMessageUpdate,
    );

    // Actualiser les compteurs au montage seulement si vraiment nécessaire
    if (!didInitialFetchRef.current && unreadCounts?.total === undefined) {
      // Permettre un rafraîchissement mais avec délai
      lastRefreshTimeRef.current = Date.now() - MIN_REFRESH_INTERVAL;
      setTimeout(() => {
        debouncedRefresh();
      }, 1000); // Délai de 1s au lieu d'immédiat
    }

    // S'abonner aux changements de visibilité pour actualiser au retour sur l'onglet
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = null;
      }
      window.removeEventListener("vynal:messages-read", handleMessageUpdate);
      window.removeEventListener("vynal:messages-update", handleMessageUpdate);
      window.removeEventListener(
        "vynal:ui-notifications-update",
        handleMessageUpdate,
      );
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [
    handleMessageUpdate,
    handleVisibilityChange,
    debouncedRefresh,
    unreadCounts?.total,
  ]);

  const handleClick = useCallback(() => {
    try {
      // Rediriger vers la page des messages
      const route = isClient
        ? CLIENT_ROUTES.MESSAGES
        : FREELANCE_ROUTES.MESSAGES;

      router.push(route);
    } catch (error) {
      console.error("Erreur lors de la navigation:", error);
    }
  }, [router, isClient]);

  // Si aucun message non lu, afficher une icône simple
  if (count <= 0) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={handleClick}
      >
        <MessageSquare className="h-[1.2rem] w-[1.2rem] text-vynal-purple-secondary dark:text-vynal-text-secondary" />
      </Button>
    );
  }

  // Avec des messages non lus, afficher le badge
  return (
    <Button
      variant="ghost"
      size="icon"
      className="relative"
      onClick={handleClick}
    >
      <MessageSquare className="h-[1.2rem] w-[1.2rem] text-vynal-purple-secondary dark:text-vynal-text-secondary" />
      <Badge className="absolute top-1 right-2 w-3 h-3 flex items-center justify-center rounded-full bg-red-500 text-[10px] animate-pulse">
        {count > 99 ? "99+" : count}
      </Badge>
    </Button>
  );
});

MessageNotificationIndicator.displayName = "MessageNotificationIndicator";

// Composant principal du Header
function Header() {
  // États locaux
  const [isScrolled, setIsScrolled] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [searchBarVisible, setSearchBarVisible] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isLoggingOut, setIsLoggingOut] = useState<boolean>(false);
  const [activePath, setActivePath] = useState<string>("");
  const [isNavigating, setIsNavigating] = useState<boolean>(false);
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [profileLoadAttempts, setProfileLoadAttempts] = useState<number>(0);
  const [lastScrollY, setLastScrollY] = useState<number>(0);
  const [isVisible, setIsVisible] = useState<boolean>(true);

  // Références
  const searchBarRef = useRef<HTMLDivElement>(null);
  const searchButtonRef = useRef<HTMLButtonElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Hooks Next.js
  const router = useRouter();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();

  // Hooks personnalisés
  const auth = useAuth();
  const userProfile = useUser();

  // Effet d'initialisation
  useEffect(() => {
    setIsMounted(true);
    if (pathname) {
      setActivePath(pathname);
      // Récupération de la recherche initiale depuis l'URL
      if (pathname.includes("/services")) {
        const searchParams = new URLSearchParams(window.location.search);
        const searchParam = searchParams?.get("search");
        if (searchParam) {
          setSearchQuery(decodeURIComponent(searchParam));
        }
      }
    }
  }, [pathname]);

  // Effet combiné pour tous les écouteurs d'événements
  useEffect(() => {
    if (!isMounted) return;

    // Gestionnaire de défilement
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Gérer l'état "scrolled" pour les styles
      setIsScrolled(currentScrollY > 10);

      // Simple détection de direction: si on monte, header visible; si on descend, header caché
      if (currentScrollY < lastScrollY) {
        // Scroll vers le haut - montrer le header
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY) {
        // Scroll vers le bas - cacher le header
        setIsVisible(false);
      }

      // Mettre à jour la position pour la prochaine comparaison
      setLastScrollY(currentScrollY);
    };

    // Gestionnaire d'état de navigation
    const handleNavigationStateChange = (event: Event) => {
      const customEvent = event as CustomEvent;
      setIsNavigating(customEvent.detail?.isNavigating || false);
    };

    // Gestionnaire de clics à l'extérieur de la barre de recherche
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

    // Gestionnaire de raccourcis clavier
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ctrl+K ou Cmd+K pour la recherche
      if (
        (e.ctrlKey || e.metaKey) &&
        e.key === "k" &&
        pathname?.includes("/services")
      ) {
        e.preventDefault();
        setSearchBarVisible(true);
        setTimeout(() => {
          const searchInput = searchBarRef.current?.querySelector("input");
          if (searchInput) {
            searchInput.focus();
          }
        }, 100);
      }

      // Échap pour fermer la barre de recherche
      if (e.key === "Escape" && searchBarVisible) {
        setSearchBarVisible(false);
      }
    };

    // Ajouter tous les écouteurs d'événements
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener(
      "vynal:navigation-state-changed",
      handleNavigationStateChange,
    );
    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleKeyPress);

    // Nettoyage lors du démontage
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener(
        "vynal:navigation-state-changed",
        handleNavigationStateChange,
      );
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleKeyPress);
    };
  }, [isMounted, searchBarVisible, pathname, lastScrollY]);

  // Effet pour gérer les tentatives de chargement répétées du profil
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;

    // Si l'utilisateur est authentifié et le profil est toujours en chargement après un certain temps,
    // on incrémente le compteur de tentatives
    if (auth.isAuthenticated && userProfile.loading) {
      timeoutId = setTimeout(() => {
        setProfileLoadAttempts((prev) => prev + 1);
      }, 3000); // 3 secondes d'attente
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [auth.isAuthenticated, userProfile.loading]);

  // Après plusieurs tentatives de chargement, on force l'affichage même si le profil est en chargement
  const shouldShowUserMenu =
    auth.isAuthenticated && (!userProfile.loading || profileLoadAttempts > 1);

  // Fonction pour changer le thème
  const toggleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [theme, setTheme]);

  // Gestionnaires optimisés
  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (searchQuery.trim()) {
        NavigationLoadingState.setIsNavigating(true);
        router.push(
          `/services?search=${encodeURIComponent(searchQuery.trim())}`,
        );
        setSearchBarVisible(false);
      }
    },
    [searchQuery, router],
  );

  // Debounce pour la recherche en temps réel
  const debouncedSearch = useCallback(
    debounce((query: string) => {
      if (query.trim()) {
        NavigationLoadingState.setIsNavigating(true);
        router.push(`/services?search=${encodeURIComponent(query.trim())}`);
      } else {
        // Si la recherche est vide, on redirige vers la page des services sans paramètre de recherche
        router.push("/services");
      }
    }, 300),
    [router],
  );

  const handleSearchChange = useCallback(
    (query: string) => {
      setSearchQuery(query);
      debouncedSearch(query);
    },
    [debouncedSearch],
  );

  const toggleSearchBar = useCallback(() => {
    setSearchBarVisible((prev) => {
      const newState = !prev;
      if (newState) {
        setTimeout(() => {
          const searchInput = searchBarRef.current?.querySelector("input");
          if (searchInput) {
            searchInput.focus();
          }
        }, 100);
      }
      return newState;
    });
  }, []);

  const handleNavigation = useCallback(
    (href: string) => {
      if (href === pathname || isNavigating) return;

      NavigationLoadingState.setIsNavigating(true);
      setActivePath(href);

      if (href === "/services" && searchQuery) {
        router.push(`/services?search=${encodeURIComponent(searchQuery)}`);
      } else {
        router.push(href);
      }
    },
    [pathname, isNavigating, router, searchQuery],
  );

  const handleLogout = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();

      if (isLoggingOut) return;

      setIsLoggingOut(true);

      try {
        // Utiliser la fonction signOut centralisée et améliorée
        const { success, error } = await import("@/lib/auth").then((m) =>
          m.signOut(),
        );

        if (!success && error) {
          throw error;
        }

        // Note: La redirection est déjà gérée dans signOut()
      } catch (error) {
        console.error("Erreur lors de la déconnexion:", error);
        setIsLoggingOut(false);

        // Redirection de secours en cas d'erreur
        setTimeout(() => {
          window.location.href = "/?nocache=" + Date.now();
        }, 1000);
      }
    },
    [isLoggingOut],
  );

  // Fonctions utilitaires mémorisées
  const isActive = useCallback(
    (path: string): boolean => {
      if (!pathname) return false;

      // Si le chemin est un sous-chemin de dashboard, vérifier aussi client-dashboard
      if (
        path.startsWith("/dashboard/") &&
        userProfile.profile?.role === "client"
      ) {
        // Utiliser les constantes de routes pour la conversion
        const clientPath = path.replace("/dashboard/", "/client-dashboard/");
        return (
          pathname === path ||
          pathname.startsWith(`${path}/`) ||
          pathname === clientPath ||
          pathname.startsWith(`${clientPath}/`)
        );
      }
      // Sinon, vérification normale
      return pathname === path || pathname.startsWith(`${path}/`);
    },
    [pathname, userProfile.profile?.role],
  );

  // Définir la navigation en fonction du rôle de l'utilisateur avec les constantes
  const authenticatedNavigation = useMemo(() => {
    const isClient = userProfile.profile?.role === "client";

    return [
      ...(userProfile.profile?.role === "freelance"
        ? [
            {
              name: "Mes Services",
              href: FREELANCE_ROUTES.SERVICES,
              icon: Briefcase,
            },
            {
              name: "Créer un Service",
              href: `${FREELANCE_ROUTES.SERVICES}/new`,
              icon: PlusCircle,
            },
          ]
        : []),
      ...(isClient
        ? [
            {
              name: "Favoris",
              href: `${CLIENT_ROUTES.DASHBOARD}/favorites`,
              icon: Heart,
            },
          ]
        : []),
      {
        name: "Commandes",
        href: isClient ? CLIENT_ROUTES.ORDERS : FREELANCE_ROUTES.ORDERS,
        icon: Briefcase,
      },
      {
        name: "Messages",
        href: isClient ? CLIENT_ROUTES.MESSAGES : FREELANCE_ROUTES.MESSAGES,
        icon: MessageSquare,
      },
      {
        name: "Wallet",
        href: isClient ? CLIENT_ROUTES.PAYMENTS : FREELANCE_ROUTES.WALLET,
        icon: Wallet,
      },
      {
        name: "Profil",
        href: isClient ? CLIENT_ROUTES.PROFILE : FREELANCE_ROUTES.PROFILE,
        icon: User,
      },
    ];
  }, [userProfile.profile?.role]);

  // Fonction pour basculer le menu
  const toggleMenu = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen((prev) => !prev);
  }, []);

  // Gestionnaire de clic à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        buttonRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside, {
        capture: true,
      });
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside, {
        capture: true,
      });
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  // Si l'app n'est pas montée, afficher un placeholder simple
  if (!isMounted) {
    return <header className="h-16 sticky top-0 z-50" />;
  }

  // Variables dérivées
  const isDark = theme === "dark";
  const isAuthenticated = auth.isAuthenticated;
  const user = auth.user;
  const profile = userProfile.profile;
  const isInDashboard =
    pathname?.startsWith("/dashboard") ||
    pathname?.startsWith("/client-dashboard");

  // Préparation des données
  const userStatus: UserStatus = {
    isAuthenticated,
    authLoading: auth.loading,
    profileLoading: userProfile.loading,
    avatarUrl: profile?.avatar_url || null,
    username: profile?.username || user?.email?.split("@")[0] || null,
    isFreelance: profile?.role === "freelance",
    isClient: profile?.role === "client",
    isAdmin: profile?.role === "admin",
  };

  // Rendu principal avec des animations et optimisations
  return (
    <header
      ref={headerRef}
      className={`sticky transition-all duration-300 z-50 ${
        isScrolled
          ? isDark
            ? "bg-vynal-purple-dark/90 backdrop-blur-md shadow-lg"
            : "bg-white shadow-lg"
          : isDark
            ? "bg-gradient-vynal"
            : "bg-white"
      } ${
        isVisible
          ? "top-0 transform duration-300"
          : "-top-16 transform duration-300"
      }`}
    >
      {/* Éléments décoratifs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className={`absolute -top-24 -right-24 w-60 h-60 ${
            isDark ? "bg-vynal-accent-secondary/10" : "bg-vynal-purple-300/20"
          } rounded-full blur-3xl opacity-50`}
        ></div>
        <div
          className={`absolute -bottom-24 -left-24 w-60 h-60 ${
            isDark ? "bg-vynal-accent-primary/10" : "bg-vynal-purple-400/15"
          } rounded-full blur-3xl opacity-50`}
        ></div>

        <div
          className={`absolute inset-0 bg-[url('/img/grid-pattern.svg')] bg-center ${
            isDark ? "opacity-0" : "opacity-0"
          }`}
        ></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="flex justify-between items-center h-16">
          {/* Logo et barre de recherche */}
          <div className="flex items-center space-x-4">
            <Logo router={router} />

            {/* Search Bar - Desktop */}
            {pathname?.includes("/services") && (
              <div className="hidden md:block ml-4">
                <SearchBarContainer
                  pathname={pathname}
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  handleSearch={handleSearch}
                  handleSearchChange={handleSearchChange}
                  isDark={isDark}
                />
              </div>
            )}
          </div>

          {/* Navigation - Desktop */}
          <div className="hidden md:flex items-center justify-center absolute left-1/2 transform -translate-x-1/2">
            <Navigation
              items={BASE_NAVIGATION}
              isActive={isActive}
              isNavigating={isNavigating}
              activePath={activePath}
              handleNavigation={handleNavigation}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Auth Buttons / User Menu */}
            <AnimatePresence mode="wait">
              {!userStatus.isAuthenticated && !userStatus.authLoading ? (
                // Options pour utilisateur non connecté
                <div className="flex items-center space-x-2">
                  {/* Bouton de thème */}
                  <QuickTooltip
                    content={
                      theme === "dark"
                        ? "Passer en mode clair"
                        : "Passer en mode sombre"
                    }
                    side="bottom"
                    variant="default"
                    delayDuration={100}
                    className="bg-slate-100/90 dark:bg-slate-800/90
                     border border-slate-200 dark:border-slate-700/30
                     text-slate-700 dark:text-vynal-text-primary
                     shadow-sm backdrop-blur-sm
                     rounded-lg"
                  >
                    <motion.button
                      onClick={toggleTheme}
                      className="w-8 h-8 flex items-center justify-center rounded-full bg-transparent hover:bg-gray-200/20 dark:hover:bg-vynal-purple-secondary/40 transition-all focus:outline-none !ring-0 !ring-offset-0"
                      aria-label={isDark ? "Passer au thème clair" : "Passer au thème sombre"}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      {theme === "dark" ? (
                        <Sun size={18} className="text-vynal-accent-primary" />
                      ) : (
                        <Moon size={18} className="text-vynal-purple-dark" />
                      )}
                    </motion.button>
                  </QuickTooltip>
                  <UnauthenticatedMenu router={router} />
                </div>
              ) : userStatus.authLoading ||
                (userStatus.profileLoading && profileLoadAttempts <= 1) ? (
                // État de chargement
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center space-x-2"
                >
                  {/* Bouton de thème */}
                  <QuickTooltip
                    content={
                      theme === "dark"
                        ? "Passer en mode clair"
                        : "Passer en mode sombre"
                    }
                    side="bottom"
                    variant="default"
                    delayDuration={100}
                    className="bg-slate-100/90 dark:bg-slate-800/90
                      border border-slate-200 dark:border-slate-700/30
                      text-slate-700 dark:text-vynal-text-primary
                      shadow-sm backdrop-blur-sm
                      rounded-lg"
                  >
                    <motion.button
                      onClick={toggleTheme}
                      className="w-8 h-8 flex items-center justify-center rounded-full bg-transparent hover:bg-gray-200/20 dark:hover:bg-vynal-purple-secondary/40 transition-all focus:outline-none !ring-0 !ring-offset-0"
                      aria-label={isDark ? "Passer au thème clair" : "Passer au thème sombre"}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      {theme === "dark" ? (
                        <Sun size={18} className="text-vynal-accent-primary" />
                      ) : (
                        <Moon size={18} className="text-vynal-purple-dark" />
                      )}
                    </motion.button>
                  </QuickTooltip>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="opacity-50 cursor-wait"
                  >
                    <Loader
                      className="h-5 w-5 animate-spin text-vynal-purple-secondary dark:text-vynal-text-secondary"
                      strokeWidth={2.5}
                    />
                  </Button>
                </motion.div>
              ) : shouldShowUserMenu ? (
                // Utilisateur connecté
                <motion.div
                  className="flex items-center gap-1 sm:gap-2"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                >
                  {/* Bouton de thème */}
                  <QuickTooltip
                    content={
                      theme === "dark"
                        ? "Passer en mode clair"
                        : "Passer en mode sombre"
                    }
                    side="bottom"
                    variant="default"
                    delayDuration={100}
                    className="bg-slate-100/90 dark:bg-slate-800/90
                      border border-slate-200 dark:border-slate-700/30
                      text-slate-700 dark:text-vynal-text-primary
                      shadow-sm backdrop-blur-sm
                      rounded-lg"
                  >
                    <motion.button
                      onClick={toggleTheme}
                      className="w-8 h-8 flex items-center justify-center rounded-full bg-transparent hover:bg-gray-200/20 dark:hover:bg-vynal-purple-secondary/40 transition-all focus:outline-none !ring-0 !ring-offset-0"
                      aria-label={isDark ? "Passer au thème clair" : "Passer au thème sombre"}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      {theme === "dark" ? (
                        <Sun size={18} className="text-vynal-accent-primary" />
                      ) : (
                        <Moon size={18} className="text-vynal-purple-dark" />
                      )}
                    </motion.button>
                  </QuickTooltip>

                  {/* Notifications uniquement pour les freelances */}
                  {userStatus.isFreelance && (
                    <QuickTooltip
                      content="Notifications de commandes"
                      side="bottom"
                      variant="default"
                      className="bg-slate-100/90 dark:bg-slate-800/90
                        border border-slate-200 dark:border-slate-700/30
                        text-slate-700 dark:text-vynal-text-primary
                        shadow-sm backdrop-blur-sm
                        rounded-lg"
                    >
                      <div>
                        <OrderNotificationIndicator />
                      </div>
                    </QuickTooltip>
                  )}

                  {/* Notifications de messages - pour tous les utilisateurs */}
                  <QuickTooltip
                    content="Messages non lus"
                    side="bottom"
                    variant="default"
                    className="bg-slate-100/90 dark:bg-slate-800/90
                      border border-slate-200 dark:border-slate-700/30
                      text-slate-700 dark:text-vynal-text-primary
                      shadow-sm backdrop-blur-sm
                      rounded-lg"
                  >
                    <div>
                      <MessageNotificationIndicator />
                    </div>
                  </QuickTooltip>

                  {/* Bouton du tableau de bord */}
                  <DashboardButton
                    activePath={activePath}
                    isNavigating={isNavigating}
                    handleNavigation={handleNavigation}
                  />

                  {/* Avatar utilisateur - CACHÉ SUR MOBILE */}
                  <div className="relative">
                    <motion.button
                      ref={buttonRef}
                      className={`relative h-9 w-9 rounded-full transition-all duration-300 overflow-hidden hidden sm:flex items-center justify-center ${
                        isDark
                          ? "ring-1 ring-vynal-purple-secondary/40 hover:ring-vynal-accent-primary/60"
                          : "ring-1 ring-vynal-purple-300/60 hover:ring-vynal-purple-500/60"
                      }`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      aria-label="Menu utilisateur"
                      onClick={toggleMenu}
                      aria-haspopup="true"
                      aria-expanded={isOpen}
                    >
                      {userStatus.avatarUrl ? (
                        <Image
                          src={userStatus.avatarUrl}
                          alt="Profile"
                          width={36}
                          height={36}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            // Si l'image ne peut pas être chargée, on affiche les initiales
                            e.currentTarget.style.display = "none";
                            // On peut aussi appliquer un className au parent pour forcer l'affichage des initiales
                            if (e.currentTarget.parentElement) {
                              e.currentTarget.parentElement.classList.add(
                                "avatar-fallback",
                              );
                            }
                          }}
                        />
                      ) : (
                        <div
                          className={`h-full w-full flex items-center justify-center ${
                            isDark
                              ? "bg-vynal-purple-secondary text-vynal-accent-primary"
                              : "bg-vynal-purple-100 text-vynal-purple-600"
                          }`}
                        >
                          <span className="text-sm font-medium">
                            {userStatus.username?.charAt(0).toUpperCase() ||
                              "U"}
                          </span>
                        </div>
                      )}
                    </motion.button>

                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          ref={menuRef}
                          className="absolute right-0 mt-2 w-48 z-50 rounded-lg border border-vynal-purple-secondary/20 bg-white p-1 text-vynal-purple-dark shadow-lg dark:border-vynal-purple-secondary/20 dark:bg-vynal-purple-dark dark:text-vynal-text-primary backdrop-blur-sm"
                          initial={{ opacity: 0, scale: 0.95, y: -5 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: -5 }}
                          transition={{ duration: 0.2, ease: "easeOut" }}
                          role="menu"
                          aria-orientation="vertical"
                        >
                          <div className="px-2 py-1.5 text-xs font-semibold">
                            <span className="flex items-center gap-1.5">
                              <User
                                className="h-3 w-3 text-vynal-accent-primary"
                                strokeWidth={2.5}
                              />
                              <span>{userStatus.username || "Mon Compte"}</span>
                            </span>
                          </div>
                          <div className="border-t border-vynal-purple-secondary/20 dark:border-vynal-purple-secondary/20 my-1" />
                          <div className="space-y-0.5">
                            <Link
                              href={
                                userStatus.isClient
                                  ? CLIENT_ROUTES.DASHBOARD
                                  : FREELANCE_ROUTES.DASHBOARD
                              }
                              className={`flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs cursor-pointer ${isDark ? "hover:bg-vynal-purple-secondary/30 text-vynal-text-primary" : "hover:bg-vynal-purple-100/60 text-vynal-purple-dark"}`}
                            >
                              <Home className="h-3 w-3" />
                              <span>Tableau de bord</span>
                            </Link>
                            <Link
                              href={
                                userStatus.isClient
                                  ? CLIENT_ROUTES.PROFILE
                                  : FREELANCE_ROUTES.PROFILE
                              }
                              className={`flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs cursor-pointer ${isDark ? "hover:bg-vynal-purple-secondary/30 text-vynal-text-primary" : "hover:bg-vynal-purple-100/60 text-vynal-purple-dark"}`}
                            >
                              <User className="h-3 w-3" />
                              <span>Profil</span>
                            </Link>
                            <Link
                              href={
                                userStatus.isClient
                                  ? CLIENT_ROUTES.ORDERS
                                  : FREELANCE_ROUTES.ORDERS
                              }
                              className={`flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs cursor-pointer ${isDark ? "hover:bg-vynal-purple-secondary/30 text-vynal-text-primary" : "hover:bg-vynal-purple-100/60 text-vynal-purple-dark"}`}
                            >
                              <Briefcase className="h-3 w-3" />
                              <span>Commandes</span>
                            </Link>
                            {userStatus.isFreelance && (
                              <Link
                                href={FREELANCE_ROUTES.SERVICES}
                                className={`flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs cursor-pointer ${isDark ? "hover:bg-vynal-purple-secondary/30 text-vynal-text-primary" : "hover:bg-vynal-purple-100/60 text-vynal-purple-dark"}`}
                              >
                                <Briefcase className="h-3 w-3" />
                                <span>Mes Services</span>
                              </Link>
                            )}
                            <Link
                              href={
                                userStatus.isClient
                                  ? CLIENT_ROUTES.MESSAGES
                                  : FREELANCE_ROUTES.MESSAGES
                              }
                              className={`flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs cursor-pointer ${isDark ? "hover:bg-vynal-purple-secondary/30 text-vynal-text-primary" : "hover:bg-vynal-purple-100/60 text-vynal-purple-dark"}`}
                            >
                              <MessageSquare className="h-3 w-3" />
                              <span>Messages</span>
                            </Link>
                            <Link
                              href={
                                userStatus.isClient
                                  ? CLIENT_ROUTES.PAYMENTS
                                  : FREELANCE_ROUTES.WALLET
                              }
                              className={`flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs cursor-pointer ${isDark ? "hover:bg-vynal-purple-secondary/30 text-vynal-text-primary" : "hover:bg-vynal-purple-100/60 text-vynal-purple-dark"}`}
                            >
                              <Wallet className="h-3 w-3" />
                              <span>Portefeuille</span>
                            </Link>
                            <Link
                              href="/contact"
                              className={`flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs cursor-pointer ${isDark ? "hover:bg-vynal-purple-secondary/30 text-vynal-text-primary" : "hover:bg-vynal-purple-100/60 text-vynal-purple-dark"}`}
                            >
                              <AlertTriangle className="h-3 w-3" />
                              <span>Vynal Support</span>
                            </Link>
                            <Link
                              href="/status"
                              className={`flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs cursor-pointer ${isDark ? "hover:bg-vynal-purple-secondary/30 text-vynal-text-primary" : "hover:bg-vynal-purple-100/60 text-vynal-purple-dark"}`}
                            >
                              <Badge className="h-3 w-3" />
                              <span>Vynal Statuts</span>
                            </Link>
                            <div
                              className={`flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs cursor-pointer ${isDark ? "hover:bg-vynal-purple-secondary/30 text-vynal-text-primary" : "hover:bg-vynal-purple-100/60 text-vynal-purple-dark"}`}
                            >
                              <span className="flex items-center justify-between w-full">
                                <span className="flex items-center gap-1.5">
                                  <Wallet className="h-3 w-3" />
                                  <span>Devise</span>
                                </span>
                                <select
                                  className={`text-xs px-1 py-0.5 rounded-md ${isDark ? "bg-vynal-purple-dark border-vynal-purple-secondary/30" : "bg-white border-vynal-purple-100"} border`}
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    // Enregistrer la préférence de devise
                                    localStorage.setItem(
                                      "vynal_currency_preference",
                                      value,
                                    );
                                    localStorage.setItem(
                                      "vynal_currency_timestamp",
                                      Date.now().toString(),
                                    );
                                    // Déclencher l'événement global de changement de devise
                                    triggerCurrencyChangeEvent(value);
                                    // Fermer le menu
                                    setIsOpen(false);
                                    // Notification de succès
                                    toast.success(
                                      `Devise mise à jour: ${value}. Tous les prix ont été convertis.`,
                                    );
                                  }}
                                  defaultValue={
                                    typeof window !== "undefined"
                                      ? localStorage.getItem(
                                          "vynal_currency_preference",
                                        ) || "EUR"
                                      : "EUR"
                                  }
                                >
                                  <option value="XOF">XOF (₣)</option>
                                  <option value="EUR">EUR (€)</option>
                                  <option value="USD">USD ($)</option>
                                  <option value="GBP">GBP (£)</option>
                                  <option value="MAD">MAD (DH)</option>
                                  <option value="XAF">XAF (₣)</option>
                                </select>
                              </span>
                            </div>
                          </div>
                          <div className="border-t border-vynal-purple-secondary/20 dark:border-vynal-purple-secondary/20 my-1" />
                          <button
                            onClick={handleLogout}
                            className={`flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[10px] w-full cursor-pointer ${isDark ? "hover:bg-vynal-purple-secondary/30 text-vynal-text-primary" : "hover:bg-vynal-purple-100/60 text-vynal-purple-dark"}`}
                          >
                            <LogOut className="h-3 w-3" />
                            <span>Déconnexion</span>
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              ) : (
                // Fallback en cas d'erreur d'état
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center space-x-2"
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => window.location.reload()}
                  >
                    <AlertTriangle
                      className="h-5 w-5 text-amber-500"
                      strokeWidth={2.5}
                    />
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Mobile Menu Button and Search Icon */}
            <div className="md:hidden flex items-center gap-3">
              {pathname?.includes("/services") && (
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

              {/* Bouton d'inscription - Mobile uniquement */}
              {!userStatus.isAuthenticated && !userStatus.authLoading && (
                <Link
                  href={AUTH_ROUTES.REGISTER}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                    isDark
                      ? "bg-vynal-accent-primary/10 text-vynal-accent-primary hover:bg-vynal-accent-primary/20 border border-vynal-accent-primary/20 hover:border-vynal-accent-primary/30"
                      : "bg-white/30 text-slate-700 hover:bg-white/40 border border-slate-200 hover:border-slate-300"
                  }`}
                >
                  S'inscrire
                </Link>
              )}

              {/* Mobile Menu Button with Profile Picture */}
              <MobileMenuButton
                mobileMenuOpen={mobileMenuOpen}
                setMobileMenuOpen={setMobileMenuOpen}
                isAuthenticated={isAuthenticated}
                profileLoading={userStatus.profileLoading}
                avatarUrl={userStatus.avatarUrl}
                username={userStatus.username}
                isDark={isDark}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar - Mobile */}
      <AnimatePresence>
        <MobileSearchBar
          pathname={pathname}
          searchBarVisible={searchBarVisible}
          searchBarRef={searchBarRef}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          handleSearch={handleSearch}
          handleSearchChange={handleSearchChange}
          isDark={isDark}
        />
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
