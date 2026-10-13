/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  typescript: { ignoreBuildErrors: false },
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
    optimizePackageImports: ['lucide-react', '@radix-ui', 'date-fns'],
    // Disable some experimental features that might cause chunking issues
  },
  // Use Webpack during the staged Next.js 16 migration.
  // Disable Next.js tracing to fix api.createContextKey errors
  productionBrowserSourceMaps: false,
  compiler: {
    removeConsole: false,
  },
  // Force all pages to be server-side rendered by default
  // This prevents "Dynamic server usage" errors during build
  staticPageGenerationTimeout: 1000,
  // External packages configuration
  serverExternalPackages: ['bcrypt', 'cloudinary'],
  // Enhanced webpack configuration for Vercel deployment
  webpack: (config, { isServer }) => {
    // Only add fallbacks for client-side bundles
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        buffer: false,
        http: false,
        https: false,
        zlib: false,
        path: false,
        os: false,
        child_process: false,
      };
    }
    
    // Add external modules that should not be bundled
    config.externals = [
      ...(config.externals || []),
      'bcrypt',
      ...(isServer ? ['cloudinary'] : []),
    ];
    
    // Ensure Next.js doesn't attempt to bundle native Node.js modules on the client
    if (!isServer) {
      // Mark certain packages as external when they're imported in client components
      config.module = {
        ...config.module,
        rules: [
          ...(config.module?.rules || []),
          {
            test: /node_modules\/cloudinary/,
            use: 'null-loader',
          },
        ],
      };
    }
    
    return config;
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
  // Secrets belong only in the hosting provider's server-side environment.
};

module.exports = config; 