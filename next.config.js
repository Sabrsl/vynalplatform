/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['lh3.googleusercontent.com', 'avatars.githubusercontent.com', 'images.unsplash.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '**',
      },
    ],
  },
  // Ajout d'éventuelles redirections ou rewrites ici si nécessaire
  // redirects: async () => { return [] },
  // rewrites: async () => { return [] },
}

module.exports = nextConfig 