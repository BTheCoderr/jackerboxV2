#!/bin/bash

# Make sure the UI setup script is executable
chmod +x setup-ui.sh

# Run the UI setup script to create the UI components
./setup-ui.sh

# Check if Netlify CLI is installed
if ! command -v netlify &> /dev/null; then
    echo "Netlify CLI not found. Installing..."
    npm install -g netlify-cli
fi

# Deploy to Netlify
echo "Deploying to Netlify..."
netlify deploy --prod 