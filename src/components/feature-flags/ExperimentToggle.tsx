'use client';

import { ReactNode, useEffect } from 'react';
import { useStatsigClient } from '@statsig/react-bindings';

interface ExperimentToggleProps {
  experimentKey: string;
  paramName: string;
  variants: Record<string, ReactNode>;
  defaultVariant: string;
  logExposureOnRender?: boolean;
}

/**
 * ExperimentToggle conditionally renders content based on experiment variants
 * 
 * @example
 * <ExperimentToggle
 *   experimentKey="search_results_layout"
 *   paramName="layout"
 *   variants={{
 *     grid: <GridLayout />,
 *     list: <ListView />,
 *   }}
 *   defaultVariant="grid"
 * />
 */
export function ExperimentToggle({
  experimentKey,
  paramName,
  variants,
  defaultVariant,
  logExposureOnRender = true,
}: ExperimentToggleProps) {
  const { client } = useStatsigClient();
  
  // Get the experiment
  const experiment = client.getExperiment(experimentKey);
  
  // Get the variant from the experiment
  const variant = experiment.get(paramName, defaultVariant);
  
  // Log exposure to the experiment
  useEffect(() => {
    if (logExposureOnRender) {
      client.logEvent('exposure', experimentKey);
    }
  }, [client, experimentKey, logExposureOnRender]);
  
  // Render the variant or default
  return <>{variants[variant] || variants[defaultVariant]}</>;
} 