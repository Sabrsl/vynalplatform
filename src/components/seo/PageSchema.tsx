import Script from 'next/script';

interface PageSchemaProps {
  title: string;
  description: string;
  url: string;
  image?: string;
  type?: 'WebPage' | 'Article' | 'Service';
  datePublished?: string;
  dateModified?: string;
  author?: {
    name: string;
    url?: string;
  };
}

export default function PageSchema({
  title,
  description,
  url,
  image,
  type = 'WebPage',
  datePublished,
  dateModified,
  author
}: PageSchemaProps) {
  const pageJsonLd = {
    "@context": "https://schema.org",
    "@type": type,
    "name": title,
    "description": description,
    "url": url,
    ...(image && { "image": image }),
    ...(datePublished && { "datePublished": datePublished }),
    ...(dateModified && { "dateModified": dateModified }),
    ...(author && {
      "author": {
        "@type": "Person",
        "name": author.name,
        ...(author.url && { "url": author.url })
      }
    })
  };

  return (
    <Script
      id="page-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(pageJsonLd)
      }}
    />
  );
} 