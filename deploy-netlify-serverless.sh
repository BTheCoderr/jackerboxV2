#!/bin/bash
set -e

echo "Starting serverless deployment process..."

# Ensure UI components are created
echo "Creating UI components in src/components/ui..."
if [ -f "./setup-ui.sh" ]; then
  chmod +x ./setup-ui.sh
  ./setup-ui.sh
  echo "UI components created successfully."
else
  echo "setup-ui.sh not found. Skipping UI component creation."
fi

# Ensure environment variables are set up
echo "Setting up environment variables..."
if [ ! -f ".env.production.local" ]; then
  echo "Creating .env.production.local file..."
  cp .env.example .env.production.local
  echo "Please update .env.production.local with your production values before continuing."
  exit 1
fi

# Build the project
echo "Building the project..."
NODE_OPTIONS="--max-old-space-size=4096" npm run build

# Deploy to Netlify
echo "Deploying to Netlify..."
netlify deploy --prod

echo "Serverless deployment process completed!" 