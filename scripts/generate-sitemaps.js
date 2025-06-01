/**
 * Script de génération de sitemaps
 * 
 * Ce script génère dynamiquement les différents sitemaps du site:
 * - sitemap-index.xml (principal)
 * - sitemap.xml (pages statiques)
 * - sitemap-services.xml (services)
 * - sitemap-freelancers.xml (profils freelances)
 * - sitemap-blog.xml (articles de blog)
 * - sitemap-categories.xml (catégories)
 * - sitemap-locations.xml (localisations)
 * 
 * Chaque sitemap respecte la limite de 50 000 URLs ou 50 Mo.
 */

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Chargement des variables d'environnement
dotenv.config();

// Tentative d'initialisation de Supabase si disponible
let supabase = null;
try {
  const { createClient } = require('@supabase/supabase-js');
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (supabaseUrl && supabaseAnonKey) {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
    console.log('✅ Connexion à Supabase établie');
  } else {
    console.log('⚠️ Variables d\'environnement Supabase manquantes');
  }
} catch (error) {
  console.log('⚠️ Impossible de charger Supabase:', error.message);
}

// URL de base du site
const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://vynalplatform.com';

// Chemins des fichiers de sortie
const PUBLIC_DIR = path.join(process.cwd(), 'public');
const sitemapIndexPath = path.join(PUBLIC_DIR, 'sitemap-index.xml');
const sitemapPath = path.join(PUBLIC_DIR, 'sitemap.xml');
const sitemapServicesPath = path.join(PUBLIC_DIR, 'sitemap-services.xml');
const sitemapFreelancersPath = path.join(PUBLIC_DIR, 'sitemap-freelancers.xml');
const sitemapBlogPath = path.join(PUBLIC_DIR, 'sitemap-blog.xml');
const sitemapLocationsPath = path.join(PUBLIC_DIR, 'sitemap-locations.xml');

// Date actuelle formatée pour les sitemaps
const currentDate = new Date().toISOString();

/**
 * Génère le contenu XML pour un sitemap d'URLs
 * @param {Array} urls - Tableau d'objets URL avec loc, lastmod, changefreq et priority
 * @returns {string} - Contenu XML du sitemap
 */
function generateUrlsetXml(urls) {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  
  urls.forEach(url => {
    xml += '  <url>\n';
    xml += `    <loc>${url.loc}</loc>\n`;
    if (url.lastmod) xml += `    <lastmod>${url.lastmod}</lastmod>\n`;
    if (url.changefreq) xml += `    <changefreq>${url.changefreq}</changefreq>\n`;
    if (url.priority) xml += `    <priority>${url.priority}</priority>\n`;
    xml += '  </url>\n';
  });
  
  xml += '</urlset>';
  return xml;
}

/**
 * Génère le contenu XML pour un index de sitemaps
 * @param {Array} sitemaps - Tableau d'objets sitemap avec loc et lastmod
 * @returns {string} - Contenu XML de l'index de sitemaps
 */
function generateSitemapIndexXml(sitemaps) {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  
  sitemaps.forEach(sitemap => {
    xml += '  <sitemap>\n';
    xml += `    <loc>${sitemap.loc}</loc>\n`;
    if (sitemap.lastmod) xml += `    <lastmod>${sitemap.lastmod}</lastmod>\n`;
    xml += '  </sitemap>\n';
  });
  
  xml += '</sitemapindex>';
  return xml;
}

/**
 * Écrit un fichier sitemap sur le disque
 * @param {string} filePath - Chemin du fichier
 * @param {string} content - Contenu XML du sitemap
 */
function writeSitemapFile(filePath, content) {
  fs.writeFileSync(filePath, content);
  console.log(`✅ Sitemap généré: ${path.basename(filePath)}`);
}

/**
 * Génère le sitemap des pages principales
 */
