# Jackerbox Deployment Guide

This guide will help you deploy your Jackerbox application to either Vercel or Netlify.

## Prerequisites

Before deploying, make sure you have:

1. A GitHub account with your Jackerbox repository
2. A Prisma Accelerate API key (or a direct database connection)
3. All environment variables ready

## Deploying to Vercel

### Step 1: Connect Your Repository

1. Go to [Vercel](https://vercel.com/) and sign in with your GitHub account
2. Click "Add New..." and select "Project"
3. Import your Jackerbox repository
4. Select the "Next.js" framework preset

### Step 2: Configure Environment Variables

Vercel will automatically detect your `vercel.json` file, but you should verify the environment variables:

1. In the Vercel dashboard, go to your project settings
2. Navigate to the "Environment Variables" section
3. Verify that all required environment variables are set:
   - `DATABASE_URL` (Prisma Accelerate URL)
   - `DIRECT_DATABASE_URL` (Direct database connection)
   - `NEXTAUTH_URL` (Your Vercel deployment URL)
   - `NEXTAUTH_SECRET`
   - Cloudinary credentials
   - Firebase credentials
   - Stripe credentials

### Step 3: Deploy

1. Click "Deploy" and wait for the build to complete
2. Vercel will automatically run your `vercel-build.sh` script

## Deploying to Netlify

### Step 1: Connect Your Repository

1. Go to [Netlify](https://netlify.com/) and sign in with your GitHub account
2. Click "Add new site" and select "Import an existing project"
3. Connect to your GitHub repository

### Step 2: Configure Build Settings

1. Set the build command to `./vercel-build.sh`
2. Set the publish directory to `.next`
3. Add the Netlify Next.js plugin

### Step 3: Configure Environment Variables

1. In the Netlify dashboard, go to your site settings
2. Navigate to "Build & deploy" > "Environment"
3. Add all required environment variables:
   - `DATABASE_URL` (Prisma Accelerate URL)
   - `DIRECT_DATABASE_URL` (Direct database connection)
   - `NEXTAUTH_URL` (Your Netlify deployment URL)
   - `NEXTAUTH_SECRET`
   - Cloudinary credentials
   - Firebase credentials
   - Stripe credentials

### Step 4: Deploy

1. Click "Deploy site" and wait for the build to complete

## Troubleshooting

### Missing UI Components

If you encounter errors about missing UI components:

1. Make sure your `vercel-build.sh` script is executable:
   ```bash
   chmod +x vercel-build.sh
   ```

2. Verify that the script is creating all required UI components:
   - Button
   - Card
   - Alert
   - CloudinaryImage
   - CloudinaryUpload

### Database Connection Issues

If you encounter database connection errors:

1. Check that your Prisma Accelerate API key is correct
2. Verify that your direct database connection string is valid
3. Make sure your Prisma schema is compatible with Prisma Accelerate

### Missing formatDate Function

If you encounter errors about missing functions:

1. Check that all required utility functions are exported from `src/lib/utils.ts`
2. Verify that the function signatures match what's expected in your components

## Vercel vs. Netlify

### Vercel Advantages
- Native Next.js support
- Better performance for Next.js applications
- Simpler configuration for Next.js projects

### Netlify Advantages
- More flexible build options
- Better support for static sites
- More generous free tier

Choose the platform that best fits your needs and budget.

## Monitoring Your Deployment

After deploying, monitor your application for any issues:

1. Check the deployment logs for errors
2. Test all critical functionality
3. Monitor database performance
4. Set up alerts for any critical errors

## Updating Your Deployment

To update your deployment:

1. Push changes to your GitHub repository
2. Both Vercel and Netlify will automatically rebuild and deploy your application

## Need Help?

If you encounter any issues with your deployment, refer to:

- [Vercel Documentation](https://vercel.com/docs)
- [Netlify Documentation](https://docs.netlify.com/)
- [Prisma Accelerate Documentation](https://www.prisma.io/docs/data-platform/accelerate/getting-started) 