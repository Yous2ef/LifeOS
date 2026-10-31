import { describe, expect, it } from "vitest";
import type { CharitySettings, FinanceData } from "@/types/modules/finance";
import {
    charityFundHasPayments,
    computeCharityLedger,
    enableCharityTracking,
    getCharityPledgeError,
    hasDonationNear,
    previewIncomeCharity,
    withRefundCategory,
} from "../charity";
import { computeBalances } from "../balances";
import { getFundDeleteBlocker } from "../funds";
import { FUND_CHARITY_ID, FUND_ME_ID } from "../defaults";
import { applyRecurringIncomes } from "../recurring";
import {
    expense,
    financeData,
    income,
    loan,
    loanPayment,
    pledge,
    transfer,
} from "./fixtures";

const settings = (over: Partial<CharitySettings> = {}): CharitySettings => ({
    enabled: true,
    rate: 0.2,
    startDate: "2026-11-01",
    fundId: FUND_CHARITY_ID,
    eligibleIncomeCategoryIds: ["cat_salary", "cat_freelance"],
    donationCategoryIds: ["cat_donations"],
    openingBalance: 0,
    ...over,
});

const data = (over: Partial<FinanceData> = {}) => financeData(over);

const freelance = (over: Parameters<typeof income>[0] = {}) =>
    income({
        id: "job",
        categoryId: "cat_freelance",
        amount: 20000,
        actualDate: "2026-11-10",
        ...over,
    });

const tools = (over: Parameters<typeof expense>[0] = {}) =>
    expense({
        id: "tools",
        categoryId: "cat_tools",
        amount: 10000,
        date: "2026-11-05",
        isWorkCost: true,
        ...over,
    });

// Money moved into the Charity fund in the same account (a payment)
const toCharity = (amount: number, over: Parameters<typeof transfer>[0] = {}) =>
    transfer({
        id: `pay_${amount}`,
        fromAccountId: "acc_1",
        toAccountId: "acc_1",
        toFundId: FUND_CHARITY_ID,
        amount,
        date: "2026-11-12",
        ...over,
    });

