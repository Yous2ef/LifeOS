import type {
    CharitySettings,
    Expense,
    ExpenseCategory,
    FinanceData,
    Income,
} from "@/types/modules/finance";
import { day, fundOf, incomeDate } from "./balances";
import {
    DONATIONS_CATEGORY_ID,
    FUND_CHARITY_ID,
    REFUND_INCOME_CATEGORY_ID,
    getDefaultCharityFund,
    nextOrder,
    getDonationsCategory,
    getRefundIncomeCategory,
} from "./defaults";
import { roundMoney } from "./loans";

export type CharitySource = Pick<
    FinanceData,
    "incomes" | "expenses" | "transfers" | "categories"
>;

export type CharityIncomeStatus = "paid" | "partial" | "unpaid";

export interface CharityIncomeShare {
    /** Owed for this income: rate × (amount − work costs applied to it) */
    share: number;
    /** Part of the share already covered ("Already paid" first, then credit) */
    covered: number;
    status: CharityIncomeStatus;
    /** Work costs (base amount, before the rate) applied to this income */
    workCosts: number;
    /**
     * Covered by money paid for this income itself: its "Already paid", its
     * "Pay now" transfers, or the income landing in the Charity fund
     */
    paidForThis: number;
    /** Covered by payments and credit (oldest unpaid incomes first) */
    creditUsed: number;
}

/**
 * One month of the ledger. Each row reconciles on its own:
 * balance = opening + owed + carried − paid, and the next row opens at this
 * balance, so ledger.remaining = ledger.opening + Σ(owed + carried − paid).
 */
export interface CharityMonth {
    month: string; // YYYY-MM
    /** Remaining when the month starts (the opening balance for the first row) */
    opening: number;
    earnings: number;
    workCosts: number;
    /** rate × (earnings − work costs); negative when costs exceed earnings */
    owed: number;
    /**
     * + reductions held back because costs so far exceed earnings, − held-back
     * reductions used up; owed + carried is what the month adds to the balance
     */
    carried: number;
    paid: number;
    /** Remaining at month end (opening balance included); <0 = credit */
    balance: number;
}

export interface CharityLedger {
    /** Eligible earnings − work costs since the start date */
    netEarnings: number;
    /** rate × net earnings (never below 0) + opening owed */
    owed: number;
    /** Payments + "Already paid" amounts + opening credit */
    paid: number;
    /** owed − paid; <0 = credit toward future earnings */
    remaining: number;
    /** Reductions (rate × excess work costs) waiting for future earnings */
    carried: number;
    /** Owed (+) or credit (−) before the start date; the first row opens here */
    opening: number;
    monthly: CharityMonth[];
    perIncome: Map<string, CharityIncomeShare>;
}

const PAY_EPSILON = 0.005;
/** Shares at or below this are nothing to pay (or to badge) */
export const CHARITY_SHARE_EPSILON = PAY_EPSILON;

const isRefundIncome = (income: Income) =>
    !!income.linkedInstallmentId || income.tags?.includes("refund");

const isOnOrAfter = (date: string, start: string) => day(date) >= start;

/** Income that owes charity: eligible category, received on/after the start */
export const isCharityEligibleIncome = (
    income: Income,
    settings: CharitySettings,
): boolean =>
    income.status === "received" &&
    !isRefundIncome(income) &&
    settings.eligibleIncomeCategoryIds.includes(income.categoryId) &&
    isOnOrAfter(incomeDate(income), settings.startDate);

const isFromCharityFund = (expense: Expense, settings: CharitySettings) =>
    fundOf(expense.fundId) === settings.fundId;

export const isDonationExpense = (
    expense: Expense,
    settings: CharitySettings,
): boolean => settings.donationCategoryIds.includes(expense.categoryId);

/**
 * Expense that lowers the charity base. Unset falls back to the category's
 * default (quick-add and installment expenses never set it). Money spent from
 * the Charity fund is already God's, and a donation can't both lower the base
 * and count as paid, so neither is ever a work cost.
 */
export const isCharityWorkCost = (
    expense: Expense,
    settings: CharitySettings,
    categories: ExpenseCategory[],
): boolean => {
    if (isFromCharityFund(expense, settings)) return false;
    if (isDonationExpense(expense, settings)) return false;
    if (expense.isWorkCost !== undefined) return expense.isWorkCost;
    return !!categories.find((c) => c.id === expense.categoryId)
        ?.isWorkCostDefault;
};

