import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Redis Configuration
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

// Rate Limiting Configuration
export const rateLimiters = {
  // General API rate limiter
  api: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(
      Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
      Number(process.env.RATE_LIMIT_WINDOW_MS) || 60000
    ),
    analytics: true,
    prefix: 'ratelimit:api',
  }),

  // Authentication rate limiter (stricter)
  auth: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '30s'),
    analytics: true,
    prefix: 'ratelimit:auth',
  }),

  // Message rate limiter
  message: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '60s'),
    analytics: true,
    prefix: 'ratelimit:message',
  }),
};

// Session Configuration
export const sessionConfig = {
  maxAge: Number(process.env.SESSION_MAX_AGE) || 86400, // 24 hours
  updateAge: Number(process.env.SESSION_UPDATE_AGE) || 3600, // 1 hour
};

// Login Security Configuration
export const loginSecurity = {
  maxAttempts: Number(process.env.LOGIN_MAX_ATTEMPTS) || 5,
  lockoutDuration: Number(process.env.LOGIN_LOCKOUT_DURATION) || 3600, // 1 hour
};

// 2FA Configuration
export const twoFactorConfig = {
  issuer: process.env.TWO_FACTOR_ISSUER || 'JackerBox',
  algorithm: process.env.TWO_FACTOR_ALGORITHM || 'sha1',
  digits: Number(process.env.TWO_FACTOR_DIGITS) || 6,
  period: Number(process.env.TWO_FACTOR_PERIOD) || 30,
};

// CSRF Configuration
export const csrfConfig = {
  secret: process.env.CSRF_SECRET || 'default-csrf-secret',
  cookieName: 'csrf-token',
  headerName: 'X-CSRF-Token',
};

// Feature Flags
export const featureFlags = {
  enable2FA: process.env.ENABLE_2FA === 'true',
  enableEmailVerification: process.env.ENABLE_EMAIL_VERIFICATION === 'true',
  enableStripePayments: process.env.ENABLE_STRIPE_PAYMENTS === 'true',
  enableAWSStorage: process.env.ENABLE_AWS_STORAGE === 'true',
};

// Export Redis instance for other uses
export { redis }; 