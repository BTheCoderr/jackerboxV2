#!/bin/bash

# Set terminal colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

if [ $# -ne 5 ]; then
  echo -e "${RED}Error: Missing parameters${NC}"
  echo "Usage: $0 <neon_url> <redis_url> <api_token> <readonly_token> <api_url>"
  echo "Example:"
  echo "$0 \"postgresql://user:pass@db.neon.tech/dbname\" \"redis://default:pass@host:port\" \"token\" \"readonly_token\" \"https://instance.upstash.io\""
  exit 1
fi

NEON_URL=$1
REDIS_URL=$2
API_TOKEN=$3
READONLY_TOKEN=$4
API_URL=$5

echo -e "${YELLOW}Updating environment files with provided values...${NC}"

# Backup current .env.local if it exists
if [ -f .env.local ]; then
  cp .env.local .env.local.backup
  echo -e "${GREEN}Backed up .env.local to .env.local.backup${NC}"
fi

# Create new .env.local file
cat > .env.local << EOF
# Database Configuration - Neon PostgreSQL
DATABASE_URL="${NEON_URL}"
DIRECT_DATABASE_URL="${NEON_URL}"

# Upstash Redis Configuration
KV_URL="${REDIS_URL}"
REDIS_URL="${REDIS_URL}"
KV_REST_API_TOKEN="${API_TOKEN}"
KV_REST_API_READ_ONLY_TOKEN="${READONLY_TOKEN}"
KV_REST_API_URL="${API_URL}"

# Authentication
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="cpYC5+BS77SLMK7KMhb+9h6Yjoi95BwE7DpWqx+UP+0="

# Other services
NODE_ENV="development"

# Include other settings from .env
# Email Configuration 
RESEND_API_KEY="re_8YEVJDiV_BysahcS65BYkcdXKDpVVEHus"
EMAIL_FROM="noreply@jackerbox.app"

# Stripe (test keys for development)
STRIPE_SECRET_KEY=sk_test_dummy
STRIPE_PUBLISHABLE_KEY=pk_test_dummy
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_dummy

# Cloudinary (for image uploads)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="local-dev"
CLOUDINARY_API_KEY="dummy-key"
CLOUDINARY_API_SECRET="dummy-secret"
EOF

echo -e "${GREEN}Environment file .env.local updated successfully!${NC}"
echo -e "${YELLOW}To apply changes, restart your Next.js development server${NC}" 