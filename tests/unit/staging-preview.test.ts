import fs from 'node:fs';
import path from 'node:path';
import { isStagingPreviewBlocked } from '../../src/lib/staging-preview';

describe('JackerBox preview runtime freeze', () => {
  test('blocks deploy preview until manually approved', () => {
    expect(isStagingPreviewBlocked('deploy-preview-2--jackerbox.netlify.app', undefined, undefined)).toBe(true);
  });

  test('blocks a branch preview until manually approved', () => {
    expect(isStagingPreviewBlocked('audit-security--jackerbox.netlify.app', undefined, undefined)).toBe(true);
  });

  test('embedded non-production build marker prevents host header bypass', () => {
    expect(isStagingPreviewBlocked('jackerbox.app', 'true', undefined)).toBe(true);
  });

  test('approved staging preview is available for test-mode QA', () => {
    expect(isStagingPreviewBlocked('deploy-preview-2--jackerbox.netlify.app', 'true', 'true')).toBe(false);
  });

  test('independent staging site and deploy aliases remain closed until approved', () => {
    expect(isStagingPreviewBlocked('jackerbox-staging.netlify.app', undefined, undefined)).toBe(true);
    expect(isStagingPreviewBlocked('abc123--jackerbox-staging.netlify.app', undefined, undefined)).toBe(true);
    expect(isStagingPreviewBlocked('jackerbox-staging.netlify.app', undefined, 'true')).toBe(false);
  });

  test('normal production host is unaffected', () => {
    expect(isStagingPreviewBlocked('jackerbox.app', undefined, undefined)).toBe(false);
    expect(isStagingPreviewBlocked('main--jackerbox.netlify.app', undefined, undefined)).toBe(false);
  });

  test('new proxy intercepts API and Server Action routes but preserves page access rules', () => {
    const proxy = fs.readFileSync(path.join(process.cwd(), 'src/proxy.ts'), 'utf8');
    expect(proxy).toContain('isStagingPreviewBlocked(');
    expect(proxy).toContain('NextResponse.json(');
    expect(proxy).toContain("'Cache-Control': 'no-store'");
    expect(proxy).toContain('matcher:');
    expect(proxy).toContain("const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })");
  });

  test('Netlify preview markers cannot change production environment', () => {
    const config = fs.readFileSync(path.join(process.cwd(), 'netlify.toml'), 'utf8');
    expect(config).toContain('[context.deploy-preview.environment]');
    expect(config).toContain('[context.branch-deploy.environment]');
    expect(config).toContain('NEXT_PUBLIC_JACKERBOX_STAGING_PREVIEW = "true"');
    expect(config).not.toContain('[context.production.environment]');
  });
});
