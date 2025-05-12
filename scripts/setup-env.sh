#!/bin/bash

# Set terminal colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== JackerBox Environment Setup ===${NC}"
echo "This script will help you set up your environment files (.env.local and .env.production)"

# Check if an environment file exists
if [ -f .env.local ]; then
  echo -e "${YELLOW}Warning: .env.local already exists${NC}"
  read -p "Do you want to create a backup? (y/n) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    cp .env.local .env.local.backup
    echo -e "${GREEN}Backup created as .env.local.backup${NC}"
  fi
fi

# Ask for database credentials
echo -e "\n${YELLOW}Neon PostgreSQL Settings${NC}"
read -p "Neon Database Username: " DB_USER
read -p "Neon Database Password: " DB_PASS
read -p "Neon Database Host: " DB_HOST
read -p "Neon Database Name: " DB_NAME

# Ask for Upstash credentials
echo -e "\n${YELLOW}Upstash Redis Settings${NC}"
read -p "Upstash Redis URL: " REDIS_URL
read -p "Upstash API Token: " API_TOKEN
read -p "Upstash Read-Only API Token: " READONLY_TOKEN
read -p "Upstash API URL: " API_URL

# Ask for NextAuth secret
echo -e "\n${YELLOW}Authentication Settings${NC}"
read -p "NextAuth Secret (or press enter to generate one): " AUTH_SECRET

if [ -z "$AUTH_SECRET" ]; then
  AUTH_SECRET=$(openssl rand -base64 32)
  echo -e "${GREEN}Generated NextAuth Secret: ${AUTH_SECRET}${NC}"
fi

# Ask for production domain
echo -e "\n${YELLOW}Production Settings${NC}"
read -p "Production Domain (e.g., https://jackerbox.com): " PROD_DOMAIN

# Create .env.local file
cat > .env.local << EOF
# Database Configuration - Neon PostgreSQL
DATABASE_URL="postgresql://${DB_USER}:${DB_PASS}@${DB_HOST}/${DB_NAME}?sslmode=require"
DIRECT_DATABASE_URL="postgresql://${DB_USER}:${DB_PASS}@${DB_HOST}/${DB_NAME}?sslmode=require"

# Upstash Redis Configuration
KV_URL="${REDIS_URL}"
REDIS_URL="${REDIS_URL}"
KV_REST_API_TOKEN="${API_TOKEN}"
KV_REST_API_READ_ONLY_TOKEN="${READONLY_TOKEN}"
KV_REST_API_URL="${API_URL}"

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
DATABASE_URL="postgresql://${DB_USER}:${DB_PASS}@${DB_HOST}/${DB_NAME}?sslmode=require"
DIRECT_DATABASE_URL="postgresql://${DB_USER}:${DB_PASS}@${DB_HOST}/${DB_NAME}?sslmode=require"

# Upstash Redis Configuration
KV_URL="${REDIS_URL}"
REDIS_URL="${REDIS_URL}"
KV_REST_API_TOKEN="${API_TOKEN}"
KV_REST_API_READ_ONLY_TOKEN="${READONLY_TOKEN}"
KV_REST_API_URL="${API_URL}"

# Authentication
NEXTAUTH_URL="${PROD_DOMAIN}"
NEXTAUTH_SECRET="${AUTH_SECRET}"

# Other services
NODE_ENV="production"
EOF

echo -e "${GREEN}.env.production file created successfully${NC}"
echo -e "\n${YELLOW}Next steps:${NC}"
echo "1. Review the created environment files"
echo "2. Run 'npx prisma generate' to generate the Prisma client"
echo "3. Start your development server with 'npm run dev'"
echo "4. For production deployment, use 'npm run build' and 'npm start'" 