import { PaymentMethod, PAYMENT_METHODS, getWithdrawalMethods } from "@/lib/constants/payment";

export const MOCK_WALLET = {
  balance: 875.50,
  pending: 350.00,
  fee_percentage: 5,
  min_withdrawal: 2000,
  saved_methods: [
    {
      id: "bank-1",
      type: "bank",
      name: "Compte bancaire principal",
      details: "BNP Paribas ****1234",
      is_default: true
    }
  ]
};

// Utiliser les méthodes de paiement centralisées pour les tests
export const MOCK_PAYMENT_METHODS = [...PAYMENT_METHODS] as PaymentMethod[];

// Utiliser la fonction pour générer les méthodes de retrait
export const MOCK_WITHDRAWAL_METHODS = getWithdrawalMethods(); 