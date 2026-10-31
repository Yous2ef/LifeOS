import { describe, expect, it } from "vitest";
import { getDefaultCharitySettings, FUND_CHARITY_ID, FUND_ME_ID } from "../defaults";
import { buildFeedRows } from "../feedRows";
import { focusCashFlowRecords, focusFeedRows, isFundInFocus } from "../fundFocus";
import { searchTotals } from "../search";
import {
    account,
    expense,
    financeData,
    income,
    loan,
    loanPayment,
    openingEntry,
    person,
    transfer,
} from "./fixtures";

const INV = "fund_inv";

const data = () =>
    financeData({
        accounts: [account(), account({ id: "acc_2", name: "Bank" })],
        people: [person()],
        incomes: [
            income({ id: "salary" }),
            income({ id: "dividend", fundId: INV }),
        ],
        expenses: [
            expense({ id: "food" }),
            expense({ id: "donation", fundId: FUND_CHARITY_ID }),
        ],
        transfers: [
            transfer({ id: "me_to_charity", toAccountId: "acc_1", toFundId: FUND_CHARITY_ID }),
            transfer({ id: "inv_to_me", toAccountId: "acc_1", fromFundId: INV }),
            transfer({ id: "cash_to_bank" }),
            transfer({ id: "charity_to_inv", fromFundId: FUND_CHARITY_ID, toFundId: INV }),
        ],
        loans: [loan({ id: "loan_me" }), loan({ id: "loan_inv", fundId: INV })],
        loanPayments: [loanPayment({ id: "pay_inv", loanId: "loan_me", fundId: INV })],
        openingBalances: [
            openingEntry({ id: "open_me" }),
            openingEntry({ id: "open_charity", fundId: FUND_CHARITY_ID }),
        ],
    });

const rows = () => buildFeedRows(data(), getDefaultCharitySettings());

describe("isFundInFocus", () => {
    it("treats a missing fund as Me and an empty focus as All", () => {
        expect(isFundInFocus([FUND_ME_ID], undefined)).toBe(true);
        expect(isFundInFocus([INV], undefined)).toBe(false);
        expect(isFundInFocus([], INV)).toBe(true);
    });
});

describe("focusFeedRows", () => {
    it("keeps every row unchanged when focus is All", () => {
        const all = rows();
        expect(focusFeedRows(all, [])).toBe(all);
    });

    it("keeps only records in the focused fund, transfers when either side is", () => {
        const focused = focusFeedRows(rows(), [FUND_ME_ID]);
        expect(focused.map((r) => r.id).sort()).toEqual(
            [
                "salary",
                "food",
                "me_to_charity",
                "inv_to_me",
                "cash_to_bank",
                "loan_me",
                "open_me",
            ].sort(),
        );
    });

    it("marks transfers crossing the focus as in or out; internal ones stay unmarked", () => {
        const byId = new Map(
            focusFeedRows(rows(), [FUND_ME_ID]).map((r) => [r.id, r]),
        );
        expect(byId.get("me_to_charity")?.focusDirection).toBe("out");
        expect(byId.get("inv_to_me")?.focusDirection).toBe("in");
        expect(byId.get("cash_to_bank")?.focusDirection).toBeUndefined();
    });

    it("handles several focused funds", () => {
        const focused = focusFeedRows(rows(), [INV, FUND_CHARITY_ID]);
        const byId = new Map(focused.map((r) => [r.id, r]));
        expect([...byId.keys()].sort()).toEqual(
            [
                "dividend",
                "donation",
                "me_to_charity",
                "inv_to_me",
                "charity_to_inv",
                "loan_inv",
                "pay_inv",
                "open_charity",
            ].sort(),
        );
        // Charity → Investment never leaves the focus
        expect(byId.get("charity_to_inv")?.focusDirection).toBeUndefined();
        expect(byId.get("me_to_charity")?.focusDirection).toBe("in");
    });

    it("counts transfers crossing the focus as in or out in the totals", () => {
        const rows = buildFeedRows(
            financeData({
                accounts: [account({ id: "bank", name: "Bank" })],
                transfers: [
                    transfer({
                        id: "give",
                        fromAccountId: "bank",
                        toAccountId: "bank",
                        toFundId: FUND_CHARITY_ID,
                        amount: 500,
                    }),
                ],
            }),
            getDefaultCharitySettings(),
        );
        const totals = searchTotals(focusFeedRows(rows, [FUND_ME_ID]));
        expect(totals.transferOut).toBe(500);
        expect(totals.transferIn).toBe(0);
        const charity = searchTotals(focusFeedRows(rows, [FUND_CHARITY_ID]));
        expect(charity.transferIn).toBe(500);
    });

    it("keeps opening balances out of income, expense and net", () => {
        const totals = searchTotals(focusFeedRows(rows(), [FUND_ME_ID]));
        expect(totals.income).toBe(100);
        expect(totals.expense).toBe(30);
        expect(totals.net).toBe(70);
        expect(totals.openingCount).toBe(1);
        expect(totals.openingAmount).toBe(1000);
    });
});

describe("focusCashFlowRecords", () => {
    it("filters incomes and expenses by fund and transfers by either side", () => {
        const { incomes, expenses, transfers } = data();
        const focused = focusCashFlowRecords({ incomes, expenses, transfers }, [
            FUND_CHARITY_ID,
        ]);
        expect(focused.incomes).toHaveLength(0);
        expect(focused.expenses.map((e) => e.id)).toEqual(["donation"]);
        expect(focused.transfers.map((t) => t.id)).toEqual([
            "me_to_charity",
            "charity_to_inv",
        ]);
    });

    it("returns the records as they are when focus is All", () => {
        const { incomes, expenses, transfers } = data();
        const records = { incomes, expenses, transfers };
        expect(focusCashFlowRecords(records, [])).toBe(records);
    });
});
