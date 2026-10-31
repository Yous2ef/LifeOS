import { describe, expect, it } from "vitest";
import { FUND_CHARITY_ID, FUND_ME_ID } from "../defaults";
import {
    fundBalanceAfterExpense,
    isDonationDoubleCount,
    type ExpenseDraft,
} from "../expenseHints";

const draft = (over: Partial<ExpenseDraft> = {}): ExpenseDraft => ({
    accountId: "acc_1",
    amount: 300,
    categoryId: "cat_food",
    date: "2026-10-10",
    ...over,
});

const balance = (accountId: string, fundId: string) =>
    accountId === "acc_1" && fundId === FUND_ME_ID ? 200 : 0;

describe("fundBalanceAfterExpense", () => {
    it("subtracts the new expense from the fund's balance there", () => {
        expect(fundBalanceAfterExpense(draft(), balance)).toBe(-100);
    });

    it("adds back the saved expense when editing in the same place", () => {
        expect(
            fundBalanceAfterExpense(draft(), balance, {
                accountId: "acc_1",
                amount: 250,
            }),
        ).toBe(150);
        // Moved to another fund: the old amount isn't in this balance
        expect(
            fundBalanceAfterExpense(draft(), balance, {
                accountId: "acc_1",
                fundId: FUND_CHARITY_ID,
                amount: 250,
            }),
        ).toBe(-100);
    });
});

describe("isDonationDoubleCount", () => {
    const context = {
        donationCategoryIds: ["cat_donations"],
        charityFundId: FUND_CHARITY_ID,
        hasPaidOutsideNear: () => true,
    };

    it("flags a donation from outside the Charity fund near an 'Already paid'", () => {
        expect(
            isDonationDoubleCount(draft({ categoryId: "cat_donations" }), context),
        ).toBe(true);
    });

    it("ignores other categories, Charity-fund money, and quiet weeks", () => {
        expect(isDonationDoubleCount(draft(), context)).toBe(false);
        expect(
            isDonationDoubleCount(
                draft({ categoryId: "cat_donations", fundId: FUND_CHARITY_ID }),
                context,
            ),
        ).toBe(false);
        expect(
            isDonationDoubleCount(draft({ categoryId: "cat_donations" }), {
                ...context,
                hasPaidOutsideNear: () => false,
            }),
        ).toBe(false);
    });
});
