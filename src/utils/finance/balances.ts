import type {
    FinanceData,
    Income,
    LoanDirection,
} from "@/types/modules/finance";
import { FUND_ME_ID } from "./defaults";

export type BalanceSource = Pick<
    FinanceData,
    "accounts" | "incomes" | "expenses" | "transfers"
> &
    Partial<Pick<FinanceData, "loans" | "loanPayments" | "openingBalances">>;

/** accountId → fundId → balance */
export type FundBalances = Map<string, Map<string, number>>;

/** The YYYY-MM-DD part of a date or timestamp */
export const day = (date: string): string => date.slice(0, 10);

export const isOnOrBefore = (date: string, asOf?: string): boolean =>
    !asOf || day(date) <= day(asOf);

/** Records without a fund belong to Me */
export const fundOf = (fundId?: string): string => fundId || FUND_ME_ID;

/**
 * +1 when money comes into the account, −1 when it leaves: borrowing and being
 * repaid bring money in; lending and repaying take it out.
 */
export const loanCashSign = (
    direction: LoanDirection,
    isRepayment: boolean,
): 1 | -1 => ((direction === "borrowed") !== isRepayment ? 1 : -1);

/** The day a received income landed in its account */
export const incomeDate = (income: Income): string =>
    income.actualDate ?? income.createdAt;

/**
 * Balance of every (account, fund) pair, derived from its transactions — the
 * only source of truth for balances. `asOf` (YYYY-MM-DD, inclusive) gives
 * historical balances.
 *
 * An account's initial balance belongs to Me. A transfer moves money from
 * (fromAccount, fromFund) to (toAccount, toFund): same account with another
 * fund changes the owner, not the place.
 *
 * Installments are not read here: every installment payment creates a linked
 * expense and every refund a linked income, so counting `paidAmount` too would
 * deduct the same money twice.
 *
 * Loans move money (borrowed +, lent −, repayments the reverse) without being
 * income or expense. A payment whose loan is gone (deleted on another device)
 * has no direction and is skipped, and offset payments move no money.
 *
 * Opening balance entries add money to (account, fund) on their date without
 * being income, expense or charity.
 */
export const computeBalances = (
    data: BalanceSource,
    asOf?: string,
): FundBalances => {
    const balances: FundBalances = new Map();
    const add = (accountId: string, fundId: string | undefined, amount: number) => {
        const byFund = balances.get(accountId);
        if (!byFund) return; // unknown / deleted account
        const fund = fundOf(fundId);
        byFund.set(fund, (byFund.get(fund) ?? 0) + amount);
    };

    data.accounts.forEach((account) =>
        balances.set(
            account.id,
            new Map([[FUND_ME_ID, account.initialBalance ?? 0]]),
        ),
    );

    data.incomes.forEach((income) => {
        if (income.status !== "received") return;
        if (!isOnOrBefore(incomeDate(income), asOf)) return;
        add(income.accountId, income.fundId, income.amount);
    });

    data.expenses.forEach((expense) => {
        if (!isOnOrBefore(expense.date, asOf)) return;
        add(expense.accountId, expense.fundId, -expense.amount);
    });

    (data.transfers ?? []).forEach((transfer) => {
        if (!isOnOrBefore(transfer.date, asOf)) return;
        add(transfer.fromAccountId, transfer.fromFundId, -transfer.amount);
        add(transfer.toAccountId, transfer.toFundId, transfer.amount);
    });

    (data.openingBalances ?? []).forEach((entry) => {
        if (!isOnOrBefore(entry.date, asOf)) return;
        add(entry.accountId, entry.fundId, entry.amount);
    });

    const loans = data.loans ?? [];
    const directionOf = new Map(loans.map((loan) => [loan.id, loan.direction]));
    loans.forEach((loan) => {
        if (!isOnOrBefore(loan.date, asOf)) return;
        add(
            loan.accountId,
            loan.fundId,
            loanCashSign(loan.direction, false) * loan.amount,
        );
    });
    (data.loanPayments ?? []).forEach((payment) => {
        const direction = directionOf.get(payment.loanId);
        if (!direction || payment.isOffset) return;
        if (!isOnOrBefore(payment.date, asOf)) return;
        add(
            payment.accountId,
            payment.fundId,
            loanCashSign(direction, true) * payment.amount,
        );
    });

    return balances;
};

const sum = (values: Iterable<number>): number => {
    let total = 0;
    for (const value of values) total += value;
    return total;
};

/** Account totals across all funds */
export const accountTotals = (balances: FundBalances): Map<string, number> =>
    new Map(
        Array.from(balances, ([accountId, byFund]) => [
            accountId,
            sum(byFund.values()),
        ]),
    );

/** Balance of every account across all funds */
export const computeAccountBalances = (
    data: BalanceSource,
    asOf?: string,
): Map<string, number> => accountTotals(computeBalances(data, asOf));

export const computeAccountBalance = (
    data: BalanceSource,
    accountId: string,
    asOf?: string,
): number => computeAccountBalances(data, asOf).get(accountId) ?? 0;

/**
 * Part of one account's balance owned by `fundIds`; an empty list means all
 * funds (the account total).
 */
export const focusedAccountBalance = (
    balances: FundBalances,
    accountId: string,
    fundIds: string[],
): number => {
    const byFund = balances.get(accountId);
    if (!byFund) return 0;
    if (fundIds.length === 0) return sum(byFund.values());
    return fundIds.reduce((total, fundId) => total + (byFund.get(fundId) ?? 0), 0);
};

/** Balance one fund holds in one account, from precomputed balances */
export const fundBalanceIn = (
    balances: FundBalances,
    accountId: string,
    fundId: string | undefined,
): number => balances.get(accountId)?.get(fundOf(fundId)) ?? 0;

/**
 * Active accounts' combined balance owned by `fundIds` (empty = all funds),
 * from precomputed balances. Archived accounts are left out of net worth.
 */
export const sumActiveAccounts = (
    balances: FundBalances,
    accounts: BalanceSource["accounts"],
    fundIds: string[],
): number =>
    accounts
        .filter((account) => account.isActive)
        .reduce(
            (total, account) =>
                total + focusedAccountBalance(balances, account.id, fundIds),
            0,
        );

/** Sum of active accounts' balances across all funds */
export const computeTotalBalance = (data: BalanceSource, asOf?: string) =>
    sumActiveAccounts(computeBalances(data, asOf), data.accounts, []);

/** Balance one fund holds in one account */
export const balanceOf = (
    data: BalanceSource,
    accountId: string,
    fundId: string | undefined,
    asOf?: string,
): number => fundBalanceIn(computeBalances(data, asOf), accountId, fundId);

/** Active accounts' combined balance owned by `fundIds` (empty = all funds) */
export const focusedTotal = (
    data: BalanceSource,
    fundIds: string[],
    asOf?: string,
): number => sumActiveAccounts(computeBalances(data, asOf), data.accounts, fundIds);

/** One fund's balance across active accounts */
export const balanceOfFund = (
    data: BalanceSource,
    fundId: string,
    asOf?: string,
): number => focusedTotal(data, [fundOf(fundId)], asOf);
