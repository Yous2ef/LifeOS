import { useEffect, useCallback, useMemo } from "react";
import { useApp } from "../context/AppContext";
import { runMigrationIfNeeded } from "@/utils/finance/migration";
import type {
    FinanceData,
    Income,
    Expense,
    ExpenseCategory,
    IncomeCategory,
    Installment,
    InstallmentPayment,
    Budget,
    FinancialGoal,
    GoalContribution,
    FinancialAlert,
    FinanceSettings,
    FinancialStats,
    CategorySpending,
    DailySpending,
    Transaction,
    Account,
    AccountTransfer,
    PaymentMethod,
} from "@/types/modules/finance";

// ==================== Helper Functions ====================

const generateId = (): string => {
    return `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};

const getCurrentMonth = (): string => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
        2,
        "0"
    )}`;
};

const getMonthStart = (month: string, startDay: number = 1): Date => {
    const [year, monthNum] = month.split("-").map(Number);
    return new Date(year, monthNum - 1, startDay);
};

const getMonthEnd = (month: string, startDay: number = 1): Date => {
    const [year, monthNum] = month.split("-").map(Number);
    // Setting day to startDay - 1, but hours to 23:59:59
    const end = new Date(year, monthNum, startDay - 1, 23, 59, 59, 999);
    return end;
};

const isInMonth = (
    dateStr: string,
    month: string,
    startDay: number = 1
): boolean => {
    const date = new Date(dateStr);
    const start = getMonthStart(month, startDay);
    const end = getMonthEnd(month, startDay);
    return date >= start && date <= end;
};

// ==================== Default Data ====================

