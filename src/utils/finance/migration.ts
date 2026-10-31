import type {
    FinanceData,
    Account,
    Expense,
    Income,
    Installment,
    IncomeCategory,
    TransactionNature,
} from "@/types/modules/finance";
import {
    DEFAULT_ACCOUNT_ID,
    getDefaultExpenseCategories,
    getDefaultFinanceSettings,
    getDefaultIncomeCategories,
} from "./defaults";

const generateId = (): string => {
    return `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
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
        id: DEFAULT_ACCOUNT_ID,
        name: "Main Cash",
        type: "cash",
        initialBalance: 0, // Balance is derived from transactions
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

    // Keep every field we don't migrate (transfers, newer arrays, settings)
    return {
        ...(oldData as FinanceData),
        accounts: [defaultAccount],
        transfers: oldData.transfers ?? [],
        incomes: migratedIncomes,
        expenses: migratedExpenses,
        categories:
            oldData.categories && oldData.categories.length > 0
                ? oldData.categories
                : getDefaultExpenseCategories(),
        incomeCategories: oldData.incomeCategories ?? [],
        installments: migratedInstallments,
        budgets: oldData.budgets ?? [],
        goals: migratedGoals,
        alerts: oldData.alerts ?? [],
        settings: { ...getDefaultFinanceSettings(), ...oldData.settings },
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

        // Spread first so fields added later aren't stripped
        return {
            ...inc,
            categoryId,
            type: newType, // Now TransactionNature
            isRecurring: inc.isRecurring ?? false,
            tags: inc.tags || [],
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

/** True when runMigrationIfNeeded would change the data */
export const financeNeedsMigration = (data: Partial<FinanceData>): boolean =>
    needsMigration(data) || needsIncomeCategoryMigration(data);

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
