import { ReactNode } from 'react';
import { isFeatureEnabledServer } from '@/lib/server-feature-flags';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createServerStatsigUser } from '@/lib/server-feature-flags';

interface ServerFeatureToggleProps {
  featureKey: string;
  children: ReactNode;
  fallback?: ReactNode;
  defaultValue?: boolean;
}

/**
 * ServerFeatureToggle conditionally renders content based on server-side feature flags
 * 
 * @example
 * <ServerFeatureToggle featureKey="new_feature">
 *   <NewFeatureComponent />
 * </ServerFeatureToggle>
 */
export async function ServerFeatureToggle({
  featureKey,
  children,
  fallback = null,
  defaultValue = false,
}: ServerFeatureToggleProps) {
  // Get the current user session
  const session = await getServerSession(authOptions);
  
  // Create a Statsig user from the session
  const user = session?.user ? createServerStatsigUser(session.user) : undefined;
  
  // Check if the feature is enabled
  const isEnabled = await isFeatureEnabledServer(featureKey, user, defaultValue);
  
  return isEnabled ? <>{children}</> : <>{fallback}</>;
} 