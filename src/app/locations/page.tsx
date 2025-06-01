import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Localisations | Vynal Platform',
  description: 'Découvrez les freelances africains par localisation.',
};

export default function LocationsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Localisations</h1>
      <div className="text-center py-12">
        <p className="text-lg text-gray-600">
          Cette page vous permettra bientôt de découvrir les freelances africains par pays et ville.
        </p>
      </div>
    </div>
  );
} 