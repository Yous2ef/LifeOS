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
    describe("charity", () => {
        it("is off by default and enabling it twice creates the fund and categories once", () => {
            const { result } = renderHook(() => useFinance(), { wrapper });
            expect(result.current.charitySettings.enabled).toBe(false);
            expect(result.current.charityLedger).toBeNull();

            act(() => {
                result.current.enableCharity();
                result.current.enableCharity();
            });
            act(() => {
                result.current.enableCharity();
            });

            const { funds, categories, incomeCategories, charitySettings } =
                result.current;
            expect(funds.filter((f) => f.id === "fund_charity")).toHaveLength(1);
            expect(categories.filter((c) => c.name === "Donations")).toHaveLength(1);
            expect(incomeCategories.filter((c) => c.name === "Refund")).toHaveLength(1);
            expect(charitySettings.enabled).toBe(true);
            expect(charitySettings.donationCategoryIds).toHaveLength(1);
            const eligible = incomeCategories
                .filter((c) => charitySettings.eligibleIncomeCategoryIds.includes(c.id))
                .map((c) => c.name)
                .sort();
            expect(eligible).toEqual([
                "Bonus",
                "Business",
                "Commission",
                "Freelance",
                "Investment",
                "Salary",
            ]);
            expect(result.current.focusedFundIds).toEqual(["fund_me"]);
            expect(result.current.charityLedger?.remaining).toBe(0);
        });

        it("locks the charity fund once money moved into it", () => {
            const { result } = renderHook(() => useFinance(), { wrapper });
            const accountId = result.current.accounts[0]?.id ?? "a";
            act(() => {
                result.current.enableCharity();
            });
            expect(
                result.current.updateCharitySettings({ fundId: "fund_other" }).success,
            ).toBe(true);
            act(() => {
                result.current.updateCharitySettings({ fundId: "fund_charity" });
            });
            act(() => {
                result.current.transferBetweenAccounts(
                    accountId,
                    accountId,
                    100,
                    undefined,
                    "2026-11-02",
                    { fromFundId: "fund_me", toFundId: "fund_charity" },
                );
            });
            let outcome = { success: true } as { success: boolean };
            act(() => {
                outcome = result.current.updateCharitySettings({ fundId: "fund_other" });
            });
            expect(outcome.success).toBe(false);
            expect(result.current.charitySettings.fundId).toBe("fund_charity");
        });

        it("keeps a Pay now transfer tied to its income", () => {
            const { result } = renderHook(() => useFinance(), { wrapper });
            const accountId = result.current.accounts[0]?.id ?? "a";
            act(() => {
                result.current.enableCharity();
            });
            act(() => {
                result.current.transferBetweenAccounts(
                    accountId,
                    accountId,
                    100,
                    "Charity",
                    "2026-11-02",
                    {
                        fromFundId: "fund_me",
                        toFundId: "fund_charity",
                        charityIncomeId: "inc_x",
                    },
                );
            });
            expect(result.current.transfers.at(-1)?.charityIncomeId).toBe("inc_x");
        });

        it("won't mark a donation category as a work cost", () => {
            const { result } = renderHook(() => useFinance(), { wrapper });
            act(() => {
                result.current.enableCharity();
            });
            const donationsId = result.current.charitySettings.donationCategoryIds[0];
            act(() => {
                result.current.updateCategory(donationsId, { isWorkCostDefault: true });
            });
            expect(
                result.current.categories.find((c) => c.id === donationsId)
                    ?.isWorkCostDefault,
            ).toBe(false);
        });
    });

    describe("opening balances", () => {
        it("moves the balance without income, blocks account delete, and undo restores it", () => {
            const { result } = renderHook(() => useFinance(), { wrapper });
            let accountId = "";
            act(() => {
                accountId = result.current.addAccount({
                    name: "Wallet",
                    type: "cash",
                    initialBalance: 0,
                    color: "#000",
                    icon: "",
                    currency: "EGP",
                    isDefault: false,
                    isActive: true,
                    order: 9,
                }).id;
            });
            let outcome = { success: false } as { success: boolean };
            act(() => {
                outcome = result.current.addOpeningBalance({
                    accountId,
                    amount: 1500,
                    date: "2026-11-01",
                });
            });
            expect(outcome.success).toBe(true);
            expect(result.current.calculateAccountBalance(accountId)).toBe(1500);
            expect(result.current.incomes).toHaveLength(0);
            expect(result.current.deleteAccount(accountId).success).toBe(false);

            const entry = result.current.openingBalances[0];
            act(() => {
                result.current.deleteOpeningBalance(entry.id);
            });
            expect(result.current.openingBalances).toHaveLength(0);
            expect(result.current.calculateAccountBalance(accountId)).toBe(0);
            expect(
                result.current.exportData().deleted?.some((d) => d.id === entry.id),
            ).toBe(true);

            act(() => {
                result.current.restoreRecord({ kind: "opening", record: entry });
            });
            expect(result.current.openingBalances.map((o) => o.id)).toEqual([
                entry.id,
            ]);
            expect(result.current.calculateAccountBalance(accountId)).toBe(1500);
            expect(
                result.current.exportData().deleted?.some((d) => d.id === entry.id),
            ).toBe(false);
        });

        it("won't undo onto a fund deleted since", () => {
            const { result } = renderHook(() => useFinance(), { wrapper });
            const accountId = result.current.accounts[0]?.id ?? "";
            let fundId = "";
            act(() => {
                fundId = result.current.addFund({
                    name: "Investment",
                    icon: "",
                    color: "",
                }).id;
            });
            act(() => {
                result.current.addOpeningBalance({
                    accountId,
                    fundId,
                    amount: 100,
                    date: "2026-11-01",
                });
            });
            const entry = result.current.openingBalances[0];
            act(() => {
                result.current.deleteOpeningBalance(entry.id);
            });
            act(() => {
                result.current.deleteFund(fundId);
            });
            let outcome = { success: true } as {
                success: boolean;
                error?: string;
            };
            act(() => {
                outcome = result.current.restoreRecord({
                    kind: "opening",
                    record: entry,
                });
            });
            expect(outcome.error).toBe("Couldn't undo — this fund was deleted.");
            expect(result.current.openingBalances).toHaveLength(0);
        });

        it("refuses an amount of 0 or less", () => {
            const { result } = renderHook(() => useFinance(), { wrapper });
            const accountId = result.current.accounts[0]?.id ?? "a";
            let outcome = { success: true } as { success: boolean };
            act(() => {
                outcome = result.current.addOpeningBalance({
                    accountId,
                    amount: 0,
                    date: "2026-11-01",
                });
            });
            expect(outcome.success).toBe(false);
            expect(result.current.openingBalances).toHaveLength(0);
        });
    });

    it("adds extra charity to what is owed, and undo brings a deleted one back", () => {
        const { result } = renderHook(() => useFinance(), { wrapper });
        act(() => {
            result.current.enableCharity();
        });
        act(() => {
            result.current.addCharityPledge({
                amount: 300,
                date: "2026-11-05",
                notes: "Extra",
            });
        });
        expect(result.current.charityLedger?.owed).toBe(300);
        expect(result.current.charityLedger?.remaining).toBe(300);

        let early = { success: true } as { success: boolean; error?: string };
        act(() => {
            early = result.current.addCharityPledge({
                amount: 50,
                date: "2026-10-31",
            });
        });
        expect(early.error).toBe("Before your charity start date");
        expect(result.current.charityPledges).toHaveLength(1);

        const pledge = result.current.charityPledges[0];
        act(() => {
            result.current.deleteCharityPledge(pledge.id);
        });
        expect(result.current.charityLedger?.owed).toBe(0);
        act(() => {
            result.current.restoreRecord({ kind: "charityPledge", record: pledge });
        });
        expect(result.current.charityLedger?.owed).toBe(300);
    });

    it("pins an account and hides a home card", () => {
        const { result } = renderHook(() => useFinance(), { wrapper });
        let accountId = "";
        act(() => {
            accountId = result.current.addAccount({
                name: "Bank",
                type: "bank",
                initialBalance: 0,
                color: "#000",
                icon: "",
                currency: "EGP",
                isDefault: false,
                isActive: true,
                order: 2,
            }).id;
        });
        act(() => {
            result.current.toggleAccountPin(accountId);
            result.current.setHomeCardHidden("goals", true);
            result.current.setHomeCardHidden("budget", true);
        });
        expect(
            result.current.accounts.find((a) => a.id === accountId)?.isPinned,
        ).toBe(true);
        expect(result.current.hiddenHomeCards).toEqual(["goals", "budget"]);
        act(() => {
            result.current.setHomeCardHidden("goals", false);
        });
        expect(result.current.hiddenHomeCards).toEqual(["budget"]);
    });

    it("blocks deleting a project while a transaction uses it", () => {
        const { result } = renderHook(() => useFinance(), { wrapper });
        let projectId = "";
        act(() => {
            projectId = result.current.addProject("Logo job", "Acme").id;
        });
        act(() => {
            result.current.addExpense({
                title: "Tools",
                amount: 10,
                currency: "EGP",
                categoryId: "c",
                type: "variable",
                paymentMethod: "cash",
                accountId: "a",
                date: "2026-11-02",
                isRecurring: false,
                tags: [],
                projectId,
            });
        });
        expect(result.current.deleteProject(projectId).success).toBe(false);
        act(() => {
            result.current.deleteExpense(result.current.expenses[0].id);
        });
        let outcome = { success: false } as { success: boolean };
        act(() => {
            outcome = result.current.deleteProject(projectId);
        });
        expect(outcome.success).toBe(true);
        expect(result.current.projects).toHaveLength(0);
        expect(
            result.current.exportData().deleted?.some((d) => d.id === projectId),
        ).toBe(true);
    });
});
