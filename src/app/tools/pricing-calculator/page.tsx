"use client";

import React from "react";
import FreelancePricingCalculator from "@/components/calculators/FreelancePricingCalculator";

export default function PricingCalculatorPage() {
  return (
    <div className="min-h-screen bg-vynal-purple-dark">
      {/* En-tête décoratif */}
      <div className="absolute top-0 left-0 right-0 h-60 md:h-72 bg-gradient-to-b from-vynal-purple-dark to-vynal-purple-darkest -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/img/grid-pattern.svg')] bg-center opacity-10"></div>
        <div className="absolute -top-20 -right-20 w-60 md:w-96 h-60 md:h-96 bg-vynal-accent-secondary/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-20 -left-20 w-60 md:w-96 h-60 md:h-96 bg-vynal-accent-primary/20 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-4 py-8 md:py-16 relative">
        <div className="mb-8 md:mb-12 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-vynal-text-primary mb-4 md:mb-6 bg-clip-text text-transparent bg-gradient-to-r from-vynal-accent-primary to-vynal-accent-secondary">
            Calculateur de tarifs freelance
          </h1>
          <p className="mt-3 text-base md:text-lg text-vynal-text-secondary max-w-3xl mx-auto px-2">
            Utilisez notre outil interactif pour déterminer vos tarifs optimaux en fonction de votre expérience, votre secteur d'activité et votre localisation.
          </p>
        </div>

        <FreelancePricingCalculator defaultCurrency="XOF" />
      </div>
    </div>
  );
} 