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

  test('equipment photos are stored rather than invented', () => {
    const upload = content('src/app/api/upload/images/route.ts');
    expect(upload).toContain('await uploadImage(buffer');
    expect(upload).toContain('MAX_FILE_SIZE');
    expect(upload).not.toContain('mock-image-id');
    expect(content('src/app/api/upload/route.ts')).toContain('status: 501');
  });

  test('push broadcast requires an administrator and an explicit target', () => {
    const send = content('src/app/api/push/send/route.ts');
    expect(send).toContain('!currentUser?.isAdmin');
    expect(send).toContain('!sendToAll');
    expect(send).toContain("r.value.status === 'success'");
  });

  test('realtime subscription belongs to authenticated user', () => {
    const route = content('src/app/api/sse/route.ts');
    expect(route).toContain('isSSEClientOwnedBy(clientId, user.id)');
    expect(route).toContain("topic.startsWith('public:')");
  });

  test('equipment listings require true photo URLs, not base64 payloads', () => {
    const create = content('src/app/api/equipment/route.ts');
    expect(create).toContain('MIN_REQUIRED_IMAGES = 3');
    expect(create).toContain("new URL(url).protocol === 'https:'");
    const page = content('src/app/routes/equipment/new/page.tsx');
    expect(page).toContain('imagesJson: JSON.stringify(values.images)');
  });
  test('login no longer suggests a phone code signs users in', () => {
    const login = content('src/components/auth/login-form.tsx');
    expect(login).toContain("signIn('credentials'");
    expect(login).not.toContain('type: "phone"');
    expect(login).not.toContain('Development mode: Use code 123456');
  });
  test('no unauthenticated user verification override remains', () => {
    expect(fs.existsSync(path.join(root, 'src/app/api/admin/verify-user/route.ts'))).toBe(false);
  });

  test('presigned storage keys are isolated by authenticated user', () => {
    const route = content('src/app/api/upload/presigned-url/route.ts');
    expect(route).toContain('users/${user.id}');
  });
  test('only canonical NextAuth config is exported; never compare plaintext passwords', () => {
    const entry = content('src/lib/auth.ts');
    expect(entry).toContain("export { authOptions } from './auth/auth-options'");
    expect(entry).not.toContain('user.password === credentials.password');
    const canonical = content('src/lib/auth/auth-options.ts');
    expect(canonical).toContain('await compare(');
  });
  test('phone ownership proof requires server-validated, time-limited OTP', () => {
    const route = content('src/app/api/auth/verify-phone/route.ts');
    expect(route).toContain('phoneVerificationExpiresAt');
    expect(route).toContain('MAX_ATTEMPTS = 5');
    expect(route).toContain('sendPhoneOwnershipCode');
    expect(route).toContain('await compare(parsed.data.code');
    expect(route).not.toContain('TEST_VERIFICATION_CODE');
    const bypass = content('src/app/api/users/verify-phone/route.ts');
    expect(bypass).not.toContain('phoneVerified: true');
  });

  test('credentials check cannot create unencrypted backups', () => {
    const utility = content('scripts/check-aws-key.ts');
    expect(utility).not.toContain('copyFileSync');
    expect(utility).not.toContain('.env.backup');
  });
});