const getDefaultFinanceData = (): FinanceData => {
    const now = new Date().toISOString();

    const categories: ExpenseCategory[] = [
        {
            id: generateId(),
            name: "Rent/Mortgage",
            nameAr: "إيجار/قسط سكن",
            icon: "🏠",
            color: "#3b82f6",
            isEssential: true,
            isDefault: true,
            order: 1,
            createdAt: now,
        },
        {
            id: generateId(),
            name: "Utilities",
            nameAr: "فواتير",
            icon: "⚡",
            color: "#eab308",
            isEssential: true,
            isDefault: true,
            order: 2,
            createdAt: now,
        },
        {
            id: generateId(),
            name: "Transportation",
            nameAr: "مواصلات",
            icon: "🚗",
            color: "#8b5cf6",
            isEssential: true,
            isDefault: true,
            order: 3,
            createdAt: now,
        },
        {
            id: generateId(),
            name: "Groceries",
            nameAr: "طعام وبقالة",
            icon: "🛒",
            color: "#22c55e",
            isEssential: true,
            isDefault: true,
            order: 4,
            createdAt: now,
        },
        {
            id: generateId(),
            name: "Healthcare",
            nameAr: "صحة ودواء",
            icon: "💊",
            color: "#ef4444",
            isEssential: true,
            isDefault: true,
            order: 5,
            createdAt: now,
        },
        {
            id: generateId(),
            name: "Insurance",
            nameAr: "تأمين",
            icon: "🛡️",
            color: "#0ea5e9",
            isEssential: true,
            isDefault: true,
            order: 6,
            createdAt: now,
        },
        {
            id: generateId(),
            name: "Dining Out",
            nameAr: "أكل بره",
            icon: "🍔",
            color: "#f97316",
            isEssential: false,
            isDefault: true,
            order: 7,
            createdAt: now,
        },
        {
            id: generateId(),
            name: "Entertainment",
            nameAr: "ترفيه",
            icon: "🎮",
            color: "#ec4899",
            isEssential: false,
            isDefault: true,
            order: 8,
            createdAt: now,
        },
        {
            id: generateId(),
            name: "Shopping",
            nameAr: "تسوق",
            icon: "🛍️",
            color: "#a855f7",
            isEssential: false,
            isDefault: true,
            order: 9,
            createdAt: now,
        },
        {
            id: generateId(),
            name: "Clothing",
            nameAr: "ملابس",
            icon: "👔",
            color: "#06b6d4",
            isEssential: false,
            isDefault: true,
            order: 10,
            createdAt: now,
        },
        {
            id: generateId(),
            name: "Education",
            nameAr: "تعليم",
            icon: "📚",
            color: "#14b8a6",
            isEssential: false,
            isDefault: true,
            order: 11,
            createdAt: now,
        },
        {
            id: generateId(),
            name: "Gifts",
            nameAr: "هدايا",
            icon: "🎁",
            color: "#f43f5e",
            isEssential: false,
            isDefault: true,
            order: 12,
            createdAt: now,
        },
        {
            id: generateId(),
            name: "Sports",
            nameAr: "رياضة",
            icon: "⚽",
            color: "#10b981",
            isEssential: false,
            isDefault: true,
            order: 13,
            createdAt: now,
        },
        {
            id: generateId(),
            name: "Travel",
            nameAr: "سفر",
            icon: "✈️",
            color: "#6366f1",
            isEssential: false,
            isDefault: true,
            order: 14,
            createdAt: now,
        },
        {
            id: generateId(),
            name: "Subscriptions",
            nameAr: "اشتراكات",
            icon: "📱",
            color: "#8b5cf6",
            isEssential: false,
            isDefault: true,
            order: 15,
            createdAt: now,
        },
        {
            id: generateId(),
            name: "Personal Care",
            nameAr: "عناية شخصية",
            icon: "💇",
            color: "#d946ef",
            isEssential: false,
            isDefault: true,
            order: 16,
            createdAt: now,
        },
        {
            id: generateId(),
            name: "Emergency",
            nameAr: "طوارئ",
            icon: "🚨",
            color: "#dc2626",
            isEssential: true,
            isDefault: true,
            order: 17,
            createdAt: now,
        },
        {
            id: generateId(),
            name: "Other",
            nameAr: "أخرى",
            icon: "📦",
            color: "#64748b",
            isEssential: false,
            isDefault: true,
            order: 18,
            createdAt: now,
        },
    ];

    const incomeCategories: IncomeCategory[] = [
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

    return {
        accounts: [], // Will be populated by migration or user
        transfers: [],
        incomes: [],
        expenses: [],
        categories,
        incomeCategories,
        installments: [],
        budgets: [],
        goals: [],
        alerts: [],
        settings: {
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
    };
};

// ==================== Main Hook ====================

export const useFinance = () => {
    const { data: appData, updateData } = useApp();

    // Get finance data from unified AppData, with defaults
    // Run migration if needed to upgrade from v1 to v2
    const data: FinanceData = useMemo(() => {
        const baseData: FinanceData = {
            ...getDefaultFinanceData(),
            ...appData.finance,
            settings: {
                ...getDefaultFinanceData().settings,
                ...(appData.finance?.settings || {}),
            },
        };

        // Check if migration is needed (no accounts array OR no income categories)
        const needsAccountMigration =
            !baseData.accounts || baseData.accounts.length === 0;
        const needsIncomeCategoryCreation =
            !baseData.incomeCategories ||
            baseData.incomeCategories.length === 0;

        if (needsAccountMigration || needsIncomeCategoryCreation) {
            // Import migration utility
            const migratedData = runMigrationIfNeeded(baseData);

            // Save migrated data back to storage
            setTimeout(() => {
                updateData({ finance: migratedData });
            }, 0);

            return migratedData;
        }

        return baseData;
    }, [appData.finance, updateData]);

    // Helper to update finance data in AppContext
    const setData = useCallback(
        (updater: FinanceData | ((prev: FinanceData) => FinanceData)) => {
            if (typeof updater === "function") {
                updateData({ finance: updater(data) });
            } else {
                updateData({ finance: updater });
            }
        },
        [data, updateData]
    );

    // ==================== Recurring & Automation Logic ====================

    const calculateNextOccurrence = useCallback(
        (currentDate: string, frequency: string): string => {
            const date = new Date(currentDate);
            switch (frequency) {
                case "daily":
                    date.setDate(date.getDate() + 1);
                    break;
                case "weekly":
                    date.setDate(date.getDate() + 7);
                    break;
                case "bi-weekly":
                    date.setDate(date.getDate() + 14);
                    break;
                case "monthly":
                    date.setMonth(date.getMonth() + 1);
                    break;
                case "quarterly":
                    date.setMonth(date.getMonth() + 3);
                    break;
                case "yearly":
                    date.setFullYear(date.getFullYear() + 1);
                    break;
                default:
                    date.setMonth(date.getMonth() + 1);
            }
            return date.toISOString().split("T")[0];
        },
        []
    );

    // Process recurring incomes - runs on app load
    useEffect(() => {
        const processRecurringIncomes = () => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const recurringIncomes = data.incomes.filter(
                (inc) =>
                    inc.isRecurring &&
                    inc.frequency !== "one-time" &&
                    (!inc.recurringEndDate ||
                        new Date(inc.recurringEndDate) >= today)
            );

            const newIncomes: Income[] = [];
            const updatedIncomes: { id: string; nextOccurrence: string }[] = [];

            recurringIncomes.forEach((income) => {
                let nextDate = income.nextOccurrence
                    ? new Date(income.nextOccurrence)
                    : income.actualDate
                    ? new Date(income.actualDate)
                    : new Date(income.createdAt);

                if (!income.nextOccurrence) {
                    const baseDate = income.actualDate || income.createdAt;
                    nextDate = new Date(
                        calculateNextOccurrence(baseDate, income.frequency)
                    );
                }

                while (nextDate <= today) {
                    const nextDateStr = nextDate.toISOString().split("T")[0];
                    const existingEntry = data.incomes.find(
                        (inc) =>
                            inc.title === income.title &&
                            inc.amount === income.amount &&
                            inc.actualDate === nextDateStr
                    );

                    if (!existingEntry) {
                        const now = new Date().toISOString();
                        newIncomes.push({
                            ...income,
                            id: generateId(),
                            status: "received",
                            actualDate: nextDateStr,
                            expectedDate: undefined,
                            isRecurring: false,
                            nextOccurrence: undefined,
                            createdAt: now,
                            updatedAt: now,
                            notes: `${
                                income.notes ? income.notes + " | " : ""
                            }Auto-generated from recurring income`,
                        });
                    }
                    const newNextDate = calculateNextOccurrence(
                        nextDateStr,
                        income.frequency
                    );
                    nextDate = new Date(newNextDate);
                }

                if (nextDate > today) {
                    const nextOccurrenceStr = nextDate
                        .toISOString()
                        .split("T")[0];
                    if (income.nextOccurrence !== nextOccurrenceStr) {
                        updatedIncomes.push({
                            id: income.id,
                            nextOccurrence: nextOccurrenceStr,
                        });
                    }
                }
            });

            if (newIncomes.length > 0 || updatedIncomes.length > 0) {
                setData((prev) => ({
                    ...prev,
                    incomes: [
                        ...prev.incomes.map((inc) => {
                            const update = updatedIncomes.find(
                                (u) => u.id === inc.id
                            );
                            if (update) {
                                return {
                                    ...inc,
                                    nextOccurrence: update.nextOccurrence,
                                    updatedAt: new Date().toISOString(),
                                };
                            }
                            return inc;
                        }),
                        ...newIncomes,
                    ],
                }));
            }
        };

        const timer = setTimeout(processRecurringIncomes, 500);
        return () => clearTimeout(timer);
    }, []);

    // Process recurring expenses
    useEffect(() => {
        const processRecurringExpenses = () => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const recurringExpenses = data.expenses.filter(
                (exp) =>
                    exp.isRecurring &&
                    exp.recurringFrequency &&
                    (!exp.recurringEndDate ||
                        new Date(exp.recurringEndDate) >= today)
            );

            const newExpenses: Expense[] = [];
            const updatedExpenses: { id: string; nextOccurrence: string }[] =
                [];

            recurringExpenses.forEach((expense) => {
                let nextDate = expense.nextOccurrence
                    ? new Date(expense.nextOccurrence)
                    : new Date(expense.date);

                if (!expense.nextOccurrence) {
                    nextDate = new Date(
                        calculateNextOccurrence(
                            expense.date,
                            expense.recurringFrequency || "monthly"
                        )
                    );
                }

                while (nextDate <= today) {
                    const nextDateStr = nextDate.toISOString().split("T")[0];
                    const existingEntry = data.expenses.find(
                        (exp) =>
                            exp.title === expense.title &&
                            exp.amount === expense.amount &&
                            exp.categoryId === expense.categoryId &&
                            exp.date === nextDateStr
                    );

                    if (!existingEntry) {
                        const now = new Date().toISOString();
                        newExpenses.push({
                            ...expense,
                            id: generateId(),
                            date: nextDateStr,
                            isRecurring: false,
                            recurringFrequency: undefined,
                            nextOccurrence: undefined,
                            createdAt: now,
                            updatedAt: now,
                            notes: `${
                                expense.notes ? expense.notes + " | " : ""
                            }Auto-generated from recurring expense`,
                        });
                    }
                    const newNextDate = calculateNextOccurrence(
                        nextDateStr,
                        expense.recurringFrequency || "monthly"
                    );
                    nextDate = new Date(newNextDate);
                }

                if (nextDate > today) {
                    const nextOccurrenceStr = nextDate
                        .toISOString()
                        .split("T")[0];
                    if (expense.nextOccurrence !== nextOccurrenceStr) {
                        updatedExpenses.push({
                            id: expense.id,
                            nextOccurrence: nextOccurrenceStr,
                        });
                    }
                }
            });

            if (newExpenses.length > 0 || updatedExpenses.length > 0) {
                setData((prev) => ({
                    ...prev,
                    expenses: [
                        ...prev.expenses.map((exp) => {
                            const update = updatedExpenses.find(
                                (u) => u.id === exp.id
                            );
                            if (update) {
                                return {
                                    ...exp,
                                    nextOccurrence: update.nextOccurrence,
                                    updatedAt: new Date().toISOString(),
                                };
                            }
                            return exp;
                        }),
                        ...newExpenses,
                    ],
                }));
            }
        };

        const timer = setTimeout(processRecurringExpenses, 700);
        return () => clearTimeout(timer);
    }, []);

    // ==================== Income Operations ====================

    const addIncome = useCallback(
        (incomeData: Omit<Income, "id" | "createdAt" | "updatedAt">) => {
            const now = new Date().toISOString();
            const newIncome: Income = {
                ...incomeData,
                id: generateId(),
                createdAt: now,
                updatedAt: now,
            };
            setData((prev) => ({
                ...prev,
                incomes: [...prev.incomes, newIncome],
            }));
            return newIncome;
        },
        [setData]
    );

    const updateIncome = useCallback(
        (id: string, updates: Partial<Income>) => {
            setData((prev) => ({
                ...prev,
                incomes: prev.incomes.map((income) =>
                    income.id === id
                        ? {
                              ...income,
                              ...updates,
                              updatedAt: new Date().toISOString(),
                          }
                        : income
                ),
            }));
        },
        [setData]
    );

    const deleteIncome = useCallback(
        (id: string) => {
            setData((prev) => ({
                ...prev,
                incomes: prev.incomes.filter((income) => income.id !== id),
            }));
        },
        [setData]
    );

    const getIncomeById = useCallback(
        (id: string) => data.incomes.find((income) => income.id === id),
        [data.incomes]
    );

    // ==================== Expense Operations ====================

    const addExpense = useCallback(
        (expenseData: Omit<Expense, "id" | "createdAt" | "updatedAt">) => {
            const now = new Date().toISOString();
            const newExpense: Expense = {
                ...expenseData,
                id: generateId(),
                createdAt: now,
                updatedAt: now,
            };
            setData((prev) => ({
                ...prev,
                expenses: [...prev.expenses, newExpense],
            }));
            return newExpense;
        },
        [setData]
    );

    const updateExpense = useCallback(
        (id: string, updates: Partial<Expense>) => {
            setData((prev) => ({
                ...prev,
                expenses: prev.expenses.map((expense) =>
                    expense.id === id
                        ? {
                              ...expense,
                              ...updates,
                              updatedAt: new Date().toISOString(),
                          }
                        : expense
                ),
            }));
        },
        [setData]
    );

    const deleteExpense = useCallback(
        (id: string) => {
            setData((prev) => ({
                ...prev,
                expenses: prev.expenses.filter((expense) => expense.id !== id),
            }));
        },
        [setData]
    );

    const getExpenseById = useCallback(
        (id: string) => data.expenses.find((expense) => expense.id === id),
        [data.expenses]
    );

    // ==================== Category Operations ====================

    const addCategory = useCallback(
        (categoryData: Omit<ExpenseCategory, "id" | "createdAt">) => {
            const newCategory: ExpenseCategory = {
                ...categoryData,
                id: generateId(),
                createdAt: new Date().toISOString(),
            };
            setData((prev) => ({
                ...prev,
                categories: [...prev.categories, newCategory],
            }));
            return newCategory;
        },
        [setData]
    );

    const updateCategory = useCallback(
        (id: string, updates: Partial<ExpenseCategory>) => {
            setData((prev) => ({
                ...prev,
                categories: prev.categories.map((cat) =>
                    cat.id === id ? { ...cat, ...updates } : cat
                ),
            }));
        },
        [setData]
    );

    const deleteCategory = useCallback(
        (id: string) => {
            const category = data.categories.find((c) => c.id === id);
            if (category?.isDefault) return false;
            setData((prev) => ({
                ...prev,
                categories: prev.categories.filter((cat) => cat.id !== id),
            }));
            return true;
        },
        [data.categories, setData]
    );

    const getCategoryById = useCallback(
        (id: string) => data.categories.find((cat) => cat.id === id),
        [data.categories]
    );

    // ==================== Income Category Operations ====================

    const addIncomeCategory = useCallback(
        (categoryData: Omit<IncomeCategory, "id" | "createdAt">) => {
            const newCategory: IncomeCategory = {
                ...categoryData,
                id: generateId(),
                createdAt: new Date().toISOString(),
            };
            setData((prev) => ({
                ...prev,
                incomeCategories: [
                    ...(prev.incomeCategories || []),
                    newCategory,
                ],
            }));
            return newCategory;
        },
        [setData]
    );

    const updateIncomeCategory = useCallback(
        (id: string, updates: Partial<IncomeCategory>) => {
            setData((prev) => ({
                ...prev,
                incomeCategories: (prev.incomeCategories || []).map((cat) =>
                    cat.id === id ? { ...cat, ...updates } : cat
                ),
            }));
        },
        [setData]
    );

    const deleteIncomeCategory = useCallback(
        (id: string) => {
            const category = (data.incomeCategories || []).find(
                (c) => c.id === id
            );
            if (category?.isDefault) return false;
            setData((prev) => ({
                ...prev,
                incomeCategories: (prev.incomeCategories || []).filter(
                    (cat) => cat.id !== id
                ),
            }));
            return true;
        },
        [data.incomeCategories, setData]
    );

    const getIncomeCategoryById = useCallback(
        (id: string) =>
            (data.incomeCategories || []).find((cat) => cat.id === id),
        [data.incomeCategories]
    );

    // ==================== Account Operations ====================

    const addAccount = useCallback(
        (
            accountData: Omit<
                Account,
                "id" | "createdAt" | "updatedAt" | "balance"
            >
        ) => {
            const now = new Date().toISOString();
            const newAccount: Account = {
                ...accountData,
                id: generateId(),
                balance: accountData.initialBalance, // Start with initial balance
                createdAt: now,
                updatedAt: now,
            };
            setData((prev) => ({
                ...prev,
                accounts: [...prev.accounts, newAccount],
            }));
            return newAccount;
        },
        [setData]
    );

    const updateAccount = useCallback(
        (id: string, updates: Partial<Account>) => {
            setData((prev) => ({
                ...prev,
                accounts: prev.accounts.map((account) =>
                    account.id === id
                        ? {
                              ...account,
                              ...updates,
                              updatedAt: new Date().toISOString(),
                          }
                        : account
                ),
            }));
        },
        [setData]
    );

    const deleteAccount = useCallback(
        (id: string): { success: boolean; error?: string } => {
            // Check if account has any transactions
            const hasTransactions =
                data.expenses.some((e) => e.accountId === id) ||
                data.incomes.some((i) => i.accountId === id) ||
                data.installments.some((inst) => inst.linkedAccountId === id);

            if (hasTransactions) {
                return {
                    success: false,
                    error: "Cannot delete account with existing transactions. Archive it instead.",
                };
            }

            // Check if it's the last active account
            const activeAccounts = data.accounts.filter(
                (a) => a.isActive && a.id !== id
            );
            if (activeAccounts.length === 0) {
                return {
                    success: false,
                    error: "Cannot delete the last active account. Create another account first.",
                };
            }

            // Proceed with deletion
            setData((prev) => ({
                ...prev,
                accounts: prev.accounts.filter((a) => a.id !== id),
            }));

            return { success: true };
        },
        [data.accounts, data.expenses, data.incomes, data.installments, setData]
    );

    const getAccountById = useCallback(
        (id: string) => data.accounts.find((account) => account.id === id),
        [data.accounts]
    );

    // Calculate real-time balance for an account
    const calculateAccountBalance = useCallback(
        (accountId: string): number => {
            const account = data.accounts.find((a) => a.id === accountId);
            if (!account) return 0;

            // Start with initial balance
            let balance = account.initialBalance;

            // Add all incomes to this account
            const accountIncomes = data.incomes.filter(
                (inc) =>
                    inc.accountId === accountId && inc.status === "received"
            );
            balance += accountIncomes.reduce((sum, inc) => sum + inc.amount, 0);

            // Subtract all expenses from this account
            const accountExpenses = data.expenses.filter(
                (exp) => exp.accountId === accountId
            );
            balance -= accountExpenses.reduce(
                (sum, exp) => sum + exp.amount,
                0
            );

            // Subtract installment payments
            const accountInstallments = data.installments.filter(
                (inst) => inst.linkedAccountId === accountId
            );
            balance -= accountInstallments.reduce(
                (sum, inst) => sum + inst.paidAmount,
                0
            );

            // Account for transfers
            const transfersFrom = (data.transfers || []).filter(
                (t) => t.fromAccountId === accountId
            );
            const transfersTo = (data.transfers || []).filter(
                (t) => t.toAccountId === accountId
            );

            balance -= transfersFrom.reduce((sum, t) => sum + t.amount, 0);
            balance += transfersTo.reduce((sum, t) => sum + t.amount, 0);

            return balance;
        },
        [
            data.accounts,
            data.incomes,
            data.expenses,
            data.installments,
            data.transfers,
        ]
    );

    // Transfer money between accounts
    const transferBetweenAccounts = useCallback(
        (
            fromAccountId: string,
            toAccountId: string,
            amount: number,
            notes?: string
        ) => {
            const fromAccount = data.accounts.find(
                (a) => a.id === fromAccountId
            );
            const toAccount = data.accounts.find((a) => a.id === toAccountId);

            if (!fromAccount || !toAccount) {
                throw new Error("Invalid account IDs");
            }

            if (amount <= 0) {
                throw new Error("Transfer amount must be greater than 0");
            }

            const now = new Date().toISOString();
            const transfer: AccountTransfer = {
                id: generateId(),
                fromAccountId,
                toAccountId,
                amount,
                date: now.split("T")[0],
                notes,
                createdAt: now,
            };

            setData((prev) => ({
                ...prev,
                transfers: [...(prev.transfers || []), transfer],
                accounts: prev.accounts.map((account) => {
                    if (account.id === fromAccountId) {
                        return {
                            ...account,
                            balance: account.balance - amount,
                            updatedAt: now,
                        };
                    }
                    if (account.id === toAccountId) {
                        return {
                            ...account,
                            balance: account.balance + amount,
                            updatedAt: now,
                        };
                    }
                    return account;
                }),
            }));

            return transfer;
        },
        [data.accounts, setData]
    );

    // ==================== Installment Operations ====================

    const addInstallment = useCallback(
        (
            installmentData: Omit<
                Installment,
                | "id"
                | "createdAt"
                | "updatedAt"
                | "payments"
                | "paidAmount"
                | "paidInstallments"
            >
        ) => {
            const now = new Date().toISOString();
            const newInstallment: Installment = {
                ...installmentData,
                id: generateId(),
                paidAmount: 0,
                paidInstallments: 0,
                payments: [],
                createdAt: now,
                updatedAt: now,
            };
            setData((prev) => ({
                ...prev,
                installments: [...prev.installments, newInstallment],
            }));
            return newInstallment;
        },
        [setData]
    );

    const updateInstallment = useCallback(
        (id: string, updates: Partial<Installment>) => {
            setData((prev) => ({
                ...prev,
                installments: prev.installments.map((inst) =>
                    inst.id === id
                        ? {
                              ...inst,
                              ...updates,
                              updatedAt: new Date().toISOString(),
                          }
                        : inst
                ),
            }));
        },
        [setData]
    );

    const deleteInstallment = useCallback(
        (id: string) => {
            setData((prev) => ({
                ...prev,
                installments: prev.installments.filter(
                    (inst) => inst.id !== id
                ),
            }));
        },
        [setData]
    );

    const addInstallmentPayment = useCallback(
        (
            installmentId: string,
            payment: Omit<
                InstallmentPayment,
                "id" | "installmentId" | "createdAt"
            >,
            expenseInfo?: {
                accountId: string;
                paymentMethod: PaymentMethod;
            }
        ) => {
            const now = new Date().toISOString();
            const paymentId = generateId();
            const newPayment: InstallmentPayment = {
                ...payment,
                id: paymentId,
                installmentId,
                createdAt: now,
            };

            setData((prev) => {
                const installment = prev.installments.find(
                    (i) => i.id === installmentId
                );
                if (!installment) return prev;

                const updatedPayments = [...installment.payments, newPayment];
                const paidAmount = updatedPayments
                    .filter((p) => p.status === "paid" || p.status === "late")
                    .reduce((sum, p) => sum + p.amount, 0);
                const paidInstallments = updatedPayments.filter(
                    (p) => p.status === "paid" || p.status === "late"
                ).length;

                let nextPaymentDate = installment.nextPaymentDate;
                const currentDate = new Date(installment.nextPaymentDate);
                switch (installment.frequency) {
                    case "weekly":
                        currentDate.setDate(currentDate.getDate() + 7);
                        break;
                    case "bi-weekly":
                        currentDate.setDate(currentDate.getDate() + 14);
                        break;
                    case "monthly":
                        currentDate.setMonth(currentDate.getMonth() + 1);
                        break;
                    case "quarterly":
                        currentDate.setMonth(currentDate.getMonth() + 3);
                        break;
                    case "yearly":
                        currentDate.setFullYear(currentDate.getFullYear() + 1);
                        break;
                }
                nextPaymentDate = currentDate.toISOString().split("T")[0];
                const isCompleted =
                    paidInstallments >= installment.totalInstallments;

                // Create expense for the payment if expenseInfo provided
                let newExpenses = prev.expenses;
                if (expenseInfo && payment.amount > 0) {
                    const expense: Expense = {
                        id: generateId(),
                        title: `${installment.title} - Payment ${paidInstallments}`,
                        amount: payment.amount,
                        currency: prev.settings.defaultCurrency,
                        categoryId: installment.categoryId,
                        type: "fixed",
                        paymentMethod: expenseInfo.paymentMethod,
                        accountId: expenseInfo.accountId,
                        date: payment.date,
                        isRecurring: false,
                        tags: ["installment"],
                        notes: payment.notes,
                        linkedInstallmentId: installmentId,
                        createdAt: now,
                        updatedAt: now,
                    };
                    newExpenses = [...prev.expenses, expense];
                }

                return {
                    ...prev,
                    expenses: newExpenses,
                    installments: prev.installments.map((inst) =>
                        inst.id === installmentId
                            ? {
                                  ...inst,
                                  payments: updatedPayments,
                                  paidAmount,
                                  paidInstallments,
                                  nextPaymentDate: isCompleted
                                      ? inst.endDate
                                      : nextPaymentDate,
                                  status: isCompleted
                                      ? "completed"
                                      : inst.status,
                                  updatedAt: now,
                              }
                            : inst
                    ),
                };
            });

            return newPayment;
        },
        [setData]
    );

    // Add refund to installment (negative payment) - creates income transaction
    const addInstallmentRefund = useCallback(
        (
            installmentId: string,
            amount: number,
            reason?: string,
            incomeInfo?: {
                accountId: string;
            }
        ) => {
            const now = new Date().toISOString();
            const refundPayment: InstallmentPayment = {
                id: generateId(),
                installmentId,
                date: now.split("T")[0],
                amount: -Math.abs(amount), // Ensure negative
                status: "paid", // Refunds count towards recalculation
                notes: reason || "Refund",
                createdAt: now,
            };

            setData((prev) => {
                const installment = prev.installments.find(
                    (i) => i.id === installmentId
                );
                if (!installment) return prev;

                const updatedPayments = [
                    ...installment.payments,
                    refundPayment,
                ];
                // Recalculate paid amount including refunds
                const paidAmount = Math.max(
                    0,
                    updatedPayments
                        .filter(
                            (p) => p.status === "paid" || p.status === "late"
                        )
                        .reduce((sum, p) => sum + p.amount, 0)
                );

                // Recalculate paid installments (only positive payments)
                const paidInstallments = Math.max(
                    0,
                    Math.floor(paidAmount / installment.installmentAmount)
                );

                const isCompleted =
                    paidInstallments >= installment.totalInstallments;

                // Create income transaction if account info provided
                let updatedIncomes = prev.incomes;
                if (incomeInfo?.accountId) {
                    // Find refund category or use first available
                    const refundCategory = prev.incomeCategories.find(
                        (c) => c.name.toLowerCase() === "refund"
                    );
                    const refundIncome: Income = {
                        id: generateId(),
                        title: `Refund: ${installment.title}${
                            reason ? ` - ${reason}` : ""
                        }`,
                        amount: Math.abs(amount),
                        currency: prev.settings.defaultCurrency,
                        type: "variable",
                        categoryId:
                            refundCategory?.id ||
                            prev.incomeCategories[0]?.id ||
                            "",
                        status: "received",
                        frequency: "one-time",
                        accountId: incomeInfo.accountId,
                        actualDate: now.split("T")[0],
                        isRecurring: false,
                        tags: ["refund"],
                        linkedInstallmentId: installmentId,
                        createdAt: now,
                        updatedAt: now,
                    };
                    updatedIncomes = [...prev.incomes, refundIncome];
                }

                return {
                    ...prev,
                    incomes: updatedIncomes,
                    installments: prev.installments.map((inst) =>
                        inst.id === installmentId
                            ? {
                                  ...inst,
                                  payments: updatedPayments,
                                  paidAmount,
                                  paidInstallments,
                                  status: isCompleted
                                      ? "completed"
                                      : inst.status === "completed"
                                      ? "active"
                                      : inst.status,
                                  updatedAt: now,
                              }
                            : inst
                    ),
                };
            });

            return refundPayment;
        },
        [setData]
    );

    // ==================== Goal Operations ====================

    const addGoal = useCallback(
        (
            goalData: Omit<
                FinancialGoal,
                "id" | "createdAt" | "updatedAt" | "contributions"
            > & { currentAmount?: number }
        ) => {
            const now = new Date().toISOString();
            const initialAmount = goalData.currentAmount || 0;
            const goalId = generateId();

            const initialContributions: GoalContribution[] =
                initialAmount > 0
                    ? [
                          {
                              id: generateId(),
                              goalId,
                              amount: initialAmount,
                              date: now.split("T")[0],
                              notes: "المبلغ الابتدائي",
                              createdAt: now,
                          },
                      ]
                    : [];

            const newGoal: FinancialGoal = {
                ...goalData,
                id: goalId,
                currentAmount: initialAmount,
                contributions: initialContributions,
                createdAt: now,
                updatedAt: now,
            };
            setData((prev) => ({ ...prev, goals: [...prev.goals, newGoal] }));
            return newGoal;
        },
        [setData]
    );

    const updateGoal = useCallback(
        (id: string, updates: Partial<FinancialGoal>) => {
            setData((prev) => ({
                ...prev,
                goals: prev.goals.map((goal) =>
                    goal.id === id
                        ? {
                              ...goal,
                              ...updates,
                              updatedAt: new Date().toISOString(),
                          }
                        : goal
                ),
            }));
        },
        [setData]
    );

    const deleteGoal = useCallback(
        (id: string) => {
            setData((prev) => ({
                ...prev,
                goals: prev.goals.filter((goal) => goal.id !== id),
            }));
        },
        [setData]
    );

    const addGoalContribution = useCallback(
        (goalId: string, amount: number, notes?: string) => {
            const now = new Date().toISOString();
            const newContribution: GoalContribution = {
                id: generateId(),
                goalId,
                amount,
                date: now.split("T")[0],
                notes,
                createdAt: now,
            };

            setData((prev) => {
                const goal = prev.goals.find((g) => g.id === goalId);
                if (!goal) return prev;

                const updatedContributions = [
                    ...goal.contributions,
                    newContribution,
                ];
                const currentAmount = updatedContributions.reduce(
                    (sum, c) => sum + c.amount,
                    0
                );
                const isCompleted = currentAmount >= goal.targetAmount;

                const updatedMilestones = goal.milestones.map((m) => {
                    if (!m.reached && currentAmount >= m.targetAmount) {
                        return { ...m, reached: true, reachedAt: now };
                    }
                    return m;
                });

                return {
                    ...prev,
                    goals: prev.goals.map((g) =>
                        g.id === goalId
                            ? {
                                  ...g,
                                  contributions: updatedContributions,
                                  currentAmount,
                                  milestones: updatedMilestones,
                                  status: isCompleted ? "completed" : g.status,
                                  updatedAt: now,
                              }
                            : g
                    ),
                };
            });

            return newContribution;
        },
        [setData]
    );

    // ==================== Budget Operations ====================

    const getBudgetOverview = useCallback(
        (month: string = getCurrentMonth()) => {
            const startDay = data.settings.monthStartDay;
            const monthExpenses = data.expenses.filter((e) =>
                isInMonth(e.date, month, startDay)
            );
            const monthIncomes = data.incomes.filter((inc) => {
                const date = inc.actualDate || inc.expectedDate;
                return (
                    date &&
                    isInMonth(date, month, startDay) &&
                    inc.status === "received"
                );
            });
            const totalActualIncome = monthIncomes.reduce(
                (sum, inc) => sum + inc.amount,
                0
            );
            const totalActualExpenses = monthExpenses.reduce(
                (sum, exp) => sum + exp.amount,
                0
            );

            const categoryBudgets = data.categories.map((cat) => {
                const categoryExpenses = monthExpenses.filter(
                    (e) => e.categoryId === cat.id
                );
                const spent = categoryExpenses.reduce(
                    (sum, e) => sum + e.amount,
                    0
                );
                const existing = data.budgets.find((b) => b.month === month);
                const existingCatBudget = existing?.categoryBudgets.find(
                    (cb) => cb.categoryId === cat.id
                );
                const planned =
                    existingCatBudget?.planned ?? (cat.monthlyBudget || 0);
                return { categoryId: cat.id, planned, spent };
            });

            const totalPlanned = categoryBudgets.reduce(
                (sum, cb) => sum + cb.planned,
                0
            );
            const existing = data.budgets.find((b) => b.month === month);

            if (existing) {
                return {
                    ...existing,
                    categoryBudgets,
                    totalPlannedExpenses: totalPlanned,
                    totalActualIncome,
                    totalActualExpenses,
                    actualSavings: totalActualIncome - totalActualExpenses,
                };
            }

            // Return virtual budget if not created yet
            const now = new Date().toISOString();
            return {
                id: "virtual_" + month,
                month,
                totalPlannedIncome: 0,
                totalActualIncome,
                totalPlannedExpenses: totalPlanned,
                totalActualExpenses,
                savingsGoal: 0,
                actualSavings: totalActualIncome - totalActualExpenses,
                categoryBudgets,
                createdAt: now,
                updatedAt: now,
                isVirtual: true,
            };
        },
        [
            data.budgets,
            data.categories,
            data.expenses,
            data.incomes,
            data.settings.monthStartDay,
        ]
    );

    const createBudget = useCallback(
        (month: string = getCurrentMonth()) => {
            const existing = data.budgets.find((b) => b.month === month);
            if (existing) return existing;

            // Use the overview logic to get initial values
            const overview = getBudgetOverview(month);

            // Remove virtual flag and ensure ID
            const { isVirtual, ...budgetData } = overview as any;
            const newBudget: Budget = {
                ...budgetData,
                id: generateId(),
            };

            setData((prev) => ({
                ...prev,
                budgets: [...prev.budgets, newBudget],
            }));
            return newBudget;
        },
        [data.budgets, getBudgetOverview, setData]
    );

    // Backward compatibility wrapper (but safe for useEffect)
    const getOrCreateBudget = useCallback(
        (month: string = getCurrentMonth()) => {
            // If used in render, use getBudgetOverview.
            // If used in event/effect, use createBudget logic.
            // This is tricky to fix without breaking consumers.
            // We will return the overview, and lazily create if needed using setTimeout to avoid render error

            const overview = getBudgetOverview(month);
            const existing = data.budgets.find((b) => b.month === month);

            if (!existing) {
                // Schedule creation to avoid side-effect during render
                setTimeout(() => {
                    createBudget(month);
                }, 0);
            }
            return overview;
        },
        [getBudgetOverview, createBudget, data.budgets]
    );

    const updateBudget = useCallback(
        (id: string, updates: Partial<Budget>) => {
            setData((prev) => ({
                ...prev,
                budgets: prev.budgets.map((budget) =>
                    budget.id === id
                        ? {
                              ...budget,
                              ...updates,
                              updatedAt: new Date().toISOString(),
                          }
                        : budget
                ),
            }));
        },
        [setData]
    );

    // ==================== Alert Operations ====================

    const addAlert = useCallback(
        (alertData: Omit<FinancialAlert, "id" | "createdAt" | "dismissed">) => {
            const newAlert: FinancialAlert = {
                ...alertData,
                id: generateId(),
                dismissed: false,
                createdAt: new Date().toISOString(),
            };
            setData((prev) => ({
                ...prev,
                alerts: [...prev.alerts, newAlert],
            }));
            return newAlert;
        },
        [setData]
    );

    const dismissAlert = useCallback(
        (id: string) => {
            setData((prev) => ({
                ...prev,
                alerts: prev.alerts.map((alert) =>
                    alert.id === id
                        ? {
                              ...alert,
                              dismissed: true,
                              dismissedAt: new Date().toISOString(),
                          }
                        : alert
                ),
            }));
        },
        [setData]
    );

    const clearExpiredAlerts = useCallback(() => {
        const now = new Date();
        setData((prev) => ({
            ...prev,
            alerts: prev.alerts.filter((alert) => {
                if (alert.expiresAt && new Date(alert.expiresAt) < now)
                    return false;
                return true;
            }),
        }));
    }, [setData]);

    // ==================== Settings Operations ====================

    const updateSettings = useCallback(
        (updates: Partial<FinanceSettings>) => {
            setData((prev) => ({
                ...prev,
                settings: { ...prev.settings, ...updates },
            }));
        },
        [setData]
    );

    // ==================== Statistics & Analytics ====================

    const getMonthlyStats = useCallback(
        (month: string = getCurrentMonth()): FinancialStats => {
            const startDay = data.settings.monthStartDay;
            const monthIncomes = data.incomes.filter(
                (i) =>
                    i.status === "received" &&
                    i.actualDate &&
                    isInMonth(i.actualDate, month, startDay)
            );
            const totalIncomeThisMonth = monthIncomes.reduce(
                (sum, i) => sum + i.amount,
                0
            );

            const monthExpenses = data.expenses.filter((e) =>
                isInMonth(e.date, month, startDay)
            );
            const totalExpensesThisMonth = monthExpenses.reduce(
                (sum, e) => sum + e.amount,
                0
            );

            const [year, monthNum] = month.split("-").map(Number);
            const lastMonth =
                monthNum === 1
                    ? `${year - 1}-12`
                    : `${year}-${String(monthNum - 1).padStart(2, "0")}`;

            const lastMonthIncomes = data.incomes.filter(
                (i) =>
                    i.status === "received" &&
                    i.actualDate &&
                    isInMonth(i.actualDate, lastMonth, startDay)
            );
            const lastMonthIncome = lastMonthIncomes.reduce(
                (sum, i) => sum + i.amount,
                0
            );

            const lastMonthExpenses = data.expenses.filter((e) =>
                isInMonth(e.date, lastMonth, startDay)
            );
            const lastMonthExpense = lastMonthExpenses.reduce(
                (sum, e) => sum + e.amount,
                0
            );

            const incomeVsLastMonth =
                lastMonthIncome > 0
                    ? ((totalIncomeThisMonth - lastMonthIncome) /
                          lastMonthIncome) *
                      100
                    : 0;
            const expensesVsLastMonth =
                lastMonthExpense > 0
                    ? ((totalExpensesThisMonth - lastMonthExpense) /
                          lastMonthExpense) *
                      100
                    : 0;

            const activeInstallments = data.installments.filter(
                (i) => i.status === "active"
            );
            const totalInstallmentDebt = activeInstallments.reduce(
                (sum, i) => sum + (i.totalAmount - i.paidAmount),
                0
            );

            const activeGoals = data.goals.filter((g) => g.status === "active");
            const totalGoalsProgress =
                activeGoals.length > 0
                    ? activeGoals.reduce(
                          (sum, g) =>
                              sum + (g.currentAmount / g.targetAmount) * 100,
                          0
                      ) / activeGoals.length
                    : 0;

            const categorySpending: Record<string, number> = {};
            monthExpenses.forEach((e) => {
                categorySpending[e.categoryId] =
                    (categorySpending[e.categoryId] || 0) + e.amount;
            });

            let topCategoryId = "";
            let topAmount = 0;
            Object.entries(categorySpending).forEach(([catId, amount]) => {
                if (amount > topAmount) {
                    topCategoryId = catId;
                    topAmount = amount;
                }
            });

            const topCategory = data.categories.find(
                (c) => c.id === topCategoryId
            );
            const activeAlerts = data.alerts.filter((a) => !a.dismissed);
            const criticalAlerts = activeAlerts.filter(
                (a) => a.severity === "critical"
            );

            const netBalance = totalIncomeThisMonth - totalExpensesThisMonth;
            const savingsRate =
                totalIncomeThisMonth > 0
                    ? (netBalance / totalIncomeThisMonth) * 100
                    : 0;

            return {
                totalIncomeThisMonth,
                totalExpensesThisMonth,
                netBalanceThisMonth: netBalance,
                savingsRateThisMonth: savingsRate,
                incomeVsLastMonth,
                expensesVsLastMonth,
                totalActiveInstallments: activeInstallments.length,
                totalInstallmentDebt,
                totalGoalsProgress,
                topSpendingCategory: topCategory?.name || "None",
                topSpendingAmount: topAmount,
                activeAlertsCount: activeAlerts.length,
                criticalAlertsCount: criticalAlerts.length,
            };
        },
        [data]
    );

    const getCategorySpending = useCallback(
        (month: string = getCurrentMonth()): CategorySpending[] => {
            const startDay = data.settings.monthStartDay;
            const monthExpenses = data.expenses.filter((e) =>
                isInMonth(e.date, month, startDay)
            );

            return data.categories
                .map((cat) => {
                    const categoryExpenses = monthExpenses.filter(
                        (e) => e.categoryId === cat.id
                    );
                    const spent = categoryExpenses.reduce(
                        (sum, e) => sum + e.amount,
                        0
                    );
                    const budget = cat.monthlyBudget || 0;
                    const percentage = budget > 0 ? (spent / budget) * 100 : 0;

                    return {
                        categoryId: cat.id,
                        categoryName: cat.name,
                        categoryIcon: cat.icon,
                        categoryColor: cat.color,
                        spent,
                        budget,
                        percentage,
                        isOverBudget: budget > 0 && spent > budget,
                    };
                })
                .sort((a, b) => b.spent - a.spent);
        },
        [data.categories, data.expenses, data.settings.monthStartDay]
    );

    const getDailySpending = useCallback(
        (startDate: string, endDate: string): DailySpending[] => {
            const start = new Date(startDate);
            const end = new Date(endDate);
            const result: DailySpending[] = [];

            const current = new Date(start);
            while (current <= end) {
                const dateStr = current.toISOString().split("T")[0];
                const dayExpenses = data.expenses.filter(
                    (e) => e.date === dateStr
                );

                result.push({
                    date: dateStr,
                    amount: dayExpenses.reduce((sum, e) => sum + e.amount, 0),
                    transactions: dayExpenses.length,
                });

                current.setDate(current.getDate() + 1);
            }

            return result;
        },
        [data.expenses]
    );

    const getRecentTransactions = useCallback(
        (limit: number = 10): Transaction[] => {
            const transactions: Transaction[] = [];

            data.incomes
                .filter((i) => i.status === "received" && i.actualDate)
                .forEach((income) => {
                    transactions.push({
                        id: income.id,
                        type: "income",
                        title: income.title,
                        amount: income.amount,
                        date: income.actualDate!,
                        accountId: income.accountId,
                    });
                });

            data.expenses.forEach((expense) => {
                const category = data.categories.find(
                    (c) => c.id === expense.categoryId
                );
                transactions.push({
                    id: expense.id,
                    type: "expense",
                    title: expense.title,
                    amount: expense.amount,
                    date: expense.date,
                    accountId: expense.accountId,
                    location: expense.location,
                    category: category?.name,
                    categoryIcon: category?.icon,
                    categoryColor: category?.color,
                });
            });

            return transactions
                .sort(
                    (a, b) =>
                        new Date(b.date).getTime() - new Date(a.date).getTime()
                )
                .slice(0, limit);
        },
        [data.incomes, data.expenses, data.categories]
    );

    // ==================== Quick Actions ====================

    const quickAddExpense = useCallback(
        (
            amount: number,
            categoryId: string,
            title?: string,
            notes?: string
        ) => {
            const category = data.categories.find((c) => c.id === categoryId);
            // Get default account or first available account
            const defaultAccount =
                data.accounts.find((a) => a.isDefault) || data.accounts[0];

            if (!defaultAccount) {
                console.error("No account available for quick add expense");
                return null;
            }

            return addExpense({
                title: title || category?.name || "Expense",
                amount,
                currency: data.settings.defaultCurrency,
                categoryId,
                type: "variable",
                paymentMethod: "cash",
                accountId: defaultAccount.id, // Use default account
                date: new Date().toISOString().split("T")[0],
                isRecurring: false,
                tags: [],
                notes,
            });
        },
        [
            addExpense,
            data.accounts,
            data.categories,
            data.settings.defaultCurrency,
        ]
    );

    // ==================== Format Helpers ====================

    const formatCurrency = useCallback(
        (amount: number, currency?: string) => {
            const curr = currency || data.settings.defaultCurrency;
            const formatted = new Intl.NumberFormat("en-US", {
                minimumFractionDigits: data.settings.showCents ? 2 : 0,
                maximumFractionDigits: data.settings.showCents ? 2 : 0,
            }).format(amount);
            return `${formatted} ${curr}`;
        },
        [data.settings.defaultCurrency, data.settings.showCents]
    );

    // ==================== Export/Import Functions ====================

    const exportData = useCallback((): FinanceData => {
        return {
            accounts: data.accounts || [],
            transfers: data.transfers || [],
            incomes: data.incomes,
            expenses: data.expenses,
            categories: data.categories,
            incomeCategories: data.incomeCategories || [],
            installments: data.installments,
            budgets: data.budgets,
            goals: data.goals,
            alerts: data.alerts,
            settings: data.settings,
            exportedAt: new Date().toISOString(),
            version: "2.0.0",
        };
    }, [data]);

    const importData = useCallback(
        (importedData: FinanceData) => {
            if (
                !importedData.incomes ||
                !importedData.expenses ||
                !importedData.categories
            ) {
                throw new Error("Invalid data structure");
            }

            // Run migration if imported data doesn't have accounts
            const migratedData = runMigrationIfNeeded(importedData);

            setData({
                accounts: migratedData.accounts || [],
                transfers: migratedData.transfers || [],
                incomes: migratedData.incomes || [],
                expenses: migratedData.expenses || [],
                categories: migratedData.categories || data.categories,
                incomeCategories: migratedData.incomeCategories || [],
                installments: migratedData.installments || [],
                budgets: migratedData.budgets || [],
                goals: migratedData.goals || [],
                alerts: migratedData.alerts || [],
                settings: migratedData.settings || data.settings,
                exportedAt: new Date().toISOString(),
                version: migratedData.version || "2.0.0",
            });
        },
        [data.categories, data.settings, setData]
    );

    const resetData = useCallback(() => {
        const defaultData = getDefaultFinanceData();
        setData(defaultData);
    }, [setData]);

    // Return all operations and data
    return {
        // Data
        accounts: data.accounts,
        transfers: data.transfers,
        incomes: data.incomes,
        expenses: data.expenses,
        categories: data.categories,
        incomeCategories: data.incomeCategories || [],
        installments: data.installments,
        budgets: data.budgets,
        goals: data.goals,
        alerts: data.alerts.filter((a) => !a.dismissed),
        settings: data.settings,

        // Income operations
        addIncome,
        updateIncome,
        deleteIncome,
        getIncomeById,

        // Expense operations
        addExpense,
        updateExpense,
        deleteExpense,
        getExpenseById,
        quickAddExpense,

        // Category operations
        addCategory,
        updateCategory,
        deleteCategory,
        getCategoryById,

        // Income Category operations
        addIncomeCategory,
        updateIncomeCategory,
        deleteIncomeCategory,
        getIncomeCategoryById,

        // Account operations
        addAccount,
        updateAccount,
        deleteAccount,
        getAccountById,
        calculateAccountBalance,
        transferBetweenAccounts,

        // Installment operations
        addInstallment,
        updateInstallment,
        deleteInstallment,
        addInstallmentPayment,
        addInstallmentRefund,

        // Goal operations
        addGoal,
        updateGoal,
        deleteGoal,
        addGoalContribution,

        // Budget operations
        getOrCreateBudget,
        getBudgetOverview,
        createBudget,
        updateBudget,

        // Alert operations
        addAlert,
        dismissAlert,
        clearExpiredAlerts,

        // Settings
        updateSettings,

        // Statistics
        getMonthlyStats,
        getCategorySpending,
        getDailySpending,
        getRecentTransactions,

        // Export/Import
        exportData,
        importData,
        resetData,

        // Helpers
        formatCurrency,
        getCurrentMonth,
    };
};

export default useFinance;
