// Finance Module Types

// ==================== Enums & Constants ====================

export type Currency = "EGP" | "USD" | "EUR" | "GBP" | "SAR" | "AED" | "KWD";

export type IncomeType =
    | "salary"
    | "freelance"
    | "commission"
    | "bonus"
    | "investment"
    | "gift"
    | "refund"
    | "other";

export type IncomeStatus = "received" | "pending" | "expected";

export type IncomeFrequency =
    | "one-time"
    | "weekly"
    | "bi-weekly"
    | "monthly"
    | "quarterly"
    | "yearly";

export type ExpenseType = "fixed" | "variable" | "emergency";

export type PaymentMethod =
    | "cash"
    | "card"
    | "bank-transfer"
    | "mobile-wallet"
    | "other";

export type InstallmentStatus = "active" | "completed" | "paused" | "overdue";

export type GoalCategory =
    | "emergency-fund"
    | "savings"
    | "investment"
    | "purchase"
    | "travel"
    | "education"
    | "other";

export type GoalPriority = "low" | "medium" | "high" | "critical";

export type GoalStatus = "active" | "completed" | "paused" | "cancelled";

export type AlertType =
    | "budget-exceeded"
    | "budget-warning"
    | "installment-due"
    | "unusual-spending"
    | "goal-progress"
    | "goal-reached"
    | "income-received"
    | "bill-reminder"
    | "low-balance";

export type AlertSeverity = "info" | "warning" | "critical" | "success";

export type BudgetStatus = "on-track" | "warning" | "over-budget" | "excellent";

export type RecurringFrequency =
    | "daily"
    | "weekly"
    | "bi-weekly"
    | "monthly"
    | "quarterly"
    | "yearly";

// ==================== Interfaces ====================

// Expense Category
export interface ExpenseCategory {
    id: string;
    name: string;
    nameAr?: string; // Arabic name (optional)
    icon: string;
    color: string;
    monthlyBudget?: number;
    isEssential: boolean; // ضروري ولا لأ
    isDefault: boolean; // System default category
    order: number;
    createdAt: string;
}

// Income
export interface Income {
    id: string;
    title: string;
    amount: number;
    currency: Currency;
    type: IncomeType;
    category?: string;
    status: IncomeStatus;
    frequency: IncomeFrequency;
    expectedDate?: string;
    actualDate?: string;
    isRecurring: boolean;
    recurringEndDate?: string;
    nextOccurrence?: string;
    notes?: string;
    tags: string[];
    createdAt: string;
    updatedAt: string;
}

// Expense
export interface Expense {
    id: string;
    title: string;
    amount: number;
    currency: Currency;
    categoryId: string;
    type: ExpenseType;
    paymentMethod: PaymentMethod;
    date: string;
    isRecurring: boolean;
    recurringFrequency?: RecurringFrequency;
    recurringEndDate?: string;
    nextOccurrence?: string;
    tags: string[];
    receipt?: string; // URL or base64
    notes?: string;
    linkedInstallmentId?: string; // If this expense is an installment payment
    createdAt: string;
    updatedAt: string;
}

// Installment Payment History
export interface InstallmentPayment {
    id: string;
    installmentId: string;
    date: string;
    amount: number;
    status: "paid" | "missed" | "partial" | "late";
    lateFee?: number;
    notes?: string;
    createdAt: string;
}

// Installment (قسط)
export interface Installment {
    id: string;
    title: string;
    description?: string;
    totalAmount: number;
    paidAmount: number;
    installmentAmount: number; // Monthly/Period payment
    totalInstallments: number;
    paidInstallments: number;
    frequency: RecurringFrequency;
    categoryId: string;
    startDate: string;
    nextPaymentDate: string;
    endDate: string;
    status: InstallmentStatus;
    autoPayment: boolean;
    remindDaysBefore: number; // days before to remind
    notes?: string;
    payments: InstallmentPayment[];
    createdAt: string;
    updatedAt: string;
}

// Category Budget (within a month)
export interface CategoryBudget {
    categoryId: string;
    planned: number;
    spent: number;
}

// Monthly Budget
export interface Budget {
    id: string;
    month: string; // Format: YYYY-MM
    totalPlannedIncome: number;
    totalActualIncome: number;
    totalPlannedExpenses: number;
    totalActualExpenses: number;
    savingsGoal: number;
    actualSavings: number;
    categoryBudgets: CategoryBudget[];
    notes?: string;
    createdAt: string;
    updatedAt: string;
}

