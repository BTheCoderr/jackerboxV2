import Statsig, { StatsigUser } from 'statsig-node';
import { STATSIG_CONFIG } from './statsig-config';

// Initialize Statsig on the server
let isInitialized = false;

const initializeServerStatsig = async () => {
  if (isInitialized) return;
  
  try {
    await Statsig.initialize(STATSIG_CONFIG.SERVER_API_KEY);
    isInitialized = true;
    console.log('Server Statsig initialized successfully');
  } catch (error) {
    console.error('Failed to initialize server Statsig:', error);
  }
};

// Default anonymous user
const anonymousUser: StatsigUser = { userID: 'anonymous' };

/**
 * Check if a feature flag is enabled on the server
 * @param featureKey The feature flag key to check
 * @param user Optional user object to check against
 * @returns boolean indicating if the feature is enabled
 */
export const checkServerFeatureFlag = async (
  featureKey: string,
  user?: StatsigUser,
): Promise<boolean> => {
  await initializeServerStatsig();
  
  return Statsig.checkGateWithExposureLoggingDisabled(
    user || anonymousUser,
    featureKey
  );
};

/**
 * Get a dynamic config value on the server
 * @param configKey The config key to get
 * @param user Optional user object to check against
 * @returns The config value
 */
export const getServerDynamicConfig = async (
  configKey: string,
  user?: StatsigUser
): Promise<any> => {
  await initializeServerStatsig();
  
  return Statsig.getConfigWithExposureLoggingDisabled(
    user || anonymousUser,
    configKey
  ).value;
};

/**
 * Get an experiment value on the server
 * @param experimentKey The experiment key to get
 * @param user Optional user object to check against
 * @returns The experiment value
 */
export const getServerExperiment = async (
  experimentKey: string,
  user?: StatsigUser
): Promise<any> => {
  await initializeServerStatsig();
  
  const experiment = Statsig.getExperimentWithExposureLoggingDisabled(
    user || anonymousUser,
    experimentKey
  );
  return experiment.value;
};

/**
 * Create a Statsig user object from a user object for server-side evaluation
 * @param user The user object to create a Statsig user from
 * @returns A Statsig user object
 */
export const createServerStatsigUser = (user: any): StatsigUser => {
  return {
    userID: user.id || user.userId || user.sub || 'anonymous',
    email: user.email,
    custom: {
      role: user.role || 'user',
    },
  };
}; 