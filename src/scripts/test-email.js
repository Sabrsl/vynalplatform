/**
 * Script de test pour vérifier la configuration d'email
 * 
 * Utilisation: 
 * node src/scripts/test-email.js [email-de-test]
 */

// Vérifier si une adresse email a été passée en argument
const args = process.argv.slice(2);
const emailArg = args.find(arg => arg.includes('@'));

// Charger les variables d'environnement
const path = require('path');
const fs = require('fs');
const readline = require('readline');

// Créer une interface de lecture pour l'entrée utilisateur
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Afficher le chemin actuel
console.log('Répertoire de travail:', process.cwd());

// Vérifier si .env.local existe
const envPath = path.resolve(process.cwd(), '.env.local');
console.log('Recherche du fichier .env.local à:', envPath);
console.log('Le fichier existe:', fs.existsSync(envPath) ? 'Oui' : 'Non');

// Charger les variables d'environnement manuellement
if (fs.existsSync(envPath)) {
  console.log('Chargement manuel du fichier .env.local');
  const envContent = fs.readFileSync(envPath, 'utf8');
  const envLines = envContent.split('\n');
  
  envLines.forEach(line => {
    const trimmedLine = line.trim();
    // Ignorer les commentaires et lignes vides
    if (trimmedLine && !trimmedLine.startsWith('#')) {
      const [key, value] = trimmedLine.split('=');
      if (key && value) {
        process.env[key.trim()] = value.trim();
        console.log(`Variable définie: ${key.trim()} = ***`);
      }
    }
  });
}

try {
  require('dotenv').config();
  console.log('Module dotenv chargé avec succès');
} catch (e) {
  console.log('Module dotenv non disponible:', e.message);
}

// Importer les modules
const { createTransport } = require('nodemailer');

// Récupérer les configurations
const contactEmail = 'support@vynalplatform.com'; // Remplacer par la valeur de APP_CONFIG.contactEmail
const siteName = 'Vynal Platform'; // Remplacer par la valeur de APP_CONFIG.siteName

// Fonctions
async function verifyEmailService() {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    return true;
  } catch (error) {
    console.error('Erreur de vérification:', error);
    return false;
  }
}

