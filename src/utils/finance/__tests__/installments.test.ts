import { describe, expect, it } from "vitest";
import {
    findInstallmentMismatches,
    installmentFormToUpdates,
    isLivePaymentExpense,
    summarizeInstallmentPayments,
} from "../installments";
import { expense, financeData, income, installment } from "./fixtures";

describe("installmentFormToUpdates", () => {
    it("never sends payment history, paid totals, status, category or end date", () => {
        const updates = installmentFormToUpdates({
            title: "Phone",
            totalAmount: 1200,
            paidAmount: 999,
            installmentAmount: 100,
            totalInstallments: 12,
            paidInstallments: 9,
            frequency: "monthly",
            startDate: "2026-10-01",
            nextDueDate: "2026-11-01",
            currency: "EGP",
        });
        for (const key of [
            "payments",
            "paidAmount",
            "paidInstallments",
            "status",
            "categoryId",
            "endDate",
        ]) {
            expect(updates).not.toHaveProperty(key);
        }
    });
});

describe("summarizeInstallmentPayments", () => {
    it("re-derives paid totals and reopens a completed installment", () => {
        const inst = installment({ status: "completed", totalInstallments: 2 });
        const summary = summarizeInstallmentPayments(inst, [
            {
                id: "p1",
                installmentId: "inst_1",
                date: "2026-10-01",
                amount: 100,
                status: "paid",
                createdAt: "",
            },
        ]);
        expect(summary).toEqual({
            paidAmount: 100,
            paidInstallments: 1,
            status: "active",
        });
    });
});

describe("findInstallmentMismatches", () => {
    it("flags paidAmount that no linked expense backs", () => {
        const data = financeData({
            installments: [installment({ paidAmount: 300 })],
            expenses: [expense({ amount: 100, linkedInstallmentId: "inst_1" })],
        });
        expect(findInstallmentMismatches(data)).toEqual([
            {
                installmentId: "inst_1",
                title: "Phone",
                paidAmount: 300,
                linkedCash: 100,
            },
        ]);
    });

    it("accepts paidAmount equal to linked expenses minus linked refunds", () => {
        const data = financeData({
            installments: [installment({ paidAmount: 50 })],
            expenses: [expense({ amount: 100, linkedInstallmentId: "inst_1" })],
            incomes: [income({ amount: 50, linkedInstallmentId: "inst_1" })],
        });
        expect(findInstallmentMismatches(data)).toEqual([]);
    });
});

describe("isLivePaymentExpense", () => {
    const withPayment = installment({
        payments: [
            {
                id: "pay_1",
                installmentId: "inst_1",
                date: "2026-10-01",
                amount: 100,
                status: "paid",
                createdAt: "2026-10-01T00:00:00.000Z",
            },
        ],
    });

    it("is true only while the linked payment still exists", () => {
        expect(
            isLivePaymentExpense({ linkedPaymentId: "pay_1" }, [withPayment]),
        ).toBe(true);
        expect(
            isLivePaymentExpense({ linkedPaymentId: "pay_1" }, [installment()]),
        ).toBe(false);
        expect(isLivePaymentExpense({}, [withPayment])).toBe(false);
    });
});
