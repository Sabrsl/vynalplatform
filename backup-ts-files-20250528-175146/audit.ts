/**
 * Utilitaire pour journaliser les événements de sécurité liés aux paiements
 *
 * Ce module permet de consigner les événements importants pour la sécurité
 * et l'audit des paiements dans la base de données Supabase.
 */
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { createClient } from "@supabase/supabase-js";

export type SecurityEventType =
  | "login_attempt"
  | "login_success"
  | "login_failure"
  | "payment_attempt"
  | "payment_success"
  | "payment_failure"
  | "payment_intent_created"
  | "payment_intent_error"
  | "payment_refunded"
  | "stripe_webhook_invalid_signature"
  | "stripe_webhook_processing_error"
  | "paypal_order_attempt"
  | "paypal_order_created"
  | "paypal_order_error"
  | "paypal_order_success"
  | "paypal_order_failure"
  | "sensitive_data_access"
  | "security_violation";

export type SecuritySeverity = "low" | "medium" | "high" | "critical" | "info";

export interface SecurityEvent {
  type: SecurityEventType;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
  details: Record<string, any>;
  severity: SecuritySeverity;
}

// Déterminer si nous sommes sur le serveur ou le client
const isServer = typeof window === "undefined";

// Variable pour suivre si la table security_events existe
let securityEventsTableExists: boolean | null = null;

/**
 * Vérifie si la table security_events existe dans la base de données
 * Cette fonction met en cache le résultat pour éviter des requêtes répétées
 */
async function checkSecurityEventsTableExists(supabase: any): Promise<boolean> {
  // Si on a déjà vérifié, retourner le résultat mis en cache
  if (securityEventsTableExists !== null) {
    return securityEventsTableExists;
  }

  try {
    // Tenter de récupérer une seule ligne pour vérifier si la table existe
    const { data, error } = await supabase
      .from("security_events")
      .select("id")
      .limit(1);

    // Si pas d'erreur, la table existe
    securityEventsTableExists = !error;
    return securityEventsTableExists;
  } catch (e) {
    // En cas d'erreur, supposer que la table n'existe pas
    console.warn(
      "Impossible de vérifier si la table security_events existe:",
      e,
    );
    securityEventsTableExists = false;
    return false;
  }
}

/**
 * Log un événement de sécurité dans la base de données
 *
 * @param event Événement à logger (sans timestamp)
 * @returns Promesse void
 */
export async function logSecurityEvent(
  event: Omit<SecurityEvent, "timestamp">,
): Promise<void> {
  try {
    const securityEvent: SecurityEvent = {
      ...event,
      timestamp: new Date(),
    };

    // Afficher dans la console en mode développement (pour déboguer)
    if (process.env.NODE_ENV === "development") {
      console.log("Événement de sécurité:", securityEvent);
    }

    // La table security_events est optionnelle, donc aucun problème si elle n'existe pas
    if (isServer) {
      // Pour le test de paiement, on n'a pas besoin de journaliser, on peut ignorer
      if (
        event.type === "payment_attempt" ||
        event.type === "payment_intent_created" ||
        event.type === "payment_success"
      ) {
        return;
      }

      // Pour les erreurs importantes, afficher quand même dans la console
      if (event.severity === "high" || event.severity === "critical") {
        console.warn("ALERTE DE SÉCURITÉ :", event);
      }
    } else {
      // Côté client, utiliser le client avec authentification
      const supabase = createClientComponentClient();

      try {
        // Vérifier d'abord si la table existe pour éviter des erreurs inutiles
        const tableExists = await checkSecurityEventsTableExists(supabase);
        if (!tableExists) {
          console.log(
            "La table security_events n'existe pas, l'événement sera uniquement journalisé en console",
          );
          return;
        }

        // Préparer les données selon le schéma exact de la table security_events
        // Vérifier que le type de l'événement est l'une des valeurs autorisées
        const sanitizedEvent = {
          // Champs requis
          type: String(securityEvent.type), // Convertir en string pour éviter les erreurs
          severity: String(securityEvent.severity), // Convertir en string pour éviter les erreurs

          // Champs optionnels (peuvent être null)
          user_id: securityEvent.userId || null,
          ip_address: securityEvent.ipAddress || null,
          user_agent: securityEvent.userAgent || null,

          // Le timestamp est généré automatiquement par défaut dans la BD si non fourni
          timestamp: securityEvent.timestamp,

          // Assurer que details est un objet JSON valide
          details:
            typeof securityEvent.details === "object"
              ? securityEvent.details
              : { raw_data: String(securityEvent.details || "") },
        };

        // Essayer d'insérer l'événement dans la base de données
        const { error } = await supabase
          .from("security_events")
          .insert(sanitizedEvent);

        if (error) {
          // Si l'insertion échoue, essayer de loguer l'erreur pour faciliter le débogage
          console.error(
            "Erreur lors de l'insertion de l'événement de sécurité:",
            {
              error_code: error.code,
              error_message: error.message,
              error_details: error.details,
              attempted_data: sanitizedEvent,
            },
          );

          // Si le problème est dû à une contrainte, essayer de le corriger
          if (error.code === "23502") {
            // violation de not-null constraint
            console.warn(
              "Tentative de correction de la contrainte not-null...",
            );
            const fixedEvent = {
              ...sanitizedEvent,
              // S'assurer que les champs required ont des valeurs par défaut
              type: sanitizedEvent.type || "unknown_event",
              severity: sanitizedEvent.severity || "info",
            };

            // Deuxième tentative avec les données corrigées
            const { error: retryError } = await supabase
              .from("security_events")
              .insert(fixedEvent);

            if (retryError) {
              console.error("Échec de la deuxième tentative:", retryError);
            }
          }
        }
      } catch (clientError) {
        // En développement uniquement, pour le débogage
        console.error("Erreur non gérée lors du logging:", clientError);
      }
    }

    // Si l'événement est critique, envoyer une alerte
    if (event.severity === "critical") {
      await sendSecurityAlert(securityEvent);
    }
  } catch (error) {
    // Uniquement en mode développement pour éviter les logs inutiles
    if (process.env.NODE_ENV === "development") {
      console.error("Erreur inattendue lors du logging de sécurité:", error);
    }
  }
}

