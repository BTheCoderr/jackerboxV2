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
  // Remove the export output for Netlify to allow API routes to work
  // output: process.env.NETLIFY ? 'export' : 'standalone',
  // Ensure images work correctly
  images: {
    domains: ['res.cloudinary.com'],
    unoptimized: true,
  },
  // Ensure trailing slashes are handled correctly
  trailingSlash: false,
  // Disable source maps in production
  productionBrowserSourceMaps: false,
  // Enable experimental features for Netlify
  experimental: {
    serverActions: true,
  },
};

export default nextConfig; 