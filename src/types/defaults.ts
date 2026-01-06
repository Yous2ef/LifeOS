/**
 * LifeOS Default Data Factories
 *
 * This file contains factory functions that create default/initial data
 * for all modules. These are the single source of truth for default values.
 *
 * Usage:
 * - Fresh install initialization
 * - Merging with partial data to fill missing fields
 * - Testing and development
 * - Reset functionality
 */

import type { AppData } from "./index";
import type { UniversityData } from "./modules/university";
import type { HomeData } from "./modules/home";
import type { MiscData } from "./modules/misc";
import type { FinanceData, FinanceSettings } from "./modules/finance";
import type { FreelancingData, FreelancerProfile } from "./modules/freelancing";
import type { ProgrammingData } from "./modules/programming";
import type { SettingsData } from "./core/settings";
import type { NotificationSettings } from "./core/common";

// ============================================================================
// CORE DEFAULTS
// ============================================================================

/**
 * Create default application settings
 */
export const createDefaultSettings = (): SettingsData => ({
    theme: "dark",
    userName: "User",
    email: "",
    backup: {
        autoBackupEnabled: false,
        frequency: "weekly",
        lastBackupTime: null,
        maxBackups: 5,
    },
});

/**
 * Create default notification settings
 */
export const createDefaultNotificationSettings = (): NotificationSettings => ({
    dismissedNotifications: [],
    neverShowAgain: [],
});

// ============================================================================
// UNIVERSITY MODULE DEFAULTS
// ============================================================================

/**
 * Create default university data
 */
export const createDefaultUniversityData = (): UniversityData => ({
    subjects: [],
    tasks: [],
    exams: [],
    gradeEntries: [],
    academicYears: [],
    terms: [],
    currentYearId: undefined,
    currentTermId: undefined,
});

// ============================================================================
// FREELANCING MODULE DEFAULTS
// ============================================================================

/**
 * Create default freelancer profile
 */
export const createDefaultFreelancerProfile = (): FreelancerProfile => ({
    name: "",
    title: "",
    email: "",
    phone: "",
    portfolioUrl: "",
    cvVersions: [],
    platforms: [],
});

/**
 * Create default freelancing data
 */
export const createDefaultFreelancingData = (): FreelancingData => ({
    profile: createDefaultFreelancerProfile(),
    applications: [],
    projects: [],
    projectTasks: [],
    standaloneTasks: [],
});

// ============================================================================
// PROGRAMMING MODULE DEFAULTS
// ============================================================================

/**
 * Create default programming data
 */
export const createDefaultProgrammingData = (): ProgrammingData => ({
    learningItems: [],
    skills: [],
    tools: [],
    projects: [],
});

// ============================================================================
// FINANCE MODULE DEFAULTS
// ============================================================================

/**
 * Create default finance settings
 */
export const createDefaultFinanceSettings = (): FinanceSettings => ({
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
});

/**
 * Create default finance data
 */
export const createDefaultFinanceData = (): FinanceData => ({
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
});

// ============================================================================
// HOME MODULE DEFAULTS
// ============================================================================

/**
 * Create default home data
 */
export const createDefaultHomeData = (): HomeData => ({
    tasks: [],
    goals: [],
    habits: [],
});

// ============================================================================
// MISC MODULE DEFAULTS
// ============================================================================

/**
 * Create default misc data
 */
export const createDefaultMiscData = (): MiscData => ({
    notes: [],
    bookmarks: [],
    quickCaptures: [],
});

// ============================================================================
// MAIN APP DATA DEFAULT
// ============================================================================

/**
 * Create complete default AppData
 * Composes all module defaults into unified structure
 */
export const createDefaultAppData = (): AppData => ({
    university: createDefaultUniversityData(),
    freelancing: createDefaultFreelancingData(),
    programming: createDefaultProgrammingData(),
    finance: createDefaultFinanceData(),
    home: createDefaultHomeData(),
    misc: createDefaultMiscData(),
    settings: createDefaultSettings(),
    notificationSettings: createDefaultNotificationSettings(),
});

/**
 * Merge partial data with defaults to ensure all fields exist
 * Useful when loading data that might be missing new fields
 */
export const mergeWithDefaults = (partial: Partial<AppData>): AppData => {
    const defaults = createDefaultAppData();

    return {
        university: { ...defaults.university, ...partial.university },
        freelancing: {
            ...defaults.freelancing,
            ...partial.freelancing,
            profile: {
                ...defaults.freelancing.profile,
                ...partial.freelancing?.profile,
            },
        },
        programming: { ...defaults.programming, ...partial.programming },
        finance: {
            ...defaults.finance,
            ...partial.finance,
            settings: {
                ...defaults.finance.settings,
                ...partial.finance?.settings,
            },
        },
        home: { ...defaults.home, ...partial.home },
        misc: { ...defaults.misc, ...partial.misc },
        settings: { ...defaults.settings, ...partial.settings },
        notificationSettings: {
            ...defaults.notificationSettings,
            ...partial.notificationSettings,
        },
    };
};
