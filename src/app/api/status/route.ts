import { NextResponse } from 'next/server';
import SystemStatusService from '@/lib/services/systemStatusService';

/**
 * Endpoint GET pour récupérer le statut du système
 */
export async function GET() {
  try {
    // Récupérer les fonctionnalités et les incidents
    const features = await SystemStatusService.getFeatures();
    const incidents = await SystemStatusService.getIncidents();
    
    // Filtrer les incidents pour n'inclure que les actifs (non résolus)
    const activeIncidents = incidents.filter(incident => incident.status !== 'resolved');
    
    // Déterminer le statut global du système
    const hasDown = features.some(f => f.status === 'down');
    const hasDegraded = features.some(f => f.status === 'degraded');
    
    let systemStatus = 'functional';
    if (hasDown) systemStatus = 'down';
    else if (hasDegraded) systemStatus = 'degraded';
    
    // Construire la réponse
    const response = {
      status: systemStatus,
      last_updated: new Date().toISOString(),
      features,
      active_incidents: activeIncidents,
      resolved_incidents: incidents.filter(incident => incident.status === 'resolved')
    };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Erreur lors de la récupération du statut du système:', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de la récupération du statut' },
      { status: 500 }
    );
  }
} 