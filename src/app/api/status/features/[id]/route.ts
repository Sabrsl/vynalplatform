import { NextResponse } from 'next/server';
import SystemStatusService from '@/lib/services/systemStatusService';
import { FeatureStatus } from '@/types/system-status';

interface Params {
  params: {
    id: string;
  }
}

/**
 * Endpoint GET pour récupérer une fonctionnalité spécifique
 */
export async function GET(request: Request, { params }: Params) {
  try {
    const feature = await SystemStatusService.getFeatureById(params.id);
    
    if (!feature) {
      return NextResponse.json(
        { error: 'Fonctionnalité non trouvée' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(feature);
  } catch (error) {
    console.error(`Erreur lors de la récupération de la fonctionnalité ${params.id}:`, error);
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de la récupération de la fonctionnalité' },
      { status: 500 }
    );
  }
}

/**
 * Endpoint PUT pour mettre à jour le statut d'une fonctionnalité
 */
export async function PUT(request: Request, { params }: Params) {
  try {
    const data = await request.json();
    const { status } = data;
    
    if (!status || !['functional', 'degraded', 'down'].includes(status)) {
      return NextResponse.json(
        { error: 'Statut invalide' },
        { status: 400 }
      );
    }
    
    const feature = await SystemStatusService.updateFeatureStatus(
      params.id, 
      status as FeatureStatus
    );
    
    return NextResponse.json(feature);
  } catch (error) {
    console.error(`Erreur lors de la mise à jour de la fonctionnalité ${params.id}:`, error);
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de la mise à jour de la fonctionnalité' },
      { status: 500 }
    );
  }
} 