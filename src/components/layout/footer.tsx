"use client";

import React, { useState, useEffect, useCallback, memo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Facebook, Twitter, Instagram, Linkedin, Mail, Moon, Sun, ClipboardCopy, Check } from "lucide-react";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";

// Données du footer mémorisées en dehors du composant pour éviter les recréations inutiles
const FOOTER_LINKS = [
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
    ],
  },
];

const SOCIAL_LINKS = [
  { name: "Facebook", icon: Facebook, href: "#" },
  { name: "Twitter", icon: Twitter, href: "#" },
  { name: "Instagram", icon: Instagram, href: "#" },
  { name: "LinkedIn", icon: Linkedin, href: "#" },
];

const CONTACT_EMAIL = "support@vynalplatform.com";

// Composant pour les icônes sociales (mémorisé)
const SocialIcons = memo(() => {
  return (
    <motion.div 
      className="mt-5 flex space-x-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3, duration: 0.5 }}
    >
      {SOCIAL_LINKS.map((social) => (
        <motion.a
          key={social.name}
          href={social.href}
          className="text-gray-400 hover:text-white dark:text-vynal-text-secondary dark:hover:text-vynal-accent-primary transition-colors"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          aria-label={social.name}
        >
          <social.icon size={18} strokeWidth={2} />
          <span className="sr-only">{social.name}</span>
        </motion.a>
      ))}
    </motion.div>
  );
});

SocialIcons.displayName = 'SocialIcons';

// Composant pour les informations de contact (mémorisé)
const ContactInfo = memo(() => {
  const [isCopied, setIsCopied] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
  // Fonction optimisée pour copier l'email
  const copyToClipboard = useCallback(() => {
    navigator.clipboard.writeText(CONTACT_EMAIL).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  }, []);
  
  return (
    <div className="flex flex-col md:flex-row md:space-x-8 space-y-4 md:space-y-0">
      <div 
        className="flex items-center relative group"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <Mail className="w-4 h-4 mr-2 text-gray-400 dark:text-vynal-text-secondary" strokeWidth={2} />
        <a 
          href={`mailto:${CONTACT_EMAIL}`} 
          className="text-xs text-gray-400 dark:text-vynal-text-secondary hover:text-white dark:hover:text-vynal-accent-primary transition-colors"
        >
          {CONTACT_EMAIL}
        </a>
        <AnimatePresence>
          {(isHovered || isCopied) && (
            <motion.button
              onClick={copyToClipboard}
              className={`ml-2 px-1.5 py-0.5 text-[10px] rounded flex items-center gap-1 ${
                isCopied 
                  ? "bg-green-600/20 text-green-400 dark:bg-green-900/40 dark:text-green-400" 
                  : "bg-gray-700 text-gray-300 dark:bg-vynal-purple-secondary/40 dark:text-vynal-text-secondary hover:bg-gray-600 dark:hover:bg-vynal-purple-secondary/60"
              }`}
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.2 }}
            >
              {isCopied ? (
                <>
                  <Check className="h-3 w-3" /> 
                  <span>Copié !</span>
                </>
              ) : (
                <>
                  <ClipboardCopy className="h-3 w-3" /> 
                  <span>Copier</span>
                </>
              )}
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
});

ContactInfo.displayName = 'ContactInfo';

// Composant pour le bouton de changement de thème (mémorisé)
const ThemeToggleButton = memo(() => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  // S'assurer que le rendu se fait uniquement côté client
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Optimiser la fonction de changement de thème
  const toggleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [theme, setTheme]);
  
  if (!mounted) return null;
  
  return (
    <motion.button 
      onClick={toggleTheme}
      className="flex items-center gap-2 px-3 py-1 rounded-full bg-gray-800 hover:bg-gray-700 dark:bg-vynal-purple-secondary dark:hover:bg-vynal-accent-primary/80 transition-all group"
      aria-label="Changer de thème"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {theme === "dark" ? (
        <>
          <Sun className="w-3.5 h-3.5 text-yellow-400" strokeWidth={2.5} />
          <span className="text-xs font-medium text-vynal-text-secondary group-hover:text-vynal-text-primary">Mode clair</span>
        </>
      ) : (
        <>
          <Moon className="w-3.5 h-3.5 text-vynal-accent-primary" strokeWidth={2.5} />
          <span className="text-xs font-medium group-hover:text-white">Mode sombre</span>
        </>
      )}
    </motion.button>
  );
});

