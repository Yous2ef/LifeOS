import { describe, expect, it } from "vitest";
import { focusedTotal } from "../balances";
import { FUND_CHARITY_ID, FUND_ME_ID } from "../defaults";
import {
    computeMonthlyStatement,
    dayBefore,
    previousMonth,
    statementMonthOf,
    statementPeriod,
    type MonthlyStatement,
} from "../statements";
import {
    account,
    expense,
    financeData,
    income,
    loan,
    loanPayment,
    openingEntry,
    transfer,
} from "./fixtures";

const OCT = { start: "2026-10-01", end: "2026-10-31" };

const reconciles = (statement: MonthlyStatement) => {
    expect(statement.difference).toBe(0);
    expect(
        statement.opening +
            statement.income.total -
            statement.expense.total +
            statement.loans.net +
            statement.transfers.net +
            statement.openingEntries.total,
    ).toBeCloseTo(statement.closing, 6);
};

// Two places (Cash, Bank), two owners (Me, Charity), money moving every way
const busyMonth = () =>
    financeData({
        accounts: [
            account({ id: "acc_1", initialBalance: 1000 }),
            account({ id: "acc_2", name: "Bank", initialBalance: 500 }),
        ],
        incomeCategories: [
            {
                id: "cat_salary",
                name: "Salary",
                icon: "💼",
                color: "#0f0",
                isDefault: true,
                order: 1,
                createdAt: "2026-01-01",
            },
        ],
        incomes: [
            // Before the month: part of the opening balance
            income({ id: "sep", amount: 300, actualDate: "2026-09-20" }),
            income({ id: "salary", amount: 2000, actualDate: "2026-10-01" }),
            income({
                id: "gift",
                amount: 150,
                categoryId: "cat_gift",
                accountId: "acc_2",
                actualDate: "2026-10-15",
            }),
            income({
                id: "charity_in",
                amount: 400,
                fundId: FUND_CHARITY_ID,
                actualDate: "2026-10-16",
            }),
            // Pending never counts, even with a stale actual date
            income({ id: "pending", status: "pending", amount: 999, actualDate: "2026-10-10" }),
            // After the month
            income({ id: "nov", amount: 700, actualDate: "2026-11-01" }),
        ],
        expenses: [
            expense({ id: "food", amount: 120, date: "2026-10-03" }),
            expense({ id: "rent", amount: 800, categoryId: "cat_rent", accountId: "acc_2", date: "2026-10-31" }),
            expense({ id: "food2", amount: 30, date: "2026-10-20" }),
            expense({ id: "donation", amount: 50, fundId: FUND_CHARITY_ID, date: "2026-10-22" }),
        ],
        transfers: [
            // Place change, Me → Me
            transfer({ id: "t_place", amount: 200, date: "2026-10-05" }),
            // Owner change in the same place, Me → Charity
            transfer({
                id: "t_fund",
                fromAccountId: "acc_1",
                toAccountId: "acc_1",
                toFundId: FUND_CHARITY_ID,
                amount: 300,
                date: "2026-10-06",
            }),
            // Charity → Me, other place
            transfer({
                id: "t_back",
                fromAccountId: "acc_1",
                toAccountId: "acc_2",
                fromFundId: FUND_CHARITY_ID,
                amount: 40,
                date: "2026-10-25",
            }),
        ],
        loans: [
            loan({ id: "borrowed", direction: "borrowed", amount: 500, date: "2026-10-08" }),
            loan({ id: "lent", direction: "lent", amount: 250, accountId: "acc_2", date: "2026-10-09" }),
            loan({ id: "old", direction: "lent", amount: 100, date: "2026-09-01" }),
        ],
        loanPayments: [
            loanPayment({ id: "p1", loanId: "borrowed", amount: 100, date: "2026-10-28" }),
            loanPayment({ id: "p2", loanId: "lent", amount: 50, accountId: "acc_2", date: "2026-10-29" }),
            loanPayment({ id: "p3", loanId: "old", amount: 60, date: "2026-10-12" }),
            // Offsets move no money; repayments of a deleted loan neither
            loanPayment({ id: "p4", loanId: "lent", amount: 25, isOffset: true, date: "2026-10-29" }),
            loanPayment({ id: "p5", loanId: "gone", amount: 70, date: "2026-10-29" }),
        ],
    });

