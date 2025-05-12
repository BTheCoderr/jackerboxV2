#!/bin/bash

# Production Test Script for JackerBox
# This script prepares and tests a production build locally

# Set terminal colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== JackerBox Production Test ===${NC}"
echo -e "${YELLOW}This script will prepare and test a production build locally${NC}"
echo ""

# Check if .env.production exists
if [ ! -f .env.production ]; then
  echo -e "${RED}Error: .env.production file not found${NC}"
  echo "Please create a .env.production file with your production environment variables"
  exit 1
fi

# Copy .env.production to .env.local for testing
echo -e "${YELLOW}Copying .env.production to .env.local for testing...${NC}"
cp .env.production .env.local

# Install dependencies
echo -e "${YELLOW}Installing dependencies...${NC}"
npm install

# Generate Prisma client
echo -e "${YELLOW}Generating Prisma client...${NC}"
npx prisma generate

# Build the application
echo -e "${YELLOW}Building the application...${NC}"
npm run build

if [ $? -eq 0 ]; then
  echo -e "${GREEN}Build successful!${NC}"
else
  echo -e "${RED}Build failed!${NC}"
  exit 1
fi

# Start the application in production mode
echo -e "${YELLOW}Starting the application in production mode...${NC}"
echo -e "${YELLOW}Press Ctrl+C to stop the server when testing is complete${NC}"
npm start

# Restore original .env.local if it existed
if [ -f .env.local.backup ]; then
  echo -e "${YELLOW}Restoring original .env.local...${NC}"
  mv .env.local.backup .env.local
fi

echo -e "${GREEN}Test complete!${NC}" 