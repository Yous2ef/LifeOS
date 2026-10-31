import { describe, expect, it } from "vitest";
import {
    balanceOf,
    balanceOfFund,
    computeAccountBalance,
    computeAccountBalances,
    computeBalances,
    computeTotalBalance,
    focusedTotal,
} from "../balances";
import { FUND_CHARITY_ID, FUND_ME_ID } from "../defaults";
import {
    account,
    expense,
    financeData,
    income,
    installment,
    openingEntry,
    transfer,
} from "./fixtures";

describe("computeAccountBalances", () => {
    it("adds received income and subtracts expenses on top of the initial balance", () => {
        const data = financeData({
            accounts: [account({ initialBalance: 50 })],
            incomes: [income({ amount: 100 })],
            expenses: [expense({ amount: 30 })],
        });
        expect(computeAccountBalance(data, "acc_1")).toBe(120);
    });

    it("ignores pending and expected income", () => {
        const data = financeData({
            accounts: [account()],
            incomes: [
                income({ id: "a", status: "pending", amount: 500 }),
                income({ id: "b", status: "expected", amount: 500 }),
            ],
        });
        expect(computeAccountBalance(data, "acc_1")).toBe(0);
    });

    it("moves transfers between accounts without changing the total", () => {
        const data = financeData({
            accounts: [account(), account({ id: "acc_2" })],
            incomes: [income({ amount: 100 })],
            transfers: [transfer({ amount: 20 })],
        });
        const balances = computeAccountBalances(data);
        expect(balances.get("acc_1")).toBe(80);
        expect(balances.get("acc_2")).toBe(20);
        expect(computeTotalBalance(data)).toBe(100);
    });

    it("counts an installment payment once — through its expense, not paidAmount", () => {
        const data = financeData({
            accounts: [account({ initialBalance: 1000 })],
            installments: [installment({ paidAmount: 100, paidInstallments: 1 })],
            expenses: [
                expense({
                    amount: 100,
                    linkedInstallmentId: "inst_1",
                    linkedPaymentId: "pay_1",
                }),
            ],
        });
        expect(computeAccountBalance(data, "acc_1")).toBe(900);
    });

    it("counts an installment refund once — through its income", () => {
        const data = financeData({
            accounts: [account({ initialBalance: 1000 })],
            installments: [installment({ paidAmount: 50 })],
            expenses: [expense({ amount: 100, linkedInstallmentId: "inst_1" })],
            incomes: [
                income({ amount: 50, linkedInstallmentId: "inst_1", tags: ["refund"] }),
            ],
        });
        expect(computeAccountBalance(data, "acc_1")).toBe(950);
    });

    it("ignores synthetic payments moved from a deleted installment (no cash moved)", () => {
        const data = financeData({
            accounts: [account({ initialBalance: 1000 })],
            installments: [
                installment({
                    paidAmount: 300,
                    payments: [
                        {
                            id: "p",
                            installmentId: "inst_1",
                            date: "2026-10-01",
                            amount: 300,
                            status: "paid",
                            notes: "Transferred from deleted installment: Old",
                            createdAt: "2026-10-01T00:00:00.000Z",
                        },
                    ],
                }),
            ],
        });
        expect(computeAccountBalance(data, "acc_1")).toBe(1000);
    });

    it("returns historical balances with asOf (inclusive)", () => {
        const data = financeData({
            accounts: [account(), account({ id: "acc_2" })],
            incomes: [income({ amount: 100, actualDate: "2026-10-10" })],
            expenses: [expense({ amount: 30, date: "2026-10-11" })],
            transfers: [transfer({ amount: 20, date: "2026-10-12" })],
        });
        expect(computeAccountBalance(data, "acc_1", "2026-10-09")).toBe(0);
        expect(computeAccountBalance(data, "acc_1", "2026-10-10")).toBe(100);
        expect(computeAccountBalance(data, "acc_1", "2026-10-11")).toBe(70);
        expect(computeAccountBalance(data, "acc_1", "2026-10-12")).toBe(50);
    });

    it("leaves archived accounts out of the total", () => {
        const data = financeData({
            accounts: [
                account({ initialBalance: 10 }),
                account({ id: "acc_2", initialBalance: 99, isActive: false }),
            ],
        });
        expect(computeTotalBalance(data)).toBe(10);
    });
});

