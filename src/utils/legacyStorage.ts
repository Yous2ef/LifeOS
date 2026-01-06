/**
 * Legacy Storage (V1) - Deprecated
 *
 * This file contains the legacy V1 storage implementation that used 6 separate
 * localStorage keys. This is kept for backward compatibility during migration.
 *
 * V1 Storage Keys:
 * - lifeos_data (main data with simplified freelancing/programming)
 * - lifeos-freelancing-projects
 * - lifeos-freelancing-project-tasks
 * - lifeos-freelancing-standalone-tasks
 * - lifeos-programming-data
 * - lifeos-finance-data
 *
 * @deprecated Use the new unified storage in storage.ts instead
 * This file will be removed after migration period ends.
 */

import type { AppData } from "../types";
import type {
    Project,
    FreelancingProjectTask as ProjectTask,
    StandaloneTask,
} from "../types";
import type { ProgrammingData } from "../types";
import type { FinanceData } from "../types";

// Import defaults from types
import {
    createDefaultProgrammingData,
    createDefaultFreelancerProfile,
    createDefaultFinanceSettings,
} from "../types";

// ============================================================================
// V1 STORAGE KEYS
// ============================================================================

export const V1_STORAGE_KEYS = {
    MAIN: "lifeos_data",
    FREELANCING_PROJECTS: "lifeos-freelancing-projects",
    FREELANCING_PROJECT_TASKS: "lifeos-freelancing-project-tasks",
    FREELANCING_STANDALONE_TASKS: "lifeos-freelancing-standalone-tasks",
    PROGRAMMING: "lifeos-programming-data",
    FINANCE: "lifeos-finance-data",
    FIRST_TIME: "lifeos_first_time",
    // Legacy notification keys (now unified in V2)
    DISMISSED_NOTIFICATIONS: "lifeos_dismissed_notifications",
    NEVER_SHOW_NOTIFICATIONS: "lifeos_never_show_notifications",
    // Legacy theme key (now unified in V2 settings)
    THEME: "lifeos-ui-theme",
} as const;

export type V1StorageKey =
    (typeof V1_STORAGE_KEYS)[keyof typeof V1_STORAGE_KEYS];

// ============================================================================
// V1 DATA LOADING
// ============================================================================

/**
 * Load raw V1 data from all 6 localStorage keys
 */
