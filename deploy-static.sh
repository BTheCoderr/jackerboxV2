#!/bin/bash
set -e

echo "Starting static export deployment..."

# Make setup-ui.sh executable
chmod +x setup-ui.sh

# Run setup-ui.sh to create UI components
echo "Creating UI components..."
./setup-ui.sh

# Verify UI components exist
echo "Verifying UI components..."
if [ -f "src/components/ui/button.tsx" ] && [ -f "src/components/ui/card.tsx" ] && [ -f "src/components/ui/alert.tsx" ]; then
  echo "UI components verified successfully!"
else
  echo "Error: UI components not found!"
  exit 1
fi

# Create a simplified .env.production.local file
echo "Creating simplified environment variables..."
cat > .env.production.local << EOL
# Essential environment variables for static build
DATABASE_URL="postgresql://jackerboxDB_owner:npg_vYM7Pg4ERIAk@ep-fancy-wind-a5ymnajb-pooler.us-east-2.aws.neon.tech/jackerboxDB?sslmode=require"
DIRECT_DATABASE_URL="postgresql://jackerboxDB_owner:npg_vYM7Pg4ERIAk@ep-fancy-wind-a5ymnajb-pooler.us-east-2.aws.neon.tech/jackerboxDB?sslmode=require"
NEXTAUTH_URL="https://jackerbox.netlify.app"
NEXTAUTH_SECRET="jKHGF67sdfGHJK78sdfghjkHGF678sdfghjkJHGF67"
NEXT_PUBLIC_STATIC_ONLY="true"
EOL

# Build the project with static export
echo "Building the project with static export..."
NODE_OPTIONS='--max-old-space-size=4096' npm run build

# Create a simple index.html for API routes
echo "Creating API routes placeholder..."
mkdir -p out/api
cat > out/api/index.html << EOL
<!DOCTYPE html>
<html>
<head>
  <title>API Routes</title>
  <meta charset="utf-8">
</head>
<body>
  <h1>API Routes</h1>
  <p>This is a static export. API routes are not available in this deployment.</p>
</body>
</html>
EOL

# Deploy to Netlify
echo "Deploying to Netlify..."
netlify deploy --prod --dir=out

echo "Static export deployment completed!" 