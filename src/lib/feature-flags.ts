import Statsig from '@statsig/js-client';
import type { StatsigUser } from '@statsig/js-client';
import { STATSIG_CONFIG, FEATURE_FLAGS } from './statsig-config';

// Initialize Statsig with your client key
export const initializeStatsig = async (user: StatsigUser) => {
  try {
    if (typeof window === 'undefined') return;

    await Statsig.initialize(
      STATSIG_CONFIG.CLIENT_KEY,
      { user }
    );
    console.log('Statsig initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Statsig:', error);
  }
};

/**
 * Check if a feature flag is enabled
 * @param featureKey The feature flag key to check
 * @returns boolean indicating if the feature is enabled
 */
export const checkFeatureFlag = (featureKey: string): boolean => {
  if (typeof window === 'undefined') return false;
  return Statsig.checkGate(featureKey);
};

/**
 * Get a dynamic config value
 * @param configKey The config key to get
 * @returns The config value
 */
export const getDynamicConfig = (configKey: string): any => {
  if (typeof window === 'undefined') return {};
  return Statsig.getConfig(configKey).value;
};

/**
 * Get an experiment value
 * @param experimentKey The experiment key to get
 * @returns The experiment value
 */
export const getExperiment = (experimentKey: string): any => {
  if (typeof window === 'undefined') return {};
  const experiment = Statsig.getExperiment(experimentKey);
  return experiment.value;
};

/**
 * Log an exposure event for an experiment
 * @param experimentKey The experiment key to log exposure for
 */
export const logExposure = (experimentKey: string): void => {
  if (typeof window === 'undefined') return;
  Statsig.logEvent('exposure', experimentKey);
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
 * Create a Statsig user object from a user object
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