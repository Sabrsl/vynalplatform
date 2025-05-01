"use client";

import React, { memo } from "react";
import Link from "next/link";
import {
  TextRevealCard,
} from "../ui/text-reveal-card";

interface TextRevealSectionProps {
  eyebrow?: string;
  title?: string;
  description?: string;
  buttonText?: string;
  buttonLink?: string;
}

export const TextRevealSection = memo(({
  eyebrow = "Pour les clients",
  title = "Une idée à concrétiser ?", 
  revealText = "Laissez-nous tout prendre en main.",
  description,
  buttonText = "Nous contacter",
  buttonLink = "/contact"
}: TextRevealSectionProps & { revealText?: string }) => {
  return (
    <section className="py-24">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center justify-center">
          {eyebrow && (
            <p className="text-sm uppercase font-semibold mb-3 text-vynal-accent-secondary tracking-wider">
              {eyebrow}
            </p>
          )}
          
          <TextRevealCard
            text={title}
            revealText={revealText || description || ""}
          >
            <div className="mt-8 flex justify-center">
              <Link 
                href={buttonLink} 
                className="bg-vynal-accent-primary hover:bg-vynal-accent-secondary text-vynal-purple-dark py-3 px-8 rounded-md font-medium transition-all shadow-lg shadow-vynal-accent-primary/20"
              >
                {buttonText}
              </Link>
            </div>
          </TextRevealCard>
          
          {description && !revealText && (
            <p className="mt-6 text-vynal-text-secondary text-center max-w-2xl mx-auto">
              {description}
            </p>
          )}
        </div>
      </div>
    </section>
  );
});

TextRevealSection.displayName = 'TextRevealSection'; 