/**
 * Statsig Configuration for Feature Flags and A/B Testing
 * 
 * This file contains the configuration for Statsig, which is used for feature flags
 * and A/B testing through Vercel Experimentation.
 */

export const STATSIG_CONFIG = {
  // Client-side key for browser usage
  CLIENT_KEY: process.env.NEXT_PUBLIC_STATSIG_CLIENT_KEY || 'client-OJXtzlklrzZBlhAekWFcJkAYHZKWVPsNDsVno9XfT98',
  
  // Server-side key for API routes and server components
  SERVER_API_KEY: process.env.STATSIG_SERVER_API_KEY || 'secret-wURQMrNghGqzkJZhthiy15ZEwFDwCX3nr4UQ87GkAUc',
  
  // Experimentation config item key
  EXPERIMENTATION_CONFIG_ITEM_KEY: process.env.EXPERIMENTATION_CONFIG_ITEM_KEY || 'statsig-3xhcph2HVSMmkzSKvSXZy4'
};

// Feature flag names - centralize them here to avoid typos
export const FEATURE_FLAGS = {
  ENHANCED_SEARCH: 'enhanced-search',
  PUSH_NOTIFICATIONS: 'push-notifications',
  NEW_BOOKING_FLOW: 'new-booking-flow',
  DARK_MODE: 'dark-mode',
  BETA_FEATURES: 'beta-features'
};

// Experiment names
export const EXPERIMENTS = {
  SEARCH_RESULTS_LAYOUT: 'search-results-layout',
  PRICING_DISPLAY: 'pricing-display',
  ONBOARDING_FLOW: 'onboarding-flow'
}; 