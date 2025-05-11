/**
 * Utilitaires de sécurité pour le système de cache
 * Ces fonctions ajoutent une couche de vérification pour garantir l'intégrité des données
 */

import { getCachedData, setCachedData, type CacheOptions } from './cache';

/**
 * Récupère des données du cache avec vérification de type et valeur par défaut
 * Cette fonction ajoute une couche de sécurité pour garantir que les données récupérées
 * correspondent au type attendu et fournit des valeurs par défaut appropriées
 * 
 * @param key Clé de cache
 * @param defaultValue Valeur par défaut si aucune donnée n'est trouvée ou si le type est incorrect
 * @param typeCheck Fonction optionnelle pour vérifier le type des données
 * @param options Options de cache
 * @returns Les données typées ou la valeur par défaut
 */
export function getSafeCachedData<T>(
  key: string, 
  defaultValue: T,
  typeCheck?: (data: any) => boolean,
  options?: CacheOptions
): T {
  // Récupérer les données du cache
  const cachedData = getCachedData<T>(key, options);
  
  // Si aucune donnée n'est trouvée, retourner la valeur par défaut
  if (cachedData === null || cachedData === undefined) {
    return defaultValue;
  }
  
  // Vérifications spécifiques selon le type attendu
  if (Array.isArray(defaultValue) && !Array.isArray(cachedData)) {
    console.warn(`Cache data for key "${key}" is not an array as expected`);
    return defaultValue;
  }
  
  // Si une fonction de vérification personnalisée est fournie, l'utiliser
  if (typeCheck && !typeCheck(cachedData)) {
    console.warn(`Cache data for key "${key}" failed type check`);
    return defaultValue;
  }
  
  // Vérifications supplémentaires pour les types primitifs
  if (
    (typeof defaultValue === 'string' && typeof cachedData !== 'string') ||
    (typeof defaultValue === 'number' && typeof cachedData !== 'number') ||
    (typeof defaultValue === 'boolean' && typeof cachedData !== 'boolean')
  ) {
    console.warn(`Cache data for key "${key}" has incorrect primitive type`);
    return defaultValue;
  }
  
  // Si c'est un objet vide utilisé comme valeur par défaut, vérifier que cachedData est un objet
  if (
    typeof defaultValue === 'object' && 
    !Array.isArray(defaultValue) && 
    defaultValue !== null &&
    (typeof cachedData !== 'object' || Array.isArray(cachedData) || cachedData === null)
  ) {
    console.warn(`Cache data for key "${key}" is not an object as expected`);
    return defaultValue;
  }
  
  return cachedData;
}

/**
 * Vérifie si un objet ressemble à un tableau d'objets du type attendu
 * Cette fonction est utile pour valider les données récupérées du cache
 * 
 * @param data Données à vérifier
 * @param requiredProps Tableau de propriétés obligatoires
 * @returns Booléen indiquant si les données sont du type attendu
 */
export function isValidObjectArray(data: any, requiredProps: string[]): boolean {
  if (!Array.isArray(data)) {
    return false;
  }
  
  return data.every(item => 
    typeof item === 'object' && 
    item !== null && 
    requiredProps.every(prop => prop in item)
  );
}

/**
 * Vérifie si un objet ressemble à un objet du type attendu
 * 
 * @param data Données à vérifier
 * @param requiredProps Tableau de propriétés obligatoires
 * @returns Booléen indiquant si les données sont du type attendu
 */
export function isValidObject(data: any, requiredProps: string[]): boolean {
  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    return false;
  }
  
  return requiredProps.every(prop => prop in data);
} 