describe("computeCharityLedger", () => {
    it("owes 20% of net earnings, not gross (20k job − 10k tools → 2k)", () => {
        const ledger = computeCharityLedger(
            data({ incomes: [freelance()], expenses: [tools()] }),
            settings(),
        );
        expect(ledger.netEarnings).toBe(10000);
        expect(ledger.owed).toBe(2000);
        expect(ledger.remaining).toBe(2000);
        expect(ledger.perIncome.get("job")).toMatchObject({
            share: 2000,
            workCosts: 10000,
            status: "unpaid",
        });
    });

    it("ignores ineligible income and expenses that aren't work costs", () => {
        const ledger = computeCharityLedger(
            data({
                incomes: [
                    freelance(),
                    income({ id: "gift", categoryId: "cat_gift", amount: 5000, actualDate: "2026-11-11" }),
                ],
                expenses: [expense({ amount: 3000, date: "2026-11-06" })],
            }),
            settings(),
        );
        expect(ledger.owed).toBe(4000);
        expect(ledger.perIncome.has("gift")).toBe(false);
    });

    it("falls back to the category default when an expense doesn't say", () => {
        const ledger = computeCharityLedger(
            data({
                incomes: [freelance()],
                expenses: [tools({ isWorkCost: undefined })],
                categories: [
                    {
                        id: "cat_tools",
                        name: "Work tools",
                        icon: "",
                        color: "",
                        isEssential: false,
                        isDefault: false,
                        isWorkCostDefault: true,
                        order: 1,
                        createdAt: "2026-10-01",
                    },
                ],
            }),
            settings(),
        );
        expect(ledger.owed).toBe(2000);
    });

    it("turns a payment before the income into credit that covers it (D8)", () => {
        const before = computeCharityLedger(
            data({ transfers: [toCharity(1000, { date: "2026-11-02" })] }),
            settings(),
        );
        expect(before.remaining).toBe(-1000);

        const after = computeCharityLedger(
            data({
                incomes: [freelance({ amount: 5000 })],
                transfers: [toCharity(1000, { date: "2026-11-02" })],
            }),
            settings(),
        );
        expect(after.remaining).toBe(0);
        expect(after.perIncome.get("job")).toMatchObject({
            share: 1000,
            covered: 1000,
            creditUsed: 1000,
            status: "paid",
        });
    });

    it("earmarks Already paid to its own income first; excess joins the credit pool", () => {
        const ledger = computeCharityLedger(
            data({
                incomes: [
                    income({ id: "old", categoryId: "cat_salary", amount: 5000, actualDate: "2026-11-03" }),
                    freelance({ amount: 10000, charityPaidOutsideAmount: 2500 }),
                ],
            }),
            settings(),
        );
        // Without earmarking, FIFO would hand the 2,500 to the older salary
        expect(ledger.perIncome.get("job")).toMatchObject({
            share: 2000,
            paidForThis: 2000,
            status: "paid",
        });
        expect(ledger.perIncome.get("old")).toMatchObject({
            share: 1000,
            covered: 500,
            status: "partial",
        });
        expect(ledger.paid).toBe(2500);
        expect(ledger.remaining).toBe(500);
    });

    it("keeps what was paid when the income amount is edited later", () => {
        const paid = freelance({ amount: 10000, charityPaidOutsideAmount: 2000 });
        const edited = computeCharityLedger(
            data({ incomes: [{ ...paid, amount: 15000 }] }),
            settings(),
        );
        expect(edited.paid).toBe(2000);
        expect(edited.remaining).toBe(1000);
        expect(edited.perIncome.get("job")).toMatchObject({
            covered: 2000,
            status: "partial",
        });
    });

    it("counts moving money into the Charity fund and un-pays taking it back", () => {
        const ledger = computeCharityLedger(
            data({
                incomes: [freelance()],
                transfers: [
                    toCharity(4000),
                    transfer({
                        id: "back",
                        fromAccountId: "acc_1",
                        toAccountId: "acc_1",
                        fromFundId: FUND_CHARITY_ID,
                        toFundId: FUND_ME_ID,
                        amount: 1500,
                        date: "2026-11-20",
                    }),
                ],
            }),
            settings(),
        );
        expect(ledger.paid).toBe(2500);
        expect(ledger.remaining).toBe(1500);
    });

    it("ignores moving charity money between places (Charity → Charity)", () => {
        const ledger = computeCharityLedger(
            data({
                incomes: [freelance()],
                transfers: [
                    transfer({
                        fromFundId: FUND_CHARITY_ID,
                        toFundId: FUND_CHARITY_ID,
                        amount: 900,
                        date: "2026-11-15",
                    }),
                    // A plain Me → Me transfer between accounts
                    transfer({ id: "tr_2", amount: 700, date: "2026-11-15" }),
                ],
            }),
            settings(),
        );
        expect(ledger.paid).toBe(0);
    });

    it("counts a donation from Me as paid but spending from the Charity fund never again", () => {
        const ledger = computeCharityLedger(
            data({
                incomes: [freelance()],
                transfers: [toCharity(1000)],
                expenses: [
                    expense({ id: "don_me", categoryId: "cat_donations", amount: 500, date: "2026-11-13" }),
                    expense({
                        id: "don_charity",
                        categoryId: "cat_donations",
                        amount: 1000,
                        date: "2026-11-14",
                        fundId: FUND_CHARITY_ID,
                    }),
                    // Even marked as a work cost, Charity-fund spending is ignored
                    expense({
                        id: "charity_tools",
                        amount: 800,
                        date: "2026-11-14",
                        fundId: FUND_CHARITY_ID,
                        isWorkCost: true,
                    }),
                ],
            }),
            settings(),
        );
        expect(ledger.paid).toBe(1500);
        expect(ledger.owed).toBe(4000);
    });

    it("never treats a donation as a work cost", () => {
        const ledger = computeCharityLedger(
            data({
                incomes: [freelance()],
                expenses: [
                    expense({ categoryId: "cat_donations", amount: 1000, date: "2026-11-13", isWorkCost: true }),
                ],
            }),
            settings(),
        );
        expect(ledger.owed).toBe(4000);
        expect(ledger.paid).toBe(1000);
    });

    it("carries costs beyond earnings forward; months add up to remaining", () => {
        const ledger = computeCharityLedger(
            data({
                incomes: [
                    freelance({ id: "nov", amount: 5000, actualDate: "2026-11-20" }),
                    freelance({ id: "jan", amount: 20000, actualDate: "2027-01-10" }),
                ],
                expenses: [tools({ amount: 15000, date: "2026-11-05" })],
                transfers: [toCharity(500, { date: "2026-12-01" })],
            }),
            settings({ openingBalance: 300 }),
        );
        expect(ledger.monthly.map((m) => m.month)).toEqual([
            "2026-11",
            "2026-12",
            "2027-01",
        ]);
        const [nov, dec, jan] = ledger.monthly;
        // November: costs exceed earnings → nothing owed, 2,000 carried
        expect(nov.owed + nov.carried).toBe(0);
        expect(nov.carried).toBe(2000);
        expect(dec.owed).toBe(0);
        expect(jan.carried).toBe(-2000);
        expect(ledger.owed).toBe(2000 + 300);
        expect(ledger.remaining).toBe(1800);

        const summed = ledger.monthly.reduce(
            (total, m) => total + m.owed + m.carried - m.paid,
            ledger.opening,
        );
        expect(summed).toBeCloseTo(ledger.remaining);
        expect(jan.balance).toBe(ledger.remaining);
    });

    it("shows 0 owed and the excess carried while costs exceed earnings", () => {
        const ledger = computeCharityLedger(
            data({ incomes: [freelance({ amount: 5000 })], expenses: [tools()] }),
            settings(),
        );
        expect(ledger.owed).toBe(0);
        expect(ledger.carried).toBe(1000);
        expect(ledger.perIncome.get("job")).toMatchObject({ share: 0, status: "paid" });
    });

    it("matches a project's costs to that project's income", () => {
        const ledger = computeCharityLedger(
            data({
                incomes: [
                    income({ id: "salary", categoryId: "cat_salary", amount: 10000, actualDate: "2026-11-01" }),
                    freelance({ projectId: "p1" }),
                ],
                expenses: [tools({ projectId: "p1" })],
            }),
            settings(),
        );
        expect(ledger.perIncome.get("salary")?.share).toBe(2000);
        expect(ledger.perIncome.get("job")).toMatchObject({ share: 2000, workCosts: 10000 });
    });

    it("accrues a pending income once it's received after the start date", () => {
        const pending = freelance({ status: "pending", actualDate: undefined, expectedDate: "2026-11-10" });
        expect(computeCharityLedger(data({ incomes: [pending] }), settings()).owed).toBe(0);

        const received = { ...pending, status: "received" as const, actualDate: "2026-11-18" };
        const ledger = computeCharityLedger(data({ incomes: [received] }), settings());
        expect(ledger.owed).toBe(4000);
        expect(ledger.monthly[0].month).toBe("2026-11");
    });

    it("respects the start date for income, costs and payments", () => {
        const ledger = computeCharityLedger(
            data({
                incomes: [freelance({ actualDate: "2026-10-30" })],
                expenses: [tools({ date: "2026-10-31" })],
                transfers: [toCharity(1000, { date: "2026-10-31" })],
            }),
            settings(),
        );
        expect([ledger.owed, ledger.paid, ledger.remaining]).toEqual([0, 0, 0]);
        expect(ledger.monthly).toEqual([]);
    });

    it("never accrues installment refunds or loans, and loan repayments never pay", () => {
        const ledger = computeCharityLedger(
            {
                ...data({
                    incomes: [
                        income({
                            id: "refund",
                            categoryId: "cat_salary",
                            amount: 3000,
                            actualDate: "2026-11-05",
                            linkedInstallmentId: "inst_1",
                            tags: ["refund"],
                        }),
                        income({
                            id: "tagged",
                            categoryId: "cat_salary",
                            amount: 1000,
                            actualDate: "2026-11-05",
                            tags: ["refund"],
                        }),
                    ],
                    loans: [loan({ date: "2026-11-02", fundId: FUND_CHARITY_ID })],
                    loanPayments: [loanPayment({ date: "2026-11-20" })],
                }),
            },
            settings(),
        );
        expect([ledger.owed, ledger.paid]).toEqual([0, 0]);
        expect(ledger.perIncome.size).toBe(0);
    });

    it("opening credit covers the first income; opening owed is paid first", () => {
        const credit = computeCharityLedger(
            data({ incomes: [freelance({ amount: 5000 })] }),
            settings({ openingBalance: -1000 }),
        );
        expect(credit.remaining).toBe(0);
        expect(credit.perIncome.get("job")?.status).toBe("paid");

        const owed = computeCharityLedger(
            data({ incomes: [freelance({ amount: 5000 })], transfers: [toCharity(1000)] }),
            settings({ openingBalance: 1000 }),
        );
        expect(owed.remaining).toBe(1000);
        expect(owed.perIncome.get("job")?.status).toBe("unpaid");
    });
});

