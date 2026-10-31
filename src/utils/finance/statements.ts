import type { FinanceData } from "@/types/modules/finance";
import { isCountedIncome, monthKey } from "./aggregations";
import {
    computeBalances,
    day,
    fundOf,
    incomeDate,
    loanCashSign,
    type BalanceSource,
    type FundBalances,
} from "./balances";
import { todayISO } from "./dates";
import { roundMoney } from "./loans";

export type StatementSource = BalanceSource &
    Pick<FinanceData, "categories" | "incomeCategories">;

/** Which money a statement covers: (account, fund) pairs */
export interface StatementScope {
    /** Empty = all funds */
    fundIds: string[];
    /** Missing = every known account */
    accountIds?: string[];
}

export interface StatementPeriod {
    /** YYYY-MM-DD, inclusive */
    start: string;
    /** YYYY-MM-DD, inclusive */
    end: string;
}

export interface StatementLine {
    categoryId: string;
    name: string;
    icon?: string;
    color?: string;
    amount: number;
    count: number;
}

export interface StatementSection {
    total: number;
    byCategory: StatementLine[];
}

export interface StatementLoans {
    borrowed: number;
    lent: number;
    /** Repayments you received (they repaid you) */
    repaidToYou: number;
    /** Repayments you made */
    youRepaid: number;
    /** What loans added to (or took from) the balance */
    net: number;
}

export interface StatementTransfers {
    /** Moved into the scope from accounts or funds outside it */
    in: number;
    /** Moved out of the scope */
    out: number;
    /** Moved between places inside the scope; changes nothing */
    internal: number;
    net: number;
}

/** Opening balance entries dated in the period: money found, not earned */
export interface StatementOpeningEntries {
    total: number;
    count: number;
}

export interface MonthlyStatement extends StatementPeriod {
    opening: number;
    income: StatementSection;
    expense: StatementSection;
    /** Income − expense; loans and transfers are never part of it */
    net: number;
    loans: StatementLoans;
    transfers: StatementTransfers;
    openingEntries: StatementOpeningEntries;
    /** Balance at the end of the period, read from computeBalances */
    closing: number;
    /**
     * opening + net + loans + transfers + opening entries − closing. Always 0 unless a record
     * changed between reads; shown so a mismatch can never hide.
     */
    difference: number;
}

/** The day before a YYYY-MM-DD date */
export const dayBefore = (iso: string): string => {
    const [year, month, date] = iso.split("-").map(Number);
    return todayISO(new Date(year, month - 1, date - 1));
};

/**
 * The financial month `month` (YYYY-MM) when months start on `startDay`
 * (1–28): from that day up to the day before it in the next month — the same
 * months budgets use.
 */
export const statementPeriod = (
    month: string,
    startDay: number = 1,
): StatementPeriod => {
    const [year, monthNum] = month.split("-").map(Number);
    const first = Math.min(Math.max(Math.round(startDay) || 1, 1), 28);
    return {
        start: todayISO(new Date(year, monthNum - 1, first)),
        end: todayISO(new Date(year, monthNum, first - 1)),
    };
};

/** The financial month (YYYY-MM) a date falls in */
export const statementMonthOf = (iso: string, startDay: number = 1): string => {
    const [year, month, date] = day(iso).split("-").map(Number);
    return monthKey(new Date(year, month - 1 - (date < startDay ? 1 : 0), 1));
};

const shiftMonth = (month: string, by: number): string => {
    const [year, monthNum] = month.split("-").map(Number);
    return monthKey(new Date(year, monthNum - 1 + by, 1));
};

/** The month before a YYYY-MM month */
export const previousMonth = (month: string): string => shiftMonth(month, -1);

/** The month after a YYYY-MM month */
export const nextMonth = (month: string): string => shiftMonth(month, 1);

const scopeTester = (data: StatementSource, scope: StatementScope) => {
    // Only known accounts: computeBalances ignores records on deleted ones
    const known = data.accounts.map((account) => account.id);
    const accounts = new Set(
        scope.accountIds
            ? known.filter((id) => scope.accountIds!.includes(id))
            : known,
    );
    const funds = scope.fundIds.length > 0 ? new Set(scope.fundIds) : null;
    return (accountId: string, fundId: string | undefined) =>
        accounts.has(accountId) && (!funds || funds.has(fundOf(fundId)));
};

const balanceInScope = (
    balances: FundBalances,
    inScope: (accountId: string, fundId: string) => boolean,
) => {
    let total = 0;
    balances.forEach((byFund, accountId) =>
        byFund.forEach((amount, fundId) => {
            if (inScope(accountId, fundId)) total += amount;
        }),
    );
    return total;
};

