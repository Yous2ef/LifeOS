import type { Account, FinanceData } from "@/types/modules/finance";

type AccountRecords = Pick<
    FinanceData,
    "incomes" | "expenses" | "installments" | "transfers"
> &
    Partial<Pick<FinanceData, "loans" | "loanPayments" | "openingBalances">>;

/**
 * Accounts as the finance home lists them: pinned ones first, then the rest,
 * each group from the highest balance shown to the lowest. `balanceOf` gives
 * the balance on the card (the focused funds' part when some are focused).
 * Equal balances keep the user's order.
 */
export const sortAccountsForHome = (
    accounts: Account[],
    balanceOf: (accountId: string) => number,
): Account[] => {
    const balances = new Map(
        accounts.map((account) => [account.id, balanceOf(account.id)]),
    );
    return [...accounts].sort(
        (a, b) =>
            Number(!!b.isPinned) - Number(!!a.isPinned) ||
            (balances.get(b.id) ?? 0) - (balances.get(a.id) ?? 0) ||
            a.order - b.order,
    );
};

/** Whether any record (opening balances included) names the account */
export const accountHasRecords = (
    data: AccountRecords,
    accountId: string,
): boolean =>
    data.expenses.some((e) => e.accountId === accountId) ||
    data.incomes.some((i) => i.accountId === accountId) ||
    data.installments.some((inst) => inst.linkedAccountId === accountId) ||
    data.transfers.some(
        (t) => t.fromAccountId === accountId || t.toAccountId === accountId,
    ) ||
    (data.loans ?? []).some((l) => l.accountId === accountId) ||
    (data.loanPayments ?? []).some((p) => p.accountId === accountId) ||
    (data.openingBalances ?? []).some((o) => o.accountId === accountId);

/** Why an account can't be deleted, or null when it can */
export const getAccountDeleteError = (
    data: AccountRecords & Pick<FinanceData, "accounts">,
    accountId: string,
): string | null => {
    if (accountHasRecords(data, accountId)) {
        return "Cannot delete account with existing transactions. Archive it instead.";
    }
    const othersActive = data.accounts.some(
        (account) => account.isActive && account.id !== accountId,
    );
    return othersActive
        ? null
        : "Cannot delete the last active account. Create another account first.";
};
