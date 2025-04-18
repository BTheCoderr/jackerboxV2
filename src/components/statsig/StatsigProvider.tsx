'use client';

import { ReactNode } from 'react';

interface MyStatsigProviderProps {
  children: ReactNode;
}

/**
 * Mock StatsigProvider that just renders children
 * This replaces the actual StatsigProvider to avoid dependency issues
 */
export function MyStatsigProvider({ children }: MyStatsigProviderProps) {
  // Simple pass-through implementation
  return <>{children}</>;
} 