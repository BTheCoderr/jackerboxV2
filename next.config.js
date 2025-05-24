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
  // Add this to handle dynamic server usage errors
  serverRuntimeConfig: {
    // Will only be available on the server side
    mySecret: 'secret',
  },
  publicRuntimeConfig: {
    // Will be available on both server and client
    staticFolder: '/static',
  },
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
  env: {
    // Only explicitly list allowed environment variables
    NEXT_PUBLIC_DISABLE_SOCKET: 'false',
    NEXTAUTH_URL: 'http://localhost:3001',
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    DATABASE_URL: process.env.DATABASE_URL,
    // Upstash Redis configuration
    KV_URL: process.env.KV_URL || 'rediss://default:AVL4AAIjcDExMjE2ZjY5ZTdmMmQ0NWI5OTg4YzNmYzU3NGEwNTdhYnAxMA@prime-ostrich-21240.upstash.io:6379',
    KV_REST_API_TOKEN: process.env.KV_REST_API_TOKEN || 'AVL4AAIjcDExMjE2ZjY5ZTdmMmQ0NWI5OTg4YzNmYzU3NGEwNTdhYnAxMA',
    KV_REST_API_READ_ONLY_TOKEN: process.env.KV_REST_API_READ_ONLY_TOKEN || 'AlL4AAIgcDG6Ii1i0y-BbpQgbe6Wwr6fZst5dlrMknb4_VXgvw9CGw',
    KV_REST_API_URL: process.env.KV_REST_API_URL || 'https://prime-ostrich-21240.upstash.io',
    REDIS_URL: process.env.REDIS_URL || 'rediss://default:AVL4AAIjcDExMjE2ZjY5ZTdmMmQ0NWI5OTg4YzNmYzU3NGEwNTdhYnAxMA@prime-ostrich-21240.upstash.io:6379',
  },
};

module.exports = config; 