#!/bin/bash

# Set terminal colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== Pushing Environment Variables to Vercel ===${NC}"

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

echo -e "${YELLOW}Reading environment variables from .env.production...${NC}"

# Extract environment variables from .env.production
while IFS= read -r line; do
  # Skip empty lines and comments
  if [[ -z "$line" || "$line" =~ ^# ]]; then
    continue
  fi
  
  # Extract key and value
  key=$(echo "$line" | cut -d '=' -f 1)
  value=$(echo "$line" | cut -d '=' -f 2- | sed 's/^"//' | sed 's/"$//')
  
  # Skip if key or value is empty
  if [[ -z "$key" || -z "$value" ]]; then
    continue
  fi
  
  echo -e "Adding ${YELLOW}$key${NC} to Vercel"
  
  # Push to Vercel
  vercel env add $key production <<< "$value" > /dev/null
  
done < .env.production

echo -e "${GREEN}Environment variables have been pushed to Vercel!${NC}"
echo -e "${YELLOW}Note: You need to redeploy your application for changes to take effect.${NC}"
echo -e "${YELLOW}Run 'vercel --prod' to deploy to production.${NC}" 