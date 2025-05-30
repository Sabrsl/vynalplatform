import { NextRequest, NextResponse } from "next/server";
import { createPaymentIntent } from "@/lib/stripe/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { logSecurityEvent } from "@/lib/security/audit";
import { cookies } from "next/headers";
import {
  validatePaymentCurrency,
  detectCurrency,
  convertToEur,
  normalizeAmount,
} from "@/lib/utils/currency-updater";

/**
 * API pour créer un PaymentIntent Stripe avec authentification RLS
 *
 * Route: POST /api/stripe/payment-intent
 */
export async function POST(req: NextRequest) {
  // Récupérer les informations sur le client
  const clientIp = req.headers.get("x-forwarded-for") || req.ip || "unknown";
  const userAgent = req.headers.get("user-agent") || "unknown";

  try {
    // Récupération et validation du corps de la requête
    const body = await req.json();

    // Validation des données requises
    if (!body.amount || !body.serviceId) {
      return NextResponse.json(
        { error: "Données incomplètes. Montant et ID du service requis." },
        { status: 400 },
      );
    }

    // Configuration de l'environnement
    const isDev = process.env.NODE_ENV === "development";

    // Utilisation de createRouteHandlerClient pour accéder à Supabase
    const supabase = createRouteHandlerClient({ cookies });

    // Vérification de la session utilisateur (la sécurité est gérée par RLS)
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    // Variables pour l'utilisateur
    let userId: string = session?.user?.id || "";
    let userEmail: string = session?.user?.email || "";

    // Si aucune session valide n'est trouvée, retourner une erreur 401
    if (!session?.user) {
      // Enregistrer l'événement de sécurité
      await logSecurityEvent({
        type: "security_violation",
        ipAddress: clientIp as string,
        userAgent: userAgent as string,
        severity: "high",
        details: {
          error: "Tentative de création de paiement sans authentification",
          endpoint: "/api/stripe/payment-intent",
        },
      });

      return NextResponse.json(
        { error: "Non autorisé. Authentification requise." },
        { status: 401 },
      );
    }

    // Extraction des informations nécessaires
    const { amount, serviceId, freelanceId, metadata = {} } = body;

    // Vérification du montant (doit être un nombre positif)
    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json(
        { error: "Le montant doit être un nombre positif" },
        { status: 400 },
      );
    }

    // Rechercher le freelanceId si non fourni, en utilisant RLS
    let freelanceIdentifier = freelanceId;
    if (!freelanceIdentifier) {
      try {
        // Récupérer le freelance ID à partir du service via RLS
        const { data: serviceData, error: serviceError } = await supabase
          .from("services")
          .select("freelance_id")
          .eq("id", serviceId)
          .single();

        if (!serviceError && serviceData) {
          freelanceIdentifier = serviceData.freelance_id;
        } else if (isDev) {
          // En développement uniquement, utiliser un ID par défaut
          freelanceIdentifier = "2fde948c-91d8-4ae7-9a04-77c363680106";
        } else {
          throw new Error("Service non trouvé ou inaccessible");
        }
      } catch (error) {
        return NextResponse.json(
          { error: "Service invalide ou inaccessible" },
          { status: 400 },
        );
      }
    }

    if (!freelanceIdentifier) {
      return NextResponse.json(
        { error: "ID du freelance requis pour le paiement" },
        { status: 400 },
      );
    }

    // Journaliser la tentative de création de PaymentIntent
    await logSecurityEvent({
      type: "payment_attempt",
      userId,
      ipAddress: clientIp as string,
      userAgent: userAgent as string,
      severity: "medium",
      details: {
        serviceId,
        freelanceId: freelanceIdentifier,
        amount,
      },
    });

    try {
      // Générer un numéro de commande unique
      const generateOrderNumber = () => {
        const prefix = "VNL";
        const timestamp = Date.now().toString().slice(-6);
        const random = Math.floor(Math.random() * 1000)
          .toString()
          .padStart(3, "0");
        return `${prefix}-${timestamp}-${random}`;
      };

      // Vérifier si une commande existe déjà pour ce service et ce client
      const { data: existingOrder, error: existingOrderError } = await supabase
        .from("orders")
        .select("id")
        .eq("service_id", serviceId)
        .eq("client_id", userId)
        .or(`status.eq.pending,status.eq.pre_payment`)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existingOrderError && existingOrderError.code !== "PGRST116") {
        throw new Error(
          "Erreur lors de la vérification des commandes existantes",
        );
      }

      let orderId;

      if (existingOrder) {
        // Utiliser la commande existante
        orderId = existingOrder.id;
        console.log(
          `Utilisation d'une commande existante en attente: ${orderId}`,
        );
      } else {
        // Créer une commande temporaire uniquement si nécessaire pour le paiement
        // Le statut "pre_payment" indique que la commande n'est pas encore finalisée
        const orderNumber = generateOrderNumber();
        const { data: newOrder, error: orderError } = await supabase
          .from("orders")
          .insert({
            client_id: userId,
            freelance_id: freelanceIdentifier,
            service_id: serviceId,
            status: "pre_payment", // Statut spécial pour indiquer que le paiement n'est pas encore confirmé
            requirements: metadata.requirements || "",
            delivery_time: metadata.deliveryTime || 7,
            order_number: orderNumber,
            price: parseFloat(amount), // Montant directement en XOF (pas de division par 100)
          })
          .select("id")
          .single();

        if (orderError) {
          throw new Error(
            "Erreur lors de la création de la commande temporaire",
          );
        }

        orderId = newOrder?.id;
        console.log(
          `Création d'une commande temporaire pour le paiement: ${orderId}`,
        );
      }

      if (!orderId) {
        throw new Error("Impossible de créer ou récupérer la commande");
      }

      // Récupérer les informations de l'utilisateur pour la devise
      let userCurrency = "xof"; // Devise par défaut - TOUJOURS considérer XOF comme devise de base dans la BD

      const { data: userProfileData } = await supabase
        .from("profiles")
        .select("country, currency_preference")
        .eq("id", userId)
        .single();

      if (userProfileData) {
        // Uniquement pour l'affichage à l'utilisateur, pas pour le traitement du paiement
        if (userProfileData.currency_preference) {
          userCurrency = userProfileData.currency_preference.toLowerCase();
        } else {
          // Si pas de préférence définie, utiliser la devise détectée par pays comme suggestion
          const userCountry = userProfileData.country || "SN";
          userCurrency = detectCurrency(userCountry).toLowerCase();
        }
      }

      // CORRECTION: Tous les prix dans la base de données sont en XOF
      // Le montant reçu est déjà en unités XOF (pas de centimes pour XOF)
      const originalAmountInUnits = parseFloat(amount); // PAS de division par 100 car XOF n'a pas de centimes

      // CORRECTION CRITIQUE: Le montant reçu est directement en XOF
      // Nous devons convertir directement XOF vers EUR

      // Vérifier et normaliser le montant XOF si nécessaire
      const normalizedXofAmount = normalizeAmount(originalAmountInUnits, "XOF");

      // Convertir directement le montant XOF en EUR
      // en utilisant les taux définis dans le projet
      let amountInEuros = 0;
      try {
        amountInEuros = convertToEur(
          normalizedXofAmount,
          "XOF",
          false,
        ) as number;

        // Vérification de sécurité supplémentaire sur le montant converti
        if (amountInEuros > 10000) {
          return NextResponse.json(
            {
              error:
                "Montant converti anormalement élevé. Veuillez vérifier le montant de votre paiement.",
            },
            { status: 400 },
          );
        }
      } catch (conversionError: any) {
        return NextResponse.json(
          {
            error: `Erreur de conversion: ${conversionError.message || "Impossible de convertir le montant en EUR"}`,
          },
          { status: 400 },
        );
      }

      // Convertir en centimes pour Stripe (qui attend les montants en centimes)
      const amountInEuroCents = Math.round(amountInEuros * 100);

      // Création du PaymentIntent via l'API Stripe - toujours en euros
      const paymentIntent = await createPaymentIntent({
        amount: amountInEuroCents, // Montant en centimes d'euro
        currency: "eur", // Forcer l'euro pour tous les paiements
        metadata: {
          clientId: userId,
          freelanceId: freelanceIdentifier,
          serviceId,
          orderId,
          userEmail,
          originalCurrency: "XOF", // CORRECTION: Toujours stocker XOF comme devise originale
          originalAmount: originalAmountInUnits.toString(), // Stocker le montant original
          userCurrency: userCurrency, // Devise d'affichage pour l'utilisateur (information uniquement)
          conversionDetails: JSON.stringify({
            fromCurrency: "XOF",
            toCurrency: "EUR",
            originalAmount: originalAmountInUnits,
            convertedAmount: amountInEuros,
            conversionRate: amountInEuros / originalAmountInUnits,
            amountInEuroCents: amountInEuroCents, // Ajouter le montant en centimes pour le débogage
          }),
          // Note: rawAmount n'est plus nécessaire car on utilise la même valeur
          ...metadata,
        },
      });

      // Vérifier si un paiement existe déjà pour cette commande
      const { data: existingPayment, error: existingPaymentError } =
        await supabase
          .from("payments")
          .select("id")
          .eq("order_id", orderId)
          .eq("payment_intent_id", paymentIntent.id)
          .single();

      if (existingPaymentError && existingPaymentError.code !== "PGRST116") {
        // Ignore l'erreur si aucun paiement n'existe
      }

      // Insérer l'entrée dans la table payments seulement si elle n'existe pas déjà
      if (!existingPayment) {
        const { error: dbError } = await supabase.from("payments").insert({
          order_id: orderId,
          client_id: userId,
          freelance_id: freelanceIdentifier,
          amount: parseFloat(amount), // Montant directement en XOF (pas de division par 100)
          status: "pending",
          payment_method: "stripe",
          payment_intent_id: paymentIntent.id,
        });

        if (dbError) {
          throw new Error("Erreur lors de l'enregistrement du paiement");
        }
      }

      // Retourner les informations du PaymentIntent
      return NextResponse.json({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        orderId,
      });
    } catch (error: any) {
      return NextResponse.json(
        { error: error.message || "Erreur lors de la création du paiement" },
        { status: 500 },
      );
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: "Une erreur inattendue est survenue" },
      { status: 500 },
    );
  }
}
