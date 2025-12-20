/**
 * LifeOS Type System - Main Barrel Export
 *
 * This file re-exports all types from the modular type system.
 * All types are organized into their respective modules for better maintainability.
 *
 * Structure:
 * - core/        - Common types and settings
 * - modules/     - Module-specific types (university, home, misc, finance, etc.)
 * - services/    - Service-related types (auth, notifications)
 */

// ============================================================================
// CORE TYPES
// ============================================================================
export * from "./core/common";
export * from "./core/settings";

// ============================================================================
// MODULE TYPES
// ============================================================================
export * from "./modules/university";
export * from "./modules/home";
export * from "./modules/misc";

// Export finance types (has some name conflicts with freelancing, so we export selectively)
export type {
    FinanceData,
    Income,
    Expense,
    ExpenseCategory,
    Installment,
    Budget,
    FinancialGoal,
    FinancialAlert,
    FinanceSettings,
    IncomeType,
    IncomeStatus,
    IncomeFrequency,
    ExpenseType,
    PaymentMethod,
    InstallmentStatus,
    GoalCategory,
    GoalPriority,
    GoalStatus,
    AlertType,
    AlertSeverity,
    BudgetStatus,
    RecurringFrequency,
    InstallmentPayment,
    CategoryBudget,
    GoalMilestone,
    GoalContribution,
    Transaction,
    CategorySpending,
    DailySpending,
    MonthlyTrend,
} from "./modules/finance";

// Export freelancing types
export type {
    Project,
    ProjectTask as FreelancingProjectTask, // Rename to avoid conflict
    StandaloneTask,
    ProjectStatus,
    TaskStatus,
    Currency as FreelancingCurrency, // Rename to avoid conflict
    FinancialStats as FreelancingFinancialStats, // Rename to avoid conflict
    FreelancerProfile,
    JobApplication,
    SimpleProject as FreelancingSimpleProject,
    FreelancingData,
} from "./modules/freelancing";

// Export programming types
export type {
    LearningItem,
    Skill,
    Tool,
    CodingProject,
    ProjectTask as ProgrammingProjectTask, // Rename to avoid conflict
    TimeEntry,
    ProgrammingStats,
    ProgrammingData,
    LearningResource,
    Technology,
    SimpleProject as ProgrammingSimpleProject,
    SimpleSkill,
    ProgrammingModuleData,
} from "./modules/programming";

// ============================================================================
// SERVICE TYPES
// ============================================================================
export * from "./services/auth";
export * from "./services/notifications";

// ============================================================================
// DEFAULT DATA FACTORIES
// ============================================================================
export * from "./defaults";

// ============================================================================
// MAIN APP DATA STRUCTURE
// ============================================================================
import type { UniversityData } from "./modules/university";
import type { HomeData } from "./modules/home";
import type { MiscData } from "./modules/misc";
import type { FinanceData } from "./modules/finance";
import type { FreelancingData } from "./modules/freelancing";
import type { ProgrammingData } from "./modules/programming"; // Use actual storage format
import type { SettingsData } from "./core/settings";
import type { NotificationSettings } from "./core/common";

/**
 * Main application data structure
 * Contains all module data in a unified interface
 */
export interface AppData {
    university: UniversityData;
    freelancing: FreelancingData;
    programming: ProgrammingData; // Use actual storage format
    finance: FinanceData;
    home: HomeData;
    misc: MiscData;
    settings: SettingsData;
    notificationSettings: NotificationSettings;
}
