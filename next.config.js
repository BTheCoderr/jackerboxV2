/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Disable ESLint during build
  eslint: {
    // Warning instead of error during build
    ignoreDuringBuilds: true,
  },
  // Simple configuration without Turbopack-specific settings
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
  output: 'standalone',
  images: {
    domains: ['res.cloudinary.com'],
    unoptimized: true
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
      allowedOrigins: ['localhost:3000', 'jackerbox.vercel.app', 'jackerbox.netlify.app']
    }
  },
  // Add this to handle dynamic server usage errors
  serverRuntimeConfig: {
    // Will only be available on the server side
    mySecret: 'secret',
  },
  publicRuntimeConfig: {
    // Will be available on both server and client
    staticFolder: '/static',
  },
  // Add webpack configuration to handle Node.js modules
  webpack: (config, { isServer }) => {
    // If it's a client-side bundle, add fallbacks for Node.js modules
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        os: false,
        path: false,
        child_process: false,
      };
    }
    return config;
  },
};

export default nextConfig; 