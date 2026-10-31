import { describe, expect, it } from "vitest";
import {
    DEFAULT_CHARITY_SETTINGS,
    type CharitySettings,
    type FinanceProject,
} from "@/types/modules/finance";
import { FUND_CHARITY_ID, FUND_ME_ID } from "../defaults";
import {
    firstRecordDate,
    forecastFromHistory,
    netWorthSeries,
    projectReport,
} from "../reports";
import {
    account,
    expense,
    financeData,
    income,
    loan,
    loanPayment,
    transfer,
} from "./fixtures";

const project = (over: Partial<FinanceProject> = {}): FinanceProject => ({
    id: "proj_1",
    name: "Website",
    status: "active",
    createdAt: "2026-10-01",
    updatedAt: "2026-10-01",
    ...over,
});

describe("netWorthSeries", () => {
    const data = financeData({
        accounts: [
            account({ id: "acc_1", initialBalance: 1000 }),
            account({ id: "acc_old", initialBalance: 999, isActive: false }),
        ],
        incomes: [
            income({ amount: 500, actualDate: "2026-09-10" }),
            income({ id: "late", amount: 200, actualDate: "2026-11-20" }),
        ],
        expenses: [expense({ amount: 100, date: "2026-10-31" })],
        transfers: [
            transfer({
                fromAccountId: "acc_1",
                toAccountId: "acc_1",
                toFundId: FUND_CHARITY_ID,
                amount: 50,
                date: "2026-10-15",
            }),
        ],
        loans: [
            loan({ id: "borrowed", direction: "borrowed", amount: 300, date: "2026-09-15" }),
            loan({ id: "lent", direction: "lent", amount: 80, date: "2026-10-02" }),
        ],
        loanPayments: [loanPayment({ loanId: "borrowed", amount: 100, date: "2026-10-20" })],
    });

    it("snapshots balances and loans at each month end", () => {
        const series = netWorthSeries(data, "2026-08", "2026-10", {
            today: "2026-12-31",
        });
        expect(series.map((p) => [p.key, p.asOf, p.balance, p.receivable, p.payable, p.netWorth])).toEqual([
            ["2026-08", "2026-08-31", 1000, 0, 0, 1000],
            // +500 income, +300 borrowed (cash and debt cancel out)
            ["2026-09", "2026-09-30", 1800, 0, 300, 1500],
            // −100 expense, −80 lent (now owed to you), −100 repaid (debt too)
            ["2026-10", "2026-10-31", 1520, 80, 200, 1400],
        ]);
    });

    it("labels months with a two-digit year", () => {
        const [point] = netWorthSeries(data, "2026-10", "2026-10", { today: "2026-12-31" });
        expect(point.month).toBe("Oct 26");
    });

    it("follows the focused funds and reads the current month as of today", () => {
        const series = netWorthSeries(data, "2026-10", "2026-11", {
            fundIds: [FUND_ME_ID],
            today: "2026-11-15",
        });
        expect(series.map((p) => [p.asOf, p.netWorth])).toEqual([
            ["2026-10-31", 1350],
            ["2026-11-15", 1350],
        ]);
    });
});

