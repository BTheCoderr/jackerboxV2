#!/bin/bash

# Make sure the vercel-build.sh script is executable
chmod +x vercel-build.sh

# Run the fix-dynamic script to add dynamic exports
npm run fix-dynamic

# Commit the changes
git add .
git commit -m "Fix: Update configuration for server rendering"

# Push to GitHub
git push

echo "Changes pushed to GitHub. Vercel should automatically start a new deployment."
echo "Check your Vercel dashboard at: https://vercel.com/be-forreals-projects/jackerbox"
echo ""
echo "If the deployment doesn't start automatically, you can manually trigger it from the Vercel dashboard." 