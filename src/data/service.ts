import { ServiceWithFreelanceAndCategories } from "@/hooks/useServices";

/**
 * Sample service data for demo purposes
 * This simulates a service that would typically be fetched from the database
 */
export const service: ServiceWithFreelanceAndCategories & { images?: string[] } = {
  id: "demo-service-001",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  title: "Service de démonstration",
  description: "Ceci est un service de démonstration pour tester les fonctionnalités de commande.",
  price: 25000,
  delivery_time: 5,
  category_id: "cat-001",
  subcategory_id: "subcat-001",
  freelance_id: "user-001",
  active: true,
  slug: "service-demo",
  images: [],
  profiles: {
    id: "user-001",
    username: "demouser",
    full_name: "Utilisateur Démo",
    avatar_url: null,
    bio: "Ceci est un profil de démonstration pour tester les fonctionnalités."
  },
  categories: {
    id: "cat-001",
    name: "Catégorie Démo",
    slug: "categorie-demo"
  },
  subcategories: {
    id: "subcat-001",
    name: "Sous-catégorie Démo",
    slug: "sous-categorie-demo"
  }
}; 