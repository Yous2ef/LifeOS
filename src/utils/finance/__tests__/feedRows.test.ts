import { describe, expect, it } from "vitest";
import type { ExpenseCategory } from "@/types/modules/finance";
import { FUND_CHARITY_ID, getDefaultCharitySettings } from "../defaults";
import { buildFeedRows } from "../feedRows";
import {
    account,
    expense,
    financeData,
    income,
    loan,
    loanPayment,
    openingEntry,
    person,
} from "./fixtures";

const tools: ExpenseCategory = {
    id: "cat_tools",
    name: "Tools",
    icon: "🛠️",
    color: "#000",
    isEssential: false,
    isDefault: false,
    isWorkCostDefault: true,
    order: 1,
    createdAt: "2026-10-01T00:00:00.000Z",
};

const charity = { ...getDefaultCharitySettings(), enabled: true };

const rowsOf = (over: Parameters<typeof financeData>[0]) =>
    buildFeedRows(financeData({ accounts: [account()], ...over }), charity);

describe("buildFeedRows", () => {
    it("gives loan and repayment rows their own fund", () => {
        const rows = rowsOf({
            people: [person()],
            loans: [loan({ id: "loan_1", fundId: FUND_CHARITY_ID })],
            loanPayments: [loanPayment({ id: "lp_1", loanId: "loan_1" })],
        });
        expect(rows.find((r) => r.id === "loan_1")?.fundId).toBe(
            FUND_CHARITY_ID,
        );
        expect(rows.find((r) => r.id === "lp_1")?.fundId).toBeUndefined();
    });

    it("marks work costs the way the charity math does", () => {
        const rows = rowsOf({
            categories: [tools],
            expenses: [
                expense({ id: "by_default", categoryId: "cat_tools" }),
                expense({
                    id: "switched_off",
                    categoryId: "cat_tools",
                    isWorkCost: false,
                }),
                expense({
                    id: "from_charity",
                    categoryId: "cat_tools",
                    fundId: FUND_CHARITY_ID,
                }),
            ],
        });
        const workCost = (id: string) =>
            rows.find((r) => r.id === id)?.isWorkCost;
        expect(workCost("by_default")).toBe(true);
        expect(workCost("switched_off")).toBe(false);
        expect(workCost("from_charity")).toBe(false);
    });

    it("dates pending income by its expected date, received by the day it landed", () => {
        const rows = rowsOf({
            incomes: [
                income({
                    id: "pending",
                    status: "pending",
                    actualDate: "2026-10-01",
                    expectedDate: "2026-11-05",
                }),
                income({ id: "received", actualDate: "2026-10-10T09:30:00Z" }),
            ],
        });
        expect(rows.find((r) => r.id === "pending")?.date).toBe("2026-11-05");
        expect(rows.find((r) => r.id === "received")?.date).toBe("2026-10-10");
    });

    it("lists opening balance entries as their own type", () => {
        const rows = rowsOf({
            openingBalances: [
                openingEntry({ fundId: FUND_CHARITY_ID }),
                openingEntry({ id: "ob_2", notes: "Found in a drawer" }),
            ],
        });
        expect(rows.find((r) => r.id === "ob_1")).toMatchObject({
            type: "opening",
            title: "Opening balance",
            category: "Opening balance",
            amount: 1000,
            accountId: "acc_1",
            fundId: FUND_CHARITY_ID,
        });
        expect(rows.find((r) => r.id === "ob_2")?.title).toBe(
            "Found in a drawer",
        );
    });

    it("sorts newest first", () => {
        const rows = rowsOf({
            expenses: [
                expense({ id: "old", date: "2026-10-01" }),
                expense({ id: "new", date: "2026-10-20" }),
            ],
        });
        expect(rows.map((r) => r.id)).toEqual(["new", "old"]);
    });
});
