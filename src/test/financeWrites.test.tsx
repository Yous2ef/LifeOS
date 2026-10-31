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
});
