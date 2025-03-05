# Jackerbox Deployment Guide

This guide provides instructions on how to deploy the Jackerbox application to Netlify.

## Prerequisites

- Node.js (v18 or later)
- npm (v8 or later)
- Netlify CLI (`npm install -g netlify-cli`)
- A Netlify account

## Deployment Options

There are two main deployment options:

1. **Static Export Deployment** (Recommended)
2. **Serverless Deployment** (Not currently working reliably)

## Option 1: Static Export Deployment (Recommended)

This option creates a static export of the application, which is simpler to deploy but doesn't support API routes.

### Steps:

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/jackerbox.git
   cd jackerbox
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the static deployment script:
   ```bash
   chmod +x deploy-static.sh
   ./deploy-static.sh
   ```

This script will:
- Create UI components
- Configure environment variables
- Update Next.js config for static export
- Build the application
- Deploy to Netlify

### What to Expect:

- The application will be deployed as a static site
- API routes will not be functional
- The site will be accessible at `https://jackerbox.netlify.app` (or your custom domain)

### Configuration Details:

The static export approach requires the following configuration:

1. In `next.config.mjs`:
   ```javascript
   output: 'export',
   images: {
     unoptimized: true,
   },
   trailingSlash: true,
   experimental: {
     serverActions: false
   },
   ```

2. In `netlify.toml`:
   ```toml
   [build]
     command = "chmod +x setup-ui.sh && ./setup-ui.sh && NODE_OPTIONS='--max-old-space-size=4096' npm run build"
     publish = "out"

   # For client-side routing with Next.js static export
   [[redirects]]
     from = "/*"
     to = "/index.html"
     status = 200
   ```

## Option 2: Serverless Deployment (Not Recommended)

The serverless deployment option is currently not working reliably with the Netlify Next.js plugin. If you need API routes, consider deploying to Vercel instead.

## Troubleshooting

### Static Export Limitations

When using the static export approach, be aware of these limitations:

1. No API routes available
2. Server components are statically generated at build time
3. Server actions are not available
4. All data must be fetched at build time

### 404 Errors

If you're getting 404 errors after deployment:

1. Check the Netlify redirects in `netlify.toml`
2. Make sure the `[[redirects]]` section is correctly configured for client-side routing

## Monitoring and Logs

- Build logs: `https://app.netlify.com/sites/jackerbox/deploys/[deploy-id]`
- Function logs: `https://app.netlify.com/sites/jackerbox/logs/functions` (only for serverless deployment)

## Conclusion

The static export deployment is recommended for simplicity and reliability. If you need full functionality with API routes, consider deploying to Vercel instead.

For more information, refer to the [Netlify documentation](https://docs.netlify.com/) and the [Next.js documentation](https://nextjs.org/docs/deployment). 