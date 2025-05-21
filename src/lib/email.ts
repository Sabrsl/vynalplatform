/**
 * Module de gestion des emails pour Vynal Platform
 * Ce module utilise Nodemailer comme fournisseur d'email
 */

import { APP_CONFIG } from './constants';
import nodemailer, { Transporter, TransportOptions, createTransport } from 'nodemailer';
import fs from 'fs';
import path from 'path';
import Handlebars from 'handlebars';
import { FREELANCE_ROUTES, CLIENT_ROUTES } from "@/config/routes";

// Configurer des helpers Handlebars
Handlebars.registerHelper('formatDate', function(dateString) {
  if (!dateString) return 'Non disponible';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Date invalide';
    
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  } catch (error) {
    console.error('Erreur lors du formatage de la date:', error);
    return 'Erreur de date';
  }
});

// Helper pour traiter les balises HTML dans les descriptions de services
Handlebars.registerHelper('safeHtml', function(text) {
  if (!text) return '';
  
  // Supprimer les balises HTML courantes utilisées dans les descriptions
  return new Handlebars.SafeString(text);
});

// Types
interface EmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html: string;
  from?: string;
  replyTo?: string;
  attachments?: EmailAttachment[];
  cc?: string | string[];
  bcc?: string | string[];
}

interface EmailAttachment {
  filename: string;
  content: string | Buffer;
  contentType?: string;
}

interface OrderConfirmationOptions {
  to: string;
  orderNumber: string;
  orderDate: string;
  serviceName: string;
  amount: number;
  currency: string;
  deliveryDate: string;
  buyerName: string;
  sellerName: string;
}

interface WelcomeEmailOptions {
  to: string;
  name: string;
  role: 'client' | 'freelance';
}

interface PasswordResetOptions {
  to: string;
  resetLink: string;
}

// Cache pour le transporteur
let transporter: Transporter | null = null;

// Configuration et création du transporteur d'email
const createTransporter = (): Transporter => {
  // Si le transporteur est déjà créé, le retourner
  if (transporter) {
    return transporter;
  }

  const host = process.env.EMAIL_SMTP_HOST;
  const port = parseInt(process.env.EMAIL_SMTP_PORT || '587', 10);
  const user = process.env.EMAIL_SMTP_USER;
  const pass = process.env.EMAIL_SMTP_PASSWORD;

  console.log('Configuration du transporteur SMTP:');
  console.log('- Host:', host || 'NON DÉFINI');
  console.log('- Port:', port);
  console.log('- User:', user ? `${user}` : 'NON DÉFINI'); // Pour Resend, le user est 'resend'
  console.log('- Password:', pass ? 'DÉFINI (masqué)' : 'NON DÉFINI');
  console.log('- From Address:', process.env.EMAIL_FROM_ADDRESS);
  console.log('- From Name:', process.env.EMAIL_FROM_NAME);

  // Vérifier que les paramètres essentiels sont définis
  if (!host || !user || !pass) {
    const errorMessage = 'Configuration SMTP incomplète. Vérifiez les variables d\'environnement EMAIL_SMTP_HOST, EMAIL_SMTP_USER et EMAIL_SMTP_PASSWORD.';
    console.error(errorMessage);
    
    // En mode développement, utiliser un transporteur de prévisualisation
    if (process.env.NODE_ENV !== 'production') {
      console.log('Utilisation du transporteur de prévisualisation en mode développement');
      transporter = nodemailer.createTransport({
        host: 'localhost',
        port: 1025,
        secure: false,
        tls: {
          rejectUnauthorized: false
        },
        auth: {
          user: 'dev',
          pass: 'dev'
        }
      });
      return transporter;
    }
    
    throw new Error(errorMessage);
  }

  // Configuration spéciale pour Resend
  if (host === 'smtp.resend.com') {
    console.log('Configuration spécifique pour Resend');
    
    const transportConfig = {
      host,
      port,
      secure: false, // Pour Resend, toujours false
      auth: {
        user, // 'resend' pour Resend
        pass, // clé API Resend
      },
      tls: {
        rejectUnauthorized: false // Solution possible pour les problèmes SSL avec Resend
      }
    };
    
    try {
      // Créer et stocker le transporteur
      transporter = createTransport(transportConfig);
      console.log('Transporteur Resend créé avec succès');
      return transporter;
    } catch (error) {
      console.error('Erreur lors de la création du transporteur Resend:', error);
      throw error;
    }
  }

  // Configuration standard pour les autres fournisseurs SMTP
  const transportConfig = {
    host,
    port,
    secure: port === 465, // true pour 465, false pour les autres ports
    auth: {
      user,
      pass,
    },
    // Options supplémentaires pour améliorer la livraison et la sécurité
    connectionTimeout: 10000, // 10 secondes de timeout
    greetingTimeout: 10000,
    socketTimeout: 30000,
  };

  // Ajouter une option de pool pour gérer plusieurs connexions simultanées
  if (process.env.NODE_ENV === 'production') {
    console.log('Mode production: configuration du pool de connexions');
    (transportConfig as any).pool = {
      maxConnections: 5,
      maxMessages: 100,
      rateDelta: 1000,
      rateLimit: 10,
    };
  }

  try {
    // Créer et stocker le transporteur
    transporter = createTransport(transportConfig);
    console.log('Transporteur SMTP créé avec succès');
    return transporter;
  } catch (error) {
    console.error('Erreur lors de la création du transporteur SMTP:', error);
    throw error;
  }
};

