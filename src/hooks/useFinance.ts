import { useState, useEffect, useCallback } from "react";
import type {
    FinanceData,
    Income,
    Expense,
    ExpenseCategory,
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
} from "@/types/finance";

// Storage Keys
const FINANCE_DATA_KEY = "lifeos-finance-data";

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
    const nextMonth = new Date(year, monthNum, startDay - 1);
    return nextMonth;
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

    // Generate default categories with IDs
    const categories: ExpenseCategory[] = [
        // Essential (ضروري)
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

        // Variable (متغير)
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

        // Emergency
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

        // Other
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

    return {
        incomes: [],
        expenses: [],
        categories,
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
    const [data, setData] = useState<FinanceData>(() => {
        try {
            const stored = localStorage.getItem(FINANCE_DATA_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                // Merge with defaults to handle new fields
                return {
                    ...getDefaultFinanceData(),
                    ...parsed,
                    settings: {
                        ...getDefaultFinanceData().settings,
                        ...parsed.settings,
                    },
                };
            }
            return getDefaultFinanceData();
        } catch {
            console.error("Failed to load finance data");
            return getDefaultFinanceData();
        }
    });

    // Persist to localStorage
    useEffect(() => {
        try {
            localStorage.setItem(FINANCE_DATA_KEY, JSON.stringify(data));
        } catch (error) {
            console.error("Failed to save finance data:", error);
        }
    }, [data]);

    // ==================== Recurring & Automation Logic ====================

    // Helper: Calculate next occurrence date based on frequency
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
                // Determine the next occurrence date
                let nextDate = income.nextOccurrence
                    ? new Date(income.nextOccurrence)
                    : income.actualDate
                    ? new Date(income.actualDate)
                    : new Date(income.createdAt);

                // If no nextOccurrence set, calculate from last date
                if (!income.nextOccurrence) {
                    const baseDate = income.actualDate || income.createdAt;
                    nextDate = new Date(
                        calculateNextOccurrence(baseDate, income.frequency)
                    );
                }

                // Generate entries for all missed occurrences up to today
                while (nextDate <= today) {
                    const nextDateStr = nextDate.toISOString().split("T")[0];

                    // Check if we already have an entry for this date
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
                            isRecurring: false, // The generated entry is not recurring
                            nextOccurrence: undefined,
                            createdAt: now,
                            updatedAt: now,
                            notes: `${
                                income.notes ? income.notes + " | " : ""
                            }Auto-generated from recurring income`,
                        });
                    }

                    // Calculate next occurrence
                    const newNextDate = calculateNextOccurrence(
                        nextDateStr,
                        income.frequency
                    );
                    nextDate = new Date(newNextDate);
                }

                // Update the parent recurring income with the next occurrence
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

            // Apply updates if any
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

        // Run once on mount
        const timer = setTimeout(processRecurringIncomes, 500);
        return () => clearTimeout(timer);
    }, []); // Empty dependency - run only once on mount

    // Process recurring expenses - runs on app load
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
                // Determine the next occurrence date
                let nextDate = expense.nextOccurrence
                    ? new Date(expense.nextOccurrence)
                    : new Date(expense.date);

                // If no nextOccurrence set, calculate from the expense date
                if (!expense.nextOccurrence) {
                    nextDate = new Date(
                        calculateNextOccurrence(
                            expense.date,
                            expense.recurringFrequency || "monthly"
                        )
                    );
                }

                // Generate entries for all missed occurrences up to today
                while (nextDate <= today) {
                    const nextDateStr = nextDate.toISOString().split("T")[0];

                    // Check if we already have an entry for this date
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
                            isRecurring: false, // The generated entry is not recurring
                            recurringFrequency: undefined,
                            nextOccurrence: undefined,
                            createdAt: now,
                            updatedAt: now,
                            notes: `${
                                expense.notes ? expense.notes + " | " : ""
                            }Auto-generated from recurring expense`,
                        });
                    }

                    // Calculate next occurrence
                    const newNextDate = calculateNextOccurrence(
                        nextDateStr,
                        expense.recurringFrequency || "monthly"
                    );
                    nextDate = new Date(newNextDate);
                }

                // Update the parent recurring expense with the next occurrence
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

            // Apply updates if any
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

        // Run once on mount
        const timer = setTimeout(processRecurringExpenses, 700);
        return () => clearTimeout(timer);
    }, []); // Empty dependency - run only once on mount

    // Process auto-allocate goals - runs on new income
    useEffect(() => {
        const processAutoAllocateGoals = () => {
            const activeGoals = data.goals.filter(
                (goal) => goal.autoAllocate && goal.status === "active"
            );

            if (activeGoals.length === 0) return;

            // Check for new incomes received today that haven't been processed
            const today = new Date();
            const todayStr = today.toISOString().split("T")[0];
            const startOfMonth = new Date(
                today.getFullYear(),
                today.getMonth(),
                data.settings.monthStartDay
            );
            const startOfMonthStr = startOfMonth.toISOString().split("T")[0];

            // Get incomes received this month
            const monthlyIncomes = data.incomes.filter(
                (inc) =>
                    inc.status === "received" &&
                    inc.actualDate &&
                    inc.actualDate >= startOfMonthStr
            );

            // For each auto-allocate goal, check if we need to make a contribution this month
            activeGoals.forEach((goal) => {
                // Check if we already contributed this month
                const monthlyContributions = goal.contributions.filter(
                    (contrib) => contrib.date >= startOfMonthStr
                );

                const totalContributedThisMonth = monthlyContributions.reduce(
                    (sum, c) => sum + c.amount,
                    0
                );

                // If we haven't met the monthly contribution target and have income
                if (
                    totalContributedThisMonth < goal.monthlyContribution &&
                    monthlyIncomes.length > 0
                ) {
                    const remaining =
                        goal.monthlyContribution - totalContributedThisMonth;
                    const amountToContribute = Math.min(
                        remaining,
                        goal.targetAmount - goal.currentAmount
                    );

                    if (amountToContribute > 0) {
                        const now = new Date().toISOString();
                        const newContribution = {
                            id: generateId(),
                            goalId: goal.id,
                            amount: amountToContribute,
                            date: todayStr,
                            notes: "Auto-allocated from monthly income",
                            createdAt: now,
                        };

                        setData((prev) => ({
                            ...prev,
                            goals: prev.goals.map((g) =>
                                g.id === goal.id
                                    ? {
                                          ...g,
                                          currentAmount:
                                              g.currentAmount +
                                              amountToContribute,
                                          contributions: [
                                              ...g.contributions,
                                              newContribution,
                                          ],
                                          status:
                                              g.currentAmount +
                                                  amountToContribute >=
                                              g.targetAmount
                                                  ? "completed"
                                                  : g.status,
                                          updatedAt: now,
                                      }
                                    : g
                            ),
                        }));
                    }
                }
            });
        };

        // Run with a delay to ensure income processing is done first
        const timer = setTimeout(processAutoAllocateGoals, 1000);
        return () => clearTimeout(timer);
    }, [data.incomes.length, data.goals.length, data.settings.monthStartDay]);

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
        []
    );

    const updateIncome = useCallback((id: string, updates: Partial<Income>) => {
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
    }, []);

    const deleteIncome = useCallback((id: string) => {
        setData((prev) => ({
            ...prev,
            incomes: prev.incomes.filter((income) => income.id !== id),
        }));
    }, []);

    const getIncomeById = useCallback(
        (id: string) => {
            return data.incomes.find((income) => income.id === id);
        },
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
        []
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
        []
    );

    const deleteExpense = useCallback((id: string) => {
        setData((prev) => ({
            ...prev,
            expenses: prev.expenses.filter((expense) => expense.id !== id),
        }));
    }, []);

    const getExpenseById = useCallback(
        (id: string) => {
            return data.expenses.find((expense) => expense.id === id);
        },
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
        []
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
        []
    );

    const deleteCategory = useCallback(
        (id: string) => {
            // Don't delete default categories
            const category = data.categories.find((c) => c.id === id);
            if (category?.isDefault) return false;

            setData((prev) => ({
                ...prev,
                categories: prev.categories.filter((cat) => cat.id !== id),
            }));
            return true;
        },
        [data.categories]
    );

    const getCategoryById = useCallback(
        (id: string) => {
            return data.categories.find((cat) => cat.id === id);
        },
        [data.categories]
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
        []
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
        []
    );

    const deleteInstallment = useCallback((id: string) => {
        setData((prev) => ({
            ...prev,
            installments: prev.installments.filter((inst) => inst.id !== id),
        }));
    }, []);

    const addInstallmentPayment = useCallback(
        (
            installmentId: string,
            payment: Omit<
                InstallmentPayment,
                "id" | "installmentId" | "createdAt"
            >
        ) => {
            const now = new Date().toISOString();
            const newPayment: InstallmentPayment = {
                ...payment,
                id: generateId(),
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

                // Calculate next payment date
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

                // Check if completed
                const isCompleted =
                    paidInstallments >= installment.totalInstallments;

                return {
                    ...prev,
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
        []
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

            // Create initial contribution if there's an initial amount
            const initialContributions: GoalContribution[] =
                initialAmount > 0
                    ? [
                          {
                              id: generateId(),
                              goalId: "", // Will be set below
                              amount: initialAmount,
                              date: now.split("T")[0],
                              notes: "المبلغ الابتدائي",
                              createdAt: now,
                          },
                      ]
                    : [];

            const goalId = generateId();

            // Update the contribution with the actual goal ID
            if (initialContributions.length > 0) {
                initialContributions[0].goalId = goalId;
            }

            const newGoal: FinancialGoal = {
                ...goalData,
                id: goalId,
                currentAmount: initialAmount,
                contributions: initialContributions,
                createdAt: now,
                updatedAt: now,
            };
            setData((prev) => ({
                ...prev,
                goals: [...prev.goals, newGoal],
            }));
            return newGoal;
        },
        []
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
        []
    );

    const deleteGoal = useCallback((id: string) => {
        setData((prev) => ({
            ...prev,
            goals: prev.goals.filter((goal) => goal.id !== id),
        }));
    }, []);

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

                // Check if goal reached
                const isCompleted = currentAmount >= goal.targetAmount;

                // Update milestones
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
        []
    );

    // ==================== Budget Operations ====================

    const getOrCreateBudget = useCallback(
        (month: string = getCurrentMonth()) => {
            const startDay = data.settings.monthStartDay;

            // Calculate actual spent amounts from expenses for this month
            const monthExpenses = data.expenses.filter((e) =>
                isInMonth(e.date, month, startDay)
            );

            // Calculate actual income for this month
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

            // Build categoryBudgets with actual spent values
            const categoryBudgets = data.categories.map((cat) => {
                const categoryExpenses = monthExpenses.filter(
                    (e) => e.categoryId === cat.id
                );
                const spent = categoryExpenses.reduce(
                    (sum, e) => sum + e.amount,
                    0
                );

                // Get planned from existing budget or category default
                const existing = data.budgets.find((b) => b.month === month);
                const existingCatBudget = existing?.categoryBudgets.find(
                    (cb) => cb.categoryId === cat.id
                );
                const planned =
                    existingCatBudget?.planned ?? (cat.monthlyBudget || 0);

                return {
                    categoryId: cat.id,
                    planned,
                    spent,
                };
            });

            const totalPlanned = categoryBudgets.reduce(
                (sum, cb) => sum + cb.planned,
                0
            );

            const existing = data.budgets.find((b) => b.month === month);
            if (existing) {
                // Return existing budget with updated spent values
                return {
                    ...existing,
                    categoryBudgets,
                    totalActualIncome,
                    totalActualExpenses,
                    actualSavings: totalActualIncome - totalActualExpenses,
                };
            }

            const now = new Date().toISOString();
            const newBudget: Budget = {
                id: generateId(),
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
            };

            setData((prev) => ({
                ...prev,
                budgets: [...prev.budgets, newBudget],
            }));

            return newBudget;
        },
        [
            data.budgets,
            data.categories,
            data.expenses,
            data.incomes,
            data.settings.monthStartDay,
        ]
    );

    const updateBudget = useCallback((id: string, updates: Partial<Budget>) => {
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
    }, []);

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
        []
    );

    const dismissAlert = useCallback((id: string) => {
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
    }, []);

    const clearExpiredAlerts = useCallback(() => {
        const now = new Date();
        setData((prev) => ({
            ...prev,
            alerts: prev.alerts.filter((alert) => {
                if (alert.expiresAt && new Date(alert.expiresAt) < now) {
                    return false;
                }
                return true;
            }),
        }));
    }, []);

    // ==================== Settings Operations ====================

    const updateSettings = useCallback((updates: Partial<FinanceSettings>) => {
        setData((prev) => ({
            ...prev,
            settings: { ...prev.settings, ...updates },
        }));
    }, []);

    // ==================== Statistics & Analytics ====================

    const getMonthlyStats = useCallback(
        (month: string = getCurrentMonth()): FinancialStats => {
            const startDay = data.settings.monthStartDay;

            // Current month income
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

            // Current month expenses
            const monthExpenses = data.expenses.filter((e) =>
                isInMonth(e.date, month, startDay)
            );
            const totalExpensesThisMonth = monthExpenses.reduce(
                (sum, e) => sum + e.amount,
                0
            );

            // Last month calculations
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

            // Comparisons
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

            // Installments
            const activeInstallments = data.installments.filter(
                (i) => i.status === "active"
            );
            const totalInstallmentDebt = activeInstallments.reduce(
                (sum, i) => sum + (i.totalAmount - i.paidAmount),
                0
            );

            // Goals
            const activeGoals = data.goals.filter((g) => g.status === "active");
            const totalGoalsProgress =
                activeGoals.length > 0
                    ? activeGoals.reduce(
                          (sum, g) =>
                              sum + (g.currentAmount / g.targetAmount) * 100,
                          0
                      ) / activeGoals.length
                    : 0;

            // Top spending category
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

            // Alerts
            const activeAlerts = data.alerts.filter((a) => !a.dismissed);
            const criticalAlerts = activeAlerts.filter(
                (a) => a.severity === "critical"
            );

            // Savings rate
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

            // Add incomes
            data.incomes
                .filter((i) => i.status === "received" && i.actualDate)
                .forEach((income) => {
                    transactions.push({
                        id: income.id,
                        type: "income",
                        title: income.title,
                        amount: income.amount,
                        date: income.actualDate!,
                    });
                });

            // Add expenses
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
                    category: category?.name,
                    categoryIcon: category?.icon,
                    categoryColor: category?.color,
                });
            });

            // Sort by date descending and limit
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
            return addExpense({
                title: title || category?.name || "Expense",
                amount,
                currency: data.settings.defaultCurrency,
                categoryId,
                type: "variable",
                paymentMethod: "cash",
                date: new Date().toISOString().split("T")[0],
                isRecurring: false,
                tags: [],
                notes,
            });
        },
        [addExpense, data.categories, data.settings.defaultCurrency]
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
            ...data,
            exportedAt: new Date().toISOString(),
            version: "1.0.0",
        };
    }, [data]);

    const importData = useCallback(
        (importedData: FinanceData) => {
            // Validate basic structure
            if (
                !importedData.incomes ||
                !importedData.expenses ||
                !importedData.categories
            ) {
                throw new Error("Invalid data structure");
            }

            // Merge or replace data
            setData({
                incomes: importedData.incomes || [],
                expenses: importedData.expenses || [],
                categories: importedData.categories || data.categories,
                installments: importedData.installments || [],
                budgets: importedData.budgets || [],
                goals: importedData.goals || [],
                alerts: importedData.alerts || [],
                settings: importedData.settings || data.settings,
                exportedAt: new Date().toISOString(),
                version: importedData.version || "1.0.0",
            });
        },
        [data.categories, data.settings]
    );

    const resetData = useCallback(() => {
        const defaultData = getDefaultFinanceData();
        setData(defaultData);
        localStorage.removeItem(FINANCE_DATA_KEY);
    }, []);

    // Return all operations and data
    return {
        // Data
        incomes: data.incomes,
        expenses: data.expenses,
        categories: data.categories,
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

        // Installment operations
        addInstallment,
        updateInstallment,
        deleteInstallment,
        addInstallmentPayment,

        // Goal operations
        addGoal,
        updateGoal,
        deleteGoal,
        addGoalContribution,

        // Budget operations
        getOrCreateBudget,
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