interface Payment {
    date: string;
    amount: number;
    /** Paid for this income: covers it before anything else */
    incomeId?: string;
}

/**
 * Money that counts as paid, by date. Moving money into the Charity fund pays;
 * taking it back out un-pays; moving it between places inside the fund is 0.
 * Donations from other funds pay; spending from the Charity fund is 0.
 * "Already paid" amounts and eligible income received straight into the
 * Charity fund (all of it is God's money) pay for their own income first, as
 * do "Pay now" transfers linked to an income.
 */
const charityPayments = (
    data: CharitySource,
    settings: CharitySettings,
): Payment[] => {
    const charity = settings.fundId;
    const payments: Payment[] = [];

    data.transfers.forEach((transfer) => {
        if (!isOnOrAfter(transfer.date, settings.startDate)) return;
        const from = fundOf(transfer.fromFundId);
        const to = fundOf(transfer.toFundId);
        const incomeId = transfer.charityIncomeId;
        if (to === charity && from !== charity) {
            payments.push({ date: transfer.date, amount: transfer.amount, incomeId });
        } else if (from === charity && to !== charity) {
            payments.push({ date: transfer.date, amount: -transfer.amount, incomeId });
        }
    });

    data.expenses.forEach((expense) => {
        if (!isOnOrAfter(expense.date, settings.startDate)) return;
        if (isFromCharityFund(expense, settings)) return;
        if (isDonationExpense(expense, settings)) {
            payments.push({ date: expense.date, amount: expense.amount });
        }
    });

    data.incomes.forEach((income) => {
        if (income.status !== "received") return;
        const date = incomeDate(income);
        if (!isOnOrAfter(date, settings.startDate)) return;
        const isInCharityFund = fundOf(income.fundId) === charity;
        // Income landing in the Charity fund is already paid in full below;
        // an "Already paid" on it would count the same money twice
        const outside = isInCharityFund
            ? 0
            : Math.max(0, income.charityPaidOutsideAmount ?? 0);
        if (outside > 0) {
            payments.push({ date, amount: outside, incomeId: income.id });
        }
        if (isInCharityFund && isCharityEligibleIncome(income, settings)) {
            payments.push({ date, amount: income.amount, incomeId: income.id });
        }
    });

    return payments;
};

const byIncomeDate = (a: Income, b: Income) =>
    incomeDate(a).localeCompare(incomeDate(b)) ||
    a.createdAt.localeCompare(b.createdAt) ||
    a.id.localeCompare(b.id);

/**
 * Work costs applied to each eligible income (base amounts). A project's costs
 * go to that project's incomes first, oldest first; everything left (costs
 * without a project, or more than the project earned) goes to the oldest
 * incomes with net left. Whatever no income can absorb is carried forward.
 * Order of entry doesn't matter: the same data always gives the same split.
 */
const allocateWorkCosts = (
    incomes: Income[],
    costs: Expense[],
): Map<string, number> => {
    const applied = new Map(incomes.map((income) => [income.id, 0]));
    const room = (income: Income) =>
        income.amount - (applied.get(income.id) ?? 0);
    const spread = (amount: number, targets: Income[]): number => {
        let left = amount;
        for (const income of targets) {
            if (left <= 0) break;
            const take = Math.min(left, Math.max(0, room(income)));
            applied.set(income.id, (applied.get(income.id) ?? 0) + take);
            left -= take;
        }
        return left;
    };

    const byProject = new Map<string, number>();
    let general = 0;
    costs.forEach((cost) => {
        if (cost.projectId) {
            byProject.set(
                cost.projectId,
                (byProject.get(cost.projectId) ?? 0) + cost.amount,
            );
        } else {
            general += cost.amount;
        }
    });

    byProject.forEach((amount, projectId) => {
        general += spread(
            amount,
            incomes.filter((income) => income.projectId === projectId),
        );
    });
    spread(general, incomes);

    return applied;
};

const statusOf = (share: number, covered: number): CharityIncomeStatus =>
    share - covered <= PAY_EPSILON
        ? "paid"
        : covered > PAY_EPSILON
          ? "partial"
          : "unpaid";

const monthOf = (date: string) => day(date).slice(0, 7);

