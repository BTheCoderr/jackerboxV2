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
  // For Vercel deployment, we don't need to set output to standalone
  //   // Ensure images work correctly
  images: {
    domains: ['res.cloudinary.com'],
    // For Vercel, we can use optimized images
    unoptimized: false,
  },
  // Ensure trailing slashes are handled correctly
  trailingSlash: false,
  // Disable source maps in production
  productionBrowserSourceMaps: false,
  // Enable experimental features
  experimental: {
    serverActions: true,
  },
};

export default nextConfig; 