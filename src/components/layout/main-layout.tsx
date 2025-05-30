"use client";

import { ReactNode, useEffect, useMemo, useState, useCallback, memo } from "react";
import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import usePreventScrollReset from "@/hooks/usePreventScrollReset";
import { useTheme } from "next-themes";
import { Loader } from "@/components/ui/loader";
import Header from "./header";
import Footer from "./footer";
import PageTransition from "@/components/ui/page-transition";

// Chargement dynamique des composants Header et Footer pour améliorer les performances
const HeaderComponent = dynamic(() => import("./header"), {
  ssr: true,
});

const FooterComponent = dynamic(() => import("./footer"), {
  ssr: true,
  loading: () => (
    <div className="h-16 bg-white dark:bg-gray-900 animate-pulse" />
  ),
});

// Pages avec des mises en page spéciales - déplacé hors du composant pour éviter les recréations
const SPECIAL_LAYOUTS = {
  AUTH_PAGES: ["/auth/", "/auth/login", "/auth/signup", "/auth/reset-password", "/auth/verify-email"],
  NO_FOOTER_PAGES: ["/chat", "/messages", "/video-call"],
  FULL_WIDTH_PAGES: ["/dashboard", "/profile", "/settings"],
  NO_HEADER_PAGES: ["/status"]
};

interface MainLayoutProps {
  children: React.ReactNode;
}

// Composant de chargement mémorisé pour éviter des rendus inutiles
const LoadingSpinner = memo(() => (
  <div className="fixed inset-0 flex items-center justify-center">
    <Loader size="md" variant="secondary" />
  </div>
));

LoadingSpinner.displayName = "LoadingSpinner";

// Composant d'authentification mémorisé
const AuthLayout = memo(({ children, pathname }: { children: React.ReactNode; pathname: string | null }) => (
  <motion.div 
    className="min-h-screen overflow-hidden bg-gradient-to-br from-indigo-50 to-pink-50 dark:from-slate-900 dark:to-indigo-950"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.3 }}
  >
    <AnimatePresence mode="wait">
      <motion.div 
        key={pathname}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3 }}
        className="p-4 sm:p-6 md:p-8 flex items-center justify-center"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  </motion.div>
));

AuthLayout.displayName = "AuthLayout";

// Composant de mise en page standard mémorisé
const StandardLayout = memo(({ 
  children, 
  isFullWidth, 
  shouldHideFooter,
  shouldHideHeader,
}: { 
  children: React.ReactNode; 
  isFullWidth: boolean; 
  shouldHideFooter: boolean;
  shouldHideHeader: boolean;
}) => (
  <div className={`flex flex-col min-h-screen ${
    isFullWidth ? 'max-w-full' : 'max-w-screen-2xl mx-auto'
  }`}>
    {!shouldHideHeader && <HeaderComponent />}
    <main className="flex-grow">
      {children}
    </main>
    {!shouldHideFooter && <FooterComponent />}
    <PageTransition />
  </div>
));

StandardLayout.displayName = "StandardLayout";

function MainLayout({ children }: MainLayoutProps) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  // Appliquer le hook pour empêcher le reset du scroll
  usePreventScrollReset();
  
  // Mémoriser les vérifications de chemin pour éviter les calculs inutiles
  const layoutConfig = useMemo(() => {
    const isAuthPage = SPECIAL_LAYOUTS.AUTH_PAGES.some(path => pathname?.startsWith(path));
    const shouldHideFooter = SPECIAL_LAYOUTS.NO_FOOTER_PAGES.some(path => pathname?.startsWith(path));
    const isFullWidth = SPECIAL_LAYOUTS.FULL_WIDTH_PAGES.some(path => pathname?.startsWith(path));
    const shouldHideHeader = SPECIAL_LAYOUTS.NO_HEADER_PAGES.some(path => pathname?.startsWith(path));
    
    return {
      isAuthPage,
      shouldHideFooter,
      isFullWidth,
      shouldHideHeader
    };
  }, [pathname]);
  
  // Eviter les problèmes d'hydratation avec next-themes
  useEffect(() => {
    setMounted(true);
  }, []);

  // Gestionnaire d'événement de défilement optimisé
  const handleScroll = useCallback(() => {
    if (layoutConfig.shouldHideFooter || layoutConfig.isAuthPage) return;
    
    const scrollPosition = window.scrollY + window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    
    if (documentHeight - scrollPosition < 1000) {
      // Précharger le footer lorsque l'utilisateur approche du bas de la page
      import("./footer");
    }
  }, [layoutConfig]);

  // Préchargement des composants lourds lorsque l'utilisateur est sur le point de les voir
  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);
  
  // Détection du système de couleur préférée pour le thème initial
  useEffect(() => {
    if (mounted && !localStorage.getItem('theme')) {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      setTheme(systemTheme);
    }
  }, [mounted, setTheme]);
  
  // Gestionnaire d'événement pour le changement de préférence système
  const handleSystemThemeChange = useCallback((event: MediaQueryListEvent) => {
    if (!localStorage.getItem('theme')) {
      setTheme(event.matches ? 'dark' : 'light');
    }
  }, [setTheme]);
  
  // Gestion de l'événement de changement de préférence système
  useEffect(() => {
    const systemThemeMedia = window.matchMedia('(prefers-color-scheme: dark)');
    systemThemeMedia.addEventListener('change', handleSystemThemeChange);
    
    return () => {
      systemThemeMedia.removeEventListener('change', handleSystemThemeChange);
    };
  }, [handleSystemThemeChange]);
  
  // Appliquer différentes mises en page selon le type de page
  if (!mounted) {
    return <LoadingSpinner />;
  }
  
  // Mise en page pour les pages d'authentification
  if (layoutConfig.isAuthPage) {
    return (
      <AuthLayout pathname={pathname}>
        {children}
        <PageTransition />
      </AuthLayout>
    );
  }
  
  // Mise en page standard avec options configurables
  return (
    <StandardLayout
      isFullWidth={layoutConfig.isFullWidth}
      shouldHideFooter={layoutConfig.shouldHideFooter}
      shouldHideHeader={layoutConfig.shouldHideHeader}
    >
      {children}
    </StandardLayout>
  );
}

export default memo(MainLayout);