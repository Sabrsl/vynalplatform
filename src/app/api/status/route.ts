import { NextResponse } from 'next/server';
import SystemStatusService from '@/lib/services/systemStatusService';

/**
 * Endpoint GET pour récupérer le statut du système
 */
export async function GET() {
  console.log("API Status: Requête reçue");
  try {
    // Récupérer les fonctionnalités et les incidents
    console.log("API Status: Récupération des fonctionnalités...");
    const features = await SystemStatusService.getFeatures();
    console.log(`API Status: ${features.length} fonctionnalités récupérées`);

    console.log("API Status: Récupération des incidents...");
    const incidents = await SystemStatusService.getIncidents();
    console.log(`API Status: ${incidents.length} incidents récupérés`);
    
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
    
    console.log("API Status: Réponse envoyée avec succès");
    return NextResponse.json(response);
  } catch (error) {
    console.error('Erreur lors de la récupération du statut du système:', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de la récupération du statut' },
      { status: 500 }
    );
  }
} 