const monthsBetween = (first: string, last: string): string[] => {
    const months: string[] = [];
    let [year, month] = first.split("-").map(Number);
    const [lastYear, lastMonth] = last.split("-").map(Number);
    while (year < lastYear || (year === lastYear && month <= lastMonth)) {
        months.push(`${year}-${String(month).padStart(2, "0")}`);
        month += 1;
        if (month > 12) {
            month = 1;
            year += 1;
        }
    }
    return months;
};

/**
 * The charity obligation from `settings.startDate` on, derived from records
 * every time (no hooks on income CRUD, so add/edit/delete/recurring stay right).
 *
 * Owed is a running total: rate × (eligible earnings − work costs), never below
 * 0 — costs beyond earnings carry forward against future earnings. Loans are
 * not incomes or expenses, so they never accrue or pay.
 *
 * Per income: money paid for that income ("Already paid", a linked "Pay now"
 * transfer, income landing in the Charity fund) covers it first; every other
 * payment, any excess (or a payment whose income is gone) and an opening credit
 * form a pool that covers the opening owed and then the oldest unpaid incomes
 * (FIFO).
 */
export const computeCharityLedger = (
    data: CharitySource,
    settings: CharitySettings,
): CharityLedger => {
    const rate = settings.rate;
    const opening = settings.openingBalance || 0;

    const incomes = data.incomes
        .filter((income) => isCharityEligibleIncome(income, settings))
        .sort(byIncomeDate);
    const costs = data.expenses.filter(
        (expense) =>
            isOnOrAfter(expense.date, settings.startDate) &&
            isCharityWorkCost(expense, settings, data.categories),
    );
    const payments = charityPayments(data, settings);
    const paidFor = new Map<string, number>();
    payments.forEach((payment) => {
        if (!payment.incomeId) return;
        paidFor.set(
            payment.incomeId,
            (paidFor.get(payment.incomeId) ?? 0) + payment.amount,
        );
    });

    const totalEarnings = incomes.reduce((sum, i) => sum + i.amount, 0);
    const totalCosts = costs.reduce((sum, e) => sum + e.amount, 0);
    const totalPayments = payments.reduce((sum, p) => sum + p.amount, 0);
    const netEarnings = totalEarnings - totalCosts;
    const accrued = rate * Math.max(0, netEarnings);

    // Per income: shares after work costs, then what was paid for it
    const appliedCosts = allocateWorkCosts(incomes, costs);
    const perIncome = new Map<string, CharityIncomeShare>();
    let earmarked = 0;
    incomes.forEach((income) => {
        const workCosts = appliedCosts.get(income.id) ?? 0;
        const share = rate * (income.amount - workCosts);
        const paidForThis = Math.max(
            0,
            Math.min(paidFor.get(income.id) ?? 0, share),
        );
        earmarked += paidForThis;
        perIncome.set(income.id, {
            share,
            covered: paidForThis,
            status: "unpaid",
            workCosts,
            paidForThis,
            creditUsed: 0,
        });
    });
    // Everything else paid is one pool; it covers the oldest debt first —
    // what was owed before the start — then the oldest unpaid incomes
    let pool =
        totalPayments - earmarked + Math.max(0, -opening) - Math.max(0, opening);
    incomes.forEach((income) => {
        const entry = perIncome.get(income.id)!;
        const creditUsed = Math.max(
            0,
            Math.min(pool, entry.share - entry.covered),
        );
        pool -= creditUsed;
        entry.creditUsed = creditUsed;
        entry.covered += creditUsed;
    });
    // Money taken back out of the fund (pool below 0) un-pays incomes that
    // were paid for directly, newest first, so badges add up to `remaining`
    for (const income of [...incomes].reverse()) {
        if (pool >= 0) break;
        const entry = perIncome.get(income.id)!;
        const clawed = Math.min(-pool, entry.paidForThis);
        entry.paidForThis -= clawed;
        entry.covered -= clawed;
        pool += clawed;
    }
    perIncome.forEach((entry, id) =>
        perIncome.set(id, {
            share: roundMoney(entry.share),
            covered: roundMoney(entry.covered),
            status: statusOf(entry.share, entry.covered),
            workCosts: roundMoney(entry.workCosts),
            paidForThis: roundMoney(entry.paidForThis),
            creditUsed: roundMoney(entry.creditUsed),
        }),
    );

    // Monthly: owed + carried − paid adds up to the change in remaining
    const months = new Map<
        string,
        { earnings: number; workCosts: number; paid: number }
    >();
    const monthRow = (date: string) => {
        const key = monthOf(date);
        const row = months.get(key) ?? { earnings: 0, workCosts: 0, paid: 0 };
        months.set(key, row);
        return row;
    };
    incomes.forEach((income) => (monthRow(incomeDate(income)).earnings += income.amount));
    costs.forEach((cost) => (monthRow(cost.date).workCosts += cost.amount));
    payments.forEach((payment) => (monthRow(payment.date).paid += payment.amount));

    const keys = Array.from(months.keys()).sort();
    const startMonth = monthOf(settings.startDate);
    const monthly: CharityMonth[] = [];
    // An opening balance alone still gets its start-month row
    if (keys.length > 0 || opening !== 0) {
        let cumulativeBase = 0;
        let balance = opening;
        const lastMonth = keys.length > 0 ? keys[keys.length - 1] : startMonth;
        monthsBetween(startMonth, lastMonth).forEach((key) => {
            const row = months.get(key) ?? { earnings: 0, workCosts: 0, paid: 0 };
            const before = rate * Math.max(0, cumulativeBase);
            cumulativeBase += row.earnings - row.workCosts;
            const after = rate * Math.max(0, cumulativeBase);
            const owed = rate * (row.earnings - row.workCosts);
            const carried = after - before - owed;
            const monthOpening = balance;
            balance += owed + carried - row.paid;
            monthly.push({
                month: key,
                opening: roundMoney(monthOpening),
                earnings: roundMoney(row.earnings),
                workCosts: roundMoney(row.workCosts),
                owed: roundMoney(owed),
                carried: roundMoney(carried),
                paid: roundMoney(row.paid),
                balance: roundMoney(balance),
            });
        });
    }

    const owed = accrued + Math.max(0, opening);
    const paid = totalPayments + Math.max(0, -opening);
    return {
        netEarnings: roundMoney(netEarnings),
        owed: roundMoney(owed),
        paid: roundMoney(paid),
        remaining: roundMoney(owed - paid),
        carried: roundMoney(rate * Math.max(0, -netEarnings)),
        opening,
        monthly,
        perIncome,
    };
};

