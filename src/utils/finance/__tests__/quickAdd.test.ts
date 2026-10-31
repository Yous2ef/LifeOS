import { afterEach, describe, expect, it, vi } from "vitest";
import { FUND_CHARITY_ID, FUND_ME_ID } from "../defaults";
import {
    pickAccountId,
    pickFundId,
    readQuickAddMemory,
    recentFirst,
    rememberQuickAdd,
} from "../quickAdd";
import { account } from "./fixtures";

const cats = [{ id: "a" }, { id: "b" }, { id: "c" }, { id: "d" }];

describe("recentFirst", () => {
    it("puts the most recently entered categories first", () => {
        const records = [
            { categoryId: "c", createdAt: "2026-10-01T10:00:00Z" },
            { categoryId: "b", createdAt: "2026-10-03T10:00:00Z" },
            { categoryId: "c", createdAt: "2026-10-02T10:00:00Z" },
        ];
        expect(recentFirst(cats, records).map((c) => c.id)).toEqual([
            "b",
            "c",
            "a",
            "d",
        ]);
    });

    it("keeps the given order when nothing was used", () => {
        expect(recentFirst(cats, []).map((c) => c.id)).toEqual([
            "a",
            "b",
            "c",
            "d",
        ]);
    });
});

describe("quick-add memory", () => {
    afterEach(() => {
        localStorage.clear();
        vi.restoreAllMocks();
    });

    it("round-trips the last account and fund per kind", () => {
        rememberQuickAdd("expense", {
            accountId: "acc_2",
            fundId: FUND_CHARITY_ID,
        });
        rememberQuickAdd("income", { accountId: "acc_1", fundId: FUND_ME_ID });
        expect(readQuickAddMemory("expense")).toEqual({
            accountId: "acc_2",
            fundId: FUND_CHARITY_ID,
        });
        // A Charity-fund expense doesn't leak into the next income
        expect(readQuickAddMemory("income")).toEqual({
            accountId: "acc_1",
            fundId: FUND_ME_ID,
        });
        expect(readQuickAddMemory("transfer")).toEqual({});
    });

    it("survives broken or blocked storage", () => {
        localStorage.setItem("lifeos-finance-quick-add", "{not json");
        expect(readQuickAddMemory("expense")).toEqual({});
        vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
            throw new Error("blocked");
        });
        expect(() =>
            rememberQuickAdd("expense", { accountId: "x" }),
        ).not.toThrow();
    });
});

describe("pickAccountId / pickFundId", () => {
    const accounts = [
        account({ id: "acc_1", isDefault: true }),
        account({ id: "acc_2", isDefault: false }),
        account({ id: "acc_old", isDefault: false, isActive: false }),
    ];

    it("uses the remembered account while it's active", () => {
        expect(pickAccountId(accounts, "acc_2")).toBe("acc_2");
        expect(pickAccountId(accounts, "acc_old")).toBe("acc_1");
        expect(pickAccountId(accounts, undefined)).toBe("acc_1");
    });

    it("falls back to Me when the fund is gone", () => {
        const funds = [{ id: FUND_ME_ID }, { id: FUND_CHARITY_ID }] as Parameters<
            typeof pickFundId
        >[0];
        expect(pickFundId(funds, FUND_CHARITY_ID)).toBe(FUND_CHARITY_ID);
        expect(pickFundId(funds, "fund_gone")).toBe(FUND_ME_ID);
    });

    it("never picks the excluded fund (Charity for an income)", () => {
        const funds = [{ id: FUND_ME_ID }, { id: FUND_CHARITY_ID }] as Parameters<
            typeof pickFundId
        >[0];
        expect(pickFundId(funds, FUND_CHARITY_ID, FUND_CHARITY_ID)).toBe(
            FUND_ME_ID,
        );
    });
});
