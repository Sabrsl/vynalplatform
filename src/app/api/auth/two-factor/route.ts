import { NextRequest, NextResponse } from 'next/server';
import { sendVerificationSMS, verifyCode } from '@/lib/twilio';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/database';

/**
 * API pour la gestion de l'authentification à deux facteurs
 * Mode de développement: l'authentification à deux facteurs est désactivée
 * pour faciliter les tests.
 */

// Vérifier le code 2FA
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email et mot de passe sont requis' },
        { status: 400 }
      );
    }

    // Création du client Supabase pour authentifier l'utilisateur
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Authentification utilisateur directe
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

    // En mode développement, on court-circuite la vérification 2FA 
    // et on connecte directement l'utilisateur
    return NextResponse.json({
      success: true,
      message: 'Connexion réussie',
      user: authData.user
    });
    
    // Le code suivant est commenté pour le développement
    /*
    // En mode production, on vérifierait si l'utilisateur a activé la 2FA
    const { data: profiles } = await supabase
      .from('profiles')
      .select('two_factor_enabled, phone_number')
      .eq('id', authData.user.id)
      .single();
    
    if (profiles?.two_factor_enabled) {
      // Si 2FA est activé, envoyer un code
      const phoneNumber = profiles.phone_number;
      
      // Envoyer le SMS avec le code 
      // (désactivé en développement)
      // await sendVerificationSMS(phoneNumber);
      
      return NextResponse.json({
        success: true,
        requiresTwoFactor: true,
        userId: authData.user.id,
        phoneNumber: phoneNumber
      });
    }
    
    // Si 2FA n'est pas activé, connexion directe
    return NextResponse.json({
      success: true,
      message: 'Connexion réussie',
      user: authData.user
    });
    */
  } catch (error) {
    console.error('Erreur lors de l\'authentification:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur lors de l\'authentification' },
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

    // En mode développement, on accepte n'importe quel code valide
    const isValidCode = code.length === 6 && /^\d+$/.test(code);
    
    if (!isValidCode) {
      return NextResponse.json(
        { success: false, message: 'Code invalide. Le code doit contenir 6 chiffres.' },
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