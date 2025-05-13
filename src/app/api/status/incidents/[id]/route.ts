import { NextResponse } from 'next/server';
import SystemStatusService from '@/lib/services/systemStatusService';
import { IncidentStatus } from '@/types/system-status';

interface Params {
  params: {
    id: string;
  }
}

/**
 * Endpoint GET pour récupérer un incident spécifique
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
    
    return NextResponse.json(incident);
  } catch (error) {
    console.error(`Erreur lors de la récupération de l'incident ${params.id}:`, error);
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de la récupération de l\'incident' },
      { status: 500 }
    );
  }
}

/**
 * Endpoint PUT pour mettre à jour un incident
 */
export async function PUT(request: Request, { params }: Params) {
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
    
    return NextResponse.json(updatedIncident);
  } catch (error) {
    console.error(`Erreur lors de la mise à jour de l'incident ${params.id}:`, error);
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de la mise à jour de l\'incident' },
      { status: 500 }
    );
  }
} 