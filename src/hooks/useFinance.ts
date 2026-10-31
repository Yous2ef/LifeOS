import { useEffect, useCallback, useMemo } from "react";
import { useApp } from "../context/AppContext";
import {
    financeNeedsMigration,
    runMigrationIfNeeded,
} from "@/utils/finance/migration";
import { FUND_ME_ID, getDefaultFinanceData } from "@/utils/finance/defaults";
import { addTombstones, normalizeFinanceData } from "@/utils/finance/normalize";
import {
    accountTotals,
    computeBalances,
    focusedAccountBalance,
    fundBalanceIn,
    fundOf,
    sumActiveAccounts,
} from "@/utils/finance/balances";
import {
    focusWithoutFund,
    getFundDeleteBlocker,
    resolveFocusedFundIds,
    sortFunds,
} from "@/utils/finance/funds";
import { maskAmount, usePrivacyMode } from "./usePrivacyMode";
import {
    isLivePaymentExpense,
    summarizeInstallmentPayments,
} from "@/utils/finance/installments";
import {
    applyRecurringExpenses,
    applyRecurringIncomes,
} from "@/utils/finance/recurring";
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
    Fund,
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
        "0",
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
    startDay: number = 1,
): boolean => {
    const date = new Date(dateStr);
    const start = getMonthStart(month, startDay);
    const end = getMonthEnd(month, startDay);
    return date >= start && date <= end;
};

const omitPaymentFields = (
    updates: Partial<Expense>,
): Partial<Expense> => {
    const safe = { ...updates };
    delete safe.amount;
    delete safe.accountId;
    return safe;
};

// ==================== Main Hook ====================

