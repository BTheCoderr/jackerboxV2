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
    domains: ['res.cloudinary.com', 'lh3.googleusercontent.com'],
    unoptimized: true
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
      allowedOrigins: ['localhost:3000', 'jackerbox.vercel.app', 'jackerbox.netlify.app']
    }
  },
  // Moved from experimental.serverComponentsExternalPackages
  serverExternalPackages: ['bcrypt'],
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
  webpack: (config, { isServer, dev }) => {
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
    
    // Add plugin to suppress hot-reloader console messages in development
    if (dev && !isServer) {
      // Add a custom plugin to suppress hot-reloader console messages
      config.plugins.push({
        apply: (compiler) => {
          compiler.hooks.afterEmit.tap('SuppressHotReloaderLogs', () => {
            // This is a hack to suppress hot-reloader console messages
            if (typeof window !== 'undefined') {
              const originalConsoleError = console.error;
              console.error = (...args) => {
                if (
                  typeof args[0] === 'string' && 
                  (args[0].includes('hot-reloader') || 
                   args[0].includes('[Fast Refresh]'))
                ) {
                  return;
                }
                originalConsoleError(...args);
              };
            }
          });
        }
      });
    }
    
    config.externals = [...config.externals, 'bcrypt'];
    return config;
  }
};

export default nextConfig; 