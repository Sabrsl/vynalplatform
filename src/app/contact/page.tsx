"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Check, Mail, Phone, MapPin } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { z } from 'zod';
import PageLayout from "@/components/ui/PageLayout";

const contactFormSchema = z.object({
  firstName: z.string().min(1, "Le prénom est requis").max(50),
  lastName: z.string().min(1, "Le nom est requis").max(50),
  email: z.string().email("L'email est invalide"),
  subject: z.string().min(1, "Le sujet est requis").max(100),
  message: z.string().min(10, "Le message doit contenir au moins 10 caractères").max(5000),
  acceptPolicy: z.boolean().refine(val => val === true, {
    message: "Vous devez accepter la politique de confidentialité"
  })
});

type ContactFormData = z.infer<typeof contactFormSchema>;

export default function ContactPage() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<ContactFormData>({
    firstName: '',
    lastName: '',
    email: '',
    subject: '',
    message: '',
    acceptPolicy: false
  });
  const [errors, setErrors] = useState<Partial<Record<keyof ContactFormData, string>>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Effacer l'erreur quand l'utilisateur corrige
    if (errors[name as keyof ContactFormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: checked }));
    
    // Effacer l'erreur quand l'utilisateur corrige
    if (errors[name as keyof ContactFormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Valider les données du formulaire
    try {
      contactFormSchema.parse(formData);
      setErrors({});
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Partial<Record<keyof ContactFormData, string>> = {};
        error.errors.forEach(err => {
          if (err.path[0]) {
            newErrors[err.path[0] as keyof ContactFormData] = err.message;
          }
        });
        setErrors(newErrors);
        return;
      }
    }
    
    // Envoyer les données
    try {
      setIsSubmitting(true);
      
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Une erreur est survenue');
      }
      
      // Réinitialiser le formulaire après succès
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        subject: '',
        message: '',
        acceptPolicy: false
      });
      
      toast({
        title: "Message envoyé",
        description: "Nous avons bien reçu votre message et reviendrons vers vous rapidement.",
        variant: "success",
      });
      
    } catch (error) {
      console.error("Erreur lors de l'envoi du message:", error);
      
      let errorMessage = "Une erreur est survenue lors de l'envoi du message";
      
      if (error instanceof Error) {
        // Personnaliser le message d'erreur selon le type d'erreur
        if (error.message.includes("conversation")) {
          errorMessage = "Une erreur technique est survenue lors de l'enregistrement de votre message";
        } else if (error.message.includes("message")) {
          errorMessage = "Une erreur est survenue lors de l'enregistrement de votre message";
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
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
        </div>
      </section>

      {/* Contact Form */}
      <section className="mb-6 md:mb-8">
        <div className="max-w-xl mx-auto px-4">
          <Card className="bg-white/25 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-700/30 rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
            <CardContent className="p-5 md:p-6">
              <form className="space-y-4 md:space-y-5" onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
                  <div>
                    <label htmlFor="firstName" className="block text-xs md:text-sm font-medium text-slate-800 dark:text-vynal-text-primary mb-1">
                      Prénom
                    </label>
                    <Input
                      type="text"
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      className={`h-8 md:h-10 text-sm bg-white/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/30 focus:border-vynal-accent-primary focus:ring-vynal-accent-primary/20 text-slate-800 dark:text-vynal-text-primary placeholder:text-slate-500 dark:placeholder:text-vynal-text-secondary/50 ${errors.firstName ? 'border-red-500' : ''}`}
                      placeholder="Votre prénom"
                    />
                    {errors.firstName && <p className="mt-1 text-xs text-red-500">{errors.firstName}</p>}
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-xs md:text-sm font-medium text-slate-800 dark:text-vynal-text-primary mb-1">
                      Nom
                    </label>
                    <Input
                      type="text"
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      className={`h-8 md:h-10 text-sm bg-white/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/30 focus:border-vynal-accent-primary focus:ring-vynal-accent-primary/20 text-slate-800 dark:text-vynal-text-primary placeholder:text-slate-500 dark:placeholder:text-vynal-text-secondary/50 ${errors.lastName ? 'border-red-500' : ''}`}
                      placeholder="Votre nom"
                    />
                    {errors.lastName && <p className="mt-1 text-xs text-red-500">{errors.lastName}</p>}
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="block text-xs md:text-sm font-medium text-slate-800 dark:text-vynal-text-primary mb-1">
                    Email
                  </label>
                  <Input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`h-8 md:h-10 text-sm bg-white/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/30 focus:border-vynal-accent-primary focus:ring-vynal-accent-primary/20 text-slate-800 dark:text-vynal-text-primary placeholder:text-slate-500 dark:placeholder:text-vynal-text-secondary/50 ${errors.email ? 'border-red-500' : ''}`}
                    placeholder="votre@email.com"
                  />
                  {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
                </div>

                <div>
                  <label htmlFor="subject" className="block text-xs md:text-sm font-medium text-slate-800 dark:text-vynal-text-primary mb-1">
                    Sujet
                  </label>
                  <select
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    className={`h-8 md:h-10 text-sm bg-white/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/30 focus:border-vynal-accent-primary focus:ring-vynal-accent-primary/20 rounded-md px-4 py-2 text-slate-800 dark:text-vynal-text-primary outline-none transition-colors ${errors.subject ? 'border-red-500' : ''}`}
                  >
                    <option value="" className="bg-white dark:bg-slate-800 text-slate-500 dark:text-vynal-text-secondary/70">Sélectionnez un sujet</option>
                    <option value="support" className="bg-white dark:bg-slate-800 text-slate-800 dark:text-vynal-text-primary">Support technique</option>
                    <option value="billing" className="bg-white dark:bg-slate-800 text-slate-800 dark:text-vynal-text-primary">Facturation</option>
                    <option value="partnership" className="bg-white dark:bg-slate-800 text-slate-800 dark:text-vynal-text-primary">Partenariat</option>
                    <option value="feedback" className="bg-white dark:bg-slate-800 text-slate-800 dark:text-vynal-text-primary">Feedback</option>
                    <option value="other" className="bg-white dark:bg-slate-800 text-slate-800 dark:text-vynal-text-primary">Autre</option>
                  </select>
                  {errors.subject && <p className="mt-1 text-xs text-red-500">{errors.subject}</p>}
                </div>

                <div>
                  <label htmlFor="message" className="block text-xs md:text-sm font-medium text-slate-800 dark:text-vynal-text-primary mb-1">
                    Message
                  </label>
                  <Textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    rows={6}
                    className={`h-16 md:h-20 text-sm bg-white/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/30 focus:border-vynal-accent-primary focus:ring-vynal-accent-primary/20 text-slate-800 dark:text-vynal-text-primary placeholder:text-slate-500 dark:placeholder:text-vynal-text-secondary/50 ${errors.message ? 'border-red-500' : ''}`}
                    placeholder="Détaillez votre message ici..."
                  />
                  {errors.message && <p className="mt-1 text-xs text-red-500">{errors.message}</p>}
                </div>

                <div className="flex items-center">
                  <input
                    id="acceptPolicy"
                    name="acceptPolicy"
                    type="checkbox"
                    checked={formData.acceptPolicy}
                    onChange={handleCheckboxChange}
                    className={`h-4 w-4 rounded border-slate-200 dark:border-slate-700/30 bg-white/50 dark:bg-slate-800/50 text-vynal-accent-primary focus:ring-vynal-accent-primary/20 ${errors.acceptPolicy ? 'border-red-500' : ''}`}
                  />
                  <label htmlFor="acceptPolicy" className="ml-2 text-xs text-slate-600 dark:text-vynal-text-secondary">
                    J'accepte la {' '}
                    <Link href="/privacy-policy" className="text-vynal-accent-primary hover:underline">
                      politique de confidentialité
                    </Link>
                  </label>
                </div>
                {errors.acceptPolicy && <p className="mt-1 text-xs text-red-500">{errors.acceptPolicy}</p>}

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-vynal-accent-primary hover:bg-vynal-accent-secondary text-white font-medium transition-all disabled:opacity-70"
                >
                  {isSubmitting ? 'Envoi en cours...' : 'Envoyer le message'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>
    </PageLayout>
  );
} 