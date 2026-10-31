import { describe, expect, it } from "vitest";
import {
    computeAccountBalance,
    computeAccountBalances,
    computeTotalBalance,
} from "../balances";
import {
    account,
    expense,
    financeData,
    income,
    installment,
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