// Goal Milestone
export interface GoalMilestone {
    id: string;
    title: string;
    targetAmount: number;
    reached: boolean;
    reachedAt?: string;
}

// Financial Goal
export interface FinancialGoal {
    id: string;
    title: string;
    description?: string;
    icon?: string;
    color?: string;
    targetAmount: number;
    currentAmount: number;
    currency: Currency;
    category: GoalCategory;
    priority: GoalPriority;
    deadline?: string;
    monthlyContribution: number;
    autoAllocate: boolean; // Auto deduct from income
    linkedIncomeId?: string; // Link to specific income source
    status: GoalStatus;
    milestones: GoalMilestone[];
    contributions: GoalContribution[];
    createdAt: string;
    updatedAt: string;
}

// Goal Contribution (each deposit to goal)
export interface GoalContribution {
    id: string;
    goalId: string;
    amount: number;
    date: string;
    notes?: string;
    createdAt: string;
}

// Smart Alert
export interface FinancialAlert {
    id: string;
    type: AlertType;
    severity: AlertSeverity;
    title: string;
    message: string;
    actionable: boolean;
    actionLabel?: string;
    actionRoute?: string;
    relatedId?: string; // Related entity ID (expense, goal, etc.)
    relatedType?: string; // Type of related entity
    dismissed: boolean;
    dismissedAt?: string;
    expiresAt?: string;
    createdAt: string;
}

// Finance Settings
export interface FinanceSettings {
    defaultCurrency: Currency;
    monthStartDay: number; // 1-28 (day of month to start financial month)
    showCents: boolean;
    enableBudgetAlerts: boolean;
    budgetWarningThreshold: number; // Percentage (e.g., 80 = warn at 80%)
    enableInstallmentReminders: boolean;
    installmentReminderDays: number; // Days before due date
    enableInsights: boolean;
    weeklyReportEnabled: boolean;
    monthlyReportEnabled: boolean;
}

// ==================== Statistics & Analytics ====================

export interface FinancialStats {
    // Current Month
    totalIncomeThisMonth: number;
    totalExpensesThisMonth: number;
    netBalanceThisMonth: number;
    savingsRateThisMonth: number; // Percentage

    // Comparisons
    incomeVsLastMonth: number; // Percentage change
    expensesVsLastMonth: number; // Percentage change

    // Totals
    totalActiveInstallments: number;
    totalInstallmentDebt: number;
    totalGoalsProgress: number; // Average percentage

    // Categories
    topSpendingCategory: string;
    topSpendingAmount: number;

    // Alerts
    activeAlertsCount: number;
    criticalAlertsCount: number;
}

export interface CategorySpending {
    categoryId: string;
    categoryName: string;
    categoryIcon: string;
    categoryColor: string;
    spent: number;
    budget: number;
    percentage: number;
    isOverBudget: boolean;
}

export interface DailySpending {
    date: string;
    amount: number;
    transactions: number;
}

export interface MonthlyTrend {
    month: string;
    income: number;
    expenses: number;
    savings: number;
}

// ==================== Finance Data Structure ====================

export interface FinanceData {
    incomes: Income[];
    expenses: Expense[];
    categories: ExpenseCategory[];
    installments: Installment[];
    budgets: Budget[];
    goals: FinancialGoal[];
    alerts: FinancialAlert[];
    settings: FinanceSettings;
}

// ==================== Default Categories ====================

export const DEFAULT_EXPENSE_CATEGORIES: Omit<
    ExpenseCategory,
    "id" | "createdAt"
