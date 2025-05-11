/**
 * Types pour le chatbot d'accueil
 */

export type HowItWorksContent = {
  introduction: string;
  clientProcess: {
    title: string;
    steps: {
      title: string;
      description: string;
    }[];
  };
  freelanceProcess: {
    title: string;
    steps: {
      title: string;
      description: string;
    }[];
  };
  faq: {
    question: string;
    answer: string;
  }[];
  security: {
    title: string;
    features: string[];
  };
  paymentProcess: {
    title: string;
    description: string;
  };
}; 

export interface UseHowItWorksContentReturn {
  content: HowItWorksContent | null;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
} 