// Logger spécifique aux emails pour faciliter le débogage
const emailLogger = {
  info: (message: string) => {
    if (process.env.NODE_ENV !== 'production' || process.env.EMAIL_DEBUG === 'true') {
      console.log(`[EMAIL INFO] ${message}`);
    }
  },
  error: (message: string, error?: any) => {
    console.error(`[EMAIL ERROR] ${message}`, error || '');
  }
};

// Lecture d'un template email
const readEmailTemplate = (templatePath: string): string => {
  try {
    console.log('Tentative de lecture du template:', templatePath);
    
    // Essayer le chemin relatif d'abord
    try {
      const templateContent = fs.readFileSync(templatePath, 'utf8');
      console.log('Template lu avec succès (chemin relatif)');
      return templateContent;
    } catch (error: any) {
      console.log('Erreur avec le chemin relatif:', error.message);
      
      // Si échec, essayer le chemin absolu basé sur process.cwd()
      const absolutePath = path.join(process.cwd(), templatePath);
      console.log('Tentative avec le chemin absolu:', absolutePath);
      
      try {
        const templateContent = fs.readFileSync(absolutePath, 'utf8');
        console.log('Template lu avec succès (chemin absolu)');
        return templateContent;
      } catch (error: any) {
        console.log('Erreur avec le chemin absolu:', error.message);
        throw new Error(`Impossible de lire le template d'email: ${templatePath}`);
      }
    }
  } catch (error) {
    console.error('Erreur lors de la lecture du template:', error);
    // En cas d'erreur, retourner un template par défaut simple
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Message de ${APP_CONFIG.siteName}</title>
      </head>
      <body>
        <h1>Message de ${APP_CONFIG.siteName}</h1>
        <p>Une erreur est survenue lors du chargement du template.</p>
        <p>Veuillez contacter l'administrateur.</p>
      </body>
      </html>
    `;
  }
};

/**
 * Fonction pour compiler et rendre un template Handlebars
 * @param template - Le template HTML
 * @param variables - Les variables à remplacer dans le template
 */
const renderHandlebarsTemplate = (template: string, variables: Record<string, string | undefined>): string => {
  try {
    // Pré-traitement des variables avant de les passer à Handlebars
    const processedVariables = { ...variables };
    
    // S'assurer que les dates ont des valeurs par défaut
    if (!processedVariables.rejectionDate) {
      processedVariables.rejectionDate = new Date().toISOString();
    }
    
    if (!processedVariables.approvalDate) {
      processedVariables.approvalDate = new Date().toISOString();
    }
    
    if (!processedVariables.creationDate) {
      processedVariables.creationDate = new Date().toISOString();
    }
    
    if (!processedVariables.unpublishedDate) {
      processedVariables.unpublishedDate = new Date().toISOString();
    }
    
    // Ajouter les variables standards au contexte
    const context = {
      ...processedVariables,
      contactEmail: APP_CONFIG.contactEmail,
      currentYear: new Date().getFullYear().toString(),
      siteName: APP_CONFIG.siteName
    };
    
    // Compiler et rendre le template Handlebars
    const compiledTemplate = Handlebars.compile(template);
    return compiledTemplate(context);
  } catch (error) {
    console.error('Erreur lors du rendu du template Handlebars:', error);
    
    // Fallback: utiliser l'ancienne méthode de remplacement simple
    let result = template;
    
    for (const [key, value] of Object.entries(variables)) {
      if (value !== undefined) {
        const regex = new RegExp(`{{${key}}}`, 'g');
        result = result.replace(regex, value);
      }
    }
    
    // Remplacer les variables standards
    result = result.replace(/{{contactEmail}}/g, APP_CONFIG.contactEmail);
    result = result.replace(/{{currentYear}}/g, new Date().getFullYear().toString());
    result = result.replace(/{{siteName}}/g, APP_CONFIG.siteName);
    
    return result;
  }
};

// Fonction de base pour l'envoi d'emails
export const sendEmail = async (options: EmailOptions): Promise<boolean> => {
  try {
    console.log('Début de sendEmail avec options:', JSON.stringify({
      to: options.to,
      subject: options.subject,
      from: options.from || process.env.EMAIL_FROM_ADDRESS || APP_CONFIG.contactEmail,
      hasText: !!options.text,
      hasHtml: !!options.html
    }));
    
    const emailTransporter = createTransporter();

    // Ajout d'un ID unique pour le traçage
    const messageId = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    
    // Définir l'expéditeur en fonction des paramètres d'environnement
    const fromName = process.env.EMAIL_FROM_NAME || APP_CONFIG.siteName;
    const fromAddress = process.env.EMAIL_FROM_ADDRESS || APP_CONFIG.contactEmail;
    
    // Construire l'adresse From au format "Nom <email>"
    let from = options.from || `"${fromName}" <${fromAddress}>`;
    if (!from.includes('<') && !from.includes('>')) {
      // Si l'adresse ne contient pas le format avec des crochets, on construit le bon format
      if (from.includes('@')) {
        // C'est juste une adresse email sans nom
        from = `"${fromName}" <${from}>`;
      } else {
        // C'est juste un nom sans adresse email
        from = `"${from}" <${fromAddress}>`;
      }
    }
    
    console.log('From address formatée:', from);
    
    const mailOptions = {
      from: from,
      to: Array.isArray(options.to) ? options.to.join(',') : options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
      replyTo: options.replyTo || process.env.EMAIL_REPLY_TO || fromAddress,
      attachments: options.attachments,
      cc: options.cc,
      bcc: options.bcc,
      headers: {
        'X-Message-ID': messageId,
        'X-Mailer': 'Vynal Platform Mailer',
      },
    };

    console.log(`Envoi d'email [${messageId}] à ${options.to}`);
    
    // Log the mailOptions with redacted HTML/text content for brevity
    const loggableOptions = {
      ...mailOptions,
      html: mailOptions.html ? `[${mailOptions.html.length} caractères]` : undefined,
      text: mailOptions.text ? `[${mailOptions.text.length} caractères]` : undefined,
    };
    console.log('Options d\'envoi:', JSON.stringify(loggableOptions, null, 2));
    
    const info = await emailTransporter.sendMail(mailOptions);
    console.log(`Email [${messageId}] envoyé avec succès à ${options.to}`);
    console.log('Réponse du serveur SMTP:', info.response);
    console.log('Message ID:', info.messageId);
    console.log('Accepted:', info.accepted);
    console.log('Rejected:', info.rejected);
    
    return true;
  } catch (error) {
    console.error(`Erreur lors de l'envoi de l'email à ${options.to}:`, error);
    // Enregistrer l'erreur pour analyse ultérieure dans un système de monitoring
    if (process.env.NODE_ENV === 'production') {
      // TODO: Ajouter l'intégration avec un service de monitoring d'erreurs
    }
    return false;
  }
};

