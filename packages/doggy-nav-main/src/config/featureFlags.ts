/**
 * Feature Flags Configuration
 *
 * This file contains all feature toggles for the application.
 * Use these flags to enable/disable features during development or production.
 */

export interface FeatureFlags {
  /** Enable/disable language switching functionality */
  lang_switch: boolean;
  // Add more feature flags here as needed
}

/**
 * Global feature flags configuration
 * Set to false to disable a feature, true to enable it
 */
export const featureFlags: FeatureFlags = {
  lang_switch: false,
};

/**
 * Helper function to check if a feature is enabled
 * @param feature - The feature flag to check
 * @returns boolean indicating if the feature is enabled
 */
export const isFeatureEnabled = (feature: keyof FeatureFlags): boolean => {
  return !!featureFlags[feature];
};

/**
 * Helper function to get all enabled features
 * @returns Array of enabled feature names
 */
export const getEnabledFeatures = (): (keyof FeatureFlags)[] => {
  return Object.entries(featureFlags)
    .filter(([, enabled]) => enabled)
    .map(([feature]) => feature as keyof FeatureFlags);
};

/**
 * Development helper to override feature flags at runtime
 * Only available in development mode
 */
export const setFeatureFlag = (feature: keyof FeatureFlags, enabled: boolean): void => {
  if (process.env.NODE_ENV === 'development') {
    featureFlags[feature] = enabled;
    console.log(`Feature flag '${feature}' set to: ${enabled}`);
  } else {
    console.warn('Feature flag overrides are only available in development mode');
  }
};

export default featureFlags;