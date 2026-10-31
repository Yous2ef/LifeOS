import { describe, expect, it } from "vitest";
import {
    computeAccountBalance,
    computeBalances,
    fundBalanceIn,
} from "../balances";
import { FUND_CHARITY_ID, FUND_ME_ID } from "../defaults";
import {
    allocateSettlement,
    getLoanAmountError,
    getLoanPaymentError,
    getPersonDeleteBlocker,
    loanTotals,
    loanTransactions,
    netWorthWithLoans,
    paymentsByLoan,
    settlementFor,
    summarizeLoan,
    summarizePeople,
} from "../loans";
import {
    account,
    expense,
    financeData,
    loan,
    loanPayment,
    person,
} from "./fixtures";

describe("summarizeLoan", () => {
    it("is open with nothing repaid", () => {
        expect(summarizeLoan(loan({ amount: 500 }))).toEqual({
            paid: 0,
            outstanding: 500,
            status: "open",
        });
    });

    it("is partial after a partial repayment", () => {
        const summary = summarizeLoan(loan({ amount: 500 }), [
            loanPayment({ amount: 200 }),
        ]);
        expect(summary).toEqual({ paid: 200, outstanding: 300, status: "partial" });
    });

    it("is settled once repayments cover the amount (no float leftovers)", () => {
        const summary = summarizeLoan(loan({ amount: 0.3 }), [
            loanPayment({ id: "a", amount: 0.1 }),
            loanPayment({ id: "b", amount: 0.2 }),
        ]);
        expect(summary.outstanding).toBe(0);
        expect(summary.status).toBe("settled");
    });

    it("deleting a payment restores the outstanding amount", () => {
        const payments = [
            loanPayment({ id: "a", amount: 200 }),
            loanPayment({ id: "b", amount: 300 }),
        ];
        expect(summarizeLoan(loan(), payments).status).toBe("settled");
        const afterDelete = payments.filter((p) => p.id !== "b");
        expect(summarizeLoan(loan(), afterDelete)).toMatchObject({
            outstanding: 300,
            status: "partial",
        });
    });
});

describe("getLoanPaymentError", () => {
    it("allows a partial or exact repayment", () => {
        expect(getLoanPaymentError(loan(), [], 100)).toBeNull();
        expect(
            getLoanPaymentError(loan(), [loanPayment({ amount: 400 })], 100),
        ).toBeNull();
    });

    it("blocks paying more than what's left", () => {
        expect(
            getLoanPaymentError(loan(), [loanPayment({ amount: 400 })], 101),
        ).toMatch(/more than/);
    });

    it("blocks zero, negative and missing loans", () => {
        expect(getLoanPaymentError(loan(), [], 0)).not.toBeNull();
        expect(getLoanPaymentError(loan(), [], -5)).not.toBeNull();
        expect(getLoanPaymentError(undefined, [], 5)).not.toBeNull();
    });

    it("blocks a repayment dated before the loan", () => {
        const borrowed = loan({ date: "2026-10-05" });
        expect(getLoanPaymentError(borrowed, [], 50, "2026-10-04")).toMatch(
            /before the loan/,
        );
        expect(getLoanPaymentError(borrowed, [], 50, "2026-10-05")).toBeNull();
    });
});

describe("getLoanAmountError", () => {
    it("won't lower a loan below what was already repaid", () => {
        const payments = [loanPayment({ amount: 300 })];
        expect(getLoanAmountError(299, payments)).not.toBeNull();
        expect(getLoanAmountError(300, payments)).toBeNull();
    });
});

describe("people", () => {
    const data = financeData({
        people: [person(), person({ id: "person_2", name: "Sara" })],
        loans: [
            loan({ id: "l1", direction: "borrowed", amount: 610 }),
            loan({
                id: "l2",
                personId: "person_2",
                direction: "lent",
                amount: 3000,
            }),
            loan({
                id: "l3",
                personId: "person_2",
                direction: "lent",
                amount: 500,
            }),
        ],
        loanPayments: [loanPayment({ loanId: "l3", amount: 500 })],
    });

    it("nets each person: negative = you owe, positive = owes you", () => {
        const summaries = summarizePeople(data);
        expect(summaries.get("person_1")).toMatchObject({
            net: -610,
            payable: 610,
            loanCount: 1,
            openCount: 1,
        });
        expect(summaries.get("person_2")).toMatchObject({
            net: 3000,
            receivable: 3000,
            loanCount: 2,
            openCount: 1,
        });
    });

    it("totals receivables and payables", () => {
        expect(loanTotals(data)).toEqual({ receivable: 3000, payable: 610 });
    });

    it("blocks deleting a person who still has loans", () => {
        expect(getPersonDeleteBlocker(data, "person_1")).not.toBeNull();
        expect(getPersonDeleteBlocker(data, "person_x")).toBeNull();
    });
});

