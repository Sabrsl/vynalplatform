/**
 * Script pour copier les templates d'email dans un dossier accessible en production
 * Ce script est exécuté avant le build pour s'assurer que les templates sont accessibles
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Début de la copie des templates d\'email...');

// Chemins source et destination
const sourceDir = path.join(__dirname, '..', 'src', 'templates', 'email');
const destBaseDir = path.join(__dirname, '..', 'public', 'templates');
const destDir = path.join(destBaseDir, 'email');

// Créer les répertoires de destination s'ils n'existent pas
function ensureDirectoryExists(directory) {
  if (!fs.existsSync(directory)) {
    console.log(`Création du répertoire: ${directory}`);
    fs.mkdirSync(directory, { recursive: true });
  }
}

// Copier un dossier de manière récursive
function copyFolderRecursive(source, destination) {
  // Créer le répertoire de destination
  ensureDirectoryExists(destination);
  
  // Lire le contenu du répertoire source
  const items = fs.readdirSync(source, { withFileTypes: true });
  
  // Parcourir tous les éléments
  for (const item of items) {
    const srcPath = path.join(source, item.name);
    const destPath = path.join(destination, item.name);
    
    if (item.isDirectory()) {
      // Copier récursivement le sous-dossier
      copyFolderRecursive(srcPath, destPath);
    } else {
      // Copier le fichier
      fs.copyFileSync(srcPath, destPath);
      console.log(`✅ Copié: ${srcPath} -> ${destPath}`);
    }
  }
}

try {
  // Créer le répertoire templates/email dans public
  ensureDirectoryExists(destBaseDir);
  
  // Vérifier si le répertoire source existe
  if (fs.existsSync(sourceDir)) {
    // Supprimer la destination si elle existe déjà
    if (fs.existsSync(destDir)) {
      console.log(`Suppression du répertoire existant: ${destDir}`);
      fs.rmSync(destDir, { recursive: true, force: true });
    }
    
    // Copier le dossier récursivement
    copyFolderRecursive(sourceDir, destDir);
    
    console.log('✅ Tous les templates ont été copiés avec succès!');
  } else {
    console.error(`❌ Le répertoire source n'existe pas: ${sourceDir}`);
    process.exit(1);
  }
} catch (error) {
  console.error('❌ Erreur lors de la copie des templates:', error);
  process.exit(1);
} 