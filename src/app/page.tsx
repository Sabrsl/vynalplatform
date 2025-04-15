import Link from 'next/link';
import { ArrowRight, Search, Star, Shield, Clock } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-24">
        <div className="container mx-auto px-4 flex flex-col lg:flex-row items-center justify-between">
          <div className="lg:w-1/2 mb-10 lg:mb-0">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
              Trouvez des freelances qualifiés pour tous vos projets
            </h1>
            <p className="text-xl opacity-90 mb-10">
              Une plateforme simple et efficace pour mettre en relation freelances et clients. Des services de qualité à prix fixe.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link 
                href="/services" 
                className="bg-white text-indigo-600 py-3 px-6 rounded-md font-medium flex items-center gap-2 hover:bg-gray-100 transition-colors"
              >
                Explorer les services <ArrowRight size={18} />
              </Link>
              <Link 
                href="/auth/signup?role=freelance" 
                className="border border-white text-white py-3 px-6 rounded-md font-medium hover:bg-white hover:text-indigo-600 transition-colors"
              >
                Devenir freelance
              </Link>
            </div>
          </div>
          <div className="lg:w-2/5 animate-fade-in">
            <div className="bg-white rounded-xl p-6 shadow-xl">
              <div className="flex items-center gap-2 mb-4">
                <Search size={20} className="text-indigo-600" />
                <input 
                  type="text" 
                  placeholder="Que recherchez-vous ?" 
                  className="w-full py-2 px-3 bg-gray-100 rounded-md text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="bg-gray-100 text-gray-600 text-sm py-1 px-3 rounded-full">Développement Web & Mobile</span>
                <span className="bg-gray-100 text-gray-600 text-sm py-1 px-3 rounded-full">Design Graphique</span>
                <span className="bg-gray-100 text-gray-600 text-sm py-1 px-3 rounded-full">Marketing Digital</span>
                <span className="bg-gray-100 text-gray-600 text-sm py-1 px-3 rounded-full">Agriculture & Élevage</span>
                <span className="bg-gray-100 text-gray-600 text-sm py-1 px-3 rounded-full">Informatique & Réseaux</span>
                <span className="bg-gray-100 text-gray-600 text-sm py-1 px-3 rounded-full">Santé & Bien-être</span>
              </div>
              <button className="w-full bg-indigo-600 text-white py-2 rounded-md font-medium hover:bg-indigo-700 transition-colors">
                Rechercher
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-16">Comment ça fonctionne</h2>
          <div className="grid md:grid-cols-3 gap-10">
            <div className="flex flex-col items-center text-center">
              <div className="bg-indigo-100 p-4 rounded-full mb-6">
                <Search className="w-8 h-8 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Recherchez un service</h3>
              <p className="text-gray-600">
                Parcourez notre catalogue de services proposés par des freelances talentueux dans différentes catégories.
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="bg-indigo-100 p-4 rounded-full mb-6">
                <Star className="w-8 h-8 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Choisissez votre freelance</h3>
              <p className="text-gray-600">
                Consultez les profils, les avis et les portfolios pour trouver le freelance qui correspond à vos besoins.
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="bg-indigo-100 p-4 rounded-full mb-6">
                <Shield className="w-8 h-8 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Commandez en toute sécurité</h3>
              <p className="text-gray-600">
                Passez commande et suivez l'avancement de votre projet. Le paiement est sécurisé et relâché uniquement à la livraison.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="bg-indigo-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">
            Prêt à rejoindre notre communauté?
          </h2>
          <p className="max-w-xl mx-auto mb-8">
            Rejoignez notre communauté de freelances et de clients et découvrez une nouvelle façon de travailler.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link 
              href="/auth/signup?role=client" 
              className="bg-white text-indigo-600 py-3 px-8 rounded-md font-medium hover:bg-gray-100 transition-colors"
            >
              S'inscrire comme client
            </Link>
            <Link 
              href="/auth/signup?role=freelance" 
              className="border border-white text-white py-3 px-8 rounded-md font-medium hover:bg-white hover:text-indigo-600 transition-colors"
            >
              S'inscrire comme freelance
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
} 