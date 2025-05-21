const fs = require('fs');
const path = require('path');

/**
 * Valide le format de version sémantique (SemVer)
 * Format valide: X.Y.Z (avec d'éventuels suffixes comme -alpha, -beta, etc.)
 * @param {string} version La version à valider
 * @returns {boolean} True si la version est valide, false sinon
 */
function isValidSemVer(version) {
  // Format de base X.Y.Z avec suffixes optionnels (comme 1.2.3-alpha.1+build.2)
  const semverRegex = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;
  return semverRegex.test(version);
}

// Chemin vers le fichier package.json
const packageJsonPath = path.join(__dirname, '..', 'package.json');
// Chemin vers le fichier version.json
const versionJsonPath = path.join(__dirname, '..', 'public', 'version.json');

// Lire le fichier package.json
try {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const version = packageJson.version;
  
  // Valider le format de version
  if (!isValidSemVer(version)) {
    console.error(`❌ Format de version invalide: ${version}`);
    console.error('La version doit suivre le format sémantique X.Y.Z (ex: 1.2.3 ou 1.0.0-beta.1)');
    process.exit(1);
  }
  
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