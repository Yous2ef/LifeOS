import type {
    FinanceData,
    Loan,
    LoanDirection,
    LoanPayment,
    Transaction,
} from "@/types/modules/finance";
import { day, fundOf, isOnOrBefore } from "./balances";

export type LoanStatus = "open" | "partial" | "settled";

export type LoanSource = Pick<FinanceData, "loans" | "loanPayments">;

export interface LoanSummary {
    paid: number;
    outstanding: number;
    status: LoanStatus;
}

export interface PersonSummary {
    /** Positive = owes you, negative = you owe */
    net: number;
    receivable: number;
    payable: number;
    loanCount: number;
    openCount: number;
}

export interface LoanTotals {
    /** Owed to you */
    receivable: number;
    /** You owe */
    payable: number;
}

export type SettleTarget = { loanId: string } | { personId: string };

export interface SettlementAllocation {
    loanId: string;
    amount: number;
    isOffset?: boolean;
}

// Amounts are entered with at most two decimals; rounding keeps sums like
// 0.1 + 0.2 from leaving a loan "partly" open by a float error.
export const roundMoney = (amount: number): number =>
    Math.round(amount * 100) / 100;

const byDate = <T extends { date: string; createdAt: string }>(a: T, b: T) =>
    a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt);

export const paymentsByLoan = (
    payments: LoanPayment[],
): Map<string, LoanPayment[]> => {
    const map = new Map<string, LoanPayment[]>();
    payments.forEach((payment) => {
        const list = map.get(payment.loanId) ?? [];
        list.push(payment);
        map.set(payment.loanId, list);
    });
    return map;
};

const totalPaid = (payments: LoanPayment[]): number =>
    roundMoney(payments.reduce((total, payment) => total + payment.amount, 0));

/** Paid, outstanding (never below 0) and status of one loan */
export const summarizeLoan = (
    loan: Loan,
    payments: LoanPayment[] = [],
): LoanSummary => {
    const paid = totalPaid(payments);
    const outstanding = Math.max(0, roundMoney(loan.amount - paid));
    const status: LoanStatus =
        outstanding === 0 ? "settled" : paid > 0 ? "partial" : "open";
    return { paid, outstanding, status };
};

const EARLY_REPAYMENT_ERROR = "A repayment can't be dated before the loan.";

/** Why a repayment can't be recorded, or null when it can */
export const getLoanPaymentError = (
    loan: Loan | undefined,
    payments: LoanPayment[],
    amount: number,
    date?: string,
): string | null => {
    if (!loan) return "This loan no longer exists.";
    if (!(amount > 0)) return "Enter an amount above 0.";
    if (date && day(date) < day(loan.date)) return EARLY_REPAYMENT_ERROR;
    const { outstanding } = summarizeLoan(loan, payments);
    if (roundMoney(amount) > outstanding) {
        return "That's more than what's left on this loan.";
    }
    return null;
};

/** A loan's amount can't drop below what was already repaid */
export const getLoanAmountError = (
    amount: number,
    payments: LoanPayment[],
): string | null => {
    if (!(amount > 0)) return "Enter an amount above 0.";
    return roundMoney(amount) < totalPaid(payments)
        ? "The amount can't be less than what's already repaid."
        : null;
};

/** +outstanding when they owe you (lent), −outstanding when you owe (borrowed) */
const signedOutstanding = (direction: LoanDirection, outstanding: number) =>
    direction === "lent" ? outstanding : -outstanding;

export const summarizePeople = (
    data: LoanSource,
): Map<string, PersonSummary> => {
    const payments = paymentsByLoan(data.loanPayments);
    const people = new Map<string, PersonSummary>();
    data.loans.forEach((loan) => {
        const summary = people.get(loan.personId) ?? {
            net: 0,
            receivable: 0,
            payable: 0,
            loanCount: 0,
            openCount: 0,
        };
        const { outstanding } = summarizeLoan(loan, payments.get(loan.id));
        summary.loanCount += 1;
        if (outstanding > 0) summary.openCount += 1;
        if (loan.direction === "lent") summary.receivable += outstanding;
        else summary.payable += outstanding;
        summary.net = roundMoney(
            summary.net + signedOutstanding(loan.direction, outstanding),
        );
        people.set(loan.personId, summary);
    });
    return people;
};

/**
 * Owed to you and you owe, for loans held in `fundIds` (empty = all funds).
 * Filtering by fund keeps a focused fund's book whole: borrowing into Me
 * raises Me's balance and Me's debt by the same amount. With
 * `activeAccountIds`, loans held in archived accounts are left out, as their
 * balances are (sumActiveAccounts).
 */
export const loanTotals = (
    data: LoanSource,
    {
        fundIds = [],
        activeAccountIds,
        asOf,
    }: { fundIds?: string[]; activeAccountIds?: string[]; asOf?: string } = {},
): LoanTotals => {
    const active = activeAccountIds && new Set(activeAccountIds);
    const counts = (loan: Loan) =>
        (fundIds.length === 0 || fundIds.includes(fundOf(loan.fundId))) &&
        (!active || active.has(loan.accountId)) &&
        isOnOrBefore(loan.date, asOf);
    const payments = paymentsByLoan(
        data.loanPayments.filter((payment) => isOnOrBefore(payment.date, asOf)),
    );
    let receivable = 0;
    let payable = 0;
    data.loans.forEach((loan) => {
        if (!counts(loan)) return;
        const { outstanding } = summarizeLoan(loan, payments.get(loan.id));
        if (loan.direction === "lent") receivable += outstanding;
        else payable += outstanding;
    });
    return { receivable: roundMoney(receivable), payable: roundMoney(payable) };
};

