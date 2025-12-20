/**
 * Storage Migration Service
 *
 * Handles migration from V1 (6 separate storage files) to V2 (single unified file)
 *
 * V1 Storage Keys:
 * - lifeos_data (main data with simplified freelancing/programming)
 * - lifeos-freelancing-projects
 * - lifeos-freelancing-project-tasks
 * - lifeos-freelancing-standalone-tasks
 * - lifeos-programming-data
 * - lifeos-finance-data
 *
 * V2 Storage Key:
 * - lifeos (single unified storage)
 */

import type { AppData, FreelancingData } from "../types";

// Storage keys
const V1_KEYS = {
    MAIN: "lifeos_data",
    FREELANCING_PROJECTS: "lifeos-freelancing-projects",
    FREELANCING_PROJECT_TASKS: "lifeos-freelancing-project-tasks",
    FREELANCING_STANDALONE_TASKS: "lifeos-freelancing-standalone-tasks",
    PROGRAMMING: "lifeos-programming-data",
    FINANCE: "lifeos-finance-data",
} as const;

const V2_KEY = "lifeos";
const MIGRATION_BACKUP_KEY = "lifeos_v1_backup";
const MIGRATION_STATUS_KEY = "lifeos_migration_status";

export type StorageVersion = "1.0.0" | "2.0.0" | null;

export interface StorageV2 {
    version: "2.0.0";
    lastModified: string;
    created: string;
    data: AppData;
}

export interface MigrationStatus {
    attempted: boolean;
    success: boolean;
    timestamp: string;
    fromVersion: string;
    toVersion: string;
    error?: string;
    backupCreated: boolean;
}

export interface MigrationResult {
    success: boolean;
    message: string;
    data?: StorageV2;
    error?: string;
}

/**
 * Detect current storage version
 */
export function detectStorageVersion(): StorageVersion {
    // Check for V2 first
    const v2Data = localStorage.getItem(V2_KEY);
    if (v2Data) {
        try {
            const parsed = JSON.parse(v2Data);
            if (parsed.version === "2.0.0") {
                return "2.0.0";
            }
        } catch {
            // Invalid V2 data, check for V1
        }
    }

    // Check for V1
    const v1Data = localStorage.getItem(V1_KEYS.MAIN);
    if (v1Data) {
        return "1.0.0";
    }

    // No existing data (fresh install)
    return null;
}

/**
 * Check if migration is needed
 */
export function needsMigration(): boolean {
    const version = detectStorageVersion();
    return version === "1.0.0";
}

/**
 * Get migration status
 */
export function getMigrationStatus(): MigrationStatus | null {
    const stored = localStorage.getItem(MIGRATION_STATUS_KEY);
    if (!stored) return null;

    try {
        return JSON.parse(stored);
    } catch {
        return null;
    }
}

/**
 * Save migration status
 */
function saveMigrationStatus(status: MigrationStatus): void {
    localStorage.setItem(MIGRATION_STATUS_KEY, JSON.stringify(status));
}

/**
 * Create backup of V1 data
 */
function createV1Backup(): boolean {
    try {
        const backup: Record<string, string | null> = {};

        // Backup all V1 keys
        for (const [key, storageKey] of Object.entries(V1_KEYS)) {
            backup[key] = localStorage.getItem(storageKey);
        }

        localStorage.setItem(MIGRATION_BACKUP_KEY, JSON.stringify(backup));
        console.log("✅ V1 backup created successfully");
        return true;
    } catch (error) {
        console.error("❌ Failed to create V1 backup:", error);
        return false;
    }
}

/**
 * Restore V1 data from backup (rollback)
 */
