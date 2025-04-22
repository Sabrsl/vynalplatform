import { useEffect, useState } from 'react';
import { useTheme as useNextTheme } from 'next-themes';

export function useTheme() {
  const { theme, setTheme, systemTheme } = useNextTheme();
  const [isDark, setIsDark] = useState(false);
  
  // Détermine si le thème actuel est sombre
  useEffect(() => {
    // Vérifier si le thème est "system" et utiliser le thème du système
    const isDarkTheme = 
      theme === 'dark' || 
      (theme === 'system' && systemTheme === 'dark');
    
    setIsDark(isDarkTheme);
    
    // Optimiser en appliquant directement les classes au document pour éviter les flashs
    if (typeof document !== 'undefined') {
      if (isDarkTheme) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [theme, systemTheme]);
  
  return {
    theme,
    setTheme,
    isDark,
    toggleTheme: () => setTheme(isDark ? 'light' : 'dark')
  };
} 