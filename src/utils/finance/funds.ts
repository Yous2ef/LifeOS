import type { FinanceData, Fund } from "@/types/modules/finance";
import { fundOf } from "./balances";
import { FUND_CHARITY_ID, FUND_ME_ID } from "./defaults";

export const sortFunds = (funds: Fund[]): Fund[] =>
    [...funds].sort((a, b) => a.order - b.order);

/** Visible funds first, then hidden ("set aside") ones, each in user order */
export const groupFunds = (funds: Fund[]) => {
    const sorted = sortFunds(funds);
    return {
        visible: sorted.filter((fund) => fund.isVisible),
        hidden: sorted.filter((fund) => !fund.isVisible),
    };
};

/**
 * Focus kept to funds that still exist. Empty means "All"; a focus whose funds
 * were all removed (e.g. deleted on another device) falls back to Me.
 */
export const resolveFocusedFundIds = (
    funds: Fund[],
    focusedFundIds: string[] | undefined,
): string[] => {
    const focused = focusedFundIds ?? [FUND_ME_ID];
    if (focused.length === 0) return [];
    const known = new Set(funds.map((fund) => fund.id));
    const kept = focused.filter((id) => known.has(id));
    return kept.length > 0 ? kept : [FUND_ME_ID];
};

/** Focus without `fundId`; a focus left empty goes back to Me, not to All */
export const focusWithoutFund = (
    focusedFundIds: string[],
    fundId: string,
): string[] => {
    const next = focusedFundIds.filter((id) => id !== fundId);
    return focusedFundIds.length > 0 && next.length === 0 ? [FUND_ME_ID] : next;
};

/**
 * Why a fund can't be deleted, or null when it can. A fund's balance comes only
 * from records that name it (initial balances belong to Me), so "no records"
 * also means "holds no money".
 */
export const getFundDeleteBlocker = (
    data: Pick<FinanceData, "incomes" | "expenses" | "transfers"> &
        Partial<Pick<FinanceData, "loans" | "loanPayments">>,
    fundId: string,
): string | null => {
    if (fundId === FUND_ME_ID || fundId === FUND_CHARITY_ID) {
        return "This fund can't be deleted.";
    }

    const isUsed =
        data.incomes.some((income) => fundOf(income.fundId) === fundId) ||
        data.expenses.some((expense) => fundOf(expense.fundId) === fundId) ||
        data.transfers.some(
            (transfer) =>
                fundOf(transfer.fromFundId) === fundId ||
                fundOf(transfer.toFundId) === fundId,
        ) ||
        (data.loans ?? []).some((loan) => fundOf(loan.fundId) === fundId) ||
        (data.loanPayments ?? []).some(
            (payment) => fundOf(payment.fundId) === fundId,
        );
    if (isUsed) return "This fund has transactions. Hide it instead.";

    return null;
};
