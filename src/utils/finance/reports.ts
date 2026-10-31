import type {
    CharitySettings,
    FinanceData,
    FinanceProject,
} from "@/types/modules/finance";
import {
    countedIncomesInRange,
    expensesInRange,
    isCountedIncome,
    monthKey,
    type DateRange,
    type MonthlyFlow,
} from "./aggregations";
import {
    computeBalances,
    day,
    incomeDate,
    sumActiveAccounts,
    type BalanceSource,
} from "./balances";
import { isCharityEligibleIncome, isCharityWorkCost } from "./charity";
import { todayISO } from "./dates";
import { loanTotals, roundMoney } from "./loans";
import { nextMonth } from "./statements";

/**
 * Day (YYYY-MM-DD) of the oldest income, expense, transfer, loan or opening
 * balance entry; null when none
 */
export const firstRecordDate = (
    data: Pick<FinanceData, "incomes" | "expenses"> &
        Partial<Pick<FinanceData, "transfers" | "loans" | "openingBalances">>,
): string | null => {
    const dates = [
        ...data.incomes.map(incomeDate),
        ...data.expenses.map((expense) => expense.date),
        ...(data.transfers ?? []).map((transfer) => transfer.date),
        ...(data.loans ?? []).map((loan) => loan.date),
        ...(data.openingBalances ?? []).map((entry) => entry.date),
    ];
    return dates.reduce<string | null>((first, date) => {
        const d = day(date);
        return first === null || d < first ? d : first;
    }, null);
};

/** "Oct 26" from YYYY-MM: the year keeps a trend past 12 months readable */
const shortMonth = (month: string) => {
    const [year, monthNum] = month.split("-").map(Number);
    return new Date(year, monthNum - 1, 1).toLocaleDateString("en-US", {
        month: "short",
        year: "2-digit",
    });
};

export interface NetWorthPoint {
    key: string; // YYYY-MM
    month: string; // short label, e.g. "Oct 26"
    /** Day the snapshot is taken: month end, or `today` for the current month */
    asOf: string;
    balance: number;
    receivable: number;
    payable: number;
    netWorth: number;
}

/**
 * Net worth (D11) at the end of every calendar month from `from` to `to`
 * (YYYY-MM, inclusive), rebuilt from history: balances of the focused funds
 * in active accounts + owed to you − you owe, each as of that day. The
 * current month is read as of `today`, not its last day. Accounts archived
 * now are left out of every month, as they are of today's net worth.
 */
export const netWorthSeries = (
    data: BalanceSource & Pick<FinanceData, "loans" | "loanPayments">,
    from: string,
    to: string,
    { fundIds = [], today }: { fundIds?: string[]; today: string },
): NetWorthPoint[] => {
    const activeAccountIds = data.accounts
        .filter((account) => account.isActive)
        .map((account) => account.id);
    const points: NetWorthPoint[] = [];

    for (let key = from; key <= to; key = nextMonth(key)) {
        const [year, month] = key.split("-").map(Number);
        const monthEnd = todayISO(new Date(year, month, 0));
        const asOf = monthEnd > today ? today : monthEnd;
        const balance = sumActiveAccounts(
            computeBalances(data, asOf),
            data.accounts,
            fundIds,
        );
        const { receivable, payable } = loanTotals(data, {
            fundIds,
            activeAccountIds,
            asOf,
        });
        points.push({
            key,
            month: shortMonth(key),
            asOf,
            balance: roundMoney(balance),
            receivable,
            payable,
            netWorth: roundMoney(balance + receivable - payable),
        });
    }
    return points;
};

export interface ProjectReportRow {
    project: FinanceProject;
    /** Received income tagged with the project */
    paid: number;
    /** Expenses tagged with the project */
    costs: number;
    net: number;
    /**
     * rate × (charity-eligible income − work costs) of the project, never
     * below 0; 0 when charity tracking is off
     */
    charityShare: number;
}

/**
 * Paid, costs and net per project, largest net first.
 *
 * The charity share uses the ledger's own rules, so it never shows money the
 * ledger wouldn't ask for: only eligible income (eligible category, received
 * on/after the start date, not a refund) adds to it, and only work costs dated
 * on/after the start lower it. It is a per-project view only: the obligation
 * itself stays one running total (D6).
 */
export const projectReport = (
    data: Pick<FinanceData, "incomes" | "expenses" | "categories">,
    projects: FinanceProject[],
    { charity, range }: { charity?: CharitySettings; range?: DateRange } = {},
): ProjectReportRow[] => {
    const incomes = range
        ? countedIncomesInRange(data.incomes, range)
        : data.incomes.filter(isCountedIncome);
    const expenses = range ? expensesInRange(data.expenses, range) : data.expenses;
    const sum = (rows: { amount: number }[]) =>
        rows.reduce((total, row) => total + row.amount, 0);

    return projects
        .map((project) => {
            const projectIncomes = incomes.filter(
                (income) => income.projectId === project.id,
            );
            const projectExpenses = expenses.filter(
                (expense) => expense.projectId === project.id,
            );
            const paid = sum(projectIncomes);
            const costs = sum(projectExpenses);
            let charityShare = 0;
            if (charity?.enabled) {
                const eligible = sum(
                    projectIncomes.filter((income) =>
                        isCharityEligibleIncome(income, charity),
                    ),
                );
                const workCosts = sum(
                    projectExpenses.filter(
                        (expense) =>
                            day(expense.date) >= charity.startDate &&
                            isCharityWorkCost(expense, charity, data.categories),
                    ),
                );
                charityShare = charity.rate * Math.max(0, eligible - workCosts);
            }
            return {
                project,
                paid: roundMoney(paid),
                costs: roundMoney(costs),
                net: roundMoney(paid - costs),
                charityShare: roundMoney(charityShare),
            };
        })
        .sort((a, b) => b.net - a.net);
};

export interface Forecast {
    /** Months the averages were taken from */
    basedOn: number;
    /** No complete month yet: the average is the current month so far */
    partial: boolean;
    avgIncome: number;
    avgExpense: number;
    /** Average income − average expense */
    avgMonthly: number;
    months: { key: string; month: string; income: number; expense: number; net: number }[];
}

/**
 * Next `ahead` months projected from the average of the last `window` complete
 * months (the current, unfinished month would pull the average down). Same
 * history, same forecast — no randomness.
 */
export const forecastFromHistory = (
    series: MonthlyFlow[],
    currentKey: string,
    { ahead = 3, window = 3 }: { ahead?: number; window?: number } = {},
): Forecast => {
    const complete = series.filter((m) => m.key < currentKey);
    const partial = complete.length === 0;
    const basis = (complete.length > 0 ? complete : series).slice(-window);
    const count = Math.max(basis.length, 1);
    const avgIncome = basis.reduce((sum, m) => sum + m.income, 0) / count;
    const avgExpense = basis.reduce((sum, m) => sum + m.expense, 0) / count;

    const [year, month] = currentKey.split("-").map(Number);
    const months = Array.from({ length: ahead }, (_, i) => {
        const date = new Date(year, month + i, 1);
        return {
            key: monthKey(date),
            month: date.toLocaleDateString("en-US", {
                month: "short",
                year: "2-digit",
            }),
            income: roundMoney(avgIncome),
            expense: roundMoney(avgExpense),
            net: roundMoney(avgIncome - avgExpense),
        };
    });

    return {
        basedOn: basis.length,
        partial,
        avgIncome: roundMoney(avgIncome),
        avgExpense: roundMoney(avgExpense),
        avgMonthly: roundMoney(avgIncome - avgExpense),
        months,
    };
};
