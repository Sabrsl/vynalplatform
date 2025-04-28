/**
 * Worker de traitement des notifications pour Vynal Platform
 * Ce module écoute les nouvelles notifications et déclenche l'envoi d'emails
 */

import { supabase } from '../supabase/client';
import { sendTemplateEmail } from '../email';
import { APP_CONFIG } from '../constants';
import { NotificationType } from '@/types/supabase/notifications.types';
import type { Notification } from '@/types/supabase/notifications.types';
import type { Database } from '@/types/database';

// Définition des types de notification qui déclenchent des emails
export const EMAIL_NOTIFICATION_TYPES = {
  // Messages
  'new_message': {
    template: 'src/templates/email/client/new_message.html',
    subject: 'Nouveau message sur Vynal Platform',
  },
  'unread_message_reminder': {
    template: 'src/templates/email/client/unread_message_reminder.html',
    subject: 'Message non lu sur Vynal Platform',
  },
  
  // Commandes
  'order_confirmed': {
    template: 'src/templates/email/client/order_confirmation.html',
    subject: 'Confirmation de votre commande - Vynal Platform',
  },
  'order_delivered': {
    template: 'src/templates/email/client/delivery_received.html',
    subject: 'Votre commande a été livrée - Vynal Platform',
  },
  'new_order': {
    template: 'src/templates/email/freelance/new_order.html',
    subject: 'Nouvelle commande reçue - Vynal Platform',
  },
  
  // Litiges
  'dispute_message': {
    template: 'src/templates/email/client/dispute_update.html',
    subject: 'Mise à jour de votre litige - Vynal Platform',
  },
  'dispute_opened': {
    template: 'src/templates/email/freelance/dispute_opened.html',
    subject: 'Un litige a été ouvert - Vynal Platform',
  },
  'dispute_resolved': {
    template: 'src/templates/email/client/dispute_resolved.html',
    subject: 'Litige résolu - Vynal Platform',
  },
  
  // Services - Notifications pour les freelances
  'service_approved': {
    template: 'src/templates/email/freelance/service_approved.html',
    subject: 'Votre service a été approuvé - Vynal Platform',
  },
  'service_rejected': {
    template: 'src/templates/email/freelance/service_rejected.html',
    subject: 'Votre service n\'a pas été approuvé - Vynal Platform',
  },
  'service_unpublished': {
    template: 'src/templates/email/freelance/service_unpublished.html',
    subject: 'Votre service a été dépublié - Vynal Platform',
  },
};

/**
 * Récupérer les informations de contexte pour une notification
 * @param notification La notification à traiter
 */
