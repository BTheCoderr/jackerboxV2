#!/bin/bash

# Set terminal colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== JackerBox Environment Templates ===${NC}"
echo "This script will create template environment files (.env.local and .env.production)"

# Check if environment files exist
if [ -f .env.local ]; then
  echo -e "${YELLOW}Warning: .env.local already exists${NC}"
  read -p "Do you want to overwrite it? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}Skipping .env.local creation${NC}"
    local_skip=true
  else
    cp .env.local .env.local.backup
    echo -e "${GREEN}Backup created as .env.local.backup${NC}"
  fi
fi

if [ -f .env.production ]; then
  echo -e "${YELLOW}Warning: .env.production already exists${NC}"
  read -p "Do you want to overwrite it? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}Skipping .env.production creation${NC}"
    prod_skip=true
  else
    cp .env.production .env.production.backup
    echo -e "${GREEN}Backup created as .env.production.backup${NC}"
  fi
fi

# Create .env.local template
if [ "$local_skip" != true ]; then
  cat > .env.local << EOF
# Database Configuration - Neon PostgreSQL
DATABASE_URL="postgresql://username:password@host/database?sslmode=require"
DIRECT_DATABASE_URL="postgresql://username:password@host/database?sslmode=require"

# Upstash Redis Configuration
KV_URL="rediss://default:password@hostname:6379"
REDIS_URL="rediss://default:password@hostname:6379"
KV_REST_API_TOKEN="your_api_token"
KV_REST_API_READ_ONLY_TOKEN="your_readonly_token"
KV_REST_API_URL="https://your-instance.upstash.io"

# Authentication
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your_nextauth_secret"

# Other services
NODE_ENV="development"
EOF

  echo -e "${GREEN}.env.local template created successfully${NC}"
  echo -e "${YELLOW}→ Edit .env.local and replace the placeholders with your actual values${NC}"
fi

# Create .env.production template
if [ "$prod_skip" != true ]; then
  cat > .env.production << EOF
# Database Configuration - Neon PostgreSQL
DATABASE_URL="postgresql://username:password@host/database?sslmode=require"
DIRECT_DATABASE_URL="postgresql://username:password@host/database?sslmode=require"

# Upstash Redis Configuration
KV_URL="rediss://default:password@hostname:6379"
REDIS_URL="rediss://default:password@hostname:6379"
KV_REST_API_TOKEN="your_api_token"
KV_REST_API_READ_ONLY_TOKEN="your_readonly_token"
KV_REST_API_URL="https://your-instance.upstash.io"

# Authentication
NEXTAUTH_URL="https://your-production-domain.com"
NEXTAUTH_SECRET="your_nextauth_secret"

# Other services
NODE_ENV="production"
EOF

  echo -e "${GREEN}.env.production template created successfully${NC}"
  echo -e "${YELLOW}→ Edit .env.production and replace the placeholders with your actual values${NC}"
fi

echo -e "\n${YELLOW}Next steps:${NC}"
echo "1. Edit the environment files with your actual credentials"
echo "2. Run 'npx prisma generate' to generate the Prisma client"
echo "3. Run 'npx prisma migrate deploy' to apply database migrations"
echo "4. Start your development server with 'npm run dev'" 