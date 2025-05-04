import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export type SecurityEventType = 
  | 'login_attempt'
  | 'login_success'
  | 'login_failure'
  | 'payment_attempt'
  | 'payment_success'
  | 'payment_failure'
  | 'sensitive_data_access'
  | 'security_violation';

export interface SecurityEvent {
  type: SecurityEventType;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
  details: Record<string, any>;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Log un événement de sécurité
 * @param event Événement à logger
 */
export async function logSecurityEvent(event: Omit<SecurityEvent, 'timestamp'>): Promise<void> {
  const supabase = createClientComponentClient();
  
  try {
    const securityEvent: SecurityEvent = {
      ...event,
      timestamp: new Date(),
    };

    // Enregistrer l'événement dans la base de données
    const { error } = await supabase
      .from('security_events')
      .insert(securityEvent);

    if (error) {
      console.error('Erreur lors de l\'enregistrement de l\'événement de sécurité:', error);
    }

    // Si l'événement est critique, envoyer une alerte
    if (event.severity === 'critical') {
      await sendSecurityAlert(securityEvent);
    }
  } catch (error) {
    console.error('Erreur inattendue lors du logging de sécurité:', error);
  }
}

/**
 * Envoie une alerte de sécurité
 * @param event Événement de sécurité
 */
async function sendSecurityAlert(event: SecurityEvent): Promise<void> {
  // TODO: Implémenter l'envoi d'alertes (email, SMS, etc.)
  console.warn('ALERTE DE SÉCURITÉ CRITIQUE:', event);
}

/**
 * Récupère les événements de sécurité récents
 * @param limit Nombre maximum d'événements à récupérer
 * @returns Liste des événements
 */
export async function getRecentSecurityEvents(limit: number = 100): Promise<SecurityEvent[]> {
  const supabase = createClientComponentClient();
  
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
    console.error('Erreur lors de la vérification des activités suspectes:', error);
    return false;
  }
} 