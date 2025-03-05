# Jackerbox Deployment Guide (Updated)

This guide provides instructions for deploying your Jackerbox application to Vercel and Netlify.

## Prerequisites

Before deploying, ensure you have:

1. A GitHub account with your Jackerbox repository
2. A Prisma Accelerate API key (see PRISMA-ACCELERATE.md for setup)
3. All environment variables ready (database URLs, API keys, etc.)
4. All UI components are properly created in your repository

## Important: UI Components

Make sure the following UI components exist in your repository before deploying:

- `src/components/ui/button.tsx`
- `src/components/ui/card.tsx`
- `src/components/ui/alert.tsx`
- `src/components/ui/cloudinary-image.tsx`
- `src/components/ui/cloudinary-upload.tsx`

Also ensure that `src/lib/utils.ts` exports the `formatDate` function.

You can run `node check-ui-components.js` to verify these components exist.

## Deploying to Vercel

1. **Connect your repository**:
   - Go to [Vercel](https://vercel.com/) and sign in
   - Click "Add New" > "Project"
   - Import your GitHub repository
   - Select the Jackerbox repository

2. **Configure project**:
   - Framework Preset: Next.js
   - Build Command: `npm run build --no-lint`
   - Output Directory: `.next`
   - Install Command: `npm install`

3. **Environment Variables**:
   - Add all environment variables from your `.env` file
   - Make sure to add `DATABASE_URL` (Prisma Accelerate URL) and `DIRECT_DATABASE_URL`
   - Set `PRISMA_GENERATE_DATAPROXY` to `true`

4. **Deploy**:
   - Click "Deploy"
   - Wait for the build to complete

## Deploying to Netlify

1. **Connect your repository**:
   - Go to [Netlify](https://netlify.com/) and sign in
   - Click "Add new site" > "Import an existing project"
   - Connect to GitHub and select your repository

2. **Configure build settings**:
   - Build command: `npm run build --no-lint`
   - Publish directory: `.next`

3. **Environment Variables**:
   - Go to Site settings > Environment variables
   - Add all environment variables from your `.env` file
   - Make sure to add `DATABASE_URL` (Prisma Accelerate URL) and `DIRECT_DATABASE_URL`
   - Set `PRISMA_GENERATE_DATAPROXY` to `true`

4. **Deploy**:
   - Click "Deploy site"
   - Wait for the build to complete

## Troubleshooting

### Missing UI Components

If you encounter errors about missing UI components:

1. Make sure all UI components are in your repository:
   - `src/components/ui/button.tsx`
   - `src/components/ui/card.tsx`
   - `src/components/ui/alert.tsx`
   - `src/components/ui/cloudinary-image.tsx`
   - `src/components/ui/cloudinary-upload.tsx`

2. Ensure `formatDate` function is exported from `src/lib/utils.ts`

3. Run `node check-ui-components.js` to verify components exist

### Database Connection Errors

If you encounter database connection issues:

1. Verify your `DATABASE_URL` is correctly set to your Prisma Accelerate URL
2. Ensure your `DIRECT_DATABASE_URL` is correctly set as a fallback
3. Check that your Prisma Accelerate API key is valid and not expired

### Build Failures

If your build fails:

1. Check the build logs for specific errors
2. Ensure all dependencies are correctly installed
3. Verify that your Next.js configuration is correct
4. Make sure all environment variables are properly set

## Vercel vs. Netlify

**Vercel Advantages**:
- Native Next.js support (Vercel created Next.js)
- Better performance for Next.js applications
- Simpler configuration for Next.js projects
- Preview deployments for pull requests

**Netlify Advantages**:
- More flexible build options
- Better support for other frameworks
- More generous free tier for some features
- Built-in form handling

## Monitoring Your Deployment

After deployment:

1. Check your application is working correctly
2. Monitor error logs in the Vercel/Netlify dashboard
3. Set up alerts for any critical errors
4. Test all major functionality of your application

## Updating Your Deployment

To update your deployed application:

1. Push changes to your GitHub repository
2. Vercel/Netlify will automatically rebuild and deploy your application
3. Monitor the build logs for any errors

## Need Help?

- [Vercel Documentation](https://vercel.com/docs)
- [Netlify Documentation](https://docs.netlify.com/)
- [Prisma Accelerate Documentation](https://www.prisma.io/data-platform/accelerate) 