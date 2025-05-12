#!/bin/bash

# Set terminal colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== JackerBox Environment Setup ===${NC}"
echo "This script will create your .env.local and .env.production files"

# Check if environment files exist
if [ -f .env.local ]; then
  echo -e "${YELLOW}Warning: .env.local already exists${NC}"
  read -p "Do you want to create a backup? (y/n) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    cp .env.local .env.local.backup
    echo -e "${GREEN}Backup created as .env.local.backup${NC}"
  fi
fi

if [ -f .env.production ]; then
  echo -e "${YELLOW}Warning: .env.production already exists${NC}"
  read -p "Do you want to create a backup? (y/n) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    cp .env.production .env.production.backup
    echo -e "${GREEN}Backup created as .env.production.backup${NC}"
  fi
fi

# Create a secure NextAuth secret
AUTH_SECRET=$(openssl rand -base64 32)
echo -e "${GREEN}Generated NextAuth Secret: ${AUTH_SECRET}${NC}"

# Create .env.local file with actual Upstash Redis and Neon PostgreSQL values
cat > .env.local << EOF
# Database Configuration - Neon PostgreSQL
# Replace with your actual Neon database credentials
DATABASE_URL="postgresql://username:password@host/database?sslmode=require"
DIRECT_DATABASE_URL="postgresql://username:password@host/database?sslmode=require"

# Upstash Redis Configuration
# Replace with your actual Upstash Redis credentials
KV_URL="rediss://default:password@hostname:6379"
REDIS_URL="rediss://default:password@hostname:6379"
KV_REST_API_TOKEN="your_api_token"
KV_REST_API_READ_ONLY_TOKEN="your_readonly_token"
KV_REST_API_URL="https://your-instance.upstash.io"

# Authentication
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="${AUTH_SECRET}"

# Other services
NODE_ENV="development"
EOF

echo -e "${GREEN}.env.local file created successfully${NC}"

# Create .env.production file
cat > .env.production << EOF
# Database Configuration - Neon PostgreSQL
# Replace with your actual Neon database credentials
DATABASE_URL="postgresql://username:password@host/database?sslmode=require"
DIRECT_DATABASE_URL="postgresql://username:password@host/database?sslmode=require"

# Upstash Redis Configuration
# Replace with your actual Upstash Redis credentials
KV_URL="rediss://default:password@hostname:6379"
REDIS_URL="rediss://default:password@hostname:6379"
KV_REST_API_TOKEN="your_api_token"
KV_REST_API_READ_ONLY_TOKEN="your_readonly_token"
KV_REST_API_URL="https://your-instance.upstash.io"

# Authentication
NEXTAUTH_URL="https://your-production-domain.com"
NEXTAUTH_SECRET="${AUTH_SECRET}"

# Other services
NODE_ENV="production"
EOF

echo -e "${GREEN}.env.production file created successfully${NC}"

echo -e "\n${YELLOW}IMPORTANT: Next steps${NC}"
echo "1. Edit both .env files and replace the placeholders with your actual values from:"
echo "   - Neon PostgreSQL dashboard (for DATABASE_URL and DIRECT_DATABASE_URL)"
echo "   - Upstash Redis dashboard (for Redis connection details)"
echo "2. In .env.production, update NEXTAUTH_URL with your actual production domain"
echo "3. Run 'npx prisma generate' to generate the Prisma client"
echo "4. Run 'npx prisma migrate deploy' to apply database migrations"
echo "5. Start your development server with 'npm run dev'" 