# JackerBox: fresh Supabase PostgreSQL bootstrap

Last checked: 2026-10-10. This document tracks the new database for PR #2.
No passwords or connection strings belong in Git.

## Project
- Supabase organization: `bthedream`
- Project: `JackerBox`
- Project ref: `gjqrubvipnhpnnpvodsv`
- Region: `us-east-1`
- Dashboard: https://supabase.com/dashboard/project/gjqrubvipnhpnnpvodsv
- Project creation cost returned by Supabase: $0/month on the organization's Free plan
- This database is **new and empty**. No records have been copied from Neon or any earlier database.

## Schema bootstrap completed
Six SQL files from `prisma/migrations` were applied in order to the new Supabase database:
1. `20250304213743_init`
2. `20250307222859_add_review_enhancements`
3. `20250311220518_add_user_type`
4. `20250315111500_add_notification_preference_and_dispute`
5. `20261010114500_phone_otp_guards`
6. `20261010130000_reconcile_legacy_schema`

Supabase's migration ledger records these operations. The Prisma
`_prisma_migrations` table was also initialized with the exact original
file SHA-256 checksums and completion records, for compatibility with
subsequent `prisma migrate deploy` runs.

Verified: 19 application tables, 32 foreign keys, six migration checksum
entries, and the current phone-OTP, message-recipient and payment metadata
columns. Do not run `prisma db push --force-reset`, `prisma migrate reset`,
or any destructive migration on a hosted database.

## Access control completed and verified
Supabase project `gjqrubvipnhpnnpvodsv` has had the server-only access
policy applied as a tracked Supabase migration named
`jackerbox_server_only_rls_and_api_role_lockdown`.

Verified after migration:
- All 20 public-schema tables have RLS enabled.
- Zero tables remain with RLS disabled.
- Neither the `anon` nor `authenticated` Supabase API role has data
  privileges (SELECT / INSERT / UPDATE / DELETE) on those tables.
- The existing `postgres` backend database role retains read access to all 20.
- No client-facing RLS policies have been added. Supabase's remaining
  informational `rls_enabled_no_policy` notices are intentional for this
  Prisma/NextAuth server-only architecture.

The Netlify runtime/database connection is NOT YET configured or tested.
Do not publish the new environment until credentials, runtime DB operations,
and test-mode payment workflows have been verified.

Supabase RLS reference:
https://supabase.com/docs/guides/database/postgres/row-level-security

## Registration rate limiting (configuration required)
The signup route uses `@upstash/ratelimit` backed by a shared Redis instance.
Configure `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` as
Netlify **site secrets** in the deploy-preview Functions context.
Legacy `KV_REST_API_URL` and `KV_REST_API_TOKEN` are also supported when
already configured, but do not reuse any credential previously committed
to Git. Old Redis tokens in source history must be revoked and replaced.

Limits: 8 signup attempts per Netlify-reported client IP per hour, and
3 per normalized email per hour. When the shared rate limiter is absent
or unavailable, the endpoint returns 503 rather than silently allowing
unlimited signups. Do not launch registration until these values are set
and 429/503 behavior is tested in the preview.

## Netlify preview connection (BLOCKED ON ISOLATED CREDENTIALS)
Netlify's site credentials were not changed by this database bootstrap.
A PR #2 deploy-preview URL exists, but **the preview runtime is not yet connected to this Supabase project** and is not approved for rental/payment testing. Netlify SSO currently protects non-production access. New preview builds intentionally fail closed until the staging credentials are configured and reviewed. Runtime requests also fail closed with HTTP 503 when the preview is not approved.

1. In the Supabase dashboard, open **Connect** and copy the **actual**
   connection strings for this project. Never guess pooler hostname or
   paste passwords into Git, issues or chat.
2. Set `DATABASE_URL` to the **transaction-pooling** URI from Supabase
   Connect (port 6543), with `pgbouncer=true` added to its query parameters.
   This disables prepared statements that the transaction pooler does not
   support. If other query parameters are present, use `&pgbouncer=true`.
   Do not guess the pooler hostname or password.
3. Set `DIRECT_DATABASE_URL` to the **session pooler** URI (port 5432) from
   Supabase Connect for migrations on IPv4-only hosts. A native direct URI
   is also suitable when the executing host supports IPv6. Don't append
   `pgbouncer=true` to the migrations URL.
4. In Netlify `jackerbox` → **Project configuration → Environment variables**,
   add both variables as **secret values scoped to deploy previews**, with
   **Builds and Functions** scopes as required by the Next.js runtime.
   The non-secret `JACKERBOX_SUPABASE_PROJECT_REF=gjqrubvipnhpnnpvodsv` value and preview identification marker are already pinned for non-production builds in `netlify.toml`. Do not try to create duplicate values through the Netlify UI.
   Do not overwrite existing production variables or set them in GitHub.
5. Create a fresh, preview-only `NEXTAUTH_SECRET`, and override `NEXTAUTH_URL` with the actual deploy-preview hostname. Configure separate test OAuth redirect URLs. Rotate previously exposed secrets. Shared `all`-context provider settings are not staging isolation: scope test-only Stripe and storage/communications services to `deploy-preview`, or disable those integrations until isolated.
6. Configure a preview-only Stripe `sk_test_...` secret and matching `pk_test_...` publishable key, a webhook `whsec_...` secret for the preview endpoint, and a fresh shared Redis instance for `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`. Set `JACKERBOX_STAGING_READY=true` in **deploy-preview only** after an operator verifies all staging service isolation. Do not set this flag to bypass a failing build.
7. Trigger a **new deploy preview** after the environment changes.
   Build-time and runtime secrets will not update in an already-built deploy.
   With the preview environment loaded into a secure shell, run
   `npm run db:verify:supabase` to check host identity, schema, RLS and
   migration history without writing any data. Do not paste the script's
   database URL into chat. Next, check `GET /api/equipment`, signup/login,
   equipment write/read, protected routes, and booking/rental operations.
8. Use Stripe **test mode only** for payment acceptance tests. Do not run live
   captures/refunds/payouts until explicitly verified.

## Release gates
- The legacy published production site remains unchanged; do not merge or promote the repair branch while checks are incomplete.
- CI on the repair PR must pass `staging-preview.test.ts` and `staging-env-guard.test.mjs` as well as the migration/build/security gates.

- Supabase public-table RLS and API role privileges secured and verified. The `rls_enabled_no_policy` informational findings are expected.
- Netlify preview database URLs point at this specific project and are isolated
  from production.
- `npx prisma migrate status` against that URL reports no pending migration,
  and `npx prisma migrate deploy` is idempotent.
- Server-side integration tests for signup, owner/listing/renter workflows pass.
- Actual test-mode Stripe webhook, payment and refund flows pass.
- Upstash Redis signup limiter configured with **new** credentials; old token rotated.
- Identity provider callback URLs and secret rotation verified.
- Only then merge/release PR #2; there is no automatic production publish here.

Supabase Prisma reference:
https://supabase.com/docs/guides/database/prisma

Supabase Prisma pooling troubleshooting:
https://supabase.com/docs/guides/database/prisma/prisma-troubleshooting
