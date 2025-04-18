'use client';

import { FEATURE_FLAGS } from '@/lib/statsig-config';

/**
 * Mock implementation of feature flags
 * This version always returns true to enable all features
 * 
 * @param featureKey The feature flag key to check
 * @param defaultValue The default value to return if the flag is not found
 * @returns Always returns true to enable all features
 */
export function useFeatureFlag(_featureKey: string, _defaultValue = false): boolean {
  // Always return true to enable all features
  return true;
}

/**
 * Mock implementation of experiment parameters
 * 
 * @param experimentKey The experiment key
 * @param paramName The parameter name
 * @param defaultValue The default value to return
 * @returns The default value
 */
export function useExperimentParam<T>(
  _experimentKey: string,
  _paramName: string,
  defaultValue: T
): T {
  return defaultValue;
}

/**
 * Mock implementation of config
 * 
 * @param configKey The config key
 * @returns A mock config object
 */
export function useConfig(_configKey: string) {
  return {
    get: <T>(key: string, defaultValue: T): T => defaultValue
  };
}

/**
 * Mock implementation of layer
 * 
 * @param layerKey The layer key
 * @returns A mock layer object
 */
export function useLayer(_layerKey: string) {
  return {
    get: <T>(key: string, defaultValue: T): T => defaultValue
  };
}

/**
 * Hook to check if a specific feature flag is enabled
 * Mock implementation - always returns true
 * 
 * @returns Whether the enhanced search feature flag is enabled
 */
export function useEnhancedSearch(): boolean {
  return true;
}

/**
 * Hook to check if push notifications are enabled
 * Mock implementation - always returns true
 * 
 * @returns Whether the push notifications feature flag is enabled
 */
export function usePushNotifications(): boolean {
  return true;
}

/**
 * Hook to check if the new booking flow is enabled
 * Mock implementation - always returns true
 * 
 * @returns Whether the new booking flow feature flag is enabled
 */
export function useNewBookingFlow(): boolean {
  return true;
}

/**
 * Hook to check if dark mode is enabled
 * Mock implementation - always returns true
 * 
 * @returns Whether the dark mode feature flag is enabled
 */
export function useDarkMode(): boolean {
  return true;
}

/**
 * Hook to check if beta features are enabled
 * Mock implementation - always returns true
 * 
 * @returns Whether the beta features feature flag is enabled
 */
export function useBetaFeatures(): boolean {
  return true;
} 