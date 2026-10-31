import type { Expense, Income } from "@/types/modules/finance";
import { incomeDate } from "./balances";

export interface DateRange {
    start: Date;
    end: Date;
}

/**
 * The one income definition used by every total: only received income counts.
 * Pending/expected income is shown as "Expected", never summed into income.
 */
export const isCountedIncome = (income: Income): boolean =>
    income.status === "received";

/** Date to show an income under: when it arrived, or when it's expected */
export const incomeDisplayDate = (income: Income): string =>
    isCountedIncome(income)
        ? incomeDate(income)
        : (income.expectedDate ?? income.createdAt);

const inRange = (date: string, range: DateRange) => {
    const d = new Date(date);
    return d >= range.start && d <= range.end;
};

export const countedIncomesInRange = (
    incomes: Income[],
    range: DateRange,
): Income[] =>
    incomes.filter(
        (income) => isCountedIncome(income) && inRange(incomeDate(income), range),
    );

export const expensesInRange = (
    expenses: Expense[],
    range: DateRange,
): Expense[] => expenses.filter((expense) => inRange(expense.date, range));

export const sumAmounts = (rows: { amount: number }[]): number =>
    rows.reduce((sum, row) => sum + row.amount, 0);

export const monthKey = (date: Date | string): string => {
    const d = typeof date === "string" ? new Date(date) : date;
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

export interface MonthlyFlow {
    key: string; // YYYY-MM
    month: string; // short label, e.g. "Oct"
    income: number;
    expense: number;
    savings: number;
}

/** Income, expense and savings per calendar month across `range` (empty months included) */
export const monthlySeries = (
    incomes: Income[],
    expenses: Expense[],
    range: DateRange,
): MonthlyFlow[] => {
    const months = new Map<string, MonthlyFlow>();
    // From the 1st: stepping a Jan 30 cursor by a month lands on Mar 2
    const cursor = new Date(range.start.getFullYear(), range.start.getMonth(), 1);
    while (cursor <= range.end) {
        const key = monthKey(cursor);
        months.set(key, {
            key,
            month: cursor.toLocaleDateString("en-US", { month: "short" }),
            income: 0,
            expense: 0,
            savings: 0,
        });
        cursor.setMonth(cursor.getMonth() + 1);
    }

    countedIncomesInRange(incomes, range).forEach((income) => {
        const month = months.get(monthKey(incomeDate(income)));
        if (month) month.income += income.amount;
    });
    expensesInRange(expenses, range).forEach((expense) => {
        const month = months.get(monthKey(expense.date));
        if (month) month.expense += expense.amount;
    });

    months.forEach((m) => (m.savings = m.income - m.expense));
    return Array.from(months.values());
};

export interface CategoryTotal<C> {
    category: C;
    amount: number;
    count: number;
    percentage: number; // share of the rows' total
}

/**
 * Totals per category for income or expense rows, largest first.
 * Categories with no rows are kept (amount 0) so callers can choose to hide them.
 */
export const totalsByCategory = <C extends { id: string }>(
    rows: { categoryId: string; amount: number }[],
    categories: C[],
): CategoryTotal<C>[] => {
    const byCategory = new Map<string, { amount: number; count: number }>();
    rows.forEach((row) => {
        const current = byCategory.get(row.categoryId) ?? { amount: 0, count: 0 };
        byCategory.set(row.categoryId, {
            amount: current.amount + row.amount,
            count: current.count + 1,
        });
    });
    const total = sumAmounts(rows);

    return categories
        .map((category) => {
            const { amount, count } = byCategory.get(category.id) ?? {
                amount: 0,
                count: 0,
            };
            return {
                category,
                amount,
                count,
                percentage: total > 0 ? (amount / total) * 100 : 0,
            };
        })
        .sort((a, b) => b.amount - a.amount);
};

export interface GroupTotal {
    key: string;
    amount: number;
    count: number;
    percentage: number; // share of the rows' total
}

/** Totals per key (rows whose key is null are left out), largest first */
export const totalsBy = <R extends { amount: number }>(
    rows: R[],
    keyOf: (row: R) => string | null | undefined,
): GroupTotal[] => {
    const groups = new Map<string, { amount: number; count: number }>();
    rows.forEach((row) => {
        const key = keyOf(row);
        if (key == null) return;
        const current = groups.get(key) ?? { amount: 0, count: 0 };
        groups.set(key, {
            amount: current.amount + row.amount,
            count: current.count + 1,
        });
    });
    const total = sumAmounts(rows);
    return Array.from(groups, ([key, { amount, count }]) => ({
        key,
        amount,
        count,
        percentage: total > 0 ? (amount / total) * 100 : 0,
    })).sort((a, b) => b.amount - a.amount);
};

/** Rows without a project are grouped under this key */
export const NO_PROJECT_KEY = "__no_project__";

export const totalsByProject = (
    rows: { projectId?: string; amount: number }[],
): GroupTotal[] => totalsBy(rows, (row) => row.projectId || NO_PROJECT_KEY);

/**
 * Biggest sources (income) or payees (expense), grouped by title. Titles are
 * matched case- and space-insensitively so "Upwork" and "upwork " are one.
 */
export const topByTitle = (
    rows: { title: string; amount: number }[],
    limit = 5,
): (GroupTotal & { title: string })[] => {
    const titles = new Map<string, string>();
    const keyOf = (row: { title: string }) => {
        const key = row.title.trim().replace(/\s+/g, " ").toLowerCase();
        if (!titles.has(key)) titles.set(key, row.title.trim() || "Untitled");
        return key;
    };
    return totalsBy(rows, keyOf)
        .slice(0, limit)
        .map((group) => ({ ...group, title: titles.get(group.key) ?? group.key }));
};
