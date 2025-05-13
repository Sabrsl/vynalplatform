import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { SystemIncident } from '@/types/system-status';

const STORAGE_PATH = process.env.NODE_ENV === 'production' 
  ? '/data/system-status.json' 
  : path.join(process.cwd(), 'public/data/system-status.json');

interface SystemStatusData {
  features: unknown[];
  incidents: SystemIncident[];
  lastUpdated: string;
}

async function readData(): Promise<SystemStatusData> {
  const data = await fs.readFile(STORAGE_PATH, 'utf8');
  return JSON.parse(data) as SystemStatusData;
}

export async function GET(req: NextRequest) {
  try {
    const data = await readData();
    return NextResponse.json(data.incidents);
  } catch (error) {
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des incidents' },
      { status: 500 }
    );
  }
} 