import { supabase } from '@/lib/supabase/client';
import { Database } from '@/types/database';

type Category = Database['public']['Tables']['categories']['Row'];
type Subcategory = Database['public']['Tables']['subcategories']['Row'];

async function checkCategoriesAndSubcategories() {
  console.log('Vérification des catégories et sous-catégories...');
  
  try {
    // Récupérer les catégories
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('*')
      .order('name');
    
    if (categoriesError) throw categoriesError;
    
    // Récupérer les sous-catégories
    const { data: subcategories, error: subcategoriesError } = await supabase
      .from('subcategories')
      .select('*')
      .order('name');
    
    if (subcategoriesError) throw subcategoriesError;
    
    console.log(`Nombre de catégories: ${categories.length}`);
    console.log(`Nombre de sous-catégories: ${subcategories.length}`);
    
    // Vérifier si on a les 14 catégories principales définies dans le seed
    const expectedCategories = [
      'Développement Web & Mobile',
      'Design Graphique',
      'Marketing Digital',
      'Rédaction & Traduction',
      'Vidéo & Audio',
      'Formation & Éducation',
      'Conseil & Business',
      'Artisanat & Création',
      'Agriculture & Élevage',
      'Informatique & Réseaux',
      'Services Administratifs',
      'Mode & Beauté',
      'Religion & Spiritualité',
      'Santé & Bien-être'
    ];
    
    // Vérifier les catégories manquantes
    const existingCategoryNames = categories.map((cat: Category) => cat.name);
    const missingCategories = expectedCategories.filter((catName: string) => 
      !existingCategoryNames.includes(catName)
    );
    
    if (missingCategories.length > 0) {
      console.log('Catégories manquantes:');
      missingCategories.forEach((cat: string) => console.log(`- ${cat}`));
    } else {
      console.log('Toutes les catégories principales sont présentes.');
    }
    
    // Vérifier les sous-catégories par catégorie
    console.log('\nRépartition des sous-catégories par catégorie:');
    categories.forEach((category: Category) => {
      const categorySubcategories = subcategories.filter(
        (subcat: Subcategory) => subcat.category_id === category.id
      );
      console.log(`${category.name}: ${categorySubcategories.length} sous-catégories`);
    });
    
    // Vérifier les sous-catégories sans catégorie valide
    const orphanSubcategories = subcategories.filter(
      (subcat: Subcategory) => !categories.some((cat: Category) => cat.id === subcat.category_id)
    );
    
    if (orphanSubcategories.length > 0) {
      console.log('\nSous-catégories orphelines (sans catégorie valide):');
      orphanSubcategories.forEach((subcat: Subcategory) => 
        console.log(`- ${subcat.name} (ID: ${subcat.id}, Category ID: ${subcat.category_id})`)
      );
    }
    
  } catch (error: any) {
    console.error('Erreur lors de la vérification:', error.message);
  }
}

// Exécution de la fonction
checkCategoriesAndSubcategories(); 