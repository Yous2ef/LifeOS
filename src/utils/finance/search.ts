import type { Transaction, TransactionType } from "@/types/modules/finance";
import { fundOf, loanCashSign } from "./balances";

/** A feed row plus the fields search needs that the shared type lacks */
export type SearchableTransaction = Transaction & {
    fundId?: string; // transfers: the sending fund
    toFundId?: string; // transfers: the receiving fund
    projectId?: string;
    isWorkCost?: boolean; // expenses only, as the charity math sees it
    // Transfers seen from the focused funds: money coming in or going out
    // (unset when both sides, or neither, are in focus)
    focusDirection?: "in" | "out";
};

export interface SearchFilters {
    text: string;
    types: TransactionType[]; // empty = every type
    accountId?: string;
    fundId?: string;
    categoryId?: string;
    projectId?: string;
    minAmount?: number;
    maxAmount?: number;
    from?: string; // YYYY-MM-DD, inclusive
    to?: string; // YYYY-MM-DD, inclusive
    workCostOnly?: boolean;
}

export const EMPTY_FILTERS: SearchFilters = { text: "", types: [] };

interface Named {
    id: string;
    name: string;
}

/** Names the rows only reference by id */
export interface SearchNames {
    people: Named[];
    projects: Named[];
}

interface Side {
    accountId: string;
    fundId: string;
}

// A transfer touches two places; everything else touches one
const sidesOf = (t: SearchableTransaction): Side[] => {
    const from = { accountId: t.accountId, fundId: fundOf(t.fundId) };
    if (t.type !== "transfer") return [from];
    return [
        from,
        { accountId: t.toAccountId ?? t.accountId, fundId: fundOf(t.toFundId) },
    ];
};

/** Incoming transfers count for the receiving account too */
export const touchesAccount = (
    t: SearchableTransaction,
    accountId: string,
): boolean => sidesOf(t).some((side) => side.accountId === accountId);

// Account and fund must match on the same side: Bank/Me → Cash/Charity is not
// "Cash, Me"
const matchesPlace = (
    t: SearchableTransaction,
    accountId?: string,
    fundId?: string,
): boolean =>
    (!accountId && !fundId) ||
    sidesOf(t).some(
        (side) =>
            (!accountId || side.accountId === accountId) &&
            (!fundId || side.fundId === fundId),
    );

/**
 * Lower-case, and fold Arabic spelling variants so "احمد" finds "أحمد": alef
 * forms → ا, ة → ه, ى → ي, without tashkeel or tatweel.
 */
export const normalizeSearchText = (text: string): string =>
    text
        .toLowerCase()
        .replace(/[\u064B-\u065F\u0670\u0640]/g, "")
        .replace(/[أإآ]/g, "ا")
        .replace(/ة/g, "ه")
        .replace(/ى/g, "ي");

const textOf = (t: SearchableTransaction, names: SearchNames): string => {
    const person = t.loan
        ? names.people.find((p) => p.id === t.loan?.personId)?.name
        : undefined;
    const project = t.projectId
        ? names.projects.find((p) => p.id === t.projectId)?.name
        : undefined;
    return normalizeSearchText(
        [t.title, t.notes, t.category, person, project, ...(t.tags ?? [])]
            .filter(Boolean)
            .join("\n"),
    );
};

/** Every word must appear somewhere (title, notes, category, person, project, tags) */
const matchesText = (
    t: SearchableTransaction,
    text: string,
    names: SearchNames,
): boolean => {
    const words = normalizeSearchText(text.trim())
        .split(/\s+/)
        .filter(Boolean);
    if (words.length === 0) return true;
    const haystack = textOf(t, names);
    return words.every((word) => haystack.includes(word));
};

export const matchesFilters = (
    t: SearchableTransaction,
    filters: SearchFilters,
    names: SearchNames,
): boolean => {
    const day = t.date.slice(0, 10);
    if (filters.types.length > 0 && !filters.types.includes(t.type)) {
        return false;
    }
    if (filters.from && day < filters.from) return false;
    if (filters.to && day > filters.to) return false;
    if (filters.minAmount !== undefined && t.amount < filters.minAmount) {
        return false;
    }
    if (filters.maxAmount !== undefined && t.amount > filters.maxAmount) {
        return false;
    }
    if (filters.categoryId && t.categoryId !== filters.categoryId) {
        return false;
    }
    if (filters.projectId && t.projectId !== filters.projectId) return false;
    if (filters.workCostOnly && !(t.type === "expense" && t.isWorkCost)) {
        return false;
    }
    if (!matchesPlace(t, filters.accountId, filters.fundId)) return false;
    return matchesText(t, filters.text, names);
};

export const filterTransactions = <T extends SearchableTransaction>(
    transactions: T[],
    filters: SearchFilters,
    names: SearchNames,
): T[] => transactions.filter((t) => matchesFilters(t, filters, names));

/** Filters set besides the text and the date range (for the button badge) */
export const countActiveFilters = (filters: SearchFilters): number =>
    [
        filters.types.length > 0,
        !!filters.accountId,
        !!filters.fundId,
        !!filters.categoryId,
        !!filters.projectId,
        filters.minAmount !== undefined || filters.maxAmount !== undefined,
        !!filters.workCostOnly,
    ].filter(Boolean).length;

export interface SearchTotals {
    count: number;
    income: number;
    expense: number;
    net: number; // income − expense only
    transferCount: number;
    transferAmount: number;
    transferIn: number; // into the focused funds or the given account
    transferOut: number; // out of the focused funds or the given account
    loanCount: number;
    loanIn: number; // borrowed + repaid to you
    loanOut: number; // lent + you repaid
    openingCount: number;
    openingAmount: number; // opening balance entries: never income
}

/**
 * Totals for the current results. Loans, transfers and opening balances never
 * count as income or expense, so they get their own figures and stay out of
 * the net.
 * A row crossing the fund focus counts by its `focusDirection`; otherwise
 * `accountId` splits transfers into in and out as that account sees them (a
 * fund transfer inside it is neither).
 */
export const searchTotals = (
    transactions: SearchableTransaction[],
    accountId?: string,
): SearchTotals => {
    const totals: SearchTotals = {
        count: transactions.length,
        income: 0,
        expense: 0,
        net: 0,
        transferCount: 0,
        transferAmount: 0,
        transferIn: 0,
        transferOut: 0,
        loanCount: 0,
        loanIn: 0,
        loanOut: 0,
        openingCount: 0,
        openingAmount: 0,
    };
    transactions.forEach((t) => {
        if (t.type === "income") totals.income += t.amount;
        else if (t.type === "expense") totals.expense += t.amount;
        else if (t.type === "opening") {
            totals.openingCount += 1;
            totals.openingAmount += t.amount;
        }
        else if (t.type === "transfer") {
            totals.transferCount += 1;
            totals.transferAmount += t.amount;
            if (t.focusDirection === "in") totals.transferIn += t.amount;
            else if (t.focusDirection === "out") totals.transferOut += t.amount;
            else {
                const isFrom = t.accountId === accountId;
                const isTo = t.toAccountId === accountId;
                if (isFrom && !isTo) totals.transferOut += t.amount;
                if (isTo && !isFrom) totals.transferIn += t.amount;
            }
        } else if (t.loan) {
            totals.loanCount += 1;
            const sign = loanCashSign(
                t.loan.direction,
                t.loan.kind === "repayment",
            );
            if (sign > 0) totals.loanIn += t.amount;
            else totals.loanOut += t.amount;
        }
    });
    totals.net = totals.income - totals.expense;
    return totals;
};