describe("payments tied to an income", () => {
    // A 10k on Nov 2 left for later, then B 20k paid with "Pay 4,000 now"
    const a = income({ id: "a", categoryId: "cat_salary", amount: 10000, actualDate: "2026-11-02" });
    const b = freelance({ id: "b", amount: 20000, actualDate: "2026-11-10" });
    const payNow = toCharity(4000, { id: "pay_b", date: "2026-11-10", charityIncomeId: "b" });

    it("Pay now pays the income it was made for, not the oldest one", () => {
        const ledger = computeCharityLedger(
            data({ incomes: [a, b], transfers: [payNow] }),
            settings(),
        );
        expect(ledger.perIncome.get("b")).toMatchObject({
            status: "paid",
            paidForThis: 4000,
            creditUsed: 0,
        });
        expect(ledger.perIncome.get("a")).toMatchObject({ status: "unpaid", covered: 0 });
        expect(ledger.perIncome.get("a")!.share - ledger.perIncome.get("a")!.covered).toBe(2000);
        expect(ledger.remaining).toBe(2000);
    });

    it("an unlinked payment (strip Pay) still covers the oldest income first", () => {
        const ledger = computeCharityLedger(
            data({ incomes: [a, b], transfers: [{ ...payNow, charityIncomeId: undefined }] }),
            settings(),
        );
        expect(ledger.perIncome.get("a")?.status).toBe("paid");
        expect(ledger.perIncome.get("b")).toMatchObject({ status: "partial", covered: 2000 });
    });

    it("only the excess of a linked payment joins the pool", () => {
        const ledger = computeCharityLedger(
            data({ incomes: [a, b], transfers: [{ ...payNow, amount: 5000 }] }),
            settings(),
        );
        expect(ledger.perIncome.get("b")?.paidForThis).toBe(4000);
        expect(ledger.perIncome.get("a")).toMatchObject({ creditUsed: 1000, status: "partial" });
    });

    it("taking a linked payment back out un-pays its income", () => {
        const back = transfer({
            id: "back_b",
            fromAccountId: "acc_1",
            toAccountId: "acc_1",
            fromFundId: FUND_CHARITY_ID,
            amount: 1000,
            date: "2026-11-12",
            charityIncomeId: "b",
        });
        const ledger = computeCharityLedger(
            data({ incomes: [b], transfers: [payNow, back] }),
            settings(),
        );
        expect(ledger.perIncome.get("b")).toMatchObject({ paidForThis: 3000, status: "partial" });
        expect(ledger.paid).toBe(3000);
    });

    it("falls back to the pool when its income is deleted", () => {
        const ledger = computeCharityLedger(
            data({ incomes: [a], transfers: [payNow] }),
            settings(),
        );
        expect(ledger.perIncome.get("a")).toMatchObject({ status: "paid", creditUsed: 2000 });
        expect(ledger.remaining).toBe(-2000);
    });

    it("money taken back out un-pays a directly paid income too", () => {
        const back = transfer({
            id: "back_manual",
            fromAccountId: "acc_1",
            toAccountId: "acc_1",
            fromFundId: FUND_CHARITY_ID,
            amount: 4000,
            date: "2026-11-15",
        });
        const ledger = computeCharityLedger(
            data({ incomes: [a, b], transfers: [payNow, back] }),
            settings(),
        );
        expect(ledger.remaining).toBe(6000);
        expect(ledger.perIncome.get("b")).toMatchObject({ status: "unpaid", paidForThis: 0 });
        const unpaid = Array.from(ledger.perIncome.values()).reduce(
            (sum, entry) => sum + entry.share - entry.covered,
            0,
        );
        expect(unpaid).toBe(ledger.remaining);

        // Partly taken back: the newest directly paid income gives it up
        const partly = computeCharityLedger(
            data({ incomes: [a, b], transfers: [payNow, { ...back, amount: 1500 }] }),
            settings(),
        );
        expect(partly.perIncome.get("b")).toMatchObject({ covered: 2500, status: "partial" });
        expect(partly.remaining).toBe(3500);
    });

    it("ignores Already paid on income that landed in the Charity fund", () => {
        const ledger = computeCharityLedger(
            data({
                incomes: [
                    freelance({ id: "c", amount: 10000, fundId: FUND_CHARITY_ID, charityPaidOutsideAmount: 2000 }),
                ],
            }),
            settings(),
        );
        expect(ledger.paid).toBe(10000);
        expect(ledger.remaining).toBe(-8000);
    });

    it("eligible income received into the Charity fund pays its full amount", () => {
        const intoCharity = freelance({ id: "c", amount: 10000, fundId: FUND_CHARITY_ID });
        const ledger = computeCharityLedger(
            data({ incomes: [a, intoCharity] }),
            settings(),
        );
        expect(ledger.owed).toBe(4000);
        expect(ledger.paid).toBe(10000);
        expect(ledger.remaining).toBe(-6000);
        expect(ledger.perIncome.get("c")).toMatchObject({ paidForThis: 2000, status: "paid" });
        // The other 8,000 is credit: it covers the older salary too
        expect(ledger.perIncome.get("a")?.status).toBe("paid");
        expect(ledger.monthly[0].paid).toBe(10000);

        const ineligible = computeCharityLedger(
            data({ incomes: [{ ...intoCharity, categoryId: "cat_gift" }] }),
            settings(),
        );
        expect(ineligible.paid).toBe(0);
    });
});