>[] = [
    // Essential (ضروري)
    {
        name: "Rent/Mortgage",
        nameAr: "إيجار/قسط سكن",
        icon: "🏠",
        color: "#3b82f6",
        isEssential: true,
        isDefault: true,
        order: 1,
    },
    {
        name: "Utilities",
        nameAr: "فواتير",
        icon: "⚡",
        color: "#eab308",
        isEssential: true,
        isDefault: true,
        order: 2,
    },
    {
        name: "Transportation",
        nameAr: "مواصلات",
        icon: "🚗",
        color: "#8b5cf6",
        isEssential: true,
        isDefault: true,
        order: 3,
    },
    {
        name: "Groceries",
        nameAr: "طعام وبقالة",
        icon: "🛒",
        color: "#22c55e",
        isEssential: true,
        isDefault: true,
        order: 4,
    },
    {
        name: "Healthcare",
        nameAr: "صحة ودواء",
        icon: "💊",
        color: "#ef4444",
        isEssential: true,
        isDefault: true,
        order: 5,
    },
    {
        name: "Insurance",
        nameAr: "تأمين",
        icon: "🛡️",
        color: "#0ea5e9",
        isEssential: true,
        isDefault: true,
        order: 6,
    },

    // Variable (متغير)
    {
        name: "Dining Out",
        nameAr: "أكل بره",
        icon: "🍔",
        color: "#f97316",
        isEssential: false,
        isDefault: true,
        order: 7,
    },
    {
        name: "Entertainment",
        nameAr: "ترفيه",
        icon: "🎮",
        color: "#ec4899",
        isEssential: false,
        isDefault: true,
        order: 8,
    },
    {
        name: "Shopping",
        nameAr: "تسوق",
        icon: "🛍️",
        color: "#a855f7",
        isEssential: false,
        isDefault: true,
        order: 9,
    },
    {
        name: "Clothing",
        nameAr: "ملابس",
        icon: "👔",
        color: "#06b6d4",
        isEssential: false,
        isDefault: true,
        order: 10,
    },
    {
        name: "Education",
        nameAr: "تعليم",
        icon: "📚",
        color: "#14b8a6",
        isEssential: false,
        isDefault: true,
        order: 11,
    },
    {
        name: "Gifts",
        nameAr: "هدايا",
        icon: "🎁",
        color: "#f43f5e",
        isEssential: false,
        isDefault: true,
        order: 12,
    },
    {
        name: "Sports",
        nameAr: "رياضة",
        icon: "⚽",
        color: "#10b981",
        isEssential: false,
        isDefault: true,
        order: 13,
    },
    {
        name: "Travel",
        nameAr: "سفر",
        icon: "✈️",
        color: "#6366f1",
        isEssential: false,
        isDefault: true,
        order: 14,
    },
    {
        name: "Subscriptions",
        nameAr: "اشتراكات",
        icon: "📱",
        color: "#8b5cf6",
        isEssential: false,
        isDefault: true,
        order: 15,
    },
    {
        name: "Personal Care",
        nameAr: "عناية شخصية",
        icon: "💇",
        color: "#d946ef",
        isEssential: false,
        isDefault: true,
        order: 16,
    },

    // Emergency
    {
        name: "Emergency",
        nameAr: "طوارئ",
        icon: "🚨",
        color: "#dc2626",
        isEssential: true,
        isDefault: true,
        order: 17,
    },

    // Other
    {
        name: "Other",
        nameAr: "أخرى",
        icon: "📦",
        color: "#64748b",
        isEssential: false,
        isDefault: true,
        order: 18,
    },
];

export const DEFAULT_FINANCE_SETTINGS: FinanceSettings = {
    defaultCurrency: "EGP",
    monthStartDay: 1,
    showCents: false,
    enableBudgetAlerts: true,
    budgetWarningThreshold: 80,
    enableInstallmentReminders: true,
    installmentReminderDays: 3,
    enableInsights: true,
    weeklyReportEnabled: true,
    monthlyReportEnabled: true,
};

// ==================== Helper Types ====================

export type TransactionType = "income" | "expense";

export interface Transaction {
    id: string;
    type: TransactionType;
    title: string;
    amount: number;
    date: string;
    category?: string;
    categoryIcon?: string;
    categoryColor?: string;
}

// For Quick Add
export interface QuickExpenseInput {
    amount: number;
    categoryId: string;
    title?: string;
    notes?: string;
}

// For filtering
export interface FinanceFilters {
    dateRange?: {
        start: string;
        end: string;
    };
    categories?: string[];
    types?: ExpenseType[];
    paymentMethods?: PaymentMethod[];
    minAmount?: number;
    maxAmount?: number;
    searchQuery?: string;
}

// Time period for reports
export type TimePeriod =
    | "today"
    | "this-week"
    | "this-month"
    | "this-year"
    | "custom";

// Complete Finance Data for export/import
export interface FinanceData {
    incomes: Income[];
    expenses: Expense[];
    categories: ExpenseCategory[];
    installments: Installment[];
    budgets: Budget[];
    goals: FinancialGoal[];
    alerts: FinancialAlert[];
    settings: FinanceSettings;
    exportedAt?: string;
    version?: string;
}
