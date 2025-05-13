/**
 * Types pour la page de statut du système
 */

// Statut possible d'une fonctionnalité
export type FeatureStatus = 'functional' | 'degraded' | 'down';

// Type de composant du système
export type ComponentType = 
  | 'core' 
  | 'communication' 
  | 'financial' 
  | 'storage' 
  | 'integration' 
  | 'security';

// Statut d'un incident
export type IncidentStatus = 
  | 'investigating' 
  | 'identified' 
  | 'monitoring' 
  | 'resolved';

// Niveau de sévérité d'un incident
export type IncidentSeverity = 
  | 'low' 
  | 'medium' 
  | 'high' 
  | 'critical';

// Fonctionnalité du système
export interface SystemFeature {
  id: string;
  name: string;
  description: string;
  status: FeatureStatus;
  last_updated: string; // Format ISO 8601
  component_type: ComponentType | string;
}

// Mise à jour d'un incident
export interface IncidentUpdate {
  id: string;
  incident_id: string;
  message: string;
  status: IncidentStatus;
  created_at: string; // Format ISO 8601
  created_by?: string; // ID ou nom de l'utilisateur qui a créé la mise à jour
}

// Incident du système
export interface SystemIncident {
  id: string;
  feature_id: string;
  title: string;
  description: string;
  status: IncidentStatus;
  severity: IncidentSeverity;
  started_at: string; // Format ISO 8601
  resolved_at: string | null; // Format ISO 8601 ou null si non résolu
  resolved_by?: string | null; // ID ou nom de l'utilisateur qui a résolu l'incident
  updates: IncidentUpdate[]; // Liste des mises à jour de l'incident
}

// État global du système
export type SystemStatus = 'functional' | 'degraded' | 'down';

// Données d'entrée pour créer un nouvel incident
export interface CreateIncidentData {
  feature_id: string;
  title: string;
  description: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  message: string; // Premier message de mise à jour
}

// Données d'entrée pour mettre à jour un incident
export interface UpdateIncidentData {
  message: string;
  status: IncidentStatus;
  resolve?: boolean; // Si true, marque l'incident comme résolu
}