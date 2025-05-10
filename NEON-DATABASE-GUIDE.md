# Fixing Neon Database Auto-Suspend Issues

This guide provides multiple approaches to handle Neon's database auto-suspend feature and offers alternatives if you prefer to switch to a different database provider.

## Understanding Neon's Auto-Suspend Feature

Neon automatically suspends databases after a period of inactivity (5 minutes on free tier) to save resources. While this helps reduce costs, it can cause connection issues in applications that aren't designed to handle these interruptions.

## Option 1: Improve Your Application's Resilience to Auto-Suspend

We've created several tools in this repository to help your application handle Neon's auto-suspend feature:

1. **Connection Pool with Retry Logic**: Use `src/lib/db-connection.js` to create a connection pool that automatically retries connections when the database wakes up.

2. **Prisma Client with Retry Logic**: Use `src/lib/prisma-with-retry.js` for a Prisma-specific implementation that handles reconnection.

3. **Setup Script**: Run `node setup-neon-connection.js` to configure your environment variables and test your connection.

### How to Implement:

1. Replace your direct Prisma usage with our enhanced version:

```javascript
// Before:
import { db } from '@/lib/db'

// After:
import prisma from '@/lib/prisma-with-retry'
```

2. Update your code to use the enhanced client:

```javascript
// Before:
const users = await db.user.findMany();

// After:
const users = await prisma.user.findMany();
```

## Option 2: Disable Auto-Suspend in Neon Dashboard

For production applications, you may want to disable auto-suspend completely:

1. Go to https://console.neon.tech/app/projects/
2. Select your project
3. Click on "Branches" and select your branch
4. Go to the "Computes" tab
5. Click "Edit" on your compute
6. Uncheck "Scale to zero" to keep your compute always running
7. Save your changes

Note: This option will use more compute time, which may increase costs on paid plans.

## Option 3: Switch to a Different Database Provider

If Neon's auto-suspend feature doesn't work for your use case, consider these alternatives:

### 1. Supabase PostgreSQL

Supabase provides a PostgreSQL database that doesn't suspend on their paid plans.

**Setup Steps:**
1. Create an account at https://supabase.com/
2. Create a new project
3. Get your connection string from the "Settings" > "Database" section
4. Update your application's DATABASE_URL to use the Supabase connection string

**Pros:**
- Stable, always-on connection
- Additional features like auth, storage, and realtime subscriptions
- Compatible with Prisma

### 2. Railway PostgreSQL

Railway offers PostgreSQL databases with simple deployment and pricing.

**Setup Steps:**
1. Create an account at https://railway.app/
2. Create a new PostgreSQL database
3. Get your connection string from the "Connect" tab
4. Update your application's DATABASE_URL to use the Railway connection string

**Pros:**
- Simple pricing
- Always-on connection
- Easy to set up

### 3. Local PostgreSQL (for Development)

For development purposes, you can run PostgreSQL locally.

**Setup Steps:**
1. Install PostgreSQL from https://www.postgresql.org/download/
2. Create a database for your project
3. Update your application's DATABASE_URL to use localhost:
   ```
   DATABASE_URL=postgresql://postgres:password@localhost:5432/jackerbox
   ```

**Pros:**
- No internet connection needed
- No suspension issues
- Fast local development

## Migrating from Neon to Another Database

If you decide to switch databases:

1. Export your data from Neon:
   ```bash
   pg_dump -h ep-fancy-wind-a5ymnajb.us-east-2.aws.neon.tech -U jackerboxDB_owner -d jackerboxDB -f jackerbox_backup.sql
   ```

2. Import to your new database:
   ```bash
   psql -h your_new_host -U your_new_user -d your_new_database -f jackerbox_backup.sql
   ```

3. Update your application's DATABASE_URL to point to the new database

## Need More Help?

Run our interactive setup script to configure your application:

```bash
node setup-neon-connection.js
```

This script will walk you through setting up your database connection with proper configuration for handling Neon's auto-suspend feature. 