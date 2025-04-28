"use server";

import { getSupabaseServer } from '@/lib/supabase/server';

/**
 * Interface pour les alertes
 */
export interface Alert {
  id: string;
  title: string;
  description: string;
  type: 'error' | 'warning' | 'info';
  source: string;
  timestamp: string;
  status: 'active' | 'investigating' | 'resolved';
  priority: 'high' | 'medium' | 'low';
}

/**
 * Crée une nouvelle alerte dans le système
 */
export async function createAlert(data: Omit<Alert, 'id' | 'timestamp' | 'created_at' | 'updated_at'>) {
  const supabase = getSupabaseServer();
  
  try {
    const { data: alertData, error } = await supabase
      .from('alerts')
      .insert([{
        title: data.title,
        description: data.description,
        type: data.type,
        source: data.source,
        status: data.status || 'active',
        priority: data.priority
      }])
      .select()
      .single();
    
    if (error) {
      console.error('Erreur lors de la création de l\'alerte:', error);
      throw new Error(`Échec de la création de l'alerte: ${error.message}`);
    }
    
    return { success: true, data: alertData };
  } catch (error) {
    console.error('Erreur lors de la création de l\'alerte:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erreur inconnue' 
    };
  }
}

/**
 * Met à jour le statut d'une alerte
 */
export async function updateAlertStatus(id: string, status: 'active' | 'investigating' | 'resolved') {
  const supabase = getSupabaseServer();
  
  try {
    const { data, error } = await supabase
      .from('alerts')
      .update({ status })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Erreur lors de la mise à jour du statut de l\'alerte:', error);
      throw new Error(`Échec de la mise à jour: ${error.message}`);
    }
    
    return { success: true, data };
  } catch (error) {
    console.error('Erreur lors de la mise à jour du statut de l\'alerte:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erreur inconnue' 
    };
  }
}

/**
 * Récupère toutes les alertes du système
 */
export async function getAlerts() {
  const supabase = getSupabaseServer();
  
  try {
    const { data, error } = await supabase
      .from('alerts')
      .select('*')
      .order('timestamp', { ascending: false });
    
    if (error) {
      console.error('Erreur lors de la récupération des alertes:', error);
      throw new Error(`Échec de la récupération des alertes: ${error.message}`);
    }
    
    return { success: true, data };
  } catch (error) {
    console.error('Erreur lors de la récupération des alertes:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erreur inconnue',
      data: [] 
    };
  }
}

/**
 * Supprime une alerte
 */
export async function deleteAlert(id: string) {
  const supabase = getSupabaseServer();
  
  try {
    const { error } = await supabase
      .from('alerts')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Erreur lors de la suppression de l\'alerte:', error);
      throw new Error(`Échec de la suppression: ${error.message}`);
    }
    
    return { success: true };
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'alerte:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erreur inconnue' 
    };
  }
} 