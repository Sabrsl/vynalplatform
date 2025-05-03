/**
 * Script de test pour envoyer un email avec un template
 * 
 * Utilisation: 
 * node src/scripts/test-template-email.js [email-de-test] [template-name]
 * 
 * Templates disponibles:
 * - welcome-client
 * - welcome-freelance
 * - password-reset
 * - order-confirmation
 */

// Vérifier si une adresse email a été passée en argument
const args = process.argv.slice(2);
const emailArg = args.find(arg => arg.includes('@'));
const templateArg = args.find(arg => !arg.includes('@'));

// Charger les variables d'environnement
const path = require('path');
const fs = require('fs');
const readline = require('readline');

// Créer une interface de lecture pour l'entrée utilisateur
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Charger les variables d'environnement manuellement du fichier .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  console.log('Chargement des variables d\'environnement depuis:', envPath);
  const envContent = fs.readFileSync(envPath, 'utf8');
  const envLines = envContent.split('\n');
  
  envLines.forEach(line => {
    const trimmedLine = line.trim();
    if (trimmedLine && !trimmedLine.startsWith('#')) {
      const [key, value] = trimmedLine.split('=');
      if (key && value) {
        process.env[key.trim()] = value.trim();
      }
    }
  });
}

try {
  require('dotenv').config();
} catch (e) {
  console.log('Module dotenv non disponible:', e.message);
}

// Importer les modules
const { createTransport } = require('nodemailer');

// Constantes et configurations
const APP_CONFIG = {
  siteName: 'Vynal Platform',
  contactEmail: 'support@vynalplatform.com'
};

const APP_URLS = {
  baseUrl: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
  productionUrl: process.env.NEXT_PUBLIC_PRODUCTION_URL || 'https://vynalplatform.com'
};

// Templates disponibles
const TEMPLATES = {
  'welcome-client': {
    path: 'src/templates/email/client/welcome.html',
    subject: 'Bienvenue sur Vynal Platform',
    variables: {
      clientName: 'Jean Dupont',
      dashboardLink: `${APP_URLS.baseUrl}/dashboard`
    }
  },
  'welcome-freelance': {
    path: 'src/templates/email/freelance/welcome.html',
    subject: 'Bienvenue sur Vynal Platform en tant que freelance',
    variables: {
      clientName: 'Jean Dupont',
      dashboardLink: `${APP_URLS.baseUrl}/dashboard/freelance`
    }
  },
  'password-reset': {
    path: 'src/templates/email/password_reset.html',
    subject: 'Réinitialisation de votre mot de passe Vynal Platform',
    variables: {
      resetLink: `${APP_URLS.baseUrl}/reset-password?token=example-token-123456`,
      expiryTime: '1 heure'
    }
  },
  'order-confirmation': {
    path: 'src/templates/email/client/order_confirmation.html',
    subject: 'Confirmation de votre commande #ORD12345',
    variables: {
      buyerName: 'Jean Dupont',
      orderNumber: 'ORD12345',
      orderDate: '15 juin 2023',
      serviceName: 'Conception de logo',
      amount: '50000',
      currency: 'FCFA',
      deliveryDate: '22 juin 2023',
      sellerName: 'Marie Martin',
      orderLink: `${APP_URLS.baseUrl}/dashboard/orders/ORD12345`
    }
  }
};

// Fonction pour lire un template HTML
function readEmailTemplate(templatePath) {
  try {
    const fullPath = path.join(process.cwd(), templatePath);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`Le fichier template n'existe pas: ${fullPath}`);
    }
    return fs.readFileSync(fullPath, 'utf8');
  } catch (error) {
    console.error(`Erreur lors de la lecture du template ${templatePath}:`, error);
    throw error;
  }
}

// Fonction pour remplacer les variables dans le template
function replaceTemplateVariables(template, variables) {
  let result = template;
  
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(regex, value);
  }
  
  // Remplacer les variables standards
  result = result.replace(/{{contactEmail}}/g, APP_CONFIG.contactEmail);
  result = result.replace(/{{currentYear}}/g, new Date().getFullYear().toString());
  result = result.replace(/{{siteName}}/g, APP_CONFIG.siteName);
  
  return result;
}

// Configuration et création du transporteur d'email
function createTransporter() {
  const host = process.env.EMAIL_SMTP_HOST || 'smtp.resend.com';
  const port = parseInt(process.env.EMAIL_SMTP_PORT || '587', 10);
  const user = process.env.EMAIL_SMTP_USER;
  const pass = process.env.EMAIL_SMTP_PASSWORD;

  if (!host || !user || !pass) {
    throw new Error(
      'Configuration SMTP incomplète. Vérifiez les variables d\'environnement EMAIL_SMTP_HOST, EMAIL_SMTP_USER et EMAIL_SMTP_PASSWORD.'
    );
  }

  const transportConfig = {
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 30000,
  };

  return createTransport(transportConfig);
}

