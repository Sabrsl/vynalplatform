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

    console.log(
      "API payment-intent - Corps de la requête:",
      JSON.stringify(body),
    );

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
        console.error("Erreur lors de la récupération du freelanceId:", error);
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
      // Obtenir l'ID de commande en utilisant le serviceId
      // Si pas de commande, on en crée une
      let orderId;

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
        .eq("status", "pending")
        .single();

      if (existingOrderError && existingOrderError.code !== "PGRST116") {
        console.error(
          "Erreur lors de la vérification des commandes existantes:",
          existingOrderError,
        );
        throw new Error(
          "Erreur lors de la vérification des commandes existantes",
        );
      }

      if (existingOrder) {
        orderId = existingOrder.id;
      } else {
        // Créer une commande si nécessaire
        const orderNumber = generateOrderNumber();
        const { data: newOrder, error: orderError } = await supabase
          .from("orders")
          .insert({
            client_id: userId,
            freelance_id: freelanceIdentifier,
            service_id: serviceId,
            status: "pending",
            requirements: metadata.requirements || "",
            delivery_time: metadata.deliveryTime || 7,
            order_number: orderNumber,
            price: parseFloat(amount) / 100, // Convertir les centimes en unités pour le stockage
          })
          .select("id")
          .single();

        if (orderError) {
          console.error(
            "Erreur détaillée lors de la création de la commande:",
            {
              error: orderError,
              code: orderError.code,
              details: orderError.details,
              message: orderError.message,
            },
          );
          throw new Error("Erreur lors de la création de la commande");
        }

        orderId = newOrder?.id;
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
      // Le montant original est en centimes (100 = 1€), donc on le convertit en unités monétaires
      const originalAmountInUnits = parseFloat(amount) / 100;
      console.log(
        `[DEBUG CONVERSION] Montant original: ${amount} centimes = ${originalAmountInUnits} XOF (unités)`,
      );

      // CORRECTION CRITIQUE: Le montant reçu est en centimes de XOF, pas en centimes d'EUR
      // Nous devons d'abord convertir les centimes de XOF en unités XOF, puis convertir en EUR

      // Vérifier et normaliser le montant XOF si nécessaire
      const normalizedXofAmount = normalizeAmount(originalAmountInUnits, "XOF");

      // Convertir directement le montant XOF en EUR sans normalisation supplémentaire
      // en utilisant les taux définis dans le projet
      let amountInEuros = 0;
      try {
        amountInEuros = convertToEur(
          normalizedXofAmount,
          "XOF",
          false,
        ) as number;
        console.log(
          `[DEBUG CONVERSION] Conversion pour paiement Stripe: ${normalizedXofAmount} XOF → ${amountInEuros} EUR (utilisant les taux définis)`,
        );

        // Vérification de sécurité supplémentaire sur le montant converti
        if (amountInEuros > 10000) {
          console.error(
            `[DEBUG CONVERSION] Montant EUR converti anormalement élevé: ${amountInEuros} EUR`,
          );
          return NextResponse.json(
            {
              error:
                "Montant converti anormalement élevé. Veuillez vérifier le montant de votre paiement.",
            },
            { status: 400 },
          );
        }
      } catch (conversionError: any) {
        console.error(
          "[DEBUG CONVERSION] Erreur lors de la conversion du montant:",
          conversionError,
        );
        return NextResponse.json(
          {
            error: `Erreur de conversion: ${conversionError.message || "Impossible de convertir le montant en EUR"}`,
          },
          { status: 400 },
        );
      }

      // Convertir en centimes pour Stripe (qui attend les montants en centimes)
      const amountInEuroCents = Math.round(amountInEuros * 100);
      console.log(
        `[DEBUG CONVERSION] Montant final pour Stripe: ${amountInEuros} EUR → ${amountInEuroCents} centimes d'euro`,
      );

      // Ajouter des logs détaillés pour vérifier le flux complet
      console.log(`[DEBUG CONVERSION] FLUX COMPLET STRIPE:
      1. Montant original de la base: ${amount} centimes XOF (${originalAmountInUnits} XOF unités)
      2. Montant XOF normalisé si nécessaire: ${normalizedXofAmount} XOF
      3. Conversion XOF → EUR: ${normalizedXofAmount} XOF → ${amountInEuros} EUR 
      4. Conversion EUR → cents: ${amountInEuros} EUR → ${amountInEuroCents} centimes
      5. MONTANT FINAL envoyé à Stripe: ${amountInEuroCents} centimes d'euro`);

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
        console.error(
          "Erreur lors de la vérification des paiements existants:",
          existingPaymentError,
        );
      }

      // Insérer l'entrée dans la table payments seulement si elle n'existe pas déjà
      if (!existingPayment) {
        const { error: dbError } = await supabase.from("payments").insert({
          order_id: orderId,
          client_id: userId,
          freelance_id: freelanceIdentifier,
          amount: parseFloat(amount) / 100, // Convertir les centimes en unités pour le stockage
          status: "pending",
          payment_method: "stripe",
          payment_intent_id: paymentIntent.id,
        });

        if (dbError) {
          console.error(
            "Erreur détaillée lors de l'enregistrement du paiement:",
            {
              error: dbError,
              code: dbError.code,
              details: dbError.details,
              message: dbError.message,
            },
          );
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
      console.error("Erreur lors de la création du PaymentIntent:", error);

      return NextResponse.json(
        { error: error.message || "Erreur lors de la création du paiement" },
        { status: 500 },
      );
    }
  } catch (error: any) {
    console.error("Exception non gérée:", error);

    return NextResponse.json(
      { error: "Une erreur inattendue est survenue" },
      { status: 500 },
    );
  }
}
