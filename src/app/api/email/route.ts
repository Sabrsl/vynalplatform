import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { 
  sendWelcomeEmail, 
  sendOrderConfirmationEmail, 
  sendPasswordResetEmail,
  sendEmail,
  sendTemplateEmail,
  verifyEmailService
} from '@/lib/email';
import { processNotifications } from '@/lib/workers/notificationWorker';

/**
 * API pour l'envoi d'emails
 * @param req Requête entrante
 */
export async function POST(request: Request) {
  try {
    const { action, ...params } = await request.json();

    switch (action) {
      case 'send':
        const emailSent = await sendEmail(params);
        return NextResponse.json({ success: emailSent });
      
      case 'sendTemplate':
        const templateSent = await sendTemplateEmail(
          params.to,
          params.subject,
          params.templatePath,
          params.variables,
          params.options
        );
        return NextResponse.json({ success: templateSent });
      
      case 'verify':
        const isVerified = await verifyEmailService();
        return NextResponse.json({ success: isVerified });
      
      case 'processNotifications':
        await processNotifications();
        return NextResponse.json({ success: true });
      
      default:
        return NextResponse.json({ error: 'Action non valide' }, { status: 400 });
    }
  } catch (error) {
    console.error('Erreur API email:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// Route pour vérifier l'état du service d'email
export async function GET() {
  try {
    const isVerified = await verifyEmailService();
    return NextResponse.json({ status: isVerified ? 'active' : 'inactive' });
  } catch (error) {
    return NextResponse.json({ status: 'error', error: 'Erreur serveur' }, { status: 500 });
  }
} 