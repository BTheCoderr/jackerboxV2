/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    domains: ['res.cloudinary.com'],
    // Optimize images for mobile
    deviceSizes: [320, 420, 768, 1024, 1200],
    imageSizes: [16, 32, 64, 96, 128, 256],
    formats: ['image/avif', 'image/webp'],
  },
  productionBrowserSourceMaps: false,
  experimental: {
    serverActions: true,
    // Enable optimizations for mobile
    optimizeCss: true,
    optimizePackageImports: ['react-icons', 'date-fns', 'recharts'],
    // Reduce bundle size
    modularizeImports: {
      'react-icons': {
        transform: 'react-icons/{{member}}',
      },
    },
  },
  // Add PWA configuration
  pwa: {
    dest: 'public',
    register: true,
    skipWaiting: true,
    disable: process.env.NODE_ENV === 'development',
    manifest: {
      name: 'Jackerbox',
      short_name: 'Jackerbox',
      description: 'Peer-to-Peer Equipment Rental',
      display: 'standalone',
      orientation: 'portrait',
      background_color: '#ffffff',
      theme_color: '#0f172a',
      start_url: '/',
      icons: [
        {
          src: '/icons/icon-192x192.png',
          sizes: '192x192',
          type: 'image/png',
          purpose: 'any maskable'
        },
        {
          src: '/icons/icon-512x512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any maskable'
        }
      ]
    }
  }
};

export default nextConfig;