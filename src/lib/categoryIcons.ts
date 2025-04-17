/**
 * Fonction pour obtenir l'emoji correspondant à une catégorie
 * basée sur le nom de la catégorie
 */
export function getCategoryEmoji(categoryName: string): string {
  const name = categoryName.toLowerCase();
    
  if (name.includes('dev') || name.includes('code') || name.includes('web')) return '💻';
  if (name.includes('design') || name.includes('graph')) return '🎨';
  if (name.includes('market') || name.includes('seo')) return '📊';
  if (name.includes('redac') || name.includes('écrit') || name.includes('text')) return '✍️';
  if (name.includes('video') || name.includes('film') || name.includes('montage')) return '🎬';
  if (name.includes('photo')) return '📷';
  if (name.includes('traduct') || name.includes('langue')) return '🌐';
  if (name.includes('audio') || name.includes('musique')) return '🎵';
  if (name.includes('data') || name.includes('donnée')) return '📊';
  if (name.includes('busines') || name.includes('affaire')) return '💼';
  if (name.includes('conseil') || name.includes('consult')) return '📝';
  if (name.includes('juridique') || name.includes('droit') || name.includes('legal')) return '⚖️';
  if (name.includes('formation') || name.includes('cours') || name.includes('educ')) return '📚';
  if (name.includes('admin') || name.includes('bureau')) return '📋';
  if (name.includes('art') || name.includes('créa')) return '🎭';
  if (name.includes('agri') || name.includes('ferme') || name.includes('elevage')) return '🌱';
  if (name.includes('sante') || name.includes('bien')) return '🧘‍♂️';
  if (name.includes('mode') || name.includes('beaute')) return '👗';
  if (name.includes('relig') || name.includes('spirit')) return '🕌';
  if (name.includes('info') || name.includes('reseau')) return '🔌';
  
  // Emoji par défaut si aucune correspondance n'est trouvée
  return '🔍';
} 