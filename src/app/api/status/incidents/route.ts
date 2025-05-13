import { NextResponse } from 'next/server';
import SystemStatusService from '@/lib/services/systemStatusService';
import { IncidentSeverity, IncidentStatus } from '@/types/system-status';

/**
 * Endpoint GET pour récupérer tous les incidents
 */
export async function GET() {
  try {
    const incidents = await SystemStatusService.getIncidents();
    return NextResponse.json(incidents);
  } catch (error) {
    console.error('Erreur lors de la récupération des incidents:', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de la récupération des incidents' },
      { status: 500 }
    );
  }
}

/**
 * Endpoint POST pour créer un nouvel incident
 */
export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { feature_id, title, description, severity, status, message } = data;
    
    console.log("Données reçues:", data);
    
    // Validation des données
    if (!feature_id || !title || !description || !severity || !status || !message) {
      console.error("Données incomplètes:", { feature_id, title, description, severity, status, message });
      return NextResponse.json(
        { error: 'Données incomplètes' },
        { status: 400 }
      );
    }
    
    if (!['low', 'medium', 'high', 'critical'].includes(severity)) {
      console.error("Sévérité invalide:", severity);
      return NextResponse.json(
        { error: 'Sévérité invalide' },
        { status: 400 }
      );
    }
    
    if (!['investigating', 'identified', 'monitoring', 'resolved'].includes(status)) {
      console.error("Statut invalide:", status);
      return NextResponse.json(
        { error: 'Statut invalide' },
        { status: 400 }
      );
    }
    
    // Vérifier que la fonctionnalité existe
    const feature = await SystemStatusService.getFeatureById(feature_id);
    if (!feature) {
      console.error("Fonctionnalité non trouvée:", feature_id);
      return NextResponse.json(
        { error: 'Fonctionnalité non trouvée' },
        { status: 404 }
      );
    }
    
    console.log("Création de l'incident...");
    const incident = await SystemStatusService.createIncident({
      feature_id,
      title,
      description,
      severity: severity as IncidentSeverity,
      status: status as IncidentStatus,
      message
    });
    console.log("Incident créé avec succès:", incident);
    
    return NextResponse.json(incident, { status: 201 });
  } catch (error) {
    console.error('Erreur lors de la création d\'un incident:', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de la création de l\'incident' },
      { status: 500 }
    );
  }
} 