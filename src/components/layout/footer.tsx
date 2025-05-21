"use client";

import React, { useState, useEffect, useCallback, memo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Facebook, Twitter, Instagram, Linkedin, Mail, Moon, Sun, ClipboardCopy, Check, Globe } from "lucide-react";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import { FREELANCE_ROUTES, CLIENT_ROUTES, PUBLIC_ROUTES } from "@/config/routes";
import useCurrency from "@/hooks/useCurrency";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { triggerCurrencyChangeEvent } from "@/lib/utils/currency-updater";

// Données du footer mémorisées en dehors du composant pour éviter les recréations inutiles
const FOOTER_LINKS = [
  {
    title: "Services",
    links: [
      { name: "Développement Web & Mobile", href: `${PUBLIC_ROUTES.SERVICES}?category=developpement-web-mobile` },
      { name: "Design Graphique", href: `${PUBLIC_ROUTES.SERVICES}?category=design-graphique` },
      { name: "Marketing Digital", href: `${PUBLIC_ROUTES.SERVICES}?category=marketing-digital` },
      { name: "Rédaction & Traduction", href: `${PUBLIC_ROUTES.SERVICES}?category=redaction-traduction` },
      { name: "Vidéo & Audio", href: `${PUBLIC_ROUTES.SERVICES}?category=video-audio` },
      { name: "Informatique & Réseaux", href: `${PUBLIC_ROUTES.SERVICES}?category=informatique-reseaux` },
      { name: "Tous les services", href: PUBLIC_ROUTES.SERVICES },
    ],
  },
  {
    title: "Entreprise",
    links: [
      { name: "À propos", href: PUBLIC_ROUTES.ABOUT },
      { name: "Comment ça marche", href: PUBLIC_ROUTES.HOW_IT_WORKS },
      { name: "Statuts", href: "/status" },
      { name: "Carrières", href: "/careers" },
      { name: "Devenir Freelance", href: "/devenir-freelance" },
      { name: "Contact", href: PUBLIC_ROUTES.CONTACT },
      { name: "FAQ", href: PUBLIC_ROUTES.FAQ },
    ],
  },
  {
    title: "Légal",
    links: [
      { name: "Conditions d'utilisation", href: PUBLIC_ROUTES.TERMS_OF_SERVICE },
      { name: "Politique de confidentialité", href: PUBLIC_ROUTES.PRIVACY_POLICY },
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

// Liste des devises principales à afficher en priorité dans le footer
const FOOTER_CURRENCIES = ['XOF', 'EUR', 'USD', 'GBP', 'MAD', 'XAF'];

// Composant pour les icônes sociales (mémorisé)
const SocialIcons = memo(() => {
  return (
    <motion.div 
      className="mt-5 mb-8 md:mb-0 flex space-x-4"
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
        className="flex items-center relative group w-full"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <Mail className="w-4 h-4 mr-2 text-gray-400 dark:text-vynal-text-secondary flex-shrink-0" strokeWidth={2} />
        <a 
          href={`mailto:${CONTACT_EMAIL}`} 
          className="text-[10px] text-gray-400 dark:text-vynal-text-secondary hover:text-gray-600 dark:hover:text-gray-600 transition-colors whitespace-nowrap"
        >
          {CONTACT_EMAIL}
        </a>
        <AnimatePresence>
          {(isHovered || isCopied) && (
            <motion.button
              onClick={copyToClipboard}
              className={`ml-2 px-1.5 py-0.5 text-[9px] rounded flex items-center gap-1 ${
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
      <h3 className="text-[10px] font-semibold uppercase tracking-wider text-white dark:text-vynal-text-primary">
        {section.title}
      </h3>
      <motion.ul 
        className="mt-2 space-y-1"
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
              className="text-[10px] text-gray-400 hover:text-gray-600 dark:text-vynal-text-secondary dark:hover:text-gray-600 transition-colors block py-0.5"
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

// Composant pour le sélecteur de devise simplifié (mémorisé)
const CurrencySelector = memo(() => {
  const { currency, updateUserCurrencyPreference } = useCurrency();
  const [availableCurrencies, setAvailableCurrencies] = useState<any[]>([]);
  const [selectedCurrency, setSelectedCurrency] = useState<string>(currency.code);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Détecter si l'écran est mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    
    // Vérifier au chargement initial
    checkMobile();
    
    // Suivre les changements de taille d'écran
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Charger les devises disponibles depuis le fichier JSON
  useEffect(() => {
    const loadCurrencies = async () => {
      try {
        const response = await fetch('/data/currencies.json');
        const data = await response.json();
        
        // Trier les devises: d'abord les principales, puis le reste par ordre alphabétique
        const mainCurrencies = FOOTER_CURRENCIES
          .map(code => data.find((c: any) => c.code === code))
          .filter(Boolean);
          
        setAvailableCurrencies(mainCurrencies);
        setIsLoading(false);
      } catch (error) {
        console.error('Erreur lors du chargement des devises:', error);
        setIsLoading(false);
      }
    };
    
    loadCurrencies();
  }, []);

  // Mettre à jour la devise sélectionnée quand le hook de devise change
  useEffect(() => {
    if (currency.code) {
      setSelectedCurrency(currency.code);
    }
  }, [currency.code]);

  // Gérer le changement de devise
  const handleCurrencyChange = async (value: string) => {
    if (value === currency.code) return;
    
    setSelectedCurrency(value);
    
    try {
      // Mettre à jour la préférence de devise
      await updateUserCurrencyPreference(value);
      
      // Notification de succès avec indication de mise à jour globale
      toast.success(
        <div className="flex flex-col gap-1">
          <div className="font-medium">Devise mise à jour: {value}</div>
          <div className="text-xs opacity-80">Tous les prix de l'application ont été convertis.</div>
        </div>,
        { duration: 3000 }
      );
      
      // Déclencher une propagation globale du changement
      triggerCurrencyChangeEvent(value);
      
    } catch (error) {
      console.error('Erreur lors du changement de devise:', error);
    }
  };

  if (isLoading) return null;

  return (
    <div className="flex items-center gap-2 w-full md:w-auto">
      <div className="text-[10px] text-gray-400 dark:text-vynal-text-secondary flex-shrink-0">
        <Globe className="h-3 w-3 inline-block mr-1 opacity-80" strokeWidth={2} />
        Devise:
      </div>
      <Select
        value={selectedCurrency}
        onValueChange={handleCurrencyChange}
      >
        <SelectTrigger className="h-6 px-2 min-w-[90px] max-w-[115px] sm:max-w-none text-[10px] bg-transparent border-gray-800 dark:border-vynal-purple-secondary/30 text-gray-400 dark:text-vynal-text-secondary overflow-hidden [&_span]:!text-gray-400 [&_div]:!text-gray-400 [&_.flex]:!text-gray-400 [&_*]:!text-gray-400 dark:[&_*]:!text-vynal-text-secondary">
          <SelectValue>
            <div className="flex items-center gap-1 truncate">
              <span className="font-mono">{availableCurrencies.find(c => c.code === selectedCurrency)?.symbol}</span>
              <span className="truncate">{selectedCurrency}</span>
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="min-w-fit text-[10px] bg-gray-900 border-gray-800 text-gray-300" position={isMobile ? "popper" : "item-aligned"} side={isMobile ? "top" : "bottom"} align={isMobile ? "center" : "start"} sideOffset={-10}>
          {availableCurrencies.map((c) => (
            <SelectItem key={c.code} value={c.code} className="py-1 text-[10px] text-gray-300 hover:bg-gray-800/80 hover:text-vynal-accent-primary data-[state=checked]:bg-gray-800 data-[state=checked]:text-vynal-accent-primary">
              <div className="flex items-center gap-1.5">
                <span className="font-mono">{c.symbol}</span>
                <span>{c.code}</span>
                <span className="text-[8px] text-gray-400 hidden sm:inline">
                  ({c.name})
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
});

CurrencySelector.displayName = 'CurrencySelector';

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
    // Retourner un squelette ayant exactement les mêmes dimensions que le footer réel
    return (
      <footer className="bg-gray-900 text-white dark:bg-vynal-purple-dark border-t border-gray-800 dark:border-vynal-purple-secondary/30 relative overflow-hidden h-auto">
        <div className="container mx-auto px-4 py-10 relative z-10 opacity-0">
          {/* Structure squelette identique pour éviter le saut */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-2"></div>
            <div></div>
            <div></div>
            <div></div>
          </div>
          <div className="mt-10 pt-8 border-t border-gray-800 dark:border-vynal-purple-secondary/30">
            <div className="flex flex-col-reverse md:flex-row justify-between items-center">
              <div></div>
              <div></div>
            </div>
          </div>
        </div>
      </footer>
    );
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
            <Link href={PUBLIC_ROUTES.HOME}>
              <Image 
                src="/assets/logo/logo_vynal_platform_simple.svg" 
                alt="Vynal Platform Logo" 
                className="h-20 md:h-24 w-auto dark:brightness-110 transition-all duration-300 mb-4"
                width={360}
                height={96}
                priority
              />
            </Link>
            <p className="mt-4 text-[10px] text-gray-400 dark:text-vynal-text-secondary leading-relaxed">
              La plateforme de mise en relation entre freelances et clients pour des projets réussis.
              <br />
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-4">
            <div className="flex flex-col space-y-2 md:space-y-0 md:flex-row md:items-center md:justify-start md:space-x-4">
              <ContactInfo />
              <CurrencySelector />
            </div>
            <div className="flex items-center justify-start md:justify-end text-gray-400 dark:text-vynal-text-secondary md:text-right">
              <span className="text-[9px] opacity-70">
                &copy; {currentYear} Vynal Platform. Tous droits réservés.
                <span className="ml-2 inline-flex items-center px-1 py-0.5 rounded text-[8px] font-medium bg-vynal-purple-light/10 text-vynal-purple-light dark:bg-vynal-accent-primary/10 dark:text-vynal-accent-primary">v0.1.126</span>
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </footer>
  );
}

export default memo(Footer);