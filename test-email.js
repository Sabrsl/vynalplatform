// Script de test pour l'envoi d'emails
// Usage: node test-email.js template@email.com
// où template est le nom du template à tester et email.com est l'adresse du destinataire

require('dotenv').config();
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

// Configuration du transport SMTP
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SMTP_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_SMTP_PORT || 587,
  secure: process.env.EMAIL_SMTP_PORT === '465',
  auth: {
    user: process.env.EMAIL_SMTP_USER,
    pass: process.env.EMAIL_SMTP_PASSWORD
  }
});

// Templates disponibles
const TEMPLATES = {
  'welcome': 'src/templates/email/welcome.html',
  'dispute_resolved': 'src/templates/email/client/dispute_resolved.html',
  'project_validated': 'src/templates/email/client/project_validated.html',
  // Ajoutez d'autres templates ici selon vos besoins
};

async function sendTestEmail() {
  const args = process.argv.slice(2);
  
  if (args.length !== 2) {
    console.log('Usage: node test-email.js template@email.com');
    console.log('Templates disponibles: ', Object.keys(TEMPLATES).join(', '));
    process.exit(1);
  }
  
  const [templateName, emailTo] = args[0].split('@');
  const emailAddress = `${emailTo}@${args[1]}`;
  
  if (!TEMPLATES[templateName]) {
    console.log(`Template "${templateName}" non trouvé. Templates disponibles: `, Object.keys(TEMPLATES).join(', '));
    process.exit(1);
  }
  
  try {
    // Lire le contenu du template
    const templatePath = path.resolve(process.cwd(), TEMPLATES[templateName]);
    let htmlContent = fs.readFileSync(templatePath, 'utf8');
    
    // Remplacer les variables de template pour le test
    htmlContent = htmlContent
      .replace(/{{.*?}}/g, (match) => {
        // Valeurs de test pour les variables de template
        const testValues = {
          '{{client_name}}': 'Client Test',
          '{{freelance_name}}': 'Freelance Test',
          '{{order_title}}': 'Projet de test',
          '{{order_url}}': 'https://vynalplatform.com',
          '{{order_amount}}': '100€',
          '{{reset_url}}': 'https://vynalplatform.com/reset',
          '{{confirmation_url}}': 'https://vynalplatform.com/confirm',
          // Ajoutez d'autres variables selon vos besoins
        };
        
        return testValues[match] || match;
      });
    
    // Options de l'email
    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || 'Vynal Platform'}" <${process.env.EMAIL_FROM_ADDRESS || 'support@vynalplatform.com'}>`,
      to: emailAddress,
      subject: `Test du template ${templateName}`,
      html: htmlContent
    };
    
    // Envoyer l'email
    console.log(`Envoi d'un email de test à ${emailAddress} avec le template "${templateName}"...`);
    const info = await transporter.sendMail(mailOptions);
    
    console.log('Email envoyé avec succès!');
    console.log('ID du message:', info.messageId);
    console.log('Aperçu URL:', nodemailer.getTestMessageUrl(info));
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email:', error);
  }
}

sendTestEmail(); 