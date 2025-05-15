# JackerBox Error Monitoring Plan

This document outlines the strategy for implementing robust error monitoring in the JackerBox application.

## Current State

Currently, JackerBox has basic error handling in place, primarily using `console.error` for logging errors. There's no centralized error tracking or alerting system in place.

## Error Monitoring Goals

1. Capture and track all errors across the application
2. Provide detailed context for debugging
3. Alert the team about critical issues
4. Track error trends over time
5. Prioritize fixes based on impact

## Implementation Strategy

### 1. Set Up Sentry Integration

[Sentry](https://sentry.io/) is a popular error monitoring service that works well with Next.js applications.

#### Installation

```bash
npm install @sentry/nextjs
```

#### Configuration

Create a Sentry setup file at `src/lib/monitoring/sentry.ts`:

```typescript
// src/lib/monitoring/sentry.ts
import * as Sentry from '@sentry/nextjs';

export const initSentry = () => {
  if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      environment: process.env.NODE_ENV,
      // Performance monitoring
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      // Session replay for debugging user interactions
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
    });
  }
};

// Custom error capture with additional context
export const captureError = (error: Error, context: Record<string, any> = {}) => {
  console.error(error);
  
  if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    Sentry.captureException(error, {
      extra: context,
    });
  }
};

// Track custom events
export const trackEvent = (name: string, data: Record<string, any> = {}) => {
  if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    Sentry.captureMessage(name, {
      level: 'info',
      extra: data,
    });
  }
};
```

#### Next.js Integration

Create Sentry configuration files in the root directory:

```javascript
// sentry.client.config.js
import { initSentry } from './src/lib/monitoring/sentry';
initSentry();

// sentry.server.config.js
import { initSentry } from './src/lib/monitoring/sentry';
initSentry();

// sentry.edge.config.js (for middleware and edge functions)
import { initSentry } from './src/lib/monitoring/sentry';
initSentry();
```

### 2. Create Error Handling Utilities

Create a centralized error handling utility:

```typescript
// src/lib/monitoring/error-handler.ts
import { captureError } from './sentry';

// API route error handler
export function handleApiError(error: any, req: Request, customMessage?: string) {
  const errorId = Math.random().toString(36).substring(7);
  
  // Extract useful information from the request
  const url = req.url;
  const method = req.method;
  
  // Log the error with context
  captureError(error, {
    errorId,
    url,
    method,
    customMessage,
  });
  
  // Return a standardized error response
  return new Response(
    JSON.stringify({
      error: customMessage || 'Internal Server Error',
      errorId, // Include the ID for support reference
    }),
    {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
}

// Client-side error handler
export function handleClientError(error: any, componentName?: string, customMessage?: string) {
  const errorId = Math.random().toString(36).substring(7);
  
  captureError(error, {
    errorId,
    componentName,
    customMessage,
  });
  
  return {
    errorId,
    message: customMessage || 'An unexpected error occurred',
  };
}

// Database operation error handler
export function handleDbError(error: any, operation: string, data?: any) {
  const errorId = Math.random().toString(36).substring(7);
  
  captureError(error, {
    errorId,
    operation,
    data: JSON.stringify(data),
  });
  
  return {
    errorId,
    message: `Database operation failed: ${operation}`,
  };
}
```

### 3. Implement Global Error Boundaries

Create a global error boundary component:

```typescript
// src/components/error-boundary.tsx
'use client';

import { useEffect } from 'react';
import { captureError } from '@/lib/monitoring/sentry';

interface ErrorBoundaryProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorBoundary({ error, reset }: ErrorBoundaryProps) {
  useEffect(() => {
    // Log the error to Sentry
    captureError(error, {
      component: 'GlobalErrorBoundary',
    });
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
        <h2 className="text-2xl font-bold text-red-600 mb-4">Something went wrong!</h2>
        <p className="text-gray-700 mb-4">
          We've been notified about this issue and are working to fix it.
        </p>
        {error.digest && (
          <p className="text-sm text-gray-500 mb-4">
            Error ID: {error.digest}
          </p>
        )}
        <button
          onClick={reset}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
```

Set up the global error component in your `app/error.tsx`:

```typescript
// src/app/error.tsx
import ErrorBoundary from '@/components/error-boundary';
export { ErrorBoundary as default };
```

### 4. API Route Error Handling

Update API routes to use the error handler:

```typescript
// Example API route with error handling
import { handleApiError } from '@/lib/monitoring/error-handler';

export async function GET(req: Request) {
  try {
    // Route logic here
    return Response.json({ success: true });
  } catch (error) {
    return handleApiError(error, req, 'Failed to process request');
  }
}
```

### 5. Database Operation Error Handling

Enhance database operations with error handling:

```typescript
// Example database service
import { db } from '@/lib/db';
import { handleDbError } from '@/lib/monitoring/error-handler';

export async function getEquipmentById(id: string) {
  try {
    return await db.equipment.findUnique({
      where: { id },
      include: { owner: true },
    });
  } catch (error) {
    handleDbError(error, 'getEquipmentById', { id });
    throw new Error('Failed to fetch equipment');
  }
}
```

### 6. Client-Side Error Handling

Add error handling to client components:

```typescript
'use client';

import { useState, useEffect } from 'react';
import { handleClientError } from '@/lib/monitoring/error-handler';

export function EquipmentSearch() {
  const [error, setError] = useState<{ errorId: string; message: string } | null>(null);
  
  const handleSearch = async (searchTerm: string) => {
    try {
      // Search logic
    } catch (err) {
      const errorInfo = handleClientError(err, 'EquipmentSearch', 'Failed to search equipment');
      setError(errorInfo);
    }
  };
  
  return (
    <div>
      {/* Component UI */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error.message}
          <span className="text-xs block">Error ID: {error.errorId}</span>
        </div>
      )}
    </div>
  );
}
```

### 7. Transaction Monitoring

Set up transaction monitoring for key user flows:

```typescript
// src/lib/monitoring/transactions.ts
import * as Sentry from '@sentry/nextjs';

export const startTransaction = (name: string, operation: string) => {
  if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    return Sentry.startTransaction({
      name,
      op: operation,
    });
  }
  return null;
};

// Example usage in a booking flow:
export async function createBooking(data: any) {
  const transaction = startTransaction('Create Booking', 'booking.create');
  
  try {
    // Booking creation logic
    transaction?.finish();
    return result;
  } catch (error) {
    transaction?.setStatus('internal_error');
    transaction?.finish();
    throw error;
  }
}
```

### 8. Error Monitoring Dashboard

Set up a custom error monitoring dashboard in Sentry:

1. Create custom alerts for critical errors
2. Set up weekly error summaries
3. Configure alert channels (email, Slack, etc.)
4. Create custom queries for tracking error trends

## Implementation Steps

1. **Set up Sentry account and get DSN**
   - Create a Sentry project for JackerBox
   - Add the DSN to environment variables

2. **Install Sentry SDK and configure Next.js integration**
   - Install the required packages
   - Create configuration files

3. **Implement error handling utilities**
   - Create centralized error handlers
   - Test error capturing

4. **Update API routes with error handling**
   - Identify all API routes
   - Add standardized error handling

5. **Add error boundaries to key pages**
   - Set up global error boundary
   - Add page-specific error handling where needed

6. **Configure monitoring for key transactions**
   - Identify critical user flows
   - Add transaction monitoring

7. **Set up alerts and notifications**
   - Configure alert rules in Sentry
   - Set up notification channels

## Success Metrics

- **Error discovery time**: How quickly are errors identified after they occur?
- **Resolution time**: How long does it take to fix identified errors?
- **Error reduction**: Are we reducing the number of errors over time?
- **User impact**: Are fewer users experiencing errors?

## Additional Considerations

- **Privacy**: Ensure no PII is captured in error reports
- **Performance**: Monitor the performance impact of error tracking
- **Cost**: Keep an eye on Sentry usage to manage costs
- **Data retention**: Configure appropriate data retention policies 