export interface CharityPreview {
    /** Work costs applied to this income (base amount) */
    workCosts: number;
    /** rate × (amount − work costs) */
    share: number;
    /** Earlier payments / credit covering this income */
    creditUsed: number;
    /** Already paid for this income itself ("Already paid", "Pay now") */
    paidForThis: number;
    /** What's left to pay for this income */
    toPay: number;
}

/**
 * The add-income charity step (B2): what this income would owe given every
 * other record. Null when the draft owes nothing (charity off, not eligible,
 * not received, or dated before the start).
 */
export const previewIncomeCharity = (
    data: CharitySource,
    settings: CharitySettings,
    draft: Income,
): CharityPreview | null => {
    if (!settings.enabled || !isCharityEligibleIncome(draft, settings)) {
        return null;
    }
    const ledger = computeCharityLedger(
        {
            ...data,
            incomes: [
                ...data.incomes.filter((income) => income.id !== draft.id),
                draft,
            ],
        },
        settings,
    );
    const entry = ledger.perIncome.get(draft.id);
    if (!entry) return null;
    return {
        workCosts: entry.workCosts,
        share: entry.share,
        creditUsed: entry.creditUsed,
        paidForThis: entry.paidForThis,
        toPay: roundMoney(Math.max(0, entry.share - entry.covered)),
    };
};

/** Whether a transfer into or out of the charity fund exists (locks fundId) */
export const charityFundHasPayments = (
    data: Pick<FinanceData, "transfers">,
    fundId: string,
): boolean =>
    data.transfers.some(
        (transfer) =>
            fundOf(transfer.fromFundId) !== fundOf(transfer.toFundId) &&
            (fundOf(transfer.fromFundId) === fundId ||
                fundOf(transfer.toFundId) === fundId),
    );

const DAY_MS = 24 * 60 * 60 * 1000;
const withinAWeek = (a: string, b: string) =>
    Math.abs(new Date(day(a)).getTime() - new Date(day(b)).getTime()) <
    7 * DAY_MS;

/**
 * Double-count hint: an "Already paid" income and a donation (from a non-charity
 * fund) within a week of each other may be the same money logged twice.
 */
