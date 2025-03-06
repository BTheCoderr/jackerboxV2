# Jackerbox Serverless Deployment Guide

This guide explains how to deploy your Jackerbox application as a serverless application on Netlify, with full API functionality.

## What is Serverless Deployment?

Serverless deployment allows your application to run without managing server infrastructure. Each API route and server component in your Next.js application is converted into a serverless function that runs on demand.

Benefits:
- Full API functionality
- Server-side rendering
- Dynamic data fetching
- Authentication and authorization
- Database connections

## Prerequisites

Before deploying, ensure you have:

1. A GitHub account with your Jackerbox repository
2. All environment variables ready (database URLs, API keys, etc.)
3. Netlify CLI installed (`npm install -g netlify-cli`)
4. Netlify Next.js plugin installed (`npm install -D @netlify/plugin-nextjs`)

## Deployment Steps

We've set up scripts to make the deployment process easy:

1. **Prepare for Serverless Deployment**:
   - Update `next.config.mjs` to support serverless deployment
   - Create `netlify.toml` with serverless configuration
   - Remove Vercel-specific dependencies

2. **Deploy to Netlify**:
   ```bash
   node scripts/deploy-serverless.js
   ```
   This script:
   - Installs necessary dependencies
   - Builds your application
   - Deploys to Netlify as a serverless application

3. **Set Up Environment Variables**:
   ```bash
   node scripts/setup-netlify-env.js
   ```
   This script:
   - Reads your local `.env` file
   - Sets up environment variables in Netlify
   - Triggers a new deployment to apply the variables

## How It Works

The Netlify Next.js plugin (`@netlify/plugin-nextjs`) handles the conversion of your Next.js application to serverless functions:

1. **API Routes**: Each API route becomes a serverless function
2. **Server Components**: Server components are rendered on-demand
3. **Database Connections**: Your database connections work as expected
4. **Authentication**: NextAuth.js works with your serverless functions

## Troubleshooting

### API Routes Not Working

If your API routes aren't working:

1. Check the Function logs in Netlify dashboard
2. Verify environment variables are set correctly
3. Make sure the Netlify Next.js plugin is installed

### Database Connection Issues

If you're having database connection issues:

1. Check your `DATABASE_URL` and `DIRECT_DATABASE_URL` environment variables
2. Verify your database is accessible from Netlify's servers
3. Check the Function logs for specific error messages

### Build Failures

If your build is failing:

1. Check the build logs in Netlify dashboard
2. Verify your Next.js configuration is correct
3. Make sure all dependencies are installed

## Managing Your Deployment

You can manage your deployment through the Netlify dashboard:

- **Environment Variables**: https://app.netlify.com/sites/jackerbox/settings/env
- **Domain Settings**: https://app.netlify.com/sites/jackerbox/settings/domain
- **Build Settings**: https://app.netlify.com/sites/jackerbox/settings/deploys
- **Function Logs**: https://app.netlify.com/sites/jackerbox/logs/functions

## Updating Your Deployment

To update your deployment:

1. Make changes to your code
2. Commit and push to GitHub
3. Netlify will automatically rebuild and deploy your application

Or manually trigger a deployment:

```bash
netlify deploy --prod
```

## Conclusion

Your Jackerbox application is now deployed as a serverless application on Netlify, with full API functionality. You can access your site at https://jackerbox.netlify.app and manage it through the Netlify dashboard.

For more information, refer to the [Netlify documentation](https://docs.netlify.com/) and the [Next.js on Netlify documentation](https://docs.netlify.com/integrations/frameworks/next-js/overview/). 