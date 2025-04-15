import Link from "next/link";
import { Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin } from "lucide-react";

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
      { name: "Conditions d'utilisation", href: "/terms" },
      { name: "Politique de confidentialité", href: "/privacy" },
      { name: "Cookies", href: "/cookies" },
      { name: "Protection des données", href: "/data-protection" },
    ],
  },
];

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Logo et Description */}
          <div className="lg:col-span-2">
            <Link href="/">
              <h2 className="text-2xl font-bold">Vynal Platform</h2>
            </Link>
            <p className="mt-4 text-gray-400">
              La plateforme de mise en relation entre freelances et clients pour des projets réussis.
              Des services de qualité à prix fixe.
            </p>
            <div className="mt-6 flex space-x-4">
              <a
                href="#"
                className="text-gray-400 hover:text-white transition-colors"
              >
                <Facebook size={20} />
                <span className="sr-only">Facebook</span>
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-white transition-colors"
              >
                <Twitter size={20} />
                <span className="sr-only">Twitter</span>
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-white transition-colors"
              >
                <Instagram size={20} />
                <span className="sr-only">Instagram</span>
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-white transition-colors"
              >
                <Linkedin size={20} />
                <span className="sr-only">LinkedIn</span>
              </a>
            </div>
          </div>

          {/* Liens de navigation */}
          {footerLinks.map((section) => (
            <div key={section.title}>
              <h3 className="text-sm font-semibold uppercase tracking-wider">
                {section.title}
              </h3>
              <ul className="mt-4 space-y-2">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-gray-800">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex flex-col md:flex-row md:space-x-8 space-y-4 md:space-y-0">
              <div className="flex items-center text-gray-400">
                <Mail className="w-5 h-5 mr-2" />
                <a href="mailto:contact@vynalplatform.com" className="hover:text-white transition-colors">
                  contact@vynalplatform.com
                </a>
              </div>
              <div className="flex items-center text-gray-400">
                <Phone className="w-5 h-5 mr-2" />
                <a href="tel:+33123456789" className="hover:text-white transition-colors">
                  +33 1 23 45 67 89
                </a>
              </div>
            </div>
            <div className="text-gray-400 md:text-right">
              <span>&copy; {currentYear} Vynal Platform. Tous droits réservés.</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
} 