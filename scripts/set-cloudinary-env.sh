#!/bin/bash
# Script to set Cloudinary environment variables for JackerBox

echo "Setting Cloudinary environment variables..."

export NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="dgtqpyphg"
export CLOUDINARY_API_KEY="646841252992477"
export CLOUDINARY_API_SECRET="Zxu873QWGlD6cYq2gB9cqFO6wG0"

echo "✅ Cloudinary environment variables set successfully!"
echo "Cloud Name: $NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME"
echo "API Key: $CLOUDINARY_API_KEY"
echo ""
echo "To use these variables in your current shell session, run:"
echo "source ./scripts/set-cloudinary-env.sh" 