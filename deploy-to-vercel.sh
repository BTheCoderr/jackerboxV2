#!/bin/bash
set -e

echo "🚀 Starting Jackerbox Vercel Deployment Process..."

# Check if Git is installed
if ! command -v git &> /dev/null; then
    echo "❌ Git is not installed. Please install Git and try again."
    exit 1
fi

# Check if we're in a Git repository
if ! git rev-parse --is-inside-work-tree &> /dev/null; then
    echo "❌ Not in a Git repository. Please run this script from your Jackerbox project directory."
    exit 1
fi

# Run the preparation script
echo "🔧 Running Vercel preparation script..."
node scripts/prepare-for-vercel.js

# Check if there are any changes to commit
if [[ -n $(git status --porcelain) ]]; then
    echo "📝 Committing changes..."
    git add .
    git commit -m "Prepare for Vercel deployment"
    
    # Ask if user wants to push changes
    read -p "Do you want to push changes to GitHub? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "🔼 Pushing changes to GitHub..."
        git push
    else
        echo "⏸️ Skipping push to GitHub. You'll need to push manually later."
    fi
else
    echo "✅ No changes to commit. Your project is already prepared for Vercel."
fi

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "⚠️ Vercel CLI is not installed. Would you like to install it? (y/n)"
    read -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "📦 Installing Vercel CLI..."
        npm install -g vercel
    else
        echo "⚠️ Skipping Vercel CLI installation. You'll need to deploy manually through the Vercel website."
        echo "📋 Follow the instructions in VERCEL-DEPLOYMENT.md to deploy through the Vercel website."
        exit 0
    fi
fi

# Ask if user wants to deploy using Vercel CLI
echo "🚀 Would you like to deploy to Vercel now? (y/n)"
read -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🚀 Deploying to Vercel..."
    vercel
    
    echo "✅ Deployment initiated! Follow the instructions in your terminal to complete the deployment."
    echo "📋 After deployment, don't forget to:"
    echo "   1. Set up all environment variables in the Vercel dashboard"
    echo "   2. Update webhook URLs to point to your Vercel deployment"
    echo "   3. Test all functionality after deployment"
else
    echo "⏸️ Skipping deployment. You can deploy later using 'vercel' command or through the Vercel website."
    echo "📋 Follow the instructions in VERCEL-DEPLOYMENT.md to deploy manually."
fi

echo "🎉 Preparation complete! Your project is ready for Vercel deployment." 