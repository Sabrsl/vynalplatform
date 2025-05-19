/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
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
      },
      {
        protocol: 'https',
        hostname: 'pbs.twimg.com',
      }
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  // Désactiver la génération statique pour les pages qui utilisent useSearchParams
  // et d'autres API uniquement disponibles côté client
  experimental: {
    // Permettre la création de routes dynamiques même si elles contiennent useSearchParams
    missingSuspenseWithCSRBailout: false,
    // Améliorer la stabilité du serveur de développement
    serverComponentsExternalPackages: ['@next/react-dev-overlay'],
    optimisticClientCache: true,
  },
  output: 'standalone',
  // Augmenter la taille limite des pages pour éviter les problèmes de mémoire
  compiler: {
    // Réduire la taille du bundle en développement
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
  // Désactiver la vérification des modules pour permettre des fallbacks
  transpilePackages: ['next'],
  // Optimisation webpack
  webpack: (config, { dev, isServer }) => {
    // Optimisation pour éviter les erreurs de module manquant
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
    
    // Optimisations supplémentaires pour la production
    if (!dev && !isServer) {
      // Améliorer le fractionnement du code
      config.optimization.splitChunks = {
        chunks: 'all',
        maxInitialRequests: 25,
        minSize: 20000,
        cacheGroups: {
          defaultVendors: {
            test: /[\\/]node_modules[\\/]/,
            priority: -10,
            reuseExistingChunk: true,
          },
          default: {
            minChunks: 2,
            priority: -20,
            reuseExistingChunk: true,
          },
        },
      };
    }
    
    return config;
  },
  // Optimisation des headers pour le cache et la sécurité
  async headers() {
    return [
      {
        source: '/fonts/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Optimisation du cache pour les requêtes proxy vers Supabase Storage
      {
        source: '/_next/image',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=604800, stale-while-revalidate=86400',
          },
        ],
      }
    ];
  },
  // Ajout d'éventuelles redirections ou rewrites ici si nécessaire
  // redirects: async () => { return [] },
  // rewrites: async () => { return [] },
}

module.exports = nextConfig 