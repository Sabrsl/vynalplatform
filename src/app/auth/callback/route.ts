import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { sendBasicWelcomeEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const redirectTo = requestUrl.searchParams.get("redirectTo") || "/dashboard";

  if (code) {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    try {
      console.log("Début du processus de callback - code reçu");

      // Échange du code contre une session
      const { data: sessionData, error: sessionError } =
        await supabase.auth.exchangeCodeForSession(code);

      if (sessionError) {
        console.error(
          "Erreur lors de l'échange du code pour une session:",
          sessionError,
        );
        return NextResponse.redirect(
          new URL("/auth/login?error=session", requestUrl.origin),
        );
      }

      if (!sessionData || !sessionData.session) {
        console.error("Session non créée après échange de code");
        return NextResponse.redirect(
          new URL("/auth/login?error=nosession", requestUrl.origin),
        );
      }

      console.log(
        "Session créée avec succès, userId:",
        sessionData.session.user.id,
      );

      // S'assurer que les cookies sont correctement définis
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Récupération du rôle utilisateur directement à partir de la session
      let finalRole = sessionData.session.user.user_metadata?.role;
      let welcomeEmailAlreadySent = false;
      let userId = sessionData.session.user.id;

      console.log("Rôle depuis les métadonnées utilisateur:", finalRole);

      // Si le rôle n'est pas dans les métadonnées, essayer de le récupérer depuis le profil
      if (!finalRole) {
        try {
          // Vérifier d'abord si le profil existe
          const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("role, welcome_email_sent")
            .eq("id", userId)
            .single();

          if (profileError) {
            console.log("Profil non trouvé, création d'un nouveau profil");
            // Profil non trouvé, créer un nouveau
            const defaultRole = "freelance"; // Rôle par défaut pour les connexions OAuth

            const { data: newProfile, error: createError } = await supabase
              .from("profiles")
              .insert([
                {
                  id: userId,
                  email: sessionData.session.user.email,
                  role: defaultRole,
                  welcome_email_sent: false,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                },
              ])
              .select()
              .single();

            if (createError) {
              console.error(
                "Erreur lors de la création du profil:",
                createError,
              );
              finalRole = defaultRole;
            } else {
              console.log("Profil créé avec succès");
              finalRole = newProfile.role;

              // Mettre à jour les métadonnées utilisateur avec le rôle
              await supabase.auth.updateUser({
                data: { role: finalRole },
              });
            }
          } else {
            console.log("Profil existant trouvé");
            finalRole = profile.role;
            welcomeEmailAlreadySent = profile.welcome_email_sent === true;

            // Synchroniser le rôle dans les métadonnées
            if (finalRole) {
              await supabase.auth.updateUser({
                data: { role: finalRole },
              });
            }
          }
        } catch (err) {
          console.error("Erreur lors de la récupération du profil:", err);
          finalRole = "freelance"; // Valeur par défaut en cas d'erreur
        }
      }

      // Utiliser un rôle par défaut si toujours non défini
      if (!finalRole) {
        finalRole = "freelance";
        console.log(
          "Aucun rôle trouvé, utilisation de la valeur par défaut:",
          finalRole,
        );
      } else {
        console.log("Rôle final:", finalRole);
      }

      // Gérer l'email de bienvenue seulement si nous n'avons pas déjà confirmé qu'il a été envoyé
      if (!welcomeEmailAlreadySent) {
        console.log("Traitement de l'email de bienvenue");

        try {
          // Récupérer le profil pour obtenir le nom complet
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name, welcome_email_sent")
            .eq("id", userId)
            .single();

          const userName =
            profile?.full_name ||
            sessionData.session.user.email?.split("@")[0] ||
            "Utilisateur";
          const emailSent = profile?.welcome_email_sent === true;

          console.log(
            `Statut de l'email de bienvenue: ${emailSent ? "déjà envoyé" : "pas encore envoyé"}`,
          );

          // Vérifier si l'email de bienvenue a déjà été envoyé
          if (!emailSent) {
            // Envoyer l'email de bienvenue
            const emailResult = await sendBasicWelcomeEmail({
              to: sessionData.session.user.email || "",
              name: userName,
              role: finalRole as "client" | "freelance",
            });

            console.log(
              `Résultat de l'envoi de l'email de bienvenue: ${emailResult ? "succès" : "échec"}`,
            );

            if (emailResult) {
              // Mettre à jour le profil pour indiquer que l'email a été envoyé
              const { data: updateData, error: updateError } = await supabase
                .from("profiles")
                .update({ welcome_email_sent: true })
                .eq("id", userId)
                .select()
                .single();

              if (updateError) {
                console.error(
                  `Erreur lors de la mise à jour du champ welcome_email_sent: ${updateError.message}`,
                );
              } else {
                console.log(
                  `Mise à jour réussie du champ welcome_email_sent: ${updateData?.welcome_email_sent}`,
                );
              }
            }
          }
        } catch (emailError) {
          // Erreur de l'email de bienvenue - continuer quand même
          console.error(
            "Erreur lors de l'envoi de l'email de bienvenue:",
            emailError,
          );
        }
      }

      // Avant de rediriger, s'assurer que la session est bien établie
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Redirection en fonction du rôle
      console.log(
        "Redirection vers:",
        finalRole === "client"
          ? "/client-dashboard"
          : finalRole === "admin"
            ? "/admin"
            : "/dashboard",
      );

      if (finalRole === "client") {
        return NextResponse.redirect(
          new URL("/client-dashboard", requestUrl.origin),
        );
      } else if (finalRole === "admin") {
        return NextResponse.redirect(new URL("/admin", requestUrl.origin));
      } else {
        // Par défaut, rediriger vers le dashboard freelance
        return NextResponse.redirect(new URL("/dashboard", requestUrl.origin));
      }
    } catch (err) {
      console.error("Exception générale dans le callback auth:", err);
      return NextResponse.redirect(
        new URL("/auth/login?error=general", requestUrl.origin),
      );
    }
  }

  // Redirection par défaut si pas de code
  console.log("Pas de code reçu, redirection vers:", redirectTo);
  return NextResponse.redirect(new URL(redirectTo, requestUrl.origin));
}