export const hasDonationNear = (
    data: Pick<FinanceData, "expenses">,
    settings: CharitySettings,
    date: string,
    excludeExpenseId?: string,
): boolean =>
    data.expenses.some(
        (expense) =>
            expense.id !== excludeExpenseId &&
            isDonationExpense(expense, settings) &&
            !isFromCharityFund(expense, settings) &&
            withinAWeek(expense.date, date),
    );

export const hasPaidOutsideNear = (
    data: Pick<FinanceData, "incomes">,
    date: string,
    excludeIncomeId?: string,
): boolean =>
    data.incomes.some(
        (income) =>
            income.id !== excludeIncomeId &&
            (income.charityPaidOutsideAmount ?? 0) > 0 &&
            withinAWeek(incomeDate(income), date),
    );

// Matched by name: category ids are random per install
const ELIGIBLE_INCOME_NAMES = [
    "salary",
    "freelance",
    "business",
    "bonus",
    "commission",
    "investment",
];
const DONATION_NAMES = ["donations", "donation"];

const byName = (names: string[]) => (category: { name: string }) =>
    names.includes(category.name.trim().toLowerCase());

/** The Refund income category, created (with its fixed id) when missing */
export const withRefundCategory = (
    data: Pick<FinanceData, "incomeCategories">,
    now: string = new Date().toISOString(),
): { incomeCategories: FinanceData["incomeCategories"]; refundId: string } => {
    const existing =
        data.incomeCategories.find((c) => c.id === REFUND_INCOME_CATEGORY_ID) ??
        data.incomeCategories.find(byName(["refund", "refunds"]));
    if (existing) {
        return { incomeCategories: data.incomeCategories, refundId: existing.id };
    }
    return {
        incomeCategories: [
            ...data.incomeCategories,
            getRefundIncomeCategory(now, nextOrder(data.incomeCategories)),
        ],
        refundId: REFUND_INCOME_CATEGORY_ID,
    };
};

/**
 * Turns charity tracking on: creates the Charity fund (fixed id, not focused),
 * a Donations expense category and a Refund income category when missing, and
 * pre-selects eligible/donation categories by name if none are chosen yet.
 * Idempotent — enabling twice never duplicates anything.
 */
export const enableCharityTracking = (
    data: FinanceData,
    now: string = new Date().toISOString(),
): FinanceData => {
    const charity = data.settings.charity;
    // A charity fund made by hand before tracking existed is adopted, not
    // duplicated: its money already counts as God's
    const adopted =
        data.funds.find((fund) => fund.id === charity.fundId) ??
        data.funds.find(
            (fund) =>
                fund.kind === "charity" ||
                fund.name.trim().toLowerCase() === "charity",
        );
    const fundId = adopted?.id ?? FUND_CHARITY_ID;
    const funds = adopted
        ? data.funds.map((fund) =>
              fund.id === adopted.id &&
              (fund.kind !== "charity" || !fund.isVisible)
                  ? {
                        ...fund,
                        kind: "charity" as const,
                        isVisible: true,
                        updatedAt: now,
                    }
                  : fund,
          )
        : [...data.funds, getDefaultCharityFund(now, nextOrder(data.funds))];

    const donations =
        data.categories.find((c) => c.id === DONATIONS_CATEGORY_ID) ??
        data.categories.find(byName(DONATION_NAMES));
    const categories = donations
        ? data.categories
        : [
              ...data.categories,
              getDonationsCategory(now, nextOrder(data.categories)),
          ];
    const donationsId = donations?.id ?? DONATIONS_CATEGORY_ID;

    const { incomeCategories } = withRefundCategory(data, now);

    return {
        ...data,
        funds,
        categories,
        incomeCategories,
        settings: {
            ...data.settings,
            charity: {
                ...charity,
                enabled: true,
                fundId,
                eligibleIncomeCategoryIds:
                    charity.eligibleIncomeCategoryIds.length > 0
                        ? charity.eligibleIncomeCategoryIds
                        : incomeCategories
                              .filter(byName(ELIGIBLE_INCOME_NAMES))
                              .map((c) => c.id),
                donationCategoryIds:
                    charity.donationCategoryIds.length > 0
                        ? charity.donationCategoryIds
                        : [donationsId],
            },
        },
    };
};
