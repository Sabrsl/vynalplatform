/**
 * Module de gestion des emails pour Vynal Platform
 * Ce module utilise Resend comme fournisseur d'email
 */

import { APP_CONFIG } from './constants';
import nodemailer from 'nodemailer';

// Types
interface EmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html: string;
  from?: string;
  replyTo?: string;
  attachments?: EmailAttachment[];
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

// Configuration du transporteur d'email
const createTransporter = () => {
  const transportConfig = {
    host: process.env.EMAIL_SMTP_HOST,
    port: parseInt(process.env.EMAIL_SMTP_PORT || '587', 10),
    secure: process.env.EMAIL_SMTP_PORT === '465',
    auth: {
      user: process.env.EMAIL_SMTP_USER,
      pass: process.env.EMAIL_SMTP_PASSWORD,
    },
  };

  return nodemailer.createTransport(transportConfig);
};

// Fonction de base pour l'envoi d'emails
export const sendEmail = async (options: EmailOptions): Promise<boolean> => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: options.from || `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM_ADDRESS}>`,
      to: Array.isArray(options.to) ? options.to.join(',') : options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
      replyTo: options.replyTo || process.env.EMAIL_FROM_ADDRESS,
      attachments: options.attachments,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Email envoyé à ${options.to}`);
    return true;
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email:', error);
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
    return false;
  }
  
  emailLastSent[email] = now;
  return true;
};

// Templates HTML
const getWelcomeEmailTemplate = (name: string, role: 'client' | 'freelance'): string => {
  const roleText = role === 'freelance' 
    ? 'en tant que freelance' 
    : 'en tant que client';

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bienvenue sur Vynal Platform</title>
    <style>
      body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { text-align: center; margin-bottom: 30px; }
      .logo { max-width: 150px; height: auto; }
      .content { background-color: #f9f9f9; padding: 20px; border-radius: 5px; }
      .button { display: inline-block; background-color: #6554AF; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; }
      .footer { margin-top: 30px; font-size: 12px; color: #777; text-align: center; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <img src="https://vynalplatform.com/assets/logo/logo_vynal_platform_simple.webp" alt="Vynal Platform Logo" class="logo">
      </div>
      
      <div class="content">
        <h2>Bienvenue sur Vynal Platform, ${name} !</h2>
        
        <p>Nous sommes ravis de vous accueillir ${roleText} sur Vynal Platform, la plateforme de mise en relation entre freelances et clients au Sénégal.</p>
        
        <p>Votre compte est maintenant actif et vous pouvez commencer à ${role === 'freelance' ? 'proposer vos services' : 'explorer les services proposés par nos freelances'}.</p>
        
        <p>N'hésitez pas à compléter votre profil pour ${role === 'freelance' ? 'attirer plus de clients potentiels' : 'faciliter vos interactions avec les freelances'}.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://vynalplatform.com/dashboard" class="button">Accéder à mon tableau de bord</a>
        </div>
        
        <p>Si vous avez des questions, n'hésitez pas à contacter notre équipe de support à l'adresse <a href="mailto:${APP_CONFIG.contactEmail}">${APP_CONFIG.contactEmail}</a>.</p>
      </div>
      
      <div class="footer">
        <p>&copy; ${new Date().getFullYear()} Vynal Platform. Tous droits réservés.</p>
        <p>
          <a href="https://vynalplatform.com/terms-of-service">Conditions d'utilisation</a> | 
          <a href="https://vynalplatform.com/privacy-policy">Politique de confidentialité</a>
        </p>
      </div>
    </div>
  </body>
  </html>
  `;
};

