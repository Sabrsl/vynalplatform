import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { sendEmail } from '@/lib/email';
import { APP_CONFIG } from '@/lib/constants';

// Schéma de validation pour le formulaire de contact
const contactFormSchema = z.object({
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  email: z.string().email(),
  subject: z.string().min(1).max(100),
  message: z.string().min(10).max(5000),
  acceptPolicy: z.boolean().refine(val => val === true, {
    message: "Vous devez accepter la politique de confidentialité"
  })
});

export async function POST(request: NextRequest) {
  try {
    // Récupérer le corps de la requête
    const body = await request.json();
    
    // Valider les données avec Zod
    const validationResult = contactFormSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: validationResult.error.format() },
        { status: 400 }
      );
    }
    
    const { firstName, lastName, email, subject, message } = validationResult.data;
    
    // Créer le client Supabase
    const supabase = createRouteHandlerClient({ cookies });
    
    try {
      // Enregistrer le message dans la table "contact_messages"
      const { data: contactMessage, error: contactMessageError } = await supabase
        .from('contact_messages')
        .insert({
          first_name: firstName,
          last_name: lastName,
          email: email,
          subject: subject,
          message: message,
          status: 'unread'
        })
        .select()
        .single();
      
      if (contactMessageError) {
        console.error('Erreur détaillée lors de la création du message de contact:', {
          error: contactMessageError,
          message: contactMessageError.message,
          details: contactMessageError.details,
          hint: contactMessageError.hint
        });
        return NextResponse.json(
          { 
            error: 'Erreur lors de la création du message de contact',
            details: contactMessageError.message
          },
          { status: 500 }
        );
      }
      
      // Envoyer un email de notification à l'administrateur
      try {
        const adminEmail = process.env.ADMIN_EMAIL || 'support@vynalplatform.com';
        
        await sendEmail({
          to: adminEmail,
          subject: `[Nouveau message de contact] ${subject}`,
          html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #6554AF;">Nouveau message de contact</h1>
              <p><strong>De:</strong> ${firstName} ${lastName} (${email})</p>
              <p><strong>Sujet:</strong> ${subject}</p>
              <p><strong>Message:</strong></p>
              <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 10px 0;">
                ${message.replace(/\n/g, '<br />')}
              </div>
              <p>Vous pouvez répondre à ce message depuis le <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/admin/messaging">panneau d'administration</a>.</p>
            </div>
          `,
          text: `Nouveau message de contact\n\nDe: ${firstName} ${lastName} (${email})\nSujet: ${subject}\n\nMessage:\n${message}\n\nConnectez-vous au panneau d'administration pour répondre: ${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/admin/messaging`,
        });
  
      } catch (emailError) {
        console.error('Erreur lors de l\'envoi de l\'email de notification:', emailError);
        // Nous continuons malgré l'erreur d'email car le message est déjà enregistré dans la base de données
      }
      
      return NextResponse.json(
        { success: true, message: 'Message envoyé avec succès' }
      );
    } catch (dbError) {
      console.error('Erreur lors de l\'interaction avec la base de données:', dbError);
      return NextResponse.json(
        { error: 'Erreur lors du traitement de votre message' },
        { status: 500 }
      );
    }
    
  } catch (error) {
    console.error('Erreur lors du traitement du message de contact:', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors du traitement de votre message' },
      { status: 500 }
    );
  }
} 