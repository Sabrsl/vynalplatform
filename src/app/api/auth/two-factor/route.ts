import { NextRequest, NextResponse } from 'next/server';
import { sendVerificationSMS, verifyCode } from '@/lib/twilio';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/database';

// Envoyer un code de vérification lors de la connexion
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email et mot de passe requis' },
        { status: 400 }
      );
    }

    // Tentative de connexion
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

    // Vérifier si l'utilisateur a activé la 2FA
    const { data: profile } = await supabase
      .from('profiles')
      .select('phone_number, two_factor_enabled')
      .eq('id', authData.user.id)
      .single();

    if (!profile || !profile.two_factor_enabled || !profile.phone_number) {
      // L'utilisateur n'a pas activé la 2FA ou n'a pas de numéro de téléphone
      return NextResponse.json({
        success: true,
        requiresTwoFactor: false,
        user: authData.user,
      });
    }

    // L'utilisateur a activé la 2FA, envoyer un code de vérification
    const result = await sendVerificationSMS(profile.phone_number);

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: 400 }
      );
    }

    // On déconnecte l'utilisateur en attendant la vérification par SMS
    await supabase.auth.signOut();

    return NextResponse.json({
      success: true,
      requiresTwoFactor: true,
      message: 'Code de vérification envoyé',
      phoneNumber: profile.phone_number.replace(/\d(?=\d{4})/g, '*'), // Masquer partiellement le numéro
      userId: authData.user.id,
    });
  } catch (error: any) {
    console.error('Erreur lors de la connexion avec 2FA:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Une erreur est survenue' },
      { status: 500 }
    );
  }
}

// Vérifier le code et finaliser la connexion
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