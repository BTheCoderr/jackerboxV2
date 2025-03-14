import { ReactNode } from 'react';
import { getExperimentParamServer } from '@/lib/server-feature-flags';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createServerStatsigUser } from '@/lib/server-feature-flags';

interface ServerExperimentToggleProps {
  experimentKey: string;
  paramName: string;
  variants: Record<string, ReactNode>;
  defaultVariant: string;
}

/**
 * ServerExperimentToggle conditionally renders content based on server-side experiment variants
 * 
 * @example
 * <ServerExperimentToggle
 *   experimentKey="search_results_layout"
 *   paramName="layout"
 *   variants={{
 *     grid: <GridLayout />,
 *     list: <ListView />,
 *   }}
 *   defaultVariant="grid"
 * />
 */
export async function ServerExperimentToggle({
  experimentKey,
  paramName,
  variants,
  defaultVariant,
}: ServerExperimentToggleProps) {
  // Get the current user session
  const session = await getServerSession(authOptions);
  
  // Create a Statsig user from the session
  const user = session?.user ? createServerStatsigUser(session.user) : undefined;
  
  // Get the variant from the experiment
  const variant = await getExperimentParamServer<string>(
    experimentKey,
    paramName,
    defaultVariant,
    user
  );
  
  // Render the variant or default
  return <>{variants[variant] || variants[defaultVariant]}</>;
} 