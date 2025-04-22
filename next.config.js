/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      'localhost',
      'vynal-platform-storage.s3.amazonaws.com',
      'vynal-platform-prod.s3.us-east-1.amazonaws.com',
      'placehold.co',
      'placekitten.com',
      'via.placeholder.com'
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '**',
      },
    ],
  },
  // Désactiver la génération statique pour les pages qui utilisent useSearchParams
  // et d'autres API uniquement disponibles côté client
  experimental: {
    // Permettre la création de routes dynamiques même si elles contiennent useSearchParams
    missingSuspenseWithCSRBailout: false,
  },
  output: 'standalone',
  // Ajout d'éventuelles redirections ou rewrites ici si nécessaire
  // redirects: async () => { return [] },
  // rewrites: async () => { return [] },
}

module.exports = nextConfig 