/**
 * Utilitaires de sÃ©curitÃ© pour le systÃ¨me de cache
 * Ces fonctions ajoutent une couche de vÃ©rification pour garantir l'intÃ©gritÃ© des donnÃ©es
 */

// import { getCachedData, setCachedData, type CacheOptions } from './cache'; // Imports inutilisÃ©s: setCachedData, type CacheOptions

/**
 * RÃ©cupÃ¨re des donnÃ©es du cache avec vÃ©rification de type et valeur par dÃ©faut
 * Cette fonction ajoute une couche de sÃ©curitÃ© pour garantir que les donnÃ©es rÃ©cupÃ©rÃ©es
 * correspondent au type attendu et fournit des valeurs par dÃ©faut appropriÃ©es
 *
 * @param key ClÃ© de cache
 * @param defaultValue Valeur par dÃ©faut si aucune donnÃ©e n'est trouvÃ©e ou si le type est incorrect
 * @param typeCheck Fonction optionnelle pour vÃ©rifier le type des donnÃ©es
 * @param options Options de cache
 * @returns Les donnÃ©es typÃ©es ou la valeur par dÃ©faut
 */
export function getSafeCachedData<T>(
  key: string,
  defaultValue: T,
  typeCheck?: (data: any) => boolean,
  options?: CacheOptions,
): T {
  // RÃ©cupÃ©rer les donnÃ©es du cache
  const cachedData = getCachedData<T>(key, options);

  // Si aucune donnÃ©e n'est trouvÃ©e, retourner la valeur par dÃ©faut
  if (cachedData === null || cachedData === undefined) {
    return defaultValue;
  }

  // VÃ©rifications spÃ©cifiques selon le type attendu
  if (Array.isArray(defaultValue) && !Array.isArray(cachedData)) {
    console.warn(`Cache data for key "${key}" is not an array as expected`);
    return defaultValue;
  }

  // Si une fonction de vÃ©rification personnalisÃ©e est fournie, l'utiliser
  if (typeCheck && !typeCheck(cachedData)) {
    console.warn(`Cache data for key "${key}" failed type check`);
    return defaultValue;
  }

  // VÃ©rifications supplÃ©mentaires pour les types primitifs
  if (
    (typeof defaultValue === "string" && typeof cachedData !== "string") ||
    (typeof defaultValue === "number" && typeof cachedData !== "number") ||
    (typeof defaultValue === "boolean" && typeof cachedData !== "boolean")
  ) {
    console.warn(`Cache data for key "${key}" has incorrect primitive type`);
    return defaultValue;
  }

  // Si c'est un objet vide utilisÃ© comme valeur par dÃ©faut, vÃ©rifier que cachedData est un objet
  if (
    typeof defaultValue === "object" &&
    !Array.isArray(defaultValue) &&
    defaultValue !== null &&
    (typeof cachedData !== "object" ||
      Array.isArray(cachedData) ||
      cachedData === null)
  ) {
    console.warn(`Cache data for key "${key}" is not an object as expected`);
    return defaultValue;
  }

  return cachedData;
}

/**
 * VÃ©rifie si un objet ressemble Ã  un tableau d'objets du type attendu
 * Cette fonction est utile pour valider les donnÃ©es rÃ©cupÃ©rÃ©es du cache
 *
 * @param data DonnÃ©es Ã  vÃ©rifier
 * @param requiredProps Tableau de propriÃ©tÃ©s obligatoires
 * @returns BoolÃ©en indiquant si les donnÃ©es sont du type attendu
 */
export function isValidObjectArray(
  data: any,
  requiredProps: string[],
): boolean {
  if (!Array.isArray(data)) {
    return false;
  }

  return data.every(
    (item) =>
      typeof item === "object" &&
      item !== null &&
      requiredProps.every((prop) => prop in item),
  );
}

/**
 * VÃ©rifie si un objet ressemble Ã  un objet du type attendu
 *
 * @param data DonnÃ©es Ã  vÃ©rifier
 * @param requiredProps Tableau de propriÃ©tÃ©s obligatoires
 * @returns BoolÃ©en indiquant si les donnÃ©es sont du type attendu
 */
export function isValidObject(data: any, requiredProps: string[]): boolean {
  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    return false;
  }

  return requiredProps.every((prop) => prop in data);
}
