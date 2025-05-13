import { NextResponse } from 'next/server';
import SystemStatusService from '@/lib/services/systemStatusService';
import { IncidentStatus } from '@/types/system-status';

interface Params {
  params: {
    id: string;
  }
}

/**
 * Endpoint GET pour récupérer les mises à jour d'un incident
 */
export async function GET(request: Request, { params }: Params) {
  try {
    const incidents = await SystemStatusService.getIncidents();
    const incident = incidents.find(i => i.id === params.id);
    
    if (!incident) {
      return NextResponse.json(
        { error: 'Incident non trouvé' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(incident.updates);
  } catch (error) {
    console.error(`Erreur lors de la récupération des mises à jour de l'incident ${params.id}:`, error);
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de la récupération des mises à jour' },
      { status: 500 }
    );
  }
}

/**
 * Endpoint POST pour ajouter une mise à jour à un incident
 */
export async function POST(request: Request, { params }: Params) {
  try {
    const data = await request.json();
    const { message, status, resolve } = data;
    
    // Validation des données
    if (!message || !status) {
      return NextResponse.json(
        { error: 'Données incomplètes' },
        { status: 400 }
      );
    }
    
    if (!['investigating', 'identified', 'monitoring', 'resolved'].includes(status)) {
      return NextResponse.json(
        { error: 'Statut invalide' },
        { status: 400 }
      );
    }
    
    const updatedIncident = await SystemStatusService.addIncidentUpdate(
      params.id,
      {
        message,
        status: status as IncidentStatus,
        resolve: !!resolve
      }
    );
    
    // Retourner uniquement la dernière mise à jour
    const latestUpdate = updatedIncident.updates[updatedIncident.updates.length - 1];
    
    return NextResponse.json(latestUpdate, { status: 201 });
  } catch (error) {
    console.error(`Erreur lors de l'ajout d'une mise à jour à l'incident ${params.id}:`, error);
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de l\'ajout de la mise à jour' },
      { status: 500 }
    );
  }
} 