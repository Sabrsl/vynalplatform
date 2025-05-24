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
  'message': {
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
export async function getNotificationContext(notification: Notification): Promise<Record<string, string | undefined>> {
  const context: Record<string, string | undefined> = {
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
      context.userName = userData.full_name || 'Utilisateur';
      context.userEmail = userData.email || '';
      context.role = userData.role;
      
      // Définir clientName ou freelanceName selon le rôle
      if (userData.role === 'client') {
        context.clientName = userData.full_name || 'Client';
      } else if (userData.role === 'freelance') {
        context.freelanceName = userData.full_name || 'Freelance';
      }
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
      // Limiter la longueur de l'aperçu du message à 100 caractères maximum
      context.messagePreview = messageData.content.substring(0, 100) + (messageData.content.length > 100 ? '...' : '');
      context.messageLink = `https://vynalplatform.com/messages?conversation=${notification.conversation_id}`;
      
      // Récupérer les infos sur l'expéditeur du message
      const { data: senderData } = await supabase
        .from('profiles')
        .select('full_name, role')
        .eq('id', messageData.sender_id)
        .single();
        
      if (senderData) {
        context.senderName = senderData.full_name || 'Utilisateur';
        
        // Pour un message envoyé par un freelance à un client
        if (senderData.role === 'freelance' && context.role === 'client') {
          context.freelanceName = senderData.full_name || 'Freelance';
        }
        
        // Pour un message envoyé par un client à un freelance
        if (senderData.role === 'client' && context.role === 'freelance') {
          context.clientName = senderData.full_name || 'Client';
        }
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
      console.error('[NotificationWorker] Erreur lors de la récupération des notifications');
      return;
    }

    if (!notifications || notifications.length === 0) {
      console.log('[NotificationWorker] Aucune nouvelle notification à traiter');
      return;
    }

    console.log('[NotificationWorker] Traitement des notifications');

    // Traiter chaque notification
    for (const notification of notifications) {
      await processNotification(notification);
    }
  } catch (error) {
    console.error('[NotificationWorker] Erreur lors du traitement des notifications');
  }
}

/**
 * Traiter une notification spécifique et envoyer l'email correspondant
 * @param notification La notification à traiter
 */
export async function processNotification(notification: Notification) {
  try {
    console.log(`[NotificationWorker] Traitement de la notification ID:${notification.id.substring(0, 8)} Type:${notification.type}`);
    
    // Récupérer les informations de contexte
    const context = await getNotificationContext(notification);
    
    // Vérifier si le type de notification déclenche un email
    let emailConfig = EMAIL_NOTIFICATION_TYPES[notification.type as keyof typeof EMAIL_NOTIFICATION_TYPES];
    
    // Pour les notifications de message, choisir le template selon le rôle de l'utilisateur
    if ((notification.type === 'message' || notification.type === 'new_message') && context.role) {
      const isFreelance = context.role === 'freelance';
      
      // Ajuster la configuration en fonction du rôle
      emailConfig = {
        template: isFreelance 
          ? 'src/templates/email/freelance/new_message.html'
          : 'src/templates/email/client/new_message.html',
        subject: 'Nouveau message sur Vynal Platform'
      };
      
      console.log(`[NotificationWorker] Template sélectionné pour ${context.role}: ${emailConfig.template}`);
      
      // S'assurer que les variables nécessaires sont définies pour le template
      if (!context.messagePreview && notification.content) {
        try {
          const contentObj = JSON.parse(notification.content);
          if (contentObj.messagePreview) {
            context.messagePreview = contentObj.messagePreview;
          }
          if (contentObj.senderName) {
            context.senderName = contentObj.senderName;
            
            // Assigner correctement selon le rôle
            if (isFreelance) {
              context.clientName = contentObj.senderName;
            } else {
              context.freelanceName = contentObj.senderName;
            }
          }
        } catch (e) {
          // Si ce n'est pas un JSON valide, utiliser le contenu brut comme prévisualisation
          const parts = notification.content.split(':');
          if (parts.length > 1) {
            context.senderName = parts[0].trim();
            context.messagePreview = parts.slice(1).join(':').trim();
            
            // Assigner correctement selon le rôle
            if (isFreelance) {
              context.clientName = context.senderName;
            } else {
              context.freelanceName = context.senderName;
            }
          } else {
            context.messagePreview = notification.content;
          }
        }
      }
      
      // S'assurer que l'URL du message est correcte
      if (notification.conversation_id) {
        context.messageLink = `https://vynalplatform.com/messages?conversation=${notification.conversation_id}`;
      }
    }
    
    if (!emailConfig) {
      console.log(`[NotificationWorker] Aucun template d'email configuré pour le type ${notification.type}`);
      // Marquer comme traitée même si pas d'email
      await markNotificationAsEmailed(notification.id, false);
      return;
    }
    
    // Récupérer l'email de l'utilisateur
    if (!context.userEmail) {
      console.error(`[NotificationWorker] Email manquant pour l'utilisateur ID:${notification.user_id}`);
      await markNotificationAsEmailed(notification.id, false);
      return;
    }

    // Debug - Afficher le contenu de la notification
    console.log(`[NotificationWorker] Contenu brut de la notification:`, notification.content ? notification.content.substring(0, 100) + '...' : 'null');

    // Inclure le contenu de la notification dans le contexte
    if (notification.content) {
      // Stocker le contenu brut
      context.notificationContent = notification.content;
      
      // Essayer de parser le JSON si c'est un objet JSON valide
      try {
        let contentObj;
        try {
          contentObj = JSON.parse(notification.content);
        } catch (parseError) {
          console.log(`[NotificationWorker] Le contenu n'est pas un JSON valide. Utilisation comme texte brut.`);
          // Ce n'est pas un JSON, utiliser le contenu tel quel
          contentObj = { rawContent: notification.content };
        }
        
        // Debug - Afficher les propriétés disponibles
        console.log(`[NotificationWorker] Propriétés disponibles dans le contenu:`, Object.keys(contentObj));
        
        // Ajouter chaque propriété du JSON au contexte
        for (const [key, value] of Object.entries(contentObj)) {
          if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
            // Limiter la longueur des valeurs de texte à 300 caractères
            let stringValue = String(value);
            
            if (typeof value === 'string') {
              // Si la chaîne est vide, la mettre à undefined pour les conditions Handlebars
              if (stringValue.trim() === '') {
                context[key] = undefined;
                continue;
              }
              
              // Sinon limiter la longueur si nécessaire
              if (stringValue.length > 300) {
                stringValue = stringValue.substring(0, 300) + '...';
              }
            }
            
            context[key] = stringValue;
            console.log(`[NotificationWorker] Ajout de la variable ${key}=${String(value).substring(0, 20)}...`);
          }
        }
        
        // Pour les notifications de service, ajouter des mappings spécifiques
        if (notification.type === 'service_approved' || 
            notification.type === 'service_rejected' || 
            notification.type === 'service_unpublished') {
          
          // Adapter les noms de variables au template
          context.serviceTitle = contentObj.serviceTitle || '';
          
          // Limiter la longueur de la description à 150 caractères maximum
          const fullDescription = contentObj.serviceDescription || '';
          context.serviceDescription = fullDescription.length > 150 
            ? fullDescription.substring(0, 150) + '...' 
            : fullDescription;
            
          context.servicePrice = String(contentObj.servicePrice || '');
          
          // Limiter aussi la longueur des notes admin si elles sont trop longues
          const fullAdminNotes = contentObj.adminNotes || '';
          
          // Si les notes sont vides, on met à undefined pour que {{#if adminNotes}} fonctionne correctement
          // Les templates Handlebars n'affichent rien si la variable est undefined ou vide
          context.adminNotes = fullAdminNotes.trim() === '' 
            ? undefined 
            : (fullAdminNotes.length > 200
                ? fullAdminNotes.substring(0, 200) + '...'
                : fullAdminNotes);
            
          // S'assurer que toutes les variables requises par les templates sont définies
          context.currency = 'EUR';
          context.creationDate = contentObj.creationDate || new Date().toISOString();
          context.approvalDate = contentObj.approvalDate || new Date().toISOString();
          context.rejectionDate = contentObj.rejectionDate || new Date().toISOString();
          context.unpublishedDate = contentObj.unpublishedDate || new Date().toISOString();
          context.serviceCategory = contentObj.serviceCategory || 'Non spécifiée';
          context.serviceId = contentObj.serviceId || '';
          
          // S'assurer que freelanceName est défini (requis par tous les templates de service)
          if (!context.freelanceName) {
            context.freelanceName = 'Freelance';
            
            // Essayer de récupérer le nom du freelance à partir de l'ID utilisateur
            if (notification.user_id) {
              try {
                const { data: userData } = await supabase
                  .from('profiles')
                  .select('full_name')
                  .eq('id', notification.user_id)
                  .single();
                  
                if (userData && userData.full_name) {
                  context.freelanceName = userData.full_name;
                }
              } catch (error) {
                console.error('[NotificationWorker] Erreur lors de la récupération du nom du freelance:', error);
              }
            }
          }
          
          console.log(`[NotificationWorker] Variables pour le service "${context.serviceTitle}":`, {
            serviceId: context.serviceId,
            serviceTitle: context.serviceTitle,
            servicePrice: context.servicePrice,
            freelanceName: context.freelanceName,
            adminNotes: context.adminNotes ? 'présent' : 'non défini',
            creationDate: context.creationDate,
            approvalDate: context.approvalDate,
            rejectionDate: context.rejectionDate,
            unpublishedDate: context.unpublishedDate
          });
        }
      } catch (parseError) {
        console.error('[NotificationWorker] Erreur lors du traitement du contenu de la notification:', parseError);
        // Si le parsing échoue, on continue avec le contenu brut uniquement
      }
    }

    // Debug - Afficher le template utilisé
    console.log(`[NotificationWorker] Envoi d'email avec template: ${emailConfig.template} à ${context.userEmail}`);

    // Envoyer l'email
    const emailSent = await sendTemplateEmail(
      context.userEmail,
      emailConfig.subject,
      emailConfig.template,
      context
    );

    // Log du résultat
    if (emailSent) {
      console.log(`[NotificationWorker] ✅ Email envoyé avec succès à ${context.userEmail} pour la notification ID:${notification.id.substring(0, 8)}`);
    } else {
      console.error(`[NotificationWorker] ❌ Échec de l'envoi d'email à ${context.userEmail} pour la notification ID:${notification.id.substring(0, 8)}`);
    }

    // Marquer la notification comme traitée
    await markNotificationAsEmailed(notification.id, emailSent);
  } catch (error) {
    console.error('[NotificationWorker] Erreur lors du traitement d\'une notification:', error);
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
    console.error('[NotificationWorker] Erreur lors du marquage d\'une notification');
  }
} 