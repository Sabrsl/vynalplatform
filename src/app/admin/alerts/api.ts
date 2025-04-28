import { supabase } from '@/lib/supabase/client';

// Définir le type Alert
export interface Alert {
  id: string;
  created_at: string;
  updated_at: string;
  title: string;
  description: string;
  type: 'error' | 'warning' | 'info';
  source: string;
  timestamp: string;
  status: 'active' | 'investigating' | 'resolved';
  priority: 'high' | 'medium' | 'low';
  related_entity_id?: string;
  related_entity_type?: string;
  metadata?: Record<string, any>;
}

// Type pour les résultats API
export interface ApiResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/**
 * Récupérer toutes les alertes depuis Supabase
 */
export async function fetchAlerts(page: number = 1, limit: number = 20): Promise<ApiResult<Alert[]>> {
  try {
    const offset = (page - 1) * limit;
    
    const { data, error, count } = await supabase
      .from('alerts')
      .select('*', { count: 'exact' })
      .order('timestamp', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Erreur lors du chargement des alertes:', error);
      return { success: false, error: error.message };
    }

    return { 
      success: true, 
      data: data as Alert[],
      pagination: {
        total: count || 0,
        page,
        limit,
        totalPages: count ? Math.ceil(count / limit) : 0
      }
    };
  } catch (error) {
    console.error('Erreur lors du chargement des alertes:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erreur inconnue' 
    };
  }
}

/**
 * Récupérer les alertes filtrées par type/statut
 */
export async function fetchFilteredAlerts(
  page: number = 1,
  limit: number = 20,
  type?: 'error' | 'warning' | 'info',
  status?: 'active' | 'investigating' | 'resolved'
): Promise<ApiResult<Alert[]>> {
  try {
    const offset = (page - 1) * limit;
    
    let query = supabase
      .from('alerts')
      .select('*', { count: 'exact' });

    if (type) {
      query = query.eq('type', type);
    }

    if (status) {
      query = query.eq('status', status);
    }

    query = query.order('timestamp', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Erreur lors du chargement des alertes filtrées:', error);
      return { success: false, error: error.message };
    }

    return { 
      success: true, 
      data: data as Alert[],
      pagination: {
        total: count || 0,
        page,
        limit,
        totalPages: count ? Math.ceil(count / limit) : 0
      }
    };
  } catch (error) {
    console.error('Erreur lors du chargement des alertes filtrées:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erreur inconnue' 
    };
  }
}

/**
 * Mettre à jour le statut d'une alerte
 */
export async function updateAlertStatus(
  id: string,
  status: 'active' | 'investigating' | 'resolved'
): Promise<ApiResult<Alert>> {
  try {
    console.log(`Mise à jour du statut de l'alerte ${id} vers ${status}`);
    
    // Pas besoin de vérifier avant la mise à jour, faire la mise à jour directement
    const { data, error } = await supabase
      .from('alerts')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .maybeSingle(); // Utiliser maybeSingle au lieu de single

    if (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
      return { success: false, error: error.message };
    }

    if (!data) {
      return { 
        success: false, 
        error: `Aucune alerte trouvée avec l'ID: ${id}` 
      };
    }

    return { success: true, data: data as Alert };
  } catch (error) {
    console.error('Erreur lors de la mise à jour du statut:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erreur inconnue' 
    };
  }
}

/**
 * Créer une nouvelle alerte manuellement
 */
export async function createAlert(alert: Omit<Alert, 'id' | 'created_at' | 'updated_at'>): Promise<ApiResult<Alert>> {
  try {
    const { data, error } = await supabase
      .from('alerts')
      .insert([alert])
      .select()
      .single();

    if (error) {
      console.error('Erreur lors de la création de l\'alerte:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data as Alert };
  } catch (error) {
    console.error('Erreur lors de la création de l\'alerte:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erreur inconnue' 
    };
  }
}

/**
 * Générer des alertes de test (utile pour le développement)
 */
export async function generateTestAlerts(count: number = 5): Promise<ApiResult<number>> {
  try {
    const { data, error } = await supabase
      .rpc('generate_test_alerts', { p_count: count });

    if (error) {
      console.error('Erreur lors de la génération des alertes de test:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data as number };
  } catch (error) {
    console.error('Erreur lors de la génération des alertes de test:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erreur inconnue' 
    };
  }
}

/**
 * Exécuter les vérifications système manuellement
 */
export async function runSystemChecks(): Promise<ApiResult<number>> {
  try {
    const { data, error } = await supabase
      .rpc('run_system_checks');

    if (error) {
      console.error('Erreur lors de l\'exécution des vérifications système:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data as number };
  } catch (error) {
    console.error('Erreur lors de l\'exécution des vérifications système:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erreur inconnue' 
    };
  }
}

/**
 * Obtenir des statistiques sur les alertes
 */
export async function getAlertStats(): Promise<ApiResult<{
  total: number;
  active: number;
  byType: {
    error: number;
    warning: number;
    info: number;
  };
  byStatus: {
    active: number;
    investigating: number;
    resolved: number;
  };
}>> {
  try {
    const { data: activeAlerts, error: activeError } = await supabase
      .from('alerts')
      .select('type')
      .eq('status', 'active');

    const { data: allAlerts, error: allError } = await supabase
      .from('alerts')
      .select('type, status');

    if (activeError || allError) {
      console.error('Erreur lors du chargement des statistiques:', activeError || allError);
      return { success: false, error: (activeError || allError)?.message };
    }

    const stats = {
      total: allAlerts?.length || 0,
      active: activeAlerts?.length || 0,
      byType: {
        error: allAlerts?.filter(a => a.type === 'error').length || 0,
        warning: allAlerts?.filter(a => a.type === 'warning').length || 0,
        info: allAlerts?.filter(a => a.type === 'info').length || 0,
      },
      byStatus: {
        active: allAlerts?.filter(a => a.status === 'active').length || 0,
        investigating: allAlerts?.filter(a => a.status === 'investigating').length || 0,
        resolved: allAlerts?.filter(a => a.status === 'resolved').length || 0,
      }
    };

    return { success: true, data: stats };
  } catch (error) {
    console.error('Erreur lors du chargement des statistiques:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erreur inconnue' 
    };
  }
}

/**
 * Marquer toutes les alertes comme résolues
 */
export async function resolveAllAlerts(): Promise<ApiResult<Alert[]>> {
  try {
    const { data, error } = await supabase
      .from('alerts')
      .update({ status: 'resolved' })
      .neq('status', 'resolved')
      .select();

    if (error) {
      console.error('Erreur lors de la résolution de toutes les alertes:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data as Alert[] };
  } catch (error) {
    console.error('Erreur lors de la résolution de toutes les alertes:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erreur inconnue' 
    };
  }
} 