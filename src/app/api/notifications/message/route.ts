import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { processNotification } from "@/lib/workers/notificationWorker";

/**
 * API pour envoyer une notification de message direct
 * Cette API est accessible à tous les utilisateurs connectés
 */
export async function POST(req: NextRequest) {
  try {
    // Vérifier l'authentification
    const supabase = createRouteHandlerClient({ cookies });
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { success: false, message: "Non autorisé" },
        { status: 401 },
      );
    }

    // Parser le corps de la requête
    const body = await req.json();
    const { userId, type, content, conversationId } = body;

    // Vérifier que l'utilisateur n'essaie pas de s'envoyer une notification à lui-même
    if (userId === session.user.id) {
      return NextResponse.json(
        {
          success: false,
          message: "Vous ne pouvez pas vous envoyer une notification",
        },
        { status: 400 },
      );
    }

    // Log détaillé pour le débogage
    console.log("API Notification Message - Corps de la requête reçu:", {
      userId: userId ? userId.substring(0, 8) + "..." : "undefined",
      type,
      hasContent: !!content,
      contentType: content ? typeof content : "N/A",
      conversationId: conversationId || "N/A",
    });

    if (!userId || !type) {
      console.error("API Notification Message - Paramètres manquants", {
        userId,
        type,
      });
      return NextResponse.json(
        {
          success: false,
          message: "Paramètres manquants: userId et type sont requis",
        },
        { status: 400 },
      );
    }

    // S'assurer que le contenu est correctement formaté
    const contentToStore =
      typeof content === "string" ? content : JSON.stringify(content);

    // Créer une notification dans la base de données
    const { data: notification, error } = await supabase
      .from("notifications")
      .insert({
        user_id: userId,
        type,
        content: contentToStore || null,
        conversation_id: conversationId || null,
        read: false,
      })
      .select()
      .single();

    if (error) {
      console.error(
        "API Notification Message - Erreur lors de la création de la notification:",
        error,
      );
      return NextResponse.json(
        {
          success: false,
          message: "Erreur lors de la création de la notification",
          error: error.message,
        },
        { status: 500 },
      );
    }

    // Traiter la notification (envoyer l'email)
    if (notification) {
      await processNotification(notification);

      return NextResponse.json({
        success: true,
        message: "Notification créée et email envoyé avec succès",
        notification,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          message: "Erreur lors de la création de la notification",
        },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error(
      "Erreur lors de l'envoi de la notification de message:",
      error,
    );
    return NextResponse.json(
      { success: false, message: "Erreur serveur" },
      { status: 500 },
    );
  }
}
