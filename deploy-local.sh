#!/bin/bash

# Make sure the UI setup script is executable
chmod +x setup-ui.sh

# Run the UI setup script to create the UI components
./setup-ui.sh

# Build the project locally
echo "Building the project locally..."
npm run build

# Create a zip file of the build
echo "Creating a zip file of the build..."
zip -r build.zip .next

echo "Build completed and zipped."
echo "You can now manually upload build.zip to your hosting provider."
echo "For Netlify, you can drag and drop this file to the Netlify dashboard." 