// Vérification de la disponibilité du service d'email
export const verifyEmailService = async (): Promise<boolean> => {
  try {
    const emailTransporter = createTransporter();
    await emailTransporter.verify();
    emailLogger.info('Service d\'email vérifié avec succès');
    return true;
  } catch (error) {
    emailLogger.error('Échec de la vérification du service d\'email:', error);
    return false;
  }
};

// Gestion des limites de taux d'envoi
const emailLastSent: Record<string, number> = {};

export const canSendEmailToUser = (email: string): boolean => {
  const now = Date.now();
  const lastSent = emailLastSent[email] || 0;
  const rateLimitSeconds = parseInt(process.env.EMAIL_RATE_LIMIT_SECONDS || '60', 10);
  
  if (now - lastSent < rateLimitSeconds * 1000) {
    emailLogger.info(`Limitation de taux pour l'email à ${email}. Dernier envoi il y a ${Math.floor((now - lastSent) / 1000)}s`);
    return false;
  }
  
  emailLastSent[email] = now;
  return true;
};

/**
 * Envoie un email à partir d'un template HTML
 * @param to - Destinataire(s)
 * @param subject - Sujet de l'email
 * @param templatePath - Chemin vers le template HTML
 * @param variables - Variables à remplacer dans le template
 * @param options - Options d'envoi supplémentaires
 */
