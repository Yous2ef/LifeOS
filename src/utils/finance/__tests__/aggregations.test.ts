import { describe, expect, it } from "vitest";
import {
    countedIncomesInRange,
    incomeDisplayDate,
    monthlySeries,
    totalsByCategory,
} from "../aggregations";
import { expense, income } from "./fixtures";

const range = {
    start: new Date("2026-09-01T00:00:00"),
    end: new Date("2026-10-31T23:59:59"),
};

describe("countedIncomesInRange", () => {
    it("counts only received income, dated by when it arrived", () => {
        const rows = [
            income({ id: "a", actualDate: "2026-10-05" }),
            income({ id: "b", status: "pending", actualDate: "2026-10-05" }),
            income({ id: "c", actualDate: "2026-08-30" }),
        ];
        expect(countedIncomesInRange(rows, range).map((i) => i.id)).toEqual(["a"]);
    });
});

describe("incomeDisplayDate", () => {
    it("shows pending income under its expected date, not a stale actual date", () => {
        const pending = income({
            status: "pending",
            actualDate: "2026-10-01",
            expectedDate: "2026-11-05",
        });
        expect(incomeDisplayDate(pending)).toBe("2026-11-05");
    });
});

describe("monthlySeries", () => {
    it("buckets income and expense by month, keeping empty months", () => {
        const series = monthlySeries(
            [income({ amount: 100, actualDate: "2026-10-05" })],
            [expense({ amount: 30, date: "2026-10-06" })],
            range,
        );
        expect(series.map((m) => [m.key, m.income, m.expense, m.savings])).toEqual([
            ["2026-09", 0, 0, 0],
            ["2026-10", 100, 30, 70],
        ]);
    });
});

describe("totalsByCategory", () => {
    it("sums per category with shares of the total, largest first", () => {
        const categories = [{ id: "food" }, { id: "rent" }, { id: "unused" }];
        const totals = totalsByCategory(
            [
                { categoryId: "food", amount: 25 },
                { categoryId: "rent", amount: 75 },
            ],
            categories,
        );
        expect(totals.map((t) => [t.category.id, t.amount, t.percentage])).toEqual([
            ["rent", 75, 75],
            ["food", 25, 25],
            ["unused", 0, 0],
        ]);
    });
});
