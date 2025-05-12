#!/bin/bash

# Colors for console output
GREEN="\033[0;32m"
YELLOW="\033[0;33m"
BLUE="\033[0;34m"
RED="\033[0;31m"
NC="\033[0m" # No Color

echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}   Jackerbox Vercel Deployment Script    ${NC}"
echo -e "${BLUE}=========================================${NC}"

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${RED}Vercel CLI not found. Installing...${NC}"
    npm install -g vercel
else
    echo -e "${GREEN}Vercel CLI is installed.${NC}"
fi

# Ensure dependencies are installed
echo -e "${YELLOW}Ensuring all dependencies are installed...${NC}"
npm install

# Ensure Upstash Redis is installed
if ! grep -q "@upstash/redis" package.json; then
    echo -e "${YELLOW}Installing Upstash Redis SDK...${NC}"
    npm install @upstash/redis --save
else
    echo -e "${GREEN}Upstash Redis SDK is already installed.${NC}"
fi

# Ensure Redis adapter is installed
if ! grep -q "@socket.io/redis-adapter" package.json; then
    echo -e "${YELLOW}Installing Socket.IO Redis adapter...${NC}"
    npm install @socket.io/redis-adapter --save
else
    echo -e "${GREEN}Socket.IO Redis adapter is already installed.${NC}"
fi

# Check for Vercel environment variables file
if [ ! -f ".vercel/project.json" ]; then
    echo -e "${YELLOW}You need to link this project to Vercel first.${NC}"
    echo -e "${YELLOW}Running 'vercel link'...${NC}"
    vercel link
else
    echo -e "${GREEN}Project is already linked to Vercel.${NC}"
fi

# Pull environment variables from Vercel
echo -e "${YELLOW}Pulling environment variables from Vercel...${NC}"
vercel env pull .env.local

# Prompt for Upstash Redis variables
echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}   Upstash Redis Configuration   ${NC}"
echo -e "${BLUE}=========================================${NC}"
echo -e "${YELLOW}Do you want to update the Upstash Redis environment variables? (y/n)${NC}"
read -r update_redis

if [ "$update_redis" = "y" ]; then
    echo -e "${YELLOW}Enter your KV_URL (from Upstash):${NC}"
    read -r kv_url
    
    echo -e "${YELLOW}Enter your KV_REST_API_TOKEN (from Upstash):${NC}"
    read -r kv_token
    
    echo -e "${YELLOW}Enter your KV_REST_API_READ_ONLY_TOKEN (from Upstash):${NC}"
    read -r kv_read_only_token
    
    echo -e "${YELLOW}Enter your KV_REST_API_URL (from Upstash):${NC}"
    read -r kv_api_url
    
    # Set Vercel environment variables
    echo -e "${YELLOW}Setting Vercel environment variables...${NC}"
    vercel env add KV_URL production <<< "$kv_url"
    vercel env add REDIS_URL production <<< "$kv_url"
    vercel env add KV_REST_API_TOKEN production <<< "$kv_token"
    vercel env add KV_REST_API_READ_ONLY_TOKEN production <<< "$kv_read_only_token"
    vercel env add KV_REST_API_URL production <<< "$kv_api_url"
    
    # Also set for development and preview
    vercel env add KV_URL development <<< "$kv_url"
    vercel env add REDIS_URL development <<< "$kv_url"
    vercel env add KV_REST_API_TOKEN development <<< "$kv_token"
    vercel env add KV_REST_API_READ_ONLY_TOKEN development <<< "$kv_read_only_token"
    vercel env add KV_REST_API_URL development <<< "$kv_api_url"
    
    vercel env add KV_URL preview <<< "$kv_url"
    vercel env add REDIS_URL preview <<< "$kv_url"
    vercel env add KV_REST_API_TOKEN preview <<< "$kv_token"
    vercel env add KV_REST_API_READ_ONLY_TOKEN preview <<< "$kv_read_only_token"
    vercel env add KV_REST_API_URL preview <<< "$kv_api_url"
fi

# Set NEXT_PUBLIC_DISABLE_SOCKET to false
echo -e "${YELLOW}Enabling socket connections...${NC}"
vercel env add NEXT_PUBLIC_DISABLE_SOCKET production <<< "false"
vercel env add NEXT_PUBLIC_DISABLE_SOCKET development <<< "false"
vercel env add NEXT_PUBLIC_DISABLE_SOCKET preview <<< "false"

# Build the project
echo -e "${YELLOW}Building the project...${NC}"
npm run build

# Deploy to Vercel
echo -e "${YELLOW}Deploying to Vercel...${NC}"
vercel --prod

echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}   Deployment Complete!   ${NC}"
echo -e "${GREEN}=========================================${NC}"
echo -e "${BLUE}Next steps:${NC}"
echo -e "${BLUE}1. Visit your Vercel deployment URL${NC}"
echo -e "${BLUE}2. Test the Redis connection at /api/redis-test${NC}"
echo -e "${BLUE}3. Verify that socket connections are working${NC}" 