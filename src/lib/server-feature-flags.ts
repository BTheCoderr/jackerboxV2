import { ServerStatsig, StatsigUser } from 'statsig-node';
import { STATSIG_CONFIG } from './statsig-config';

// Initialize Statsig on the server
let isInitialized = false;

const initializeServerStatsig = async () => {
  if (isInitialized) return;
  
  try {
    await ServerStatsig.initialize(STATSIG_CONFIG.SERVER_API_KEY);
    isInitialized = true;
    console.log('Server Statsig initialized successfully');
  } catch (error) {
    console.error('Failed to initialize server Statsig:', error);
  }
};

// Check if a feature flag is enabled on the server
export const isFeatureEnabledServer = async (
  featureKey: string, 
  user?: StatsigUser, 
  defaultValue = false
): Promise<boolean> => {
  try {
    await initializeServerStatsig();
    
    if (!user) {
      return ServerStatsig.checkGateWithExposureLoggingDisabled(
        featureKey,
        { userID: 'anonymous' }
      );
    }
    
    return ServerStatsig.checkGateWithExposureLoggingDisabled(featureKey, user);
  } catch (error) {
    console.error(`Error checking server feature flag ${featureKey}:`, error);
    return defaultValue;
  }
};

// Get dynamic config for a feature on the server
export const getFeatureConfigServer = async (
  configKey: string, 
  user?: StatsigUser
) => {
  try {
    await initializeServerStatsig();
    
    if (!user) {
      return ServerStatsig.getConfigWithExposureLoggingDisabled(
        configKey,
        { userID: 'anonymous' }
      ).value;
    }
    
    return ServerStatsig.getConfigWithExposureLoggingDisabled(configKey, user).value;
  } catch (error) {
    console.error(`Error getting server config for ${configKey}:`, error);
    return {};
  }
};

// Get experiment parameter on the server
export const getExperimentParamServer = async <T>(
  experimentKey: string, 
  paramName: string, 
  defaultValue: T,
  user?: StatsigUser
): Promise<T> => {
  try {
    await initializeServerStatsig();
    
    if (!user) {
      const experiment = ServerStatsig.getExperimentWithExposureLoggingDisabled(
        experimentKey,
        { userID: 'anonymous' }
      );
      return experiment.get(paramName, defaultValue);
    }
    
    const experiment = ServerStatsig.getExperimentWithExposureLoggingDisabled(experimentKey, user);
    return experiment.get(paramName, defaultValue);
  } catch (error) {
    console.error(`Error getting server experiment param ${paramName} for ${experimentKey}:`, error);
    return defaultValue;
  }
};

// Create a user object for server-side feature flags
export const createServerStatsigUser = (user: any): StatsigUser => {
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