async function sendEmail(options) {
  try {
    const emailTransporter = createTransporter();
    
    // Ajout d'un ID unique pour le traçage
    const messageId = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    
    const mailOptions = {
      from: options.from || `"${process.env.EMAIL_FROM_NAME || siteName}" <${process.env.EMAIL_FROM_ADDRESS || contactEmail}>`,
      to: Array.isArray(options.to) ? options.to.join(',') : options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
      replyTo: options.replyTo || process.env.EMAIL_REPLY_TO || process.env.EMAIL_FROM_ADDRESS || contactEmail,
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

// Configuration et création du transporteur d'email
function createTransporter() {
  const host = process.env.EMAIL_SMTP_HOST || 'smtp.resend.com'; // Valeur par défaut
  const port = parseInt(process.env.EMAIL_SMTP_PORT || '587', 10);
  const user = process.env.EMAIL_SMTP_USER;
  const pass = process.env.EMAIL_SMTP_PASSWORD;

  // Afficher les valeurs (masquées pour le mot de passe)
  console.log('Configuration du transporteur:');
  console.log('- Host:', host);
  console.log('- Port:', port);
  console.log('- User:', user);
  console.log('- Pass:', pass ? '******' : 'Non défini');

  // Vérifier que les paramètres essentiels sont définis
  if (!host || !user || !pass) {
    throw new Error(
      'Configuration SMTP incomplète. Vérifiez les variables d\'environnement EMAIL_SMTP_HOST, EMAIL_SMTP_USER et EMAIL_SMTP_PASSWORD.'
    );
  }

  const transportConfig = {
    host,
    port,
    secure: port === 465, // true pour 465, false pour les autres ports
    auth: {
      user,
      pass,
    },
    // Options supplémentaires
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 30000,
  };

  return createTransport(transportConfig);
}

// Demander une adresse email à l'utilisateur
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

// Fonction principale
async function testEmailConfig() {
  console.log('=== Test de la configuration d\'email Vynal Platform ===');
  
  console.log('\n1. Vérification de la configuration SMTP:');
  console.log('- Host:', process.env.EMAIL_SMTP_HOST || 'smtp.resend.com');
  console.log('- Port:', process.env.EMAIL_SMTP_PORT || '587');
  console.log('- User:', process.env.EMAIL_SMTP_USER ? '✓ Défini' : '✗ Non défini');
  console.log('- Password:', process.env.EMAIL_SMTP_PASSWORD ? '✓ Défini' : '✗ Non défini');
  
  console.log('\n2. Vérification de l\'expéditeur:');
  console.log('- From Name:', process.env.EMAIL_FROM_NAME || siteName);
  console.log('- From Email:', process.env.EMAIL_FROM_ADDRESS || contactEmail);
  
  console.log('\n3. Test de connexion au serveur SMTP:');
  try {
    const isConnected = await verifyEmailService();
    if (isConnected) {
      console.log('✅ Connexion au serveur SMTP réussie!');
    } else {
      console.log('❌ Échec de la connexion au serveur SMTP');
    }
  } catch (error) {
    console.error('❌ Erreur lors de la connexion au serveur SMTP:', error);
  }
  
  // Si une adresse email a été fournie en argument, l'utiliser directement
  if (emailArg) {
    await sendTestEmail(emailArg);
    return;
  }
  
  console.log('\n4. Voulez-vous envoyer un email de test? (y/n)');
  rl.question('Votre choix: ', async (answer) => {
    const input = answer.trim().toLowerCase();
    
    if (input === 'y' || input === 'yes' || input === 'o' || input === 'oui') {
      // Déterminer l'adresse email de test
      let testEmail = process.env.TEST_EMAIL;
      
      if (!testEmail) {
        testEmail = await askForEmail();
      }
      
      await sendTestEmail(testEmail);
    } else {
      console.log('Test d\'envoi d\'email annulé.');
      rl.close();
    }
  });
}

// Fonction pour envoyer l'email de test
async function sendTestEmail(testEmail) {
  console.log(`Envoi d'un email de test à ${testEmail}...`);
  
  const result = await sendEmail({
    to: testEmail,
    subject: 'Test de configuration email - Vynal Platform',
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #6554AF;">Test de configuration email réussi</h1>
        <p>Si vous recevez cet email, cela signifie que la configuration de votre service d'email fonctionne correctement.</p>
        <p>Détails de la configuration:</p>
        <ul>
          <li><strong>SMTP Host:</strong> ${process.env.EMAIL_SMTP_HOST || 'smtp.resend.com'}</li>
          <li><strong>SMTP Port:</strong> ${process.env.EMAIL_SMTP_PORT || '587'}</li>
          <li><strong>From:</strong> ${process.env.EMAIL_FROM_NAME || siteName} &lt;${process.env.EMAIL_FROM_ADDRESS || contactEmail}&gt;</li>
          <li><strong>Date du test:</strong> ${new Date().toLocaleString()}</li>
        </ul>
        <p>Vous pouvez maintenant utiliser cette configuration pour envoyer des emails à vos utilisateurs.</p>
      </div>
    `,
    text: `Test de configuration email réussi. Si vous recevez cet email, cela signifie que la configuration de votre service d'email fonctionne correctement.`,
  });
  
  if (result) {
    console.log(`✅ Email de test envoyé avec succès à ${testEmail}`);
  } else {
    console.log(`❌ Échec de l'envoi de l'email de test à ${testEmail}`);
  }
  
  rl.close();
}

// Lancer le test
testEmailConfig().catch(error => {
  console.error('Erreur non gérée:', error);
  rl.close();
}); 