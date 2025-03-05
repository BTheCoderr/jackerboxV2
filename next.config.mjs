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
  // Ensure images work correctly in static export
  images: {
    unoptimized: true,
  },
  // Disable server components for static export
  experimental: {
    serverComponentsExternalPackages: [],
  },
};

export default nextConfig; 