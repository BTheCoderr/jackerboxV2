#!/bin/bash

# Set terminal colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== JackerBox Environment Value Updater ===${NC}"
echo "This script will update your .env files with your actual Neon and Upstash values"

# Check if environment files exist
if [ ! -f .env.local ] || [ ! -f .env.production ]; then
  echo -e "${RED}Error: .env.local or .env.production file is missing${NC}"
  echo "Please run ./scripts/create-env-files.sh first"
  exit 1
fi

# Get Neon PostgreSQL credentials
echo -e "\n${YELLOW}Neon PostgreSQL Credentials${NC}"
echo "Enter your Neon PostgreSQL connection string (should look like postgresql://username:password@host/database?sslmode=require)"
read -p "Connection String: " NEON_URL

if [ -z "$NEON_URL" ]; then
  echo -e "${RED}Error: Connection string is required${NC}"
  exit 1
fi

# Get Upstash Redis credentials
echo -e "\n${YELLOW}Upstash Redis Credentials${NC}"
echo "Enter your Upstash Redis connection URL (should look like rediss://default:password@hostname:6379)"
read -p "Redis URL: " REDIS_URL

if [ -z "$REDIS_URL" ]; then
  echo -e "${RED}Error: Redis URL is required${NC}"
  exit 1
fi

echo "Enter your Upstash Redis API token"
read -p "API Token: " API_TOKEN

if [ -z "$API_TOKEN" ]; then
  echo -e "${RED}Error: API token is required${NC}"
  exit 1
fi

echo "Enter your Upstash Redis read-only API token"
read -p "Read-only API Token: " READONLY_TOKEN

if [ -z "$READONLY_TOKEN" ]; then
  echo -e "${RED}Error: Read-only API token is required${NC}"
  exit 1
fi

echo "Enter your Upstash Redis API URL (should look like https://your-instance.upstash.io)"
read -p "API URL: " API_URL

if [ -z "$API_URL" ]; then
  echo -e "${RED}Error: API URL is required${NC}"
  exit 1
fi

# Get production domain
echo -e "\n${YELLOW}Production Settings${NC}"
read -p "Production Domain (e.g., https://jackerbox.com): " PROD_DOMAIN

# Update .env.local
echo -e "\n${YELLOW}Updating .env.local...${NC}"
sed -i "" "s|DATABASE_URL=.*|DATABASE_URL=\"$NEON_URL\"|g" .env.local
sed -i "" "s|DIRECT_DATABASE_URL=.*|DIRECT_DATABASE_URL=\"$NEON_URL\"|g" .env.local
sed -i "" "s|KV_URL=.*|KV_URL=\"$REDIS_URL\"|g" .env.local
sed -i "" "s|REDIS_URL=.*|REDIS_URL=\"$REDIS_URL\"|g" .env.local
sed -i "" "s|KV_REST_API_TOKEN=.*|KV_REST_API_TOKEN=\"$API_TOKEN\"|g" .env.local
sed -i "" "s|KV_REST_API_READ_ONLY_TOKEN=.*|KV_REST_API_READ_ONLY_TOKEN=\"$READONLY_TOKEN\"|g" .env.local
sed -i "" "s|KV_REST_API_URL=.*|KV_REST_API_URL=\"$API_URL\"|g" .env.local

# Update .env.production
echo -e "${YELLOW}Updating .env.production...${NC}"
sed -i "" "s|DATABASE_URL=.*|DATABASE_URL=\"$NEON_URL\"|g" .env.production
sed -i "" "s|DIRECT_DATABASE_URL=.*|DIRECT_DATABASE_URL=\"$NEON_URL\"|g" .env.production
sed -i "" "s|KV_URL=.*|KV_URL=\"$REDIS_URL\"|g" .env.production
sed -i "" "s|REDIS_URL=.*|REDIS_URL=\"$REDIS_URL\"|g" .env.production
sed -i "" "s|KV_REST_API_TOKEN=.*|KV_REST_API_TOKEN=\"$API_TOKEN\"|g" .env.production
sed -i "" "s|KV_REST_API_READ_ONLY_TOKEN=.*|KV_REST_API_READ_ONLY_TOKEN=\"$READONLY_TOKEN\"|g" .env.production
sed -i "" "s|KV_REST_API_URL=.*|KV_REST_API_URL=\"$API_URL\"|g" .env.production

if [ ! -z "$PROD_DOMAIN" ]; then
  sed -i "" "s|NEXTAUTH_URL=.*|NEXTAUTH_URL=\"$PROD_DOMAIN\"|g" .env.production
fi

echo -e "${GREEN}Environment files updated successfully!${NC}"

echo -e "\n${YELLOW}Next steps:${NC}"
echo "1. Run 'npx prisma generate' to generate the Prisma client"
echo "2. Run 'npx prisma migrate deploy' to apply database migrations"
echo "3. Start your development server with 'npm run dev'" 