export function loadV1RawData(): {
    mainData: Partial<AppData> | null;
    freelancingProjects: Project[];
    freelancingProjectTasks: ProjectTask[];
    freelancingStandaloneTasks: StandaloneTask[];
    programmingData: ProgrammingData;
    financeData: FinanceData | null;
} {
    // Load main data
    let mainData: Partial<AppData> | null = null;
    const mainStored = localStorage.getItem(V1_STORAGE_KEYS.MAIN);
    if (mainStored) {
        try {
            mainData = JSON.parse(mainStored);
        } catch {
            console.error("❌ Failed to parse V1 main data");
        }
    }

    // Load freelancing projects
    let freelancingProjects: Project[] = [];
    const projectsStored = localStorage.getItem(
        V1_STORAGE_KEYS.FREELANCING_PROJECTS
    );
    if (projectsStored) {
        try {
            freelancingProjects = JSON.parse(projectsStored);
        } catch {
            console.error("❌ Failed to parse V1 freelancing projects");
        }
    }

    // Load freelancing project tasks
    let freelancingProjectTasks: ProjectTask[] = [];
    const projectTasksStored = localStorage.getItem(
        V1_STORAGE_KEYS.FREELANCING_PROJECT_TASKS
    );
    if (projectTasksStored) {
        try {
            freelancingProjectTasks = JSON.parse(projectTasksStored);
        } catch {
            console.error("❌ Failed to parse V1 freelancing project tasks");
        }
    }

    // Load freelancing standalone tasks
    let freelancingStandaloneTasks: StandaloneTask[] = [];
    const standaloneTasksStored = localStorage.getItem(
        V1_STORAGE_KEYS.FREELANCING_STANDALONE_TASKS
    );
    if (standaloneTasksStored) {
        try {
            freelancingStandaloneTasks = JSON.parse(standaloneTasksStored);
        } catch {
            console.error("❌ Failed to parse V1 freelancing standalone tasks");
        }
    }

    // Load programming data
    let programmingData: ProgrammingData = createDefaultProgrammingData();
    const programmingStored = localStorage.getItem(V1_STORAGE_KEYS.PROGRAMMING);
    if (programmingStored) {
        try {
            programmingData = JSON.parse(programmingStored);
        } catch {
            console.error("❌ Failed to parse V1 programming data");
        }
    }

    // Load finance data
    let financeData: FinanceData | null = null;
    const financeStored = localStorage.getItem(V1_STORAGE_KEYS.FINANCE);
    if (financeStored) {
        try {
            financeData = JSON.parse(financeStored);
        } catch {
            console.error("❌ Failed to parse V1 finance data");
        }
    }

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
 * Check if V1 storage exists
 */
export function hasV1Storage(): boolean {
    return localStorage.getItem(V1_STORAGE_KEYS.MAIN) !== null;
}

/**
 * Consolidate V1 data from 6 separate keys into unified AppData structure
 */
export function consolidateV1Data(): AppData {
    const {
        mainData,
        freelancingProjects,
        freelancingProjectTasks,
        freelancingStandaloneTasks,
        programmingData,
        financeData,
    } = loadV1RawData();

    // Build unified structure from V1 scattered data
    const consolidated: AppData = {
        university: mainData?.university ?? {
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
            profile:
                mainData?.freelancing?.profile ??
                createDefaultFreelancerProfile(),
            applications: mainData?.freelancing?.applications ?? [],
            // Use data from separate storage keys (the actual detailed data)
            projects: freelancingProjects,
            projectTasks: freelancingProjectTasks,
            standaloneTasks: freelancingStandaloneTasks,
        },
        programming: programmingData,
        finance: financeData ?? {
            accounts: [],
            transfers: [],
            incomes: [],
            expenses: [],
            categories: [],
            incomeCategories: [],
            installments: [],
            budgets: [],
            goals: [],
            alerts: [],
            settings: createDefaultFinanceSettings(),
        },
        home: mainData?.home ?? {
            tasks: [],
            goals: [],
            habits: [],
        },
        misc: mainData?.misc ?? {
            notes: [],
            bookmarks: [],
            quickCaptures: [],
        },
        settings: mainData?.settings ?? {
            theme: "dark",
            userName: "User",
            email: "",
        },
        notificationSettings: {
            dismissedNotifications: [],
            neverShowAgain: [],
        },
    };

    return consolidated;
}

/**
 * Clear all V1 storage keys
 */
export function clearV1Storage(): void {
    Object.values(V1_STORAGE_KEYS).forEach((key) => {
        localStorage.removeItem(key);
    });
    console.log("🗑️ V1 storage cleared");
}

/**
 * Create backup of V1 data before migration
 */
export function backupV1Storage(): string {
    const backup: Record<string, string | null> = {};

    Object.entries(V1_STORAGE_KEYS).forEach(([name, key]) => {
        backup[name] = localStorage.getItem(key);
    });

    const backupJson = JSON.stringify(backup);
    localStorage.setItem("lifeos_v1_backup", backupJson);

    console.log("💾 V1 backup created");
    return backupJson;
}

/**
 * Restore V1 data from backup (for rollback)
 */
export function restoreV1FromBackup(): boolean {
    const backupJson = localStorage.getItem("lifeos_v1_backup");
    if (!backupJson) {
        console.error("❌ No V1 backup found");
        return false;
    }

    try {
        const backup = JSON.parse(backupJson);

        Object.entries(V1_STORAGE_KEYS).forEach(([name, key]) => {
            const value = backup[name];
            if (value) {
                localStorage.setItem(key, value);
            }
        });

        console.log("✅ V1 data restored from backup");
        return true;
    } catch (error) {
        console.error("❌ Failed to restore V1 backup:", error);
        return false;
    }
}

/**
 * Check if V1 backup exists
 */
export function hasV1Backup(): boolean {
    return localStorage.getItem("lifeos_v1_backup") !== null;
}

/**
 * Get V1 backup metadata (size, date)
 */
export function getV1BackupInfo(): { size: number; date: string } | null {
    const backupJson = localStorage.getItem("lifeos_v1_backup");
    if (!backupJson) return null;

    return {
        size: new Blob([backupJson]).size,
        date: new Date().toISOString(), // Backup doesn't store date, use current
    };
}
