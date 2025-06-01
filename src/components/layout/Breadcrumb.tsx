import { ChevronRight, Home } from 'lucide-react';
import Link from 'next/link';
import Script from 'next/script';

interface BreadcrumbItem {
  label: string;
  href: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumb({ items }: BreadcrumbProps) {
  // Ajouter la page d'accueil au début
  const allItems = [
    { label: 'Accueil', href: '/' },
    ...items
  ];

  // Données structurées pour le fil d'Ariane
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": allItems.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.label,
      "item": `https://vynalplatform.com${item.href}`
    }))
  };

  return (
    <>
      <Script
        id="breadcrumb-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLd)
        }}
      />
      <nav className="flex items-center space-x-1 text-sm text-gray-500 dark:text-gray-400">
        {allItems.map((item, index) => (
          <div key={item.href} className="flex items-center">
            {index > 0 && (
              <ChevronRight className="h-4 w-4 mx-1" />
            )}
            {index === 0 ? (
              <Link href={item.href} className="hover:text-vynal-accent-primary">
                <Home className="h-4 w-4" />
              </Link>
            ) : (
              <Link
                href={item.href}
                className={`hover:text-vynal-accent-primary ${
                  index === allItems.length - 1 ? 'text-vynal-accent-primary font-medium' : ''
                }`}
              >
                {item.label}
              </Link>
            )}
          </div>
        ))}
      </nav>
    </>
  );
} 