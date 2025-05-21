import { NextRequest, NextResponse } from 'next/server';
import { createServerCryptoService } from '@/lib/security/server-crypto-service';

/**
 * API sécurisée pour déchiffrer des données côté serveur
 * POST /api/security/decrypt
 * 
 * @param req Requête avec les données chiffrées dans le corps
 * @returns Réponse avec les données déchiffrées
 */
export async function POST(req: NextRequest) {
  try {
    // Vérifier que la requête contient des données
    const data = await req.json();
    
    if (!data || !data.encryptedValue) {
      return NextResponse.json(
        { error: 'Aucune donnée à déchiffrer fournie' },
        { status: 400 }
      );
    }
    
    // Créer le service de cryptographie côté serveur
    const cryptoService = createServerCryptoService();
    
    // Déchiffrer les données
    const decryptedValue = cryptoService.decrypt(data.encryptedValue);
    
    // Tenter de parser en JSON si possible
    let parsedValue;
    try {
      parsedValue = JSON.parse(decryptedValue);
    } catch (e) {
      // Si ce n'est pas du JSON valide, utiliser la valeur brute
      parsedValue = decryptedValue;
    }
    
    // Retourner les données déchiffrées
    return NextResponse.json({ value: parsedValue });
    
  } catch (error) {
    console.error('Erreur lors du déchiffrement:', error);
    
    return NextResponse.json(
      { error: 'Erreur lors du déchiffrement des données' },
      { status: 500 }
    );
  }
} 