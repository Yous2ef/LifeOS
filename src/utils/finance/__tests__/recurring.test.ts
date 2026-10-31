import { describe, expect, it } from "vitest";
import { applyRecurringExpenses, applyRecurringIncomes } from "../recurring";
import { expense, income } from "./fixtures";

const today = new Date("2026-10-31T12:00:00Z");

describe("applyRecurringIncomes", () => {
    const template = income({
        id: "tpl",
        isRecurring: true,
        frequency: "monthly",
        actualDate: "2026-08-15",
    });

    it("creates each due occurrence with a deterministic id and advances nextOccurrence", () => {
        const result = applyRecurringIncomes([template], today)!;
        const ids = result.filter((i) => i.id !== "tpl").map((i) => i.id);
        expect(ids).toEqual(["tpl_2026-09-15", "tpl_2026-10-15"]);
        expect(result.find((i) => i.id === "tpl")?.nextOccurrence).toBe("2026-11-15");
        const occurrence = result.find((i) => i.id === "tpl_2026-09-15")!;
        expect(occurrence).toMatchObject({
            status: "received",
            actualDate: "2026-09-15",
            isRecurring: false,
        });
    });

    it("is idempotent — running again on its own output changes nothing", () => {
        const once = applyRecurringIncomes([template], today)!;
        expect(applyRecurringIncomes(once, today)).toBeNull();
    });

    it("doesn't duplicate an occurrence generated earlier with a random id", () => {
        const legacy = income({ id: "random", actualDate: "2026-09-15" });
        const result = applyRecurringIncomes([template, legacy], today)!;
        expect(result.filter((i) => i.actualDate === "2026-09-15")).toHaveLength(1);
    });
});

describe("applyRecurringExpenses", () => {
    it("creates due occurrences with deterministic ids", () => {
        const template = expense({
            id: "rent",
            isRecurring: true,
            recurringFrequency: "monthly",
            date: "2026-09-01",
        });
        const result = applyRecurringExpenses([template], today)!;
        expect(result.map((e) => e.id)).toEqual(["rent", "rent_2026-10-01"]);
    });
});
