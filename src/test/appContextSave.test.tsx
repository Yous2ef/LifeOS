import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";

// A storage context that behaves like the real one: saveData notifies every
// subscriber synchronously with the data that was just saved.
const subscribers = new Set<(data: unknown) => void>();
const saves: unknown[] = [];
vi.mock("@/context/StorageContext", () => ({
    useStorageContext: () => ({
        subscribeToKey: (_key: string, cb: (data: unknown) => void) => {
            subscribers.add(cb);
            return () => subscribers.delete(cb);
        },
        saveData: (data: unknown) => {
            saves.push(data);
            subscribers.forEach((cb) => cb(data));
        },
    }),
    STORAGE_KEYS: { MAIN_DATA: "lifeos_data_v2" },
}));

import * as storage from "@/utils/storage";
import { AppProvider, useApp } from "@/context/AppContext";

const wrapper = ({ children }: { children: ReactNode }) => (
    <AppProvider>{children}</AppProvider>
);

const clearExpenses = (update: ReturnType<typeof useApp>["updateModule"]) =>
    update("finance", (prev) => ({ ...prev, expenses: [] }));

describe("AppContext save", () => {
    beforeEach(() => {
        vi.useFakeTimers();
        saves.length = 0;
    });
    afterEach(() => vi.useRealTimers());

    it("doesn't reload all data when its own save echoes back", () => {
        const { result } = renderHook(() => useApp(), { wrapper });
        const loadSpy = vi.spyOn(storage, "loadData");

        act(() => clearExpenses(result.current.updateModule));
        act(() => vi.runAllTimers());

        expect(saves).toHaveLength(1);
        expect(loadSpy).not.toHaveBeenCalled();
        loadSpy.mockRestore();
    });

    it("waits before writing and collapses quick edits into one write", () => {
        const { result } = renderHook(() => useApp(), { wrapper });

        act(() => clearExpenses(result.current.updateModule));
        act(() => clearExpenses(result.current.updateModule));
        expect(saves).toHaveLength(0);

        act(() => vi.runAllTimers());
        expect(saves).toHaveLength(1);
    });

    it("writes a waiting save straight away when the page is hidden", () => {
        const { result } = renderHook(() => useApp(), { wrapper });

        act(() => clearExpenses(result.current.updateModule));
        act(() => {
            window.dispatchEvent(new Event("pagehide"));
        });

        expect(saves).toHaveLength(1);
    });

    it("still applies data saved by someone else (cloud sync, migration)", () => {
        const { result } = renderHook(() => useApp(), { wrapper });
        const external = {
            ...result.current.data,
            settings: { ...result.current.data.settings, userName: "Synced" },
        };

        act(() => subscribers.forEach((cb) => cb(external)));

        expect(result.current.data.settings.userName).toBe("Synced");
    });
});