describe("computeMonthlyStatement", () => {
    it("reconciles opening + income − expense ± loans ± transfers with closing, all funds", () => {
        const data = busyMonth();
        const statement = computeMonthlyStatement(data, OCT, { fundIds: [] });

        expect(statement.opening).toBe(1000 + 500 + 300 - 100);
        expect(statement.income.total).toBe(2000 + 150 + 400);
        expect(statement.expense.total).toBe(120 + 800 + 30 + 50);
        expect(statement.net).toBe(2550 - 1000);
        expect(statement.loans).toEqual({
            borrowed: 500,
            lent: 250,
            repaidToYou: 50 + 60,
            youRepaid: 100,
            net: 500 - 250 + 110 - 100,
        });
        // Every transfer stays inside "all funds, all accounts"
        expect(statement.transfers).toEqual({ in: 0, out: 0, internal: 540, net: 0 });
        expect(statement.closing).toBe(focusedTotal(data, [], "2026-10-31"));
        reconciles(statement);
    });

    it("treats a fund transfer as money leaving or entering a focused fund", () => {
        const data = busyMonth();
        const me = computeMonthlyStatement(data, OCT, { fundIds: [FUND_ME_ID] });

        expect(me.income.total).toBe(2150);
        expect(me.expense.total).toBe(950);
        expect(me.transfers).toEqual({ in: 40, out: 300, internal: 200, net: -260 });
        expect(me.closing).toBe(focusedTotal(data, [FUND_ME_ID], "2026-10-31"));
        reconciles(me);

        const charity = computeMonthlyStatement(data, OCT, {
            fundIds: [FUND_CHARITY_ID],
        });
        expect(charity.opening).toBe(0);
        expect(charity.income.total).toBe(400);
        expect(charity.expense.total).toBe(50);
        expect(charity.transfers).toEqual({ in: 300, out: 40, internal: 0, net: 260 });
        expect(charity.closing).toBe(610);
        reconciles(charity);
    });

    it("treats a place change as crossing the scope when only some accounts are in it", () => {
        const data = busyMonth();
        const cash = computeMonthlyStatement(data, OCT, {
            fundIds: [],
            accountIds: ["acc_1"],
        });
        expect(cash.transfers).toEqual({ in: 0, out: 240, internal: 300, net: -240 });
        reconciles(cash);

        const bank = computeMonthlyStatement(data, OCT, {
            fundIds: [FUND_ME_ID],
            accountIds: ["acc_2"],
        });
        expect(bank.transfers.in).toBe(240);
        reconciles(bank);
    });

    it("groups income and expense by category, largest first, unknown ones as Other", () => {
        const statement = computeMonthlyStatement(busyMonth(), OCT, { fundIds: [] });
        expect(
            statement.income.byCategory.map((line) => [line.name, line.amount, line.count]),
        ).toEqual([
            ["Salary", 2400, 2],
            ["Other", 150, 1],
        ]);
        expect(statement.expense.byCategory[0]).toMatchObject({
            categoryId: "cat_rent",
            amount: 800,
        });
    });

    it("reconciles every month of a run of months", () => {
        const data = busyMonth();
        ["2026-08", "2026-09", "2026-10", "2026-11"].forEach((month) => {
            [[], [FUND_ME_ID], [FUND_CHARITY_ID]].forEach((fundIds) =>
                reconciles(
                    computeMonthlyStatement(data, statementPeriod(month), { fundIds }),
                ),
            );
        });
    });

    it("opens each month where the previous one closed", () => {
        const data = busyMonth();
        const sep = computeMonthlyStatement(data, statementPeriod("2026-09"), {
            fundIds: [FUND_ME_ID],
        });
        const oct = computeMonthlyStatement(data, statementPeriod("2026-10"), {
            fundIds: [FUND_ME_ID],
        });
        expect(oct.opening).toBe(sep.closing);
    });
});

describe("opening balance entries in statements", () => {
    const data = () =>
        financeData({
            accounts: [account({ initialBalance: 100 })],
            openingBalances: [
                openingEntry({ id: "before", amount: 300, date: "2026-09-15" }),
                openingEntry({ id: "in", amount: 1000, date: "2026-10-10" }),
                openingEntry({
                    id: "charity",
                    amount: 50,
                    fundId: FUND_CHARITY_ID,
                    date: "2026-10-11",
                }),
            ],
            incomes: [income({ amount: 200, actualDate: "2026-10-12" })],
        });

    it("get their own line and still reconcile; never income", () => {
        const statement = computeMonthlyStatement(data(), OCT, { fundIds: [] });
        expect(statement.opening).toBe(400);
        expect(statement.openingEntries).toEqual({ total: 1050, count: 2 });
        expect(statement.income.total).toBe(200);
        expect(statement.net).toBe(200);
        expect(statement.closing).toBe(1650);
        reconciles(statement);
    });

    it("follow the fund scope", () => {
        const statement = computeMonthlyStatement(data(), OCT, {
            fundIds: [FUND_ME_ID],
        });
        expect(statement.openingEntries).toEqual({ total: 1000, count: 1 });
        reconciles(statement);
    });
});

