"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

export interface FAQItem {
  question: string;
  answer: string;
}

interface FAQItemProps {
  question: string;
  answer: string;
  isOpen: boolean;
  toggleOpen: (index: number) => void;
  index: number;
}

interface FAQAccordionProps {
  items: FAQItem[];
}

// Composant pour un élément d'accordéon
const FAQItem = ({ question, answer, isOpen = false, toggleOpen, index }: FAQItemProps) => {
  return (
    <div className="border-b border-vynal-purple-secondary/30 last:border-b-0">
      <button
        className="w-full flex justify-between items-center py-2 md:py-3 px-3 hover:bg-vynal-purple-secondary/10 transition-colors focus:outline-none"
        onClick={() => toggleOpen(index)}
      >
        <h3 className="text-xs md:text-sm font-medium text-vynal-text-primary text-left">{question}</h3>
        <span className="text-vynal-accent-primary">
          {isOpen ? <ChevronUp size={14} className="md:w-4 md:h-4" /> : <ChevronDown size={14} className="md:w-4 md:h-4" />}
        </span>
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ${
          isOpen ? "max-h-96 py-2 md:py-3 px-3" : "max-h-0"
        }`}
      >
        <p className="text-[11px] md:text-sm text-vynal-text-secondary leading-relaxed">{answer}</p>
      </div>
    </div>
  );
};

// Composant principal d'accordéon
export function FAQAccordion({ items }: FAQAccordionProps) {
  const [openIndex, setOpenIndex] = useState(0);

  const toggleOpen = (index: number) => {
    setOpenIndex(openIndex === index ? -1 : index);
  };

  return (
    <div>
      {items.map((item, index) => (
        <FAQItem
          key={index}
          question={item.question}
          answer={item.answer}
          isOpen={openIndex === index}
          toggleOpen={toggleOpen}
          index={index}
        />
      ))}
    </div>
  );
} 