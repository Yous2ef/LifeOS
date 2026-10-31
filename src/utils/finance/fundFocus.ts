import type { FinanceData } from "@/types/modules/finance";
import { fundOf } from "./balances";
import type { SearchableTransaction } from "./search";

/** Whether a record's fund is in focus; an empty focus means All */
export const isFundInFocus = (
    focusedFundIds: string[],
    fundId: string | undefined,
): boolean =>
    focusedFundIds.length === 0 || focusedFundIds.includes(fundOf(fundId));

/**
 * The feed as the focused funds see it: each row by its own fund, transfers
 * when either side's fund is in focus. A transfer with only one side in focus
 * is marked as money coming in or going out of the focus. Empty focus keeps
 * every row unchanged.
 */
export const focusFeedRows = <T extends SearchableTransaction>(
    rows: T[],
    focusedFundIds: string[],
): T[] => {
    if (focusedFundIds.length === 0) return rows;
    return rows.flatMap((row) => {
        if (row.type !== "transfer") {
            return isFundInFocus(focusedFundIds, row.fundId) ? [row] : [];
        }
        const from = isFundInFocus(focusedFundIds, row.fundId);
        const to = isFundInFocus(focusedFundIds, row.toFundId);
        if (!from && !to) return [];
        if (from && to) return [row];
        return [{ ...row, focusDirection: to ? "in" : "out" }];
    });
};

type CashFlowRecords = Pick<FinanceData, "incomes" | "expenses" | "transfers">;

/** Incomes, expenses and transfers in the focused funds (cash-flow summary) */
export const focusCashFlowRecords = (
    records: CashFlowRecords,
    focusedFundIds: string[],
): CashFlowRecords => {
    if (focusedFundIds.length === 0) return records;
    const inFocus = (fundId?: string) => isFundInFocus(focusedFundIds, fundId);
    return {
        incomes: records.incomes.filter((income) => inFocus(income.fundId)),
        expenses: records.expenses.filter((expense) => inFocus(expense.fundId)),
        transfers: records.transfers.filter(
            (transfer) =>
                inFocus(transfer.fromFundId) || inFocus(transfer.toFundId),
        ),
    };
};
