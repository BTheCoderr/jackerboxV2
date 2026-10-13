import { Redis } from '@upstash/redis';

// JackerBox's Redis clients are optional until the hosting environment is
// configured. Never fall back to a committed endpoint or credential.
const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
const readOnlyToken = process.env.KV_REST_API_READ_ONLY_TOKEN;

export const redis: Redis | null = url && token
  ? new Redis({ url, token })
  : null;

export const readOnlyRedis: Redis | null = url && readOnlyToken
  ? new Redis({ url, token: readOnlyToken })
  : redis;

// Features that require Redis must check for null and refuse the operation;
// an absent rate-limit backend must never silently disable protection.
