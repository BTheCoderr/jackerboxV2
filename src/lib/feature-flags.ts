import { Statsig, StatsigUser } from 'statsig-js';
import { STATSIG_CONFIG, FEATURE_FLAGS } from './statsig-config';

// Initialize Statsig with your client key
export const initializeStatsig = async (user: StatsigUser) => {
  if (typeof window === 'undefined') return;
  
  try {
    await Statsig.initialize(
      STATSIG_CONFIG.CLIENT_KEY,
      user
    );
    console.log('Statsig initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Statsig:', error);
  }
};

// Check if a feature flag is enabled
export const isFeatureEnabled = (featureKey: string, defaultValue = false): boolean => {
  if (typeof window === 'undefined') return defaultValue;
  
  try {
    return Statsig.checkGate(featureKey);
  } catch (error) {
    console.error(`Error checking feature flag ${featureKey}:`, error);
    return defaultValue;
  }
};

// Get dynamic config for a feature
export const getFeatureConfig = (configKey: string) => {
  if (typeof window === 'undefined') return {};
  
  try {
    return Statsig.getConfig(configKey).value;
  } catch (error) {
    console.error(`Error getting config for ${configKey}:`, error);
    return {};
  }
};

// Get experiment parameter
export const getExperimentParam = <T>(experimentKey: string, paramName: string, defaultValue: T): T => {
  if (typeof window === 'undefined') return defaultValue;
  
  try {
    const experiment = Statsig.getExperiment(experimentKey);
    return experiment.get(paramName, defaultValue);
  } catch (error) {
    console.error(`Error getting experiment param ${paramName} for ${experimentKey}:`, error);
    return defaultValue;
  }
};

// Log exposure to an experiment
export const logExposure = (experimentKey: string) => {
  if (typeof window === 'undefined') return;
  
  try {
    Statsig.logEvent('exposure', experimentKey);
  } catch (error) {
    console.error(`Error logging exposure for ${experimentKey}:`, error);
  }
};

// Feature flag keys
export const FeatureFlags = {
  ENHANCED_SEARCH: 'enhanced_search',
  NEW_BOOKING_FLOW: 'new_booking_flow',
  IMPROVED_MESSAGING: 'improved_messaging',
  DYNAMIC_PRICING: 'dynamic_pricing',
  MOBILE_OPTIMIZATIONS: 'mobile_optimizations',
};

// Example of how to use feature flags with user properties
export const createStatsigUser = (user: any) => {
  if (!user) return { userID: 'anonymous' };
  
  return {
    userID: user.id,
    email: user.email,
    custom: {
      isVerified: user.idVerified || false,
      isOwner: Boolean(user.equipmentListings?.length),
      isRenter: Boolean(user.rentals?.length),
      accountAge: user.createdAt ? Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24)) : 0,
    },
  };
}; 