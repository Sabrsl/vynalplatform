/**
 * Script de test pour vérifier la configuration d'email
 * 
 * Utilisation: 
 * npx ts-node src/scripts/test-email-config.ts
 */

// Charger dotenv directement si disponible
try {
  require('dotenv').config();
} catch (e) {
  console.log('Module dotenv non disponible. Utilisation des variables d\'environnement système.');
}

import { verifyEmailService, sendEmail } from '../lib/email';
import { APP_CONFIG } from '../lib/constants';

async function testEmailConfig() {
  console.log('=== Test de la configuration d\'email Vynal Platform ===');
  
  console.log('\n1. Vérification de la configuration SMTP:');
  console.log('- Host:', process.env.EMAIL_SMTP_HOST || 'Non défini');
  console.log('- Port:', process.env.EMAIL_SMTP_PORT || 'Non défini');
  console.log('- User:', process.env.EMAIL_SMTP_USER ? '✓ Défini' : '✗ Non défini');
  console.log('- Password:', process.env.EMAIL_SMTP_PASSWORD ? '✓ Défini' : '✗ Non défini');
  
  console.log('\n2. Vérification de l\'expéditeur:');
  console.log('- From Name:', process.env.EMAIL_FROM_NAME || APP_CONFIG.siteName);
  console.log('- From Email:', process.env.EMAIL_FROM_ADDRESS || APP_CONFIG.contactEmail);
  
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
  
  console.log('\n4. Voulez-vous envoyer un email de test? (y/n)');
  process.stdin.once('data', async (data) => {
    const input = data.toString().trim().toLowerCase();
    
    if (input === 'y' || input === 'yes' || input === 'o' || input === 'oui') {
      console.log('\nEnvoi d\'un email de test...');
      
      const testEmail = process.env.TEST_EMAIL || process.env.EMAIL_SMTP_USER;
      
      if (!testEmail) {
        console.error('❌ Aucune adresse email de test définie. Définissez TEST_EMAIL dans .env');
        process.exit(1);
      }
      
      const result = await sendEmail({
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
      
      if (result) {
        console.log(`✅ Email de test envoyé avec succès à ${testEmail}`);
      } else {
        console.log(`❌ Échec de l'envoi de l'email de test à ${testEmail}`);
      }
    }
    
    process.exit(0);
  });
}

testEmailConfig().catch(console.error); 