# Jackerbox Vercel Deployment Guide

This guide explains how to deploy your Jackerbox application to Vercel with full API functionality.

## Why Vercel?

Vercel is the platform created by the team behind Next.js and offers the best integration with Next.js applications:

- **Native Support**: Built specifically for Next.js
- **API Routes**: All API routes work out-of-the-box
- **Server Components**: Full support for React Server Components
- **Simplicity**: Minimal configuration required

## Prerequisites

Before deploying, ensure you have:

1. A GitHub account with your Jackerbox repository
2. All environment variables ready (database URLs, API keys, etc.)
3. Vercel CLI installed (`npm install -g vercel`)

## Deployment Steps

We've set up a script to make the deployment process easy:

```bash
node scripts/deploy-to-vercel.js
```

This script:
1. Installs necessary dependencies
2. Updates your layout file to include Vercel analytics
3. Builds your application
4. Deploys to Vercel with your environment variables

## Manual Deployment Steps

If you prefer to deploy manually:

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Build your application**:
   ```bash
   npm run build
   ```

3. **Deploy to Vercel**:
   ```bash
   vercel --prod
   ```

4. **Set up environment variables**:
   - In the Vercel dashboard, go to your project settings
   - Click on "Environment Variables"
   - Add all your environment variables from your `.env` file

## Environment Variables

Ensure these critical environment variables are set in Vercel:

- `DATABASE_URL`: Your Neon PostgreSQL connection string
- `DIRECT_DATABASE_URL`: Your direct database connection string
- `NEXTAUTH_URL`: Your Vercel deployment URL (e.g., `https://jackerbox.vercel.app`)
- `NEXTAUTH_SECRET`: Your NextAuth secret
- `STRIPE_SECRET_KEY`: Your Stripe secret key
- `STRIPE_PUBLISHABLE_KEY`: Your Stripe publishable key
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`: Your Stripe publishable key (for client-side)
- `CLOUDINARY_API_KEY`: Your Cloudinary API key
- `CLOUDINARY_API_SECRET`: Your Cloudinary API secret
- `AWS_ACCESS_KEY_ID`: Your AWS access key ID
- `AWS_SECRET_ACCESS_KEY`: Your AWS secret access key

## Troubleshooting

### API Routes Not Working

If your API routes aren't working:

1. Check the Function logs in Vercel dashboard
2. Verify environment variables are set correctly
3. Make sure your database is accessible from Vercel's servers

### Database Connection Issues

If you're having database connection issues:

1. Check your `DATABASE_URL` and `DIRECT_DATABASE_URL` environment variables
2. Verify your database is accessible from Vercel's servers
3. Check the Function logs for specific error messages

### Build Failures

If your build is failing:

1. Check the build logs in Vercel dashboard
2. Verify your Next.js configuration is correct
3. Make sure all dependencies are installed

## Managing Your Deployment

You can manage your deployment through the Vercel dashboard:

- **Environment Variables**: Project Settings > Environment Variables
- **Domain Settings**: Project Settings > Domains
- **Build Settings**: Project Settings > Build & Development Settings
- **Function Logs**: Deployments > [Latest Deployment] > Functions

## Updating Your Deployment

To update your deployment:

1. Make changes to your code
2. Commit and push to GitHub (Vercel will automatically rebuild and deploy)
3. Or manually trigger a deployment with `vercel --prod`

## Conclusion

Your Jackerbox application should now be deployed to Vercel with full API functionality. You can access your site at the URL provided by Vercel and manage it through the Vercel dashboard.

For more information, refer to the [Vercel documentation](https://vercel.com/docs) and the [Next.js documentation](https://nextjs.org/docs/deployment). 