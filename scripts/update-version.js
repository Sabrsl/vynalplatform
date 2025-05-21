const fs = require('fs');
const path = require('path');

// Chemin vers le fichier package.json
const packageJsonPath = path.join(__dirname, '..', 'package.json');
// Chemin vers le fichier version.json
const versionJsonPath = path.join(__dirname, '..', 'public', 'version.json');

// Lire le fichier package.json
try {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const version = packageJson.version;
  
  // Créer l'objet version avec la date courante
  const versionData = {
    version,
    buildDate: new Date().toISOString(),
    description: `Version ${version} de Vynal Platform`
  };
  
  // Écrire dans le fichier version.json
  fs.writeFileSync(versionJsonPath, JSON.stringify(versionData, null, 2));
  
  console.log(`✅ Le fichier version.json a été mis à jour avec la version ${version}`);
} catch (error) {
  console.error('❌ Erreur lors de la mise à jour du fichier version.json:', error);
  process.exit(1);
} 