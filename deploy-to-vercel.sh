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

# Check for potential secrets in the codebase
echo "🔍 Checking for potential secrets in the codebase..."
if git diff --cached | grep -E "(API_KEY|SECRET|PASSWORD|TOKEN|OAUTH|CLIENT_ID|CLIENT_SECRET)" > /dev/null; then
    echo "⚠️ WARNING: Potential secrets detected in your changes!"
    echo "   Please review your changes carefully before committing."
    echo "   Consider using environment variables instead of hardcoding secrets."
    echo "   You can use .env files locally and set up environment variables in Vercel."
    
    read -p "Do you want to continue with the commit? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "🛑 Commit aborted. Please remove secrets from your code and try again."
        exit 1
    fi
    
    echo "⚠️ Proceeding with commit despite potential secrets. Use caution!"
fi

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
        echo "⚠️ NOTE: If GitHub blocks your push due to detected secrets, you'll need to:"
        echo "   1. Remove the secrets from your code"
        echo "   2. Use environment variables instead"
        echo "   3. Or follow the provided GitHub URL to allow the secrets if they're not real secrets"
        git push || {
            echo "❌ Push failed. This might be due to GitHub's secret detection."
            echo "   If GitHub detected secrets, you have these options:"
            echo "   1. Remove the secrets from your code and commit again"
            echo "   2. Follow the URL provided by GitHub to allow the push if they're not real secrets"
            echo "   3. Deploy directly to Vercel without pushing to GitHub first"
            
            read -p "Do you want to deploy directly to Vercel without pushing to GitHub? (y/n) " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                echo "🚀 Proceeding with direct Vercel deployment..."
            else
                echo "🛑 Deployment process paused. Fix the issues and run this script again."
                exit 1
            fi
        }
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