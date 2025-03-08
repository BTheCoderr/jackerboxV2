#!/bin/bash

# Switch to mobile configuration
echo "Switching to mobile-optimized configuration..."
cp next.config.mobile.mjs next.config.mjs

# Install required packages
echo "Installing PWA dependencies..."
npm install --save next-pwa

# Clean build cache
echo "Cleaning build cache..."
rm -rf .next

# Build the application
echo "Building mobile-optimized application..."
npm run build

# Start the application
echo "Starting mobile-optimized application..."
npm start
