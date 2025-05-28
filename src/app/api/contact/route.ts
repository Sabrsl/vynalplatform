import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { sendEmail } from "@/lib/email";
import { APP_CONFIG } from "@/lib/constants";
import { generateTicketId } from "@/lib/utils";

// Schéma de validation pour le formulaire de contact
const contactFormSchema = z.object({
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  email: z.string().email("L'email est invalide"),
  subject: z.string().min(1, "Le sujet est requis").max(100),
  message: z
    .string()
    .min(10, "Le message doit contenir au moins 10 caractères")
    .max(5000),
});

export async function POST(request: NextRequest) {
  try {
    // Récupérer le corps de la requête
    const body = await request.json();

    // Valider les données avec Zod
    const validationResult = contactFormSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Données invalides",
          details: validationResult.error.format(),
        },
        { status: 400 },
      );
    }

    const { firstName, lastName, email, subject, message } =
      validationResult.data;

    // Créer le client Supabase
    const supabase = createRouteHandlerClient({ cookies });

    // Générer un identifiant de ticket unique
    const ticketId = generateTicketId();

    try {
      // MODIFICATION: Suppression du .select().single() qui cause des problèmes
      const { error: contactMessageError } = await supabase
        .from("contact_messages")
        .insert({
          first_name: firstName,
          last_name: lastName,
          email: email,
          subject: subject,
          message: message,
          status: "unread",
          ticket_id: ticketId,
        });

      if (contactMessageError) {
        console.error(
          "Erreur détaillée lors de la création du message de contact:",
          contactMessageError,
        );
        return NextResponse.json(
          {
            error: "Erreur lors de la création du message de contact",
            details: contactMessageError.message,
          },
          { status: 500 },
        );
      }

      // Envoyer un email de notification à l'administrateur
      try {
        const adminEmail =
          process.env.ADMIN_EMAIL || "support@vynalplatform.com";

        await sendEmail({
          to: adminEmail,
          subject: `[Nouveau message de contact] ${subject} (Ticket: ${ticketId})`,
          html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #6554AF;">Nouveau message de contact</h1>
              <p><strong>Ticket:</strong> ${ticketId}</p>
              <p><strong>De:</strong> ${firstName} ${lastName} (${email})</p>
              <p><strong>Sujet:</strong> ${subject}</p>
              <p><strong>Message:</strong></p>
              <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 10px 0;">
                ${message.replace(/\n/g, "<br />")}
              </div>
              <p>Vous pouvez répondre à ce message depuis le <a href="${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/admin/messaging">panneau d'administration</a>.</p>
            </div>
          `,
          text: `Nouveau message de contact\n\nTicket: ${ticketId}\nDe: ${firstName} ${lastName} (${email})\nSujet: ${subject}\n\nMessage:\n${message}\n\nConnectez-vous au panneau d'administration pour répondre: ${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/admin/messaging`,
        });

        // Envoyer aussi un email de confirmation à l'utilisateur avec son numéro de ticket
        await sendEmail({
          to: email,
          subject: `[Vynal Platform] Confirmation de votre message (Ticket: ${ticketId})`,
          html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #6554AF;">Confirmation de votre message</h1>
              <p>Bonjour ${firstName} ${lastName},</p>
              <p>Nous avons bien reçu votre message concernant : <strong>${subject}</strong>.</p>
              <p>Un ticket a été créé pour suivre votre demande :</p>
              <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 10px 0; text-align: center; font-size: 1.2em; font-weight: bold;">
                ${ticketId}
              </div>
              <p>Veuillez conserver ce numéro de ticket pour toute communication future concernant cette demande.</p>
              <p>Notre équipe vous répondra dans les meilleurs délais.</p>
              <p>Cordialement,<br>L'équipe Vynal Platform</p>
            </div>
          `,
          text: `Confirmation de votre message\n\nBonjour ${firstName} ${lastName},\n\nNous avons bien reçu votre message concernant : ${subject}.\n\nUn ticket a été créé pour suivre votre demande : ${ticketId}\n\nVeuillez conserver ce numéro de ticket pour toute communication future concernant cette demande.\n\nNotre équipe vous répondra dans les meilleurs délais.\n\nCordialement,\nL'équipe Vynal Platform`,
        });
      } catch (emailError) {
        console.error(
          "Erreur lors de l'envoi de l'email de notification:",
          emailError,
        );
        // Nous continuons malgré l'erreur d'email car le message est déjà enregistré dans la base de données
      }

      return NextResponse.json({
        success: true,
        message: "Message envoyé avec succès",
        ticketId,
      });
    } catch (dbError) {
      console.error(
        "Erreur lors de l'interaction avec la base de données:",
        dbError,
      );
      return NextResponse.json(
        {
          error: "Erreur lors du traitement de votre message",
          details: String(dbError),
        },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("Erreur lors du traitement du message de contact:", error);
    return NextResponse.json(
      {
        error: "Erreur serveur lors du traitement de votre message",
        details: String(error),
      },
      { status: 500 },
    );
  }
}
