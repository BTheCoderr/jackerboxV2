'use client';

import { ReactNode } from 'react';
import { useStatsigClient } from '@statsig/react-bindings';

interface FeatureToggleProps {
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
 * FeatureToggle component that conditionally renders content based on a feature flag
 * Uses the Statsig client to check if a feature flag is enabled
 */
export function FeatureToggle({
  featureKey,
  children,
  fallback = null,
  defaultValue = false,
}: FeatureToggleProps) {
  const { client } = useStatsigClient();
  
  // If the client isn't available, use the default value
  if (!client) {
    return defaultValue ? <>{children}</> : <>{fallback}</>;
  }
  
  // Check if the feature is enabled
  const isEnabled = client.checkGate(featureKey);
  
  // Render the appropriate content
  return isEnabled ? <>{children}</> : <>{fallback}</>;
}

export default FeatureToggle; 