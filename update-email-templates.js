const fs = require('fs');
const path = require('path');

// Dossier contenant les templates d'email
const emailTemplatesDir = path.join(__dirname, 'src', 'templates', 'email');

// Fonction pour parcourir récursivement les dossiers
function walkDir(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat && stat.isDirectory()) {
      // Récursion dans les sous-dossiers
      results = results.concat(walkDir(filePath));
    } else if (path.extname(file) === '.html') {
      // Ne retenir que les fichiers HTML
      results.push(filePath);
    }
  });
  
  return results;
}

// Obtenir tous les fichiers HTML des templates d'email
const emailTemplates = walkDir(emailTemplatesDir);
console.log(`Trouvé ${emailTemplates.length} templates d'email.`);

// Compteurs pour le rapport
let modifiedCount = 0;
let skippedCount = 0;

// Parcourir tous les templates et remplacer la balise d'image du logo
emailTemplates.forEach(templatePath => {
  try {
    let content = fs.readFileSync(templatePath, 'utf8');
    const fileNameWithExt = path.basename(templatePath);
    const fileName = path.basename(templatePath, '.html');
    const folderName = path.basename(path.dirname(templatePath));
    
    // Déterminer la couleur en fonction du dossier (client ou freelance)
    const color = folderName === 'client' ? '#6554AF' : 'white';
    
    // Vérifier si le fichier contient une référence au logo
    if (content.includes('vynalplatform.com/assets/logo') || content.includes('<img') && content.includes('logo')) {
      // Remplacer la balise img par un texte simple
      const modifiedContent = content.replace(
        /<div class="header">\s*<img[^>]*?(?:logo|vynal)[^>]*?>\s*<\/div>/gis, 
        `<div class="header">\n      <h1 style="color: ${color}; font-size: 18px; margin: 0;">Vynal Platform</h1>\n    </div>`
      );
      
      // Vérifier si des modifications ont été effectuées
      if (content !== modifiedContent) {
        fs.writeFileSync(templatePath, modifiedContent, 'utf8');
        console.log(`✅ Logo supprimé de: ${fileNameWithExt}`);
        modifiedCount++;
      } else {
        console.log(`⚠️ Aucun changement dans: ${fileNameWithExt} (logo non trouvé dans le format attendu)`);
        skippedCount++;
      }
    } else {
      console.log(`ℹ️ Pas de logo dans: ${fileNameWithExt}`);
      skippedCount++;
    }
  } catch (error) {
    console.error(`❌ Erreur lors du traitement de ${templatePath}:`, error.message);
    skippedCount++;
  }
});

console.log('\n--- Rapport ---');
console.log(`Total des templates: ${emailTemplates.length}`);
console.log(`Templates modifiés: ${modifiedCount}`);
console.log(`Templates ignorés: ${skippedCount}`);
console.log('--------------------'); 