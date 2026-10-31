import { describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";

vi.mock("@/context/StorageContext", () => ({
    useStorageContext: () => ({
        subscribeToKey: () => () => {},
        saveData: () => {},
    }),
    STORAGE_KEYS: { MAIN_DATA: "lifeos_data_v2" },
}));

import { AppProvider } from "@/context/AppContext";
import { useFinance } from "@/hooks/useFinance";

const wrapper = ({ children }: { children: ReactNode }) => (
    <AppProvider>{children}</AppProvider>
);

describe("finance writes", () => {
    it("keeps both of two writes made in the same tick", () => {
        const { result } = renderHook(() => useFinance(), { wrapper });
        const base = {
            currency: "EGP" as const,
            categoryId: "c",
            type: "variable" as const,
            status: "received" as const,
            frequency: "one-time" as const,
            accountId: "a",
            isRecurring: false,
            tags: [],
        };

        act(() => {
            result.current.addIncome({ ...base, title: "one", amount: 1 });
            result.current.addIncome({ ...base, title: "two", amount: 2 });
        });

        const titles = result.current.incomes.map((i) => i.title);
        expect(titles).toContain("one");
        expect(titles).toContain("two");
    });

    it("import replaces the module instead of merging with current data", () => {
        const { result } = renderHook(() => useFinance(), { wrapper });
        act(() => {
            result.current.addCategory({
                name: "Local only",
                icon: "",
                color: "",
                isEssential: false,
                isDefault: false,
                order: 99,
            });
        });

        const backup = result.current.exportData();
        act(() => {
            result.current.importData({
                ...backup,
                categories: [],
                incomes: [],
                expenses: [],
            });
        });

        expect(
            result.current.categories.some((c) => c.name === "Local only"),
        ).toBe(false);
    });

    it("deletes a fund only while nothing uses it, leaving a tombstone", () => {
        const { result } = renderHook(() => useFinance(), { wrapper });
        let fundId = "";
        act(() => {
            fundId = result.current.addFund({
                name: "Investment",
                icon: "",
                color: "",
            }).id;
            result.current.addIncome({
                title: "Dividend",
                amount: 50,
                currency: "EGP",
                categoryId: "c",
                type: "variable",
                status: "received",
                frequency: "one-time",
                accountId: "a",
                fundId,
                isRecurring: false,
                tags: [],
            });
        });

        let outcome = { success: true } as { success: boolean };
        act(() => {
            outcome = result.current.deleteFund(fundId);
        });
        expect(outcome.success).toBe(false);
        expect(result.current.deleteFund("fund_me").success).toBe(false);

        act(() => {
            result.current.deleteIncome(result.current.incomes[0].id);
        });
        act(() => {
            outcome = result.current.deleteFund(fundId);
        });
        expect(outcome.success).toBe(true);
        expect(result.current.funds.some((f) => f.id === fundId)).toBe(false);
        expect(
            result.current.exportData().deleted?.some((d) => d.id === fundId),
        ).toBe(true);
    });

    describe("loans", () => {
        const newLoan = (personId: string, amount = 500) => ({
            personId,
            direction: "borrowed" as const,
            amount,
            accountId: "a",
            date: "2026-10-05",
        });
        const repay = (loanId: string, amount: number) => ({
            loanId,
            amount,
            accountId: "a",
            date: "2026-10-20",
        });

        it("deleting a loan removes its repayments and tombstones all of them", () => {
            const { result } = renderHook(() => useFinance(), { wrapper });
            let loanId = "";
            act(() => {
                const person = result.current.addPerson("Abdo");
                loanId = result.current.addLoan(newLoan(person.id)).id;
            });
            act(() => {
                result.current.addLoanPayment(repay(loanId, 100));
            });
            act(() => {
                result.current.addLoanPayment(repay(loanId, 150));
            });
            const paymentIds = result.current.loanPayments.map((p) => p.id);
            expect(paymentIds).toHaveLength(2);

            act(() => {
                result.current.deleteLoan(loanId);
            });

            expect(result.current.loans).toHaveLength(0);
            expect(result.current.loanPayments).toHaveLength(0);
            const tombstones = (result.current.exportData().deleted ?? []).map(
                (d) => d.id,
            );
            expect(tombstones).toEqual(
                expect.arrayContaining([loanId, ...paymentIds]),
            );
        });

        it("undo puts a deleted loan back with its repayments", () => {
            const { result } = renderHook(() => useFinance(), { wrapper });
            let loanId = "";
            act(() => {
                const person = result.current.addPerson("Abdo");
                loanId = result.current.addLoan(newLoan(person.id)).id;
            });
            act(() => {
                result.current.addLoanPayment(repay(loanId, 100));
            });
            const record = result.current.loans[0];
            const payments = result.current.loanPayments;

            act(() => {
                result.current.deleteLoan(loanId);
            });
            act(() => {
                result.current.restoreRecord({ kind: "loan", record, payments });
            });

            expect(result.current.loans.map((l) => l.id)).toEqual([loanId]);
            expect(result.current.loanPayments).toHaveLength(1);
            expect(result.current.exportData().deleted ?? []).toHaveLength(0);
        });

        it("blocks overpaying, even when two repayments land in the same tick", () => {
            const { result } = renderHook(() => useFinance(), { wrapper });
            let loanId = "";
            act(() => {
                const person = result.current.addPerson("Abdo");
                loanId = result.current.addLoan(newLoan(person.id)).id;
            });

            let tooMuch = { success: true } as { success: boolean };
            act(() => {
                tooMuch = result.current.addLoanPayment(repay(loanId, 501));
            });
            expect(tooMuch.success).toBe(false);

            act(() => {
                result.current.addLoanPayment(repay(loanId, 300));
                result.current.addLoanPayment(repay(loanId, 300));
            });
            expect(result.current.loanPayments).toHaveLength(1);
        });

        it("refuses undo that would overpay a loan or orphan a loan", () => {
            const { result } = renderHook(() => useFinance(), { wrapper });
            let loanId = "";
            let personId = "";
            act(() => {
                personId = result.current.addPerson("Abdo").id;
                loanId = result.current.addLoan(newLoan(personId)).id;
            });
            act(() => {
                result.current.addLoanPayment(repay(loanId, 300));
            });
            const payment = result.current.loanPayments[0];
            act(() => {
                result.current.deleteLoanPayment(payment.id);
            });
            // The toast's Undo keeps the function from the render it was made in
            const undoFromToast = result.current.restoreRecord;
            act(() => {
                result.current.addLoanPayment(repay(loanId, 500));
            });

            let outcome = { success: true } as {
                success: boolean;
                error?: string;
            };
            act(() => {
                outcome = undoFromToast({
                    kind: "loanPayment",
                    record: payment,
                });
            });
            expect(outcome.error).toMatch(/already repaid/);
            expect(outcome.success).toBe(false);
            expect(result.current.loanPayments).toHaveLength(1);

            const record = result.current.loans[0];
            const payments = result.current.loanPayments;
            act(() => {
                result.current.deleteLoan(loanId);
            });
            act(() => {
                result.current.deletePerson(personId);
            });
            act(() => {
                outcome = result.current.restoreRecord({
                    kind: "loan",
                    record,
                    payments,
                });
            });
            expect(outcome.success).toBe(false);
            expect(result.current.loans).toHaveLength(0);
        });

        it("won't move a loan's date after its first repayment", () => {
            const { result } = renderHook(() => useFinance(), { wrapper });
            let loanId = "";
            act(() => {
                const person = result.current.addPerson("Abdo");
                loanId = result.current.addLoan(newLoan(person.id)).id;
            });
            act(() => {
                result.current.addLoanPayment(repay(loanId, 100));
            });
            let outcome = { success: true } as { success: boolean };
            act(() => {
                outcome = result.current.updateLoan(loanId, {
                    date: "2026-10-21",
                });
            });
            expect(outcome.success).toBe(false);
            act(() => {
                outcome = result.current.updateLoan(loanId, {
                    date: "2026-10-20",
                });
            });
            expect(outcome.success).toBe(true);
        });

        it("settling a person's whole net closes both sides and moves the account by the cash only", () => {
            const { result } = renderHook(() => useFinance(), { wrapper });
            const accountId = result.current.accounts[0].id;
            const before = result.current.calculateAccountBalance(accountId);
            let personId = "";
            act(() => {
                personId = result.current.addPerson("Abdo").id;
                result.current.addLoan({
                    ...newLoan(personId, 1000),
                    direction: "lent",
                    accountId,
                });
                result.current.addLoan({ ...newLoan(personId, 400), accountId });
            });
            act(() => {
                result.current.settleUp({
                    target: { personId },
                    amount: 600,
                    accountId,
                    date: "2026-10-25",
                });
            });
            expect(result.current.calculateAccountBalance(accountId)).toBe(
                before - 1000 + 400 + 600,
            );
            expect(
                result.current.loanPayments.filter((p) => p.isOffset),
            ).toHaveLength(2);
            const totals = result.current.loanTotals;
            expect([totals.receivable, totals.payable]).toEqual([0, 0]);
        });

        it("keeps a repaid loan's direction when edited", () => {
            const { result } = renderHook(() => useFinance(), { wrapper });
            let loanId = "";
            act(() => {
                const person = result.current.addPerson("Abdo");
                loanId = result.current.addLoan(newLoan(person.id)).id;
            });
            act(() => {
                result.current.addLoanPayment(repay(loanId, 100));
            });
            act(() => {
                result.current.updateLoan(loanId, {
                    direction: "lent",
                    notes: "edited",
                });
            });
            expect(result.current.loans[0]).toMatchObject({
                direction: "borrowed",
                notes: "edited",
            });
        });

        it("settles a person's loans oldest first and keeps them out of income and expense", () => {
            const { result } = renderHook(() => useFinance(), { wrapper });
            let personId = "";
            act(() => {
                personId = result.current.addPerson("Abdo").id;
                result.current.addLoan({ ...newLoan(personId, 300), date: "2026-09-01" });
                result.current.addLoan(newLoan(personId, 310));
            });

            let outcome = { success: false } as { success: boolean };
            act(() => {
                outcome = result.current.settleUp({
                    target: { personId },
                    amount: 400,
                    accountId: "a",
                    date: "2026-10-25",
                });
            });
            expect(outcome.success).toBe(true);
            expect(result.current.loanPayments.map((p) => p.amount)).toEqual([
                300, 100,
            ]);
            expect(result.current.incomes).toHaveLength(0);
            expect(result.current.expenses).toHaveLength(0);

            expect(result.current.deletePerson(personId).success).toBe(false);
        });
    });
});