describe("monthly rows", () => {
    it("get a start-month row when only an opening balance exists", () => {
        const ledger = computeCharityLedger(data(), settings({ openingBalance: 750 }));
        expect(ledger.monthly).toEqual([
            {
                month: "2026-11",
                opening: 750,
                earnings: 0,
                workCosts: 0,
                owed: 0,
                carried: 0,
                pledged: 0,
                paid: 0,
                balance: 750,
            },
        ]);
        expect(ledger.remaining).toBe(750);
    });

    it("each row reconciles and opens at the previous balance", () => {
        const ledger = computeCharityLedger(
            data({
                incomes: [freelance({ actualDate: "2026-11-10" }), freelance({ id: "j2", actualDate: "2027-01-03" })],
                expenses: [tools({ date: "2026-12-05" })],
                transfers: [toCharity(1000, { date: "2026-12-20" })],
                charityPledges: [pledge({ date: "2026-12-01", amount: 300 })],
            }),
            settings({ openingBalance: -500 }),
        );
        let previous = ledger.opening;
        ledger.monthly.forEach((row) => {
            expect(row.opening).toBe(previous);
            expect(row.balance).toBeCloseTo(
                row.opening + row.owed + row.carried + row.pledged - row.paid,
            );
            previous = row.balance;
        });
        expect(previous).toBe(ledger.remaining);
    });
});

