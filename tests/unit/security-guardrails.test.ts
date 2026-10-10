import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const content = (file: string) => fs.readFileSync(path.join(root, file), 'utf8');

describe('JackerBox security regression checks', () => {
  test.each([
    '.env.backup', '.env.production', '.env.cloud',
    'public/_redirects',
    'src/app/api/test/update-verification/route.ts',
    'src/app/api/redis-test/route.ts',
    'src/app/api/payments/test-intent/route.ts',
    'src/app/api/create-test-payment/route.ts',
  ])('%s is absent from deployable source', (file) => {
    expect(fs.existsSync(path.join(root, file))).toBe(false);
  });

  test('no hardcoded connection tokens or secrets in next config', () => {
    const cfg = content('next.config.js');
    expect(cfg).not.toMatch(/prime-ostrich|KV_REST_API_TOKEN\s*:\s*['"]/);
    expect(cfg).not.toContain('NEXTAUTH_SECRET: process.env');
  });

  test('browser-supplied rental pricing is not trusted', () => {
    const route = content('src/app/api/rentals/route.ts');
    expect(route).toContain('calculateRentalPrice(rate, start, end, rentalType)');
    expect(route).toContain('TransactionIsolationLevel.Serializable');
    expect(route).not.toContain('parseFloat(totalPrice)');
  });

  test('Stripe intent amount comes from stored rental values', () => {
    const route = content('src/app/api/payments/create-intent/route.ts');
    expect(route).toContain('rental.totalPrice + (rental.securityDeposit ?? 0)');
    expect(route).not.toContain('amount: z.number().positive()');
  });

  test('Stripe webhooks always validate signatures', () => {
    const route = content('src/app/api/webhooks/stripe/route.ts');
    expect(route).toContain('stripe.webhooks.constructEvent');
    expect(route).not.toContain('Allowing webhook despite signature issues');
  });

  test('unverified user document cannot self-approve identity', () => {
    const route = content('src/app/api/users/verify-id-basic/route.ts');
    expect(route).toContain('idVerified: false');
  });
});
