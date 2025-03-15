'use client';

import { ReactNode } from 'react';
import { useStatsigClient } from '@statsig/react-bindings';

interface ExperimentToggleProps {
  /**
   * The experiment key to check
   */
  experimentKey: string;
  
  /**
   * The variant to check for
   */
  variant: string;
  
  /**
   * The content to render if the user is in the specified variant
   */
  children: ReactNode;
  
  /**
   * Optional fallback content to render if the user is not in the specified variant
   */
  fallback?: ReactNode;
  
  /**
   * Whether to log exposure to the experiment
   * @default true
   */
  logExposure?: boolean;
}

/**
 * ExperimentToggle component that conditionally renders content based on an experiment variant
 * Uses the Statsig client to check if a user is in a specific experiment variant
 */
export function ExperimentToggle({
  experimentKey,
  variant,
  children,
  fallback = null,
  logExposure = true,
}: ExperimentToggleProps) {
  const { client } = useStatsigClient();
  
  // If the client isn't available, show the fallback
  if (!client) {
    return <>{fallback}</>;
  }
  
  // Get the experiment and check if the user is in the specified variant
  const experiment = client.getExperiment(experimentKey);
  const isInVariant = experiment.get('variant', '') === variant;
  
  // Log exposure if needed
  if (logExposure && isInVariant) {
    client.logEvent('exposure', experimentKey);
  }
  
  // Render the appropriate content
  return isInVariant ? <>{children}</> : <>{fallback}</>;
}

export default ExperimentToggle; 