describe("extra charity pledges", () => {
    it("add to what you owe on their date, never to net earnings", () => {
        const ledger = computeCharityLedger(
            data({
                incomes: [freelance()],
                charityPledges: [pledge({ amount: 500 })],
            }),
            settings(),
        );
        expect(ledger.netEarnings).toBe(20000);
        expect(ledger.pledged).toBe(500);
        expect(ledger.owed).toBe(4500);
        expect(ledger.remaining).toBe(4500);
        expect(ledger.monthly[0]).toMatchObject({ owed: 4000, pledged: 500 });
    });

    it("are not reduced by work costs, even beyond earnings", () => {
        const ledger = computeCharityLedger(
            data({
                expenses: [tools({ amount: 5000 })],
                charityPledges: [pledge({ amount: 500 })],
            }),
            settings(),
        );
        expect(ledger.owed).toBe(500);
        expect(ledger.carried).toBe(1000);
        expect(ledger.remaining).toBe(500);
    });

    it("are skipped before the start date", () => {
        const ledger = computeCharityLedger(
            data({ charityPledges: [pledge({ date: "2026-10-20" })] }),
            settings(),
        );
        expect(ledger.pledged).toBe(0);
        expect(ledger.perPledge.size).toBe(0);
    });

    it("are paid oldest first alongside incomes", () => {
        const ledger = computeCharityLedger(
            data({
                incomes: [freelance({ actualDate: "2026-11-20" })],
                charityPledges: [pledge({ date: "2026-11-15", amount: 500 })],
                transfers: [toCharity(1000, { date: "2026-11-25" })],
            }),
            settings(),
        );
        // The pledge is older than the 4,000 share: it's covered first
        expect(ledger.perPledge.get("pledge_1")).toMatchObject({
            covered: 500,
            status: "paid",
        });
        expect(ledger.perIncome.get("job")).toMatchObject({
            covered: 500,
            creditUsed: 500,
            status: "partial",
        });
        expect(ledger.remaining).toBe(3500);
    });

    it("a pledge made later on an income's day comes after that income", () => {
        const ledger = computeCharityLedger(
            data({
                incomes: [
                    freelance({
                        actualDate: "2026-11-15T09:00:00.000Z",
                        createdAt: "2026-11-15T09:00:00.000Z",
                    }),
                ],
                charityPledges: [
                    pledge({ createdAt: "2026-11-15T12:00:00.000Z" }),
                ],
                transfers: [toCharity(4000, { date: "2026-11-25" })],
            }),
            settings(),
        );
        expect(ledger.perIncome.get("job")?.status).toBe("paid");
        expect(ledger.perPledge.get("pledge_1")?.status).toBe("unpaid");
    });

    it("keeps same-day incomes in their own order around a pledge", () => {
        // By time B landed first, though A was entered first
        const incomes = [
            freelance({
                id: "A",
                actualDate: "2026-11-15T20:00:00.000Z",
                createdAt: "2026-11-15T08:00:00.000Z",
            }),
            freelance({
                id: "B",
                actualDate: "2026-11-15T09:00:00.000Z",
                createdAt: "2026-11-15T21:00:00.000Z",
            }),
        ];
        const transfers = [toCharity(4000, { date: "2026-11-25" })];
        const without = computeCharityLedger(data({ incomes, transfers }), settings());
        expect(without.perIncome.get("B")?.status).toBe("paid");
        expect(without.perIncome.get("A")?.status).toBe("unpaid");

        const withPledge = computeCharityLedger(
            data({
                incomes,
                transfers,
                charityPledges: [
                    pledge({ date: "2026-11-15", createdAt: "2026-11-15T12:00:00.000Z" }),
                ],
            }),
            settings(),
        );
        // Entered before B: the pledge comes first, then B, then A
        expect(withPledge.perPledge.get("pledge_1")?.status).toBe("paid");
        expect(withPledge.perIncome.get("B")).toMatchObject({
            covered: 3500,
            status: "partial",
        });
        expect(withPledge.perIncome.get("A")?.status).toBe("unpaid");
    });

    it("refuses pledges of 0 or dated before the start date", () => {
        const start = { startDate: "2026-11-01" };
        expect(getCharityPledgeError({ amount: 0, date: "2026-11-02" }, start)).toMatch(
            /above 0/,
        );
        expect(
            getCharityPledgeError({ amount: 10, date: "2026-10-31" }, start),
        ).toBe("Before your charity start date");
        expect(getCharityPledgeError({ amount: 10, date: "2026-11-01" }, start)).toBeNull();
    });

    it("a pledge after the income waits until the income is paid", () => {
        const ledger = computeCharityLedger(
            data({
                incomes: [freelance({ actualDate: "2026-11-10" })],
                charityPledges: [pledge({ date: "2026-11-15", amount: 500 })],
                transfers: [toCharity(4200, { date: "2026-11-25" })],
            }),
            settings(),
        );
        expect(ledger.perIncome.get("job")?.status).toBe("paid");
        expect(ledger.perPledge.get("pledge_1")).toMatchObject({
            covered: 200,
            status: "partial",
        });
    });
});

