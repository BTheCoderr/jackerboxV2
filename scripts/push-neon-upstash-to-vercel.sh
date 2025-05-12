#!/bin/bash

# Set terminal colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== Pushing Neon and Upstash Settings to Vercel ===${NC}"

# Check if .env.production exists
if [ ! -f .env.production ]; then
  echo -e "${RED}Error: .env.production file not found${NC}"
  exit 1
fi

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
  echo -e "${RED}Error: vercel CLI is not installed. Install it with 'npm install -g vercel'${NC}"
  exit 1
fi

# Check if user is logged into vercel
if ! vercel whoami &> /dev/null; then
  echo -e "${RED}Error: You are not logged into Vercel. Run 'vercel login' first${NC}"
  exit 1
fi

# Check if project is linked to vercel
if [ ! -d .vercel ]; then
  echo -e "${RED}Error: Project is not linked to Vercel. Run 'vercel link' first${NC}"
  exit 1
fi

# Get Neon PostgreSQL connection string from .env.production
NEON_URL=$(grep -E "^DATABASE_URL=" .env.production | cut -d '=' -f 2- | sed 's/^"//' | sed 's/"$//')
DIRECT_DATABASE_URL=$(grep -E "^DIRECT_DATABASE_URL=" .env.production | cut -d '=' -f 2- | sed 's/^"//' | sed 's/"$//')
NEXTAUTH_URL=$(grep -E "^NEXTAUTH_URL=" .env.production | cut -d '=' -f 2- | sed 's/^"//' | sed 's/"$//')
NEXTAUTH_SECRET=$(grep -E "^NEXTAUTH_SECRET=" .env.production | cut -d '=' -f 2- | sed 's/^"//' | sed 's/"$//')

# Get Upstash Redis settings from .env.production
REDIS_URL=$(grep -E "^REDIS_URL=" .env.production | cut -d '=' -f 2- | sed 's/^"//' | sed 's/"$//')
KV_URL=$(grep -E "^KV_URL=" .env.production | cut -d '=' -f 2- | sed 's/^"//' | sed 's/"$//')
KV_REST_API_TOKEN=$(grep -E "^KV_REST_API_TOKEN=" .env.production | cut -d '=' -f 2- | sed 's/^"//' | sed 's/"$//')
KV_REST_API_READ_ONLY_TOKEN=$(grep -E "^KV_REST_API_READ_ONLY_TOKEN=" .env.production | cut -d '=' -f 2- | sed 's/^"//' | sed 's/"$//')
KV_REST_API_URL=$(grep -E "^KV_REST_API_URL=" .env.production | cut -d '=' -f 2- | sed 's/^"//' | sed 's/"$//')

# Show extracted values
echo -e "${BLUE}Found the following values:${NC}"
echo -e "  - ${YELLOW}DATABASE_URL${NC}: $(echo $NEON_URL | cut -c 1-30)..."
echo -e "  - ${YELLOW}REDIS_URL${NC}: $(echo $REDIS_URL | cut -c 1-30)..."
echo -e "  - ${YELLOW}NEXTAUTH_URL${NC}: $NEXTAUTH_URL"

echo -e "\n${YELLOW}Pushing to Vercel...${NC}"

# Push Neon PostgreSQL variables
if [ ! -z "$NEON_URL" ]; then
  echo -e "Adding ${YELLOW}DATABASE_URL${NC} to Vercel"
  vercel env add DATABASE_URL production <<< "$NEON_URL" > /dev/null
else
  echo -e "${RED}Warning: DATABASE_URL not found in .env.production${NC}"
fi

if [ ! -z "$DIRECT_DATABASE_URL" ]; then
  echo -e "Adding ${YELLOW}DIRECT_DATABASE_URL${NC} to Vercel"
  vercel env add DIRECT_DATABASE_URL production <<< "$DIRECT_DATABASE_URL" > /dev/null
fi

# Push Upstash Redis variables
if [ ! -z "$REDIS_URL" ]; then
  echo -e "Adding ${YELLOW}REDIS_URL${NC} to Vercel"
  vercel env add REDIS_URL production <<< "$REDIS_URL" > /dev/null
fi

if [ ! -z "$KV_URL" ]; then
  echo -e "Adding ${YELLOW}KV_URL${NC} to Vercel"
  vercel env add KV_URL production <<< "$KV_URL" > /dev/null
fi

if [ ! -z "$KV_REST_API_TOKEN" ]; then
  echo -e "Adding ${YELLOW}KV_REST_API_TOKEN${NC} to Vercel"
  vercel env add KV_REST_API_TOKEN production <<< "$KV_REST_API_TOKEN" > /dev/null
fi

if [ ! -z "$KV_REST_API_READ_ONLY_TOKEN" ]; then
  echo -e "Adding ${YELLOW}KV_REST_API_READ_ONLY_TOKEN${NC} to Vercel"
  vercel env add KV_REST_API_READ_ONLY_TOKEN production <<< "$KV_REST_API_READ_ONLY_TOKEN" > /dev/null
fi

if [ ! -z "$KV_REST_API_URL" ]; then
  echo -e "Adding ${YELLOW}KV_REST_API_URL${NC} to Vercel"
  vercel env add KV_REST_API_URL production <<< "$KV_REST_API_URL" > /dev/null
fi

# Push NextAuth variables
if [ ! -z "$NEXTAUTH_URL" ]; then
  echo -e "Adding ${YELLOW}NEXTAUTH_URL${NC} to Vercel"
  vercel env add NEXTAUTH_URL production <<< "$NEXTAUTH_URL" > /dev/null
fi

if [ ! -z "$NEXTAUTH_SECRET" ]; then
  echo -e "Adding ${YELLOW}NEXTAUTH_SECRET${NC} to Vercel"
  vercel env add NEXTAUTH_SECRET production <<< "$NEXTAUTH_SECRET" > /dev/null
fi

# Set NODE_ENV to production
echo -e "Adding ${YELLOW}NODE_ENV${NC} to Vercel"
vercel env add NODE_ENV production <<< "production" > /dev/null

echo -e "\n${GREEN}Essential environment variables have been pushed to Vercel!${NC}"
echo -e "${YELLOW}To deploy your application, run:${NC}"
echo -e "  vercel --prod" 