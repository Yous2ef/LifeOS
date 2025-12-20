/**
 * LifeOS Storage - Main Export
 *
 * This is the main entry point for storage operations.
 * Re-exports from the V2 unified storage system.
 *
 * Architecture:
 * - storageV2.ts: New V2 unified storage (single key, proper types)
 * - legacyStorage.ts: V1 legacy storage (6 keys, for migration)
 *
 * When users with V1 storage load the app:
 * 1. V1 data is detected and backed up
 * 2. Data is consolidated into unified structure
 * 3. Saved to V2 format
 * 4. All future operations use V2
 *
 * @version 2.0.0
 */

// Re-export V2 storage operations
export {
    // Constants
    V2_STORAGE_KEY,
    V2_VERSION,
    // Types
    type StorageV2,
    // Storage operations
    detectStorageVersion,
    loadV2Storage,
    saveV2Storage,
    // Main API
    loadData,
    saveData,
    clearAllData,
    // First time setup
    isFirstTime,
    markFirstTimeComplete,
    // Export/Import
    exportData,
    importData,
} from "./storageV2";

// Re-export default data factories from types (single source of truth)
export {
    createDefaultAppData,
    createDefaultFreelancerProfile,
    createDefaultFreelancingData,
    createDefaultProgrammingData,
    createDefaultFinanceData,
    createDefaultFinanceSettings,
    createDefaultUniversityData,
    createDefaultHomeData,
    createDefaultMiscData,
    createDefaultSettings,
    mergeWithDefaults,
} from "../types";

// Re-export legacy storage for migration utilities
export {
    V1_STORAGE_KEYS,
    hasV1Storage,
    consolidateV1Data,
    backupV1Storage,
    restoreV1FromBackup,
    clearV1Storage,
    hasV1Backup,
    getV1BackupInfo,
} from "./legacyStorage";
