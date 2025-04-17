// Méthodes de paiement disponibles pour l'application
export const PAYMENT_METHODS = [
  {
    id: "card",
    name: "Carte bancaire",
    description: "Visa, Mastercard, CB",
    logo: "/assets/payment/cards.svg"
  },
  {
    id: "paypal",
    name: "PayPal",
    description: "Paiement sécurisé via PayPal",
    logo: "/assets/payment/paypal.svg"
  },
  {
    id: "orange-money",
    name: "Orange Money",
    description: "Paiement mobile via Orange Money",
    logo: "/assets/payment/orange-money.svg"
  },
  {
    id: "free-money",
    name: "Free Money",
    description: "Paiement mobile via Free Money",
    logo: "/assets/payment/free-money.svg"
  },
  {
    id: "wave",
    name: "Wave",
    description: "Paiement mobile via Wave",
    logo: "/assets/payment/wave.svg"
  }
]; 