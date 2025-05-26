// Types de base pour la validation
export type CardValidation = {
  cardNumber: RegExp;
  cardHolder: RegExp;
  expiryDate: RegExp;
  cvv: RegExp;
};

export type PayPalValidation = {
  email: RegExp;
};

export type MobileMoneyValidation = {
  phoneNumber: RegExp;
};

export type StripeWalletValidation = {
  // Pas de validation spécifique requise pour les portefeuilles Stripe
  available: boolean;
};

export type PaymentValidation =
  | CardValidation
  | PayPalValidation
  | MobileMoneyValidation
  | StripeWalletValidation;

export interface PaymentMethod {
  id: string;
  name: string;
  description: string;
  logo: string;
  validation: PaymentValidation;
}

// Méthodes de paiement disponibles
export const PAYMENT_METHODS = [
  {
    id: "card",
    name: "Carte bancaire",
    description: "Visa, Mastercard, CB",
    logo: "/assets/payment/cards.svg",
    validation: {
      cardNumber: /^\d{16}$/,
      cardHolder: /^[A-Z\s]{3,}$/,
      expiryDate: /^(0[1-9]|1[0-2])\/([0-9]{2})$/,
      cvv: /^\d{3,4}$/,
    } as CardValidation,
  },
  {
    id: "paypal",
    name: "PayPal",
    description: "Paiement sécurisé via PayPal",
    logo: "/assets/payment/paypal.svg",
    validation: {
      email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    } as PayPalValidation,
  },
  {
    id: "orange-money",
    name: "Orange Money",
    description: "Paiement mobile via Orange Money",
    logo: "/assets/payment/orange-money.svg",
    validation: {
      phoneNumber: /^7[0-9]{8}$/,
    } as MobileMoneyValidation,
  },
  {
    id: "free-money",
    name: "Free Money",
    description: "Paiement mobile via Free Money",
    logo: "/assets/payment/free-money.svg",
    validation: {
      phoneNumber: /^7[0-9]{8}$/,
    } as MobileMoneyValidation,
  },
  {
    id: "wave",
    name: "Wave",
    description: "Paiement mobile via Wave",
    logo: "/assets/payment/wave.svg",
    validation: {
      phoneNumber: /^7[0-9]{8}$/,
    } as MobileMoneyValidation,
  },
  {
    id: "apple-pay",
    name: "Apple Pay",
    description: "Paiement sécurisé via Apple Pay",
    logo: "/images/payment/applepay.png",
    validation: {
      available: true,
    } as StripeWalletValidation,
  },
  {
    id: "google-pay",
    name: "Google Pay",
    description: "Paiement sécurisé via Google Pay",
    logo: "/images/payment/googlepaylogo.png",
    validation: {
      available: true,
    } as StripeWalletValidation,
  },
  {
    id: "link",
    name: "Stripe Link",
    description: "Paiement rapide via Stripe Link",
    logo: "/images/payment/linklogo.png",
    validation: {
      available: true,
    } as StripeWalletValidation,
  },
] as const;

// Type dérivé des méthodes de paiement
export type PaymentMethodType = (typeof PAYMENT_METHODS)[number]["id"];

// Interface pour les données de paiement
export interface PaymentData {
  cardNumber: string;
  cardHolder: string;
  expiryDate: string;
  cvv: string;
  paypalEmail: string;
  phoneNumber: string;
  mobileOperator: "orange-money" | "free-money" | "wave";
}

// Fonction de validation centralisée
export function validatePaymentData(
  method: PaymentMethodType,
  data: PaymentData,
): string | null {
  const paymentMethod = PAYMENT_METHODS.find((m) => m.id === method);
  if (!paymentMethod) return "Méthode de paiement invalide";

  switch (method) {
    case "card": {
      const validation = paymentMethod.validation as CardValidation;
      if (
        !data.cardNumber ||
        !validation.cardNumber.test(data.cardNumber.replace(/\s/g, ""))
      ) {
        return "Numéro de carte invalide";
      }
      if (!data.cardHolder || !validation.cardHolder.test(data.cardHolder)) {
        return "Nom du titulaire invalide";
      }
      if (!data.expiryDate || !validation.expiryDate.test(data.expiryDate)) {
        return "Date d'expiration invalide";
      }
      if (!data.cvv || !validation.cvv.test(data.cvv)) {
        return "Code de sécurité invalide";
      }
      break;
    }
    case "paypal": {
      const validation = paymentMethod.validation as PayPalValidation;
      if (!data.paypalEmail || !validation.email.test(data.paypalEmail)) {
        return "Email PayPal invalide";
      }
      break;
    }
    case "orange-money":
    case "free-money":
    case "wave": {
      const validation = paymentMethod.validation as MobileMoneyValidation;
      if (
        !data.phoneNumber ||
        !validation.phoneNumber.test(data.phoneNumber.replace(/\s/g, ""))
      ) {
        return "Numéro de téléphone invalide";
      }
      if (!data.mobileOperator) {
        return "Opérateur mobile non sélectionné";
      }
      break;
    }
    case "apple-pay":
    case "google-pay":
    case "link": {
      // Les portefeuilles Stripe gèrent leur propre validation
      // Pas de validation côté client requise
      break;
    }
  }

  return null;
}

// Frais de retrait par méthode
export const WITHDRAWAL_FEES = {
  wave: "1%",
  "orange-money": "1.5%",
  "free-money": "1.5%",
} as const;

// Délais de traitement par méthode
export const WITHDRAWAL_PROCESSING_TIMES = {
  wave: "Sous 24h",
  "orange-money": "Instantané",
  "free-money": "Instantané",
} as const;

// Fonction pour générer les méthodes de retrait
export function getWithdrawalMethods() {
  return PAYMENT_METHODS.filter((method) =>
    ["orange-money", "free-money", "wave"].includes(method.id),
  ).map((method) => ({
    ...method,
    fee: WITHDRAWAL_FEES[method.id as keyof typeof WITHDRAWAL_FEES],
    processing_time:
      WITHDRAWAL_PROCESSING_TIMES[
        method.id as keyof typeof WITHDRAWAL_PROCESSING_TIMES
      ],
  }));
}
