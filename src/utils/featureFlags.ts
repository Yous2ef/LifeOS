/**
 * LifeOS Feature Flags
 *
 * Simple feature flag system for gradual rollouts and development testing.
 * Flags are stored in localStorage and can be toggled via Settings.
 */

export interface FeatureFlags {
    /** Use V2 unified storage (single key) */
    useUnifiedStorage: boolean;
    /** Show debug information in console */
    debugMode: boolean;
    /** Enable experimental features */
    experimentalFeatures: boolean;
}

const FEATURE_FLAGS_KEY = "lifeos_feature_flags";

const DEFAULT_FLAGS: FeatureFlags = {
    useUnifiedStorage: true, // V2 is default now
    debugMode: false,
    experimentalFeatures: false,
};

/**
 * Get all feature flags
 */
export function getFeatureFlags(): FeatureFlags {
    try {
        const stored = localStorage.getItem(FEATURE_FLAGS_KEY);
        if (stored) {
            return { ...DEFAULT_FLAGS, ...JSON.parse(stored) };
        }
    } catch (error) {
        console.error("Failed to load feature flags:", error);
    }
    return DEFAULT_FLAGS;
}

/**
 * Get a specific feature flag value
 */
export function getFeatureFlag<K extends keyof FeatureFlags>(
    flag: K
): FeatureFlags[K] {
    const flags = getFeatureFlags();
    return flags[flag];
}

/**
 * Set a specific feature flag
 */
export function setFeatureFlag<K extends keyof FeatureFlags>(
    flag: K,
    value: FeatureFlags[K]
): void {
    const flags = getFeatureFlags();
    flags[flag] = value;
    localStorage.setItem(FEATURE_FLAGS_KEY, JSON.stringify(flags));
}

/**
 * Reset all feature flags to defaults
 */
export function resetFeatureFlags(): void {
    localStorage.setItem(FEATURE_FLAGS_KEY, JSON.stringify(DEFAULT_FLAGS));
}

/**
 * Check if unified storage (V2) should be used
 * This is the main feature flag for storage migration
 */
export function shouldUseUnifiedStorage(): boolean {
    return getFeatureFlag("useUnifiedStorage");
}

/**
 * Check if debug mode is enabled
 */
export function isDebugMode(): boolean {
    return getFeatureFlag("debugMode");
}
