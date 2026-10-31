import { fundOf } from "./balances";

/** The parts of an expense form the warnings look at */
export interface ExpenseDraft {
    accountId: string;
    fundId?: string;
    amount: number;
    categoryId: string;
    date: string;
}

/**
 * Fund balance in the account after this expense. When editing, the saved
 * expense is already in the balance: add it back if it used the same place.
 */
export const fundBalanceAfterExpense = (
    draft: ExpenseDraft,
    getFundBalance: (accountId: string, fundId: string) => number,
    saved?: Partial<ExpenseDraft>,
): number => {
    const fundId = fundOf(draft.fundId);
    const alreadyCounted =
        saved &&
        saved.accountId === draft.accountId &&
        fundOf(saved.fundId) === fundId
            ? (saved.amount ?? 0)
            : 0;
    return getFundBalance(draft.accountId, fundId) + alreadyCounted - draft.amount;
};

export interface DonationContext {
    donationCategoryIds: string[];
    charityFundId?: string;
    /** An income marked "Already paid" within a week of this date */
    hasPaidOutsideNear?: (date: string) => boolean;
}

/**
 * A donation from outside the Charity fund near an "Already paid" income may
 * be the same money counted twice.
 */
export const isDonationDoubleCount = (
    draft: ExpenseDraft,
    context: DonationContext,
): boolean =>
    context.donationCategoryIds.includes(draft.categoryId) &&
    !!context.charityFundId &&
    fundOf(draft.fundId) !== context.charityFundId &&
    !!context.hasPaidOutsideNear?.(draft.date);
