#!/usr/bin/env node

/**
 * Script de validation pour les fichiers critiques liés aux services
 * Vérifie que les imports sont correctement configurés et que les fonctions
 * nécessaires sont exportées
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('\n🔍 Validation des fichiers critiques des services...');

const BASE_DIR = process.cwd();
const SERVICES_DIR = path.join(BASE_DIR, 'src', 'app', 'services');

// Vérification de l'existence des fichiers essentiels
const requiredFiles = [
  'src/app/services/server.tsx',
  'src/app/services/page.tsx',
  'src/app/services/sitemap.js',
  'src/lib/supabase/server.ts'
];

let errors = 0;

// Vérifier si tous les fichiers requis existent
requiredFiles.forEach(file => {
  const filePath = path.join(BASE_DIR, file);
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Fichier requis manquant: ${file}`);
    errors++;
  } else {
    console.log(`✅ Fichier trouvé: ${file}`);
  }
});

// Vérification des imports et exports dans server.tsx
const serverTsxPath = path.join(SERVICES_DIR, 'server.tsx');
if (fs.existsSync(serverTsxPath)) {
  const content = fs.readFileSync(serverTsxPath, 'utf-8');
  
  // Vérifier que getServicesPageData est exporté
  if (!content.includes('export async function getServicesPageData')) {
    console.error('❌ La fonction getServicesPageData n\'est pas exportée dans server.tsx');
    errors++;
  } else {
    console.log('✅ La fonction getServicesPageData est correctement exportée');
  }
  
  // Vérifier l'import de getSupabaseServer
  if (!content.includes('import { getSupabaseServer }')) {
    console.error('❌ getSupabaseServer n\'est pas importé dans server.tsx');
    errors++;
  } else {
    console.log('✅ Import de getSupabaseServer trouvé dans server.tsx');
  }
}

// Vérification des imports dans page.tsx
const pageTsxPath = path.join(SERVICES_DIR, 'page.tsx');
if (fs.existsSync(pageTsxPath)) {
  const content = fs.readFileSync(pageTsxPath, 'utf-8');
  
  // Vérifier l'import de getServicesPageData
  if (!content.includes('import { getServicesPageData } from \'./server\'')) {
    console.error('❌ getServicesPageData n\'est pas correctement importé dans page.tsx');
    errors++;
  } else {
    console.log('✅ Import de getServicesPageData trouvé dans page.tsx');
  }
}

// Vérification des imports dans sitemap.js
const sitemapJsPath = path.join(SERVICES_DIR, 'sitemap.js');
if (fs.existsSync(sitemapJsPath)) {
  const content = fs.readFileSync(sitemapJsPath, 'utf-8');
  
  // Vérifier l'export par défaut
  if (!content.includes('export default function sitemap')) {
    console.error('❌ La fonction sitemap n\'est pas exportée par défaut dans sitemap.js');
    errors++;
  } else {
    console.log('✅ Export par défaut trouvé dans sitemap.js');
  }
}

// Vérification du fichier components/services/ServicesClientPage.tsx
const servicesClientPagePath = path.join(BASE_DIR, 'src', 'components', 'services', 'ServicesClientPage.tsx');
if (fs.existsSync(servicesClientPagePath)) {
  const content = fs.readFileSync(servicesClientPagePath, 'utf-8');
  
  // Vérifier la présence des fonctions locales adaptCategoryForUILocal
  if (!content.includes('adaptCategoryForUILocal')) {
    console.warn('⚠️ Fonction adaptCategoryForUILocal non trouvée dans ServicesClientPage.tsx');
  } else {
    console.log('✅ Fonction adaptCategoryForUILocal trouvée dans ServicesClientPage.tsx');
  }
}

// Résultat final
if (errors > 0) {
  console.error(`\n❌ La validation a échoué avec ${errors} erreur(s).`);
  process.exit(1);
} else {
  console.log('\n✅ Tous les fichiers de services sont correctement configurés!');
  process.exit(0);
} 