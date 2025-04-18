// Mock implementation to replace Statsig
import { FEATURE_FLAGS } from './statsig-config';

// Mock StatsigUser type
export type StatsigUser = {
  userID: string;
  email?: string | null;
  custom?: Record<string, any>;
};

// Mock initialize function that does nothing
export const initializeStatsig = async (_user: StatsigUser) => {
  console.log('Mock Statsig initialized - No actual Statsig integration');
  return;
};

/**
 * Mock implementation - always returns true
 * @param featureKey The feature flag key to check
 * @returns boolean indicating if the feature is enabled
 */
export const checkFeatureFlag = (_featureKey: string): boolean => {
  return true;
};

/**
 * Mock implementation that returns empty object
 * @param configKey The config key to get
 * @returns Empty object
 */
export const getDynamicConfig = (_configKey: string): any => {
  return {};
};

/**
 * Mock experiment values
 * @param experimentKey The experiment key
 * @returns Empty object
 */
export const getExperiment = (_experimentKey: string): any => {
  return { value: {} };
};

/**
 * Mock log exposure function
 * @param experimentKey The experiment key to log exposure for
 */
export const logExposure = (_experimentKey: string): void => {
  return;
};

// Feature flag keys
export const FeatureFlags = {
  ENHANCED_SEARCH: 'enhanced_search',
  NEW_BOOKING_FLOW: 'new_booking_flow',
  IMPROVED_MESSAGING: 'improved_messaging',
  DYNAMIC_PRICING: 'dynamic_pricing',
  MOBILE_OPTIMIZATIONS: 'mobile_optimizations',
};

/**
 * Create a mock Statsig user object from a user object
 * @param user The user object to create a Statsig user from
 * @returns A Statsig user object
 */
export const createStatsigUser = (user: any): StatsigUser => {
  return {
    userID: user.id || user.userId || user.sub || 'anonymous',
    email: user.email,
    custom: {
      role: user.role || 'user',
    },
  };
}; 