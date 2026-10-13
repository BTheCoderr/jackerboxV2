// Netlify's SITE_ID is platform-controlled. Even if the deployment context is
// "production" on this independent staging site, refuse to build until the
// exact same test-only safety checks used by PR previews succeed.
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export const DEDICATED_STAGING_SITE_ID = 'f23d7f5f-7d06-47dd-a29b-80e23c687c8a';

if (process.env.SITE_ID === DEDICATED_STAGING_SITE_ID) {
  const guard = fileURLToPath(new URL('./assert-staging-env.mjs', import.meta.url));
  const result = spawnSync(process.execPath, [guard], {
    stdio: 'inherit',
    env: process.env,
  });
  if (result.error || result.status !== 0) {
    console.error('[jackerbox-netlify] Staging configuration not approved. Build blocked.');
    process.exitCode = 1;
  }
} else if (process.env.JACKERBOX_STAGING_SITE === 'true') {
  // A staging marker on the production site is a misconfiguration.
  console.error('[jackerbox-netlify] Unexpected site marked as staging. Build blocked.');
  process.exitCode = 1;
}
