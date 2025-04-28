/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'https',
        hostname: 'vynal-platform-storage.s3.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: 'vynal-platform-prod.s3.us-east-1.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: 'placehold.co',
      },
      {
        protocol: 'https', 
        hostname: 'placekitten.com',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      }
    ],
  },
  // Désactiver la génération statique pour les pages qui utilisent useSearchParams
  // et d'autres API uniquement disponibles côté client
  experimental: {
    // Permettre la création de routes dynamiques même si elles contiennent useSearchParams
    missingSuspenseWithCSRBailout: false,
    // Améliorer la stabilité du serveur de développement
    serverComponentsExternalPackages: ['@next/react-dev-overlay'],
  },
  output: 'standalone',
  // Augmenter la taille limite des pages pour éviter les problèmes de mémoire
  compiler: {
    // Réduire la taille du bundle en développement
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // Désactiver la vérification des modules pour permettre des fallbacks
  transpilePackages: ['next'],
  // Augmenter la mémoire allouée au processus de build
  webpack: (config, { isServer }) => {
    // Optimisation pour éviter les erreurs de module manquant
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
    
    return config;
  },
  // Ajout d'éventuelles redirections ou rewrites ici si nécessaire
  // redirects: async () => { return [] },
  // rewrites: async () => { return [] },
}

module.exports = nextConfig 