ThemeToggleButton.displayName = 'ThemeToggleButton';

// Composant pour un groupe de liens (mémorisé)
const LinkGroup = memo(({ section }: { section: typeof FOOTER_LINKS[0] }) => {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-white dark:text-vynal-text-primary">
        {section.title}
      </h3>
      <motion.ul 
        className="mt-3 space-y-1.5"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { staggerChildren: 0.05 } }}
      >
        {section.links.map((link, index) => (
          <motion.li 
            key={link.name}
            initial={{ opacity: 0, x: -5 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.03 }}
          >
            <Link
              href={link.href}
              className="text-xs text-gray-400 hover:text-white dark:text-vynal-text-secondary dark:hover:text-vynal-accent-primary transition-colors block py-1"
            >
              {link.name}
            </Link>
          </motion.li>
        ))}
      </motion.ul>
    </div>
  );
});

LinkGroup.displayName = 'LinkGroup';

// Composant principal du footer
function Footer() {
  const [mounted, setMounted] = useState(false);
  const currentYear = new Date().getFullYear();
  
  // S'assurer que le rendu se fait uniquement côté client
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Éviter tout flash de contenu non stylisé
  if (!mounted) {
    return <footer className="h-64 md:h-80 bg-gray-900 dark:bg-vynal-purple-dark border-t border-gray-800 dark:border-vynal-purple-secondary/30" />;
  }

  return (
    <footer className="bg-gray-900 text-white dark:bg-vynal-purple-dark border-t border-gray-800 dark:border-vynal-purple-secondary/30 relative overflow-hidden">
      {/* Éléments décoratifs en arrière-plan */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-50">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('/assets/patterns/noise.png')] bg-repeat opacity-[0.02]"></div>
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-600/5 dark:bg-vynal-accent-secondary/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-500/5 dark:bg-vynal-accent-primary/5 rounded-full blur-3xl"></div>
      </div>
      
      <div className="container mx-auto px-4 py-10 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {/* Logo et Description */}
          <motion.div 
            className="lg:col-span-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Link href="/">
              <Image 
                src="/assets/logo/logo_vynal_platform_simple.webp" 
                alt="Vynal Platform Logo" 
                className="h-3 md:h-4 w-auto dark:brightness-110 transition-all duration-300"
                width={70}
                height={14}
                style={{ height: 'auto' }}
                priority
              />
            </Link>
            <p className="mt-3 text-xs text-gray-400 dark:text-vynal-text-secondary">
              La plateforme de mise en relation entre freelances et clients pour des projets réussis.
              Des services de qualité à prix fixe.
            </p>
            <SocialIcons />
          </motion.div>

          {/* Liens de navigation */}
          {FOOTER_LINKS.map((section, index) => (
            <motion.div 
              key={section.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 + index * 0.1 }}
            >
              <LinkGroup section={section} />
            </motion.div>
          ))}
        </div>

        <motion.div 
          className="mt-8 pt-6 border-t border-gray-800 dark:border-vynal-purple-secondary/30"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.6 }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ContactInfo />
            <div className="flex items-center justify-between text-gray-400 dark:text-vynal-text-secondary md:text-right">
              <ThemeToggleButton />
              <span className="text-xs">&copy; {currentYear} Vynal Platform. Tous droits réservés.</span>
            </div>
          </div>
        </motion.div>
      </div>
    </footer>
  );
}

export default memo(Footer);