const section = (
    rows: { categoryId: string; amount: number }[],
    categories: { id: string; name: string; icon?: string; color?: string }[],
): StatementSection => {
    const byCategory = new Map<string, StatementLine>();
    rows.forEach((row) => {
        const category = categories.find((c) => c.id === row.categoryId);
        const line = byCategory.get(row.categoryId) ?? {
            categoryId: row.categoryId,
            name: category?.name ?? "Other",
            icon: category?.icon,
            color: category?.color,
            amount: 0,
            count: 0,
        };
        line.amount += row.amount;
        line.count += 1;
        byCategory.set(row.categoryId, line);
    });
    const lines = Array.from(byCategory.values())
        .map((line) => ({ ...line, amount: roundMoney(line.amount) }))
        .sort((a, b) => b.amount - a.amount);
    return {
        total: roundMoney(rows.reduce((sum, row) => sum + row.amount, 0)),
        byCategory: lines,
    };
};

/**
 * What happened to the money in `scope` during `period`:
 * opening + income − expense ± loans ± transfers crossing the scope + opening
 * balance entries = closing.
 *
 * Opening and closing come from computeBalances (the one balance source), so
 * the statement agrees with every balance shown elsewhere. Records are read
 * the way computeBalances reads them: received income by the day it landed,
 * loans as cash in or out (never income or expense), offset repayments and
 * repayments of a deleted loan skipped, records on unknown accounts ignored.
 */
export const computeMonthlyStatement = (
    data: StatementSource,
    period: StatementPeriod,
    scope: StatementScope,
): MonthlyStatement => {
    const inScope = scopeTester(data, scope);
    const inPeriod = (date: string) =>
        day(date) >= period.start && day(date) <= period.end;

    const opening = balanceInScope(
        computeBalances(data, dayBefore(period.start)),
        inScope,
    );
    const closing = balanceInScope(computeBalances(data, period.end), inScope);

    const incomes = data.incomes.filter(
        (income) =>
            isCountedIncome(income) &&
            inPeriod(incomeDate(income)) &&
            inScope(income.accountId, income.fundId),
    );
    const expenses = data.expenses.filter(
        (expense) =>
            inPeriod(expense.date) && inScope(expense.accountId, expense.fundId),
    );
    const income = section(incomes, data.incomeCategories);
    const expense = section(expenses, data.categories);

    const loans: StatementLoans = {
        borrowed: 0,
        lent: 0,
        repaidToYou: 0,
        youRepaid: 0,
        net: 0,
    };
    const loanList = data.loans ?? [];
    const directionOf = new Map(loanList.map((loan) => [loan.id, loan.direction]));
    loanList.forEach((loan) => {
        if (!inPeriod(loan.date) || !inScope(loan.accountId, loan.fundId)) return;
        if (loan.direction === "borrowed") loans.borrowed += loan.amount;
        else loans.lent += loan.amount;
        loans.net += loanCashSign(loan.direction, false) * loan.amount;
    });
    (data.loanPayments ?? []).forEach((payment) => {
        const direction = directionOf.get(payment.loanId);
        if (!direction || payment.isOffset) return;
        if (!inPeriod(payment.date)) return;
        if (!inScope(payment.accountId, payment.fundId)) return;
        if (direction === "lent") loans.repaidToYou += payment.amount;
        else loans.youRepaid += payment.amount;
        loans.net += loanCashSign(direction, true) * payment.amount;
    });

    const transfers: StatementTransfers = { in: 0, out: 0, internal: 0, net: 0 };
    (data.transfers ?? []).forEach((transfer) => {
        if (!inPeriod(transfer.date)) return;
        const from = inScope(transfer.fromAccountId, transfer.fromFundId);
        const to = inScope(transfer.toAccountId, transfer.toFundId);
        if (from && to) transfers.internal += transfer.amount;
        else if (to) transfers.in += transfer.amount;
        else if (from) transfers.out += transfer.amount;
    });
    transfers.net = transfers.in - transfers.out;

    const openingEntries: StatementOpeningEntries = { total: 0, count: 0 };
    (data.openingBalances ?? []).forEach((entry) => {
        if (!inPeriod(entry.date) || !inScope(entry.accountId, entry.fundId)) {
            return;
        }
        openingEntries.total += entry.amount;
        openingEntries.count += 1;
    });

    const net = income.total - expense.total;
    return {
        ...period,
        opening: roundMoney(opening),
        income,
        expense,
        net: roundMoney(net),
        loans: {
            borrowed: roundMoney(loans.borrowed),
            lent: roundMoney(loans.lent),
            repaidToYou: roundMoney(loans.repaidToYou),
            youRepaid: roundMoney(loans.youRepaid),
            net: roundMoney(loans.net),
        },
        transfers: {
            in: roundMoney(transfers.in),
            out: roundMoney(transfers.out),
            internal: roundMoney(transfers.internal),
            net: roundMoney(transfers.net),
        },
        openingEntries: {
            total: roundMoney(openingEntries.total),
            count: openingEntries.count,
        },
        closing: roundMoney(closing),
        difference: roundMoney(
            opening +
                net +
                loans.net +
                transfers.net +
                openingEntries.total -
                closing,
        ),
    };
};