describe("recurring copies", () => {
    it("don't inherit the template's Already paid", () => {
        const template = freelance({
            id: "tpl",
            isRecurring: true,
            frequency: "monthly",
            actualDate: "2026-11-01",
            charityPaidOutsideAmount: 4000,
        });
        const generated = applyRecurringIncomes([template], new Date("2026-12-05T12:00:00Z"))!;
        const copy = generated.find((i) => i.id === "tpl_2026-12-01")!;
        expect(copy.charityPaidOutsideAmount).toBeUndefined();

        const ledger = computeCharityLedger(data({ incomes: generated }), settings());
        expect(ledger.perIncome.get("tpl")?.status).toBe("paid");
        expect(ledger.perIncome.get("tpl_2026-12-01")?.status).toBe("unpaid");
        expect(ledger.remaining).toBe(4000);
    });
});

describe("previewIncomeCharity (add-income step)", () => {
    it("shows the project's costs, 20% of net, credit used and what's left", () => {
        const preview = previewIncomeCharity(
            data({
                expenses: [tools({ projectId: "p1" })],
                transfers: [toCharity(500, { date: "2026-11-02" })],
            }),
            settings(),
            freelance({ id: "draft", projectId: "p1" }),
        );
        expect(preview).toEqual({
            workCosts: 10000,
            share: 2000,
            creditUsed: 500,
            paidForThis: 0,
            toPay: 1500,
        });
    });

    it("storing the shown amount as Already paid marks the income paid", () => {
        const draft = freelance({ id: "draft" });
        const preview = previewIncomeCharity(data(), settings(), draft)!;
        const ledger = computeCharityLedger(
            data({ incomes: [{ ...draft, charityPaidOutsideAmount: preview.toPay }] }),
            settings(),
        );
        expect(ledger.perIncome.get("draft")?.status).toBe("paid");
        expect(ledger.remaining).toBe(0);
    });

    it("is null when charity is off or the income isn't eligible", () => {
        expect(previewIncomeCharity(data(), settings({ enabled: false }), freelance())).toBeNull();
        expect(
            previewIncomeCharity(data(), settings(), freelance({ categoryId: "cat_gift" })),
        ).toBeNull();
    });

    it("replaces the saved income when editing it", () => {
        const saved = freelance();
        const preview = previewIncomeCharity(
            data({ incomes: [saved] }),
            settings(),
            { ...saved, amount: 10000 },
        );
        expect(preview?.share).toBe(2000);
    });
});

