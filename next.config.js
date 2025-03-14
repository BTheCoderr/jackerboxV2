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
      allowedOrigins: ['localhost:3000', 'jackerbox.vercel.app', 'jackerbox.netlify.app']
    },
    optimizeCss: true,
    optimizePackageImports: ['lucide-react', '@radix-ui', 'date-fns'],
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