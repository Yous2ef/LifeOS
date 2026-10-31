import type { FinanceData, Income } from "@/types/modules/finance";

export type BalanceSource = Pick<
    FinanceData,
    "accounts" | "incomes" | "expenses" | "transfers"
>;

const day = (date: string): string => date.slice(0, 10);

const isOnOrBefore = (date: string, asOf?: string): boolean =>
    !asOf || day(date) <= day(asOf);

/** The day a received income landed in its account */
export const incomeDate = (income: Income): string =>
    income.actualDate ?? income.createdAt;

/**
 * Balance of every account, derived from its transactions — the only source of
 * truth for balances. `asOf` (YYYY-MM-DD, inclusive) gives historical balances.
 *
 * Installments are not read here: every installment payment creates a linked
 * expense and every refund a linked income, so counting `paidAmount` too would
 * deduct the same money twice.
 */
export const computeAccountBalances = (
    data: BalanceSource,
    asOf?: string,
): Map<string, number> => {
    const balances = new Map<string, number>();
    const add = (accountId: string, amount: number) => {
        if (!balances.has(accountId)) return; // unknown / deleted account
        balances.set(accountId, (balances.get(accountId) ?? 0) + amount);
    };

    data.accounts.forEach((account) =>
        balances.set(account.id, account.initialBalance ?? 0),
    );

    data.incomes.forEach((income) => {
        if (income.status !== "received") return;
        if (!isOnOrBefore(incomeDate(income), asOf)) return;
        add(income.accountId, income.amount);
    });

    data.expenses.forEach((expense) => {
        if (!isOnOrBefore(expense.date, asOf)) return;
        add(expense.accountId, -expense.amount);
    });

    (data.transfers ?? []).forEach((transfer) => {
        if (!isOnOrBefore(transfer.date, asOf)) return;
        add(transfer.fromAccountId, -transfer.amount);
        add(transfer.toAccountId, transfer.amount);
    });

    return balances;
};

export const computeAccountBalance = (
    data: BalanceSource,
    accountId: string,
    asOf?: string,
): number => computeAccountBalances(data, asOf).get(accountId) ?? 0;

/** Sum of active accounts' balances */
export const computeTotalBalance = (data: BalanceSource, asOf?: string) => {
    const balances = computeAccountBalances(data, asOf);
    return data.accounts
        .filter((account) => account.isActive)
        .reduce((sum, account) => sum + (balances.get(account.id) ?? 0), 0);
};
