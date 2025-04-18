'use client';

import { ReactNode } from 'react';

interface FeatureFlagProviderProps {
  children: ReactNode;
}

/**
 * Mock FeatureFlagProvider that just renders children
 * This replaces the actual FeatureFlagProvider to avoid Statsig dependency issues
 */
export function FeatureFlagProvider({ children }: FeatureFlagProviderProps) {
  // Simple pass-through component
  return <>{children}</>;
} 