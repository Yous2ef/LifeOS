/**
 * LifeOS Unified Storage (V2)
 *
 * This is the main storage module for LifeOS, using a unified single-key
 * storage architecture with proper TypeScript types.
 *
 * Features:
 * - Single localStorage key: "lifeos"
 * - Unified AppData structure with all modules
 * - Automatic V1 → V2 migration on first load
 * - Full TypeScript type safety
 * - Export/Import with format detection
 *
 * @version 2.0.0
 */

import type {
    AppData,
    FreelancingData,
    ProgrammingData,
    FinanceData,
} from "../types";
import {
    // Default data factories from types
    createDefaultAppData,
    createDefaultFreelancerProfile,
    mergeWithDefaults,
} from "../types";
import {
    hasV1Storage,
    consolidateV1Data,
    backupV1Storage,
    clearV1Storage,
} from "./legacyStorage";

// ============================================================================
// V2 STORAGE CONSTANTS
// ============================================================================

export const V2_STORAGE_KEY = "lifeos";
export const V2_VERSION = "2.0.0";
const FIRST_TIME_KEY = "lifeos_first_time";

// ============================================================================
// V2 STORAGE SCHEMA
// ============================================================================

/**
 * V2 Storage wrapper with metadata
 */
export interface StorageV2 {
    version: "2.0.0";
    lastModified: string; // ISO 8601 timestamp
    created: string; // ISO 8601 timestamp
    data: AppData;
}

// ============================================================================
// V2 STORAGE OPERATIONS
// ============================================================================

/**
 * Detect current storage version
 */
export function detectStorageVersion(): "1.0.0" | "2.0.0" | null {
    // Check for V2 first
    const v2Data = localStorage.getItem(V2_STORAGE_KEY);
    if (v2Data) {
        try {
            const parsed = JSON.parse(v2Data);
            if (parsed.version === "2.0.0") {
                return "2.0.0";
            }
        } catch {
            // Invalid V2 data
        }
    }

    // Check for V1
    if (hasV1Storage()) {
        return "1.0.0";
    }

    // Fresh install
    return null;
}

/**
 * Load V2 storage data
 */
export function loadV2Storage(): StorageV2 | null {
    try {
        const stored = localStorage.getItem(V2_STORAGE_KEY);
        if (!stored) return null;

        const parsed = JSON.parse(stored) as StorageV2;

        // Validate it's actually V2
        if (parsed.version !== "2.0.0") {
            console.warn("⚠️ Storage version mismatch, expected 2.0.0");
            return null;
        }

        return parsed;
    } catch (error) {
        console.error("❌ Failed to load V2 storage:", error);
        return null;
    }
}

/**
 * Save data to V2 storage
 */
export function saveV2Storage(data: AppData): void {
    const storage: StorageV2 = {
        version: "2.0.0",
        lastModified: new Date().toISOString(),
        created: loadV2Storage()?.created ?? new Date().toISOString(),
        data,
    };

    try {
        localStorage.setItem(V2_STORAGE_KEY, JSON.stringify(storage));
    } catch (error) {
        console.error("❌ Failed to save V2 storage:", error);
        throw error;
    }
}

// ============================================================================
// MAIN STORAGE API
// ============================================================================

/**
 * Load application data
 *
 * Handles:
 * - Fresh install → Returns default data and saves V2
 * - V1 exists → Migrates to V2 and returns data
 * - V2 exists → Returns V2 data
 */
export function loadData(): AppData {
    const version = detectStorageVersion();

    if (version === "2.0.0") {
        // Already on V2
        const v2 = loadV2Storage();
        if (v2) {
            return mergeWithDefaults(v2.data);
        }
    }

    if (version === "1.0.0") {
        // V1 exists - migrate
        console.log("🔄 Migrating from V1 to V2 storage...");

        // Backup V1 first
        backupV1Storage();

        // Consolidate V1 data into unified structure
        const consolidatedData = consolidateV1Data();

        // Save as V2
        saveV2Storage(consolidatedData);

        console.log("✅ Migration to V2 complete");
        return consolidatedData;
    }

    // Fresh install
    console.log("🆕 Fresh install - creating default storage");
    const defaultData = createDefaultAppData();
    saveV2Storage(defaultData);
    return defaultData;
}