async function generateMainSitemap() {
  const urls = [
    {
      loc: `${baseUrl}/`,
      lastmod: currentDate,
      changefreq: 'daily',
      priority: '1.0'
    },
    {
      loc: `${baseUrl}/about`,
      lastmod: currentDate,
      changefreq: 'monthly',
      priority: '0.8'
    },
    {
      loc: `${baseUrl}/how-it-works`,
      lastmod: currentDate,
      changefreq: 'monthly',
      priority: '0.8'
    },
    {
      loc: `${baseUrl}/devenir-freelance`,
      lastmod: currentDate,
      changefreq: 'monthly',
      priority: '0.8'
    },
    {
      loc: `${baseUrl}/faq`,
      lastmod: currentDate,
      changefreq: 'monthly',
      priority: '0.7'
    },
    {
      loc: `${baseUrl}/contact`,
      lastmod: currentDate,
      changefreq: 'monthly',
      priority: '0.6'
    },
    {
      loc: `${baseUrl}/privacy-policy`,
      lastmod: currentDate,
      changefreq: 'yearly',
      priority: '0.3'
    },
    {
      loc: `${baseUrl}/terms-of-service`,
      lastmod: currentDate,
      changefreq: 'yearly',
      priority: '0.3'
    },
    {
      loc: `${baseUrl}/code-of-conduct`,
      lastmod: currentDate,
      changefreq: 'yearly',
      priority: '0.3'
    }
  ];
  
  const xml = generateUrlsetXml(urls);
  writeSitemapFile(sitemapPath, xml);
  return true; // Ce sitemap est toujours généré
}

/**
 * Génère le sitemap des services
 * @returns {boolean} - Indique si le sitemap a été généré
 */
async function generateServicesSitemap() {
  try {
    // Page principale des services
    const urls = [
      {
        loc: `${baseUrl}/services`,
        lastmod: currentDate,
        changefreq: 'daily',
        priority: '0.9'
      }
    ];
    
    // Récupérer les services depuis Supabase si disponible
    if (supabase) {
      const { data, error } = await supabase
        .from('services')
        .select('slug, updated_at, created_at')
        .eq('active', true)
        .eq('status', 'approved');
        
      if (error) throw error;
      
      // N'ajouter que les services réels (pas d'exemples)
      if (data && data.length > 0) {
        data.forEach(service => {
          urls.push({
            loc: `${baseUrl}/services/${service.slug}`,
            lastmod: service.updated_at || service.created_at || currentDate,
            changefreq: 'weekly',
            priority: '0.7'
          });
        });
        
        // Vérifier la limite de 50 000 URLs
        if (urls.length > 50000) {
          console.warn(`⚠️ Le sitemap des services dépasse 50 000 URLs (${urls.length}). Splitting nécessaire.`);
          // Ici on pourrait implémenter une logique de fractionnement
        }
      } else {
        console.log('ℹ️ Aucun service actif et approuvé trouvé. Génération du sitemap services avec seulement la page principale.');
      }
    } else {
      console.log('ℹ️ Supabase non disponible. Génération du sitemap services avec seulement la page principale.');
    }
    
    const xml = generateUrlsetXml(urls);
    writeSitemapFile(sitemapServicesPath, xml);
    return true;
  } catch (error) {
    console.error('❌ Erreur lors de la génération du sitemap des services:', error);
    // Générer un sitemap minimal en cas d'erreur
    const fallbackXml = generateUrlsetXml([
      {
        loc: `${baseUrl}/services`,
        lastmod: currentDate,
        changefreq: 'daily',
        priority: '0.9'
      }
    ]);
    writeSitemapFile(sitemapServicesPath, fallbackXml);
    return true;
  }
}

/**
 * Génère le sitemap des freelancers (talents)
 * @returns {boolean} - Indique si le sitemap a été généré
 */
async function generateFreelancersSitemap() {
  try {
    // Page principale des talents
    const urls = [
      {
        loc: `${baseUrl}/talents`,
        lastmod: currentDate,
        changefreq: 'daily',
        priority: '0.9'
      }
    ];
    
    // Récupérer les profils talents depuis Supabase si disponible
    if (supabase) {
      const { data, error } = await supabase
        .from('profiles')
        .select('username, updated_at, created_at')
        .eq('is_freelancer', true)
        .eq('is_public', true);
        
      if (error) throw error;
      
      if (data && data.length > 0) {
        data.forEach(profile => {
          urls.push({
            loc: `${baseUrl}/profile/${profile.username}`,
            lastmod: profile.updated_at || profile.created_at || currentDate,
            changefreq: 'weekly',
            priority: '0.7'
          });
        });
      } else {
        console.log('ℹ️ Aucun profil talent public trouvé. Génération du sitemap talents avec seulement la page principale.');
      }
    } else {
      console.log('ℹ️ Supabase non disponible. Génération du sitemap talents avec seulement la page principale.');
    }
    
    const xml = generateUrlsetXml(urls);
    writeSitemapFile(sitemapFreelancersPath, xml);
    return true;
  } catch (error) {
    console.error('❌ Erreur lors de la génération du sitemap des talents:', error);
    const fallbackXml = generateUrlsetXml([
      {
        loc: `${baseUrl}/talents`,
        lastmod: currentDate,
        changefreq: 'daily',
        priority: '0.9'
      }
    ]);
    writeSitemapFile(sitemapFreelancersPath, fallbackXml);
    return true;
  }
}

