import { ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import { cookies } from 'next/headers';
import { checkServerFeatureFlag, createServerStatsigUser } from '@/lib/server-feature-flags';

interface ServerFeatureToggleProps {
  /**
   * The feature flag key to check
   */
  featureKey: string;
  
  /**
   * The content to render if the feature is enabled
   */
  children: ReactNode;
  
  /**
   * Optional fallback content to render if the feature is disabled
   */
  fallback?: ReactNode;
  
  /**
   * Optional default value to use if the feature flag can't be checked
   * @default false
   */
  defaultValue?: boolean;
}

/**
 * ServerFeatureToggle component that conditionally renders content based on a feature flag
 * Uses server-side evaluation for feature flags
 */
export async function ServerFeatureToggle({
  featureKey,
  children,
  fallback = null,
  defaultValue = false,
}: ServerFeatureToggleProps) {
  // Create a Statsig user from the session
  const user = undefined; // We'll implement this later with server session

  // Check if the feature is enabled
  const isEnabled = await checkServerFeatureFlag(featureKey, user) || defaultValue;
  
  // Render the appropriate content
  return isEnabled ? <>{children}</> : <>{fallback}</>;
} 