export function restoreV1FromBackup(): boolean {
    try {
        const backup = localStorage.getItem(MIGRATION_BACKUP_KEY);
        if (!backup) {
            console.error("❌ No backup found");
            return false;
        }

        const parsed = JSON.parse(backup);

        // Restore all V1 keys
        for (const [key, storageKey] of Object.entries(V1_KEYS)) {
            const value = parsed[key];
            if (value) {
                localStorage.setItem(storageKey, value);
            }
        }

        // Remove V2 data
        localStorage.removeItem(V2_KEY);

        console.log("✅ V1 data restored from backup");
        return true;
    } catch (error) {
        console.error("❌ Failed to restore V1 backup:", error);
        return false;
    }
}

/**
 * Load and parse V1 storage data
 */
function loadV1Data(): {
    mainData: any;
    freelancingProjects: any[];
    freelancingProjectTasks: any[];
    freelancingStandaloneTasks: any[];
    programmingData: any;
    financeData: any;
} {
    const mainData = JSON.parse(localStorage.getItem(V1_KEYS.MAIN) || "{}");
    const freelancingProjects = JSON.parse(
        localStorage.getItem(V1_KEYS.FREELANCING_PROJECTS) || "[]"
    );
    const freelancingProjectTasks = JSON.parse(
        localStorage.getItem(V1_KEYS.FREELANCING_PROJECT_TASKS) || "[]"
    );
    const freelancingStandaloneTasks = JSON.parse(
        localStorage.getItem(V1_KEYS.FREELANCING_STANDALONE_TASKS) || "[]"
    );
    const programmingData = JSON.parse(
        localStorage.getItem(V1_KEYS.PROGRAMMING) ||
            JSON.stringify({
                learningItems: [],
                skills: [],
                tools: [],
                projects: [],
            })
    );
    const financeData = JSON.parse(
        localStorage.getItem(V1_KEYS.FINANCE) ||
            JSON.stringify({
                incomes: [],
                expenses: [],
                categories: [],
                installments: [],
                budgets: [],
                goals: [],
                alerts: [],
                settings: {
                    defaultCurrency: "USD",
                    monthStartDay: 1,
                    showCents: true,
                    enableBudgetAlerts: true,
                    budgetWarningThreshold: 80,
                    enableInstallmentReminders: true,
                    installmentReminderDays: 3,
                    enableInsights: true,
                    weeklyReportEnabled: false,
                    monthlyReportEnabled: true,
                },
            })
    );

    return {
        mainData,
        freelancingProjects,
        freelancingProjectTasks,
        freelancingStandaloneTasks,
        programmingData,
        financeData,
    };
}

/**
 * Get default data for each module
 * Exported for use by other storage utilities
 */
export function getDefaultModuleData(): AppData {
    return {
        university: {
            subjects: [],
            tasks: [],
            exams: [],
            gradeEntries: [],
            academicYears: [],
            terms: [],
            currentYearId: undefined,
            currentTermId: undefined,
        },
        freelancing: {
            profile: {
                name: "",
                title: "",
                email: "",
                phone: "",
                portfolioUrl: "",
                cvVersions: [],
                platforms: [],
            },
            applications: [],
            projects: [],
            projectTasks: [],
            standaloneTasks: [],
        },
        programming: {
            learningItems: [],
            skills: [],
            tools: [],
            projects: [],
        },
        finance: {
            incomes: [],
            expenses: [],
            categories: [],
            installments: [],
            budgets: [],
            goals: [],
            alerts: [],
            settings: {
                defaultCurrency: "USD",
                monthStartDay: 1,
                showCents: true,
                enableBudgetAlerts: true,
                budgetWarningThreshold: 80,
                enableInstallmentReminders: true,
                installmentReminderDays: 3,
                enableInsights: true,
                weeklyReportEnabled: false,
                monthlyReportEnabled: true,
            },
        },
        home: {
            tasks: [],
            goals: [],
            habits: [],
        },
        misc: {
            notes: [],
            bookmarks: [],
            quickCaptures: [],
        },
        settings: {
            theme: "dark" as const,
            userName: "User",
            email: "",
        },
        notificationSettings: {
            dismissedNotifications: [],
            neverShowAgain: [],
        },
    };
}

