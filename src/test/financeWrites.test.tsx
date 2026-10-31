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
});
