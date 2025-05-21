import { useState, useEffect, useCallback, useRef } from 'react';

interface VersionInfo {
  version: string;
  buildDate: string;
  description: string;
}

/**
 * Hook pour vérifier périodiquement si une nouvelle version du site est disponible
 * @param interval Temps en millisecondes entre chaque vérification (défaut: 15 minutes)
 * @returns Un objet contenant l'état des mises à jour et une fonction pour rafraîchir la page
 */
export function useVersionCheck(interval = 15 * 60 * 1000) {
  const [hasUpdate, setHasUpdate] = useState(false);
  const [currentVersion, setCurrentVersion] = useState<string | null>(null);
  const [newVersion, setNewVersion] = useState<string | null>(null);
  const storedVersionRef = useRef<string | null>(null);
  
  // Fonction pour vérifier la version
  const checkVersion = useCallback(async () => {
    try {
      // Ajouter un paramètre timestamp pour éviter le cache
      const response = await fetch(`/version.json?_t=${Date.now()}`);
      
      if (!response.ok) {
        console.error('Échec de la récupération de la version:', response.statusText);
        return;
      }
      
      const versionInfo: VersionInfo = await response.json();
      
      // Initialiser la version stockée lors du premier chargement
      if (storedVersionRef.current === null) {
        storedVersionRef.current = versionInfo.version;
        setCurrentVersion(versionInfo.version);
        return;
      }
      
      // Vérifier si la version a changé
      if (versionInfo.version !== storedVersionRef.current) {
        setHasUpdate(true);
        setNewVersion(versionInfo.version);
      }
    } catch (error) {
      console.error('Erreur lors de la vérification de la version:', error);
    }
  }, []);
  
  // Rafraîchir la page pour appliquer la mise à jour
  const applyUpdate = useCallback(() => {
    window.location.reload();
  }, []);
  
  // Vérifier la version au chargement et périodiquement
  useEffect(() => {
    // Vérification initiale
    checkVersion();
    
    // Vérification périodique
    const intervalId = setInterval(checkVersion, interval);
    
    return () => {
      clearInterval(intervalId);
    };
  }, [checkVersion, interval]);
  
  return {
    hasUpdate,
    currentVersion,
    newVersion,
    applyUpdate
  };
} 