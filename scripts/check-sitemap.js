/**
 * Script pour vérifier l'accessibilité du sitemap
 * 
 * Utilisation: node check-sitemap.js
 */

const https = require('https');
const http = require('http');
const { parse } = require('url');

// URL du sitemap à vérifier
const sitemapUrl = process.env.NEXT_PUBLIC_SITE_URL 
  ? `${process.env.NEXT_PUBLIC_SITE_URL}/sitemap.xml` 
  : 'https://vynalplatform.com/sitemap.xml';

console.log(`Vérification du sitemap à l'URL: ${sitemapUrl}`);

// Parsez l'URL pour déterminer le protocole
const parsedUrl = parse(sitemapUrl);
const client = parsedUrl.protocol === 'https:' ? https : http;

// Effectuez la requête
client.get(sitemapUrl, (res) => {
  const { statusCode } = res;
  const contentType = res.headers['content-type'];

  let error;
  if (statusCode !== 200) {
    error = new Error(`Échec de la requête. Statut: ${statusCode}`);
  } else if (!/^application\/xml|text\/xml/.test(contentType)) {
    error = new Error(`Type de contenu invalide. Attendu: application/xml ou text/xml, Reçu: ${contentType}`);
  }

  if (error) {
    console.error(error.message);
    // Consommer la réponse pour libérer la mémoire
    res.resume();
    process.exit(1);
    return;
  }

  res.setEncoding('utf8');
  let rawData = '';
  res.on('data', (chunk) => { rawData += chunk; });
  res.on('end', () => {
    try {
      // Vérifier que le contenu ressemble à un sitemap XML valide
      if (rawData.includes('<urlset') && rawData.includes('</urlset>')) {
        console.log('✅ Le sitemap est accessible et semble valide.');
        
        // Compter le nombre d'URLs
        const urlCount = (rawData.match(/<url>/g) || []).length;
        console.log(`📊 Nombre d'URLs dans le sitemap: ${urlCount}`);
        
        process.exit(0);
      } else {
        console.error('❌ Le fichier n\'a pas le format attendu pour un sitemap XML.');
        process.exit(1);
      }
    } catch (e) {
      console.error('❌ Erreur lors de l\'analyse du sitemap:', e.message);
      process.exit(1);
    }
  });
}).on('error', (e) => {
  console.error(`❌ Erreur de requête: ${e.message}`);
  process.exit(1);
}); 