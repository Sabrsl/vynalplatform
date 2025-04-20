/**
 * Exemple d'utilisation du module d'email
 * 
 * Ce fichier montre comment utiliser le module d'email dans différents contextes.
 */

import { 
  sendWelcomeEmail, 
  sendOrderConfirmationEmail, 
  sendPasswordResetEmail,
  formatDateFr
} from '../email';

// Exemple d'envoi d'un email de bienvenue
export const sendWelcomeEmailExample = async (
  email: string, 
  name: string, 
  role: 'client' | 'freelance'
): Promise<void> => {
  try {
    const result = await sendWelcomeEmail({
      to: email,
      name,
      role
    });
    
    if (result) {
      console.log(`Email de bienvenue envoyé à ${email}`);
    } else {
      console.error(`Échec de l'envoi de l'email de bienvenue à ${email}`);
    }
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email de bienvenue:', error);
  }
};

// Exemple d'envoi d'un email de confirmation de commande
export const sendOrderConfirmationExample = async (
  email: string,
  orderNumber: string,
  serviceName: string,
  amount: number,
  buyerName: string,
  sellerName: string
): Promise<void> => {
  try {
    const today = new Date();
    const deliveryDate = new Date();
    deliveryDate.setDate(today.getDate() + 7); // Livraison dans 7 jours par défaut
    
    const result = await sendOrderConfirmationEmail({
      to: email,
      orderNumber,
      orderDate: formatDateFr(today),
      serviceName,
      amount,
      currency: 'FCFA',
      deliveryDate: formatDateFr(deliveryDate),
      buyerName,
      sellerName
    });
    
    if (result) {
      console.log(`Email de confirmation de commande envoyé à ${email}`);
    } else {
      console.error(`Échec de l'envoi de l'email de confirmation à ${email}`);
    }
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email de confirmation:', error);
  }
};

// Exemple d'envoi d'un email de réinitialisation de mot de passe
export const sendPasswordResetExample = async (
  email: string,
  userId: string
): Promise<void> => {
  try {
    // Générer un lien de réinitialisation
    const resetToken = Math.random().toString(36).substring(2, 15);
    const resetLink = `https://vynalplatform.com/auth/reset-password?token=${resetToken}&id=${userId}`;
    
    const result = await sendPasswordResetEmail({
      to: email,
      resetLink
    });
    
    if (result) {
      console.log(`Email de réinitialisation de mot de passe envoyé à ${email}`);
    } else {
      console.error(`Échec de l'envoi de l'email de réinitialisation à ${email}`);
    }
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email de réinitialisation:', error);
  }
};

/**
 * Comment utiliser ces fonctions dans votre application:
 * 
 * 1. Email de bienvenue lors de l'inscription
 * 
 * import { sendWelcomeEmailExample } from 'src/lib/examples/email-example';
 * 
 * // Dans votre fonction d'inscription
 * const handleSignUp = async (userData) => {
 *   // Créer l'utilisateur dans Supabase...
 *   
 *   // Envoyer l'email de bienvenue
 *   await sendWelcomeEmailExample(
 *     userData.email,
 *     userData.name,
 *     userData.role // 'client' ou 'freelance'
 *   );
 * };
 * 
 * 2. Email de confirmation lors d'une commande
 * 
 * import { sendOrderConfirmationExample } from 'src/lib/examples/email-example';
 * 
 * // Dans votre fonction de traitement de commande
 * const handleOrderSubmit = async (orderData) => {
 *   // Enregistrer la commande dans la base de données...
 *   
 *   // Envoyer la confirmation au client
 *   await sendOrderConfirmationExample(
 *     orderData.buyerEmail,
 *     orderData.id,
 *     orderData.serviceName,
 *     orderData.amount,
 *     orderData.buyerName,
 *     orderData.sellerName
 *   );
 * };
 * 
 * 3. Email de réinitialisation de mot de passe
 * 
 * import { sendPasswordResetExample } from 'src/lib/examples/email-example';
 * 
 * // Dans votre fonction de réinitialisation de mot de passe
 * const handlePasswordReset = async (email) => {
 *   // Vérifier que l'utilisateur existe...
 *   // Supposons que vous avez récupéré l'ID de l'utilisateur
 *   const userId = 'user-id-from-database';
 *   
 *   // Envoyer l'email de réinitialisation
 *   await sendPasswordResetExample(email, userId);
 * };
 */ 