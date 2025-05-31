import { Metadata } from 'next';
import Link from 'next/link';
import Script from 'next/script';
import { Card, CardContent } from "@/components/ui/card";
import { Mail, Phone, MapPin } from "lucide-react";
import PageLayout from "@/components/ui/PageLayout";
import ContactForm from "@/components/contact/ContactForm";

// Métadonnées pour le SEO
export const metadata: Metadata = {
  title: "Contact | Vynal Platform",
  description: "Contactez l'équipe Vynal pour toute question, suggestion ou besoin d'assistance. Notre équipe est là pour vous aider et répondre à vos demandes.",
};

// Configuration de mise en cache pour cette page statique
export const dynamic = 'force-static';
export const revalidate = 2592000; // 30 jours en secondes

export default function ContactPage() {
  // Définition des données structurées JSON-LD pour la page de contact
  const contactJsonLd = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    "name": "Contact Vynal Platform",
    "description": "Contactez l'équipe Vynal pour toute question, suggestion ou besoin d'assistance.",
    "url": "https://vynalplatform.com/contact",
    "mainEntity": {
      "@type": "Organization",
      "name": "Vynal Platform",
      "url": "https://vynalplatform.com",
      "email": "support@vynalplatform.com",
      "description": "La première marketplace de services numériques en Afrique",
      "contactPoint": {
        "@type": "ContactPoint",
        "contactType": "customer support",
        "email": "support@vynalplatform.com",
        "availableLanguage": ["French"]
      }
    }
  };

  return (
    <>
      <Script
        id="contact-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(contactJsonLd)
        }}
      />
      <PageLayout 
        fullGradient={false}
        withPadding={true}
        title="Contact | Vynal Platform"
        wrapperClassName="bg-white dark:bg-vynal-purple-dark/10"
      >
        {/* Hero Section */}
        <section className="py-6 md:py-8 lg:py-10 mb-6 md:mb-8">
          <div className="max-w-4xl mx-auto text-center px-4">
            <h1 className="text-3xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-3 md:mb-4 bg-gradient-to-r from-vynal-accent-primary to-vynal-accent-secondary bg-clip-text text-transparent">
              Contactez-nous
            </h1>
            <p className="text-xs sm:text-base md:text-lg text-slate-600 dark:text-vynal-text-secondary mb-5 md:mb-6 max-w-2xl mx-auto">
              Une question, une suggestion ou besoin d'assistance ? Notre équipe est là pour vous aider.
            </p>
            <div className="inline-flex items-center justify-center text-sm text-vynal-accent-primary">
              <Mail className="h-4 w-4 mr-2" />
              <span>support@vynalplatform.com</span>
            </div>
          </div>
        </section>

        {/* Contact Form */}
        <section className="mb-6 md:mb-8">
          <div className="max-w-xl mx-auto px-4">
            <ContactForm />
          </div>
        </section>
      </PageLayout>
    </>
  );
} 