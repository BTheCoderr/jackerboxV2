import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const guard = fileURLToPath(new URL('../../scripts/assert-staging-env.mjs', import.meta.url));
const ref = 'gjqrubvipnhpnnpvodsv';
const staging = {
  CONTEXT: 'deploy-preview',
  JACKERBOX_STAGING_READY: 'true',
  JACKERBOX_SUPABASE_PROJECT_REF: ref,
  DATABASE_URL: 'postgresql://postgres.' + ref + ':dummy@a.pooler.supabase.com:6543/db?pgbouncer=true',
  DIRECT_DATABASE_URL: 'postgresql://postgres.' + ref + ':dummy@a.pooler.supabase.com:5432/db',
  STRIPE_SECRET_KEY: 'sk_test_dummy',
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: 'pk_test_dummy',
  STRIPE_PUBLISHABLE_KEY: 'pk_test_dummy',
  STRIPE_WEBHOOK_SECRET: 'whsec_dummy',
  NEXTAUTH_SECRET: 'dummy',
  NEXTAUTH_URL: 'https://deploy-preview-2--jackerbox.netlify.app',
  DEPLOY_PRIME_URL: 'https://deploy-preview-2--jackerbox.netlify.app',
  UPSTASH_REDIS_REST_URL: 'https://redis.example.test',
  UPSTASH_REDIS_REST_TOKEN: 'dummy',
};

function run(changes = {}) {
  return spawnSync(process.execPath, [guard], {
    encoding: 'utf8',
    env: { ...process.env, ...staging, ...changes },
  });
}

test('accepted staging configuration is strictly test-only', () => {
  const result = run();
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /PASS/);
});

test('live Stripe keys block preview build without revealing the key', () => {
  const live = 'sk_live_DO_NOT_USE_VALUE';
  const result = run({ STRIPE_SECRET_KEY: live });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /STRIPE_SECRET_KEY/);
  assert.ok(!result.stderr.includes(live));
});

test('wrong database project blocks preview build without exposing connection URL', () => {
  const wrong = staging.DATABASE_URL.replace('.' + ref, '.not-a-real-project');
  const result = run({ DATABASE_URL: wrong });
  assert.notEqual(result.status, 0);
  assert.ok(!result.stderr.includes(wrong));
});

test('preview using production auth callback URL fails closed', () => {
  const result = run({ NEXTAUTH_URL: 'https://jackerbox.app' });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /NEXTAUTH_URL/);
});

test('missing manual staging approval fails closed', () => {
  const result = run({ JACKERBOX_STAGING_READY: '' });
  assert.notEqual(result.status, 0);
});

test('incorrect build context fails closed', () => {
  const result = run({ CONTEXT: 'production' });
  assert.notEqual(result.status, 0);
});
