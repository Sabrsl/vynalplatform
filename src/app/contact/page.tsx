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
    <div className="min-h-screen bg-vynal-purple-dark py-12">
      {/* En-tête décoratif */}
      <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-vynal-purple-dark to-vynal-purple-darkest -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/img/grid-pattern.svg')] bg-center opacity-10"></div>
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-vynal-accent-secondary/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-vynal-accent-primary/20 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-4 relative">
        {/* Hero Section */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-vynal-text-primary">
            Contactez-nous
          </h1>
          <p className="mt-4 text-lg text-vynal-text-secondary max-w-2xl mx-auto">
            Une question, une suggestion ou besoin d'assistance ? Notre équipe est là pour vous aider.
          </p>
        </div>

        {/* Contact Form */}
        <Card className="max-w-2xl mx-auto bg-vynal-purple-dark/90 border-vynal-purple-secondary/30 rounded-xl shadow-lg shadow-vynal-accent-secondary/20 backdrop-blur-sm overflow-hidden">
          <CardContent className="p-8">
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-vynal-text-primary mb-1">
                    Prénom
                  </label>
                  <Input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    className={`bg-vynal-purple-secondary/10 border-vynal-purple-secondary/30 focus:border-vynal-accent-primary focus:ring-vynal-accent-primary/20 text-vynal-text-primary placeholder:text-vynal-text-secondary/50 ${errors.firstName ? 'border-red-500' : ''}`}
                    placeholder="Votre prénom"
                  />
                  {errors.firstName && <p className="mt-1 text-sm text-red-500">{errors.firstName}</p>}
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-vynal-text-primary mb-1">
                    Nom
                  </label>
                  <Input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    className={`bg-vynal-purple-secondary/10 border-vynal-purple-secondary/30 focus:border-vynal-accent-primary focus:ring-vynal-accent-primary/20 text-vynal-text-primary placeholder:text-vynal-text-secondary/50 ${errors.lastName ? 'border-red-500' : ''}`}
                    placeholder="Votre nom"
                  />
                  {errors.lastName && <p className="mt-1 text-sm text-red-500">{errors.lastName}</p>}
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-vynal-text-primary mb-1">
                  Email
                </label>
                <Input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`bg-vynal-purple-secondary/10 border-vynal-purple-secondary/30 focus:border-vynal-accent-primary focus:ring-vynal-accent-primary/20 text-vynal-text-primary placeholder:text-vynal-text-secondary/50 ${errors.email ? 'border-red-500' : ''}`}
                  placeholder="votre@email.com"
                />
                {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
              </div>

              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-vynal-text-primary mb-1">
                  Sujet
                </label>
                <select
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  className={`w-full bg-vynal-purple-secondary/10 border-vynal-purple-secondary/30 focus:border-vynal-accent-primary focus:ring-vynal-accent-primary/20 rounded-md px-4 py-2 text-vynal-text-primary outline-none transition-colors ${errors.subject ? 'border-red-500' : ''}`}
                >
                  <option value="" className="bg-vynal-purple-dark text-vynal-text-primary">Sélectionnez un sujet</option>
                  <option value="support" className="bg-vynal-purple-dark text-vynal-text-primary">Support technique</option>
                  <option value="billing" className="bg-vynal-purple-dark text-vynal-text-primary">Facturation</option>
                  <option value="partnership" className="bg-vynal-purple-dark text-vynal-text-primary">Partenariat</option>
                  <option value="feedback" className="bg-vynal-purple-dark text-vynal-text-primary">Feedback</option>
                  <option value="other" className="bg-vynal-purple-dark text-vynal-text-primary">Autre</option>
                </select>
                {errors.subject && <p className="mt-1 text-sm text-red-500">{errors.subject}</p>}
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-vynal-text-primary mb-1">
                  Message
                </label>
                <Textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows={6}
                  className={`bg-vynal-purple-secondary/10 border-vynal-purple-secondary/30 focus:border-vynal-accent-primary focus:ring-vynal-accent-primary/20 text-vynal-text-primary placeholder:text-vynal-text-secondary/50 ${errors.message ? 'border-red-500' : ''}`}
                  placeholder="Détaillez votre message ici..."
                />
                {errors.message && <p className="mt-1 text-sm text-red-500">{errors.message}</p>}
              </div>

              <div className="flex items-center">
                <input
                  id="acceptPolicy"
                  name="acceptPolicy"
                  type="checkbox"
                  checked={formData.acceptPolicy}
                  onChange={handleCheckboxChange}
                  className={`h-4 w-4 rounded border-vynal-purple-secondary/30 bg-vynal-purple-secondary/10 text-vynal-accent-primary focus:ring-vynal-accent-primary/20 ${errors.acceptPolicy ? 'border-red-500' : ''}`}
                />
                <label htmlFor="acceptPolicy" className="ml-2 text-sm text-vynal-text-secondary">
                  J'accepte la {' '}
                  <Link href="/privacy-policy" className="text-vynal-accent-primary hover:underline">
                    politique de confidentialité
                  </Link>
                </label>
              </div>
              {errors.acceptPolicy && <p className="mt-1 text-sm text-red-500">{errors.acceptPolicy}</p>}

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-vynal-accent-primary hover:bg-vynal-accent-secondary text-vynal-purple-dark font-medium transition-all disabled:opacity-70"
              >
                {isSubmitting ? 'Envoi en cours...' : 'Envoyer le message'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Additional Contact Info */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <Card className="bg-vynal-purple-dark/90 border-vynal-purple-secondary/30 rounded-xl shadow-lg shadow-vynal-accent-secondary/20 backdrop-blur-sm">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 mx-auto mb-4 flex items-center justify-center bg-vynal-purple-secondary/20 rounded-full border border-vynal-purple-secondary/30">
                <Mail className="h-6 w-6 text-vynal-accent-primary" />
              </div>
              <h3 className="text-xl font-semibold text-vynal-text-primary mb-2">Email</h3>
              <p className="text-vynal-text-secondary">support@vynal.com</p>
            </CardContent>
          </Card>

          <Card className="bg-vynal-purple-dark/90 border-vynal-purple-secondary/30 rounded-xl shadow-lg shadow-vynal-accent-secondary/20 backdrop-blur-sm">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 mx-auto mb-4 flex items-center justify-center bg-vynal-purple-secondary/20 rounded-full border border-vynal-purple-secondary/30">
                <Phone className="h-6 w-6 text-vynal-accent-primary" />
              </div>
              <h3 className="text-xl font-semibold text-vynal-text-primary mb-2">Téléphone</h3>
              <p className="text-vynal-text-secondary">+33 (0)1 23 45 67 89</p>
            </CardContent>
          </Card>

          <Card className="bg-vynal-purple-dark/90 border-vynal-purple-secondary/30 rounded-xl shadow-lg shadow-vynal-accent-secondary/20 backdrop-blur-sm">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 mx-auto mb-4 flex items-center justify-center bg-vynal-purple-secondary/20 rounded-full border border-vynal-purple-secondary/30">
                <MapPin className="h-6 w-6 text-vynal-accent-primary" />
              </div>
              <h3 className="text-xl font-semibold text-vynal-text-primary mb-2">Adresse</h3>
              <p className="text-vynal-text-secondary">123 Avenue des Champs-Élysées<br />75008 Paris, France</p>
            </CardContent>
          </Card>
        </div>

        {/* FAQ Section */}
        <div className="mt-16 max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8 text-vynal-text-primary">
            Questions fréquentes
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-vynal-purple-dark/90 border-vynal-purple-secondary/30 rounded-xl shadow-lg shadow-vynal-accent-secondary/20 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-vynal-purple-secondary/20 flex items-center justify-center border border-vynal-purple-secondary/30">
                    <Check className="h-4 w-4 text-vynal-accent-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-vynal-text-primary mb-2">Comment créer un compte ?</h3>
                    <p className="text-vynal-text-secondary">
                      Cliquez sur "S'inscrire" en haut à droite de la page, puis suivez les instructions pour créer votre compte client ou freelance.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-vynal-purple-dark/90 border-vynal-purple-secondary/30 rounded-xl shadow-lg shadow-vynal-accent-secondary/20 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-vynal-purple-secondary/20 flex items-center justify-center border border-vynal-purple-secondary/30">
                    <Check className="h-4 w-4 text-vynal-accent-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-vynal-text-primary mb-2">Comment poster un projet ?</h3>
                    <p className="text-vynal-text-secondary">
                      Connectez-vous à votre compte client, accédez à votre tableau de bord et cliquez sur "Nouveau projet". Remplissez ensuite le formulaire détaillé.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-vynal-purple-dark/90 border-vynal-purple-secondary/30 rounded-xl shadow-lg shadow-vynal-accent-secondary/20 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-vynal-purple-secondary/20 flex items-center justify-center border border-vynal-purple-secondary/30">
                    <Check className="h-4 w-4 text-vynal-accent-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-vynal-text-primary mb-2">Comment sont gérés les paiements ?</h3>
                    <p className="text-vynal-text-secondary">
                      Nous utilisons un système de paiement sécurisé avec un système d'escrow. Les fonds sont libérés au freelance une fois que le client a approuvé le travail.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-vynal-purple-dark/90 border-vynal-purple-secondary/30 rounded-xl shadow-lg shadow-vynal-accent-secondary/20 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-vynal-purple-secondary/20 flex items-center justify-center border border-vynal-purple-secondary/30">
                    <Check className="h-4 w-4 text-vynal-accent-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-vynal-text-primary mb-2">Quels sont les délais de réponse ?</h3>
                    <p className="text-vynal-text-secondary">
                      Notre équipe s'engage à répondre à toutes les demandes dans un délai de 24 à 48 heures ouvrables.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 