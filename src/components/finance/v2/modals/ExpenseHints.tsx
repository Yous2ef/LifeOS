import type { Account, Fund } from "@/types/modules/finance";
import { fundOf } from "@/utils/finance/balances";
import {
    fundBalanceAfterExpense,
    isDonationDoubleCount,
    type DonationContext,
    type ExpenseDraft,
} from "@/utils/finance/expenseHints";
import { FundBalanceWarning } from "../controls/FundPicker";
import { COPY as CHARITY_COPY } from "../charity/copy";

interface ExpenseFundWarningProps {
    draft: ExpenseDraft;
    /** The saved expense when editing */
    saved?: Partial<ExpenseDraft>;
    accounts: Account[];
    funds: Fund[];
    getFundBalance?: (accountId: string, fundId: string) => number;
    formatCurrency?: (amount: number) => string;
}

/** Warns (never blocks) when the expense would overdraw its fund there */
export const ExpenseFundWarning = ({
    draft,
    saved,
    accounts,
    funds,
    getFundBalance,
    formatCurrency,
}: ExpenseFundWarningProps) => {
    const account = accounts.find((a) => a.id === draft.accountId);
    if (!getFundBalance || !formatCurrency || !account || draft.amount <= 0) {
        return null;
    }
    const fund = funds.find((f) => f.id === fundOf(draft.fundId));
    return (
        <FundBalanceWarning
            balanceAfter={fundBalanceAfterExpense(draft, getFundBalance, saved)}
            fundName={fund?.name ?? "Me"}
            accountName={account.name}
            formatCurrency={formatCurrency}
        />
    );
};

interface DonationDoubleCountHintProps extends DonationContext {
    draft: ExpenseDraft;
    className?: string;
}

/** "This may already be counted as paid" */
export const DonationDoubleCountHint = ({
    draft,
    className,
    ...context
}: DonationDoubleCountHintProps) =>
    isDonationDoubleCount(draft, context) ? (
        <p className={className ?? "text-xs text-amber-500"}>
            {CHARITY_COPY.doubleCountHint}
        </p>
    ) : null;
