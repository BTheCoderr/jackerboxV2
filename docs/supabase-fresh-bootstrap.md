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

## Netlify preview connection (NOT DONE)
Netlify's site credentials were not changed by this database bootstrap.
The preview is **not yet connected** to this Supabase project.

1. In the Supabase dashboard, open **Connect** and copy the **actual**
   connection strings for this project. Never guess pooler hostname or
   paste passwords into Git, issues or chat.
2. Set `DATABASE_URL` to a serverless-compatible pooled transaction connection
   URI (Supavisor transaction mode, when supported by Prisma 6).
3. Set `DIRECT_DATABASE_URL` to the Supabase direct/session connection URI
   suitable for migrations. Check network IPv4/IPv6 compatibility.
4. Add both to **Netlify site environment variables**, using the
   `deploy-preview` context first; do not overwrite production variables.
5. Keep `NEXTAUTH_SECRET` server-only, and configure the preview URL and
   OAuth redirects for the test environment. Rotate previously exposed secrets.
6. Redeploy the preview to load changed environment variables, then verify
   `GET /api/equipment`, registration/login, equipment write/read,
   protected routes, and booking/rental operations against the **new project**.
7. Use Stripe **test mode only** for payment acceptance tests. Do not run live
   captures/refunds/payouts until explicitly verified.

## Release gates
- Supabase public-table RLS and API role privileges secured and verified. The `rls_enabled_no_policy` informational findings are expected.
- Netlify preview database URLs point at this specific project and are isolated
  from production.
- `npx prisma migrate status` against that URL reports no pending migration,
  and `npx prisma migrate deploy` is idempotent.
- Server-side integration tests for signup, owner/listing/renter workflows pass.
- Actual test-mode Stripe webhook, payment and refund flows pass.
- Identity provider callback URLs and secret rotation verified.
- Only then merge/release PR #2; there is no automatic production publish here.

Supabase Prisma reference:
https://supabase.com/docs/guides/database/prisma
