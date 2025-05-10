import { NextResponse } from 'next/server';
import { NextApiRequest, NextApiResponse } from 'next';
import { ZodError, ZodSchema } from 'zod';
import { getToken } from 'next-auth/jwt';
import { performanceMonitor } from './performance';

// Utility for consistent API responses with compression
export function apiResponse(data: any, status = 200) {
  // Remove null and undefined values
  const cleanData = compressResponse(data);

  return NextResponse.json(cleanData, {
    status,
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      'Content-Type': 'application/json',
    },
  });
}

// Error handler with proper status codes and monitoring
export function apiError(message: string, status = 500) {
  // Log error for monitoring
  console.error(`API Error: ${message}`);
  performanceMonitor.measureSync('api_error', () => ({
    message,
    status,
    timestamp: new Date().toISOString()
  }));

  return NextResponse.json(
    { error: message },
    {
      status,
      headers: {
        'Cache-Control': 'no-store',
        'Content-Type': 'application/json',
      },
    }
  );
}

// Timeout wrapper for async operations with performance monitoring
export function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Operation timed out')), timeoutMs)
  );

  return performanceMonitor.measure(
    'operation_timeout',
    () => Promise.race([promise, timeoutPromise])
  );
}

// Rate limiting configuration with adaptive limits
const rateLimit = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // default limit
  highLoad: {
    max: 50,
    threshold: 0.8 // CPU threshold for reducing limit
  }
};

// In-memory store for rate limiting with cleanup
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Cleanup old rate limit records every hour
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(ip);
    }
  }
}, 60 * 60 * 1000);

// Rate limiting middleware with adaptive limits
export function checkRateLimit(ip: string): boolean {
  return performanceMonitor.measureSync('rate_limit_check', () => {
    const now = Date.now();
    const record = rateLimitStore.get(ip);

    // Get current system load
    const currentLoad = process.cpuUsage();
    const isHighLoad = (currentLoad.user + currentLoad.system) / (process.uptime() * 1000) > rateLimit.highLoad.threshold;
    const currentLimit = isHighLoad ? rateLimit.highLoad.max : rateLimit.max;

    if (!record) {
      rateLimitStore.set(ip, {
        count: 1,
        resetTime: now + rateLimit.windowMs
      });
      return true;
    }

    if (now > record.resetTime) {
      record.count = 1;
      record.resetTime = now + rateLimit.windowMs;
      return true;
    }

    if (record.count >= currentLimit) {
      return false;
    }

    record.count++;
    return true;
  });
}

// API route wrapper with validation, rate limiting, and error handling
export function withApiHandler<T>(
  handler: (
    req: NextApiRequest,
    res: NextApiResponse,
    validatedData?: T
  ) => Promise<void>,
  schema?: ZodSchema<T>,
  options: {
    methods?: string[];
    requireAuth?: boolean;
    rateLimit?: boolean;
  } = {}
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const handlerName = handler.name || 'anonymous_handler';
    
    return performanceMonitor.measure(`api_handler_${handlerName}`, async () => {
      try {
        // Method validation
        if (options.methods && !options.methods.includes(req.method || '')) {
          return res.status(405).json({
            error: `Method ${req.method} Not Allowed`
          });
        }

        // Rate limiting
        if (options.rateLimit) {
          const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
          if (typeof ip === 'string' && !checkRateLimit(ip)) {
            return res.status(429).json({
              error: 'Too Many Requests'
            });
          }
        }

        // Authentication check
        if (options.requireAuth) {
          const token = await getToken({ req });
          if (!token) {
            return res.status(401).json({
              error: 'Unauthorized'
            });
          }
        }

        // Request validation
        let validatedData: T | undefined;
        if (schema) {
          validatedData = schema.parse(req.body);
        }

        // Execute handler with timeout and compression
        await withTimeout(
          handler(req, res, validatedData),
          10000 // 10 second timeout
        );

        // Compress response if not already handled
        if (!res.headersSent) {
          res.setHeader('Content-Type', 'application/json');
          return res.json(compressResponse(res.body));
        }
      } catch (error) {
        console.error('API Error:', error);

        if (error instanceof ZodError) {
          return res.status(400).json({
            error: 'Validation Error',
            details: error.errors
          });
        }

        if (error instanceof Error) {
          return res.status(500).json({
            error: 'Internal Server Error',
            message: error.message
          });
        }

        return res.status(500).json({
          error: 'Internal Server Error'
        });
      }
    });
  };
}

// Response compression helper with performance monitoring
export function compressResponse(data: any) {
  return performanceMonitor.measureSync('response_compression', () => {
    // Remove undefined and null values
    const clean = (obj: any): any => {
      if (Array.isArray(obj)) {
        return obj.map(clean);
      }
      
      if (obj && typeof obj === 'object') {
        return Object.fromEntries(
          Object.entries(obj)
            .filter(([_, v]) => v != null)
            .map(([k, v]) => [k, clean(v)])
        );
      }
      
      return obj;
    };

    return clean(data);
  });
}

// Cache control helper with performance monitoring
export function setCacheControl(res: NextApiResponse, type: 'public' | 'private' | 'no-store') {
  return performanceMonitor.measureSync('set_cache_control', () => {
    const headers = {
      public: 'public, max-age=60, s-maxage=60, stale-while-revalidate=300',
      private: 'private, no-cache, no-store, must-revalidate',
      'no-store': 'no-store, no-cache, must-revalidate, proxy-revalidate'
    };

    res.setHeader('Cache-Control', headers[type]);
  });
}

// Update the response type
export function sendResponse<T>(
  res: NextApiResponse,
  data: T,
  status = 200
): void {
  res.status(status).json(data);
} 