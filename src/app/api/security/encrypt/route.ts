import { NextRequest, NextResponse } from 'next/server';
import { createServerCryptoService } from '@/lib/security/server-crypto-service';

/**
 * API sécurisée pour chiffrer des données côté serveur
 * POST /api/security/encrypt
 * 
 * @param req Requête avec les données à chiffrer dans le corps
 * @returns Réponse avec les données chiffrées
 */
export async function POST(req: NextRequest) {
  try {
    // Vérifier que la requête contient des données
    const data = await req.json();
    
    if (!data || !data.value) {
      return NextResponse.json(
        { error: 'Aucune donnée à chiffrer fournie' },
        { status: 400 }
      );
    }
    
    // Créer le service de cryptographie côté serveur
    const cryptoService = createServerCryptoService();
    
    // Chiffrer les données
    const encryptedValue = cryptoService.encrypt(
      typeof data.value === 'string' 
        ? data.value
        : JSON.stringify(data.value)
    );
    
    // Retourner les données chiffrées
    return NextResponse.json({ encryptedValue });
    
  } catch (error) {
    console.error('Erreur lors du chiffrement:', error);
    
    return NextResponse.json(
      { error: 'Erreur lors du chiffrement des données' },
      { status: 500 }
    );
  }
} 