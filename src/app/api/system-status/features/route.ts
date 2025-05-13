import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { SystemFeature } from '@/types/system-status';

const STORAGE_PATH = process.env.NODE_ENV === 'production' 
  ? '/data/system-status.json' 
  : path.join(process.cwd(), 'public/data/system-status.json');

interface SystemStatusData {
  features: SystemFeature[];
  incidents: unknown[];
  lastUpdated: string;
}

async function readData(): Promise<SystemStatusData> {
  const data = await fs.readFile(STORAGE_PATH, 'utf8');
  return JSON.parse(data) as SystemStatusData;
}

export async function GET(req: NextRequest) {
  try {
    const data = await readData();
    return NextResponse.json(data.features);
  } catch (error) {
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des fonctionnalités' },
      { status: 500 }
    );
  }
} 