/**
 * Migrate V1 data to V2 structure
 */
export function migrateV1ToV2(): MigrationResult {
    try {
        console.log("🔄 Starting migration from V1 to V2...");

        // Step 1: Create backup
        const backupCreated = createV1Backup();
        if (!backupCreated) {
            return {
                success: false,
                message:
                    "Failed to create backup. Migration aborted for safety.",
                error: "Backup creation failed",
            };
        }

        // Step 2: Load V1 data
        const v1Data = loadV1Data();
        const defaults = getDefaultModuleData();

        // Step 3: Construct FreelancingData with full details
        const freelancingData: FreelancingData = {
            profile:
                v1Data.mainData.freelancing?.profile ||
                defaults.freelancing.profile,
            applications:
                v1Data.mainData.freelancing?.applications ||
                defaults.freelancing.applications,
            projects: v1Data.freelancingProjects,
            projectTasks: v1Data.freelancingProjectTasks,
            standaloneTasks: v1Data.freelancingStandaloneTasks,
        };

        // Step 4: Use ProgrammingData directly (already has correct structure)
        const programmingData = v1Data.programmingData;

        // Step 5: Construct V2 storage structure
        const v2Storage: StorageV2 = {
            version: "2.0.0",
            lastModified: new Date().toISOString(),
            created: new Date().toISOString(),
            data: {
                university: v1Data.mainData.university || defaults.university,
                freelancing: freelancingData,
                programming: programmingData,
                finance: v1Data.financeData,
                home: v1Data.mainData.home || defaults.home,
                misc: v1Data.mainData.misc || defaults.misc,
                settings: v1Data.mainData.settings || defaults.settings,
                notificationSettings: defaults.notificationSettings,
            },
        };

        // Step 6: Save V2 data
        localStorage.setItem(V2_KEY, JSON.stringify(v2Storage));

        // Step 7: Save migration status
        const status: MigrationStatus = {
            attempted: true,
            success: true,
            timestamp: new Date().toISOString(),
            fromVersion: "1.0.0",
            toVersion: "2.0.0",
            backupCreated: true,
        };
        saveMigrationStatus(status);

        console.log("✅ Migration completed successfully!");

        return {
            success: true,
            message: "Migration completed successfully. V1 data backed up.",
            data: v2Storage,
        };
    } catch (error) {
        console.error("❌ Migration failed:", error);

        // Save failed status
        const status: MigrationStatus = {
            attempted: true,
            success: false,
            timestamp: new Date().toISOString(),
            fromVersion: "1.0.0",
            toVersion: "2.0.0",
            error: error instanceof Error ? error.message : "Unknown error",
            backupCreated: true,
        };
        saveMigrationStatus(status);

        return {
            success: false,
            message: "Migration failed. V1 data is still intact.",
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}

/**
 * Clean up old V1 storage keys
 * Only call this after confirming V2 works properly
 */
export function cleanupV1Storage(keepBackup: boolean = true): void {
    try {
        // Remove V1 storage keys
        for (const storageKey of Object.values(V1_KEYS)) {
            localStorage.removeItem(storageKey);
        }

        if (!keepBackup) {
            localStorage.removeItem(MIGRATION_BACKUP_KEY);
        }

        console.log("✅ V1 storage cleaned up");
    } catch (error) {
        console.error("❌ Failed to cleanup V1 storage:", error);
    }
}

/**
 * Validate V2 storage structure
 */
export function validateV2Storage(data: any): {
    valid: boolean;
    errors: string[];
} {
    const errors: string[] = [];

    // Check version
    if (data.version !== "2.0.0") {
        errors.push(`Invalid version: ${data.version}`);
    }

    // Check required top-level fields
    if (!data.data) {
        errors.push("Missing 'data' field");
        return { valid: false, errors }; // Can't continue without data
    }

    // Check required modules
    const requiredModules = [
        "university",
        "freelancing",
        "programming",
        "finance",
        "home",
        "misc",
        "settings",
    ];
    for (const module of requiredModules) {
        if (!data.data[module]) {
            errors.push(`Missing module: ${module}`);
        }
    }

    // Check freelancing structure
    if (data.data.freelancing) {
        const fl = data.data.freelancing;
        if (!fl.profile) errors.push("Missing freelancing.profile");
        if (!fl.applications) errors.push("Missing freelancing.applications");
        if (!fl.projects) errors.push("Missing freelancing.projects");
        if (!fl.projectTasks) errors.push("Missing freelancing.projectTasks");
        if (!fl.standaloneTasks)
            errors.push("Missing freelancing.standaloneTasks");
    }

    // Check programming structure
    if (data.data.programming) {
        const pg = data.data.programming;
        if (!pg.learningItems) errors.push("Missing programming.learningItems");
        if (!pg.skills) errors.push("Missing programming.skills");
        if (!pg.tools) errors.push("Missing programming.tools");
        if (!pg.projects) errors.push("Missing programming.projects");
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}

/**
 * Load V2 storage data
 */
export function loadV2Storage(): StorageV2 | null {
    try {
        const stored = localStorage.getItem(V2_KEY);
        if (!stored) return null;

        const parsed = JSON.parse(stored);
        const validation = validateV2Storage(parsed);

        if (!validation.valid) {
            console.error("❌ Invalid V2 storage:", validation.errors);
            return null;
        }

        return parsed;
    } catch (error) {
        console.error("❌ Failed to load V2 storage:", error);
        return null;
    }
}

/**
 * Save V2 storage data
 */
export function saveV2Storage(data: AppData): void {
    try {
        const existing = loadV2Storage();
        const v2Storage: StorageV2 = {
            version: "2.0.0",
            lastModified: new Date().toISOString(),
            created: existing?.created || new Date().toISOString(),
            data,
        };

        localStorage.setItem(V2_KEY, JSON.stringify(v2Storage));
    } catch (error) {
        console.error("❌ Failed to save V2 storage:", error);
        throw error;
    }
}

/**
 * Initialize storage (handles both fresh install and existing users)
 */
export function initializeStorage(): {
    version: StorageVersion;
    data: AppData;
} {
    const currentVersion = detectStorageVersion();

    if (currentVersion === "2.0.0") {
        // Already on V2
        const v2Data = loadV2Storage();
        if (v2Data) {
            return { version: "2.0.0", data: v2Data.data };
        }
    }

    if (currentVersion === "1.0.0") {
        // Needs migration - but don't auto-migrate, let user decide
        console.warn("⚠️ V1 storage detected. Please run migration.");
        // For now, return V1 data in V2 format
        const v1Data = loadV1Data();
        const defaults = getDefaultModuleData();
        return {
            version: "1.0.0",
            data: {
                university: v1Data.mainData.university || defaults.university,
                freelancing: {
                    profile:
                        v1Data.mainData.freelancing?.profile ||
                        defaults.freelancing.profile,
                    applications:
                        v1Data.mainData.freelancing?.applications || [],
                    projects: v1Data.freelancingProjects,
                    projectTasks: v1Data.freelancingProjectTasks,
                    standaloneTasks: v1Data.freelancingStandaloneTasks,
                },
                programming: v1Data.programmingData,
                finance: v1Data.financeData,
                home: v1Data.mainData.home || defaults.home,
                misc: v1Data.mainData.misc || defaults.misc,
                settings: v1Data.mainData.settings || defaults.settings,
                notificationSettings: defaults.notificationSettings,
            },
        };
    }

    // Fresh install - create V2 from scratch
    const defaults = getDefaultModuleData();
    const v2Storage: StorageV2 = {
        version: "2.0.0",
        lastModified: new Date().toISOString(),
        created: new Date().toISOString(),
        data: defaults as AppData,
    };

    localStorage.setItem(V2_KEY, JSON.stringify(v2Storage));

    return { version: "2.0.0", data: defaults as AppData };
}
