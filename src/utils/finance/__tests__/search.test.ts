import { describe, expect, it } from "vitest";
import type { ExpenseCategory, IncomeCategory } from "@/types/modules/finance";
import { FUND_CHARITY_ID, FUND_ME_ID, getDefaultCharitySettings } from "../defaults";
import { buildFeedRows } from "../feedRows";
import {
    EMPTY_FILTERS,
    countActiveFilters,
    filterTransactions,
    normalizeSearchText,
    searchTotals,
    touchesAccount,
    type SearchFilters,
    type SearchNames,
} from "../search";
import {
    account,
    expense,
    financeData,
    income,
    loan,
    loanPayment,
    person,
    transfer,
} from "./fixtures";

const STAMP = "2026-10-01T00:00:00.000Z";

const expenseCategory = (
    over: Partial<ExpenseCategory> = {},
): ExpenseCategory => ({
    id: "cat_food",
    name: "Food",
    icon: "🍔",
    color: "#f00",
    isEssential: true,
    isDefault: false,
    order: 1,
    createdAt: STAMP,
    ...over,
});

const incomeCategory: IncomeCategory = {
    id: "cat_salary",
    name: "Salary",
    icon: "💰",
    color: "#0f0",
    isDefault: false,
    order: 1,
    createdAt: STAMP,
};

const project = {
    id: "proj_1",
    name: "Acme site",
    status: "active" as const,
    createdAt: STAMP,
    updatedAt: STAMP,
};

const data = financeData({
    accounts: [account(), account({ id: "acc_2", name: "Bank" })],
    categories: [
        expenseCategory(),
        expenseCategory({
            id: "cat_tools",
            name: "Tools",
            isWorkCostDefault: true,
        }),
    ],
    incomeCategories: [incomeCategory],
    projects: [project],
    people: [person()],
    incomes: [
        income({
            id: "inc_1",
            title: "October pay",
            amount: 1000,
            actualDate: "2026-10-10",
            projectId: "proj_1",
        }),
    ],
    expenses: [
        expense({ id: "exp_food", title: "Lunch", amount: 30 }),
        expense({
            id: "exp_tools",
            title: "Keyboard",
            amount: 400,
            categoryId: "cat_tools",
            accountId: "acc_2",
            fundId: FUND_CHARITY_ID,
            date: "2026-10-15",
            notes: "for client work",
            projectId: "proj_1",
        }),
        expense({
            id: "exp_cable",
            title: "Cable",
            amount: 50,
            categoryId: "cat_tools",
            date: "2026-10-16",
        }),
    ],
    transfers: [
        transfer({
            id: "tr_1",
            fromAccountId: "acc_1",
            toAccountId: "acc_2",
            toFundId: FUND_CHARITY_ID,
            amount: 200,
        }),
    ],
    loans: [loan({ id: "loan_1", amount: 500, accountId: "acc_2" })],
    loanPayments: [
        loanPayment({ id: "lp_1", loanId: "loan_1", amount: 100 }),
    ],
});

const charity = { ...getDefaultCharitySettings(), enabled: true };
const rows = buildFeedRows(data, charity);
const names: SearchNames = { people: data.people, projects: data.projects };

const search = (filters: Partial<SearchFilters>) =>
    filterTransactions(rows, { ...EMPTY_FILTERS, ...filters }, names)
        .map((t) => t.id)
        .sort();

