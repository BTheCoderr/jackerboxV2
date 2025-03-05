# Prisma Accelerate Setup Guide

This guide will help you set up and use Prisma Accelerate with your Jackerbox application.

## What is Prisma Accelerate?

[Prisma Accelerate](https://www.prisma.io/docs/data-platform/accelerate/getting-started) is a connection pooling service that improves database performance and reliability. It provides:

- Connection pooling to reduce database load
- Global caching to improve query performance
- Edge-optimized database access for faster response times
- Automatic query optimization

## Setup Instructions

### 1. Generate a Prisma Accelerate API Key

1. Sign up or log in to the [Prisma Data Platform](https://cloud.prisma.io)
2. Create a new project
3. When prompted for your database connection string, use your direct database URL from your `.env` file
4. Follow the instructions to generate an API key

### 2. Configure Your Application

Run the provided setup script:

```bash
node generate-prisma-accelerate-key.js
```

When prompted, enter your Prisma Accelerate API key. The script will:
- Test the connection to ensure it works
- Update your environment files with the correct configuration
- Configure your deployment settings

### 3. Test Your Connection

To test both direct and Prisma Accelerate connections:

```bash
node test-connection-methods.js
```

### 4. Prepare for Deployment

Run the deployment preparation script:

```bash
node deploy-with-accelerate.js
```

This script will guide you through configuring your application for deployment to Vercel, Netlify, or a custom platform.

## Configuration Files

The following files are used for Prisma Accelerate configuration:

- `.env` - Development environment variables
- `.env.production` - Production environment variables
- `.env.accelerate-test` - Test environment for Prisma Accelerate
- `vercel.json` - Vercel deployment configuration
- `netlify.toml` - Netlify deployment configuration

## Troubleshooting

If you encounter issues with Prisma Accelerate:

1. Verify your API key is correct
2. Check that your database is accessible from Prisma Accelerate
3. Ensure your Prisma schema is compatible with Prisma Accelerate
4. Make sure your application is using the correct DATABASE_URL

For more help, refer to the [Prisma Accelerate documentation](https://www.prisma.io/docs/data-platform/accelerate/getting-started).

## Fallback to Direct Connection

Your application is configured to fall back to a direct database connection if Prisma Accelerate is unavailable. This is handled by the `DIRECT_DATABASE_URL` environment variable.

## Local Development

For local development, you can use either:

1. Direct connection (faster for local development)
   ```
   DATABASE_URL="your_direct_database_connection_string"
   ```

2. Prisma Accelerate (for testing production-like environment)
   ```
   DATABASE_URL="prisma://aws-us-east-2.prisma-data.com/?api_key=YOUR_API_KEY"
   ``` 