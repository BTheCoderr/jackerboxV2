#!/bin/bash
set -e

echo "Starting clean deployment process..."

# Make setup-ui.sh executable
chmod +x setup-ui.sh

# Run setup-ui.sh to create UI components
echo "Creating UI components..."
./setup-ui.sh

# Verify UI components exist
echo "Verifying UI components..."
if [ -f "src/components/ui/button.tsx" ] && [ -f "src/components/ui/card.tsx" ] && [ -f "src/components/ui/alert.tsx" ]; then
  echo "UI components verified successfully!"
else
  echo "Error: UI components not found!"
  exit 1
fi

# Create a simplified .env.production.local file
echo "Creating simplified environment variables..."
cat > .env.production.local << EOL
# Essential environment variables for static build
DATABASE_URL="postgresql://jackerboxDB_owner:npg_vYM7Pg4ERIAk@ep-fancy-wind-a5ymnajb-pooler.us-east-2.aws.neon.tech/jackerboxDB?sslmode=require"
DIRECT_DATABASE_URL="postgresql://jackerboxDB_owner:npg_vYM7Pg4ERIAk@ep-fancy-wind-a5ymnajb-pooler.us-east-2.aws.neon.tech/jackerboxDB?sslmode=require"
NEXTAUTH_URL="https://jackerbox.netlify.app"
NEXTAUTH_SECRET="jKHGF67sdfGHJK78sdfghjkHGF678sdfghjkJHGF67"
NEXT_PUBLIC_STATIC_ONLY="true"

# Cloudinary configuration
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="dgtqpyphg"
CLOUDINARY_API_KEY="646841252992477"
CLOUDINARY_API_SECRET="Zxu873QWGlD6cYq2gB9cqFO6wG0"
CLOUDINARY_URL="cloudinary://646841252992477:Zxu873QWGlD6cYq2gB9cqFO6wG0@dgtqpyphg"
EOL

# Update netlify.toml to not use vercel-build.sh
echo "Updating netlify.toml..."
cat > netlify.toml << EOL
[build]
  command = "chmod +x setup-ui.sh && ./setup-ui.sh && NODE_OPTIONS='--max-old-space-size=4096' npm run build"
  publish = "out"

[build.environment]
  PRISMA_GENERATE_DATAPROXY = "true"
  NODE_VERSION = "20"

[context.production.environment]
  DATABASE_URL = "\${DIRECT_DATABASE_URL}"
  DIRECT_DATABASE_URL = "\${DIRECT_DATABASE_URL}"
  NEXTAUTH_URL = "https://jackerbox.netlify.app"
  NEXTAUTH_SECRET = "\${NEXTAUTH_SECRET}"
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME = "\${NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}"
  CLOUDINARY_API_KEY = "\${CLOUDINARY_API_KEY}"
  CLOUDINARY_API_SECRET = "\${CLOUDINARY_API_SECRET}"
  CLOUDINARY_URL = "cloudinary://\${CLOUDINARY_API_KEY}:\${CLOUDINARY_API_SECRET}@\${NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}"
  NEXT_PUBLIC_FIREBASE_API_KEY = "\${NEXT_PUBLIC_FIREBASE_API_KEY}"
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = "\${NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN}"
  NEXT_PUBLIC_FIREBASE_PROJECT_ID = "\${NEXT_PUBLIC_FIREBASE_PROJECT_ID}"
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET = "\${NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET}"
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = "\${NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID}"
  NEXT_PUBLIC_FIREBASE_APP_ID = "\${NEXT_PUBLIC_FIREBASE_APP_ID}"
  STRIPE_SECRET_KEY = "\${STRIPE_SECRET_KEY}"
  STRIPE_PUBLISHABLE_KEY = "\${STRIPE_PUBLISHABLE_KEY}"
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = "\${NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY}"
  NEXT_PUBLIC_STATIC_ONLY = "true"

# For client-side routing with Next.js static export
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
EOL

# Update next.config.mjs for static export
echo "Updating Next.js config for static export..."
cat > next.config.mjs << EOL
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  output: 'export',
  images: {
    unoptimized: true,
    domains: ['res.cloudinary.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
    ],
  },
  trailingSlash: true,
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
      allowedOrigins: ['localhost:3000', 'jackerbox.vercel.app', 'jackerbox.netlify.app']
    }
  },
};

export default nextConfig;
EOL

# Build the project with static export
echo "Building the project with static export..."
NODE_OPTIONS='--max-old-space-size=4096' npm run build

# Create a simple index.html for API routes
echo "Creating API routes placeholder..."
mkdir -p out/api
cat > out/api/index.html << EOL
<!DOCTYPE html>
<html>
<head>
  <title>API Routes</title>
  <meta charset="utf-8">
</head>
<body>
  <h1>API Routes</h1>
  <p>This is a static export. API routes are not available in this deployment.</p>
</body>
</html>
EOL

# Deploy to Netlify
echo "Deploying to Netlify..."
netlify deploy --prod --dir=out

echo "Clean deployment process completed!" 