import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { 
  sendWelcomeEmail, 
  sendOrderConfirmationEmail, 
  sendPasswordResetEmail 
} from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, data } = body;
    
    // Obtenir la session utilisateur pour vérifier l'authentification
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();
    
    // Si le type d'email nécessite une authentification et que l'utilisateur n'est pas connecté
    if (['order_confirmation', 'welcome_client'].includes(type) && !session) {
      return NextResponse.json(
        { error: 'Authentification requise' },
        { status: 401 }
      );
    }

    // Vérifier que les données nécessaires sont présentes
    if (!data) {
      return NextResponse.json(
        { error: 'Données manquantes' },
        { status: 400 }
      );
    }

    let result = false;

    // Envoyer l'email en fonction du type
    switch (type) {
      case 'welcome_client':
        if (!data.email || !data.name) {
          return NextResponse.json(
            { error: 'Données incomplètes pour l\'email de bienvenue client' },
            { status: 400 }
          );
        }
        result = await sendWelcomeEmail({
          to: data.email,
          name: data.name,
          role: 'client'
        });
        break;

      case 'welcome_freelance':
        if (!data.email || !data.name) {
          return NextResponse.json(
            { error: 'Données incomplètes pour l\'email de bienvenue freelance' },
            { status: 400 }
          );
        }
        result = await sendWelcomeEmail({
          to: data.email,
          name: data.name,
          role: 'freelance'
        });
        break;

      case 'order_confirmation':
        if (!data.email || !data.orderNumber || !data.serviceName || 
            !data.amount || !data.buyerName || !data.sellerName || 
            !data.orderDate || !data.deliveryDate) {
          return NextResponse.json(
            { error: 'Données incomplètes pour l\'email de confirmation de commande' },
            { status: 400 }
          );
        }
        result = await sendOrderConfirmationEmail({
          to: data.email,
          orderNumber: data.orderNumber,
          serviceName: data.serviceName,
          amount: data.amount,
          currency: data.currency || 'FCFA',
          buyerName: data.buyerName,
          sellerName: data.sellerName,
          orderDate: data.orderDate,
          deliveryDate: data.deliveryDate
        });
        break;

      case 'password_reset':
        if (!data.email || !data.resetLink) {
          return NextResponse.json(
            { error: 'Données incomplètes pour l\'email de réinitialisation de mot de passe' },
            { status: 400 }
          );
        }
        result = await sendPasswordResetEmail({
          to: data.email,
          resetLink: data.resetLink
        });
        break;

      default:
        return NextResponse.json(
          { error: 'Type d\'email non supporté' },
          { status: 400 }
        );
    }

    if (result) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { error: 'Échec de l\'envoi de l\'email' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
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