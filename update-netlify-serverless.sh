#!/bin/bash

# Create a new Netlify configuration file for serverless deployment
cat > netlify.toml << 'EOL'
[build]
  command = "chmod +x setup-ui.sh && ./setup-ui.sh && NODE_OPTIONS='--max-old-space-size=4096' npm run build:simple"
  publish = ".next"

[build.environment]
  PRISMA_GENERATE_DATAPROXY = "true"
  NODE_VERSION = "20"

[context.production.environment]
  DATABASE_URL = "${DIRECT_DATABASE_URL}"
  DIRECT_DATABASE_URL = "${DIRECT_DATABASE_URL}"
  NEXTAUTH_URL = "https://jackerbox.netlify.app"
  NEXTAUTH_SECRET = "${NEXTAUTH_SECRET}"
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME = "${NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}"
  CLOUDINARY_API_KEY = "${CLOUDINARY_API_KEY}"
  CLOUDINARY_API_SECRET = "${CLOUDINARY_API_SECRET}"
  CLOUDINARY_URL = "${CLOUDINARY_URL}"
  NEXT_PUBLIC_FIREBASE_API_KEY = "${NEXT_PUBLIC_FIREBASE_API_KEY}"
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = "${NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN}"
  NEXT_PUBLIC_FIREBASE_PROJECT_ID = "${NEXT_PUBLIC_FIREBASE_PROJECT_ID}"
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET = "${NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET}"
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = "${NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID}"
  NEXT_PUBLIC_FIREBASE_APP_ID = "${NEXT_PUBLIC_FIREBASE_APP_ID}"
  STRIPE_SECRET_KEY = "${STRIPE_SECRET_KEY}"
  STRIPE_PUBLISHABLE_KEY = "${STRIPE_PUBLISHABLE_KEY}"
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = "${NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY}"

[[plugins]]
  package = "@netlify/plugin-nextjs"

# For API routes
[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/nextjs-server"
  status = 200

# For all other routes
[[redirects]]
  from = "/*"
  to = "/.netlify/functions/nextjs-server"
  status = 200
  force = true
EOL

echo "Netlify configuration updated for serverless deployment!" 