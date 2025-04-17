"use client";

import Link from "next/link";
import { Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";

const footerLinks = [
  {
    title: "Services",
    links: [
      { name: "Développement Web & Mobile", href: "/services?category=developpement-web-mobile" },
      { name: "Design Graphique", href: "/services?category=design-graphique" },
      { name: "Marketing Digital", href: "/services?category=marketing-digital" },
      { name: "Rédaction & Traduction", href: "/services?category=redaction-traduction" },
      { name: "Vidéo & Audio", href: "/services?category=video-audio" },
      { name: "Informatique & Réseaux", href: "/services?category=informatique-reseaux" },
      { name: "Tous les services", href: "/services" },
    ],
  },
  {
    title: "Entreprise",
    links: [
      { name: "À propos", href: "/about" },
      { name: "Comment ça marche", href: "/how-it-works" },
      { name: "Carrières", href: "/careers" },
      { name: "Contact", href: "/contact" },
      { name: "FAQ", href: "/faq" },
    ],
  },
  {
    title: "Légal",
    links: [
      { name: "Conditions d'utilisation", href: "/terms-of-service" },
      { name: "Politique de confidentialité", href: "/privacy-policy" },
      { name: "Code de conduite", href: "/code-of-conduct" },
      { name: "Protection des données", href: "/data-protection" },
    ],
  },
];

// Composant pour rendre les icônes sociales uniquement côté client
function SocialIcons() {
  // State pour vérifier si on est côté client
  const [mounted, setMounted] = useState(false);
  
  // Mettre mounted à true seulement côté client
  useEffect(() => {
    setMounted(true);
  }, []);
  
  if (!mounted) return null;
  
  return (
    <div className="mt-5 flex space-x-4">
      <a
        href="#"
        className="text-gray-400 hover:text-white dark:text-vynal-text-secondary dark:hover:text-vynal-accent-primary transition-colors"
      >
        <Facebook size={18} />
        <span className="sr-only">Facebook</span>
      </a>
      <a
        href="#"
        className="text-gray-400 hover:text-white dark:text-vynal-text-secondary dark:hover:text-vynal-accent-primary transition-colors"
      >
        <Twitter size={18} />
        <span className="sr-only">Twitter</span>
      </a>
      <a
        href="#"
        className="text-gray-400 hover:text-white dark:text-vynal-text-secondary dark:hover:text-vynal-accent-primary transition-colors"
      >
        <Instagram size={18} />
        <span className="sr-only">Instagram</span>
      </a>
      <a
        href="#"
        className="text-gray-400 hover:text-white dark:text-vynal-text-secondary dark:hover:text-vynal-accent-primary transition-colors"
      >
        <Linkedin size={18} />
        <span className="sr-only">LinkedIn</span>
      </a>
    </div>
  );
}

// Composant pour rendre les icônes de contact uniquement côté client
function ContactInfo() {
  // State pour vérifier si on est côté client
  const [mounted, setMounted] = useState(false);
  
  // Mettre mounted à true seulement côté client
  useEffect(() => {
    setMounted(true);
  }, []);
  
  if (!mounted) return null;
  
  return (
    <div className="flex flex-col md:flex-row md:space-x-8 space-y-4 md:space-y-0">
      <div className="flex items-center text-gray-400 dark:text-vynal-text-secondary">
        <Mail className="w-4 h-4 mr-2" />
        <a href="mailto:contact@vynalplatform.com" className="text-xs hover:text-white dark:hover:text-vynal-accent-primary transition-colors">
          contact@vynalplatform.com
        </a>
      </div>
    </div>
  );
}

// Composant pour le bouton de changement de thème
function ThemeToggleButton() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  // Mettre mounted à true seulement côté client
  useEffect(() => {
    setMounted(true);
  }, []);
  
  if (!mounted) return null;
  
  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };
  
  return (
    <button 
      onClick={toggleTheme}
      className="flex items-center gap-2 px-3 py-1 rounded-full bg-gray-800 hover:bg-gray-700 dark:bg-vynal-purple-secondary dark:hover:bg-vynal-accent-primary/80 transition-all group"
      aria-label="Changer de thème"
    >
      {theme === "dark" ? (
        <>
          <Sun className="w-3.5 h-3.5 text-yellow-400" />
          <span className="text-xs font-medium text-vynal-text-secondary group-hover:text-vynal-text-primary">Mode clair</span>
        </>
      ) : (
        <>
          <Moon className="w-3.5 h-3.5 text-vynal-accent-primary" />
          <span className="text-xs font-medium group-hover:text-white">Mode sombre</span>
        </>
      )}
    </button>
  );
}

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-white dark:bg-vynal-purple-dark border-t border-gray-800 dark:border-vynal-purple-secondary/30">
      <div className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {/* Logo et Description */}
          <div className="lg:col-span-2">
            <Link href="/">
              <img 
                src="/assets/logo/logo_vynal_platform_simple.webp" 
                alt="Vynal Platform Logo" 
                className="h-10 md:h-12 w-auto dark:brightness-110 transition-all duration-300" 
              />
            </Link>
            <p className="mt-3 text-xs text-gray-400 dark:text-vynal-text-secondary">
              La plateforme de mise en relation entre freelances et clients pour des projets réussis.
              Des services de qualité à prix fixe.
            </p>
            <SocialIcons />
          </div>

          {/* Liens de navigation */}
          {footerLinks.map((section) => (
            <div key={section.title}>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-white dark:text-vynal-text-primary">
                {section.title}
              </h3>
              <ul className="mt-3 space-y-1.5">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-xs text-gray-400 hover:text-white dark:text-vynal-text-secondary dark:hover:text-vynal-accent-primary transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-8 pt-6 border-t border-gray-800 dark:border-vynal-purple-secondary/30">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ContactInfo />
            <div className="flex items-center justify-between text-gray-400 dark:text-vynal-text-secondary md:text-right">
              <ThemeToggleButton />
              <span className="text-xs">&copy; {currentYear} Vynal Platform. Tous droits réservés.</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
} 