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
  // Static export configuration
  output: 'export',
  distDir: 'out',
  // Ensure images work correctly in static export
  images: {
    unoptimized: true,
  },
  // Disable server components and API routes for static export
  experimental: {
    serverActions: false,
    serverComponents: false
  },
  // Only include specific static routes
  exportPathMap: async function () {
    return {
      '/': { page: '/' },
      '/routes/browse': { page: '/routes/browse' },
      '/routes/about': { page: '/routes/about' },
      '/routes/contact': { page: '/routes/contact' },
      '/routes/how-it-works': { page: '/routes/how-it-works' },
      '/routes/privacy': { page: '/routes/privacy' },
      '/routes/terms': { page: '/routes/terms' },
      '/routes/cookies': { page: '/routes/cookies' }
    };
  },
  // Disable dynamic routes for static export
  trailingSlash: true,
};

export default nextConfig; 