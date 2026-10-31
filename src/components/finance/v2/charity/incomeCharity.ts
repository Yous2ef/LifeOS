import { FUND_ME_ID, type Income } from "@/types/modules/finance";
import { fundOf } from "@/utils/finance/balances";
import { roundMoney } from "@/utils/finance/loans";
import type { IncomeFormData } from "../modals/IncomeModal";
import type { CharityChoice } from "./CharityStep";

const DRAFT_ID = "draft_income";

/**
 * The income as it would be saved, for the charity preview. Editing keeps the
 * saved record's id (so it replaces itself), date stamps and "Already paid".
 */
export const toDraftIncome = (
    form: IncomeFormData,
    editing: Income | null,
): Income => {
    const now = new Date().toISOString();
    return {
        ...editing,
        ...form,
        id: editing?.id ?? DRAFT_ID,
        actualDate: form.status === "received" ? form.actualDate : undefined,
        charityPaidOutsideAmount: editing?.charityPaidOutsideAmount,
        createdAt: editing?.createdAt ?? now,
        updatedAt: now,
    };
};

/** "Already paid" adds the shown amount to what this income already had */
export const paidOutsideAfter = (
    choice: CharityChoice | null,
    editing: Income | null,
): number | undefined =>
    choice?.action === "already-paid"
        ? roundMoney((editing?.charityPaidOutsideAmount ?? 0) + choice.amount)
        : editing?.charityPaidOutsideAmount;

/**
 * "Pay now" moves the share out of the fund the income landed in (Me unless
 * chosen otherwise) into the Charity fund, in the same account.
 */
export const payNowFromFund = (
    incomeFundId: string | undefined,
    charityFundId: string,
): string =>
    fundOf(incomeFundId) === charityFundId ? FUND_ME_ID : fundOf(incomeFundId);