/** Net worth (D11): balances + owed to you − you owe */
export const netWorthWithLoans = (balance: number, totals: LoanTotals) =>
    roundMoney(balance + totals.receivable - totals.payable);

/**
 * What a "Settle up" pays down — open loans, oldest first — and how much is
 * left to settle. For a person that is the side of their net balance (you owe →
 * your borrowed loans), capped at the net: the other side offsets the rest
 * (lent 1,000 + borrowed 400 → they owe you 600).
 */
export const settlementFor = (
    data: LoanSource,
    target: SettleTarget,
): { loans: Loan[]; remaining: number } => {
    const payments = paymentsByLoan(data.loanPayments);
    const outstanding = (loan: Loan) =>
        summarizeLoan(loan, payments.get(loan.id)).outstanding;

    if ("loanId" in target) {
        const loans = data.loans.filter(
            (loan) => loan.id === target.loanId && outstanding(loan) > 0,
        );
        return { loans, remaining: loans[0] ? outstanding(loans[0]) : 0 };
    }

    const net = summarizePeople(data).get(target.personId)?.net ?? 0;
    if (net === 0) return { loans: [], remaining: 0 };
    const direction: LoanDirection = net > 0 ? "lent" : "borrowed";
    const loans = data.loans
        .filter(
            (loan) =>
                loan.personId === target.personId &&
                loan.direction === direction &&
                outstanding(loan) > 0,
        )
        .sort(byDate);
    return { loans, remaining: Math.abs(net) };
};

/**
 * Splits a settle-up amount over the target's loans, oldest first. Partial is
 * fine; more than what's left, or a date before a loan it pays, isn't.
 *
 * Paying a person's whole net also closes every loan on both sides: the other
 * side's open loans and the rest of the net side are cancelled against each
 * other with offset allocations (equal totals, no money moves).
 */
export const allocateSettlement = (
    data: LoanSource,
    target: SettleTarget,
    amount: number,
    date?: string,
): { allocations: SettlementAllocation[]; error: string | null } => {
    const fail = (error: string) => ({ allocations: [], error });
    const { loans, remaining } = settlementFor(data, target);
    if (loans.length === 0) return fail("Nothing left to settle.");
    if (!(amount > 0)) return fail("Enter an amount above 0.");
    if (roundMoney(amount) > remaining) {
        return fail("That's more than what's left to settle.");
    }

    const payments = paymentsByLoan(data.loanPayments);
    const outstanding = (loan: Loan) =>
        summarizeLoan(loan, payments.get(loan.id)).outstanding;
    const isFullNet = "personId" in target && roundMoney(amount) === remaining;
    const opposite = isFullNet
        ? data.loans
              .filter(
                  (loan) =>
                      loan.personId === target.personId &&
                      loan.direction !== loans[0].direction &&
                      outstanding(loan) > 0,
              )
              .sort(byDate)
        : [];

    const allocations: SettlementAllocation[] = [];
    let left = roundMoney(amount);
    for (const loan of [...loans, ...opposite]) {
        const isNetSide = loan.direction === loans[0].direction;
        if (isNetSide && left <= 0 && !isFullNet) break;
        if (date && day(date) < day(loan.date)) {
            return fail(EARLY_REPAYMENT_ERROR);
        }
        const open = outstanding(loan);
        const cash = isNetSide ? Math.min(open, left) : 0;
        if (cash > 0) allocations.push({ loanId: loan.id, amount: cash });
        left = roundMoney(left - cash);
        const offset = isFullNet ? roundMoney(open - cash) : 0;
        if (offset > 0) {
            allocations.push({ loanId: loan.id, amount: offset, isOffset: true });
        }
    }
    return { allocations, error: null };
};

export const getPersonDeleteBlocker = (
    data: Pick<FinanceData, "loans">,
    personId: string,
): string | null =>
    data.loans.some((loan) => loan.personId === personId)
        ? "Delete this person's loans first."
        : null;

// Loans have their own colour in the feed (violet), apart from income/expense
const LOAN_COLOR = "#8b5cf6";

/** Feed rows for loans and repayments (payments of a missing loan are skipped) */
export const loanTransactions = (
    data: LoanSource & Pick<FinanceData, "people">,
): Transaction[] => {
    const nameOf = (personId: string) =>
        data.people.find((person) => person.id === personId)?.name ||
        "Someone";
    const loanById = new Map(data.loans.map((loan) => [loan.id, loan]));

    const loanRows: Transaction[] = data.loans.map((loan) => {
        const name = nameOf(loan.personId);
        return {
            id: loan.id,
            type: "loan",
            title:
                loan.direction === "borrowed"
                    ? `Borrowed from ${name}`
                    : `Lent to ${name}`,
            amount: loan.amount,
            date: day(loan.date),
            accountId: loan.accountId,
            category: "Loan",
            categoryColor: LOAN_COLOR,
            notes: loan.notes,
            loan: {
                kind: "loan",
                direction: loan.direction,
                loanId: loan.id,
                personId: loan.personId,
            },
        };
    });

    const paymentRows: Transaction[] = [];
    data.loanPayments.forEach((payment) => {
        const loan = loanById.get(payment.loanId);
        if (!loan || payment.isOffset) return; // offsets move no money
        const name = nameOf(loan.personId);
        paymentRows.push({
            id: payment.id,
            type: "loan",
            title:
                loan.direction === "borrowed"
                    ? `Repaid ${name}`
                    : `${name} repaid you`,
            amount: payment.amount,
            date: day(payment.date),
            accountId: payment.accountId,
            category: "Repayment",
            categoryColor: LOAN_COLOR,
            notes: payment.notes,
            loan: {
                kind: "repayment",
                direction: loan.direction,
                loanId: loan.id,
                personId: loan.personId,
            },
        });
    });

    return [...loanRows, ...paymentRows];
};