describe("computeMonthlyStatement edge cases", () => {
    const all = { fundIds: [] };

    it("skips offset repayments, which move no money", () => {
        const data = financeData({
            accounts: [account({ initialBalance: 1000 })],
            loans: [loan({ direction: "lent", amount: 300, date: "2026-09-01" })],
            loanPayments: [
                loanPayment({ id: "cash", amount: 100, date: "2026-10-05" }),
                loanPayment({ id: "offset", amount: 200, isOffset: true, date: "2026-10-05" }),
            ],
        });
        const statement = computeMonthlyStatement(data, OCT, all);
        expect(statement.loans.repaidToYou).toBe(100);
        expect(statement.difference).toBe(0);
    });

    it("skips repayments of a loan that no longer exists", () => {
        const data = financeData({
            accounts: [account({ initialBalance: 1000 })],
            loanPayments: [loanPayment({ loanId: "deleted", amount: 100, date: "2026-10-05" })],
        });
        const statement = computeMonthlyStatement(data, OCT, all);
        expect(statement.loans.net).toBe(0);
        expect(statement.closing).toBe(1000);
        expect(statement.difference).toBe(0);
    });

    it("leaves pending and expected income out", () => {
        const data = financeData({
            accounts: [account()],
            incomes: [
                income({ id: "p", status: "pending", actualDate: "2026-10-05" }),
                income({ id: "e", status: "expected", expectedDate: "2026-10-06" }),
            ],
        });
        const statement = computeMonthlyStatement(data, OCT, all);
        expect(statement.income.total).toBe(0);
        expect(statement.difference).toBe(0);
    });

    it("ignores income and expenses on accounts that no longer exist", () => {
        const data = financeData({
            accounts: [account()],
            incomes: [income({ accountId: "gone", amount: 500 })],
            expenses: [expense({ accountId: "gone", amount: 70 })],
            transfers: [transfer({ fromAccountId: "gone", toAccountId: "acc_1", amount: 40 })],
        });
        const statement = computeMonthlyStatement(data, OCT, all);
        expect(statement.income.total).toBe(0);
        expect(statement.expense.total).toBe(0);
        // The surviving side of the transfer still lands, as in computeBalances
        expect(statement.transfers.in).toBe(40);
        expect(statement.difference).toBe(0);
    });

    it("leaves archived accounts out when only active ones are in scope", () => {
        const data = financeData({
            accounts: [
                account({ initialBalance: 100 }),
                account({ id: "acc_2", isActive: false, initialBalance: 900 }),
            ],
            incomes: [income({ accountId: "acc_2", amount: 500 })],
            transfers: [transfer({ fromAccountId: "acc_2", toAccountId: "acc_1", amount: 300 })],
        });
        const active = computeMonthlyStatement(data, OCT, {
            fundIds: [],
            accountIds: ["acc_1"],
        });
        expect(active.opening).toBe(100);
        expect(active.income.total).toBe(0);
        expect(active.transfers.in).toBe(300);
        expect(active.closing).toBe(400);
        expect(active.difference).toBe(0);
    });

    it("reads timestamped dates by their day, as computeBalances does", () => {
        const data = financeData({
            accounts: [account({ initialBalance: 1000 }), account({ id: "acc_2" })],
            incomes: [income({ amount: 200, actualDate: "2026-10-01T00:30:00.000Z" })],
            expenses: [expense({ amount: 50, date: "2026-10-31T22:00:00.000Z" })],
            transfers: [
                transfer({ amount: 25, date: "2026-09-30T23:00:00.000Z" }),
                transfer({ id: "tr_2", amount: 10, date: "2026-11-01T00:10:00.000Z" }),
            ],
            loans: [loan({ amount: 80, date: "2026-10-15T12:00:00.000Z" })],
        });
        const cash = computeMonthlyStatement(data, OCT, {
            fundIds: [],
            accountIds: ["acc_1"],
        });
        expect(cash.income.total).toBe(200);
        expect(cash.expense.total).toBe(50);
        expect(cash.loans.borrowed).toBe(80);
        // September's transfer is in the opening, November's is not counted
        expect(cash.opening).toBe(975);
        expect(cash.transfers.out).toBe(0);
        expect(cash.difference).toBe(0);
    });
});

describe("statement periods", () => {
    it("uses calendar months when months start on the 1st", () => {
        expect(statementPeriod("2026-02")).toEqual({
            start: "2026-02-01",
            end: "2026-02-28",
        });
        expect(statementPeriod("2026-12")).toEqual({
            start: "2026-12-01",
            end: "2026-12-31",
        });
    });

    it("starts financial months on the chosen day", () => {
        expect(statementPeriod("2026-10", 25)).toEqual({
            start: "2026-10-25",
            end: "2026-11-24",
        });
        expect(statementMonthOf("2026-11-24", 25)).toBe("2026-10");
        expect(statementMonthOf("2026-11-25", 25)).toBe("2026-11");
        expect(statementMonthOf("2026-01-03", 5)).toBe("2025-12");
    });

    it("steps back across year ends", () => {
        expect(previousMonth("2026-01")).toBe("2025-12");
        expect(dayBefore("2026-03-01")).toBe("2026-02-28");
    });
});
