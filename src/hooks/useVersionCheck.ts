import { useState, useEffect, useCallback, useRef } from 'react';

interface VersionInfo {
  version: string;
  buildDate: string;
  description: string;
}

/**
 * Compare deux versions sémantiques (SemVer)
 * @param v1 La première version (ex: "1.2.3")
 * @param v2 La deuxième version (ex: "1.3.0")
 * @returns -1 si v1 < v2, 0 si v1 == v2, 1 si v1 > v2
 */
function compareVersions(v1: string, v2: string): number {
  const v1Parts = v1.split('.').map(part => parseInt(part, 10));
  const v2Parts = v2.split('.').map(part => parseInt(part, 10));
  
  // Comparer les parties numériques une par une
  for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
    const v1Part = v1Parts[i] || 0;
    const v2Part = v2Parts[i] || 0;
    
    if (v1Part > v2Part) return 1;
    if (v1Part < v2Part) return -1;
  }
  
  // Les versions sont identiques
  return 0;
}

/**
 * Hook pour vérifier périodiquement si une nouvelle version du site est disponible
 * @param interval Temps en millisecondes entre chaque vérification (défaut: 2 minutes)
 * @returns Un objet contenant l'état des mises à jour et une fonction pour rafraîchir la page
 */
export function useVersionCheck(interval = 2 * 60 * 1000) {
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
      
      // Vérifier si la version a changé et si elle est plus récente
      if (versionInfo.version !== storedVersionRef.current &&
          compareVersions(versionInfo.version, storedVersionRef.current) > 0) {
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