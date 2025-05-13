import { NextResponse } from 'next/server';
import { sendBasicWelcomeEmail, verifyEmailService } from '@/lib/email';

export async function GET(request: Request) {
  try {
    // Vérifier le service d'email
    const serviceVerified = await verifyEmailService();
    console.log('Service email vérifié:', serviceVerified);
    
    if (!serviceVerified) {
      return NextResponse.json({
        success: false,
        message: 'Échec de la vérification du service email',
        config: {
          host: process.env.EMAIL_SMTP_HOST,
          port: process.env.EMAIL_SMTP_PORT,
          user: process.env.EMAIL_SMTP_USER ? 'défini' : 'non défini',
          pass: process.env.EMAIL_SMTP_PASSWORD ? 'défini' : 'non défini',
          from: process.env.EMAIL_FROM_ADDRESS
        }
      }, { status: 500 });
    }
    
    // Récupérer l'adresse email de test depuis les paramètres de requête ou utiliser une valeur par défaut
    const url = new URL(request.url);
    const testEmail = url.searchParams.get('email') || 'test@example.com';
    const name = url.searchParams.get('name') || 'Utilisateur Test';
    const role = (url.searchParams.get('role') as 'client' | 'freelance') || 'client';
    
    // Envoyer un email de test
    const emailSent = await sendBasicWelcomeEmail({
      to: testEmail,
      name: name,
      role: role
    });
    
    if (emailSent) {
      return NextResponse.json({
        success: true,
        message: `Email de bienvenue envoyé avec succès à ${testEmail}`,
        emailInfo: {
          to: testEmail,
          name: name,
          role: role
        }
      });
    } else {
      return NextResponse.json({
        success: false,
        message: `Échec de l'envoi de l'email à ${testEmail}`,
        emailInfo: {
          to: testEmail,
          name: name,
          role: role
        }
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Erreur lors du test d\'envoi d\'email:', error);
    return NextResponse.json({
      success: false,
      message: 'Erreur lors du test d\'envoi d\'email',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 