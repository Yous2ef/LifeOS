import { describe, expect, it } from "vitest";
import {
    accountHasRecords,
    getAccountDeleteError,
    sortAccountsForHome,
} from "../accounts";
import { account, financeData, openingEntry } from "./fixtures";

const ids = (list: { id: string }[]) => list.map((a) => a.id);

describe("sortAccountsForHome", () => {
    const accounts = [
        account({ id: "cash", order: 1 }),
        account({ id: "bank", order: 2 }),
        account({ id: "wallet", order: 3, isPinned: true }),
        account({ id: "card", order: 4 }),
        account({ id: "savings", order: 5, isPinned: true }),
    ];
    const balances: Record<string, number> = {
        cash: 300,
        bank: 5000,
        wallet: 50,
        card: -200,
        savings: 900,
    };

    it("puts pinned accounts first, each group from highest balance to lowest", () => {
        const sorted = sortAccountsForHome(accounts, (id) => balances[id]);
        expect(ids(sorted)).toEqual(["savings", "wallet", "bank", "cash", "card"]);
    });

    it("sorts by the balance it's given (e.g. the focused funds' part)", () => {
        const focused: Record<string, number> = { ...balances, cash: 9000 };
        const sorted = sortAccountsForHome(accounts, (id) => focused[id]);
        expect(ids(sorted).slice(2)).toEqual(["cash", "bank", "card"]);
    });

    it("keeps the user's order for equal balances and leaves the input alone", () => {
        const sorted = sortAccountsForHome(accounts, () => 0);
        expect(ids(sorted)).toEqual(["wallet", "savings", "cash", "bank", "card"]);
        expect(ids(accounts)[0]).toBe("cash");
    });
});

describe("accountHasRecords", () => {
    it("counts opening balance entries", () => {
        const data = financeData({ accounts: [account()] });
        expect(accountHasRecords(data, "acc_1")).toBe(false);
        expect(
            accountHasRecords(
                financeData({
                    accounts: [account()],
                    openingBalances: [openingEntry()],
                }),
                "acc_1",
            ),
        ).toBe(true);
    });
});

describe("getAccountDeleteError", () => {
    it("blocks while records exist and for the last active account", () => {
        const two = [account(), account({ id: "acc_2" })];
        expect(getAccountDeleteError(financeData({ accounts: two }), "acc_1")).toBeNull();
        expect(
            getAccountDeleteError(
                financeData({ accounts: two, openingBalances: [openingEntry()] }),
                "acc_1",
            ),
        ).toMatch(/existing transactions/);
        expect(
            getAccountDeleteError(financeData({ accounts: [account()] }), "acc_1"),
        ).toMatch(/last active account/);
    });
});
