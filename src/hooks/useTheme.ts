import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useTheme as useNextTheme } from 'next-themes';

interface UseThemeResult {
  theme: string | undefined;
  resolvedTheme: 'light' | 'dark';
  isDark: boolean;
  setTheme: (theme: string) => void;
  toggleTheme: () => void;
  systemPrefersDark: boolean;
}

/**
 * Hook optimisé pour la gestion du thème avec détection automatique des préférences système.
 * Évite les flashs de contenu et optimise les performances.
 */
export function useTheme(): UseThemeResult {
  // Utiliser le hook next-themes pour accéder aux fonctionnalités de base
  const { theme, setTheme, systemTheme, resolvedTheme } = useNextTheme();
  
  // État local pour suivre si le thème actuel est sombre
  const [isDark, setIsDark] = useState<boolean>(false);
  
  // Référence pour éviter de recalculer les valeurs à chaque rendu
  const hasInitializedRef = useRef<boolean>(false);
  
  // Détermine de manière optimisée si le système préfère le thème sombre
  const systemPrefersDark = useMemo(() => 
    typeof systemTheme === 'string' && systemTheme === 'dark',
    [systemTheme]
  );
  
  // Déterminer de manière fiable le thème réellement résolu
  const actualTheme = useMemo((): 'light' | 'dark' => {
    // Utiliser resolvedTheme s'il est disponible (next-themes >= 0.2.0)
    if (resolvedTheme) {
      return resolvedTheme as 'light' | 'dark';
    }
    
    // Fallback pour les versions plus anciennes de next-themes
    if (theme === 'system') {
      return systemTheme as 'light' | 'dark' || 'light';
    }
    
    return (theme as 'light' | 'dark') || 'light';
  }, [theme, systemTheme, resolvedTheme]);
  
  // Fonction mémorisée pour basculer le thème
  const toggleTheme = useCallback((): void => {
    setTheme(isDark ? 'light' : 'dark');
  }, [isDark, setTheme]);
  
  // Effet pour mettre à jour l'état isDark et appliquer les classes CSS
  useEffect(() => {
    // Déterminer si le thème est sombre
    const themeIsDark = actualTheme === 'dark';
    
    // Mettre à jour l'état local
    setIsDark(themeIsDark);
    
    // Appliquer directement les classes au document pour éviter les flashs
    if (typeof document !== 'undefined') {
      // Utiliser classList.toggle pour une meilleure performance
      document.documentElement.classList.toggle('dark', themeIsDark);
      
      // Ajouter un attribut data pour le ciblage CSS
      document.documentElement.setAttribute('data-theme', actualTheme);
      
      // Synchroniser avec les méta-tags pour une meilleure compatibilité
      const metaThemeColor = document.querySelector('meta[name="theme-color"]');
      if (metaThemeColor) {
        metaThemeColor.setAttribute(
          'content', 
          themeIsDark ? '#121212' : '#ffffff'
        );
      }
      
      // Marquer comme initialisé
      hasInitializedRef.current = true;
    }
  }, [actualTheme]);
  
  // Retourner un objet mémoïsé pour éviter les recréations à chaque rendu
  return useMemo(() => ({
    theme,
    resolvedTheme: actualTheme,
    isDark,
    setTheme,
    toggleTheme,
    systemPrefersDark
  }), [
    theme,
    actualTheme,
    isDark,
    setTheme,
    toggleTheme,
    systemPrefersDark
  ]);
} 