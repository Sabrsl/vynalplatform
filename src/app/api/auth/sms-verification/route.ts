import { NextRequest, NextResponse } from 'next/server';
import { sendVerificationSMS, verifyCode } from '@/lib/twilio';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/database';

// Route pour envoyer un code de vérification par SMS
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ success: false, message: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();
    const { phoneNumber } = body;

    if (!phoneNumber) {
      return NextResponse.json(
        { success: false, message: 'Le numéro de téléphone est requis' },
        { status: 400 }
      );
    }

    const result = await sendVerificationSMS(phoneNumber);

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, message: result.message });
  } catch (error: any) {
    console.error('Erreur lors de l\'envoi du SMS de vérification:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Une erreur est survenue' },
      { status: 500 }
    );
  }
}

// Route pour vérifier le code
export async function PUT(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ success: false, message: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();
    const { phoneNumber, code } = body;

    if (!phoneNumber || !code) {
      return NextResponse.json(
        { success: false, message: 'Le numéro de téléphone et le code sont requis' },
        { status: 400 }
      );
    }

    const result = await verifyCode(phoneNumber, code);

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: 400 }
      );
    }

    // Mettre à jour les métadonnées de l'utilisateur pour indiquer que la vérification à deux facteurs est activée
    await supabase
      .from('profiles')
      .update({
        phone_number: phoneNumber,
        two_factor_enabled: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', session.user.id);

    return NextResponse.json({
      success: true,
      message: 'Vérification réussie et 2FA activée'
    });
  } catch (error: any) {
    console.error('Erreur lors de la vérification du code:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Une erreur est survenue' },
      { status: 500 }
    );
  }
}

// Route pour désactiver la vérification à deux facteurs
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ success: false, message: 'Non autorisé' }, { status: 401 });
    }

    // Mettre à jour le profil pour désactiver la vérification à deux facteurs
    await supabase
      .from('profiles')
      .update({
        two_factor_enabled: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', session.user.id);

    return NextResponse.json({
      success: true,
      message: 'Vérification à deux facteurs désactivée'
    });
  } catch (error: any) {
    console.error('Erreur lors de la désactivation de la 2FA:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Une erreur est survenue' },
      { status: 500 }
    );
  }
} 