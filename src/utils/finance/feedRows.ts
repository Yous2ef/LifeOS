import type { CharitySettings, FinanceData } from "@/types/modules/finance";
import { incomeDisplayDate } from "./aggregations";
import { fundOf } from "./balances";
import { isCharityWorkCost } from "./charity";
import { loanTransactions } from "./loans";
import type { SearchableTransaction } from "./search";

export type FeedSource = Pick<
    FinanceData,
    | "incomes"
    | "expenses"
    | "transfers"
    | "accounts"
    | "funds"
    | "categories"
    | "incomeCategories"
    | "loans"
    | "loanPayments"
    | "people"
> &
    Partial<Pick<FinanceData, "openingBalances">>;

export const OPENING_BALANCE_LABEL = "Opening balance";

/**
 * Every income, expense, transfer, loan movement and opening balance entry as
 * one feed, newest first
 */
export const buildFeedRows = (
    data: FeedSource,
    charity: CharitySettings,
): SearchableTransaction[] => {
    const incomeRows: SearchableTransaction[] = data.incomes.map((inc) => {
        const category = data.incomeCategories.find(
            (c) => c.id === inc.categoryId,
        );
        return {
            id: inc.id,
            type: "income",
            title: inc.title,
            amount: inc.amount,
            date: incomeDisplayDate(inc).split("T")[0],
            accountId: inc.accountId,
            fundId: inc.fundId,
            projectId: inc.projectId,
            category: category?.name,
            categoryId: inc.categoryId,
            categoryIcon: category?.icon,
            categoryColor: category?.color,
            notes: inc.notes,
            tags: inc.tags,
            status: inc.status,
            frequency: inc.frequency,
            isRecurring: inc.isRecurring,
            transactionNature: inc.type,
        };
    });

    const expenseRows: SearchableTransaction[] = data.expenses.map((exp) => {
        const category = data.categories.find((c) => c.id === exp.categoryId);
        return {
            id: exp.id,
            type: "expense",
            title: exp.title,
            amount: exp.amount,
            date: exp.date,
            accountId: exp.accountId,
            fundId: exp.fundId,
            projectId: exp.projectId,
            isWorkCost: isCharityWorkCost(exp, charity, data.categories),
            location: exp.location,
            category: category?.name,
            categoryId: exp.categoryId,
            categoryIcon: category?.icon,
            categoryColor: category?.color,
            notes: exp.notes,
            tags: exp.tags,
            frequency: exp.recurringFrequency,
            isRecurring: exp.isRecurring,
            transactionNature: exp.type,
        };
    });

    const fundName = (fundId?: string) =>
        data.funds.find((f) => f.id === fundOf(fundId))?.name || "Fund";
    const transferRows: SearchableTransaction[] = data.transfers.map((t) => {
        const fromAccount = data.accounts.find((a) => a.id === t.fromAccountId);
        const toAccount = data.accounts.find((a) => a.id === t.toAccountId);
        // Same account = fund transfer: name the owners, not the place
        const route =
            t.fromAccountId === t.toAccountId
                ? `${fundName(t.fromFundId)} → ${fundName(t.toFundId)}`
                : `${fromAccount?.name || "Account"} → ${
                      toAccount?.name || "Account"
                  }`;
        return {
            id: t.id,
            type: "transfer",
            title: t.notes || route,
            amount: t.amount,
            date: t.date,
            accountId: t.fromAccountId,
            toAccountId: t.toAccountId,
            fundId: t.fromFundId,
            toFundId: t.toFundId,
            category: "Transfer",
            notes: t.notes,
        };
    });

    const loanFund = new Map<string, string | undefined>([
        ...data.loans.map((l) => [l.id, l.fundId] as const),
        ...data.loanPayments.map((p) => [p.id, p.fundId] as const),
    ]);
    const loanRows: SearchableTransaction[] = loanTransactions(data).map(
        (row) => ({ ...row, fundId: loanFund.get(row.id) }),
    );

    const openingRows: SearchableTransaction[] = (
        data.openingBalances ?? []
    ).map((entry) => ({
        id: entry.id,
        type: "opening",
        title: entry.notes || OPENING_BALANCE_LABEL,
        amount: entry.amount,
        date: entry.date,
        accountId: entry.accountId,
        fundId: entry.fundId,
        category: OPENING_BALANCE_LABEL,
        notes: entry.notes,
    }));

    return [
        ...incomeRows,
        ...expenseRows,
        ...transferRows,
        ...loanRows,
        ...openingRows,
    ].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
};
