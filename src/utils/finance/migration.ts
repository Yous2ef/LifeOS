import type {
    FinanceData,
    Account,
    Expense,
    Income,
    Installment,
    IncomeCategory,
    TransactionNature,
} from "@/types/modules/finance";

const generateId = (): string => {
    return `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};

// Default income categories for migration
const getDefaultIncomeCategories = (): IncomeCategory[] => {
    const now = new Date().toISOString();
    return [
        {
            id: generateId(),
            name: "Salary",
            nameAr: "راتب",
            icon: "💼",
            color: "#3b82f6",
            isDefault: true,
            order: 1,
            createdAt: now,
        },
        {
            id: generateId(),
            name: "Freelance",
            nameAr: "عمل حر",
            icon: "💻",
            color: "#8b5cf6",
            isDefault: true,
            order: 2,
            createdAt: now,
        },
        {
            id: generateId(),
            name: "Business",
            nameAr: "أعمال",
            icon: "🏢",
            color: "#14b8a6",
            isDefault: true,
            order: 3,
            createdAt: now,
        },
        {
            id: generateId(),
            name: "Investment",
            nameAr: "استثمار",
            icon: "📈",
            color: "#22c55e",
            isDefault: true,
            order: 4,
            createdAt: now,
        },
        {
            id: generateId(),
            name: "Bonus",
            nameAr: "مكافأة",
            icon: "🎉",
            color: "#f59e0b",
            isDefault: true,
            order: 5,
            createdAt: now,
        },
        {
            id: generateId(),
            name: "Commission",
            nameAr: "عمولة",
            icon: "💰",
            color: "#10b981",
            isDefault: true,
            order: 6,
            createdAt: now,
        },
        {
            id: generateId(),
            name: "Gift",
            nameAr: "هدية",
            icon: "🎁",
            color: "#ec4899",
            isDefault: true,
            order: 7,
            createdAt: now,
        },
        {
            id: generateId(),
            name: "Refund",
            nameAr: "استرداد",
            icon: "🔄",
            color: "#06b6d4",
            isDefault: true,
            order: 8,
            createdAt: now,
        },
        {
            id: generateId(),
            name: "Rental Income",
            nameAr: "دخل إيجار",
            icon: "🏠",
            color: "#6366f1",
            isDefault: true,
            order: 9,
            createdAt: now,
        },
        {
            id: generateId(),
            name: "Other",
            nameAr: "أخرى",
            icon: "📦",
            color: "#64748b",
            isDefault: true,
            order: 10,
            createdAt: now,
        },
    ];
};

// Map old income type strings to category names
const incomeTypeToCategory: Record<string, string> = {
    salary: "Salary",
    freelance: "Freelance",
    commission: "Commission",
    bonus: "Bonus",
    investment: "Investment",
    gift: "Gift",
    refund: "Refund",
    other: "Other",
};

/**
 * Checks if finance data needs migration from v1 (no accounts) to v2 (multi-account)
 */
export const needsMigration = (data: Partial<FinanceData>): boolean => {
    // If accounts array doesn't exist or is empty, we need migration
    return !data.accounts || data.accounts.length === 0;
};

/**
 * Migrates finance data from v1 (single balance) to v2 (multi-account)
 * Creates a default "Main Cash" account and links all existing data to it
 */
export const migrateToV2 = (oldData: Partial<FinanceData>): FinanceData => {
    const now = new Date().toISOString();

    // Create default account
    const defaultAccount: Account = {
        id: generateId(),
        name: "Main Cash",
        type: "cash",
        balance: 0, // Will be calculated from historical data
        initialBalance: 0,
        color: "#10b981",
        icon: "💵",
        currency: oldData.settings?.defaultCurrency || "EGP",
        isDefault: true,
        isActive: true,
        order: 1,
        notes: "Migrated from previous version",
        createdAt: now,
        updatedAt: now,
    };

    // Migrate expenses - add accountId and ensure all required fields exist
    const migratedExpenses: Expense[] = (oldData.expenses || []).map(
        (expense) => ({
            ...expense,
            accountId: expense.accountId || defaultAccount.id,
            location: expense.location || undefined,
            // Ensure all required fields exist
            tags: expense.tags || [],
            isRecurring: expense.isRecurring ?? false,
        })
    );

    // Migrate incomes - add accountId
    const migratedIncomes: Income[] = (oldData.incomes || []).map((income) => ({
        ...income,
        accountId: income.accountId || defaultAccount.id,
        tags: income.tags || [],
        isRecurring: income.isRecurring ?? false,
    }));

    // Migrate installments - add linkedAccountId
    const migratedInstallments: Installment[] = (
        oldData.installments || []
    ).map((installment) => ({
        ...installment,
        linkedAccountId:
            (installment as any).linkedAccountId || defaultAccount.id,
        payments: installment.payments || [],
    }));

    // Migrate goals - ensure priority and imageUrl exist
    const migratedGoals = (oldData.goals || []).map((goal) => ({
        ...goal,
        priority: (goal as any).priority || ("medium" as const),
        imageUrl: (goal as any).imageUrl || undefined,
        milestones: goal.milestones || [],
        contributions: goal.contributions || [],
    }));

    // Calculate initial balance from historical data
    const totalIncome = migratedIncomes
        .filter((inc) => inc.status === "received" && inc.actualDate)
        .reduce((sum, inc) => sum + inc.amount, 0);

    const totalExpense = migratedExpenses.reduce(
        (sum, exp) => sum + exp.amount,
        0
    );

    defaultAccount.initialBalance = 0; // Starting from 0
    defaultAccount.balance = totalIncome - totalExpense;

    // Return migrated data structure
    return {
        accounts: [defaultAccount],
        transfers: [], // No transfers in old data
        incomes: migratedIncomes,
        expenses: migratedExpenses,
        categories: oldData.categories || [],
        incomeCategories: [],
        installments: migratedInstallments,
        budgets: oldData.budgets || [],
        goals: migratedGoals,
        alerts: oldData.alerts || [],
        settings: oldData.settings || {
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
        },
        version: "2.0.0",
    };
};

/**
 * Checks if income category migration is needed
 */
export const needsIncomeCategoryMigration = (
    data: Partial<FinanceData>
): boolean => {
    // Need migration if incomeCategories is empty/missing AND there are incomes with old type field
    const hasIncomeCategories =
        data.incomeCategories && data.incomeCategories.length > 0;
    const hasIncomesWithType = (data.incomes || []).some(
        (inc: any) => inc.type && !inc.categoryId
    );
    return !hasIncomeCategories || hasIncomesWithType;
};

/**
 * Migrates income type strings to proper categoryId references
 */
export const migrateIncomeCategories = (data: FinanceData): FinanceData => {
    const now = new Date().toISOString();

    // Start with existing income categories or create defaults
    let incomeCategories: IncomeCategory[] =
        data.incomeCategories?.length > 0
            ? [...data.incomeCategories]
            : getDefaultIncomeCategories();

    // Collect unique income types from existing incomes that don't have categoryId
    const existingTypes = new Set<string>();
    (data.incomes || []).forEach((inc: any) => {
        if (inc.type && !inc.categoryId) {
            existingTypes.add(inc.type.toLowerCase());
        }
    });

    // Create any missing categories for custom types not in defaults
    existingTypes.forEach((type) => {
        const categoryName =
            incomeTypeToCategory[type] ||
            type.charAt(0).toUpperCase() + type.slice(1);
        const exists = incomeCategories.some(
            (cat) => cat.name.toLowerCase() === categoryName.toLowerCase()
        );
        if (!exists) {
            incomeCategories.push({
                id: generateId(),
                name: categoryName,
                nameAr: categoryName,
                icon: "💵",
                color: "#64748b",
                isDefault: false,
                order: incomeCategories.length + 1,
                createdAt: now,
            });
        }
    });

    // Migrate incomes: convert old type (salary/freelance) to categoryId, set new type to TransactionNature
    const migratedIncomes = (data.incomes || []).map((inc: any) => {
        // Find matching category for the old type
        const oldType = inc.type || "other";
        const categoryName =
            incomeTypeToCategory[oldType.toLowerCase()] ||
            oldType.charAt(0).toUpperCase() + oldType.slice(1);
        const category = incomeCategories.find(
            (cat) => cat.name.toLowerCase() === categoryName.toLowerCase()
        );

        // Determine if income already has categoryId
        const categoryId =
            inc.categoryId ||
            category?.id ||
            incomeCategories.find((c) => c.name === "Other")?.id ||
            incomeCategories[0]?.id;

        // Determine new type (TransactionNature):
        // - If already has valid type (fixed/variable/emergency), keep it
        // - Otherwise, default to "variable"
        const validTypes: TransactionNature[] = [
            "fixed",
            "variable",
            "emergency",
        ];
        const newType: TransactionNature = validTypes.includes(inc.type)
            ? inc.type
            : "variable";

        return {
            id: inc.id,
            title: inc.title,
            amount: inc.amount,
            currency: inc.currency,
            categoryId,
            type: newType, // Now TransactionNature
            status: inc.status,
            frequency: inc.frequency,
            accountId: inc.accountId,
            expectedDate: inc.expectedDate,
            actualDate: inc.actualDate,
            isRecurring: inc.isRecurring ?? false,
            recurringEndDate: inc.recurringEndDate,
            nextOccurrence: inc.nextOccurrence,
            notes: inc.notes,
            tags: inc.tags || [],
            linkedInstallmentId: inc.linkedInstallmentId,
            createdAt: inc.createdAt,
            updatedAt: inc.updatedAt,
        } as Income;
    });

    // Migrate expenses: ensure type is TransactionNature (keep existing, should already be correct)
    const migratedExpenses = (data.expenses || []).map((exp: any) => {
        const validTypes = ["fixed", "variable", "emergency"];
        return {
            ...exp,
            type: validTypes.includes(exp.type) ? exp.type : "variable",
        } as Expense;
    });

    return {
        ...data,
        incomeCategories,
        incomes: migratedIncomes,
        expenses: migratedExpenses,
    };
};

/**
 * Main migration function to be called when loading finance data
 */
export const runMigrationIfNeeded = (
    data: Partial<FinanceData>
): FinanceData => {
    let result = data as FinanceData;

    // Run account migration if needed
    if (needsMigration(data)) {
        console.log(
            "🔄 Migrating finance data to v2.0 (multi-account support)..."
        );
        result = migrateToV2(data);
        console.log("✅ Account migration completed successfully!");
    }

    // Run income category migration if needed
    if (needsIncomeCategoryMigration(result)) {
        console.log("🔄 Migrating income categories (type → categoryId)...");
        result = migrateIncomeCategories(result);
        console.log("✅ Income category migration completed successfully!");
    }

    return result;
};
