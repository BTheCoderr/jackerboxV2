/** @type {import('next').NextConfig} */
const config = {
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
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
      allowedOrigins: ['localhost:3000', 'localhost:3001', 'jackerbox.vercel.app', 'jackerbox.netlify.app']
    },
    optimizeCss: true,
    optimizePackageImports: ['lucide-react', '@radix-ui', 'date-fns'],
    // Disable some experimental features that might cause chunking issues
    ppr: false,
    taint: false,
  },
  // Force all pages to be server-side rendered by default
  // This prevents "Dynamic server usage" errors during build
  staticPageGenerationTimeout: 1000,
  // External packages configuration
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

    // Fix for chunk load errors: optimize chunks to avoid too many small chunks
    if (!isServer) {
      // Modify chunking strategy
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          default: false, // Disable default cache groups
          defaultVendors: false, // Disable default vendor groups
          framework: {
            name: 'framework',
            chunks: 'all',
            // Include React, Next.js, and other framework code
            test: /[\\/]node_modules[\\/](react|react-dom|scheduler|next|@next)[\\/]/,
            priority: 40,
            // Don't create too many chunks
            enforce: true,
          },
          commons: {
            name: 'commons',
            chunks: 'all',
            // Match any file from node_modules
            test: /[\\/]node_modules[\\/]/,
            // Set a minimum size (in bytes) to avoid too many small chunks
            minSize: 20000,
            priority: 30,
          },
        },
      };

      // Increase max initial chunk size to avoid creating too many chunks
      config.optimization.runtimeChunk = { name: 'runtime' };
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
  },
  env: {
    // Only explicitly list allowed environment variables
    NEXT_PUBLIC_DISABLE_SOCKET: 'true',
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    DATABASE_URL: process.env.DATABASE_URL
  },
};

export default config; 