/**
 * Block unapproved Netlify previews at request time, even if an old preview
 * somehow exists before the build-time staging configuration gate was added.
 *
 * NEXT_PUBLIC_JACKERBOX_STAGING_PREVIEW is a harmless, literal deployment
 * marker injected only in non-production Netlify build contexts.
 */
export function isStagingPreviewBlocked(
  hostname: string,
  isPreviewBuild: string | undefined,
  isStagingReady: string | undefined,
): boolean {
  const host = hostname.toLowerCase();
  const isDeployPreviewHost = /^deploy-preview-\d+--jackerbox\.netlify\.app$/.test(host);
  const isBranchPreviewHost =
    /^[a-z0-9-]+--jackerbox\.netlify\.app$/.test(host) &&
    host !== 'main--jackerbox.netlify.app';

  const isDedicatedStagingHost = host === 'jackerbox-staging.netlify.app' ||
    /^[a-z0-9-]+--jackerbox-staging\.netlify\.app$/.test(host);

  return (isPreviewBuild === 'true' || isDeployPreviewHost ||
    isBranchPreviewHost || isDedicatedStagingHost) &&
    isStagingReady !== 'true';
}
