import type { CharityIncomeShare } from "@/utils/finance/charity";

type Format = (amount: number) => string;

/** "20%" from a 0.2 rate */
export const ratePercent = (rate: number) =>
    `${Math.round(rate * 1000) / 10}%`;

/** "Charity: 1,500 of 2,000 paid · 500 left" (or "· 300 credit") */
export const stripText = (
    paid: number,
    owed: number,
    remaining: number,
    formatAmount: Format,
) => {
    const tail =
        remaining > 0
            ? `${formatAmount(remaining)} left`
            : remaining < 0
              ? `${formatAmount(-remaining)} credit`
              : "all paid";
    return `Charity: ${formatAmount(Math.max(0, paid))} of ${formatAmount(owed)} paid · ${tail}`;
};

/** Feed badge: "Charity paid" · "Partly paid 500/1,000" · "Not paid 3,500" */
export const badgeText = (entry: CharityIncomeShare, formatAmount: Format) => {
    if (entry.status === "paid") return "Charity paid";
    if (entry.status === "partial") {
        return `Partly paid ${formatAmount(entry.covered)}/${formatAmount(entry.share)}`;
    }
    return `Not paid ${formatAmount(entry.share - entry.covered)}`;
};

export const payNowLabel = (amount: number, formatAmount: Format) =>
    `Pay ${formatAmount(amount)} now`;

export const COPY = {
    pay: "Pay",
    shareOfNet: (rate: number) => `Charity ${ratePercent(rate)} of net`,
    workCostsOnProject: "Work costs on this project",
    workCosts: "Work costs",
    creditUsed: "Credit used",
    alreadyPaid: "Already paid",
    later: "Later",
    coveredByCredit: "Covered by earlier payments.",
    doubleCountHint: "This may already be counted as paid",
    workCost: "Work cost",
    workCostHelper: "Lowers the charity you owe",
    ledgerNet: "Net earnings",
    ledgerOwed: (rate: number) => `Owed (${ratePercent(rate)})`,
    ledgerPaid: "Paid",
    ledgerRemaining: "Remaining",
    ledgerCredit: "Credit",
    transferNote: "Charity",
    paymentRemovedWithIncome: "Its charity payment will be removed too.",
    edit: "Edit",
    addExtra: "+ Extra charity",
    extraTitle: "Extra charity",
    editExtraTitle: "Edit extra charity",
    extraHint: "Adds to what you owe. Pay it whenever you like.",
    extraSave: "Save",
    extraAdd: "Add",
    delete: "Delete",
    extraDeleteConfirm: "Delete this extra charity?",
    extraDeleted: "Extra charity deleted",
    extraIncluded: (amount: string) => `incl. ${amount} extra`,
    ledgerPledged: "Extra",
    pledgeStatus: {
        paid: "Paid",
        partial: "Partly paid",
        unpaid: "Not paid",
    },
};
