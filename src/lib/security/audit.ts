/**
 * Utilitaire pour journaliser les événements de sécurité liés aux paiements
 * 
 * Ce module permet de consigner les événements importants pour la sécurité
 * et l'audit des paiements dans la base de données Supabase.
 */
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { createClient } from '@supabase/supabase-js';

export type SecurityEventType = 
  | 'login_attempt'
  | 'login_success'
  | 'login_failure'
  | 'payment_attempt'
  | 'payment_success'
  | 'payment_failure'
  | 'payment_intent_created'
  | 'payment_intent_error'
  | 'payment_refunded'
  | 'stripe_webhook_invalid_signature'
  | 'stripe_webhook_processing_error'
  | 'paypal_order_attempt'
  | 'paypal_order_created'
  | 'paypal_order_error'
  | 'paypal_order_success'
  | 'paypal_order_failure'
  | 'sensitive_data_access'
  | 'security_violation';

export type SecuritySeverity = 'low' | 'medium' | 'high' | 'critical' | 'info';

export interface SecurityEvent {
  type: SecurityEventType;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
  details: Record<string, any>;
  severity: SecuritySeverity;
}

// Déterminer si nous sommes sur le serveur ou le client
const isServer = typeof window === 'undefined';

/**
 * Log un événement de sécurité dans la base de données
 * 
 * @param event Événement à logger (sans timestamp)
 * @returns Promesse void
 */
export async function logSecurityEvent(event: Omit<SecurityEvent, 'timestamp'>): Promise<void> {
  try {
    const securityEvent: SecurityEvent = {
      ...event,
      timestamp: new Date(),
    };

    // Afficher dans la console en mode développement (pour déboguer)
    if (process.env.NODE_ENV === 'development') {
      console.log('Événement de sécurité:', securityEvent);
    }

    // La table security_events est optionnelle, donc aucun problème si elle n'existe pas
    if (isServer) {
      // Pour le test de paiement, on n'a pas besoin de journaliser, on peut ignorer
      if (event.type === 'payment_attempt' || 
          event.type === 'payment_intent_created' ||
          event.type === 'payment_success') {
        return;
      }
      
      // Pour les erreurs importantes, afficher quand même dans la console
      if (event.severity === 'high' || event.severity === 'critical') {
        console.warn('ALERTE DE SÉCURITÉ :', event);
      }
    } else {
      // Côté client, utiliser le client avec authentification
      const supabase = createClientComponentClient();
      
      try {
        const { error } = await supabase
          .from('security_events')
          .insert(securityEvent);

        if (error) {
          // Erreur silencieuse côté client pour éviter les logs inutiles
          if (process.env.NODE_ENV === 'development') {
            console.debug('Erreur de logging côté client:', error);
          }
        }
      } catch (clientError) {
        // En développement uniquement, pour le débogage
        if (process.env.NODE_ENV === 'development') {
          console.debug('Erreur client lors du logging:', clientError);
        }
      }
    }

    // Si l'événement est critique, envoyer une alerte
    if (event.severity === 'critical') {
      await sendSecurityAlert(securityEvent);
    }
  } catch (error) {
    // Uniquement en mode développement pour éviter les logs inutiles
    if (process.env.NODE_ENV === 'development') {
      console.error('Erreur inattendue lors du logging de sécurité:', error);
    }
  }
}

/**
 * Envoie une alerte de sécurité pour les événements critiques
 * 
 * @param event Événement de sécurité
 */