describe("loanTotals", () => {
    it("counts only loans in the focused funds (empty = all)", () => {
        const data = financeData({
            loans: [
                loan({ id: "me", direction: "lent", amount: 100 }),
                loan({
                    id: "charity",
                    direction: "lent",
                    amount: 40,
                    fundId: FUND_CHARITY_ID,
                }),
            ],
        });
        expect(loanTotals(data, { fundIds: [FUND_ME_ID] }).receivable).toBe(100);
        expect(
            loanTotals(data, { fundIds: [FUND_CHARITY_ID] }).receivable,
        ).toBe(40);
        expect(loanTotals(data, { fundIds: [] }).receivable).toBe(140);
    });

    it("leaves out loans held in archived accounts when given the active ones", () => {
        const data = financeData({
            loans: [
                loan({ id: "active", direction: "lent", amount: 100 }),
                loan({
                    id: "archived",
                    direction: "lent",
                    amount: 40,
                    accountId: "acc_old",
                }),
            ],
        });
        expect(
            loanTotals(data, { activeAccountIds: ["acc_1"] }).receivable,
        ).toBe(100);
        expect(loanTotals(data).receivable).toBe(140);
    });

    it("respects asOf for loans and repayments", () => {
        const data = financeData({
            loans: [loan({ amount: 500, date: "2026-10-05" })],
            loanPayments: [loanPayment({ amount: 200, date: "2026-10-20" })],
        });
        expect(loanTotals(data, { asOf: "2026-10-04" }).payable).toBe(0);
        expect(loanTotals(data, { asOf: "2026-10-19" }).payable).toBe(500);
        expect(loanTotals(data, { asOf: "2026-10-20" }).payable).toBe(300);
    });

    it("borrowing leaves net worth unchanged; spending it is what lowers it", () => {
        const data = financeData({
            accounts: [account({ initialBalance: 1000 })],
            loans: [loan({ amount: 500 })],
            expenses: [expense({ amount: 300, date: "2026-10-06" })],
        });
        const balance = computeAccountBalance(data, "acc_1");
        expect(balance).toBe(1200);
        expect(netWorthWithLoans(balance, loanTotals(data))).toBe(700);
    });
});

describe("settle up", () => {
    const data = financeData({
        loans: [
            loan({ id: "old", amount: 300, date: "2026-09-01" }),
            loan({ id: "new", amount: 310, date: "2026-10-01" }),
            loan({ id: "lent", direction: "lent", amount: 50 }),
        ],
        loanPayments: [loanPayment({ loanId: "old", amount: 100 })],
    });

    it("targets the person's loans on the side of the net, oldest first, capped at the net", () => {
        const { loans, remaining } = settlementFor(data, {
            personId: "person_1",
        });
        expect(loans.map((l) => l.id)).toEqual(["old", "new"]);
        // borrowed 200 + 310 left, lent 50 -> you owe 460
        expect(remaining).toBe(460);
    });

    it("splits a partial amount oldest first", () => {
        expect(allocateSettlement(data, { personId: "person_1" }, 250)).toEqual(
            {
                allocations: [
                    { loanId: "old", amount: 200 },
                    { loanId: "new", amount: 50 },
                ],
                error: null,
            },
        );
    });

    it("refuses more than the net, settled loans and dates before the loan", () => {
        const target = { personId: "person_1" };
        expect(allocateSettlement(data, target, 461).error).not.toBeNull();
        expect(allocateSettlement(data, target, 460).error).toBeNull();
        expect(
            allocateSettlement(data, target, 100, "2026-08-31").error,
        ).toMatch(/before the loan/);
        const settled = financeData({
            loans: [loan()],
            loanPayments: [loanPayment({ amount: 500 })],
        });
        expect(settlementFor(settled, { loanId: "loan_1" })).toEqual({
            loans: [],
            remaining: 0,
        });
    });

    it("paying the whole net settles every loan on both sides; the account moves by the cash only", () => {
        const mixed = financeData({
            accounts: [account()],
            loans: [
                loan({ id: "lent", direction: "lent", amount: 1000 }),
                loan({ id: "borrowed", direction: "borrowed", amount: 400 }),
            ],
        });
        const target = { personId: "person_1" };
        expect(settlementFor(mixed, target).remaining).toBe(600);
        const { allocations, error } = allocateSettlement(mixed, target, 600);
        expect(error).toBeNull();
        expect(allocations).toEqual([
            { loanId: "lent", amount: 600 },
            { loanId: "lent", amount: 400, isOffset: true },
            { loanId: "borrowed", amount: 400, isOffset: true },
        ]);

        const before = computeAccountBalance(mixed, "acc_1");
        const after = financeData({
            ...mixed,
            loanPayments: allocations.map((a, i) =>
                loanPayment({ id: `p${i}`, ...a }),
            ),
        });
        expect(computeAccountBalance(after, "acc_1")).toBe(before + 600);
        const payments = paymentsByLoan(after.loanPayments);
        after.loans.forEach((l) =>
            expect(summarizeLoan(l, payments.get(l.id)).status).toBe("settled"),
        );
        expect(loanTotals(after)).toEqual({ receivable: 0, payable: 0 });
        // Offsets move no money, so the feed shows only the cash repayment
        expect(
            loanTransactions({ ...after, people: [] }).filter(
                (r) => r.loan?.kind === "repayment",
            ),
        ).toHaveLength(1);
    });

    it("a partial person settle writes no offsets", () => {
        const mixed = financeData({
            loans: [
                loan({ id: "lent", direction: "lent", amount: 1000 }),
                loan({ id: "borrowed", direction: "borrowed", amount: 400 }),
            ],
        });
        expect(
            allocateSettlement(mixed, { personId: "person_1" }, 599).allocations,
        ).toEqual([{ loanId: "lent", amount: 599 }]);
    });
});