// Fonction pour envoyer un email
async function sendEmail(options) {
  try {
    const emailTransporter = createTransporter();
    const messageId = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    
    const mailOptions = {
      from: options.from || `"${process.env.EMAIL_FROM_NAME || APP_CONFIG.siteName}" <${process.env.EMAIL_FROM_ADDRESS || APP_CONFIG.contactEmail}>`,
      to: Array.isArray(options.to) ? options.to.join(',') : options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
      replyTo: options.replyTo || process.env.EMAIL_REPLY_TO || process.env.EMAIL_FROM_ADDRESS || APP_CONFIG.contactEmail,
      attachments: options.attachments,
      cc: options.cc,
      bcc: options.bcc,
      headers: {
        'X-Message-ID': messageId,
        'X-Mailer': 'Vynal Platform Mailer',
      },
    };

    console.log(`Envoi d'email [${messageId}] à ${options.to}`);
    await emailTransporter.sendMail(mailOptions);
    console.log(`Email [${messageId}] envoyé avec succès à ${options.to}`);
    return true;
  } catch (error) {
    console.error(`Erreur lors de l'envoi de l'email à ${options.to}:`, error);
    return false;
  }
}

// Fonction pour envoyer un email avec template
async function sendTemplateEmail(to, templateName) {
  try {
    if (!TEMPLATES[templateName]) {
      console.error(`Template '${templateName}' non trouvé. Templates disponibles: ${Object.keys(TEMPLATES).join(', ')}`);
      return false;
    }

    const templateConfig = TEMPLATES[templateName];
    
    // Lire le template
    const template = readEmailTemplate(templateConfig.path);
    
    // Remplacer les variables
    const html = replaceTemplateVariables(template, templateConfig.variables);
    
    // Créer un texte simple alternatif (version sans HTML)
    // Méthode sécurisée pour convertir HTML en texte
    const text = (() => {
      // 1. Supprimer les balises HTML
      let plainText = html.replace(/<[^>]*>/g, '');
      
      // 2. Décoder les entités HTML communes (dans un ordre précis)
      plainText = plainText
        .replace(/&amp;/g, '&')  // Décoder &amp; en premier pour éviter les doubles décodages
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&nbsp;/g, ' ');
      
      // 3. Normaliser les espaces
      plainText = plainText.replace(/\s+/g, ' ').trim();
      
      return plainText;
    })();
    
    console.log(`Utilisation du template: ${templateName}`);
    console.log(`Variables utilisées:`, templateConfig.variables);
    
    // Envoyer l'email
    return await sendEmail({
      to,
      subject: templateConfig.subject,
      html,
      text
    });
  } catch (error) {
    console.error('Erreur lors de l\'envoi du template d\'email:', error);
    return false;
  }
}

// Fonction pour demander une adresse email
function askForEmail() {
  return new Promise((resolve) => {
    rl.question('Entrez une adresse email de destination: ', (answer) => {
      if (answer && answer.includes('@')) {
        resolve(answer.trim());
      } else {
        console.log('Adresse email invalide. Veuillez réessayer.');
        resolve(askForEmail());
      }
    });
  });
}

// Fonction pour demander un template
function askForTemplate() {
  return new Promise((resolve) => {
    const templates = Object.keys(TEMPLATES);
    console.log(`Templates disponibles: ${templates.join(', ')}`);
    rl.question('Sélectionnez un template: ', (answer) => {
      const template = answer.trim().toLowerCase();
      if (templates.includes(template)) {
        resolve(template);
      } else {
        console.log('Template invalide. Veuillez réessayer.');
        resolve(askForTemplate());
      }
    });
  });
}

// Fonction principale
async function testTemplateEmail() {
  console.log('=== Test d\'envoi d\'email avec template pour Vynal Platform ===');
  
  // Déterminer l'adresse email
  let emailTo = emailArg;
  if (!emailTo) {
    emailTo = await askForEmail();
  }
  
  // Déterminer le template
  let templateName = templateArg;
  if (!templateName || !TEMPLATES[templateName]) {
    templateName = await askForTemplate();
  }
  
  console.log(`\nEnvoi d'un email avec le template '${templateName}' à ${emailTo}...`);
  
  // Envoyer l'email avec template
  const result = await sendTemplateEmail(emailTo, templateName);
  
  if (result) {
    console.log(`\n✅ Email avec template '${templateName}' envoyé avec succès à ${emailTo}`);
  } else {
    console.log(`\n❌ Échec de l'envoi de l'email avec template '${templateName}' à ${emailTo}`);
  }
  
  rl.close();
}

// Lancer le test
testTemplateEmail().catch(error => {
  console.error('Erreur non gérée:', error);
  rl.close();
}); 