import withPWA from 'next-pwa';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  // Ensure images work correctly
  images: {
    domains: ['res.cloudinary.com'],
  },
  // Disable source maps in production
  productionBrowserSourceMaps: false,
  // Enable experimental features for server components
  experimental: {
    serverActions: true,
    optimizeCss: true,
    optimizePackageImports: ['react-icons', 'date-fns', 'recharts'],
    // Reduce bundle size
    modularizeImports: {
      'react-icons': {
        transform: 'react-icons/{{member}}',
      },
    },
  },
};

// Add PWA configuration
const pwaConfig = {
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
};

export default withPWA({
  ...nextConfig,
  pwa: pwaConfig,
}); 