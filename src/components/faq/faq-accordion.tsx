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
        className="w-full flex justify-between items-center py-6 px-4 hover:bg-vynal-purple-secondary/10 transition-colors focus:outline-none"
        onClick={() => toggleOpen(index)}
      >
        <h3 className="text-lg font-medium text-vynal-text-primary text-left">{question}</h3>
        <span className="text-vynal-accent-primary">
          {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </span>
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ${
          isOpen ? "max-h-96 py-4 px-6" : "max-h-0"
        }`}
      >
        <p className="text-vynal-text-secondary">{answer}</p>
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