/**
 * Envoie une alerte de sécurité pour les événements critiques
 *
 * @param event Événement de sécurité
 */
async function sendSecurityAlert(event: SecurityEvent): Promise<void> {
  try {
    // Enregistrement de l'alerte dans la base de données avec marquage spécial
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error(
        "ERREUR: Variables d'environnement Supabase manquantes pour les alertes",
      );
      return;
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Vérifier d'abord si la table existe
    const tableExists = await checkSecurityEventsTableExists(supabase);
    if (!tableExists) {
      console.warn(
        "La table security_events n'existe pas, impossible d'enregistrer l'alerte",
      );
      // Journaliser dans la console quand même
      console.error("⚠️ ALERTE DE SÉCURITÉ CRITIQUE ⚠️", {
        type: event.type,
        userId: event.userId,
        severity: event.severity,
        timestamp: event.timestamp,
        details: event.details,
      });
      return;
    }

    // Préparer l'alerte selon le schéma exact de la table security_events
    // Préfixer le type avec "alert_" pour différencier les alertes des événements normaux
    const alertData = {
      // Champs requis (NOT NULL dans le schéma)
      type: `alert_${event.type}`.substring(0, 255), // Limite pour éviter les erreurs
      severity: event.severity,

      // Champs optionnels (peuvent être null)
      user_id: event.userId || null,
      ip_address: event.ipAddress || null,
      user_agent: event.userAgent || null,
      timestamp: new Date(), // Utiliser la date actuelle

      // S'assurer que details est un objet JSON valide et contient toutes les infos nécessaires
      details: {
        alert_source: "security_monitoring",
        alert_timestamp: new Date().toISOString(),
        alert_status: "new",
        original_event_type: event.type,
        original_event_timestamp: event.timestamp.toISOString(),
        ...(typeof event.details === "object"
          ? event.details
          : { raw_details: String(event.details) }),
      },
    };

    // Insérer l'alerte dans la base de données
    const { error } = await supabase.from("security_events").insert(alertData);

    if (error) {
      console.error(
        "Échec de l'enregistrement de l'alerte dans la base de données:",
        {
          error_code: error.code,
          error_message: error.message,
          error_details: error.details,
        },
      );

      // Tentative de correction en cas d'erreur spécifique
      if (error.code === "23502" || error.code === "22P02") {
        // null value ou invalid input syntax
        console.warn("Tentative de correction des données d'alerte...");
        const fixedAlertData = {
          ...alertData,
          type: "alert_security_event", // Type générique en cas d'erreur
          details: JSON.stringify({
            error_recovery: true,
            original_event_summary: `${event.type} (${event.severity})`,
          }),
        };

        // Deuxième tentative avec les données corrigées
        await supabase.from("security_events").insert(fixedAlertData);
      }
    }

    // Journalisation dans la console pour suivi immédiat
    console.error("⚠️ ALERTE DE SÉCURITÉ CRITIQUE ⚠️", {
      type: event.type,
      userId: event.userId,
      severity: event.severity,
      timestamp: event.timestamp,
      details: event.details,
    });

    // Vérifier si nous avons une configuration d'email
    if (process.env.SECURITY_ALERT_EMAIL) {
      // Cette partie nécessiterait un service d'envoi d'email configuré
      // Exemple avec un service générique:
      try {
        // Simulation de l'envoi d'un email (à implémenter avec votre service d'email)
        console.log(
          `[SIMULÉ] Email d'alerte envoyé à ${process.env.SECURITY_ALERT_EMAIL}`,
        );
        // Implémentation à faire:
        // await sendEmail({
        //   to: process.env.SECURITY_ALERT_EMAIL,
        //   subject: `ALERTE SÉCURITÉ VYNAL: ${event.type}`,
        //   text: `Une alerte de sécurité critique a été détectée:\n\n${JSON.stringify(event, null, 2)}`
        // });
      } catch (emailError) {
        console.error("Échec de l'envoi de l'email d'alerte:", emailError);
      }
    }

    // Enregistrement des événements critiques dans un fichier journal spécial
    // (Option utile si vous avez besoin de tracer ces événements hors base de données)
    if (isServer) {
      try {
        // Exemple d'utilisation du système de journalisation de Node.js
        // Cette partie peut être adaptée selon votre infrastructure
        const alertLog = {
          timestamp: new Date().toISOString(),
          environment: process.env.NODE_ENV,
          event_type: event.type,
          severity: event.severity,
          user_id: event.userId,
          ip: event.ipAddress,
          details: event.details,
        };
        console.error("[SECURITY_ALERT]", JSON.stringify(alertLog));
      } catch (logError) {
        console.error("Échec de la journalisation de l'alerte:", logError);
      }
    }
  } catch (error) {
    // S'assurer que cette fonction ne génère jamais d'erreur non gérée
    console.error(
      "Erreur fatale lors du traitement de l'alerte de sécurité:",
      error,
    );
  }
}

