import { describe, expect, it } from "vitest";
import { mergeFinanceData } from "../merge";
import { account, expense, income, transfer } from "./fixtures";

describe("mergeFinanceData", () => {
    it("keeps every finance array, including accounts, transfers and income categories", () => {
        const merged = mergeFinanceData(
            { accounts: [account()], transfers: [transfer()] },
            {
                accounts: [account({ id: "acc_2" })],
                incomeCategories: [
                    {
                        id: "ic",
                        name: "Salary",
                        icon: "",
                        color: "",
                        isDefault: true,
                        order: 1,
                        createdAt: "2026-01-01",
                    },
                ],
            },
        );
        expect(merged.accounts?.map((a) => a.id).sort()).toEqual(["acc_1", "acc_2"]);
        expect(merged.transfers).toHaveLength(1);
        expect(merged.incomeCategories).toHaveLength(1);
    });

    it("keeps the newer copy of a row edited on both sides", () => {
        const merged = mergeFinanceData(
            { incomes: [income({ amount: 1, updatedAt: "2026-10-02T00:00:00Z" })] },
            { incomes: [income({ amount: 2, updatedAt: "2026-10-03T00:00:00Z" })] },
        );
        expect(merged.incomes?.[0].amount).toBe(2);
    });

    it("drops a row deleted on one side instead of resurrecting it", () => {
        const merged = mergeFinanceData(
            {
                transfers: [],
                deleted: [{ id: "tr_1", deletedAt: "2026-10-20T00:00:00Z" }],
            },
            { transfers: [transfer()] },
        );
        expect(merged.transfers).toEqual([]);
        expect(merged.deleted).toHaveLength(1);
    });

    it("lets an undo (re-saved after the delete) survive a sync that still has the tombstone", () => {
        const restored = expense({ updatedAt: "2026-10-21T00:00:00Z" });
        const merged = mergeFinanceData(
            { expenses: [restored], deleted: [] },
            {
                expenses: [],
                deleted: [{ id: "exp_1", deletedAt: "2026-10-20T00:00:00Z" }],
            },
        );
        expect(merged.expenses).toEqual([restored]);
    });

    it("takes the side replaced (import/reset) most recently as a whole", () => {
        const imported = {
            incomes: [income({ id: "new" })],
            replacedAt: "2026-10-30T00:00:00Z",
        };
        const merged = mergeFinanceData(imported, {
            incomes: [income({ id: "old" })],
        });
        expect(merged).toBe(imported);
    });

    it("keeps a recurring occurrence generated on two devices once (same deterministic id)", () => {
        const occurrence = income({ id: "tpl_2026-10-01" });
        const merged = mergeFinanceData(
            { incomes: [occurrence] },
            { incomes: [{ ...occurrence }] },
        );
        expect(merged.incomes).toHaveLength(1);
    });

    it("prefers local settings over cloud settings", () => {
        const merged = mergeFinanceData(
            { settings: { defaultCurrency: "EGP" } as never },
            { settings: { defaultCurrency: "USD", monthStartDay: 5 } as never },
        );
        expect(merged.settings).toMatchObject({
            defaultCurrency: "EGP",
            monthStartDay: 5,
        });
    });
});
