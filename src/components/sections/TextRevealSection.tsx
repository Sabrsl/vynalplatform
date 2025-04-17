"use client";

import React from "react";
import Link from "next/link";
import {
  TextRevealCard,
} from "../ui/text-reveal-card";

export function TextRevealSection() {
  return (
    <section className="py-24">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center justify-center">
          <TextRevealCard
            text="Une idée à concrétiser ?"
            revealText="Laissez-nous tout prendre en main."
          >
            <div className="mt-8 flex justify-center">
              <Link 
                href="/contact" 
                className="bg-vynal-accent-primary hover:bg-vynal-accent-secondary text-vynal-purple-dark py-3 px-8 rounded-md font-medium transition-all shadow-lg shadow-vynal-accent-primary/20"
              >
                Nous contacter
              </Link>
            </div>
          </TextRevealCard>
        </div>
      </div>
    </section>
  );
} 