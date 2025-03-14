'use client';

import { useStatsigClient } from '@statsig/react-bindings';
import { FEATURE_FLAGS, EXPERIMENTS } from '@/lib/statsig-config';

/**
 * Hook to check if a feature flag is enabled
 * 
 * @param featureKey The feature flag key to check
 * @param defaultValue The default value to return if the flag is not found
 * @returns Whether the feature flag is enabled
 * 
 * @example
 * const isEnhancedSearchEnabled = useFeatureFlag('enhanced-search');
 * 
 * @example
 * const isEnhancedSearchEnabled = useFeatureFlag(FEATURE_FLAGS.ENHANCED_SEARCH);
 */
export function useFeatureFlag(featureKey: string, defaultValue = false): boolean {
  const { client } = useStatsigClient();
  return client.checkGate(featureKey) ?? defaultValue;
}

/**
 * Hook to get an experiment parameter
 * 
 * @param experimentKey The experiment key
 * @param paramName The parameter name
 * @param defaultValue The default value to return if the parameter is not found
 * @returns The experiment parameter value
 * 
 * @example
 * const layout = useExperimentParam('search-results-layout', 'layout', 'grid');
 * 
 * @example
 * const layout = useExperimentParam(EXPERIMENTS.SEARCH_RESULTS_LAYOUT, 'layout', 'grid');
 */
export function useExperimentParam<T>(
  experimentKey: string,
  paramName: string,
  defaultValue: T
): T {
  const { client } = useStatsigClient();
  const experiment = client.getExperiment(experimentKey);
  return experiment.get(paramName, defaultValue);
}

/**
 * Hook to get a dynamic config
 * 
 * @param configKey The config key
 * @returns The dynamic config
 * 
 * @example
 * const config = useConfig('app_config');
 * const title = config.get('title', 'Default Title');
 */
export function useConfig(configKey: string) {
  const { client } = useStatsigClient();
  return client.getConfig(configKey);
}

/**
 * Hook to get a layer
 * 
 * @param layerKey The layer key
 * @returns The layer
 * 
 * @example
 * const layer = useLayer('homepage_layer');
 * const heroText = layer.get('hero_text', 'Welcome');
 */
export function useLayer(layerKey: string) {
  const { client } = useStatsigClient();
  return client.getLayer(layerKey);
}

/**
 * Hook to check if a specific feature flag is enabled
 * 
 * @returns Whether the enhanced search feature flag is enabled
 */
export function useEnhancedSearch(): boolean {
  return useFeatureFlag(FEATURE_FLAGS.ENHANCED_SEARCH);
}

/**
 * Hook to check if push notifications are enabled
 * 
 * @returns Whether the push notifications feature flag is enabled
 */
export function usePushNotifications(): boolean {
  return useFeatureFlag(FEATURE_FLAGS.PUSH_NOTIFICATIONS);
}

/**
 * Hook to check if the new booking flow is enabled
 * 
 * @returns Whether the new booking flow feature flag is enabled
 */
export function useNewBookingFlow(): boolean {
  return useFeatureFlag(FEATURE_FLAGS.NEW_BOOKING_FLOW);
}

/**
 * Hook to check if dark mode is enabled
 * 
 * @returns Whether the dark mode feature flag is enabled
 */
export function useDarkMode(): boolean {
  return useFeatureFlag(FEATURE_FLAGS.DARK_MODE);
}

/**
 * Hook to check if beta features are enabled
 * 
 * @returns Whether the beta features feature flag is enabled
 */
export function useBetaFeatures(): boolean {
  return useFeatureFlag(FEATURE_FLAGS.BETA_FEATURES);
} 