/**
 * Save application data
 */
export function saveData(data: AppData): void {
    saveV2Storage(data);
}

/**
 * Clear all storage (V1 and V2)
 */
export function clearAllData(): void {
    localStorage.removeItem(V2_STORAGE_KEY);
    clearV1Storage();
    console.log("🗑️ All storage cleared");
}

// ============================================================================
// FIRST TIME SETUP
// ============================================================================

/**
 * Check if this is the first time the user opens the app
 */
export function isFirstTime(): boolean {
    return localStorage.getItem(FIRST_TIME_KEY) === null;
}

/**
 * Mark that the user has completed first-time setup
 */
export function markFirstTimeComplete(): void {
    localStorage.setItem(FIRST_TIME_KEY, "completed");
}

// ============================================================================
// EXPORT / IMPORT
// ============================================================================

/**
 * Export format type for import detection
 */
type ExportFormat = "v2" | "v1" | "legacy";

/**
 * Detect the format of imported data
 */
function detectExportFormat(data: unknown): ExportFormat {
    if (typeof data !== "object" || data === null) return "legacy";

    const obj = data as Record<string, unknown>;

    // V2: Has version "2.0.0" and data property
    if (obj.version === "2.0.0" && obj.data) {
        return "v2";
    }

    // V1: Has version "1.0.0" and extended data properties
    if (
        obj.version === "1.0.0" &&
        (obj.freelancingExtended || obj.programmingExtended)
    ) {
        return "v1";
    }

    // Legacy: Direct data object
    return "legacy";
}

/**
 * Export application data as JSON file
 */
export function exportData(): void {
    const data = loadData();

    const exportPayload: StorageV2 = {
        version: "2.0.0",
        lastModified: new Date().toISOString(),
        created: new Date().toISOString(),
        data,
    };

    const jsonString = JSON.stringify(exportPayload, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `lifeos_backup_v2_${
        new Date().toISOString().split("T")[0]
    }.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    console.log("📦 Data exported in V2 format");
}

/**
 * Import application data from JSON file
 * Supports V1, V2, and legacy formats
 */
export function importData(file: File): Promise<AppData> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const content = e.target?.result as string;
                const parsed = JSON.parse(content);

                const format = detectExportFormat(parsed);
                console.log(`📦 Importing ${format} format data...`);

                let importedData: Partial<AppData>;

                switch (format) {
                    case "v2":
                        // V2: Data is already unified
                        importedData = (parsed as StorageV2).data;
                        break;

                    case "v1":
                        // V1: Need to merge extended data
                        importedData = parsed.data as Partial<AppData>;

                        // Merge freelancing extended data
                        if (parsed.freelancingExtended) {
                            importedData.freelancing = {
                                ...importedData.freelancing,
                                profile:
                                    importedData.freelancing?.profile ??
                                    createDefaultFreelancerProfile(),
                                applications:
                                    importedData.freelancing?.applications ??
                                    [],
                                projects:
                                    parsed.freelancingExtended.projects ?? [],
                                projectTasks:
                                    parsed.freelancingExtended.projectTasks ??
                                    [],
                                standaloneTasks:
                                    parsed.freelancingExtended
                                        .standaloneTasks ?? [],
                            } as FreelancingData;
                        }

                        // Merge programming extended data
                        if (parsed.programmingExtended) {
                            importedData.programming =
                                parsed.programmingExtended as ProgrammingData;
                        }

                        // Merge finance data
                        if (parsed.financeData) {
                            importedData.finance =
                                parsed.financeData as FinanceData;
                        }
                        break;

                    case "legacy":
                    default:
                        // Legacy: Direct data object
                        importedData = parsed as Partial<AppData>;
                        break;
                }

                // Merge with defaults and save
                const finalData = mergeWithDefaults(importedData);
                saveV2Storage(finalData);

                console.log("✅ Import complete - saved as V2");
                resolve(finalData);
            } catch (error) {
                console.error("❌ Import failed:", error);
                reject(
                    new Error(
                        "Invalid data format. Please check the file and try again."
                    )
                );
            }
        };

        reader.onerror = () => {
            reject(new Error("Failed to read file. Please try again."));
        };

        reader.readAsText(file);
    });
}
