import fs from 'node:fs';
import path from 'node:path';

const read = (file: string) => fs.readFileSync(path.join(process.cwd(), file), 'utf8');

describe('JackerBox public registration rate limits', () => {
  test('redis never falls back to credentials embedded in source code', () => {
    const source = read('src/lib/redis.ts');
    expect(source).not.toContain('prime-ostrich');
    expect(source).not.toMatch(/(?:url|token):\s*process\.env\.[\w]+\s*\|\|\s*['"]https?:/);
    expect(source).not.toMatch(/(?:url|token):\s*process\.env\.[\w]+\s*\|\|\s*['"][A-Za-z0-9_-]{20,}/);
    expect(source).toContain('export const redis: Redis | null');
  });

  test('signup limits both client and email in shared Redis', () => {
    const route = read('src/app/api/auth/register/route.ts');
    expect(route).toContain('Ratelimit.slidingWindow(8, "1 h")');
    expect(route).toContain('Ratelimit.slidingWindow(3, "1 h")');
    expect(route).toContain('signupsPerAddress.limit(');
    expect(route).toContain('signupsPerEmail.limit(');
    expect(route).toContain('x-nf-client-connection-ip');
    expect(route).toContain('createHash("sha256").update(email)');
  });

  test('a missing or unavailable distributed limiter rejects signup', () => {
    const route = read('src/app/api/auth/register/route.ts');
    expect(route).toContain('if (!signupsPerAddress || !signupsPerEmail)');
    expect(route).toContain('status: 503');
    expect(route).toContain('status: 429');
    expect(route).toContain('"Retry-After"');
    const gating = route.indexOf('const denied = await guardSignup(req, email)');
    const write = route.indexOf('await db.user.create(');
    expect(gating).toBeGreaterThan(0);
    expect(gating).toBeLessThan(write);
  });
});
