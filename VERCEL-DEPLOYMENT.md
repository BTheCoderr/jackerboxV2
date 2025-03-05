# Jackerbox Vercel Deployment Guide

This guide provides instructions for deploying your Jackerbox application to Vercel.

## Prerequisites

Before deploying, ensure you have:

1. A GitHub account with your Jackerbox repository
2. All environment variables ready (database URLs, API keys, etc.)
3. All UI components are properly created in your repository

## Preparation Steps (Already Completed)

We've already prepared your application for Vercel deployment by:

1. **Verifying Database Connection**: Confirmed that the Neon PostgreSQL database is accessible and working correctly.

2. **Updating Next.js Configuration**: Modified `next.config.mjs` to optimize for Vercel deployment:
   - Removed the `standalone` output setting (not needed for Vercel)
   - Configured images for optimization

3. **Creating Vercel Configuration**: Added a `vercel.json` file with:
   - Build commands
   - Region configuration
   - Security headers
   - Caching policies

4. **Adding Dynamic Exports**: Added `export const dynamic = 'force-dynamic'` to server components that need it.

5. **Testing the Build**: Successfully ran a build to ensure everything compiles correctly.

## Handling Secrets Securely

⚠️ **Important**: Never commit sensitive information like API keys, passwords, or tokens to your repository.

1. **Use Environment Variables**:
   - Store all secrets in `.env` files locally
   - Add `.env*` files to your `.gitignore`
   - Set up these variables in the Vercel dashboard

2. **Check for Secrets Before Pushing**:
   - Run `node scripts/clean-secrets.js` to scan for potential secrets
   - Remove any hardcoded secrets found in your code
   - Replace them with environment variable references

3. **If GitHub Blocks Your Push**:
   - GitHub has secret scanning protection that may block pushes containing secrets
   - Follow the URL provided by GitHub to review the detected secrets
   - Remove the secrets from your code and try again
   - If they're false positives, you can follow GitHub's instructions to allow them

## Deploying to Vercel

1. **Push your changes to GitHub**:
   ```bash
   git add .
   git commit -m "Prepare for Vercel deployment"
   git push
   ```

2. **Connect your repository to Vercel**:
   - Go to [Vercel](https://vercel.com/) and sign in
   - Click "Add New" > "Project"
   - Import your GitHub repository
   - Select the Jackerbox repository

3. **Configure project settings**:
   - Framework Preset: Next.js
   - Build Command: `npm run build --no-lint`
   - Output Directory: `.next` (default)
   - Install Command: `npm install`

4. **Environment Variables**:
   Add the following environment variables:
   - `DATABASE_URL`: Your Neon PostgreSQL connection string
   - `DIRECT_DATABASE_URL`: Your direct Neon PostgreSQL connection string
   - `NEXTAUTH_URL`: Your Vercel deployment URL (e.g., `https://jackerbox.vercel.app`)
   - `NEXTAUTH_SECRET`: Your NextAuth secret
   - `STRIPE_SECRET_KEY`: Your Stripe secret key
   - `STRIPE_PUBLISHABLE_KEY`: Your Stripe publishable key
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`: Your Stripe publishable key (for client-side)
   - `STRIPE_WEBHOOK_SECRET`: Your Stripe webhook secret
   - `STRIPE_IDENTITY_WEBHOOK_SECRET`: Your Stripe identity webhook secret
   - `STRIPE_ACCOUNT_COUNTRY`: US
   - `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`: Your Cloudinary cloud name
   - `CLOUDINARY_API_KEY`: Your Cloudinary API key
   - `CLOUDINARY_API_SECRET`: Your Cloudinary API secret
   - `CLOUDINARY_URL`: Your Cloudinary URL
   - `AWS_REGION`: Your AWS region
   - `AWS_ACCESS_KEY_ID`: Your AWS access key ID
   - `AWS_SECRET_ACCESS_KEY`: Your AWS secret access key
   - `AWS_S3_BUCKET_NAME`: Your S3 bucket name
   - `NEXT_PUBLIC_FIREBASE_API_KEY`: Your Firebase API key
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`: Your Firebase auth domain
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`: Your Firebase project ID
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`: Your Firebase storage bucket
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`: Your Firebase messaging sender ID
   - `NEXT_PUBLIC_FIREBASE_APP_ID`: Your Firebase app ID

5. **Deploy**:
   - Click "Deploy"
   - Wait for the build to complete

## Post-Deployment Steps

1. **Update Webhook URLs**:
   - Update your Stripe webhook URLs to point to your Vercel deployment
   - Update any other external service webhook URLs

2. **Test the Application**:
   - Test all major functionality
   - Verify that authentication works
   - Check that database operations work correctly
   - Test file uploads and image processing

3. **Set Up Custom Domain** (Optional):
   - In Vercel, go to your project settings
   - Click on "Domains"
   - Add your custom domain
   - Follow the instructions to configure DNS

## Troubleshooting

### Database Connection Issues

If you encounter database connection issues:

1. Verify your `DATABASE_URL` and `DIRECT_DATABASE_URL` are correctly set
2. Check that your IP is allowed in Neon's connection settings
3. Ensure your database user has the correct permissions

### Build Failures

If your build fails:

1. Check the build logs for specific errors
2. Ensure all dependencies are correctly installed
3. Verify that your Next.js configuration is correct
4. Make sure all environment variables are properly set

### Runtime Errors

If you encounter runtime errors:

1. Check the Vercel logs for error details
2. Verify that all API routes are working correctly
3. Check that server components are properly configured with `dynamic = 'force-dynamic'`

### GitHub Push Protection Issues

If GitHub blocks your push due to detected secrets:

1. Review the detected secrets in the error message
2. Remove any actual secrets from your code
3. Use environment variables instead of hardcoded values
4. If they're false positives, follow the URL provided by GitHub to allow them

## Monitoring and Logs

- **Vercel Dashboard**: Monitor your application's performance and errors
- **Function Logs**: View logs for serverless functions
- **Build Logs**: Review build logs for any issues

## Need Help?

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Documentation](https://nextjs.org/docs/deployment)
- [Prisma with Vercel Guide](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-vercel) 