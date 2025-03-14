'use client';

import { ReactNode } from 'react';
import { useStatsigClient } from '@statsig/react-bindings';

interface FeatureToggleProps {
  featureKey: string;
  children: ReactNode;
  fallback?: ReactNode;
  defaultValue?: boolean;
}

/**
 * FeatureToggle conditionally renders content based on feature flags
 * 
 * @example
 * <FeatureToggle featureKey="new_feature">
 *   <NewFeatureComponent />
 * </FeatureToggle>
 * 
 * @example
 * <FeatureToggle featureKey="new_feature" fallback={<OldFeatureComponent />}>
 *   <NewFeatureComponent />
 * </FeatureToggle>
 */
export function FeatureToggle({
  featureKey,
  children,
  fallback = null,
  defaultValue = false,
}: FeatureToggleProps) {
  const { client } = useStatsigClient();
  const isEnabled = client.checkGate(featureKey) ?? defaultValue;
  
  return isEnabled ? <>{children}</> : <>{fallback}</>;
} 