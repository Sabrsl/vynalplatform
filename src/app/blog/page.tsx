import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Blog | Vynal Platform',
  description: 'Découvrez nos articles et actualités sur le freelancing en Afrique.',
};

export default function BlogPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Blog</h1>
      <div className="text-center py-12">
        <p className="text-lg text-gray-600">
          Notre blog est en cours de construction. Revenez bientôt pour découvrir nos articles sur le freelancing en Afrique !
        </p>
      </div>
    </div>
  );
} 