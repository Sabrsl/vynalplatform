import { revalidatePath } from "next/cache";

// Liste des pages statiques
export const STATIC_PAGES = {
  HOME: "/",
  ABOUT: "/about",
  HOW_IT_WORKS: "/how-it-works",
  FAQ: "/faq",
  PRIVACY_POLICY: "/privacy-policy",
  TERMS_OF_SERVICE: "/terms-of-service",
  CODE_OF_CONDUCT: "/code-of-conduct",
};

/**
 * Invalide le cache de la page d'accueil
 * À appeler lors de la mise à jour des catégories ou sous-catégories
 */
export function invalidateHomePage() {
  revalidatePath("/");
  console.log("Cache de la page d'accueil invalidé");
  return { success: true };
}

/**
 * Invalide une page statique spécifique
 * @param path Le chemin de la page à invalider
 */
export function invalidateStaticPage(path: string) {
  revalidatePath(path);
  console.log(`Cache de la page ${path} invalidé`);
  return { success: true };
}

/**
 * Invalide toutes les pages statiques
 * À utiliser avec précaution car cela peut augmenter la charge serveur
 */
export function invalidateAllStaticPages() {
  Object.values(STATIC_PAGES).forEach((path) => {
    revalidatePath(path);
  });
  console.log("Cache de toutes les pages statiques invalidé");
  return { success: true };
}