/**
 * Récupère les événements de sécurité récents
 *
 * @param limit Nombre maximum d'événements à récupérer
 * @returns Liste des événements
 */
export async function getRecentSecurityEvents(
  limit: number = 100,
): Promise<SecurityEvent[]> {
  if (!isServer) {
    // Cette fonction ne devrait pas être appelée côté client
    return [];
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Variables d'environnement Supabase manquantes");
    return [];
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { data, error } = await supabase
      .from("security_events")
      .select("*")
      .order("timestamp", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Erreur lors de la récupération des événements:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error(
      "Erreur inattendue lors de la récupération des événements:",
      error,
    );
    return [];
  }
}

/**
 * Vérifie si une activité suspecte a été détectée
 *
 * @param userId ID de l'utilisateur
 * @param eventType Type d'événement
 * @returns true si l'activité est suspecte
 */
export async function isSuspiciousActivity(
  userId: string,
  eventType: SecurityEventType,
): Promise<boolean> {
  const supabase = createClientComponentClient();

  try {
    // Vérifier les tentatives de connexion échouées
    if (eventType === "login_failure") {
      const { count } = await supabase
        .from("security_events")
        .select("*", { count: "exact", head: true })
        .eq("userId", userId)
        .eq("type", "login_failure")
        .gte("timestamp", new Date(Date.now() - 15 * 60 * 1000).toISOString()); // 15 dernières minutes

      return (count || 0) > 5; // Plus de 5 tentatives en 15 minutes
    }

    // Vérifier les tentatives de paiement
    if (eventType === "payment_attempt") {
      const { count } = await supabase
        .from("security_events")
        .select("*", { count: "exact", head: true })
        .eq("userId", userId)
        .eq("type", "payment_attempt")
        .gte("timestamp", new Date(Date.now() - 5 * 60 * 1000).toISOString()); // 5 dernières minutes

      return (count || 0) > 3; // Plus de 3 tentatives en 5 minutes
    }

    return false;
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error(
        "Erreur lors de la vérification des activités suspectes:",
        error,
      );
    }
    return false;
  }
}

/**
 * Fonction simplifiée pour les routes Stripe (compatibilité avec ancien code)
 *
 * @param params Paramètres de l'événement
 * @returns Promesse void
 */
export async function logStripeEvent(params: {
  type: SecurityEventType;
  userId?: string;
  severity: SecuritySeverity;
  details: Record<string, any>;
}): Promise<void> {
  return logSecurityEvent({
    type: params.type,
    userId: params.userId,
    severity: params.severity,
    details: params.details,
  });
}