export async function getNotificationContext(notification: Notification): Promise<Record<string, string>> {
  const context: Record<string, string> = {
    currentYear: new Date().getFullYear().toString(),
    siteName: APP_CONFIG.siteName,
    contactEmail: APP_CONFIG.contactEmail,
  };

  // Récupérer les informations sur l'utilisateur
  if (notification.user_id) {
    const { data: userData } = await supabase
      .from('profiles')
      .select('full_name, email, role')
      .eq('id', notification.user_id)
      .single();

    if (userData) {
      context.userName = userData.full_name || 'Client';
      context.userEmail = userData.email || '';
      context.role = userData.role;
    }
  }

  // Récupérer les informations sur la conversation associée
  if (notification.conversation_id) {
    const { data: messageData } = await supabase
      .from('messages')
      .select('content, sender_id, created_at')
      .eq('conversation_id', notification.conversation_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (messageData) {
      context.messagePreview = messageData.content.substring(0, 100) + (messageData.content.length > 100 ? '...' : '');
      context.messageLink = `https://vynalplatform.com/conversations/${notification.conversation_id}`;
      
      // Récupérer les infos sur l'expéditeur du message
      const { data: senderData } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', messageData.sender_id)
        .single();
        
      if (senderData) {
        context.senderName = senderData.full_name || 'Utilisateur';
      }
    }
  }

  return context;
}

/**
 * Traiter les notifications en attente et envoyer les emails correspondants
 */
export async function processNotifications() {
  console.log('[NotificationWorker] Traitement des notifications en attente...');
  
  // Récupérer les notifications non traitées (sans colonne emailed)
  // Ajouter la colonne emailed si elle n'existe pas
  try {
    // Récupérer toutes les notifications non traitées
    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('id, user_id, type, content, conversation_id, read, created_at')
      .is('emailed', null)
      .limit(50);

    if (error) {
      console.error('[NotificationWorker] Erreur lors de la récupération des notifications:', error);
      return;
    }

    if (!notifications || notifications.length === 0) {
      console.log('[NotificationWorker] Aucune nouvelle notification à traiter');
      return;
    }

    console.log(`[NotificationWorker] Traitement de ${notifications.length} notifications`);

    // Traiter chaque notification
    for (const notification of notifications) {
      await processNotification(notification);
    }
  } catch (error) {
    console.error('[NotificationWorker] Erreur lors du traitement des notifications:', error);
  }
}

/**
 * Traiter une notification spécifique et envoyer l'email correspondant
 * @param notification La notification à traiter
 */
export async function processNotification(notification: Notification) {
  try {
    // Vérifier si le type de notification déclenche un email
    const emailConfig = EMAIL_NOTIFICATION_TYPES[notification.type as keyof typeof EMAIL_NOTIFICATION_TYPES];
    if (!emailConfig) {
      // Marquer comme traitée même si pas d'email
      await markNotificationAsEmailed(notification.id, false);
      return;
    }

    // Récupérer les informations de contexte
    const context = await getNotificationContext(notification);
    
    // Récupérer l'email de l'utilisateur
    if (!context.userEmail) {
      console.error(`[NotificationWorker] Email manquant pour l'utilisateur ${notification.user_id}`);
      await markNotificationAsEmailed(notification.id, false);
      return;
    }

    // Inclure le contenu de la notification dans le contexte
    if (notification.content) {
      // Stocker le contenu brut
      context.notificationContent = notification.content;
      
      // Essayer de parser le JSON si c'est un objet JSON valide
      try {
        const contentObj = JSON.parse(notification.content);
        
        // Ajouter chaque propriété du JSON au contexte
        for (const [key, value] of Object.entries(contentObj)) {
          if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
            context[key] = String(value);
          }
        }
        
        // Pour les notifications de service, ajouter des mappings spécifiques
        if (notification.type === 'service_approved' || 
            notification.type === 'service_rejected' || 
            notification.type === 'service_unpublished') {
          
          // Adapter les noms de variables au template
          context.serviceTitle = contentObj.serviceTitle || '';
          context.serviceDescription = contentObj.serviceDescription || '';
          context.servicePrice = String(contentObj.servicePrice || '');
          context.adminNotes = contentObj.adminNotes || '';
          context.currency = 'EUR';
          context.freelanceName = context.userName || 'Freelance';
          context.creationDate = contentObj.creationDate || new Date().toISOString();
          context.approvalDate = contentObj.approvalDate || new Date().toISOString();
          context.unpublishedDate = contentObj.unpublishedDate || new Date().toISOString();
          context.serviceCategory = contentObj.serviceCategory || 'Non spécifiée';
          context.serviceId = contentObj.serviceId || '';
          
          console.log(`[NotificationWorker] Contexte pour la notification de service ${notification.id}:`, context);
        }
      } catch (parseError) {
        console.error(`[NotificationWorker] Erreur lors du parsing du contenu JSON de la notification ${notification.id}:`, parseError);
        // Si le parsing échoue, on continue avec le contenu brut uniquement
      }
    }

    // Envoyer l'email
    const emailSent = await sendTemplateEmail(
      context.userEmail,
      emailConfig.subject,
      emailConfig.template,
      context
    );

    // Marquer la notification comme traitée
    await markNotificationAsEmailed(notification.id, emailSent);
    
    console.log(`[NotificationWorker] Email ${emailSent ? 'envoyé' : 'non envoyé'} pour la notification ${notification.id}`);
  } catch (error) {
    console.error(`[NotificationWorker] Erreur lors du traitement de la notification ${notification.id}:`, error);
    await markNotificationAsEmailed(notification.id, false);
  }
}

/**
 * Marquer une notification comme traitée
 * @param notificationId ID de la notification
 * @param emailSent Indique si l'email a été envoyé avec succès
 */
async function markNotificationAsEmailed(notificationId: string, emailSent: boolean) {
  try {
    await supabase
      .from('notifications')
      .update({
        emailed: emailSent,
        emailed_at: new Date().toISOString(),
      })
      .eq('id', notificationId);
  } catch (error) {
    console.error(`[NotificationWorker] Erreur lors du marquage de la notification ${notificationId}:`, error);
  }
} 