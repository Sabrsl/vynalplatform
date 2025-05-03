/**
 * Module de gestion des emails pour Vynal Platform
 * Ce module utilise Nodemailer comme fournisseur d'email
 */

import { APP_CONFIG } from './constants';
import nodemailer, { Transporter, TransportOptions, createTransport } from 'nodemailer';
import fs from 'fs';
import path from 'path';

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
    // Options supplémentaires pour améliorer la livraison et la sécurité
    connectionTimeout: 10000, // 10 secondes de timeout
    greetingTimeout: 10000,
    socketTimeout: 30000,
  };

  // Ajouter une option de pool pour gérer plusieurs connexions simultanées
  if (process.env.NODE_ENV === 'production') {
    (transportConfig as any).pool = {
      maxConnections: 5,
      maxMessages: 100,
      rateDelta: 1000,
      rateLimit: 10,
    };
  }

  // Créer et stocker le transporteur
  transporter = createTransport(transportConfig);
  return transporter;
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

// Fonction pour lire un template HTML
const readEmailTemplate = (templatePath: string): string => {
  try {
    const fullPath = path.join(process.cwd(), templatePath);
    return fs.readFileSync(fullPath, 'utf8');
  } catch (error) {
    emailLogger.error(`Erreur lors de la lecture du template ${templatePath}`, error);
    throw new Error(`Impossible de lire le template d'email: ${templatePath}`);
  }
};

// Fonction pour remplacer les variables dans le template
const replaceTemplateVariables = (template: string, variables: Record<string, string>): string => {
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
};

// Fonction de base pour l'envoi d'emails
export const sendEmail = async (options: EmailOptions): Promise<boolean> => {
  try {
    const emailTransporter = createTransporter();

    // Ajout d'un ID unique pour le traçage
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

    emailLogger.info(`Envoi d'email [${messageId}] à ${options.to}`);
    await emailTransporter.sendMail(mailOptions);
    emailLogger.info(`Email [${messageId}] envoyé avec succès à ${options.to}`);
    return true;
  } catch (error) {
    emailLogger.error(`Erreur lors de l'envoi de l'email à ${options.to}:`, error);
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

// Fonction pour envoyer un email en utilisant un template HTML
export const sendTemplateEmail = async (
  to: string | string[],
  subject: string, 
  templatePath: string, 
  variables: Record<string, string>,
  options: Partial<EmailOptions> = {}
): Promise<boolean> => {
  try {
    // Lire le template
    const template = readEmailTemplate(templatePath);
    
    // Remplacer les variables
    const html = replaceTemplateVariables(template, variables);
    
    // Créer un texte simple alternatif (version sans HTML)
    const text = html
      // Supprimer les balises HTML
      .replace(/<[^>]*>/g, '')
      // Décoder les entités HTML
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      // Supprimer les espaces multiples
      .replace(/\s+/g, ' ')
      // Supprimer les espaces au début et à la fin
      .trim();
    
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
  const templatePath = options.role === 'client' 
    ? 'src/templates/email/client/welcome.html'
    : 'src/templates/email/freelance/welcome.html';
  
  const variables = {
    clientName: options.name,
    dashboardLink: `${APP_URLS.baseUrl}/dashboard`,
  };
  
  return await sendTemplateEmail(
    options.to,
    `Bienvenue sur ${APP_CONFIG.siteName} !`,
    templatePath,
    variables
  );
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
    orderLink: `${APP_URLS.baseUrl}/dashboard/orders/${options.orderNumber}`,
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