describe("projectReport", () => {
    const data = financeData({
        incomes: [
            income({ id: "a", amount: 1000, projectId: "proj_1" }),
            income({ id: "b", amount: 500, projectId: "proj_1", status: "pending" }),
            income({ id: "c", amount: 200, projectId: "proj_2" }),
            income({ id: "d", amount: 900 }),
        ],
        expenses: [
            expense({ id: "x", amount: 300, projectId: "proj_1" }),
            expense({ id: "y", amount: 450, projectId: "proj_2" }),
            expense({ id: "z", amount: 70 }),
        ],
    });
    const projects = [project(), project({ id: "proj_2", name: "App" }), project({ id: "proj_3" })];

    const charity: CharitySettings = {
        ...DEFAULT_CHARITY_SETTINGS,
        enabled: true,
        startDate: "2026-10-01",
        eligibleIncomeCategoryIds: ["cat_salary"],
        donationCategoryIds: ["cat_donations"],
    };

    it("nets received income against the project's costs", () => {
        const rows = projectReport(data, projects, { charity });
        expect(rows.map((r) => [r.project.id, r.paid, r.costs, r.net])).toEqual([
            ["proj_1", 1000, 300, 700],
            ["proj_3", 0, 0, 0],
            ["proj_2", 200, 450, -250],
        ]);
    });

    it("takes the charity share the way the ledger does: eligible income less work costs", () => {
        const mixed = financeData({
            incomes: [
                income({ id: "eligible", amount: 1000, projectId: "proj_1" }),
                income({ id: "gift", amount: 400, categoryId: "cat_gift", projectId: "proj_1" }),
                income({ id: "refund", amount: 100, tags: ["refund"], projectId: "proj_1" }),
                income({ id: "early", amount: 300, actualDate: "2026-09-20", projectId: "proj_1" }),
                income({ id: "loss", amount: 100, projectId: "proj_2" }),
            ],
            expenses: [
                expense({ id: "work", amount: 300, isWorkCost: true, projectId: "proj_1" }),
                expense({ id: "personal", amount: 50, isWorkCost: false, projectId: "proj_1" }),
                expense({ id: "old", amount: 100, isWorkCost: true, date: "2026-09-25", projectId: "proj_1" }),
                expense({ id: "big", amount: 400, isWorkCost: true, projectId: "proj_2" }),
            ],
        });
        const rows = projectReport(mixed, projects, { charity });
        const byId = new Map(rows.map((r) => [r.project.id, r]));
        expect(byId.get("proj_1")).toMatchObject({
            paid: 1800,
            costs: 450,
            // 20% × (1,000 eligible − 300 work cost since the start)
            charityShare: 140,
        });
        // Work costs beyond eligible income owe nothing
        expect(byId.get("proj_2")?.charityShare).toBe(0);
    });

    it("shows no charity share when charity tracking is off", () => {
        expect(projectReport(data, projects).every((r) => r.charityShare === 0)).toBe(true);
        expect(
            projectReport(data, projects, {
                charity: { ...charity, enabled: false },
            }).every((r) => r.charityShare === 0),
        ).toBe(true);
    });

    it("limits to a date range when given", () => {
        const rows = projectReport(data, projects, {
            range: {
                start: new Date("2026-10-11T00:00:00"),
                end: new Date("2026-10-31T23:59:59"),
            },
        });
        // Incomes land on 10-10 (outside), expenses on 10-11 (inside)
        expect(rows.find((r) => r.project.id === "proj_1")).toMatchObject({
            paid: 0,
            costs: 300,
        });
    });
});

describe("forecastFromHistory", () => {
    const month = (key: string, income: number, expense: number) => ({
        key,
        month: key,
        income,
        expense,
        savings: income - expense,
    });

    it("projects the average of the last complete months, leaving out the current one", () => {
        const series = [
            month("2026-06", 9000, 9000),
            month("2026-07", 1000, 400),
            month("2026-08", 2000, 500),
            month("2026-09", 3000, 600),
            month("2026-10", 10, 5000),
        ];
        const forecast = forecastFromHistory(series, "2026-10");
        expect(forecast.basedOn).toBe(3);
        expect(forecast.avgIncome).toBe(2000);
        expect(forecast.avgExpense).toBe(500);
        expect(forecast.avgMonthly).toBe(1500);
        expect(forecast.months.map((m) => [m.key, m.net])).toEqual([
            ["2026-11", 1500],
            ["2026-12", 1500],
            ["2027-01", 1500],
        ]);
    });

    it("is deterministic and falls back to the current month alone, flagged as partial", () => {
        const series = [month("2026-10", 600, 200)];
        const a = forecastFromHistory(series, "2026-10");
        expect(forecastFromHistory(series, "2026-10")).toEqual(a);
        expect(a.avgMonthly).toBe(400);
        expect(a.partial).toBe(true);
        expect(forecastFromHistory([month("2026-09", 1, 1), ...series], "2026-10").partial).toBe(false);
    });
});

describe("firstRecordDate", () => {
    it("finds the oldest day across incomes, expenses, transfers and loans", () => {
        expect(
            firstRecordDate(
                financeData({
                    incomes: [income({ actualDate: "2026-10-10" })],
                    expenses: [expense({ date: "2026-10-11T08:00:00.000Z" })],
                    transfers: [transfer({ date: "2026-09-30" })],
                    loans: [loan({ date: "2026-09-02" })],
                }),
            ),
        ).toBe("2026-09-02");
        expect(firstRecordDate(financeData())).toBeNull();
    });
});
