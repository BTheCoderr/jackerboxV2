#!/bin/bash

# Make the script executable
chmod +x setup-ui.sh

# Run the UI setup script to create the UI components
echo "Creating UI components..."
./setup-ui.sh

# Verify that the components were created
echo "Verifying UI components..."
if [ -f "src/components/ui/button.tsx" ] && \
   [ -f "src/components/ui/card.tsx" ] && \
   [ -f "src/components/ui/alert.tsx" ] && \
   [ -f "src/components/ui/cloudinary-image.tsx" ] && \
   [ -f "src/components/ui/cloudinary-upload.tsx" ]; then
  echo "UI components created successfully!"
else
  echo "Error: Some UI components are missing!"
  ls -la src/components/ui/
  exit 1
fi

# Build the project locally
echo "Building the project locally..."
npm run build:simple

# Deploy to Netlify using the CLI
echo "Deploying to Netlify..."
netlify deploy --prod --dir=.next

echo "Deployment completed!" 