describe("balances with loans", () => {
    const base = {
        accounts: [account({ initialBalance: 1000 })],
    };

    it("borrowing adds to the account and fund, repaying takes it out", () => {
        const data = financeData({
            ...base,
            loans: [loan({ amount: 500, fundId: FUND_CHARITY_ID })],
            loanPayments: [
                loanPayment({ amount: 200, fundId: FUND_CHARITY_ID }),
            ],
        });
        const balances = computeBalances(data);
        expect(fundBalanceIn(balances, "acc_1", FUND_ME_ID)).toBe(1000);
        expect(fundBalanceIn(balances, "acc_1", FUND_CHARITY_ID)).toBe(300);
    });

    it("lending takes money out, being repaid brings it back", () => {
        const data = financeData({
            ...base,
            loans: [loan({ direction: "lent", amount: 400 })],
            loanPayments: [loanPayment({ amount: 150 })],
        });
        expect(computeAccountBalance(data, "acc_1")).toBe(750);
    });

    it("a repayment can land in another account and fund than the loan", () => {
        const data = financeData({
            accounts: [account(), account({ id: "acc_2" })],
            loans: [loan({ direction: "lent", amount: 400 })],
            loanPayments: [loanPayment({ accountId: "acc_2", amount: 400 })],
        });
        expect(computeAccountBalance(data, "acc_1")).toBe(-400);
        expect(computeAccountBalance(data, "acc_2")).toBe(400);
    });

    it("respects asOf", () => {
        const data = financeData({
            ...base,
            loans: [loan({ amount: 500, date: "2026-10-05" })],
            loanPayments: [loanPayment({ amount: 200, date: "2026-10-20" })],
        });
        expect(computeAccountBalance(data, "acc_1", "2026-10-04")).toBe(1000);
        expect(computeAccountBalance(data, "acc_1", "2026-10-05")).toBe(1500);
        expect(computeAccountBalance(data, "acc_1", "2026-10-20")).toBe(1300);
    });

    it("skips a repayment whose loan is gone", () => {
        const data = financeData({
            ...base,
            loanPayments: [loanPayment({ loanId: "missing" })],
        });
        expect(computeAccountBalance(data, "acc_1")).toBe(1000);
    });
});

describe("loanTransactions", () => {
    it("lists loans and repayments with the person's name, skipping orphans", () => {
        const rows = loanTransactions(
            financeData({
                people: [person()],
                loans: [loan()],
                loanPayments: [
                    loanPayment(),
                    loanPayment({ id: "orphan", loanId: "missing" }),
                ],
            }),
        );
        expect(rows.map((r) => [r.title, r.loan?.kind])).toEqual([
            ["Borrowed from Abdo", "loan"],
            ["Repaid Abdo", "repayment"],
        ]);
        expect(rows.every((r) => r.type === "loan")).toBe(true);
    });
});