async function sendSecurityAlert(event: SecurityEvent): Promise<void> {
  try {
    // Enregistrement de l'alerte dans la base de données avec marquage spécial
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('ERREUR: Variables d\'environnement Supabase manquantes pour les alertes');
      return;
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Créer un enregistrement spécial dans security_events avec un type spécifique pour les alertes
    const alertData = {
      user_id: event.userId,
      type: `alert_${event.type}`, // Préfixe "alert_" pour identifier les alertes
      ip_address: event.ipAddress,
      user_agent: event.userAgent,
      severity: event.severity,
      details: {
        ...event.details,
        original_event: event,
        alert_timestamp: new Date().toISOString(),
        alert_status: 'new' // Pour le suivi des alertes
      }
    };
    
    // Insérer l'alerte dans la base de données
    const { error } = await supabase
      .from('security_events')
      .insert(alertData);
      
    if (error) {
      console.error('Échec de l\'enregistrement de l\'alerte dans la base de données:', error);
    }
    
    // Journalisation dans la console pour suivi immédiat
    console.error('⚠️ ALERTE DE SÉCURITÉ CRITIQUE ⚠️', {
      type: event.type,
      userId: event.userId,
      severity: event.severity,
      timestamp: event.timestamp,
      details: event.details
    });
    
    // Vérifier si nous avons une configuration d'email
    if (process.env.SECURITY_ALERT_EMAIL) {
      // Cette partie nécessiterait un service d'envoi d'email configuré
      // Exemple avec un service générique:
      try {
        // Simulation de l'envoi d'un email (à implémenter avec votre service d'email)
        console.log(`[SIMULÉ] Email d'alerte envoyé à ${process.env.SECURITY_ALERT_EMAIL}`);
        // Implémentation à faire:
        // await sendEmail({
        //   to: process.env.SECURITY_ALERT_EMAIL,
        //   subject: `ALERTE SÉCURITÉ VYNAL: ${event.type}`,
        //   text: `Une alerte de sécurité critique a été détectée:\n\n${JSON.stringify(event, null, 2)}`
        // });
      } catch (emailError) {
        console.error('Échec de l\'envoi de l\'email d\'alerte:', emailError);
      }
    }
    
    // Enregistrement des événements critiques dans un fichier journal spécial
    // (Option utile si vous avez besoin de tracer ces événements hors base de données)
    if (isServer) {
      try {
        // Exemple d'utilisation du système de journalisation de Node.js
        // Cette partie peut être adaptée selon votre infrastructure
        const alertLog = {
          timestamp: new Date().toISOString(),
          environment: process.env.NODE_ENV,
          event_type: event.type,
          severity: event.severity,
          user_id: event.userId,
          ip: event.ipAddress,
          details: event.details
        };
        console.error('[SECURITY_ALERT]', JSON.stringify(alertLog));
      } catch (logError) {
        console.error('Échec de la journalisation de l\'alerte:', logError);
      }
    }
  } catch (error) {
    // S'assurer que cette fonction ne génère jamais d'erreur non gérée
    console.error('Erreur fatale lors du traitement de l\'alerte de sécurité:', error);
  }
}

/**
 * Récupère les événements de sécurité récents
 * 
 * @param limit Nombre maximum d'événements à récupérer
 * @returns Liste des événements
 */
export async function getRecentSecurityEvents(limit: number = 100): Promise<SecurityEvent[]> {
  if (!isServer) {
    // Cette fonction ne devrait pas être appelée côté client
    return [];
  }
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Variables d\'environnement Supabase manquantes');
    return [];
  }
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  try {
    const { data, error } = await supabase
      .from('security_events')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Erreur lors de la récupération des événements:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Erreur inattendue lors de la récupération des événements:', error);
    return [];
  }
}

/**
 * Vérifie si une activité suspecte a été détectée
 * 
 * @param userId ID de l'utilisateur
 * @param eventType Type d'événement
 * @returns true si l'activité est suspecte
 */
export async function isSuspiciousActivity(userId: string, eventType: SecurityEventType): Promise<boolean> {
  const supabase = createClientComponentClient();
  
  try {
    // Vérifier les tentatives de connexion échouées
    if (eventType === 'login_failure') {
      const { count } = await supabase
        .from('security_events')
        .select('*', { count: 'exact', head: true })
        .eq('userId', userId)
        .eq('type', 'login_failure')
        .gte('timestamp', new Date(Date.now() - 15 * 60 * 1000).toISOString()); // 15 dernières minutes

      return (count || 0) > 5; // Plus de 5 tentatives en 15 minutes
    }

    // Vérifier les tentatives de paiement
    if (eventType === 'payment_attempt') {
      const { count } = await supabase
        .from('security_events')
        .select('*', { count: 'exact', head: true })
        .eq('userId', userId)
        .eq('type', 'payment_attempt')
        .gte('timestamp', new Date(Date.now() - 5 * 60 * 1000).toISOString()); // 5 dernières minutes

      return (count || 0) > 3; // Plus de 3 tentatives en 5 minutes
    }

    return false;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Erreur lors de la vérification des activités suspectes:', error);
    }
    return false;
  }
}

/**
 * Fonction simplifiée pour les routes Stripe (compatibilité avec ancien code)
 * 
 * @param params Paramètres de l'événement
 * @returns Promesse void
 */
export async function logStripeEvent(params: {
  type: SecurityEventType;
  userId?: string;
  severity: SecuritySeverity;
  details: Record<string, any>;
}): Promise<void> {
  return logSecurityEvent({
    type: params.type,
    userId: params.userId,
    severity: params.severity,
    details: params.details
  });
}