describe("filterTransactions", () => {
    it("returns everything with no filters", () => {
        expect(search({})).toHaveLength(7);
    });

    it("filters by type", () => {
        expect(search({ types: ["loan"] })).toEqual(["loan_1", "lp_1"]);
        expect(search({ types: ["income", "transfer"] })).toEqual([
            "inc_1",
            "tr_1",
        ]);
    });

    it("matches a transfer on either account", () => {
        expect(search({ types: ["transfer"], accountId: "acc_1" })).toEqual([
            "tr_1",
        ]);
        expect(search({ types: ["transfer"], accountId: "acc_2" })).toEqual([
            "tr_1",
        ]);
        expect(touchesAccount(rows.find((t) => t.id === "tr_1")!, "acc_2")).toBe(
            true,
        );
    });

    it("matches loans on their own account", () => {
        expect(search({ types: ["loan"], accountId: "acc_2" })).toEqual([
            "loan_1",
        ]);
        expect(search({ types: ["loan"], accountId: "acc_1" })).toEqual([
            "lp_1",
        ]);
    });

    it("filters by fund, missing fund being Me", () => {
        expect(search({ fundId: FUND_CHARITY_ID })).toEqual([
            "exp_tools",
            "tr_1",
        ]);
        expect(search({ fundId: FUND_ME_ID })).toContain("loan_1");
    });

    it("needs account and fund on the same side of a transfer", () => {
        // acc_1/Me → acc_2/Charity: neither side is acc_1 + Charity
        expect(
            search({
                types: ["transfer"],
                accountId: "acc_1",
                fundId: FUND_CHARITY_ID,
            }),
        ).toEqual([]);
        expect(
            search({
                types: ["transfer"],
                accountId: "acc_2",
                fundId: FUND_CHARITY_ID,
            }),
        ).toEqual(["tr_1"]);
    });

    it("filters by category and project", () => {
        expect(search({ categoryId: "cat_tools" })).toEqual([
            "exp_cable",
            "exp_tools",
        ]);
        expect(search({ projectId: "proj_1" })).toEqual(["exp_tools", "inc_1"]);
    });

    it("filters by amount range, inclusive", () => {
        expect(search({ minAmount: 100, maxAmount: 400 })).toEqual([
            "exp_tools",
            "lp_1",
            "tr_1",
        ]);
        expect(search({ maxAmount: 30 })).toEqual(["exp_food"]);
    });

    it("filters by date range, inclusive", () => {
        expect(search({ from: "2026-10-15", to: "2026-10-16" })).toEqual([
            "exp_cable",
            "exp_tools",
        ]);
        expect(search({ to: "2026-10-05" })).toEqual(["loan_1"]);
    });

    it("keeps work costs only, as the charity math sees them", () => {
        // Spent from the Charity fund: never a work cost
        expect(search({ workCostOnly: true })).toEqual(["exp_cable"]);
    });

    it("searches title, notes, category, person and project", () => {
        expect(search({ text: "lunch" })).toEqual(["exp_food"]);
        expect(search({ text: "CLIENT" })).toEqual(["exp_tools"]);
        expect(search({ text: "tools" })).toEqual(["exp_cable", "exp_tools"]);
        expect(search({ text: "abdo" })).toEqual(["loan_1", "lp_1"]);
        expect(search({ text: "acme" })).toEqual(["exp_tools", "inc_1"]);
    });

    it("needs every word to match", () => {
        expect(search({ text: "acme keyboard" })).toEqual(["exp_tools"]);
        expect(search({ text: "acme lunch" })).toEqual([]);
    });

    it("folds Arabic spelling variants", () => {
        expect(normalizeSearchText("أحمد")).toBe(normalizeSearchText("احمد"));
        expect(normalizeSearchText("إيجار آخر")).toBe("ايجار اخر");
        expect(normalizeSearchText("مدرسة مستشفى")).toBe("مدرسه مستشفي");
        // Tashkeel and tatweel disappear
        expect(normalizeSearchText("مُحَمّـد")).toBe("محمد");

        const arabic = buildFeedRows(
            financeData({
                accounts: [account()],
                people: [person({ id: "p_ahmed", name: "أحمد" })],
                loans: [loan({ id: "loan_a", personId: "p_ahmed" })],
                expenses: [expense({ id: "exp_a", title: "فاتورة الكهرباء" })],
            }),
            charity,
        );
        const find = (text: string) =>
            filterTransactions(
                arabic,
                { ...EMPTY_FILTERS, text },
                {
                    people: [{ id: "p_ahmed", name: "أحمد" }],
                    projects: [],
                },
            ).map((t) => t.id);
        expect(find("احمد")).toEqual(["loan_a"]);
        expect(find("فاتوره")).toEqual(["exp_a"]);
    });
});

describe("searchTotals", () => {
    it("keeps loans and transfers out of income, expense and net", () => {
        const totals = searchTotals(rows);
        expect(totals.count).toBe(7);
        expect(totals.income).toBe(1000);
        expect(totals.expense).toBe(480);
        expect(totals.net).toBe(520);
        expect(totals.transferCount).toBe(1);
        expect(totals.transferAmount).toBe(200);
        expect(totals.loanCount).toBe(2);
        // Borrowed 500 came in; repaying 100 went out
        expect(totals.loanIn).toBe(500);
        expect(totals.loanOut).toBe(100);
    });

    it("splits transfers into in and out for one account", () => {
        expect(searchTotals(rows, "acc_2")).toMatchObject({
            transferIn: 200,
            transferOut: 0,
        });
        expect(searchTotals(rows, "acc_1")).toMatchObject({
            transferIn: 0,
            transferOut: 200,
        });
        // A fund transfer inside one account moves nothing in or out of it
        const fundMove = buildFeedRows(
            financeData({
                accounts: [account()],
                transfers: [
                    transfer({
                        fromAccountId: "acc_1",
                        toAccountId: "acc_1",
                        toFundId: FUND_CHARITY_ID,
                    }),
                ],
            }),
            charity,
        );
        expect(searchTotals(fundMove, "acc_1")).toMatchObject({
            transferCount: 1,
            transferIn: 0,
            transferOut: 0,
        });
    });
});

describe("countActiveFilters", () => {
    it("ignores text and dates", () => {
        expect(
            countActiveFilters({
                ...EMPTY_FILTERS,
                text: "x",
                from: "2026-01-01",
            }),
        ).toBe(0);
        expect(
            countActiveFilters({
                ...EMPTY_FILTERS,
                types: ["loan"],
                minAmount: 5,
                maxAmount: 10,
                workCostOnly: true,
            }),
        ).toBe(3);
    });
});
