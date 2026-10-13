// Read-only smoke test for JackerBox's Supabase PostgreSQL migration.
// Run after "npx prisma generate" with Netlify preview variables loaded.
// Never print database URLs, passwords or SQL error details.
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { PrismaClient } = require('../prisma/generated/client');

const expectedRef = process.env.JACKERBOX_SUPABASE_PROJECT_REF;
const databaseUrl = process.env.DATABASE_URL;

function abort(message) {
  console.error(`[supabase-smoke] ${message}`);
  process.exitCode = 1;
}

function validConnectionString(urlText, projectRef) {
  try {
    const url = new URL(urlText);
    if (!['postgres:', 'postgresql:'].includes(url.protocol)) return false;
    if (url.hostname === `db.${projectRef}.supabase.co`) return true;

    const username = decodeURIComponent(url.username);
    return url.hostname.endsWith('.pooler.supabase.com')
      && username.endsWith(`.${projectRef}`);
  } catch {
    return false;
  }
}

if (!expectedRef || !/^[a-z0-9]{20}$/.test(expectedRef)) {
  abort('JACKERBOX_SUPABASE_PROJECT_REF must be the 20-character project ref.');
} else if (!databaseUrl || !validConnectionString(databaseUrl, expectedRef)) {
  abort('DATABASE_URL does not identify the expected Supabase project. No queries were run.');
} else {
  const prisma = new PrismaClient({
    datasources: { db: { url: databaseUrl } },
    log: ['error'],
  });

  try {
    // Every query below is read-only. Do not seed financial or personal records.
    const rows = await prisma.$queryRawUnsafe(`
      SELECT
        (SELECT count(*)::int
         FROM public."_prisma_migrations"
         WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL) AS migrations,
        (SELECT count(*)::int
         FROM pg_tables WHERE schemaname = 'public'
           AND tablename <> '_prisma_migrations') AS app_tables,
        (SELECT count(*)::int
         FROM pg_tables WHERE schemaname = 'public'
           AND NOT rowsecurity) AS tables_without_rls,
        (SELECT count(*)::int FROM public."User") AS users,
        (SELECT count(*)::int FROM public."Equipment") AS equipment,
        (SELECT count(*)::int FROM public."Booking") AS bookings
    `);

    if (!Array.isArray(rows) || rows.length !== 1) {
      throw new Error('Database health query returned no result.');
    }

    const r = rows[0];
    if (r.migrations !== 6 || r.app_tables !== 19 || r.tables_without_rls !== 0) {
      abort('Schema differs from the validated JackerBox baseline. Do not release.');
    } else {
      console.log('[supabase-smoke] PASS: connected to expected project');
      console.log('[supabase-smoke] 6 Prisma migrations, 19 app tables, all public tables have RLS');
      console.log(`[supabase-smoke] Row counts: users=${r.users}, equipment=${r.equipment}, bookings=${r.bookings}`);
    }
  } catch (error) {
    // Provider errors sometimes contain connection details. Keep them out of logs.
    const code = typeof error?.code === 'string' ? error.code : 'QUERY_FAILED';
    abort(`Unable to validate the database (code: ${code}). Do not release.`);
  } finally {
    await prisma.$disconnect();
  }
}
