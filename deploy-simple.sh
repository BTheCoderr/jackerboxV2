#!/bin/bash

# Make the script executable
chmod +x setup-ui.sh

# Run the UI setup script to create the UI components
echo "Creating UI components..."
./setup-ui.sh

# Deploy to Vercel with a specific name
echo "Deploying to Vercel..."
vercel deploy --prod --name jackerbox-simple 