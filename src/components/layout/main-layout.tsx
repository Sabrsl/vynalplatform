"use client";

import React, { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";
import usePreventScrollReset from "@/hooks/usePreventScrollReset";
import { useTheme } from "next-themes";
import { AnimatePresence, motion } from "framer-motion";

// Chargement dynamique des composants Header et Footer pour améliorer les performances
const Header = dynamic(() => import("./header"), {
  ssr: true
});

const Footer = dynamic(() => import("./footer"), {
  ssr: true,
  loading: () => (
    <div className="h-32 sm:h-48 w-full animate-pulse bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900" />
  )
});

// Pages avec des mises en page spéciales
const SPECIAL_LAYOUTS = {
  AUTH_PAGES: ["/auth/", "/auth/login", "/auth/signup", "/auth/reset-password", "/auth/verify-email"],
  NO_FOOTER_PAGES: ["/chat", "/messages", "/video-call"],
  FULL_WIDTH_PAGES: ["/dashboard", "/profile", "/settings"]
};

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
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
    
    return {
      isAuthPage,
      shouldHideFooter,
      isFullWidth
    };
  }, [pathname]);
  
  // Eviter les problèmes d'hydratation avec next-themes
  useEffect(() => {
    setMounted(true);
  }, []);

  // Préchargement des composants lourds lorsque l'utilisateur est sur le point de les voir
  useEffect(() => {
    // Précharger le footer lorsque l'utilisateur approche du bas de la page
    const handleScroll = () => {
      const scrollPosition = window.scrollY + window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      
      if (documentHeight - scrollPosition < 1000 && !layoutConfig.shouldHideFooter && !layoutConfig.isAuthPage) {
        import("./footer");
      }
    };
    
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [layoutConfig]);
  
  // Détection du système de couleur préférée pour le thème initial
  useEffect(() => {
    if (mounted && !localStorage.getItem('theme')) {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      setTheme(systemTheme);
    }
  }, [mounted, setTheme]);
  
  // Gestion de l'événement de changement de préférence système
  useEffect(() => {
    const handleSystemThemeChange = (event: MediaQueryListEvent) => {
      if (!localStorage.getItem('theme')) {
        setTheme(event.matches ? 'dark' : 'light');
      }
    };
    
    const systemThemeMedia = window.matchMedia('(prefers-color-scheme: dark)');
    systemThemeMedia.addEventListener('change', handleSystemThemeChange);
    
    return () => {
      systemThemeMedia.removeEventListener('change', handleSystemThemeChange);
    };
  }, [setTheme]);
  
  // Appliquer différentes mises en page selon le type de page
  if (!mounted) {
    // État de chargement initial masqué pour éviter un flash de contenu non thémé
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }
  
  // Mise en page pour les pages d'authentification
  if (layoutConfig.isAuthPage) {
    return (
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
    );
  }
  
  // Mise en page standard avec options configurables
  return (
    <div className={`flex flex-col min-h-screen ${
      layoutConfig.isFullWidth ? 'max-w-full' : 'max-w-screen-2xl mx-auto'
    }`}>
      <Header />
      <main className="flex-grow">
        {children}
      </main>
      {!layoutConfig.shouldHideFooter && <Footer />}
    </div>
  );
}