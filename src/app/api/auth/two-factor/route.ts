import { NextRequest, NextResponse } from 'next/server';
import { sendVerificationSMS, verifyCode } from '@/lib/twilio';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/database';

/**
 * API pour la gestion de l'authentification à deux facteurs
 */

// Vérifier le code 2FA
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code, userId } = body;

    if (!code || !userId) {
      return NextResponse.json(
        { success: false, message: 'Code et userId sont requis' },
        { status: 400 }
      );
    }

    // Simuler une vérification réussie
    // Dans une application réelle, vous vérifieriez le code dans la base de données
    const isValid = code.length === 6 && /^\d+$/.test(code);

    if (isValid) {
      return NextResponse.json({
        success: true,
        message: 'Code 2FA validé avec succès'
      });
    } else {
      return NextResponse.json(
        { success: false, message: 'Code 2FA invalide' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Erreur lors de la vérification 2FA:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur lors de la vérification du code 2FA' },
      { status: 500 }
    );
  }
}

// Générer un nouveau code 2FA
export async function GET(req: NextRequest) {
  try {
    // Récupérer l'ID utilisateur depuis les paramètres de requête
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'ID utilisateur requis' },
        { status: 400 }
      );
    }

    // Générer un code aléatoire à 6 chiffres
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Dans une application réelle, vous enregistreriez ce code dans la base de données
    // et l'enverriez par SMS ou email à l'utilisateur

    return NextResponse.json({
      success: true,
      message: 'Code 2FA généré avec succès',
      expiresIn: 300 // 5 minutes en secondes
    });
  } catch (error) {
    console.error('Erreur lors de la génération du code 2FA:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur lors de la génération du code 2FA' },
      { status: 500 }
    );
  }
}

// Envoyer un code de vérification lors de la connexion
export async function PUT(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    const body = await request.json();
    const { userId, phoneNumber, code, email, password } = body;

    if (!userId || !phoneNumber || !code || !email || !password) {
      return NextResponse.json(
        { success: false, message: 'Toutes les informations sont requises' },
        { status: 400 }
      );
    }

    // Vérifier le code SMS
    const verificationResult = await verifyCode(phoneNumber, code);

    if (!verificationResult.success) {
      return NextResponse.json(
        { success: false, message: verificationResult.message },
        { status: 400 }
      );
    }

    // Si le code est correct, on connecte l'utilisateur
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Connexion réussie',
      user: authData.user
    });
  } catch (error: any) {
    console.error('Erreur lors de la vérification du code 2FA:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Une erreur est survenue' },
      { status: 500 }
    );
  }
} 