import { createClient } from '@/lib/supabase/client';

// Types d'alertes
export type AlertType = 'error' | 'warning' | 'info';
export type AlertPriority = 'high' | 'medium' | 'low';
export type AlertStatus = 'active' | 'investigating' | 'resolved';

export interface AlertCreateParams {
  title: string;
  description: string;
  type: AlertType;
  source: string;
  priority: AlertPriority;
  relatedEntityId?: string;
  relatedEntityType?: string;
}

export interface Alert {
  id: string;
  created_at: string;
  updated_at: string;
  title: string;
  description: string;
  type: AlertType;
  source: string;
  timestamp: string;
  status: AlertStatus;
  priority: AlertPriority;
  related_entity_id?: string;
  related_entity_type?: string;
  metadata?: Record<string, any>;
}

/**
 * Service pour gérer les alertes système
 */
export class AlertService {
  /**
   * Crée une nouvelle alerte système (nécessite des droits admin)
   */
  static async createAlert(params: AlertCreateParams): Promise<string | null> {
    try {
      const supabase = createClient();
      
      const { data, error } = await supabase.rpc('create_manual_alert', {
        p_title: params.title,
        p_description: params.description,
        p_type: params.type,
        p_source: params.source,
        p_priority: params.priority,
        p_related_entity_id: params.relatedEntityId,
        p_related_entity_type: params.relatedEntityType,
      });
      
      if (error) {
        console.error("Erreur lors de la création de l'alerte");
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('Exception lors de la création de l\'alerte:', error);
      return null;
    }
  }
  
  /**
   * Récupère toutes les alertes (avec filtres optionnels)
   */
  static async getAlerts({
    status,
    type,
    limit = 100,
  }: {
    status?: AlertStatus;
    type?: AlertType;
    limit?: number;
  } = {}): Promise<Alert[]> {
    try {
      const supabase = createClient();
      
      let query = supabase
        .from('alerts')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(limit);
        
      if (status) {
        query = query.eq('status', status);
      }
      
      if (type) {
        query = query.eq('type', type);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error("Erreur lors de la récupération des alertes");
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('Exception lors de la récupération des alertes:', error);
      return [];
    }
  }
  
  /**
   * Récupère le nombre d'alertes actives
   */
  static async getActiveAlertsCount(): Promise<number> {
    try {
      const supabase = createClient();
      
      const { count, error } = await supabase
        .from('alerts')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');
      
      if (error) {
        console.error("Erreur lors du comptage des alertes");
        return 0;
      }
      
      return count || 0;
    } catch (error) {
      console.error('Exception lors du comptage des alertes:', error);
      return 0;
    }
  }
  
  /**
   * Met à jour le statut d'une alerte
   */
  static async updateAlertStatus(alertId: string, status: AlertStatus): Promise<boolean> {
    try {
      const supabase = createClient();
      
      const { error } = await supabase
        .from('alerts')
        .update({ status })
        .eq('id', alertId);
      
      if (error) {
        console.error("Erreur lors de la mise à jour du statut de l'alerte");
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Exception lors de la mise à jour du statut de l\'alerte:', error);
      return false;
    }
  }
  
  /**
   * Supprime une alerte (attention: irréversible)
   */
  static async deleteAlert(alertId: string): Promise<boolean> {
    try {
      const supabase = createClient();
      
      const { error } = await supabase
        .from('alerts')
        .delete()
        .eq('id', alertId);
      
      if (error) {
        console.error("Erreur lors de la suppression de l'alerte");
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Exception lors de la suppression de l\'alerte:', error);
      return false;
    }
  }
}

export default AlertService; 