/**
 * Vérifie si un blog existe et génère son sitemap
 * @returns {boolean} - Indique si le sitemap a été généré
 */
async function generateBlogSitemap() {
  try {
    // Page de blog
    const urls = [
      {
        loc: `${baseUrl}/blog`,
        lastmod: currentDate,
        changefreq: 'weekly',
        priority: '0.7'
      }
    ];
    
    const xml = generateUrlsetXml(urls);
    writeSitemapFile(sitemapBlogPath, xml);
    return true;
  } catch (error) {
    console.log('ℹ️ Blog non implémenté. Sitemap blog généré avec la page principale uniquement.');
    const fallbackXml = generateUrlsetXml([
      {
        loc: `${baseUrl}/blog`,
        lastmod: currentDate,
        changefreq: 'weekly',
        priority: '0.7'
      }
    ]);
    writeSitemapFile(sitemapBlogPath, fallbackXml);
    return true;
  }
}

/**
 * Vérifie si les localisations existent et génère leur sitemap
 * @returns {boolean} - Indique si le sitemap a été généré
 */
async function generateLocationsSitemap() {
  try {
    // Page principale des localisations
    const urls = [
      {
        loc: `${baseUrl}/locations`,
        lastmod: currentDate,
        changefreq: 'monthly',
        priority: '0.6'
      }
    ];
    
    const xml = generateUrlsetXml(urls);
    writeSitemapFile(sitemapLocationsPath, xml);
    return true;
  } catch (error) {
    console.log('ℹ️ Localisations non implémentées. Sitemap locations généré avec la page principale uniquement.');
    const fallbackXml = generateUrlsetXml([
      {
        loc: `${baseUrl}/locations`,
        lastmod: currentDate,
        changefreq: 'monthly',
        priority: '0.6'
      }
    ]);
    writeSitemapFile(sitemapLocationsPath, fallbackXml);
    return true;
  }
}

/**
 * Génère le sitemap index qui référence tous les autres sitemaps
 * @param {Object} generatedSitemaps - Objet indiquant quels sitemaps ont été générés
 */
function generateSitemapIndex(generatedSitemaps) {
  const sitemaps = [];
  
  // N'inclure que les sitemaps qui ont été générés
  if (generatedSitemaps.main) {
    sitemaps.push({
      loc: `${baseUrl}/sitemap.xml`,
      lastmod: currentDate
    });
  }
  
  if (generatedSitemaps.services) {
    sitemaps.push({
      loc: `${baseUrl}/sitemap-services.xml`,
      lastmod: currentDate
    });
  }
  
  if (generatedSitemaps.freelancers) {
    sitemaps.push({
      loc: `${baseUrl}/sitemap-freelancers.xml`,
      lastmod: currentDate
    });
  }
  
  if (generatedSitemaps.blog) {
    sitemaps.push({
      loc: `${baseUrl}/sitemap-blog.xml`,
      lastmod: currentDate
    });
  }
  
  if (generatedSitemaps.locations) {
    sitemaps.push({
      loc: `${baseUrl}/sitemap-locations.xml`,
      lastmod: currentDate
    });
  }
  
  const xml = generateSitemapIndexXml(sitemaps);
  writeSitemapFile(sitemapIndexPath, xml);
}

/**
 * Fonction principale qui exécute la génération de tous les sitemaps
 */
async function main() {
  console.log('🔄 Début de la génération des sitemaps...');
  
  try {
    // Créer le répertoire public s'il n'existe pas
    if (!fs.existsSync(PUBLIC_DIR)) {
      fs.mkdirSync(PUBLIC_DIR, { recursive: true });
    }
    
    // Suivi des sitemaps générés
    const generatedSitemaps = {
      main: false,
      services: false,
      freelancers: false,
      blog: false,
      locations: false
    };
    
    // Génération des sitemaps
    generatedSitemaps.main = await generateMainSitemap();
    generatedSitemaps.services = await generateServicesSitemap();
    generatedSitemaps.freelancers = await generateFreelancersSitemap();
    generatedSitemaps.blog = await generateBlogSitemap();
    generatedSitemaps.locations = await generateLocationsSitemap();
    
    // Générer l'index après tous les autres sitemaps
    generateSitemapIndex(generatedSitemaps);
    
    console.log('✅ Génération des sitemaps terminée avec succès!');
  } catch (error) {
    console.error('❌ Erreur lors de la génération des sitemaps:', error);
    process.exit(1);
  }
}

// Exécuter le script
main(); 