"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { z } from "zod";
import * as Dialog from "@radix-ui/react-dialog";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, X } from "lucide-react";

// Schéma de validation pour le formulaire
const contactFormSchema = z.object({
  firstName: z.string().min(1, "Le prénom est requis").max(50),
  lastName: z.string().min(1, "Le nom est requis").max(50),
  email: z.string().email("L'email est invalide"),
  subject: z.string().min(1, "Le sujet est requis").max(100),
  message: z
    .string()
    .min(10, "Le message doit contenir au moins 10 caractères")
    .max(5000),
});

type ContactFormData = z.infer<typeof contactFormSchema>;

export default function ContactForm() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<ContactFormData>({
    firstName: "",
    lastName: "",
    email: "",
    subject: "",
    message: "",
  });
  const [errors, setErrors] = useState<
    Partial<Record<keyof ContactFormData, string>>
  >({});
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [ticketId, setTicketId] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Effacer l'erreur quand l'utilisateur corrige
    if (errors[name as keyof ContactFormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
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
        error.errors.forEach((err) => {
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

      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Une erreur est survenue");
      }

      // Réinitialiser le formulaire après succès
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        subject: "",
        message: "",
      });

      // Stocker le ticket ID et afficher le modal de confirmation
      if (data.ticketId) {
        setTicketId(data.ticketId);
        setShowConfirmationModal(true);
      } else {
        // Fallback si pas de ticketId
        toast({
          title: "Message envoyé",
          description:
            "Nous avons bien reçu votre message et reviendrons vers vous rapidement.",
          variant: "success",
        });
      }
    } catch (error) {
      console.error("Erreur lors de l'envoi du message:", error);

      let errorMessage = "Une erreur est survenue lors de l'envoi du message";

      if (error instanceof Error) {
        // Personnaliser le message d'erreur selon le type d'erreur
        if (error.message.includes("conversation")) {
          errorMessage =
            "Une erreur technique est survenue lors de l'enregistrement de votre message";
        } else if (error.message.includes("message")) {
          errorMessage =
            "Une erreur est survenue lors de l'enregistrement de votre message";
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
    <>
      <Card className="bg-white/25 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-700/30 rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
        <CardContent className="p-5 md:p-6">
          <form className="space-y-4 md:space-y-5" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
              <div>
                <label
                  htmlFor="firstName"
                  className="block text-xs md:text-sm font-medium text-slate-800 dark:text-vynal-text-primary mb-1"
                >
                  Prénom
                </label>
                <Input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className={`h-8 md:h-10 text-sm bg-white/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/30 focus:border-vynal-accent-primary focus:ring-vynal-accent-primary/20 text-slate-800 dark:text-vynal-text-primary placeholder:text-slate-500 dark:placeholder:text-vynal-text-secondary/50 ${errors.firstName ? "border-red-500" : ""}`}
                  placeholder="Votre prénom"
                />
                {errors.firstName && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors.firstName}
                  </p>
                )}
              </div>
              <div>
                <label
                  htmlFor="lastName"
                  className="block text-xs md:text-sm font-medium text-slate-800 dark:text-vynal-text-primary mb-1"
                >
                  Nom
                </label>
                <Input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className={`h-8 md:h-10 text-sm bg-white/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/30 focus:border-vynal-accent-primary focus:ring-vynal-accent-primary/20 text-slate-800 dark:text-vynal-text-primary placeholder:text-slate-500 dark:placeholder:text-vynal-text-secondary/50 ${errors.lastName ? "border-red-500" : ""}`}
                  placeholder="Votre nom"
                />
                {errors.lastName && (
                  <p className="mt-1 text-xs text-red-500">{errors.lastName}</p>
                )}
              </div>
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-xs md:text-sm font-medium text-slate-800 dark:text-vynal-text-primary mb-1"
              >
                Email
              </label>
              <Input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`h-8 md:h-10 text-sm bg-white/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/30 focus:border-vynal-accent-primary focus:ring-vynal-accent-primary/20 text-slate-800 dark:text-vynal-text-primary placeholder:text-slate-500 dark:placeholder:text-vynal-text-secondary/50 ${errors.email ? "border-red-500" : ""}`}
                placeholder="votre@email.com"
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-500">{errors.email}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="subject"
                className="block text-xs md:text-sm font-medium text-slate-800 dark:text-vynal-text-primary mb-1"
              >
                Sujet
              </label>
              <select
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                className={`h-8 md:h-10 text-sm bg-white/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/30 focus:border-vynal-accent-primary focus:ring-vynal-accent-primary/20 rounded-md px-4 py-2 text-slate-800 dark:text-vynal-text-primary outline-none transition-colors ${errors.subject ? "border-red-500" : ""}`}
              >
                <option
                  value=""
                  className="bg-white dark:bg-slate-800 text-slate-500 dark:text-vynal-text-secondary/70"
                >
                  Sélectionnez un sujet
                </option>
                <option
                  value="support"
                  className="bg-white dark:bg-slate-800 text-slate-800 dark:text-vynal-text-primary"
                >
                  Support technique
                </option>
                <option
                  value="billing"
                  className="bg-white dark:bg-slate-800 text-slate-800 dark:text-vynal-text-primary"
                >
                  Facturation
                </option>
                <option
                  value="partnership"
                  className="bg-white dark:bg-slate-800 text-slate-800 dark:text-vynal-text-primary"
                >
                  Partenariat
                </option>
                <option
                  value="feedback"
                  className="bg-white dark:bg-slate-800 text-slate-800 dark:text-vynal-text-primary"
                >
                  Feedback
                </option>
                <option
                  value="other"
                  className="bg-white dark:bg-slate-800 text-slate-800 dark:text-vynal-text-primary"
                >
                  Autre
                </option>
              </select>
              {errors.subject && (
                <p className="mt-1 text-xs text-red-500">{errors.subject}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="message"
                className="block text-xs md:text-sm font-medium text-slate-800 dark:text-vynal-text-primary mb-1"
              >
                Message
              </label>
              <Textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                rows={6}
                className={`h-16 md:h-20 text-sm bg-white/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/30 focus:border-vynal-accent-primary focus:ring-vynal-accent-primary/20 text-slate-800 dark:text-vynal-text-primary placeholder:text-slate-500 dark:placeholder:text-vynal-text-secondary/50 ${errors.message ? "border-red-500" : ""}`}
                placeholder="Détaillez votre message ici..."
              />
              {errors.message && (
                <p className="mt-1 text-xs text-red-500">{errors.message}</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-vynal-accent-primary hover:bg-vynal-accent-secondary text-white font-medium transition-all disabled:opacity-70"
            >
              {isSubmitting ? "Envoi en cours..." : "Envoyer le message"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Modal de confirmation avec le numéro de ticket utilisant Radix UI directement */}
      <Dialog.Root
        open={showConfirmationModal}
        onOpenChange={setShowConfirmationModal}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-slate-900 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700/30 max-w-md w-[90vw] max-h-[85vh] p-6 z-50">
            <div className="flex justify-between items-start mb-4">
              <Dialog.Title className="flex items-center gap-2 text-vynal-accent-primary font-medium text-lg">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Message envoyé avec succès
              </Dialog.Title>
              <Dialog.Close asChild>
                <button className="inline-flex h-6 w-6 appearance-none items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none">
                  <X className="h-4 w-4" />
                </button>
              </Dialog.Close>
            </div>

            <Dialog.Description className="text-sm text-slate-600 dark:text-vynal-text-secondary mb-4">
              Votre message a bien été reçu et sera traité prochainement.
            </Dialog.Description>

            <div className="space-y-4 py-4">
              <div className="bg-slate-100/50 dark:bg-slate-800/50 p-4 rounded-lg text-center">
                <p className="text-sm font-medium text-slate-700 dark:text-vynal-text-secondary mb-2 text-xs sm:text-sm">
                  Votre numéro de ticket:
                </p>
                <button
                  onClick={() => {
                    if (ticketId) {
                      navigator.clipboard.writeText(ticketId);
                      toast({
                        title: "Copié !",
                        description:
                          "Le numéro de ticket a été copié dans le presse-papiers",
                        variant: "success",
                      });
                    }
                  }}
                  className="inline-block cursor-pointer hover:opacity-90 transition-opacity relative group"
                  aria-label="Cliquer pour copier"
                  title="Cliquer pour copier"
                >
                  <Badge
                    variant="outline"
                    className="text-base sm:text-lg font-mono font-semibold bg-vynal-accent-primary/10 text-vynal-accent-primary border-vynal-accent-primary/20 py-2 sm:py-3 px-3 sm:px-4"
                  >
                    {ticketId}
                    <span className="ml-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                      📋
                    </span>
                  </Badge>
                  <span className="absolute inset-0 flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 bg-slate-800/70 text-white rounded transition-opacity">
                    Cliquer pour copier
                  </span>
                </button>
                <p className="mt-3 text-xs text-slate-600 dark:text-vynal-text-secondary text-[10px] sm:text-xs">
                  Conservez ce numéro de référence pour suivre votre demande.
                </p>
              </div>

              <div className="text-sm text-slate-700 dark:text-vynal-text-secondary text-xs sm:text-sm">
                <p>
                  Un email de confirmation a également été envoyé à votre
                  adresse email avec toutes les informations.
                </p>
                <p className="mt-2 font-medium">
                  Pour tout suivi ultérieur, veuillez mentionner ce numéro de
                  ticket.
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <Button
                onClick={() => setShowConfirmationModal(false)}
                className="w-full bg-vynal-accent-primary hover:bg-vynal-accent-secondary text-white"
              >
                Compris
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
