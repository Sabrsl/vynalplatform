import { NextResponse } from 'next/server';
import SystemStatusService from '@/lib/services/systemStatusService';

/**
 * Endpoint GET pour récupérer toutes les fonctionnalités du système
 */
export async function GET() {
  try {
    const features = await SystemStatusService.getFeatures();
    return NextResponse.json(features);
  } catch (error) {
    console.error('Erreur lors de la récupération des fonctionnalités:', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de la récupération des fonctionnalités' },
      { status: 500 }
    );
  }
} 