import { describe, expect, it } from "vitest";
import {
    countedIncomesInRange,
    incomeDisplayDate,
    monthlySeries,
    NO_PROJECT_KEY,
    topByTitle,
    totalsByCategory,
    totalsByProject,
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

describe("totalsByProject", () => {
    it("groups by project with untagged rows under one key", () => {
        const totals = totalsByProject([
            { projectId: "p1", amount: 30 },
            { amount: 50 },
            { projectId: "p1", amount: 20 },
        ]);
        expect(totals.map((t) => [t.key, t.amount, t.count, t.percentage])).toEqual([
            ["p1", 50, 2, 50],
            [NO_PROJECT_KEY, 50, 1, 50],
        ]);
    });
});

describe("topByTitle", () => {
    it("merges titles that differ only in case or spacing, keeping the first spelling", () => {
        const top = topByTitle(
            [
                { title: "Upwork", amount: 100 },
                { title: " upwork  ", amount: 50 },
                { title: "Client A", amount: 120 },
                { title: "Tip", amount: 5 },
            ],
            2,
        );
        expect(top.map((t) => [t.title, t.amount, t.count])).toEqual([
            ["Upwork", 150, 2],
            ["Client A", 120, 1],
        ]);
    });
});

describe("monthlySeries month steps", () => {
    it("keeps every month when the range starts late in a month, February included", () => {
        const series = monthlySeries([], [], {
            start: new Date("2026-01-30T00:00:00"),
            end: new Date("2026-04-02T23:59:59"),
        });
        expect(series.map((m) => m.key)).toEqual([
            "2026-01",
            "2026-02",
            "2026-03",
            "2026-04",
        ]);
    });

    it("keeps February after a start on the 31st", () => {
        const series = monthlySeries([], [], {
            start: new Date("2025-12-31T00:00:00"),
            end: new Date("2026-02-28T23:59:59"),
        });
        expect(series.map((m) => m.key)).toEqual(["2025-12", "2026-01", "2026-02"]);
    });
});