export const useFinance = () => {
    const { data: appData, updateModule } = useApp();

    // Read path: defaults only. Migration runs on the write path below.
    const data: FinanceData = useMemo(
        () => normalizeFinanceData(appData.finance),
        [appData.finance],
    );

    // Every write applies the updater to the latest (normalised) state, so
    // several writes in one tick all survive. A plain value replaces the module.
    const setData = useCallback(
        (updater: FinanceData | ((prev: FinanceData) => FinanceData)) => {
            updateModule("finance", (prev) => {
                if (typeof updater !== "function") return updater;
                const current = normalizeFinanceData(prev);
                const next = updater(current);
                return next === current ? prev : next; // no-op stays a no-op
            });
        },
        [updateModule],
    );

    // Upgrade older data (v1 single balance, income types) once, on the latest state
    useEffect(() => {
        if (!financeNeedsMigration(data)) return;
        setData((prev) =>
            financeNeedsMigration(prev) ? runMigrationIfNeeded(prev) : prev,
        );
    }, [data, setData]);

    // ==================== Recurring & Automation Logic ====================

    // Generate due recurring incomes/expenses on load. Runs on the latest state
    // inside the updater, so several mounted hooks can't create duplicates.
    useEffect(() => {
        const timer = setTimeout(() => {
            setData((prev) => {
                const incomes = applyRecurringIncomes(prev.incomes);
                const expenses = applyRecurringExpenses(prev.expenses);
                if (!incomes && !expenses) return prev;
                return {
                    ...prev,
                    incomes: incomes ?? prev.incomes,
                    expenses: expenses ?? prev.expenses,
                };
            });
        }, 500);
        return () => clearTimeout(timer);
    }, [setData]);

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
        [setData],
    );

    const updateIncome = useCallback(
        (id: string, updates: Partial<Income>) => {
            setData((prev) => ({
                ...prev,
                incomes: prev.incomes.map((income) => {
                    if (income.id !== id) return income;
                    // Receiving a pending income dates it to the day it arrived
                    const becameReceived =
                        updates.status === "received" &&
                        income.status !== "received";
                    return {
                        ...income,
                        ...updates,
                        ...(becameReceived && !updates.actualDate
                            ? { actualDate: new Date().toISOString().split("T")[0] }
                            : {}),
                        updatedAt: new Date().toISOString(),
                    };
                }),
            }));
        },
        [setData],
    );

    const deleteIncome = useCallback(
        (id: string) => {
            setData((prev) => ({
                ...prev,
                incomes: prev.incomes.filter((income) => income.id !== id),
                deleted: addTombstones(prev.deleted, [id]),
            }));
        },
        [setData],
    );

    // Undo of a delete: put the record back with a fresh updatedAt (so it wins
    // over its tombstone in a later cloud merge) and drop the local tombstone
    const restoreRecord = useCallback(
        (
            restored:
                | { kind: "income"; record: Income }
                | { kind: "expense"; record: Expense }
                | { kind: "transfer"; record: AccountTransfer },
        ) => {
            const now = new Date().toISOString();
            setData((prev) => {
                const deleted = (prev.deleted ?? []).filter(
                    (d) => d.id !== restored.record.id,
                );
                switch (restored.kind) {
                    case "income":
                        return {
                            ...prev,
                            incomes: [
                                ...prev.incomes.filter((i) => i.id !== restored.record.id),
                                { ...restored.record, updatedAt: now },
                            ],
                            deleted,
                        };
                    case "expense":
                        return {
                            ...prev,
                            expenses: [
                                ...prev.expenses.filter((e) => e.id !== restored.record.id),
                                { ...restored.record, updatedAt: now },
                            ],
                            deleted,
                        };
                    case "transfer":
                        return {
                            ...prev,
                            transfers: [
                                ...prev.transfers.filter((t) => t.id !== restored.record.id),
                                { ...restored.record, updatedAt: now },
                            ],
                            deleted,
                        };
                }
            });
        },
        [setData],
    );

    const getIncomeById = useCallback(
        (id: string) => data.incomes.find((income) => income.id === id),
        [data.incomes],
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
        [setData],
    );

    const updateExpense = useCallback(
        (id: string, updates: Partial<Expense>) => {
            setData((prev) => ({
                ...prev,
                expenses: prev.expenses.map((expense) => {
                    if (expense.id !== id) return expense;
                    // An installment payment's amount and account belong to the
                    // payment; changing them here would desync the installment.
                    const safeUpdates = isLivePaymentExpense(
                        expense,
                        prev.installments,
                    )
                        ? omitPaymentFields(updates)
                        : updates;
                    return {
                        ...expense,
                        ...safeUpdates,
                        updatedAt: new Date().toISOString(),
                    };
                }),
            }));
        },
        [setData],
    );

    const deleteExpense = useCallback(
        (id: string): { success: boolean; error?: string } => {
            const expense = data.expenses.find((e) => e.id === id);
            if (expense && isLivePaymentExpense(expense, data.installments)) {
                return {
                    success: false,
                    error: "Delete this payment from the installment",
                };
            }

            setData((prev) => ({
                ...prev,
                expenses: prev.expenses.filter((expense) => expense.id !== id),
                deleted: addTombstones(prev.deleted, [id]),
            }));
            return { success: true };
        },
        [data.expenses, data.installments, setData],
    );

    const getExpenseById = useCallback(
        (id: string) => data.expenses.find((expense) => expense.id === id),
        [data.expenses],
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
        [setData],
    );

    const updateCategory = useCallback(
        (id: string, updates: Partial<ExpenseCategory>) => {
            setData((prev) => ({
                ...prev,
                categories: prev.categories.map((cat) =>
                    cat.id === id
                        ? {
                              ...cat,
                              ...updates,
                              updatedAt: new Date().toISOString(),
                          }
                        : cat,
                ),
            }));
        },
        [setData],
    );

    const deleteCategory = useCallback(
        (id: string, transferToCategoryId?: string) => {
            const category = data.categories.find((c) => c.id === id);
            if (!category) return false;

            if (transferToCategoryId === id) return false;

            const hasExpenseRefs = data.expenses.some(
                (e) => e.categoryId === id,
            );
            const hasInstallmentRefs = data.installments.some(
                (inst) => inst.categoryId === id,
            );
            const hasReferences = hasExpenseRefs || hasInstallmentRefs;

            if (hasReferences && !transferToCategoryId) return false;

            if (
                transferToCategoryId &&
                !data.categories.some((c) => c.id === transferToCategoryId)
            ) {
                return false;
            }

            setData((prev) => {
                const updatedExpenses = transferToCategoryId
                    ? prev.expenses.map((expense) =>
                          expense.categoryId === id
                              ? {
                                    ...expense,
                                    categoryId: transferToCategoryId,
                                    updatedAt: new Date().toISOString(),
                                }
                              : expense,
                      )
                    : prev.expenses;

                const updatedInstallments = transferToCategoryId
                    ? prev.installments.map((inst) =>
                          inst.categoryId === id
                              ? {
                                    ...inst,
                                    categoryId: transferToCategoryId,
                                    updatedAt: new Date().toISOString(),
                                }
                              : inst,
                      )
                    : prev.installments;

                const updatedBudgets = prev.budgets.map((budget) => {
                    const sourceBudget = budget.categoryBudgets.find(
                        (cb) => cb.categoryId === id,
                    );

                    if (!sourceBudget) return budget;

                    if (!transferToCategoryId) {
                        return {
                            ...budget,
                            categoryBudgets: budget.categoryBudgets.filter(
                                (cb) => cb.categoryId !== id,
                            ),
                        };
                    }

                    const nextCategoryBudgets = budget.categoryBudgets.filter(
                        (cb) => cb.categoryId !== id,
                    );
                    const targetIndex = nextCategoryBudgets.findIndex(
                        (cb) => cb.categoryId === transferToCategoryId,
                    );

                    if (targetIndex >= 0) {
                        nextCategoryBudgets[targetIndex] = {
                            ...nextCategoryBudgets[targetIndex],
                            planned:
                                nextCategoryBudgets[targetIndex].planned +
                                sourceBudget.planned,
                            spent:
                                nextCategoryBudgets[targetIndex].spent +
                                sourceBudget.spent,
                        };
                    } else {
                        nextCategoryBudgets.push({
                            categoryId: transferToCategoryId,
                            planned: sourceBudget.planned,
                            spent: sourceBudget.spent,
                        });
                    }

                    return {
                        ...budget,
                        categoryBudgets: nextCategoryBudgets,
                    };
                });

                return {
                    ...prev,
                    expenses: updatedExpenses,
                    installments: updatedInstallments,
                    budgets: updatedBudgets,
                    categories: prev.categories.filter((cat) => cat.id !== id),
                    deleted: addTombstones(prev.deleted, [id]),
                };
            });

            return true;
        },
        [data.categories, data.expenses, data.installments, setData],
    );

    const getCategoryById = useCallback(
        (id: string) => data.categories.find((cat) => cat.id === id),
        [data.categories],
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
        [setData],
    );

    const updateIncomeCategory = useCallback(
        (id: string, updates: Partial<IncomeCategory>) => {
            setData((prev) => ({
                ...prev,
                incomeCategories: (prev.incomeCategories || []).map((cat) =>
                    cat.id === id
                        ? {
                              ...cat,
                              ...updates,
                              updatedAt: new Date().toISOString(),
                          }
                        : cat,
                ),
            }));
        },
        [setData],
    );

    const deleteIncomeCategory = useCallback(
        (id: string, transferToCategoryId?: string) => {
            const category = (data.incomeCategories || []).find(
                (c) => c.id === id,
            );
            if (!category) return false;

            if (transferToCategoryId === id) return false;

            const hasReferences = data.incomes.some(
                (income) => income.categoryId === id,
            );
            if (hasReferences && !transferToCategoryId) return false;

            if (
                transferToCategoryId &&
                !(data.incomeCategories || []).some(
                    (c) => c.id === transferToCategoryId,
                )
            ) {
                return false;
            }

            setData((prev) => ({
                ...prev,
                incomes: transferToCategoryId
                    ? prev.incomes.map((income) =>
                          income.categoryId === id
                              ? {
                                    ...income,
                                    categoryId: transferToCategoryId,
                                    updatedAt: new Date().toISOString(),
                                }
                              : income,
                      )
                    : prev.incomes,
                incomeCategories: (prev.incomeCategories || []).filter(
                    (cat) => cat.id !== id,
                ),
                deleted: addTombstones(prev.deleted, [id]),
            }));

            return true;
        },
        [data.incomeCategories, data.incomes, setData],
    );

    const getIncomeCategoryById = useCallback(
        (id: string) =>
            (data.incomeCategories || []).find((cat) => cat.id === id),
        [data.incomeCategories],
    );

    // ==================== Account Operations ====================

    const addAccount = useCallback(
        (
            accountData: Omit<
                Account,
                "id" | "createdAt" | "updatedAt" | "balance"
            >,
        ) => {
            const now = new Date().toISOString();
            const newAccount: Account = {
                ...accountData,
                id: generateId(),
                createdAt: now,
                updatedAt: now,
            };
            setData((prev) => ({
                ...prev,
                accounts: [...prev.accounts, newAccount],
            }));
            return newAccount;
        },
        [setData],
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
                        : account,
                ),
            }));
        },
        [setData],
    );

    const deleteAccount = useCallback(
        (id: string): { success: boolean; error?: string } => {
            // Check if account has any transactions
            const hasTransactions =
                data.expenses.some((e) => e.accountId === id) ||
                data.incomes.some((i) => i.accountId === id) ||
                data.installments.some((inst) => inst.linkedAccountId === id) ||
                data.transfers.some(
                    (t) => t.fromAccountId === id || t.toAccountId === id,
                );

            if (hasTransactions) {
                return {
                    success: false,
                    error: "Cannot delete account with existing transactions. Archive it instead.",
                };
            }

            // Check if it's the last active account
            const activeAccounts = data.accounts.filter(
                (a) => a.isActive && a.id !== id,
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
                deleted: addTombstones(prev.deleted, [id]),
            }));

            return { success: true };
        },
        [
            data.accounts,
            data.expenses,
            data.incomes,
            data.installments,
            data.transfers,
            setData,
        ],
    );

    const getAccountById = useCallback(
        (id: string) => data.accounts.find((account) => account.id === id),
        [data.accounts],
    );

    // Real-time balances per (account, fund); account totals span all funds
    const fundBalances = useMemo(() => computeBalances(data), [data]);
    const accountBalances = useMemo(
        () => accountTotals(fundBalances),
        [fundBalances],
    );

    const calculateAccountBalance = useCallback(
        (accountId: string): number => accountBalances.get(accountId) ?? 0,
        [accountBalances],
    );

    const balanceOf = useCallback(
        (accountId: string, fundId?: string): number =>
            fundBalanceIn(fundBalances, accountId, fundId),
        [fundBalances],
    );

    // ==================== Fund Operations ====================

    const funds = useMemo(() => sortFunds(data.funds), [data.funds]);

    // Empty = All funds
    const focusedFundIds = useMemo(
        () => resolveFocusedFundIds(data.funds, data.settings.focusedFundIds),
        [data.funds, data.settings.focusedFundIds],
    );

    /** Part of an account's balance owned by the focused funds */
    const calculateFocusedBalance = useCallback(
        (accountId: string): number =>
            focusedAccountBalance(fundBalances, accountId, focusedFundIds),
        [fundBalances, focusedFundIds],
    );

    // Net worth: focused funds across active accounts
    const focusedBalance = useMemo(
        () => sumActiveAccounts(fundBalances, data.accounts, focusedFundIds),
        [fundBalances, data.accounts, focusedFundIds],
    );

    const balanceOfFund = useCallback(
        (fundId: string): number =>
            sumActiveAccounts(fundBalances, data.accounts, [fundOf(fundId)]),
        [fundBalances, data.accounts],
    );

    // Lets the UI explain a blocked delete before asking to confirm
    const getFundDeleteError = useCallback(
        (id: string): string | null => getFundDeleteBlocker(data, id),
        [data],
    );

    const setFocusedFunds = useCallback(
        (fundIds: string[]) => {
            setData((prev) => ({
                ...prev,
                settings: { ...prev.settings, focusedFundIds: fundIds },
            }));
        },
        [setData],
    );

    const addFund = useCallback(
        (
            fundData: Pick<Fund, "name" | "icon" | "color"> &
                Partial<Pick<Fund, "kind">>,
        ) => {
            const now = new Date().toISOString();
            const newFund: Fund = {
                kind: "custom",
                ...fundData,
                id: `fund_${generateId()}`,
                isVisible: true,
                order: 0, // set from the latest list below
                createdAt: now,
                updatedAt: now,
            };
            setData((prev) => ({
                ...prev,
                funds: [
                    ...prev.funds,
                    {
                        ...newFund,
                        order:
                            Math.max(0, ...prev.funds.map((f) => f.order)) + 1,
                    },
                ],
            }));
            return newFund;
        },
        [setData],
    );

    const updateFund = useCallback(
        (id: string, updates: Partial<Omit<Fund, "id" | "createdAt">>) => {
            setData((prev) => ({
                ...prev,
                funds: prev.funds.map((fund) =>
                    fund.id === id
                        ? {
                              ...fund,
                              ...updates,
                              updatedAt: new Date().toISOString(),
                          }
                        : fund,
                ),
            }));
        },
        [setData],
    );

    // Me always keeps its tab: it's the default focus and owns every legacy record
    const toggleFundVisibility = useCallback(
        (id: string) => {
            if (id === FUND_ME_ID) return;
            setData((prev) => {
                const fund = prev.funds.find((f) => f.id === id);
                if (!fund) return prev;
                const hiding = fund.isVisible;
                return {
                    ...prev,
                    funds: prev.funds.map((f) =>
                        f.id === id
                            ? {
                                  ...f,
                                  isVisible: !hiding,
                                  updatedAt: new Date().toISOString(),
                              }
                            : f,
                    ),
                    settings: hiding
                        ? {
                              ...prev.settings,
                              focusedFundIds: focusWithoutFund(
                                  prev.settings.focusedFundIds,
                                  id,
                              ),
                          }
                        : prev.settings,
                };
            });
        },
        [setData],
    );

    const reorderFunds = useCallback(
        (orderedIds: string[]) => {
            const now = new Date().toISOString();
            setData((prev) => ({
                ...prev,
                funds: prev.funds.map((fund) => {
                    const order = orderedIds.indexOf(fund.id);
                    return order === -1 || order === fund.order
                        ? fund
                        : { ...fund, order, updatedAt: now };
                }),
            }));
        },
        [setData],
    );

    const deleteFund = useCallback(
        (id: string): { success: boolean; error?: string } => {
            const blocker = getFundDeleteBlocker(data, id);
            if (blocker) return { success: false, error: blocker };

            setData((prev) => {
                // Re-check on the latest state: a write may have landed since
                if (getFundDeleteBlocker(prev, id)) return prev;
                return {
                    ...prev,
                    funds: prev.funds.filter((fund) => fund.id !== id),
                    settings: {
                        ...prev.settings,
                        focusedFundIds: focusWithoutFund(
                            prev.settings.focusedFundIds,
                            id,
                        ),
                    },
                    deleted: addTombstones(prev.deleted, [id]),
                };
            });
            return { success: true };
        },
        [data, setData],
    );

    // Transfer money between accounts, funds, or both
    const transferBetweenAccounts = useCallback(
        (
            fromAccountId: string,
            toAccountId: string,
            amount: number,
            notes?: string,
            date?: string,
            fundIds?: { fromFundId?: string; toFundId?: string },
        ) => {
            const fromAccount = data.accounts.find(
                (a) => a.id === fromAccountId,
            );
            const toAccount = data.accounts.find((a) => a.id === toAccountId);

            if (!fromAccount || !toAccount) {
                throw new Error("Invalid account IDs");
            }

            if (amount <= 0) {
                throw new Error("Transfer amount must be greater than 0");
            }

            if (
                fromAccountId === toAccountId &&
                fundOf(fundIds?.fromFundId) === fundOf(fundIds?.toFundId)
            ) {
                throw new Error("Choose a different account or fund");
            }

            const now = new Date().toISOString();
            const transfer: AccountTransfer = {
                id: generateId(),
                fromAccountId,
                toAccountId,
                fromFundId: fundIds?.fromFundId,
                toFundId: fundIds?.toFundId,
                amount,
                date: date || now.split("T")[0],
                notes,
                createdAt: now,
                updatedAt: now,
            };

            setData((prev) => ({
                ...prev,
                transfers: [...(prev.transfers || []), transfer],
            }));

            return transfer;
        },
        [data.accounts, setData],
    );

    const updateTransfer = useCallback(
        (id: string, updates: Partial<AccountTransfer>) => {
            setData((prev) => ({
                ...prev,
                transfers: prev.transfers.map((transfer) =>
                    transfer.id === id
                        ? {
                              ...transfer,
                              ...updates,
                              updatedAt: new Date().toISOString(),
                          }
                        : transfer,
                ),
            }));
        },
        [setData],
    );

    const deleteTransfer = useCallback(
        (id: string) => {
            setData((prev) => ({
                ...prev,
                transfers: prev.transfers.filter((t) => t.id !== id),
                deleted: addTombstones(prev.deleted, [id]),
            }));
        },
        [setData],
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
            >,
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
        [setData],
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
                        : inst,
                ),
            }));
        },
        [setData],
    );

    const deleteInstallment = useCallback(
        (id: string, transferToInstallmentId?: string) => {
            const sourceInstallment = data.installments.find(
                (inst) => inst.id === id,
            );
            if (!sourceInstallment) return false;

            if (transferToInstallmentId === id) return false;

            const amountToTransfer = Math.max(0, sourceInstallment.paidAmount);
            if (amountToTransfer > 0 && !transferToInstallmentId) return false;

            if (
                transferToInstallmentId &&
                !data.installments.some(
                    (inst) => inst.id === transferToInstallmentId,
                )
            ) {
                return false;
            }

            setData((prev) => {
                const now = new Date().toISOString();

                let nextInstallments = prev.installments;

                if (transferToInstallmentId && amountToTransfer > 0) {
                    nextInstallments = prev.installments.map((inst) => {
                        if (inst.id !== transferToInstallmentId) return inst;

                        const transferPayment: InstallmentPayment = {
                            id: generateId(),
                            installmentId: inst.id,
                            date: now.split("T")[0],
                            amount: amountToTransfer,
                            status: "paid",
                            notes: `Transferred from deleted installment: ${sourceInstallment.title}`,
                            createdAt: now,
                        };

                        const updatedPayments = [
                            ...inst.payments,
                            transferPayment,
                        ];
                        const paidAmount = Math.max(
                            0,
                            updatedPayments
                                .filter(
                                    (p) =>
                                        p.status === "paid" ||
                                        p.status === "late",
                                )
                                .reduce((sum, p) => sum + p.amount, 0),
                        );
                        const paidInstallments = Math.min(
                            inst.totalInstallments,
                            Math.floor(paidAmount / inst.installmentAmount),
                        );
                        const isCompleted =
                            paidInstallments >= inst.totalInstallments;

                        return {
                            ...inst,
                            payments: updatedPayments,
                            paidAmount,
                            paidInstallments,
                            status: isCompleted ? "completed" : inst.status,
                            updatedAt: now,
                        };
                    });
                }

                return {
                    ...prev,
                    installments: nextInstallments.filter(
                        (inst) => inst.id !== id,
                    ),
                    deleted: addTombstones(prev.deleted, [id]),
                };
            });

            return true;
        },
        [data.installments, setData],
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
            },
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
                    (i) => i.id === installmentId,
                );
                if (!installment) return prev;

                const updatedPayments = [...installment.payments, newPayment];
                const paidAmount = updatedPayments
                    .filter((p) => p.status === "paid" || p.status === "late")
                    .reduce((sum, p) => sum + p.amount, 0);
                const paidInstallments = updatedPayments.filter(
                    (p) => p.status === "paid" || p.status === "late",
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
                        linkedPaymentId: paymentId,
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
                            : inst,
                    ),
                };
            });

            return newPayment;
        },
        [setData],
    );

    // Removes a payment and the expense it created, then re-derives paid totals
    const deleteInstallmentPayment = useCallback(
        (installmentId: string, paymentId: string) => {
            setData((prev) => {
                const installment = prev.installments.find(
                    (i) => i.id === installmentId,
                );
                if (!installment) return prev;

                const payments = installment.payments.filter(
                    (p) => p.id !== paymentId,
                );
                const linkedExpenseIds = prev.expenses
                    .filter((e) => e.linkedPaymentId === paymentId)
                    .map((e) => e.id);
                const now = new Date().toISOString();

                return {
                    ...prev,
                    expenses: prev.expenses.filter(
                        (e) => e.linkedPaymentId !== paymentId,
                    ),
                    installments: prev.installments.map((inst) =>
                        inst.id === installmentId
                            ? {
                                  ...inst,
                                  payments,
                                  ...summarizeInstallmentPayments(
                                      inst,
                                      payments,
                                  ),
                                  updatedAt: now,
                              }
                            : inst,
                    ),
                    deleted: addTombstones(prev.deleted, [
                        paymentId,
                        ...linkedExpenseIds,
                    ]),
                };
            });
        },
        [setData],
    );

    // Add refund to installment (negative payment) - creates income transaction
    const addInstallmentRefund = useCallback(
        (
            installmentId: string,
            amount: number,
            reason?: string,
            incomeInfo?: {
                accountId: string;
            },
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
                    (i) => i.id === installmentId,
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
                            (p) => p.status === "paid" || p.status === "late",
                        )
                        .reduce((sum, p) => sum + p.amount, 0),
                );

                // Recalculate paid installments (only positive payments)
                const paidInstallments = Math.max(
                    0,
                    Math.floor(paidAmount / installment.installmentAmount),
                );

                const isCompleted =
                    paidInstallments >= installment.totalInstallments;

                // Create income transaction if account info provided
                let updatedIncomes = prev.incomes;
                if (incomeInfo?.accountId) {
                    // Find refund category or use first available
                    const refundCategory = prev.incomeCategories.find(
                        (c) => c.name.toLowerCase() === "refund",
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
                            : inst,
                    ),
                };
            });

            return refundPayment;
        },
        [setData],
    );

    // ==================== Goal Operations ====================

    const addGoal = useCallback(
        (
            goalData: Omit<
                FinancialGoal,
                "id" | "createdAt" | "updatedAt" | "contributions"
            > & { currentAmount?: number },
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
        [setData],
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
                        : goal,
                ),
            }));
        },
        [setData],
    );

    const deleteGoal = useCallback(
        (id: string, transferToGoalId?: string) => {
            const sourceGoal = data.goals.find((goal) => goal.id === id);
            if (!sourceGoal) return false;

            if (transferToGoalId === id) return false;

            const amountToTransfer = Math.max(0, sourceGoal.currentAmount);
            if (amountToTransfer > 0 && !transferToGoalId) return false;

            if (
                transferToGoalId &&
                !data.goals.some((goal) => goal.id === transferToGoalId)
            ) {
                return false;
            }

            setData((prev) => {
                const now = new Date().toISOString();
                let nextGoals = prev.goals;

                if (transferToGoalId && amountToTransfer > 0) {
                    nextGoals = prev.goals.map((goal) => {
                        if (goal.id !== transferToGoalId) return goal;

                        const transferContribution: GoalContribution = {
                            id: generateId(),
                            goalId: goal.id,
                            amount: amountToTransfer,
                            date: now.split("T")[0],
                            notes: `Transferred from deleted goal: ${sourceGoal.title}`,
                            createdAt: now,
                        };

                        const updatedContributions = [
                            ...(goal.contributions || []),
                            transferContribution,
                        ];
                        const currentAmount = updatedContributions.reduce(
                            (sum, contribution) => sum + contribution.amount,
                            0,
                        );
                        const updatedMilestones = goal.milestones.map((m) => {
                            if (!m.reached && currentAmount >= m.targetAmount) {
                                return { ...m, reached: true, reachedAt: now };
                            }
                            return m;
                        });

                        return {
                            ...goal,
                            contributions: updatedContributions,
                            currentAmount,
                            milestones: updatedMilestones,
                            status:
                                currentAmount >= goal.targetAmount
                                    ? "completed"
                                    : goal.status,
                            updatedAt: now,
                        };
                    });
                }

                return {
                    ...prev,
                    goals: nextGoals.filter((goal) => goal.id !== id),
                    deleted: addTombstones(prev.deleted, [id]),
                };
            });

            return true;
        },
        [data.goals, setData],
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
                    0,
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
                            : g,
                    ),
                };
            });

            return newContribution;
        },
        [setData],
    );

    // ==================== Budget Operations ====================

    const getBudgetOverview = useCallback(
        (month: string = getCurrentMonth()) => {
            const startDay = data.settings.monthStartDay;
            const monthExpenses = data.expenses.filter((e) =>
                isInMonth(e.date, month, startDay),
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
                0,
            );
            const totalActualExpenses = monthExpenses.reduce(
                (sum, exp) => sum + exp.amount,
                0,
            );

            const categoryBudgets = data.categories.map((cat) => {
                const categoryExpenses = monthExpenses.filter(
                    (e) => e.categoryId === cat.id,
                );
                const spent = categoryExpenses.reduce(
                    (sum, e) => sum + e.amount,
                    0,
                );
                const existing = data.budgets.find((b) => b.month === month);
                const existingCatBudget = existing?.categoryBudgets.find(
                    (cb) => cb.categoryId === cat.id,
                );
                const planned =
                    existingCatBudget?.planned ?? (cat.monthlyBudget || 0);
                return { categoryId: cat.id, planned, spent };
            });

            const totalPlanned = categoryBudgets.reduce(
                (sum, cb) => sum + cb.planned,
                0,
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
        ],
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
        [data.budgets, getBudgetOverview, setData],
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
        [getBudgetOverview, createBudget, data.budgets],
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
                        : budget,
                ),
            }));
        },
        [setData],
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
        [setData],
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
                        : alert,
                ),
            }));
        },
        [setData],
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
        [setData],
    );

    // ==================== Statistics & Analytics ====================

    const getMonthlyStats = useCallback(
        (month: string = getCurrentMonth()): FinancialStats => {
            const startDay = data.settings.monthStartDay;
            const monthIncomes = data.incomes.filter(
                (i) =>
                    i.status === "received" &&
                    i.actualDate &&
                    isInMonth(i.actualDate, month, startDay),
            );
            const totalIncomeThisMonth = monthIncomes.reduce(
                (sum, i) => sum + i.amount,
                0,
            );

            const monthExpenses = data.expenses.filter((e) =>
                isInMonth(e.date, month, startDay),
            );
            const totalExpensesThisMonth = monthExpenses.reduce(
                (sum, e) => sum + e.amount,
                0,
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
                    isInMonth(i.actualDate, lastMonth, startDay),
            );
            const lastMonthIncome = lastMonthIncomes.reduce(
                (sum, i) => sum + i.amount,
                0,
            );

            const lastMonthExpenses = data.expenses.filter((e) =>
                isInMonth(e.date, lastMonth, startDay),
            );
            const lastMonthExpense = lastMonthExpenses.reduce(
                (sum, e) => sum + e.amount,
                0,
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
                (i) => i.status === "active",
            );
            const totalInstallmentDebt = activeInstallments.reduce(
                (sum, i) => sum + (i.totalAmount - i.paidAmount),
                0,
            );

            const activeGoals = data.goals.filter((g) => g.status === "active");
            const totalGoalsProgress =
                activeGoals.length > 0
                    ? activeGoals.reduce(
                          (sum, g) =>
                              sum + (g.currentAmount / g.targetAmount) * 100,
                          0,
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
                (c) => c.id === topCategoryId,
            );
            const activeAlerts = data.alerts.filter((a) => !a.dismissed);
            const criticalAlerts = activeAlerts.filter(
                (a) => a.severity === "critical",
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
        [data],
    );

    const getCategorySpending = useCallback(
        (month: string = getCurrentMonth()): CategorySpending[] => {
            const startDay = data.settings.monthStartDay;
            const monthExpenses = data.expenses.filter((e) =>
                isInMonth(e.date, month, startDay),
            );

            return data.categories
                .map((cat) => {
                    const categoryExpenses = monthExpenses.filter(
                        (e) => e.categoryId === cat.id,
                    );
                    const spent = categoryExpenses.reduce(
                        (sum, e) => sum + e.amount,
                        0,
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
        [data.categories, data.expenses, data.settings.monthStartDay],
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
                    (e) => e.date === dateStr,
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
        [data.expenses],
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
                    (c) => c.id === expense.categoryId,
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
                        new Date(b.date).getTime() - new Date(a.date).getTime(),
                )
                .slice(0, limit);
        },
        [data.incomes, data.expenses, data.categories],
    );

    // ==================== Quick Actions ====================

    const quickAddExpense = useCallback(
        (
            amount: number,
            categoryId: string,
            title?: string,
            notes?: string,
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
        ],
    );

    // ==================== Format Helpers ====================

    // Privacy mode masks every amount at its single formatting point, so any
    // screen that formats through here is covered without its own check.
    const { isHidden: amountsHidden } = usePrivacyMode();

    /** Number without currency (e.g. "3,089"), masked in privacy mode */
    const formatAmount = useCallback(
        (amount: number) =>
            maskAmount(
                new Intl.NumberFormat("en-US", {
                    minimumFractionDigits: data.settings.showCents ? 2 : 0,
                    maximumFractionDigits: data.settings.showCents ? 2 : 0,
                }).format(amount),
                amountsHidden,
            ),
        [amountsHidden, data.settings.showCents],
    );

    const formatCurrency = useCallback(
        (amount: number, currency?: string) => {
            const curr = currency || data.settings.defaultCurrency;
            return `${formatAmount(amount)} ${curr}`;
        },
        [data.settings.defaultCurrency, formatAmount],
    );

    // ==================== Export/Import Functions ====================

    const exportData = useCallback(
        (): FinanceData => ({
            ...data,
            exportedAt: new Date().toISOString(),
            version: "2.0.0",
        }),
        [data],
    );

    // Import and reset replace the whole module (no merge with current data);
    // `replacedAt` makes the next cloud merge take this copy as a whole.
    const importData = useCallback(
        (importedData: FinanceData) => {
            if (
                !importedData.incomes ||
                !importedData.expenses ||
                !importedData.categories
            ) {
                throw new Error("Invalid data structure");
            }

            const migratedData = runMigrationIfNeeded(
                normalizeFinanceData(importedData),
            );
            setData({
                ...migratedData,
                deleted: [],
                replacedAt: new Date().toISOString(),
                version: migratedData.version || "2.0.0",
            });
        },
        [setData],
    );

    const resetData = useCallback(() => {
        setData({
            ...getDefaultFinanceData(),
            replacedAt: new Date().toISOString(),
        });
    }, [setData]);

    // Return all operations and data
    return {
        // Data
        accounts: data.accounts,
        transfers: data.transfers,
        funds,
        focusedFundIds,
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
        restoreRecord,

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
        updateTransfer,
        deleteTransfer,

        // Fund operations
        addFund,
        updateFund,
        deleteFund,
        getFundDeleteError,
        reorderFunds,
        toggleFundVisibility,
        setFocusedFunds,
        balanceOf,
        balanceOfFund,
        calculateFocusedBalance,
        focusedBalance,

        // Installment operations
        addInstallment,
        updateInstallment,
        deleteInstallment,
        addInstallmentPayment,
        deleteInstallmentPayment,
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
        formatAmount,
        getCurrentMonth,
    };
};

export default useFinance;
