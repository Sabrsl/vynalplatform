// Script pour tester la configuration d'email
// Usage: node src/scripts/test-email-config.js

// Charger les variables d'environnement
require('dotenv').config({ path: '.env.local' });

const nodemailer = require('nodemailer');

async function testEmailConfig() {
  console.log('=== Test de la configuration d\'email Vynal Platform ===');
  
  console.log('\n1. Vérification de la configuration SMTP:');
  console.log('- Host:', process.env.EMAIL_SMTP_HOST || 'Non défini');
  console.log('- Port:', process.env.EMAIL_SMTP_PORT || 'Non défini');
  console.log('- User:', process.env.EMAIL_SMTP_USER ? '✓ Défini' : '✗ Non défini');
  console.log('- Password:', process.env.EMAIL_SMTP_PASSWORD ? '✓ Défini' : '✗ Non défini');
  
  console.log('\n2. Vérification de l\'expéditeur:');
  console.log('- From Name:', process.env.EMAIL_FROM_NAME || 'Non défini');
  console.log('- From Email:', process.env.EMAIL_FROM_ADDRESS || 'Non défini');
  console.log('- Admin Email:', process.env.ADMIN_EMAIL || 'Non défini');
  
  // Créer le transporteur
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_SMTP_HOST,
    port: parseInt(process.env.EMAIL_SMTP_PORT || '587', 10),
    secure: process.env.EMAIL_SMTP_PORT === '465',
    auth: {
      user: process.env.EMAIL_SMTP_USER,
      pass: process.env.EMAIL_SMTP_PASSWORD
    }
  });
  
  console.log('\n3. Test de connexion au serveur SMTP:');
  try {
    const verification = await transporter.verify();
    console.log('✅ Connexion au serveur SMTP réussie!');
  } catch (error) {
    console.error('❌ Erreur lors de la connexion au serveur SMTP:', error);
    return;
  }
  
  // Utilisation de l'adresse email d'admin configurée
  console.log('\n4. Envoi d\'un email de test:');
  const testEmail = process.env.ADMIN_EMAIL || 'support@vynalplatform.com';
  console.log(`Envoi d'un email de test à ${testEmail}...`);
  
  try {
    const info = await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM_ADDRESS}>`,
      to: testEmail,
      subject: 'Test de configuration email - Vynal Platform',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #6554AF;">Test de configuration email réussi</h1>
          <p>Si vous recevez cet email, cela signifie que la configuration de votre service d'email fonctionne correctement.</p>
          <p>Détails de la configuration:</p>
          <ul>
            <li><strong>SMTP Host:</strong> ${process.env.EMAIL_SMTP_HOST}</li>
            <li><strong>SMTP Port:</strong> ${process.env.EMAIL_SMTP_PORT}</li>
            <li><strong>From:</strong> ${process.env.EMAIL_FROM_NAME} &lt;${process.env.EMAIL_FROM_ADDRESS}&gt;</li>
            <li><strong>Date du test:</strong> ${new Date().toLocaleString()}</li>
          </ul>
          <p>Vous pouvez maintenant utiliser cette configuration pour envoyer des emails à vos utilisateurs.</p>
        </div>
      `,
      text: `Test de configuration email réussi. Si vous recevez cet email, cela signifie que la configuration de votre service d'email fonctionne correctement.`,
    });
    
    console.log(`✅ Email de test envoyé avec succès`);
    console.log('- ID du message:', info.messageId);
  } catch (error) {
    console.error(`❌ Échec de l'envoi de l'email de test:`, error);
  }
}

testEmailConfig(); 