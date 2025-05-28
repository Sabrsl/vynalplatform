/**
 * Gestion du paiement Stripe avec gestion améliorée des erreurs
 * Ce script résout le problème de double confirmation des paiements
 */

// Fonction d'affichage d'erreur (utilisée dans la fonction principale)
function showError(message) {
  const errorElement = document.getElementById("stripe-error-message");
  if (errorElement) {
    errorElement.textContent = message;
    errorElement.style.display = "block";
  } else {
    console.error("Erreur de paiement:", message);
    alert("Erreur de paiement: " + message);
  }
}

/**
 * Fonction principale de soumission du formulaire Stripe
 *
 * Cette fonction implémente une gestion robuste des paiements avec:
 * 1. Gestion des paiements déjà confirmés par le webhook
 * 2. Utilisation de la redirection conditionnelle
 * 3. Vérification via manual-webhook
 */
window.submitStripeForm = async function (stripe, elements) {
  try {
    console.log("Début de la procédure de paiement améliorée...");

    // Extraire l'ID du service de l'URL
    const serviceIdMatch = window.location.pathname.match(/\/order\/([^\/]+)/);
    const serviceId = serviceIdMatch ? serviceIdMatch[1] : null;

    if (!serviceId) {
      showError("Impossible de déterminer l'ID du service");
      return;
    }

    // Récupérer le clientSecret
    const paymentForm = document.getElementById("stripe-payment-form");
    if (!paymentForm) {
      showError("Formulaire de paiement non trouvé");
      return;
    }

    const clientSecret = paymentForm.getAttribute("data-client-secret");
    if (!clientSecret) {
      showError("Client secret non trouvé dans le formulaire");
      return;
    }

    console.log("Client secret trouvé, vérification du statut du paiement...");

    // Vérifier d'abord le statut du PaymentIntent
    try {
      const paymentIntentResult =
        await stripe.retrievePaymentIntent(clientSecret);
      const { paymentIntent } = paymentIntentResult;

      // Si le paiement est déjà traité, nous pouvons rediriger immédiatement
      if (
        paymentIntent &&
        (paymentIntent.status === "succeeded" ||
          paymentIntent.status === "processing")
      ) {
        console.log(
          `PaymentIntent déjà ${paymentIntent.status}, vérification avec manual-webhook...`,
        );

        // Vérifier avec manual-webhook pour s'assurer que tout est enregistré
        try {
          const webhookResponse = await fetch("/api/stripe/manual-webhook", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ paymentIntentId: paymentIntent.id }),
          });

          // Ignorer le résultat, nous redirigeons quand même
        } catch (webhookError) {
          console.warn(
            "Erreur lors de l'appel au webhook manuel, mais le paiement semble traité:",
            webhookError,
          );
        }

        // Rediriger vers la page de résumé de commande
        console.log("Redirection vers la page de résumé...");
        window.location.href = `/order/${serviceId}/summary`;
        return;
      }

      console.log(
        `PaymentIntent actuel en état: ${paymentIntent ? paymentIntent.status : "inconnu"}`,
      );
    } catch (retrieveError) {
      console.warn(
        "Erreur lors de la vérification du statut du PaymentIntent:",
        retrieveError,
      );
      // Continuer avec la confirmation même en cas d'erreur de vérification
    }

    // Au lieu de tenter de confirmer directement, déclenchons le formulaire Stripe existant
    console.log("Déclenchement du formulaire Stripe existant...");

    if (paymentForm) {
      // Chercher le bouton caché de soumission
      const hiddenSubmitButton = document.getElementById(
        "stripe-hidden-submit",
      );
      if (hiddenSubmitButton) {
        console.log("Bouton caché trouvé, déclenchement du clic...");
        hiddenSubmitButton.click();
      } else {
        console.log("Soumission du formulaire via dispatchEvent...");
        paymentForm.dispatchEvent(
          new Event("submit", { bubbles: true, cancelable: true }),
        );
      }
    } else {
      showError("Formulaire de paiement non trouvé");
    }
  } catch (error) {
    console.error("Erreur critique dans submitStripeForm:", error);
    showError(error.message || "Une erreur inattendue s'est produite");
  }
};
