# JackerBox Repair Verification

This branch is **not** a production release. It removes exposed configuration from the latest tree, closes unauthenticated debug and test routes, secures checkout and changes the rental state machine.

## Release prerequisites

1. **Rotate exposed credentials immediately**: all database URLs/passwords, NextAuth secret, Redis/Upstash, Stripe, AWS, Google OAuth, Apple, Resend and Cloudinary values discovered in historical env files. Removing files from Git does not revoke the credentials. Review Git history and provider audit logs separately.
2. Review Netlify environment variable names and update values in Netlify. No tokens should be pasted into GitHub issues, PRs or chat.
3. Next.js is upgraded to 15.5.27 and React to 19.0.6. The manifest and lockfile were regenerated together. Confirm `npm ci` succeeds before releasing.
4. Run `npm ci --legacy-peer-deps`, `npm run test:unit -- --runInBand`, `npx tsc --noEmit`, and a full Next.js build in a test environment with dummy/non-production keys. Existing type and ESLint errors are **not** considered resolved by this security patch.
5. Exercise the end-to-end renter/owner Stripe **test-mode** flow: create equipment -> book -> pay -> webhook -> PAID -> ACTIVE -> COMPLETED -> admin payout -> admin deposit refund. Test overlaps, abandoned pending holds, duplicate Stripe webhooks and payout retries.
6. Publish only after successful checks and owner approval. Confirm `jackerbox.app` serves Next.js routes, not the former static placeholder.

## Known limitations requiring follow-up

- Old database records may use obsolete rental/payment states and need reconciliation before release.
- Payout and deposit refund services now call Stripe with stable idempotency keys but are not validated against a connected Stripe test account.
- Historical Git commits still contain secrets; rotation is required even after source cleanup.
- Booking availability supports blackout dates and rental overlaps, but recurring availability schedules and calendar sync still need integrated test coverage.
- Identity verification should be finalized using signed Stripe Identity webhooks and human review where appropriate.
- An old client may still be looking for obsolete payment routes; run real browser checks on mobile and desktop.

No production deployment or database migration is included in this repair branch.
