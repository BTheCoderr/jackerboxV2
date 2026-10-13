// JackerBox build-time safety gate. Refuse non-production builds using unknown
// database targets, live Stripe keys, or unreviewed preview configuration.
// This script never connects to external services or logs secret values.
const REF = 'gjqrubvipnhpnnpvodsv';
const env = process.env;
const errors = [];

function required(key) {
  const value = env[key] || '';
  if (!value.trim()) errors.push(key + ' must be configured.');
  return value;
}

function assertDb(key, port, transactionPool) {
  const value = required(key);
  if (!value) return;
  try {
    const url = new URL(value);
    const direct = url.hostname === 'db.' + REF + '.supabase.co';
    const pooled = url.hostname.endsWith('.pooler.supabase.com') &&
      decodeURIComponent(url.username).endsWith('.' + REF);
    if (!['postgres:', 'postgresql:'].includes(url.protocol) || (!direct && !pooled)) {
      throw new Error('unexpected db target');
    }
    if (url.port !== port) errors.push(key + ' must use the expected staging port ' + port + '.');
    if (transactionPool && !pooled) errors.push(key + ' must use the staging transaction pool.');
    if (transactionPool && url.searchParams.get('pgbouncer') !== 'true') {
      errors.push(key + ' must include pgbouncer=true.');
    }
    if (!transactionPool && url.searchParams.has('pgbouncer')) {
      errors.push(key + ' must not include pgbouncer.');
    }
  } catch {
    errors.push(key + ' must target the dedicated JackerBox Supabase project.');
  }
}

if (!['deploy-preview', 'branch-deploy'].includes(env.CONTEXT)) {
  errors.push('Only preview and branch-deploy builds may invoke this gate.');
}
if (env.JACKERBOX_STAGING_READY !== 'true') {
  errors.push('JACKERBOX_STAGING_READY must be explicitly set after staging credential review.');
}
if (env.JACKERBOX_SUPABASE_PROJECT_REF !== REF) {
  errors.push('JACKERBOX_SUPABASE_PROJECT_REF is not the approved staging project.');
}
assertDb('DATABASE_URL', '6543', true);
assertDb('DIRECT_DATABASE_URL', '5432', false);
if (!required('STRIPE_SECRET_KEY').startsWith('sk_test_')) {
  errors.push('STRIPE_SECRET_KEY must be a Stripe test-mode key.');
}
if (!required('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY').startsWith('pk_test_')) {
  errors.push('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY must be a Stripe test-mode key.');
}
if (env.STRIPE_PUBLISHABLE_KEY && !env.STRIPE_PUBLISHABLE_KEY.startsWith('pk_test_')) {
  errors.push('STRIPE_PUBLISHABLE_KEY must be a test-mode key when present.');
}
if (!required('STRIPE_WEBHOOK_SECRET').startsWith('whsec_')) {
  errors.push('STRIPE_WEBHOOK_SECRET must be a webhook signing secret.');
}
required('NEXTAUTH_SECRET');
required('UPSTASH_REDIS_REST_URL');
required('UPSTASH_REDIS_REST_TOKEN');
const auth = required('NEXTAUTH_URL');
const preview = required('DEPLOY_PRIME_URL');
const stripSlash = value => value.endsWith('/') ? value.slice(0, -1) : value;
if (auth && preview && stripSlash(auth) !== stripSlash(preview)) {
  errors.push('NEXTAUTH_URL must match the current deploy preview URL.');
}

if (errors.length) {
  for (const message of errors) console.error('[jackerbox-staging] BLOCKED: ' + message);
  process.exitCode = 1;
} else {
  console.log('[jackerbox-staging] PASS: preview database target and Stripe test-mode keys verified.');
  console.log('[jackerbox-staging] Manual credential rotation and webhook transaction tests remain mandatory.');
}
