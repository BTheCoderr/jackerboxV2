#!/bin/bash

# Make the script executable
chmod +x setup-ui.sh

# Run the UI setup script to create the UI components
echo "Creating UI components..."
./setup-ui.sh

# Check if the UI components were created successfully
echo "Verifying UI components..."
node check-ui-components.js
if [ $? -ne 0 ]; then
  echo "Error: UI components verification failed. Please check the output above."
  exit 1
fi

# Deploy to Vercel
echo "Deploying to Vercel..."
vercel deploy --prod

echo "Deployment completed!" 