// app/api/system-status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { SystemFeature, SystemIncident } from '@/types/system-status';

// Configuration
const STORAGE_PATH = process.env.NODE_ENV === 'production' 
  ? '/data/system-status.json' 
  : path.join(process.cwd(), 'public/data/system-status.json');

// Types pour le fichier JSON
interface SystemStatusData {
  features: SystemFeature[];
  incidents: SystemIncident[];
  lastUpdated: string; // Date ISO
}

/**
 * Lit les données du fichier JSON
 */
async function readData(): Promise<SystemStatusData> {
  try {
    // Vérifie si le fichier existe, sinon le crée avec des données par défaut
    try {
      await fs.access(STORAGE_PATH);
    } catch (err) {
      // Le fichier n'existe pas, créer le répertoire si nécessaire
      const dir = path.dirname(STORAGE_PATH);
      await fs.mkdir(dir, { recursive: true });
      
      // Créer le fichier avec des données par défaut
      await fs.writeFile(STORAGE_PATH, JSON.stringify({
        features: [],
        incidents: [],
        lastUpdated: new Date().toISOString()
      }, null, 2), 'utf8');
    }
    
    // Lire le fichier
    const data = await fs.readFile(STORAGE_PATH, 'utf8');
    return JSON.parse(data) as SystemStatusData;
  } catch (error) {
    console.error(`Erreur lors de la lecture du fichier ${STORAGE_PATH}:`, error);
    // En cas d'erreur, retourner des données vides
    return {
      features: [],
      incidents: [],
      lastUpdated: new Date().toISOString()
    };
  }
}

/**
 * Écrit les données dans le fichier JSON
 */
async function writeData(data: SystemStatusData): Promise<void> {
  try {
    // Mettre à jour la date de dernière modification
    data.lastUpdated = new Date().toISOString();
    
    // Écrire dans le fichier
    await fs.writeFile(STORAGE_PATH, JSON.stringify(data, null, 2), 'utf8');
  } catch (error) {
    console.error(`Erreur lors de l'écriture dans le fichier ${STORAGE_PATH}:`, error);
    throw error;
  }
}

/**
 * Route GET pour récupérer toutes les données
 */
export async function GET(req: NextRequest) {
  try {
    const data = await readData();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Erreur lors de la récupération des données:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des données' },
      { status: 500 }
    );
  }
}

/**
 * Route POST pour mettre à jour les données
 */
export async function POST(req: NextRequest) {
  try {
    // Récupérer le corps de la requête
    const body = await req.json();
    
    // Valider les données (simple vérification que les tableaux existent)
    if (!Array.isArray(body.features) || !Array.isArray(body.incidents)) {
      return NextResponse.json(
        { error: 'Les données sont invalides' },
        { status: 400 }
      );
    }
    
    // Écrire les données
    await writeData({
      features: body.features,
      incidents: body.incidents,
      lastUpdated: new Date().toISOString()
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur lors de la mise à jour des données:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour des données' },
      { status: 500 }
    );
  }
}