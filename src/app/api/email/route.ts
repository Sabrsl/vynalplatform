import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { 
  sendWelcomeEmail, 
  sendOrderConfirmationEmail, 
  sendPasswordResetEmail 
} from '@/lib/email';

/**
 * API pour l'envoi d'emails
 * @param req Requête entrante
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { to, subject, html, text } = body;
    
    // Validation basique
    if (!to || !subject || (!html && !text)) {
      return NextResponse.json(
        { success: false, message: 'Paramètres manquants: to, subject, et html/text sont requis' },
        { status: 400 }
      );
    }
    
    // Placeholder - ici vous intégreriez votre service d'email
    console.log('Envoi d\'email:', { to, subject });
    
    // Simuler un envoi réussi
    return NextResponse.json({ 
      success: true, 
      message: 'Email envoyé avec succès',
      messageId: `msg_${Date.now()}`
    });
    
  } catch (error) {
    console.error('Erreur lors de l\'envoi d\'email:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur lors de l\'envoi de l\'email' },
      { status: 500 }
    );
  }
}

// Pour vérifier l'état du serveur d'email
export async function GET() {
  return NextResponse.json({
    status: 'OK',
    provider: process.env.EMAIL_SMTP_HOST,
    from: process.env.EMAIL_FROM_ADDRESS
  });
} 