export const sendTemplateEmail = async (
  to: string | string[],
  subject: string, 
  templatePath: string, 
  variables: Record<string, string | undefined>,
  options: Partial<EmailOptions> = {}
): Promise<boolean> => {
  try {
    // Lire le template
    const template = readEmailTemplate(templatePath);
    
    // Compiler et rendre le template avec Handlebars
    const html = renderHandlebarsTemplate(template, variables);
    
    // Créer un texte simple alternatif (version sans HTML)
    // Méthode sécurisée pour convertir HTML en texte
    const text = (() => {
      // Décoder les entités HTML communes (dans un ordre précis et sécurisé)
      const decodeHtmlEntities = (html: string): string => {
        const entitiesMap: Record<string, string> = {
          '&amp;': '&', 
          '&lt;': '<', 
          '&gt;': '>', 
          '&quot;': '"', 
          '&#39;': "'",
          '&#x27;': "'",
          '&#x2F;': '/',
          '&nbsp;': ' '
        };
        
        // Remplacer toutes les entités HTML connues
        return html.replace(/&amp;|&lt;|&gt;|&quot;|&#39;|&#x27;|&#x2F;|&nbsp;/g, 
          (entity) => entitiesMap[entity] || entity
        );
      };
      
      // 1. Supprimer les balises HTML
      let plainText = html.replace(/<[^>]*>/g, '');
      
      // 2. Décoder les entités HTML de façon sécurisée
      plainText = decodeHtmlEntities(plainText);
      
      // 3. Normaliser les espaces
      plainText = plainText.replace(/\s+/g, ' ').trim();
      
      return plainText;
    })();
    
    // Envoyer l'email
    return await sendEmail({
      to,
      subject,
      html,
      text,
      ...options
    });
  } catch (error) {
    emailLogger.error('Erreur lors de l\'envoi du template d\'email:', error);
    return false;
  }
};

// Templates pour les emails courants
export const sendWelcomeEmail = async (options: WelcomeEmailOptions): Promise<boolean> => {
  try {
    console.log('Début de sendWelcomeEmail avec options:', JSON.stringify({
      to: options.to,
      name: options.name,
      role: options.role
    }));

    const templatePath = options.role === 'client' 
      ? 'src/templates/email/client/welcome.html'
      : 'src/templates/email/freelance/welcome.html';
    
    console.log('Template path sélectionné:', templatePath);
    
    // Définir le lien du tableau de bord en fonction du rôle
    let dashboardLink = '';
    
    if (options.role === 'client') {
      dashboardLink = `${APP_URLS.baseUrl}/client-dashboard`;
    } else if (options.role === 'freelance') {
      dashboardLink = `${APP_URLS.baseUrl}/dashboard`;
    } else {
      // Fallback au cas où
      dashboardLink = `${APP_URLS.baseUrl}/dashboard`;
    }
    
    const variables = {
      clientName: options.name,
      dashboardLink: dashboardLink,
      userRole: options.role
    };
    
    console.log('Variables du template:', JSON.stringify(variables));
    console.log('APP_URLS.baseUrl:', APP_URLS.baseUrl);
    console.log('Dashboard Link:', dashboardLink);
    
    const result = await sendTemplateEmail(
      options.to,
      `Bienvenue sur ${APP_CONFIG.siteName} !`,
      templatePath,
      variables
    );
    
    console.log('Résultat de sendTemplateEmail:', result);
    return result;
  } catch (error) {
    console.error('Erreur dans sendWelcomeEmail:', error);
    return false;
  }
};