describe("guards and hints", () => {
    it("locks the fund once money moved in or out of it", () => {
        expect(charityFundHasPayments(data(), FUND_CHARITY_ID)).toBe(false);
        expect(
            charityFundHasPayments(data({ transfers: [toCharity(10)] }), FUND_CHARITY_ID),
        ).toBe(true);
    });

    it("flags a donation from Me within a week of an Already paid income", () => {
        const donations = data({
            expenses: [expense({ categoryId: "cat_donations", date: "2026-11-14" })],
        });
        expect(hasDonationNear(donations, settings(), "2026-11-10")).toBe(true);
        expect(hasDonationNear(donations, settings(), "2026-11-25")).toBe(false);

        const fromCharity = data({
            expenses: [
                expense({ categoryId: "cat_donations", date: "2026-11-14", fundId: FUND_CHARITY_ID }),
            ],
        });
        expect(hasDonationNear(fromCharity, settings(), "2026-11-10")).toBe(false);
    });
});

describe("enableCharityTracking", () => {
    const base = () =>
        financeData({
            categories: [
                {
                    id: "c_food",
                    name: "Food",
                    icon: "",
                    color: "",
                    isEssential: true,
                    isDefault: false,
                    order: 1,
                    createdAt: "2026-10-01",
                },
            ],
            incomeCategories: [
                { id: "i_sal", name: "Salary", icon: "", color: "", isDefault: false, order: 1, createdAt: "x" },
                { id: "i_free", name: "freelance ", icon: "", color: "", isDefault: false, order: 2, createdAt: "x" },
                { id: "i_gift", name: "Gift", icon: "", color: "", isDefault: false, order: 3, createdAt: "x" },
            ],
        });

    it("creates the fund and categories once and pre-selects by name", () => {
        const once = enableCharityTracking(base(), "2026-11-01T00:00:00.000Z");
        const twice = enableCharityTracking(once, "2026-11-02T00:00:00.000Z");

        expect(twice.funds.filter((f) => f.id === FUND_CHARITY_ID)).toHaveLength(1);
        expect(twice.funds.find((f) => f.id === FUND_CHARITY_ID)?.kind).toBe("charity");
        expect(twice.categories.filter((c) => c.name === "Donations")).toHaveLength(1);
        expect(twice.incomeCategories.filter((c) => c.name === "Refund")).toHaveLength(1);
        expect(twice.settings.charity.enabled).toBe(true);
        expect(twice.settings.charity.eligibleIncomeCategoryIds).toEqual(["i_sal", "i_free"]);
        expect(twice.settings.charity.donationCategoryIds).toEqual([
            once.categories.find((c) => c.name === "Donations")!.id,
        ]);
        // Not added to the home focus
        expect(twice.settings.focusedFundIds).toEqual([FUND_ME_ID]);
        expect(twice).toEqual(enableCharityTracking(twice, "2026-11-03T00:00:00.000Z"));
    });

    it("reuses existing Donations / Refund categories found by name", () => {
        const withExisting = financeData({
            categories: [
                { id: "mine", name: "donations", icon: "", color: "", isEssential: false, isDefault: false, order: 1, createdAt: "x" },
            ],
            incomeCategories: [
                { id: "ref", name: "Refund", icon: "", color: "", isDefault: false, order: 1, createdAt: "x" },
            ],
        });
        const enabled = enableCharityTracking(withExisting);
        expect(enabled.categories).toHaveLength(1);
        expect(enabled.incomeCategories).toHaveLength(1);
        expect(enabled.settings.charity.donationCategoryIds).toEqual(["mine"]);
        expect(withRefundCategory(enabled).refundId).toBe("ref");
    });

    it("adopts a charity fund made by hand instead of creating another", () => {
        const handMade = {
            id: "fund_custom",
            name: " charity ",
            icon: "",
            color: "",
            kind: "custom" as const,
            isVisible: false,
            order: 1,
            createdAt: "x",
            updatedAt: "x",
        };
        const enabled = enableCharityTracking(
            financeData({ funds: [handMade] }),
            "2026-11-01T00:00:00.000Z",
        );
        expect(enabled.funds.some((f) => f.id === FUND_CHARITY_ID)).toBe(false);
        expect(enabled.funds.find((f) => f.id === "fund_custom")).toMatchObject({
            kind: "charity",
            isVisible: true,
        });
        expect(enabled.settings.charity.fundId).toBe("fund_custom");
        expect(enableCharityTracking(enabled).funds).toHaveLength(enabled.funds.length);
        expect(getFundDeleteBlocker(enabled, "fund_custom")).not.toBeNull();
    });

    it("leaves balances unchanged", () => {
        const before = base();
        const after = enableCharityTracking(before);
        expect(computeBalances(after)).toEqual(computeBalances(before));
    });
});