describe("balances per fund", () => {
    it("puts the initial balance and fundless records in Me", () => {
        const data = financeData({
            accounts: [account({ initialBalance: 50 })],
            incomes: [income({ amount: 100 })],
            expenses: [expense({ amount: 30 })],
        });
        expect(balanceOf(data, "acc_1", FUND_ME_ID)).toBe(120);
        expect(balanceOf(data, "acc_1", undefined)).toBe(120);
    });

    it("tracks each fund inside the same account", () => {
        const data = financeData({
            accounts: [account({ initialBalance: 100 })],
            incomes: [income({ amount: 500, fundId: "fund_inv" })],
            expenses: [expense({ amount: 40, fundId: "fund_inv" })],
        });
        const balances = computeBalances(data);
        expect(balances.get("acc_1")?.get(FUND_ME_ID)).toBe(100);
        expect(balances.get("acc_1")?.get("fund_inv")).toBe(460);
        // Account total still spans every fund
        expect(computeAccountBalance(data, "acc_1")).toBe(560);
    });

    it("a fund transfer moves the owner, not the place", () => {
        const data = financeData({
            accounts: [account({ initialBalance: 1000 })],
            transfers: [
                transfer({
                    fromAccountId: "acc_1",
                    toAccountId: "acc_1",
                    toFundId: FUND_CHARITY_ID,
                    amount: 200,
                }),
            ],
        });
        expect(balanceOf(data, "acc_1", FUND_ME_ID)).toBe(800);
        expect(balanceOf(data, "acc_1", FUND_CHARITY_ID)).toBe(200);
        expect(computeAccountBalance(data, "acc_1")).toBe(1000);
    });

    it("a transfer can change place and owner at once", () => {
        const data = financeData({
            accounts: [
                account({ initialBalance: 300 }),
                account({ id: "acc_2" }),
            ],
            transfers: [
                transfer({ toFundId: "fund_inv", amount: 100 }),
            ],
        });
        expect(balanceOf(data, "acc_1", FUND_ME_ID)).toBe(200);
        expect(balanceOf(data, "acc_2", "fund_inv")).toBe(100);
        expect(balanceOf(data, "acc_2", FUND_ME_ID)).toBe(0);
    });

    it("sums funds across active accounts for focus and fund totals", () => {
        const data = financeData({
            accounts: [
                account({ initialBalance: 100 }),
                account({ id: "acc_2", initialBalance: 50 }),
                account({ id: "acc_3", initialBalance: 999, isActive: false }),
            ],
            incomes: [
                income({ id: "a", amount: 70, fundId: FUND_CHARITY_ID }),
                income({
                    id: "b",
                    accountId: "acc_2",
                    amount: 30,
                    fundId: FUND_CHARITY_ID,
                }),
            ],
        });
        expect(balanceOfFund(data, FUND_ME_ID)).toBe(150);
        expect(balanceOfFund(data, FUND_CHARITY_ID)).toBe(100);
        expect(focusedTotal(data, [FUND_ME_ID])).toBe(150);
        expect(focusedTotal(data, [FUND_ME_ID, FUND_CHARITY_ID])).toBe(250);
        // Empty focus = All funds
        expect(focusedTotal(data, [])).toBe(computeTotalBalance(data));
    });

    it("adds opening balance entries to their account and fund on their date", () => {
        const data = financeData({
            accounts: [account({ initialBalance: 50 })],
            openingBalances: [
                openingEntry({ id: "o1", amount: 1000, date: "2026-10-05" }),
                openingEntry({
                    id: "o2",
                    amount: 200,
                    fundId: FUND_CHARITY_ID,
                    date: "2026-10-20",
                }),
            ],
        });
        expect(balanceOf(data, "acc_1", FUND_ME_ID)).toBe(1050);
        expect(balanceOf(data, "acc_1", FUND_CHARITY_ID)).toBe(200);
        expect(computeAccountBalance(data, "acc_1", "2026-10-04")).toBe(50);
        expect(computeAccountBalance(data, "acc_1", "2026-10-05")).toBe(1050);
        expect(computeAccountBalance(data, "acc_1")).toBe(1250);
    });

    it("respects asOf per fund", () => {
        const data = financeData({
            accounts: [account()],
            incomes: [
                income({ amount: 100, fundId: "fund_inv", actualDate: "2026-10-10" }),
            ],
        });
        expect(balanceOf(data, "acc_1", "fund_inv", "2026-10-09")).toBe(0);
        expect(balanceOf(data, "acc_1", "fund_inv", "2026-10-10")).toBe(100);
    });
});