const getOrderConfirmationTemplate = (options: OrderConfirmationOptions): string => {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Confirmation de commande - Vynal Platform</title>
    <style>
      body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { text-align: center; margin-bottom: 30px; }
      .logo { max-width: 150px; height: auto; }
      .content { background-color: #f9f9f9; padding: 20px; border-radius: 5px; }
      .order-details { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
      .button { display: inline-block; background-color: #6554AF; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; }
      .footer { margin-top: 30px; font-size: 12px; color: #777; text-align: center; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <img src="https://vynalplatform.com/assets/logo/logo_vynal_platform_simple.webp" alt="Vynal Platform Logo" class="logo">
      </div>
      
      <div class="content">
        <h2>Votre commande est confirmée !</h2>
        
        <p>Cher(e) ${options.buyerName},</p>
        
        <p>Nous vous confirmons que votre commande a bien été enregistrée sur Vynal Platform.</p>
        
        <div class="order-details">
          <h3>Détails de la commande</h3>
          <p><strong>Numéro de commande:</strong> ${options.orderNumber}</p>
          <p><strong>Date de commande:</strong> ${options.orderDate}</p>
          <p><strong>Service:</strong> ${options.serviceName}</p>
          <p><strong>Montant:</strong> ${options.amount} ${options.currency}</p>
          <p><strong>Date de livraison estimée:</strong> ${options.deliveryDate}</p>
          <p><strong>Freelance:</strong> ${options.sellerName}</p>
        </div>
        
        <p>Vous pouvez suivre l'état de votre commande et communiquer avec ${options.sellerName} depuis votre espace client.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://vynalplatform.com/dashboard/orders" class="button">Suivre ma commande</a>
        </div>
        
        <p>Si vous avez des questions concernant votre commande, n'hésitez pas à contacter notre équipe de support à l'adresse <a href="mailto:${APP_CONFIG.contactEmail}">${APP_CONFIG.contactEmail}</a>.</p>
      </div>
      
      <div class="footer">
        <p>&copy; ${new Date().getFullYear()} Vynal Platform. Tous droits réservés.</p>
        <p>
          <a href="https://vynalplatform.com/terms-of-service">Conditions d'utilisation</a> | 
          <a href="https://vynalplatform.com/privacy-policy">Politique de confidentialité</a>
        </p>
      </div>
    </div>
  </body>
  </html>
  `;
};

const getPasswordResetTemplate = (options: PasswordResetOptions): string => {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Réinitialisation de mot de passe - Vynal Platform</title>
    <style>
      body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { text-align: center; margin-bottom: 30px; }
      .logo { max-width: 150px; height: auto; }
      .content { background-color: #f9f9f9; padding: 20px; border-radius: 5px; }
      .button { display: inline-block; background-color: #6554AF; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; }
      .security-note { margin-top: 20px; font-size: 13px; padding: 10px; background-color: #fffaed; border-left: 4px solid #ffc107; }
      .footer { margin-top: 30px; font-size: 12px; color: #777; text-align: center; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <img src="https://vynalplatform.com/assets/logo/logo_vynal_platform_simple.webp" alt="Vynal Platform Logo" class="logo">
      </div>
      
      <div class="content">
        <h2>Réinitialisation de votre mot de passe</h2>
        
        <p>Vous avez demandé la réinitialisation de votre mot de passe sur Vynal Platform.</p>
        
        <p>Cliquez sur le bouton ci-dessous pour définir un nouveau mot de passe :</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${options.resetLink}" class="button">Réinitialiser mon mot de passe</a>
        </div>
        
        <p>Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email en toute sécurité.</p>
        
        <div class="security-note">
          <p><strong>Note de sécurité :</strong> Ce lien expire dans 24 heures. Si vous avez besoin d'un nouveau lien, veuillez renouveler votre demande de réinitialisation.</p>
        </div>
      </div>
      
      <div class="footer">
        <p>&copy; ${new Date().getFullYear()} Vynal Platform. Tous droits réservés.</p>
        <p>
          <a href="https://vynalplatform.com/terms-of-service">Conditions d'utilisation</a> | 
          <a href="https://vynalplatform.com/privacy-policy">Politique de confidentialité</a>
        </p>
      </div>
    </div>
  </body>
  </html>
  `;
};

// Fonctions exportées pour les différents types d'emails
export const sendWelcomeEmail = async (options: WelcomeEmailOptions): Promise<boolean> => {
  if (!canSendEmailToUser(options.to)) {
    console.log(`Limite de taux dépassée pour l'email ${options.to}`);
    return false;
  }
  
  const emailContent = getWelcomeEmailTemplate(options.name, options.role);
  
  return sendEmail({
    to: options.to,
    subject: `Bienvenue sur Vynal Platform, ${options.name} !`,
    html: emailContent,
  });
};

export const sendOrderConfirmationEmail = async (options: OrderConfirmationOptions): Promise<boolean> => {
  if (!canSendEmailToUser(options.to)) {
    console.log(`Limite de taux dépassée pour l'email ${options.to}`);
    return false;
  }
  
  const emailContent = getOrderConfirmationTemplate(options);
  
  return sendEmail({
    to: options.to,
    subject: `Confirmation de votre commande #${options.orderNumber} - Vynal Platform`,
    html: emailContent,
  });
};

export const sendPasswordResetEmail = async (options: PasswordResetOptions): Promise<boolean> => {
  if (!canSendEmailToUser(options.to)) {
    console.log(`Limite de taux dépassée pour l'email ${options.to}`);
    return false;
  }
  
  const emailContent = getPasswordResetTemplate(options);
  
  return sendEmail({
    to: options.to,
    subject: `Réinitialisation de votre mot de passe - Vynal Platform`,
    html: emailContent,
  });
};

// Fonction utilitaire pour formater la date en français
export const formatDateFr = (date: Date): string => {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}; 