export const sendOrderConfirmationEmail = async (options: OrderConfirmationOptions): Promise<boolean> => {
  const templatePath = 'src/templates/email/client/order_confirmation.html';
  
  const variables = {
    buyerName: options.buyerName,
    orderNumber: options.orderNumber,
    orderDate: options.orderDate,
    serviceName: options.serviceName,
    amount: options.amount.toString(),
    currency: options.currency,
    deliveryDate: options.deliveryDate,
    sellerName: options.sellerName,
    orderLink: `${APP_URLS.baseUrl}${FREELANCE_ROUTES.ORDERS}/${options.orderNumber}`,
  };
  
  return await sendTemplateEmail(
    options.to,
    `Confirmation de votre commande #${options.orderNumber}`,
    templatePath,
    variables
  );
};

export const sendPasswordResetEmail = async (options: PasswordResetOptions): Promise<boolean> => {
  const templatePath = 'src/templates/email/password_reset.html';
  
  const variables = {
    resetLink: options.resetLink,
    expiryTime: '1 heure',
  };
  
  return await sendTemplateEmail(
    options.to,
    `Réinitialisation de votre mot de passe ${APP_CONFIG.siteName}`,
    templatePath,
    variables
  );
};

// Utilitaires de formatage pour les emails
export const formatDateFr = (date: Date): string => {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: 'numeric',
    minute: 'numeric'
  }).format(date);
};

// Exporter les URLs de l'application
import { APP_URLS } from './constants';

// Fonction simplifiée pour un email de bienvenue sans dépendance aux templates
export const sendBasicWelcomeEmail = async (options: {
  to: string;
  name: string;
  role: 'client' | 'freelance';
}): Promise<boolean> => {
  try {
    console.log('Envoi d\'un email de bienvenue basique à:', options.to);
    
    // Définir le lien du tableau de bord en fonction du rôle
    let dashboardLink = '';
    let dashboardText = '';
    
    if (options.role === 'client') {
      dashboardLink = `${APP_URLS.baseUrl}/client-dashboard`;
      dashboardText = 'Espace Client';
    } else if (options.role === 'freelance') {
      dashboardLink = `${APP_URLS.baseUrl}/dashboard`;
      dashboardText = 'Espace Freelance';
    } else {
      // Fallback au cas où
      dashboardLink = `${APP_URLS.baseUrl}/dashboard`;
      dashboardText = 'Tableau de bord';
    }
    
    // Créer un HTML simple directement dans le code
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Bienvenue sur ${APP_CONFIG.siteName}</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 5px;">
          <h1 style="color: #6554AF;">Bienvenue sur ${APP_CONFIG.siteName} !</h1>
          
          <p>Bonjour ${options.name},</p>
          
          <p>Nous sommes ravis de vous accueillir sur ${APP_CONFIG.siteName}${options.role === 'freelance' ? ' en tant que freelance' : ' en tant que client'}.</p>
          
          <p>Accédez à votre ${dashboardText} : <a href="${dashboardLink}" style="color: #6554AF; text-decoration: none; font-weight: bold; padding: 10px 15px; background-color: #f4f4f9; border-radius: 4px; display: inline-block; margin: 10px 0;">${dashboardText}</a></p>
          
          <p>N'hésitez pas à nous contacter à <a href="mailto:${APP_CONFIG.contactEmail}">${APP_CONFIG.contactEmail}</a> si vous avez des questions.</p>
          
          <p>Cordialement,<br>L'équipe ${APP_CONFIG.siteName}</p>
          
          <p style="font-size: 12px; color: #666; margin-top: 30px; border-top: 1px solid #eaeaea; padding-top: 10px;">
            © ${new Date().getFullYear()} ${APP_CONFIG.siteName}. Tous droits réservés.
          </p>
        </div>
      </body>
      </html>
    `;
    
    // Construire un texte simple alternatif
    const text = `
      Bienvenue sur ${APP_CONFIG.siteName} !
      
      Bonjour ${options.name},
      
      Nous sommes ravis de vous accueillir sur ${APP_CONFIG.siteName}${options.role === 'freelance' ? ' en tant que freelance' : ' en tant que client'}.
      
      Accédez à votre ${dashboardText} : ${dashboardLink}
      
      N'hésitez pas à nous contacter à ${APP_CONFIG.contactEmail} si vous avez des questions.
      
      Cordialement,
      L'équipe ${APP_CONFIG.siteName}
      
      © ${new Date().getFullYear()} ${APP_CONFIG.siteName}. Tous droits réservés.
    `;
    
    // Envoyer l'email
    return await sendEmail({
      to: options.to,
      subject: `Bienvenue sur ${APP_CONFIG.siteName} !`,
      html,
      text
    });
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email de bienvenue basique:', error);
    return false;
  }
};