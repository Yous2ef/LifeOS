import type { LoanDirection } from "@/types/modules/finance";
import type { LoanStatus } from "@/utils/finance/loans";

export const LOAN_HINT = "Loans never count as income or expense.";

/** "−610" / "+3,000" — the sign says who owes whom */
export const signedAmount = (
    net: number,
    formatAmount: (amount: number) => string,
) => `${net < 0 ? "−" : net > 0 ? "+" : ""}${formatAmount(Math.abs(net))}`;

/** "You owe 610" / "Owes you 3,000" / "Settled" */
export const balanceLabel = (
    net: number,
    formatAmount: (amount: number) => string,
) =>
    net < 0
        ? `You owe ${formatAmount(-net)}`
        : net > 0
          ? `Owes you ${formatAmount(net)}`
          : "Settled";

export const netColor = (net: number) =>
    net < 0
        ? "text-red-500"
        : net > 0
          ? "text-emerald-500"
          : "text-muted-foreground";

export const DIRECTION_LABELS: Record<LoanDirection, string> = {
    borrowed: "You borrowed",
    lent: "You lent",
};

export const STATUS_LABELS: Record<LoanStatus, string> = {
    open: "Open",
    partial: "Partly repaid",
    settled: "Settled",
};

/** " and its 2 repayments" — appended to "Delete this loan…?" */
export const withRepaymentsText = (count: number) =>
    count > 0 ? ` and its ${count} repayment${count === 1 ? "" : "s"}` : "";

export const loanCountLabel = (count: number) =>
    `${count} loan${count === 1 ? "" : "s"}`;
